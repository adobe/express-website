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

const DEFAULT_DELAY = 1000;

/**
 * @param {HTMLDivElement} block
 */
function unwrapImages(block) {
  block.querySelectorAll('p').forEach(($p) => {
    if ($p.childElementCount === 1 && $p.firstChild.tagName === 'PICTURE') {
      $p.replaceWith($p.firstChild);
    }
  });
}

/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  const conf = readBlockConfig(block);
  // remove conf divs
  block.querySelectorAll(':scope > div').forEach(($row, i) => {
    if (i >= 2) {
      $row.remove();
    }
  });

  unwrapImages(block);

  console.debug('conf: ', conf);

  const $link = block.querySelector('a');
  if (!$link || document.body.dataset.device === 'mobile') {
    // TODO: insert fallback image
    console.warn('[3d] bail out!');
    return;
  }

  const { href } = $link;
  $link.parentElement.parentElement.remove();

  const nh = conf['no-header'];
  if (nh && nh.toLowerCase() === 'true') {
    document.querySelector('header').remove();
  }

  let { delay } = conf;
  if (delay) {
    delay = Number.parseInt(delay, 10);
  }
  if (delay == null || Number.isNaN(delay)) {
    delay = DEFAULT_DELAY;
  }

  setTimeout(() => {
    const iframe = document.createElement('iframe');
    iframe.loading = 'lazy';
    iframe.src = href;
    block.append(iframe);
  }, delay);
}
