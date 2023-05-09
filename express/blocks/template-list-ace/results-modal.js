/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { createTag } from '../../scripts/scripts.js';
import {
  requestGeneration,
  postFeedback,
  monitorGeneration,
  MONITOR_STATUS,
  FEEDBACK_CATEGORIES,
} from './ace-api.js';
import useProgressManager from './progress-manager.js';
import { openReportModal } from './report-modal.js';
import BlockMediator from '../../scripts/block-mediator.js';
import { createDropdown } from './template-list-ace.js';

const NUM_PLACEHOLDERS = 4;
const MONITOR_INTERVAL = 2000;
const AVG_GENERATION_TIME = 20000;
const PROGRESS_ANIMATION_DURATION = 1000;
const PROGRESS_BAR_LINGER_DURATION = 500;
const REQUEST_GENERATION_RETRIES = 3;

function getVoteHandler(id, category) {
  return async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { result: feedbackRes, error } = await postFeedback(
        id,
        category,
        'Rate this result: thumbs_down',
      );
      if (error) throw new Error(error);
      alert(feedbackRes);
    } catch (err) {
      console.error(err);
    }
  };
}

export function createRateResultButton(result) {
  const wrapper = createTag('div', { class: 'feedback-rate' });
  wrapper.append('Rate this result');
  const downvoteLink = createTag('button', { class: 'feedback-rate-button' });
  const upvoteLink = createTag('button', { class: 'feedback-rate-button' });
  downvoteLink.append('👎');
  upvoteLink.append('👍');
  downvoteLink.addEventListener(
    'click',
    getVoteHandler(result.id, FEEDBACK_CATEGORIES.THUMBS_DOWN),
  );
  upvoteLink.addEventListener('click', getVoteHandler(result.id, FEEDBACK_CATEGORIES.THUMBS_UP));
  wrapper.append(downvoteLink);
  wrapper.append(upvoteLink);
  return wrapper;
}

export function createReportButton(result) {
  const wrapper = createTag('div', { class: 'feedback-report' });
  wrapper.append('Report');
  const reportButton = createTag('button', { class: 'feedback-report-button' });
  reportButton.append('🚩');
  wrapper.append(reportButton);
  wrapper.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await openReportModal(result);
  });
  return wrapper;
}

function getTemplateBranchUrl(result) {
  const { thumbnail } = result;
  return `https://prod-search.creativecloud.adobe.com/express?express=true&protocol=https&imageHref=${thumbnail}`;
}

function createTemplate(result) {
  const { thumbnail } = result;
  const templateBranchUrl = getTemplateBranchUrl(result);
  const templateWrapper = createTag('div', { class: 'generated-template-wrapper' });
  templateWrapper.addEventListener('click', () => {
    window.open(templateBranchUrl, '_blank').focus();
    // window.location.href = templateBranchUrl;
  });
  const hoverContainer = createTag('div', { class: 'hover-container' });
  const feedbackRow = createTag('div', { class: 'feedback-row' });
  feedbackRow.append(createRateResultButton(result));
  feedbackRow.append(createReportButton(result));
  hoverContainer.append(feedbackRow);

  templateWrapper.append(createTag('img', { src: thumbnail, class: 'generated-template-image' }));
  templateWrapper.append(hoverContainer);
  return templateWrapper;
}

async function waitForGeneration(jobId) {
  const { fetchingState } = BlockMediator.get('ace-state');
  const { progressManager } = fetchingState;

  clearInterval(fetchingState.intervalId);
  let tries = Math.floor((60000 * 2) / MONITOR_INTERVAL); // 2 minutes max wait
  return new Promise((resolve, reject) => {
    fetchingState.intervalId = setInterval(async () => {
      if (tries <= 0) {
        clearInterval(fetchingState.intervalId);
        reject(new Error('timed out'));
      }
      tries -= 1;
      let res = null;
      try {
        res = await monitorGeneration(jobId);
      } catch (err) {
        // ignore and keep trying
      }
      const { status, results, reason } = res || {};
      if (!status) {
        progressManager.update(0);
      } else if (!status || status === MONITOR_STATUS.IN_PROGRESS) {
        progressManager.update(Math.floor(results.length / NUM_PLACEHOLDERS) * 100);
      } else if (status === MONITOR_STATUS.COMPLETED) {
        progressManager.update(100);
        clearInterval(fetchingState.intervalId);
        setTimeout(() => {
          resolve(results);
        }, PROGRESS_ANIMATION_DURATION + PROGRESS_BAR_LINGER_DURATION);
      } else if (status === MONITOR_STATUS.FAILED || reason) {
        clearInterval(fetchingState.intervalId);
        reject(new Error(JSON.stringify({ status, reason })));
      } else {
        clearInterval(fetchingState.intervalId);
        reject(new Error(JSON.stringify({ status, results, reason: 'unexpected status' })));
      }
    }, MONITOR_INTERVAL);
  });
}

