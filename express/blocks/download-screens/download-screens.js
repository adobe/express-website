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

  const $contentWrapper = $block.querySelector('.content-wrapper');
  const $highlightsPlatform = $block.querySelector('.highlights-platform');

  $contentWrapper.style.transform = 'scale(1.2)';
  document.addEventListener('scroll', () => {
    const blockPosition = $block.getBoundingClientRect();
    const blockInViewPercent = (1 - blockPosition.top / blockPosition.height) * 100;
    const blockTopToEdge = Math.round((blockPosition.top / window.innerHeight) * 100);

    if (blockTopToEdge <= 100 && blockTopToEdge >= 30) {
      $contentWrapper.style.transform = `scale(${1 + ((blockTopToEdge - 30) * (0.2 / 70))})`;
    }

    if (blockInViewPercent <= 100 && blockInViewPercent >= 75) {
      const totalScroll = $highlightsPlatform.scrollWidth - window.innerWidth;
      $highlightsPlatform.scrollLeft = (totalScroll / 25) * (blockInViewPercent - 75);
    }
  });
}

function initScrollAnimationDesktop($block) {
  console.debug('initScrollAnimationDesktop()');
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
