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
  createTag,
  getIcon,
  fetchPlaceholders,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

export default function decorate($block) {
  const $cards = Array.from($block.querySelectorAll(':scope>div'));
  const chevron = getIcon('chevron');
  $cards.forEach(($card) => {
    $card.classList.add('quick-action-card');
    const $cardDivs = [...$card.children];
    $cardDivs.forEach(($div) => {
      if ($div.querySelector(':scope > picture:first-child')) {
        $div.classList.add('quick-action-card-image');
        const $a = $div.querySelector('a');
        if ($a && $a.textContent.startsWith('https://')) {
          const contents = Array.from($card.children);
          const $wrapper = createTag('a', { href: $a.href });
          $a.remove();
          $card.appendChild($wrapper);
          contents.forEach((child) => {
            $wrapper.appendChild(child);
          });
        }
      } else {
        const $buttons = $div.querySelectorAll(':scope a');
        for (let index = 0; index < $buttons.length; index += 1) {
          if (index > 0) {
            $buttons[index].insertAdjacentHTML('beforeend', chevron);
            $buttons[index].classList.remove('button');
            $buttons[index].classList.remove('primary');
            $buttons[index].classList.remove('secondary');
            $buttons[index].classList.remove('accent');
          }
        }
      }
    });
  });
  if ($cards.length > 3) {
    let $top = $block.previousElementSibling;
    if ($top && $top.tagName === 'P') {
      $top = $top.previousElementSibling;
    }
    if ($top && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes($top.tagName)) {
      $top = $block;
    }
    const $seeMore = document.createElement('a');
    $seeMore.classList.add('quick-action-card--open');
    $seeMore.classList.add('button');
    $seeMore.classList.add('secondary');
    const $seeLess = document.createElement('a');
    $seeLess.classList.add('quick-action-card--close');
    $seeLess.classList.add('button');
    $seeLess.classList.add('secondary');
    fetchPlaceholders().then((placeholders) => {
      $seeMore.innerText = placeholders['see-more'];
      $seeLess.innerText = placeholders['see-less'];
      $seeMore.insertAdjacentHTML('beforeend', chevron);
      $seeLess.insertAdjacentHTML('beforeend', chevron);
    });
    // eslint-disable-next-line no-script-url
    $seeMore.setAttribute('href', 'javascript: void(0)');
    $seeMore.addEventListener('click', () => {
      $block.classList.add('quick-action-cards--expanded');
    });
    // eslint-disable-next-line no-script-url
    $seeLess.setAttribute('href', 'javascript: void(0)');
    $seeLess.addEventListener('click', () => {
      $block.classList.remove('quick-action-cards--expanded');
      window.scrollTo(0, $top.offsetTop);
    });
    const $pButton = document.createElement('p');
    if ($block.nextSibling) {
      $block.parentNode.insertBefore($pButton, $block.nextSibling);
    } else {
      $block.parentNode.appendChild($pButton);
    }
    $pButton.classList.add('quick-action-cards--buttons');
    $pButton.appendChild($seeMore);
    $pButton.appendChild($seeLess);
  }
}
