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

// eslint-disable-next-line import/no-unresolved
import { createTag } from '../../scripts/scripts.js';

export default function decorate($block) {
  $block.querySelectorAll(':scope>div').forEach(($card) => {
    $card.classList.add('quote');
    if ($card.children.length > 1) {
      const $author = $card.children[1];
      $author.classList.add('author');
      if ($author.querySelector('picture')) {
        const $authorImg = createTag('div', { class: 'image' });
        $authorImg.appendChild($author.querySelector('picture'));
        $author.appendChild($authorImg);
      }
      const $authorSummary = createTag('div', { class: 'summary' });
      Array.from($author.querySelectorAll('p'))
        .filter(($p) => !!$p.textContent)
        .forEach(($p) => $authorSummary.appendChild($p));
      $author.appendChild($authorSummary);
    }
    $card.firstElementChild.classList.add('content');
  });
}
