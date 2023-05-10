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
import BlockMediator from '../../scripts/block-mediator.js';
import { postFeedback, FEEDBACK_CATEGORIES } from './ace-api.js';

// TODO: use placeholders
const reasons = [
  'Harmful',
  'Illegal',
  'Offensive',
  'Biased',
  'Trademark violation',
  'Copy right violation',
  'Nudity/sexual content',
  'Violence/gore',
];
const REPORT_MODAL_ID = 'report-modal';

export function renderReportModal(reportModalContent, result) {
  const title = createTag('h3', { class: 'report-modal-title' });
  title.textContent = 'Report results';

  const form = createTag('form', { class: 'report-modal-form' });
  const formGuidance = createTag('p', { class: 'report-modal-form-guidance' });
  formGuidance.textContent = 'Select all that apply (required)'; // TODO: use placeholder
  form.append(formGuidance);
  const reasonInputs = reasons.map((reason) => createTag('input', { class: 'report-modal-reason-input', type: 'checkbox', name: reason }));
  reasons.forEach((reason, index) => {
    const reasonLabel = createTag('label', { class: 'report-modal-reason-label' });
    reasonLabel.append(reasonInputs[index], reason);
    form.append(reasonLabel);
    form.append(createTag('br'));
  });
  const noteInput = createTag('input', { class: 'report-modal-note-input', type: 'text', placeholder: 'Add a note (optional)' });
  form.append(noteInput);

  const buttonRows = createTag('div', { class: 'report-modal-button-rows' });
  const cancelButton = createTag('button', { class: 'cancel-button' });
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    reportModalContent.parentElement.parentElement.dispatchEvent(new CustomEvent(`close:${REPORT_MODAL_ID}`));
  });
  const submitButton = createTag('button', { class: 'submit-button' });
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
    try {
      const { result: feedbackRes, error } = await postFeedback(
        result.id,
        FEEDBACK_CATEGORIES.REPORT_ABUSE,
        `${checked.join(',')}::${noteValue}`,
      );
      if (error) throw new Error(error);
      alert(feedbackRes);
    } catch (err) {
      console.error(err);
    }
    reportModalContent.parentElement.parentElement.dispatchEvent(new CustomEvent(`close:${REPORT_MODAL_ID}`));
  });
  buttonRows.append(cancelButton, submitButton);

  reportModalContent.append(title);
  reportModalContent.append(form);
  reportModalContent.append(buttonRows);
}

export async function openReportModal(result) {
  const modal = createTag('div');
  modal.style.height = '530px';
  modal.style.width = '500px';
  const reportModalContent = createTag('div', { class: 'modal-content' });
  modal.append(reportModalContent);
  BlockMediator.get('ace-state').reportModalContent = reportModalContent;
  const mod = await import('../modal/modal.js');

  mod.getModal(null, {
    class: 'report-modal',
    id: REPORT_MODAL_ID,
    content: modal,
    closeEvent: `close:${REPORT_MODAL_ID}`,
  });
  renderReportModal(reportModalContent, result);
  return reportModalContent;
}
