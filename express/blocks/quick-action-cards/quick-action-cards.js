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
  const $cards = Array.from($block.querySelectorAll(':scope>div'));
  $cards.forEach(($card) => {
    $card.classList.add('quick-action-card');
    const $cardDivs = [...$card.children];
    $cardDivs.forEach(($div) => {
      if ($div.querySelector('img')) {
        $div.classList.add('quick-action-card-image');
      }
      const $a = $div.querySelector('a');
      if ($a && $a.textContent.startsWith('https://')) {
        const $wrapper = createTag('a', { href: $a.href, class: 'quick-action-card' });
        $a.remove();
        $wrapper.innerHTML = $card.innerHTML;
        $block.replaceChild($wrapper, $card);
      }
    });
  });
  if ($cards.length > 3) {
    const $seeMore = document.createElement('button');
    $seeMore.classList.add('quick-action-card--open');
    $seeMore.insertAdjacentHTML('beforeend', 'See more <svg class="action-card-chevron" xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 1200 1200"><path d="M600.006 989.352l178.709-178.709L1200 389.357l-178.732-178.709L600.006 631.91L178.721 210.648L0 389.369l421.262 421.262l178.721 178.721h.023z" fill="currentColor"></path></svg>');
    $seeMore.addEventListener('click', () => {
      $block.classList.add('quick-action-cards--expanded');
    });
    const $seeLess = document.createElement('button');
    $seeLess.classList.add('quick-action-card--close');
    $seeLess.insertAdjacentHTML('beforeend', 'See less <svg class="action-card-chevron" xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 1200 1200"><path d="M600.006 989.352l178.709-178.709L1200 389.357l-178.732-178.709L600.006 631.91L178.721 210.648L0 389.369l421.262 421.262l178.721 178.721h.023z" fill="currentColor"></path></svg>');
    $seeLess.addEventListener('click', () => {
      $block.classList.remove('quick-action-cards--expanded');
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
