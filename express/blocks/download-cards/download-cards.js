/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { createTag, readBlockConfig } from '../../scripts/scripts.js';
import { prependDownloadIcon } from '../hero-3d/hero-3d.js';

/**
 * @param {HTMLDivElement} $block
 */
function brandHeaders($block) {
  const headers = $block.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headers.forEach((header) => {
    const prev = header.previousElementSibling;
    if (!prev || prev.childElementCount !== 1 || !prev.querySelector('picture, .icon')) return;

    const parent = prev.parentElement;
    prev.parentElement.removeChild(prev);
    header.parentElement.removeChild(header);

    const pic = prev.querySelector('picture, .icon');

    /** @type {HTMLDivElement} */
    const wrapper = createTag('div', { class: 'branded-header' });
    wrapper.append(pic, header);
    parent.prepend(wrapper);
  });
}

/**
 * Pad cards to an even number
 * @param {HTMLDivElement} $block
 */
function padCards($block) {
  const existing = $block.querySelectorAll(':scope > div.card');
  if (existing.length % 2) {
    $block.append(createTag('div', { class: 'card pad-card' }));
  }
}

/**
 * @param {HTMLDivElement} $block
 */
function decorateCardsBase($block) {
  $block.classList.add('cards');
  $block.querySelectorAll(':scope>div').forEach(($card) => {
    $card.classList.add('card');
    const $cardDivs = [...$card.children];
    $cardDivs.forEach(($div) => {
      if ($div.querySelector('img')) {
        $div.classList.add('card-image');
      } else {
        $div.classList.add('card-content');
      }
      const $a = $div.querySelector('a');
      if ($a && $a.textContent.startsWith('https://')) {
        const $wrapper = createTag('a', { href: $a.href, class: 'card' });
        $a.remove();
        $wrapper.innerHTML = $card.innerHTML;
        $block.replaceChild($wrapper, $card);
      }
    });
  });
}

/**
 * @param {HTMLDivElement} $block
 */
function groupButtons($block) {
  $block.querySelectorAll(':scope>div').forEach(($card) => {
    const btns = [...$card.querySelectorAll('.button-container')];
    const first = btns.shift();
    if (!first) {
      return;
    }

    const wrapper = createTag('div', { class: 'button-row' });
    first.replaceWith(wrapper);
    wrapper.append(first);

    btns.forEach((btn) => {
      btn.remove();
      wrapper.append(btn);
    });
  });
}

/**
 * @param {HTMLDivElement} $block
 */
export default async function decorate($block) {
  const conf = readBlockConfig($block);
  $block.querySelectorAll(':scope > div').forEach(($row) => {
    if ($row.childElementCount === 2) {
      $row.remove();
    }
  });

  decorateCardsBase($block);

  // apply default variants
  $block.classList.add('branded', 'flat', 'large', 'bleed', 'stagger');

  // wrap icons with links from config, if any
  if (Object.keys(conf).length) {
    $block.querySelectorAll(':scope img.icon').forEach((icon) => {
      const alt = icon.getAttribute('alt');
      if (conf[alt]) {
        icon.parentElement.classList.add('button-container', 'icon-button');
        const link = createTag('a', { href: conf[alt] });
        icon.replaceWith(link);
        link.append(icon);
      }
    });
  }

  if ($block.classList.contains('branded')) {
    brandHeaders($block);
  }

  if ($block.classList.contains('bleed')) {
    const imCards = $block.querySelectorAll('.card-image');
    imCards.forEach((imCard) => {
      const pic = imCard.querySelector(':scope > p:last-of-type picture');
      if (!pic) return;

      const parent = pic.parentElement;
      if (parent.childElementCount === 1) {
        const wrapper = createTag('div', { class: 'bleed__c' });
        parent.replaceWith(wrapper);
        wrapper.append(parent);
      }
    });
  }

  if ($block.classList.contains('stagger')) {
    padCards($block);
  }

  prependDownloadIcon($block);

  groupButtons($block);
}
