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
/* eslint-disable import/named, import/extensions */

import {
  createTag,
  decorateMain,
  loadBlocks,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

async function decorateFragment($block) {
  const ref = $block.textContent;
  const path = new URL(ref).pathname.split('.')[0];
  const resp = await fetch(`${path}.plain.html`);
  const html = await resp.text();
  const $main = createTag('main');
  $main.innerHTML = html;
  const img = $main.querySelector('img');
  img.setAttribute('loading', 'lazy');
  decorateMain($main);
  const loadedBlocks = loadBlocks($main);
  await Promise.all(loadedBlocks);
  const $section = $block.closest('.section-wrapper');
  $section.parentNode.replaceChild($main, $section);
}

export default async function decorate($block) {
  await decorateFragment($block);
}
