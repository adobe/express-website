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

/**
 * @param {HTMLDivElement} $block
 */
export default async function decorate($block) {
  await extendBlock($block, 'cards');
}
