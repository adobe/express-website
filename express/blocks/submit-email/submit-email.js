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
import { fetchPlaceholders } from '../../scripts/scripts.js';

export default function decorate($block) {
  const $container = document.querySelector('.submit-email-container');

  // Remove submit-email block wrapping div
  const $blockParentDiv = $block.parentElement;
  $container.insertBefore($block, $container.firstChild);
  $container.removeChild($blockParentDiv);

  const $form = document.createElement('form');
  const $formHeading = document.createElement('h2');
  $formHeading.textContent = 'Subscribe now.';
  $formHeading.classList.add('form-heading');

  const $submitButton = document.createElement('a');
  const $emailInput = document.createElement('input');
  $emailInput.classList.add('email-input');
  $emailInput.setAttribute('type', 'email');
  $emailInput.setAttribute('placeholder', 'Email');
  $emailInput.addEventListener('keydown', (e) => {
    $emailInput.classList.remove('error');
    const key = e.key || e.keyCode;
    if (key === 13 || key === 'Enter') {
      e.preventDefault();
      $submitButton.click();
    }
  });

  fetchPlaceholders().then((placeholders) => {
    $submitButton.textContent = placeholders['subscribe-cta'];
  });

  $submitButton.setAttribute('href', '');
  $submitButton.classList.add('button');
  $submitButton.classList.add('accent');
  $submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    const email = $emailInput.value;

    if (email && $form.checkValidity()) {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const body = {
        sname: 'adbemeta_live',
        email,
        consent_notice: '<div class="disclaimer detail-spectrum-m" style="letter-spacing: 0px; padding-top: 15px;">The Adobe family of companies may keep me informed with personalized emails about the Adobe x Meta Express your brand campaign. See our <a href="https://www.adobe.com/privacy/policy.html" target="_blank">Privacy Policy</a> for more details or to opt-out at any time.</div>',
        current_url: window.location.href,
      };

      const requestOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      };

      fetch('https://www.adobe.com/api2/subscribe_v1', requestOptions)
        .then(() => {
          $formHeading.textContent = 'Thanks for signing up!';
          $formHeading.classList.add('success');
          $formHeading.classList.remove('error');
          $emailInput.classList.remove('error');
          $emailInput.value = '';
        })
        .catch(() => {
          $formHeading.textContent = 'An error occurred during subscription';
          $formHeading.classList.add('error');
        });
    } else {
      $emailInput.classList.add('error');
      $form.reportValidity();
    }
  });

  $block.querySelector('.submit-email > div > div').appendChild($form);

  const $formBlock = document.createElement('div');
  $formBlock.classList.add('form-block');
  $formBlock.appendChild($emailInput);
  $formBlock.appendChild($submitButton);
  $form.appendChild($formHeading);
  $form.appendChild($formBlock);

  // Change p to spans
  for (const p of $block.querySelectorAll('p')) {
    const span = document.createElement('span');
    span.innerHTML = p.innerHTML;
    p.parentNode.replaceChild(span, p);
  }
}
