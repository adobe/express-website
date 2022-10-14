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
      child.addEventListener('click', (ev) => {
        ev.stopPropagation();
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

  await fixIcons($block);
  addAppStoreButton($block);
  attachEventListeners($block, $toggle, $close);

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'class' && mutation.target.classList.contains('feds-header-wrapper--retracted')) {
        $block.parentElement.parentElement.classList.toggle('sticky', true);
      } else {
        $block.parentElement.parentElement.classList.toggle('sticky', false);
      }
    }
  });

  // Start observing the target node for configured mutations
  const header = document.querySelector('header');
  if (header.classList.contains('feds-header-wrapper')) {
    $block.parentElement.parentElement.classList.add('feds');
    observer.observe(header, { attributes: true });
  } else {
    $block.parentElement.parentElement.classList.add('no-feds');
    let lastPosition = 0;
    const threshold = document.querySelector('header').offsetHeight + 6;
    document.addEventListener('scroll', () => {
      if ($block.parentElement.parentElement.classList.add('feds')) {
        return;
      }
      if (header.classList.contains('feds-header-wrapper')) {
        $block.parentElement.parentElement.classList.remove('no-feds');
        $block.parentElement.parentElement.classList.add('feds');
        observer.observe(header, { attributes: true });
        return;
      }
      if (document.documentElement.scrollTop > threshold && lastPosition <= threshold) {
        $block.parentElement.parentElement.classList.toggle('sticky', true);
      } else if (document.documentElement.scrollTop <= threshold && lastPosition > threshold) {
        $block.parentElement.parentElement.classList.toggle('sticky', false);
      }
      lastPosition = document.documentElement.scrollTop;
    });
  }
}
