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
/* global */

import {
  createTag,
} from '../../scripts/scripts.js';

function invertContainer($container, $button) {
  const dark = $button.classList.contains('dark');
  const $block = $container.parentElement;
  $block.style.backgroundColor = dark ? '#000' : 'transparent';
  $block.style.color = dark ? '#FFF' : 'currentColor';
}

function addButtonGroup($button, title, options) {
  const $container = createTag('div');
  $container.textContent = `${title}: `;
  let selected = '';
  options.forEach((opt) => {
    const $label = createTag('label', { for: opt });
    $label.textContent = opt;
    const $radio = createTag('input', { type: 'radio', id: opt });
    $radio.addEventListener('click', ({ target }) => {
      if (opt === 'none') {
        options.forEach((o) => $button.classList.remove(o));
      } else if (selected) {
        $button.classList.replace(selected, opt);
      } else if (!$button.classList.contains(opt)) {
        $button.classList.add(opt);
      }
      selected = opt !== 'none' ? opt : '';
      invertContainer($container, $button);
      // reset other radio buttons
      $container.querySelectorAll('input').forEach((radio) => {
        radio.checked = radio === target;
      });
    });
    // select the first one
    $container.append($radio);
    $container.append($label);
  });
  return $container;
}

export default function decorate($block) {
  const $button = $block.querySelector(':scope a.button');

  $block.append(addButtonGroup($button, 'Types', [
    'accent',
    'primary',
    'secondary',
  ]));

  $block.append(addButtonGroup($button, 'Sizes', [
    'small',
    'medium',
    'large',
    'xlarge',
  ]));

  $block.append(addButtonGroup($button, 'Variants', [
    'none',
    'light',
    'dark',
  ]));
}
