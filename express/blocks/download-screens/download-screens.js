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
  console.debug('initScrollAnimationMobile()');

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
    container.scrollLeft = (totalScroll / 100) * (offset * 100);
  });
}

/**
 *
 * @param {HTMLDivElement} $block
 */
function initScrollAnimationDesktop($block) {
  console.debug('initScrollAnimationDesktop()');
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
    container.scrollLeft = (totalScroll / 100) * (offset * 100);
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
  || window.screen.width < 900
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