export function renderLoader(modalContent) {
  if (modalContent !== BlockMediator.get('ace-state').modalContent) {
    return;
  }
  const wrapper = createTag('div', { class: 'loader-wrapper' });
  const textRow = createTag('div', { class: 'loader-text-row' });
  const text = createTag('span', { class: 'loader-text' });
  text.textContent = 'Loading results…';
  const percentage = createTag('span', { class: 'loader-percentage' });
  percentage.textContent = '0%';
  textRow.append(text);
  textRow.append(percentage);
  wrapper.append(textRow);

  const progressBar = createTag('div', { class: 'loader-progress-bar' });
  progressBar.append(createTag('div'));
  wrapper.append(progressBar);

  const placeholderRow = createTag('div', { class: 'loader-placeholder-row' });
  for (let i = 0; i < NUM_PLACEHOLDERS; i += 1) {
    placeholderRow.append(createTag('div', { class: 'loader-placeholder' }));
  }
  wrapper.append(placeholderRow);

  modalContent.append(wrapper);
}

function updateSearchable(modalContent, searchable) {
  if (modalContent !== BlockMediator.get('ace-state').modalContent) {
    return;
  }
  const searchButton = modalContent.querySelector('.search-form .search-button');
  const searchBarInput = modalContent.querySelector('.search-form input.search-bar');
  if (!searchButton || !searchBarInput) return;
  searchButton.disabled = !searchable;
  searchBarInput.disabled = !searchable;
}

function createErrorDisplay() {
  const errorDisplay = createTag('h2', { class: 'error-display' });
  errorDisplay.textContent = 'Oops! Something could be momentarily wrong with our servers or the VPN connections.';
  errorDisplay.append(createTag('br'));
  errorDisplay.append('Please try again or come back later while we work on the fix. We appreciate your patience.');
  return errorDisplay;
}

function retry(maxRetries, fn, delay = 2000) {
  return fn().catch((err) => {
    if (maxRetries <= 0) {
      throw err;
    }
    return new Promise((resolve) => setTimeout(resolve, delay))
      .then(() => retry(maxRetries - 1, fn, delay));
  });
}

export async function fetchResults(modalContent, repeating = false) {
  const {
    query,
    dropdownValue,
    fetchingState,
    placeholders,
  } = BlockMediator.get('ace-state');
  if (!fetchingState.progressManager) {
    const updateProgressBar = (percentage) => {
      const percentageEl = modalContent.querySelector('.loader-percentage');
      const progressBar = modalContent.querySelector('.loader-progress-bar div');
      if (!percentageEl || !progressBar) return;
      percentageEl.textContent = `${percentage}%`;
      progressBar.style.width = `${percentage}%`;
    };
    fetchingState.progressManager = useProgressManager(
      updateProgressBar,
      PROGRESS_ANIMATION_DURATION,
      {
        avgCallingTimes: AVG_GENERATION_TIME / MONITOR_INTERVAL,
        sample: 3,
      },
    );
  }

  updateSearchable(modalContent, false);

  const oldLoader = modalContent.querySelector('.loader-wrapper');
  if (oldLoader) {
    fetchingState.progressManager.reset();
    oldLoader.style.display = 'block';
  } else {
    renderLoader(modalContent);
  }
  const oldResults = modalContent.querySelector('.generated-results-wrapper');
  if (oldResults) {
    oldResults.remove();
  }
  const errorDisplay = modalContent.querySelector('.error-display');
  if (errorDisplay) {
    errorDisplay.remove();
  }

  const requestConfig = {
    query,
    num_results: NUM_PLACEHOLDERS,
    locale: 'en-us',
    category: 'poster',
    subcategory: (dropdownValue
        && dropdownValue.trim() !== placeholders['template-list-ace-categories-dropdown']?.split(',')?.[0].trim())
      ? dropdownValue.trim()
      : null,
    force: false,
    fetchExisting: false,
  };
  if (repeating) {
    requestConfig.force = true;
  }

  try {
    let jobId;
    await retry(REQUEST_GENERATION_RETRIES, async () => {
      const generationRes = await requestGeneration(requestConfig);
      const { status, jobId: generatedJobId } = generationRes;
      if (![MONITOR_STATUS.COMPLETED, MONITOR_STATUS.IN_PROGRESS].includes(status)) {
        throw new Error(`Error requesting generation: ${generatedJobId} ${status}`);
      }
      jobId = generatedJobId;
    }, 2500);
    if (modalContent !== BlockMediator.get('ace-state').modalContent) {
      return;
    }
    // first 6-12% as the time for triggering generation
    fetchingState.progressManager.update(Math.random() * 6 + 6);
    fetchingState.results = await waitForGeneration(jobId);
  } catch (e) {
    console.error(e);
    fetchingState.results = 'error';
  } finally {
    updateSearchable(modalContent, true);
  }
}

