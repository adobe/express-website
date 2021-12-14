/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global $browser $driver */
/* eslint-disable no-console */

/*
 * Scripted Browser API Documentation:
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-scripted-browsers
 */
const assert = require('assert');

const baseUrl = '$$$URL$$$';
const TIMEOUT = 5000;

/**
 * Checks if the homepage and pricing page are loading and showing the expected content.
 * @param {string} homeUrl The homepage URL to check
 */
async function checkContent(homeUrl) {
  return $browser.get(homeUrl)
    .then(() => console.log('Verifying homepage...'))
    // wait for the page to fully load
    .then(() => $browser.sleep(TIMEOUT))
    // check CTA button
    .then(() => $browser.findElement($driver.By.css('main a.button.accent')))
    .then((button) => button.getAttribute('href'))
    .then((ctaUrl) => assert.equal(new URL(ctaUrl).origin, 'https://adobesparkpost.app.link', `Unexpected CTA button URL: ${ctaUrl}`))
    .then(() => console.log('CTA button OK'))
    .then(() => console.log('Homepage successfully verified.'))
    // pricing page
    .then(() => `${homeUrl}pricing`)
    .then((url) => $browser.get(url))
    .then(() => console.log('Verifying pricing page...'))
    // wait for the page to fully load
    .then(() => $browser.sleep(TIMEOUT))
    // check free button
    .then(() => $browser.findElements($driver.By.css('.pricing-columns-cta.button')))
    .then((buttons) => buttons[0].getAttribute('href'))
    .then((freeUrl) => assert.equal(new URL(freeUrl).origin, 'https://express.adobe.com', `Unexpected free button URL: ${freeUrl}`))
    .then(() => console.log('Free button OK'))
    // check buy button
    .then(() => $browser.findElements($driver.By.css('.pricing-columns-cta.button')))
    .then((buttons) => buttons[1].getAttribute('href'))
    .then((buyUrl) => assert.equal(new URL(buyUrl).origin, 'https://commerce.adobe.com', `Unexpected buy button URL: ${buyUrl}`))
    .then(() => console.log('Buy button OK'))
    .then(() => console.log('Pricing page successfully verified.'))
    .catch((e) => {
      assert.fail(`Verification failed: ${e.message}`);
    });
}

// Check homepage and pricing page
(async () => {
  await checkContent(baseUrl);
})();