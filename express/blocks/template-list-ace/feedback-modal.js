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
import { postFeedback, FEEDBACK_CATEGORIES } from './ace-api.js';
import BlockMediator from '../../scripts/block-mediator.js';

// TODO: use placeholders
const feedBackModalConfig = {
  [FEEDBACK_CATEGORIES.THUMBS_UP]: {
    headline: 'Thank you for your feedback',
    p: 'What worked well? Select all that apply (required)',
    reasons: [
      'Prompt accurately interpreted',
      'Closely matches the requested style or theme',
      'High-quality output',
      'Great for inspiration',
      'Production-ready image',
      'Exceeds expectations, impressive',
      'Other',
    ],
  },
  [FEEDBACK_CATEGORIES.THUMBS_DOWN]: {
    headline: 'Thank you for your feedback',
    p: 'What went wrong? Select all that apply (required)',
    reasons: [
      'Poor Quality',
      'Unexpected content in results',
      'Results not relevant to prompts',
      'Distorted results',
      'Prompt is incorrectly blocked',
      'Other',
    ],
  },
  [FEEDBACK_CATEGORIES.REPORT_ABUSE]: {
    headline: 'Report results',
    p: 'Select all that apply (required)',
    reasons: [
      'Harmful',
      'Illegal',
      'Offensive',
      'Biased',
      'Trademark violation',
      'Copy right violation',
      'Nudity/sexual content',
      'Violence/gore',
    ],
  },
};

const FEEDBACK_MODAL_ID = 'feedback-modal';

export function renderFeedbackModal(feedbackModalContent, result, feedbackState) {
  const title = createTag('h3', { class: 'feedback-modal-title' });
  const { headline, p, reasons } = feedBackModalConfig[feedbackState.category];
  title.textContent = headline;

  const form = createTag('form', { class: 'feedback-modal-form' });
  const formGuidance = createTag('p', { class: 'feedback-modal-form-guidance' });
  formGuidance.textContent = p; // TODO: use placeholder
  form.append(formGuidance);

  const submitButton = createTag('a', {
    class: 'submit-button accent button disabled',
    disabled: true,
    href: '#',
    target: '_blank',
  });
  const noteInput = createTag('input', {
    class: 'feedback-modal-note-input',
    type: 'text',
    placeholder: 'Add a note (optional)',
  });
  const reasonInputs = reasons.map((r) => createTag('input', { class: 'feedback-modal-reason-check', type: 'checkbox', name: r }));
  noteInput.addEventListener('input', (e) => {
    if (e.target.value) {
      submitButton.classList.remove('disabled');
    } else if (!reasonInputs.some(({ checked }) => checked)) {
      submitButton.classList.add('disabled');
    }
  });
  reasonInputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      if (e.target.checked) {
        submitButton.classList.remove('disabled');
      } else if (!reasonInputs.some(({ checked }) => checked) && !noteInput.value) {
        submitButton.classList.add('disabled');
      }
    });
  });
  reasons.forEach((reason, index) => {
    const reasonLabel = createTag('label', { class: 'feedback-modal-reason-label' });
    reasonLabel.append(reasonInputs[index], reason);
    form.append(reasonLabel);
    form.append(createTag('br'));
  });

  form.append(noteInput);

  const buttonRows = createTag('div', { class: 'feedback-modal-button-rows' });
  const cancelButton = createTag('a', { class: 'cancel-button reverse secondary button', href: '#', target: '_blank' });
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    feedbackModalContent.parentElement.parentElement.dispatchEvent(
      new CustomEvent(`close:${FEEDBACK_MODAL_ID}`),
    );
  });

  submitButton.textContent = 'Submit feedback';
  submitButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const checked = [];
    reasonInputs.forEach((reasonInput) => {
      if (reasonInput.checked) {
        checked.push(reasonInput.name);
      }
    });
    const noteValue = noteInput.value;
    if (checked.length === 0 && !noteValue) {
      return;
    }
    try {
      const { error } = await postFeedback(
        result.id,
        feedbackState.category,
        `${checked.join(',')}::${noteValue}`,
      );
      if (error) throw new Error(error);
      const { feedbackState: { showSubmittedTooltip } = {} } = BlockMediator.get('ace-state');
      if (showSubmittedTooltip) showSubmittedTooltip();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    feedbackModalContent.parentElement.parentElement.dispatchEvent(
      new CustomEvent(`close:${FEEDBACK_MODAL_ID}`),
    );
  });
  buttonRows.append(cancelButton, submitButton);

  feedbackModalContent.append(title);
  feedbackModalContent.append(form);
  feedbackModalContent.append(buttonRows);
}

export async function openFeedbackModal(result, feedbackState) {
  const modal = createTag('div');
  modal.style.height = `${550 - 30
    * (feedBackModalConfig[FEEDBACK_CATEGORIES.REPORT_ABUSE].reasons.length
      - feedBackModalConfig[feedbackState.category].reasons.length)
  }px`;
  modal.style.width = '500px';
  const feedbackModalContent = createTag('div', { class: 'modal-content' });
  modal.append(feedbackModalContent);
  const mod = await import('../modal/modal.js');

  mod.getModal(null, {
    class: 'feedback-modal',
    id: FEEDBACK_MODAL_ID,
    content: modal,
    closeEvent: `close:${FEEDBACK_MODAL_ID}`,
  });
  renderFeedbackModal(feedbackModalContent, result, feedbackState);
  return feedbackModalContent;
}
