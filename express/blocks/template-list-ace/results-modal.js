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

const NUM_PLACEHOLDERS = 4;
const MONITOR_INTERVAL = 2000;
const AVG_GENERATION_TIME = 12000;

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

export function renderRateResult(result) {
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

// eslint-disable-next-line no-unused-vars
export function renderReportButton(result) {
  const wrapper = createTag('div', { class: 'feedback-report' });
  wrapper.append('Report');
  const reportButton = createTag('button', { class: 'feedback-report-button' });
  reportButton.append('🚩');
  wrapper.append(reportButton);
  wrapper.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO:
    console.log('report abuse form WIP');
  });
  return wrapper;
}

// FIXME: this is not really working yet
function getTemplateBranchUrl(result) {
  const { thumbnail } = result;
  return `https://prod-search.creativecloud.adobe.com/express?express=true&protocol=https&imageHref=${thumbnail}`;
}

function renderTemplate(result) {
  const { thumbnail } = result;
  const templateBranchUrl = getTemplateBranchUrl(result);
  const templateWrapper = createTag('div', { class: 'generated-template-wrapper' });
  templateWrapper.addEventListener('click', () => {
    window.location.href = templateBranchUrl;
  });
  const hoverContainer = createTag('div', { class: 'hover-container' });
  const feedbackRow = createTag('div', { class: 'feedback-row' });
  feedbackRow.append(renderRateResult(result));
  feedbackRow.append(renderReportButton(result));
  hoverContainer.append(feedbackRow);

  templateWrapper.append(createTag('img', { src: thumbnail, class: 'generated-template-image' }));
  templateWrapper.append(hoverContainer);
  return templateWrapper;
}

async function waitForGeneration(jobId, progressManager, fetchingState) {
  return new Promise((resolve, reject) => {
    fetchingState.intervalId = setInterval(async () => {
      const res = await monitorGeneration(jobId);
      const { status, results, reason } = res;
      if (status === MONITOR_STATUS.IN_PROGRESS) {
        progressManager.update(Math.floor(results.length / NUM_PLACEHOLDERS) * 100);
        return;
      } else if (status === MONITOR_STATUS.COMPLETED) {
        progressManager.update(100);
        clearInterval(fetchingState.intervalId);
        resolve(results);
      } else if (status === MONITOR_STATUS.FAILED || reason) {
        clearInterval(fetchingState.intervalId);
        reject(new Error(JSON.stringify({ status })));
      }

      reject(new Error(JSON.stringify({ status, results, reason: 'unexpected status' })));
    }, MONITOR_INTERVAL);
  });
}

export function renderLoader() {
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
  return wrapper;
}

function updateProgressBar(percentage) {
  const percentageEl = document.querySelector('.loader-percentage');
  const progressBar = document.querySelector('.loader-progress-bar div');
  if (!percentageEl || !progressBar) return;
  percentageEl.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
}

async function fetchAndRenderResults(query, modalContentWrapper, fetchingState) {
  const progressManager = useProgressManager(updateProgressBar, 1000, {
    avgCallingTimes: AVG_GENERATION_TIME / MONITOR_INTERVAL,
    sample: 3,
  });
  const { jobId, status } = await requestGeneration({ query, num_results: NUM_PLACEHOLDERS });
  if (status !== 'in-progress') {
    modalContentWrapper.append(`Error requesting generation: ${jobId} ${status}`);
    return;
  }
  // consider the first 6-12% as the time for triggering generation
  progressManager.update(Math.random() * 6 + 6);
  let results;

  try {
    results = await waitForGeneration(jobId, progressManager, fetchingState);
  } catch (e) {
    console.error(e);
    modalContentWrapper.append('Error generating templates!');
    return;
  }
  const images = results
    .filter((result) => result.generated)
    .map((result) => renderTemplate(result));
  const generatedRow = createTag('div', { class: 'generated-row' });
  const title = createTag('div', { class: 'generated-title' });
  title.textContent = "Here's results";
  images.forEach((image) => {
    generatedRow.append(image);
  });
  modalContentWrapper.append(title);
  modalContentWrapper.append(generatedRow);
}

export function renderModalContent(search, title) {
  const renderedModal = createTag('div', { class: 'modal-content' });
  renderedModal.append(title);
  const loading = renderLoader();
  renderedModal.append(loading);
  const fetchingState = { intervalId: null };
  fetchAndRenderResults(search, renderedModal, fetchingState).then(() => {
    setTimeout(() => {
      loading.remove();
    }, 1500);
  });
  return { renderedModal, fetchingState };
}
