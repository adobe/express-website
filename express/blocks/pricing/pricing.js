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
} from '../../scripts/scripts.js';

async function fetchHeader(sheet) {
  const url = `/${sheet}.json?sheet=header`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

async function fetchPlans(sheet) {
  const url = `/${sheet}.json?sheet=plans`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

async function fetchFeatures(sheet) {
  const url = `/${sheet}.json?sheet=features`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

function decorateHeader(header) {

}

function decoratePlans(plans, features) {

}

function decorateTable(features) {

}

async function decoratePricing($block) {
  const $rows = $block.children;
  const sheet = $rows[1];

  const header = await fetchHeader(sheet);
  const plans = await fetchPlans(sheet);
  const features = await fetchFeatures(sheet);

  decorateHeader(header);
  decoratePlans(plans, features);
  decorateTable(features);
}

export default function decorate($block) {
  console.log('decorate pricing');
  decoratePricing($block);
}
