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

const CARD_WIDTH = 157;
const CARD_HEIGHT = 313;
const CARD_GAP = 16;
const V_MARGIN = 120;

const DESKTOP_CARD_ENDPOINTS = [
  { start: -145, end: 700 },
  { start: -185, end: 395 },
  { start: -90, end: 97 },
  { start: -85, end: 258 },
  { start: -90, end: 427 },
  { start: -185, end: 720 },
  { start: -145, end: 600 },
];

const RANGES = DESKTOP_CARD_ENDPOINTS.map((c) => Math.abs(c.start) + Math.abs(c.end));

function initScrollAnimationMobile($block) {
  const docHeight = window.innerHeight;
  const docWidth = window.innerWidth;
  const docTargetY = (docHeight / 10) * 9;
  const container = $block.parentElement;

  window.container = container;
  window.block = $block;

  document.addEventListener('scroll', () => {
    const blockPosition = $block.getBoundingClientRect();
    if (blockPosition.top > docHeight || blockPosition.bottom < 0) {
      return;
    }
    const blockHeight = $block.clientHeight;
    container.style.height = `${blockHeight + 160}px`;
    $block.classList.add('animating');

    // offset % from center of block to center of view
    const blockMidY = (blockPosition.bottom - blockHeight / 2);
    const offset = (docTargetY - blockMidY) / (docHeight - blockHeight);
    const totalScroll = $block.offsetWidth - docWidth;
    const scrollPosition = (totalScroll / 50) * (offset * 100);
    if (scrollPosition <= totalScroll && scrollPosition >= 100) {
      $block.style.left = `-${(totalScroll / 50) * (offset * 100)}px`;
    } else if (scrollPosition > totalScroll) {
      $block.style.left = `-${totalScroll}px`;
    } else if (scrollPosition < 100) {
      $block.style.left = '0px';
    }
  }, { passive: true });
}

/**
 * @param {HTMLDivElement} $block
 */
function initScrollAnimationDesktop($block) {
  const docHeight = window.innerHeight;
  const docTargetY = (docHeight / 10) * 7; // 70% down the page
  const container = $block.parentElement;

  const screens = $block.querySelectorAll(':scope > div.card');
  const leftPad = (window.innerWidth - ((CARD_GAP + CARD_WIDTH) * screens.length + CARD_GAP)) / 2;

  screens.forEach((screen, i) => {
    const left = (CARD_GAP + CARD_WIDTH) * i + CARD_GAP;
    const limit = DESKTOP_CARD_ENDPOINTS[i];
    screen.style.top = `${limit.start}px`;
    screen.style.left = `${left + leftPad}px`;
    screen.style.margin = '0';
    screen.style.position = 'absolute';
  });

  document.addEventListener('scroll', () => {
    const blockPosition = $block.getBoundingClientRect();
    if (blockPosition.top > docHeight || blockPosition.bottom < 0) {
      return;
    }
    const blockHeight = $block.clientHeight;

    // offset % from center of block to center of view
    const blockMidY = (blockPosition.bottom - blockHeight / 2);
    // multiplier to extend animation during entire scroll, not to complete while block is in view
    // goal was to have the scroll effect continue for entire duration, never see it end
    const mult = 5;
    const offset = (docTargetY - blockMidY) / ((docHeight - blockHeight) * mult);
    const containerHLimit = (container.clientHeight - CARD_HEIGHT - V_MARGIN - 1);

    screens.forEach((screen, i) => {
      const limit = DESKTOP_CARD_ENDPOINTS[i];
      const absRange = RANGES[i];
      const margin = absRange * offset;

      if (margin < limit.start) {
        screen.style.top = `${limit.start}px`;
      } else if (margin >= containerHLimit && containerHLimit < limit.end) {
        screen.style.top = `${containerHLimit}px`;
      } else if (margin >= limit.end) {
        screen.style.top = `${limit.end}px`;
      } else {
        screen.style.top = `${margin}px`;
      }
    });
  }, { passive: true });
}

function isMobileUserAgent() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return true;
  }

  if (/android/i.test(userAgent)) {
    return true;
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return true;
  }

  return false;
}

function isMobileLike() {
  return (document.body.dataset.device === 'mobile'
  || window.screen.width < 1200
  || window.innerWidth < 1200
  || isMobileUserAgent());
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
 * @param {string} heightStr
 */
function applyHeight($block, heightStr) {
  const height = Number.parseInt(heightStr, 10);
  if (Number.isNaN(height)) return;

  $block.style.height = `${height + CARD_HEIGHT}px`;
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
  $block.classList.add('scroll');
  $block.parentElement.classList.add('scroll');

  if (document.body.dataset.device === 'mobile' || window.screen.width < 900 || isMobileLike()) {
    initScrollAnimationMobile($block);
  } else {
    if (conf.height) {
      applyHeight($block, conf.height);
    }
    initScrollAnimationDesktop($block);
  }
}
