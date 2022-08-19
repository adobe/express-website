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

import {
  readBlockConfig,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

const DEFAULT_DELAY = 2000;
const MAX_NONCONFIG_ROWS = 3;

/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  const conf = readBlockConfig(block);
  const rows = [...block.querySelectorAll(':scope > div')];

  const nonconfRows = Math.min(rows.length - Object.keys(conf).length, MAX_NONCONFIG_ROWS);
  rows.forEach(($row, i) => {
    if (i >= nonconfRows) {
      $row.remove();
    }
  });

  // required row
  const $link = rows.shift().querySelector(':scope a');
  $link.parentElement.parentElement.remove();

  // fallback image
  /** @type {HTMLDivElement} */
  let $fallbackImg;
  if (rows[0] && rows[0].childElementCount === 1 && rows[0].querySelector('picture')) {
    rows[0].classList.add('fallback');
    // eslint-disable-next-line prefer-destructuring
    $fallbackImg = rows[0];
  }

  if (!$link || document.body.dataset.device === 'mobile') {
    return;
  }

  const { href } = $link;
  $link.parentElement.parentElement.remove();

  let { delay } = conf;
  if (delay) {
    delay = Number.parseInt(delay, 10);
  }
  if (delay == null || Number.isNaN(delay)) {
    delay = DEFAULT_DELAY;
  }

  const iframe = document.createElement('iframe');
  iframe.loading = 'lazy';
  iframe.src = href;

  setTimeout(() => {
    iframe.onload = () => {
      iframe.style.opacity = '1';
      if ($fallbackImg) {
        $fallbackImg.style.display = 'none';
      }
      iframe.onload = null;
    };
    block.append(iframe);
  }, delay);
}
