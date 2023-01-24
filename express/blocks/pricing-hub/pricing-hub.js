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
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

function decorateCards($headers, $cards) {
  for (let i = 1; i < 4; i += 1) {
    const $header = $headers[i];
    const $card = $cards[i];

    if ($header.textContent) {
      $header.classList.add('pricing-hub-card-header');
      $card.prepend($header);
    } else {
      $header.remove();
    }

    $card.classList.add('pricing-hub-card');

    if (i === 2) {
      $card.classList.add('pricing-hub-card-highlight');
    }
  }
}

export default function decorate($block) {
  const $rows = Array.from($block.children);
  const $headers = Array.from($rows[0].children);
  const $cards = Array.from($rows[1].children);

  decorateCards($headers, $cards);
}
