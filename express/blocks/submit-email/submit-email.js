/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

function decorateSubmitEmailBlock(block) {
  const container = document.querySelector('.submit-email-container');

  const icon = container.querySelector('.icon-creative-cloud-express, .icon-cc-express-logo');

  // Remove submit-email block wrapping div
  const blockParentDiv = block.parentElement;
  container.insertBefore(block, container.firstChild);
  container.removeChild(blockParentDiv);
  icon.setAttribute('src', '/express/icons/creative-cloud-express.svg');

  const heading = container.querySelector('h1');

  const form = document.createElement('form');
  const formHeading = document.createElement('h2');
  formHeading.textContent = 'Subscribe Now';
  formHeading.classList.add('form-heading');

  const emailInput = document.createElement('input');
  emailInput.classList.add('email-input');
  emailInput.setAttribute('type', 'email');
  emailInput.setAttribute('placeholder', 'Email');

  const submitButton = document.createElement('a');
  submitButton.textContent = 'Submit';
  submitButton.setAttribute('href', '');
  submitButton.classList.add('button');
  submitButton.classList.add('accent');
  submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    if (email) {
      // TODO: Send email to server
      formHeading.textContent = 'Thanks for signing up!';
      formHeading.classList.add('success');
    }
  });

  const formBlock = document.createElement('div');
  formBlock.classList.add('form-block');
  formBlock.appendChild(emailInput);
  formBlock.appendChild(submitButton);
  form.appendChild(formHeading);
  form.appendChild(formBlock);

  heading.after(form);

  // Change p to spans
  const paragraphs = block.querySelectorAll('p');
  for (const p of paragraphs) {
    const span = document.createElement('span');
    span.innerHTML = p.innerHTML;
    p.parentNode.replaceChild(span, p);
  }
}

export default function decorate($block) {
  decorateSubmitEmailBlock($block);
}
