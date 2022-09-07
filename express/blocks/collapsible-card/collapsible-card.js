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

import { createTag, getIconElement } from '../../scripts/scripts.js';

function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

function toggleCollapsibleCard($block) {
  $block.classList.toggle('expanded');
  $block.classList.remove('initial-expansion');
  const $divs = $block.querySelectorAll(':scope > div');
  const $childDiv = $divs[$divs.length - 1].querySelector('div');

  setTimeout(() => {
    if ($block.classList.contains('expanded')) {
      $divs[$divs.length - 1].style.maxHeight = `${$childDiv.offsetHeight}px`;
    } else {
      $divs[$divs.length - 1].style.maxHeight = '0px';
    }
  }, 100);
}

function initToggleState($block) {
  $block.classList.add('expanded');
  $block.classList.add('initial-expansion');
  const $divs = $block.querySelectorAll(':scope > div');
  $divs[$divs.length - 1].style.maxHeight = '600px';

  setTimeout(() => {
    if ($block.classList.contains('initial-expansion')) {
      toggleCollapsibleCard($block);
    }
  }, 10000);
}

function decorateToggleButton($block) {
  const $toggleButton = createTag('div', { class: 'toggle-button' });
  $toggleButton.append(getIconElement('plus'));

  $block.prepend($toggleButton);

  $toggleButton.addEventListener('click', () => {
    toggleCollapsibleCard($block);
  });
}

function decorateBadge($block) {
  const $anchors = $block.querySelectorAll('a');
  const OS = getMobileOperatingSystem();

  if ($anchors.length > 0) {
    const $parent = $anchors[0].closest('div');
    $parent.classList.add('badge-container');
  }

  if ($anchors.length === 1) {
    $anchors[0].textContent = '';
    $anchors[0].classList.add('badge');
    if (OS === 'iOS') {
      $anchors[0].append(getIconElement('apple-store'));
    } else if (OS === 'Windows') {
      $anchors[0].append(getIconElement('google-store'));
    }
  } else if ($anchors.length === 2) {
    for (let i = 0; i < $anchors.length; i += 1) {
      $anchors[i].textContent = '';
      $anchors[i].classList.add('badge');
    }

    if (OS === 'iOS') {
      $anchors[0].append(getIconElement('apple-store'));
      $anchors[1].parentElement.remove();
    } else if (OS === 'Android') {
      $anchors[0].append(getIconElement('google-store'));
      $anchors[1].parentElement.remove();
    } else if (OS === 'Windows') {
      $anchors[0].append(getIconElement('microsoft-store'));
      $anchors[1].parentElement.remove();
    } else {
      $anchors[0].append(getIconElement('google-store'));
      $anchors[1].append(getIconElement('microsoft-store'));
    }
  } else {
    $block.innerHTML = '';
    const $alert = createTag('strong');
    $alert.textContent = 'The second row of the collapsible card block takes at least 1 link, and at most 2 links. The links are used to populate the store badges.';
  }
}

export default function decorate($block) {
  decorateBadge($block);
  decorateToggleButton($block);

  initToggleState($block);
}
