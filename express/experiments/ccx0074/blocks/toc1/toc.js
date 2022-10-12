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
import {
  getLottie,
} from '../../../../scripts/scripts.js';

import {
  addAppStoreButton,
  attachEventListeners,
  fixIcons,
  toggleToc,
} from '../../../../blocks/toc/utils.js';

export default async function decorate($block) {
  const iconHTML = getLottie('arrow-down', '/express/icons/purple-arrows.json');
  const toggle = document.querySelector('.default-content-wrapper .button.accent');
  toggle.classList.remove('accent');
  toggle.href = '#toc';
  toggle.target = '';
  toggle.innerHTML += iconHTML;

  [...$block.children].forEach((div) => {
    const wrapper = div.children.item(1);
    const child = wrapper.children.length ? wrapper.children.item(0) : null;
    if (child.nodeName === 'A') {
      child.className = '';
      child.removeAttribute('target');
      child.addEventListener('click', () => {
        toggleToc(toggle, $block, false);
      });
    } else if (child.nodeName === 'H2') {
      child.classList.add('toc-heading');
    }
  });

  const $close = document.createElement('a');
  $close.classList.add('button');
  $close.classList.add('toc-close');
  $close.href = '#toc';
  $close.innerText = 'Close';
  $close.innerHTML += iconHTML;
  $block.append($close);

  attachEventListeners($block, toggle, $close);
  await fixIcons($block);
  addAppStoreButton($block);
}