export function renderResults(modalContent) {
  const { fetchingState: { results }, modalContent: currModal } = BlockMediator.get('ace-state');
  if (modalContent !== currModal) {
    return;
  }
  // if (oldModalSet.has(modalContent)) {
  //   console.log('this is old, abort!');
  //   return;
  // }
  const oldLoader = modalContent.querySelector('.loader-wrapper');
  if (oldLoader) {
    oldLoader.style.display = 'none';
  }

  if (!results || results === 'error') {
    if (!modalContent.querySelector('.error-display')) {
      modalContent.append(createErrorDisplay());
    }
    return;
  }

  const generatedResultsWrapper = createTag('div', { class: 'generated-results-wrapper' });

  const generatedTitle = createTag('div', { class: 'generated-title' });
  generatedTitle.textContent = 'Here\'s results';
  const generatedRow = createTag('div', { class: 'generated-row' });
  results
    .filter((result) => result.generated)
    .map((result) => createTemplate(result))
    .forEach((image) => {
      generatedRow.append(image);
    });
  generatedResultsWrapper.append(generatedTitle);
  generatedResultsWrapper.append(generatedRow);
  modalContent.append(generatedResultsWrapper);
}

function createModalSearch(modalContent) {
  const aceState = BlockMediator.get('ace-state');
  const { placeholders, query } = aceState;
  const searchForm = createTag('form', { class: 'search-form' });
  const searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    enterKeyHint: placeholders.search ?? 'Search',
  });
  searchBar.value = query;
  searchForm.append(searchBar);

  const button = createTag('button', { class: 'search-button', title: placeholders['template-list-ace-button-refresh'] ?? 'Refresh results' });
  button.textContent = placeholders['template-list-ace-button-refresh'] ?? 'Refresh results';
  searchForm.append(button);
  let repeating = false;
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!searchBar.value) {
      alert('search should not be empty!');
      return;
    }
    if (searchBar.value === aceState.query) {
      repeating = true;
    } else {
      repeating = false;
    }
    aceState.query = searchBar.value;
    await fetchResults(modalContent, repeating);
    renderResults(modalContent);
  });

  return searchForm;
}
function createTitleRow(block) {
  const { placeholders, createTemplateLink } = BlockMediator.get('ace-state');
  const titleRow = createTag('div', { class: 'modal-title-row' });
  const title = createTag('h1');
  titleRow.appendChild(title);
  title.textContent = placeholders['template-list-ace-modal-title'];
  createDropdown(titleRow, placeholders, block);
  const scratchWrapper = createTag('div', { class: 'scratch-wrapper' });
  const noGuidanceSpan = createTag('span', { class: 'no-guidance' });
  noGuidanceSpan.textContent = placeholders['template-list-ace-no-guidance'] ?? 'Don\'t need guidance?';
  const fromScratchButton = createTag('a', {
    class: 'from-scratch-button secondary button',
    href: createTemplateLink,
    title: placeholders['edit-this-template'] ?? 'Create from scratch', // FIXME: add a placeholder for title?
  });
  fromScratchButton.textContent = placeholders['template-list-ace-from-scratch'] ?? 'Create from scratch';
  scratchWrapper.append(noGuidanceSpan);
  scratchWrapper.append(fromScratchButton);
  titleRow.append(scratchWrapper);
  //const line = createTag('hr');
  //titleRow.appendChild(line);
  return titleRow;
}

export function renderModalContent(modalContent, block) {
  modalContent.append(createTitleRow(block));
  modalContent.append(createModalSearch(modalContent));
}
