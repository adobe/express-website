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

const TIMEOUT = 10000;

/**
 * Checks if the homepage is loading and showing the expected content.
 * @param {string} baseUrl The base URL to check
 */
 async function checkHomepage(baseUrl) {
  const url = `${baseUrl}/`;
  console.log(`Verifying ${url} ...`);
  $browser.get(url)
    // wait for the page to fully load
    .then(() => $browser.sleep(TIMEOUT))
    // check document integrity
    .then(() => $browser.findElement($driver.By.css('html')))
    .then((html) => Promise.all([html.getAttribute('class'), html.getAttribute('lang')]))
    .then(([template, lang]) => {
      assert.ok(template === 'default', `Expected template to be "default", got "${template}" instead`);
      assert.ok(lang === 'en', `Expected language to be "en", got "${lang}" instead`);
    })
    // check CTA button
    .then(() => $browser.findElement($driver.By.css('main a.button.primary')))
    .then(() => console.log(`${url} successfully verified.`))
    .catch((e) => {
      assert.fail(`Verification of ${url} failed: ${e.message}`);
    });
}

/**
 * Checks if the pricing page is loading and showing the expected content.
 * @param {string} baseUrl The base URL to check
 */
async function checkPricingPage(baseUrl) {
  const url = `${baseUrl}/pricing`;
  console.log(`Verifying ${url} ...`);
  $browser.get(url)
    // wait for the page to fully load
    .then(() => $browser.sleep(TIMEOUT))
    // check buy button
    .then(() => $browser.findElement($driver.By.linkText('Buy Now')))
    .then((button) => button.getAttribute('href'))
    .then((buyUrl) => assert.ok(buyUrl.startsWith('https://commerce.adobe.com')))
    .then(() => console.log(`${url} successfully verified.`))
    .catch((e) => {
      assert.fail(`Verification of ${url} failed: ${e.message}`);
    });
}

// Check homepage and pricing page
(async () => {
  await Promise.all([
    '$$$URL$$$',
    // 'https://spark-website--adobe.hlx.live/express',
    // 'https://spark-website--adobe.hlx.page/express',
  ].map((baseUrl) => checkHomepage(baseUrl) && checkPricingPage(baseUrl)));
})();
