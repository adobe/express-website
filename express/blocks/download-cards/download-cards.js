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
import { createTag, loadCSS } from '../../scripts/scripts.js';
import { prependDownloadIcon } from '../hero-3d/hero-3d.js';

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
export default async function decorate($block) {
  await extendBlock($block, 'cards');

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
        parent.classList.add('bleed__c');
      }
    });
  }

  if ($block.classList.contains('stagger')) {
    padCards($block);
  }

  prependDownloadIcon($block);
}
