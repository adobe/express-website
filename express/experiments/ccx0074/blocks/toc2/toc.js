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
  getCloseButton,
  getIconElement,
  getToggleButton,
  toggleToc,
} from '../../../../blocks/toc/utils.js';

export default async function decorate($block) {
  const iconHTML = getLottie('arrow-down', '/express/icons/arrow-down.json');
  const $toggle = getToggleButton();
  $toggle.innerHTML = iconHTML + $toggle.innerHTML;

  [...$block.children].forEach((div) => {
    const wrapper = div.children.item(1);
    const child = wrapper.children.length ? wrapper.children.item(0) : null;
    if (child.nodeName === 'A') {
      child.classList.remove('accent');
      child.removeAttribute('target');
      child.addEventListener('click', () => {
        toggleToc($toggle, $block, false);
      });
    } else if (child.nodeName === 'H2') {
      child.classList.add('toc-heading');
      child.innerHTML = iconHTML + child.innerHTML;
    }
  });

  const $closeIcon = getIconElement(['close'], 'Icon: Close');
  const $close = getCloseButton();
  $close.innerHTML = $closeIcon.outerHTML + $close.innerHTML;
  $block.append($close);

  attachEventListeners($block, $toggle, $close);
  await fixIcons($block);
  addAppStoreButton($block);
}
