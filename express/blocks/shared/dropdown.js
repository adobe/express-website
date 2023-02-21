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

import {
  createTag, getIconElement,
  loadCSS,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

function buildButton($button, $options, option) {
  $button.innerHTML = '';

  if (option.text) {
    const $text = createTag('span', { class: 'dropdown-button-text' });
    $text.textContent = option.text;
    $button.append($text);

    if (option.icon) {
      const $icon = option.icon.cloneNode(true);
      $icon.classList.add('dropdown-button-icon');
      $text.prepend($icon);
    }

    $button.append(getIconElement('drop-down-arrow'));

    $button.addEventListener('click', (e) => {
      e.preventDefault();

      $options.classList.add('active');
    });
  }
}

function buildOptions($button, $options, options, callback) {
  options.forEach((option) => {
    const $option = createTag('div', { class: 'dropdown-option' });

    if (option.icon) {
      const $icon = option.icon.cloneNode(true);
      $icon.classList.add('dropdown-option-icon');
      $option.append($icon);
    }

    if (option.text) {
      const $text = createTag('span', { class: 'dropdown-option-text' });
      $text.textContent = option.text;
      $option.append($text);
    }

    if (option.value) {
      $option.dataset.value = option.value;
    }

    $option.addEventListener('click', (e) => {
      e.preventDefault();

      buildButton($button, $options, option);

      if (typeof callback === 'function') {
        callback(option);
      }

      $options.classList.remove('active');
    });

    $options.append($option);
  });

  $options.append(getIconElement('drop-down-arrow'));

  document.body.addEventListener('click', (e) => {
    if (!e.target.classList.contains('dropdown-button') && !e.target.classList.contains('dropdown-button-text') && !e.target.classList.contains('dropdown-button-icon')) {
      if ($options.classList.contains('active')) {
        $options.classList.remove('active');
      }
    }
  });
}

// eslint-disable-next-line import/prefer-default-export
export function buildDropdown(options, attrs = null, callback) {
  if (!Array.isArray(options)) return null;
  if (typeof callback !== 'function') return null;

  loadCSS('/express/blocks/shared/dropdown.css', null);

  const $dropdown = createTag('div', { class: 'dropdown' });
  const $button = createTag('div', { class: 'dropdown-button' });
  const $options = createTag('div', { class: 'dropdown-options' });

  buildOptions($button, $options, options, callback);
  buildButton($button, $options, options[0]);

  $dropdown.append($button);
  $dropdown.append($options);

  if (typeof attrs === 'object') {
    for (const [key, value] of Object.entries(attrs)) {
      $dropdown.setAttribute(key, value);
    }
  }

  return $dropdown;
}
