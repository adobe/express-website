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

export function renderReportModal(reportModalContent) {
  const title = createTag('h2', { class: 'report-modal-title' });
  const form = createTag('form', { class: 'report-modal-form' });
  const legend = createTag('h3', { class: 'report-modal-form-title' });
  legend.textContent = 'Select all that apply (required)';
  form.append(legend);
  reasons.forEach((reason) => {
    const reasonLabel = createTag('label', { class: 'report-modal-reason-label' });
    const reasonInput = createTag('input', { class: 'report-modal-reason-input', type: 'radio', name: reason });
    reasonLabel.append(reasonInput, reason);
    form.append(reasonLabel);
    form.append(createTag('br'));
  });
  const note = createTag('input', { class: 'report-modal-note', placeholder: 'Add a note (optional)' });
  const buttonRows = createTag('div', { class: 'report-modal-button-rows' });
  const cancelButton = createTag('button', { class: 'report-modal-cancel-button' });
  cancelButton.textContent = 'Cancel';
  const submitButton = createTag('button', { class: 'report-modal-submit-button' });
  submitButton.textContent = 'Submit feedback';
  buttonRows.append(cancelButton, submitButton);

  reportModalContent.append(title);
  reportModalContent.append(form);
  reportModalContent.append(note);
  reportModalContent.append(buttonRows);
}

export async function openReportModal() {
  const modal = createTag('div');
  modal.style.height = '840px';
  modal.style.width = '600px';
  const reportModalContent = createTag('div', { class: 'report-modal' });
  modal.append(reportModalContent);
  BlockMediator.get('ace-state').reportModalContent = reportModalContent;
  const mod = await import('../modal/modal.js');
  mod.getModal(null, {
    class: 'report-modal',
    id: 'report-modal',
    content: modal,
    closeEvent: 'closeReportModal',
  });
  renderReportModal(reportModalContent);
  return reportModalContent;
}
