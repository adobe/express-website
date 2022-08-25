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
import { loadCSS } from '../../scripts/scripts.js';

const CARD_WIDTH = 157;
const CARD_HEIGHT = 313;
const CARD_GAP = 16;

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

/**
 * Load block as base
 * @param {HTMLDivElement} block
 * @param {string} blockName
 */
async function extendBlock(block, blockName) {
  const cssPath = `/express/blocks/${blockName}/${blockName}.css`;
  const jsPath = `/express/blocks/${blockName}/${blockName}.js`;

  block.classList.add(blockName);

  try {
    const cssLoaded = new Promise((resolve) => {
      loadCSS(cssPath, resolve);
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(jsPath);
          if (mod.default) {
            await mod.default(block, blockName, document, true);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${blockName}`, err);
        }
        resolve();
      })();
    });
    await Promise.all([cssLoaded, decorationComplete]);
  } catch (e) {
    console.error('failed to load extended block: ', e);
  }
}

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

    // offset % from center of block to center of view
    const blockMidY = (blockPosition.bottom - blockHeight / 2);
    const offset = (docTargetY - blockMidY) / (docHeight - blockHeight);
    const totalScroll = $block.scrollWidth - docWidth;
    container.scrollLeft = (totalScroll / 50) * (offset * 100);
  });
}

/**
 *
 * @param {HTMLDivElement} $block
 */
function initScrollAnimationDesktop($block) {
  const docHeight = window.innerHeight;
  const docTargetY = (docHeight / 10) * 6; // 60% down the page
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
    requestAnimationFrame(() => {
      const blockPosition = $block.getBoundingClientRect();
      if (blockPosition.top > docHeight || blockPosition.bottom < 0) {
        return;
      }
      const blockHeight = $block.clientHeight;

      // offset % from center of block to center of view
      const blockMidY = (blockPosition.bottom - blockHeight / 2);
      const offset = (docTargetY - blockMidY) / (docHeight - blockHeight);
      const containerHLimit = (container.clientHeight - CARD_HEIGHT) / 2;

      screens.forEach((screen, i) => {
        const limit = DESKTOP_CARD_ENDPOINTS[i];
        const absRange = RANGES[i];
        const margin = absRange * offset;

        if (margin < limit.start) {
          screen.style.top = `${limit.start}px`;
        } else if (margin > containerHLimit) {
          screen.style.top = `${containerHLimit}px`;
        } else if (margin > absRange) {
          screen.style.top = `${limit.end}px`;
        } else {
          screen.style.top = `${margin}px`;
        }
      });
    });
  });
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
export default async function decorate($block) {
  await extendBlock($block, 'cards');
  $block.parentElement.classList.add('scroll');

  if (document.body.dataset.device === 'mobile' || window.screen.width < 900 || isMobileLike()) {
    initScrollAnimationMobile($block);
  } else {
    initScrollAnimationDesktop($block);
  }
}
