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
  waitForGeneration,
  postFeedback,
  FEEDBACK_CATEGORIES,
} from './ace-api.js';

export function renderLoader() {
  const wrapper = createTag('div', { class: 'loader-wrapper' });
  const spinnerContainer = createTag('div', { class: 'loader-container loader-container-big' });
  spinnerContainer.append(createTag('div', { class: 'big-loader' }));
  wrapper.append(spinnerContainer);
  const text = createTag('span', { class: 'loader-text' });
  text.textContent = 'Generating templates... This could take 30 seconds or more.';
  wrapper.append(text);
  return wrapper;
}

function getVoteHandler(id, category) {
  return async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { result: feedbackRes, error } = await postFeedback(id, category, 'Rate this result: thumbs_down');
      if (error) throw new Error(error);
      console.log(feedbackRes);
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
  downvoteLink.addEventListener('click', getVoteHandler(result.id, FEEDBACK_CATEGORIES.THUMBS_DOWN));
  upvoteLink.addEventListener('click', getVoteHandler(result.id, FEEDBACK_CATEGORIES.THUMBS_UP));
  wrapper.append(downvoteLink);
  wrapper.append(upvoteLink);
  return wrapper;
}

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

async function fetchAndRenderResults(query, modalContentWrapper) {
  const { jobId, status } = await requestGeneration({ query, num_results: 4 });
  if (status !== 'in-progress') {
    modalContentWrapper.append('Error generating templates!');
    return;
  }
  let results;
  try {
    results = await waitForGeneration(jobId, 2000);
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
  const modalContentWrapper = createTag('div', { class: 'modal-content' });
  modalContentWrapper.append(title);
  const loading = renderLoader();
  modalContentWrapper.append(loading);
  fetchAndRenderResults(search, modalContentWrapper).then(() => {
    loading.remove();
  });
  return modalContentWrapper;
}
