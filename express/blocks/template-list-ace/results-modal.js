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

import { createTag, getIconElement } from '../../scripts/scripts.js';
import {
  requestGeneration,
  postFeedback,
  monitorGeneration,
  MONITOR_STATUS,
  FEEDBACK_CATEGORIES,
} from './ace-api.js';
import useProgressManager from './progress-manager.js';
import { openFeedbackModal } from './feedback-modal.js';
import BlockMediator from '../../scripts/block-mediator.js';
import { createDropdown } from './template-list-ace.js';

const NUM_RESULTS = 4;
const RESULTS_ROTATION = 3;
const MONITOR_INTERVAL = 2000;
const AVG_GENERATION_TIME = 30000;
const PROGRESS_ANIMATION_DURATION = 1000;
const PROGRESS_BAR_LINGER_DURATION = 500;
const REQUEST_GENERATION_RETRIES = 3;

function getVoteHandler(result, category, feedbackState) {
  return async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { error } = await postFeedback(
        result.id,
        category,
        'Rate this result: thumbs_down',
      );
      if (error) throw new Error(error);
      feedbackState.category = category;
      feedbackState.showThankyou();
    } catch (err) {
      console.error(err);
    }
  };
}

export function createRateResultWrapper(result, feedbackState) {
  const wrapper = createTag('div', { class: 'feedback-rate' });
  wrapper.append('Rate this result');
  const downvoteLink = createTag('button', { class: 'feedback-rate-button' });
  const upvoteLink = createTag('button', { class: 'feedback-rate-button' });
  downvoteLink.append('👎');
  upvoteLink.append('👍');
  downvoteLink.addEventListener(
    'click',
    getVoteHandler(result, FEEDBACK_CATEGORIES.THUMBS_DOWN, feedbackState),
  );
  upvoteLink.addEventListener(
    'click',
    getVoteHandler(result, FEEDBACK_CATEGORIES.THUMBS_UP, feedbackState),
  );
  wrapper.append(downvoteLink);
  wrapper.append(upvoteLink);
  return wrapper;
}

export function createReportWrapper(result, feedbackState) {
  const wrapper = createTag('div', { class: 'feedback-report' });
  wrapper.append('Report');
  const reportButton = createTag('button', { class: 'feedback-report-button' });
  reportButton.append('🚩');
  wrapper.append(reportButton);
  reportButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    feedbackState.category = FEEDBACK_CATEGORIES.REPORT_ABUSE;
    await openFeedbackModal(result, feedbackState);
  });
  return wrapper;
}

function getTemplateBranchUrl(result) {
  const { thumbnail } = result;
  return `https://prod-search.creativecloud.adobe.com/express?express=true&protocol=https&imageHref=${thumbnail}`;
}

function createThankyouWrapper(result, feedbackState) {
  const wrapper = createTag('div', { class: 'feedback-thankyou' });
  wrapper.append('Thank you');
  const tellMoreButton = createTag('a', { class: 'feedback-tell-more secondary button', href: '#', target: '_blank' });
  tellMoreButton.textContent = 'Tell us more'; // TODO: use placeholders
  tellMoreButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openFeedbackModal(result, feedbackState);
  });

  const closeButton = createTag('button', { class: 'feedback-close-button' });
  closeButton.append(getIconElement('close-button-x'));
  closeButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    feedbackState.hideThankyou();
  });
  wrapper.append(tellMoreButton);
  wrapper.append(closeButton);
  return wrapper;
}

function createTemplate(result) {
  const templateBranchUrl = getTemplateBranchUrl(result);
  const templateWrapper = createTag('div', { class: 'generated-template-wrapper' });
  const hoverContainer = createTag('div', { class: 'hover-container' });

  const CTAButton = createTag('a', {
    class: 'cta-button button accent',
    target: '_blank',
    href: templateBranchUrl,
  });
  CTAButton.textContent = 'Edit this template';
  hoverContainer.append(CTAButton);

  const feedbackRow = createTag('div', { class: 'feedback-row' });
  const feedbackState = {};
  const rateResultButton = createRateResultWrapper(result, feedbackState);
  const reportButton = createReportWrapper(result, feedbackState);
  const thankyouWrapper = createThankyouWrapper(result, feedbackState);
  feedbackState.hideThankyou = () => {
    reportButton.style.display = 'flex';
    rateResultButton.style.display = 'flex';
    thankyouWrapper.style.display = 'none';
  };
  feedbackState.showThankyou = () => {
    reportButton.style.display = 'none';
    rateResultButton.style.display = 'none';
    thankyouWrapper.style.display = 'flex';
  };
  feedbackRow.append(rateResultButton);
  feedbackRow.append(reportButton);
  feedbackRow.append(thankyouWrapper);
  feedbackRow.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  feedbackState.hideThankyou();
  hoverContainer.append(feedbackRow);

  templateWrapper.append(createTag('img', { src: result.thumbnail, class: 'generated-template-image' }));
  hoverContainer.addEventListener('click', () => {
    window.open(templateBranchUrl, '_blank').focus();
  });
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
        progressManager.update(Math.floor(results.length / NUM_RESULTS) * 100);
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
  const loaderWrapper = createTag('div', { class: 'loader-wrapper' });
  const textRow = createTag('div', { class: 'loader-text-row' });
  const text = createTag('span', { class: 'loader-text' });
  text.textContent = 'Loading results…'; // TODO: use placeholders
  const percentage = createTag('span', { class: 'loader-percentage' });
  percentage.textContent = '0%';
  textRow.append(text);
  textRow.append(percentage);
  loaderWrapper.append(textRow);

  const progressBar = createTag('div', { class: 'loader-progress-bar' });
  progressBar.append(createTag('div'));
  loaderWrapper.append(progressBar);

  const placeholderRow = createTag('div', { class: 'loader-placeholder-row' });
  for (let i = 0; i < NUM_RESULTS; i += 1) {
    placeholderRow.append(createTag('div', { class: 'loader-placeholder' }));
  }
  loaderWrapper.append(placeholderRow);

  modalContent.append(loaderWrapper);
}

