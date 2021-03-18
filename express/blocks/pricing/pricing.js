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
/* global fetch */

import {
  createTag,
  readBlockConfig,
} from '../../scripts/scripts.js';

async function fetchHeader(sheet) {
  const url = `./${sheet}.json?sheet=header`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

async function fetchPlans(sheet) {
  const url = `./${sheet}.json?sheet=plans`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

async function fetchFeatures(sheet) {
  const url = `./${sheet}.json?sheet=table`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

function buildWordList(header) {
  const words = [];
  header.forEach((row) => {
    const word = row['Header Words'];
    words.push(word);
  });
  return words;
}

function animateHeader($header, words) {
  let i = 0;
  const max = words.length;
  const firstWord = words[0];
  const headerWordTemplate = `<span id="pricing-header-word">${firstWord}</span>`;
  $header.innerHTML = $header.innerHTML.replace('[x]', headerWordTemplate);
  const $headerWord = $header.children[0];
  setInterval(() => {
    $headerWord.classList.add('hidden');
    setTimeout(() => {
      i += 1;
      if (i > max) {
        i = 0;
      }
      $headerWord.innerHTML = words[i];
      $headerWord.classList.remove('hidden');
    }, 1500);
  }, 4000);
}

function decorateHeader($block, header) {
  const headerText = header[0]['Header Title'];
  const $header = createTag('h2', { class: 'pricing-header' });
  const words = buildWordList(header);
  $header.innerHTML = headerText;
  $block.append($header);
  animateHeader($header, words);
}

function decoratePlans(plans, features) {

}

function decorateTable(features) {

}

async function decoratePricing($block) {
  const config = readBlockConfig($block);
  const { sheet } = config;

  const header = await fetchHeader(sheet);
  const plans = await fetchPlans(sheet);
  const features = await fetchFeatures(sheet);

  $block.innerHTML = '';

  decorateHeader($block, header);
  decoratePlans(plans, features);
  decorateTable(features);
}

export default function decorate($block) {
  decoratePricing($block);
}
