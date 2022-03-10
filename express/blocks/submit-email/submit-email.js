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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function decorate($block) {
  const $container = document.querySelector('.submit-email-container');

  // Remove submit-email block wrapping div
  const $blockParentDiv = $block.parentElement;
  $container.insertBefore($block, $container.firstChild);
  $container.removeChild($blockParentDiv);

  const $form = document.createElement('form');
  const $formHeading = document.createElement('h2');
  $formHeading.textContent = 'Subscribe Now';
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

  $submitButton.textContent = 'Submit';
  $submitButton.setAttribute('href', '');
  $submitButton.classList.add('button');
  $submitButton.classList.add('accent');
  $submitButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Start time of test
    const testStart = new Date().getTime();

    // Start time of current chunk
    let chunkStart = new Date().getTime();

    // Total sent
    let total = 0;

    // Index in current chunk
    let index = 0;

    const failed = [];

    const params = new URL(window.location).searchParams;
    const TOTAL_TEST_MESSAGES = Math.min(params.get('total'), 100000);
    const CHUNK_SIZE = Math.min(params.get('chunkSize'), 2000);

    for (let i = 0; i < TOTAL_TEST_MESSAGES; i += 1) {
      const email = `adobe-test-${total}@adobetest.com`;
      const body = {
        sname: 'adbemeta',
        email,
        consent_notice: '<div class="disclaimer detail-spectrum-m" style="letter-spacing: 0px; padding-top: 15px;">The Adobe family of companies may keep me informed with personalized emails. See our <a href="https://www.adobe.com/privacy/policy.html" target="_blank">Privacy Policy</a> for more details or to opt-out at any time.</div>',
        current_url: window.location.href,
      };

      const requestOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      };

      try {
        // eslint-disable-next-line no-await-in-loop
        await fetch('https://www.adobe.com/api2/subscribe_v1', requestOptions);
        $formHeading.textContent = 'Thanks for signing up!';
        $formHeading.classList.add('success');
        $emailInput.classList.remove('error');
        $emailInput.value = '';
      } catch (error) {
        console.log('Error: ', error.message);
        $formHeading.textContent = `An error occurred during subscription: ${error.message}`;
        failed.push(email);
      }

      total += 1;
      index += 1;

      // Calculate duration of current chunk
      const now = new Date().getTime();
      const duration = now - chunkStart;
      console.log(`Sent ${index} email to: ${email} - Duration ${duration}ms`);

      // Slight delay
      // eslint-disable-next-line no-await-in-loop
      await sleep(30);

      // If the duration of this chunk is greater than 1 minute or
      // we have already sent 2000 messages then start a new chunk
      if (duration > 60000 || index === CHUNK_SIZE) {
        index = 0;
        console.log('Hit limit.. pausing');

        // if we finished before the minute mark then wait until the minute mark
        // eslint-disable-next-line no-await-in-loop
        await sleep(60000 - duration);
        chunkStart = new Date().getTime();
      }
    }

    // Test complete
    const now = new Date().getTime();
    const duration = now - testStart;
    console.log(`Sent: ${total}, Total Duration: ${duration}ms`);

    if (failed.length > 0) {
      console.log(`Failed to send (${failed.length}):`);
      failed.forEach((email) => {
        console.log(`${email}`);
      });
    }
  });

  $block.querySelector('.submit-email > div > div:nth-child(2)').appendChild($form);

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