function updateSearchableAndDropdown(modalContent, searchable) {
  if (modalContent !== BlockMediator.get('ace-state').modalContent) {
    return;
  }
  const dropdown = modalContent.querySelector(':scope .picker-open');
  if (dropdown) {
    if (!searchable) {
      dropdown.classList.add('disabled');
    } else {
      dropdown.classList.remove('disabled');
    }
  }
  const searchButton = modalContent.querySelector('.search-form .search-button');
  const searchBarInput = modalContent.querySelector('.search-form input.search-bar');

  if (!searchButton || !searchBarInput) return;
  searchButton.disabled = !searchable;
  searchBarInput.disabled = !searchable;
  if (searchable) {
    searchButton.classList.remove('disabled');
  } else {
    searchButton.classList.add('disabled');
  }
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

export async function fetchResults(modalContent) {
  const {
    query,
    dropdownValue,
    fetchingState,
    placeholders,
  } = BlockMediator.get('ace-state');
  const { searchPositionMap } = fetchingState;
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

  updateSearchableAndDropdown(modalContent, false);

  const oldLoader = modalContent.querySelector('.loader-wrapper');
  if (oldLoader) {
    fetchingState.progressManager.reset();
    oldLoader.style.display = 'flex';
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

  // TODO: placeholders for locale and category
  const requestConfig = {
    query,
    num_results: NUM_RESULTS,
    locale: 'en-us',
    category: 'poster',
    subcategory: (dropdownValue
        && dropdownValue.trim() !== placeholders['template-list-ace-categories-dropdown']?.split(',')?.[0].trim())
      ? dropdownValue.trim()
      : null,
    force: searchPositionMap.has(query),
    start_index: searchPositionMap.get(query) || 0,
  };

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

    if (!searchPositionMap.has(query)) {
      searchPositionMap.set(query, NUM_RESULTS);
    } else {
      searchPositionMap.set(query,
        (searchPositionMap.get(query) + NUM_RESULTS) % (RESULTS_ROTATION * NUM_RESULTS));
    }
  } catch (e) {
    console.error(e);
    fetchingState.results = 'error';
  } finally {
    updateSearchableAndDropdown(modalContent, true);
  }
}

export function renderResults(modalContent) {
  const { fetchingState: { results }, modalContent: currModal } = BlockMediator.get('ace-state');
  if (modalContent !== currModal) {
    return;
  }
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
    placeholder: placeholders['template-list-ace-search-hint'],
    enterKeyHint: placeholders.search ?? 'Search',
  });
  searchBar.value = query;
  searchForm.append(searchBar);

  const refreshText = placeholders['template-list-ace-button-refresh'] ?? 'Refresh results';
  const button = createTag('a', {
    href: '#',
    title: refreshText,
    class: 'search-button button secondary xlarge disabled',
    target: '_blank',
  });
  button.textContent = refreshText;
  searchForm.append(button);
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!searchBar.value || button.classList.contains('disabled')) {
      return;
    }
    aceState.query = searchBar.value;
    await fetchResults(modalContent);
    renderResults(modalContent);
  });

  searchBar.addEventListener('input', () => {
    if (!searchBar.value) {
      button.classList.add('disabled');
    } else {
      button.classList.remove('disabled');
    }
  });

  searchBar.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      button.click();
    }
  });

  return searchForm;
}
function createTitleRow(block) {
  const { placeholders, createTemplateLink } = BlockMediator.get('ace-state');
  const titleRow = createTag('div', { class: 'modal-title-row' });
  const title = createTag('h1');
  titleRow.appendChild(title);
  title.textContent = placeholders['template-list-ace-modal-title'];
  createDropdown(titleRow, block, BlockMediator.get('ace-state').dropdown);
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
