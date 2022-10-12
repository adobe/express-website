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
  toClassName,
  getIconElement as genericGetIconElement,
} from '../../scripts/scripts.js';

export function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

function getIcon(icons, alt) {
  // eslint-disable-next-line no-param-reassign
  icons = Array.isArray(icons) ? icons : [icons];
  const [defaultIcon, mobileIcon] = icons;
  const icon = (mobileIcon && window.innerWidth < 600) ? mobileIcon : defaultIcon;
  const iconName = icon;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-${icon}">
    ${alt ? `<title>${alt}</title>` : ''}
    <use href="/express/blocks/toc/toc-sprite.svg#${iconName}"></use>
  </svg>`;
}

function getIconElement(icons, alt) {
  const $div = document.createElement('div');
  $div.innerHTML = getIcon(icons, alt);
  return ($div.firstChild);
}

export async function fixIcons(block = document) {
  block.querySelectorAll('img').forEach(($img) => {
    const alt = $img.getAttribute('alt');
    if (!alt) {
      return;
    }

    const lowerAlt = alt.toLowerCase();
    if (!lowerAlt.includes('icon:')) {
      return;
    }

    const [icon, mobileIcon] = lowerAlt
      .split(';')
      .map((i) => (i ? toClassName(i.split(':')[1].trim()) : null));

    const $picture = $img.closest('picture');
    const $icon = getIconElement([icon, mobileIcon], alt);
    $picture.parentElement.replaceChild($icon, $picture);
  });
}

export function toggleToc(toggle, block, status) {
  const s = status === undefined ? !block.parentElement.parentElement.classList.contains('open') : status;
  toggle.style.display = s ? 'none' : 'block';
  block.parentElement.parentElement.classList.toggle('open', s);
}

export function attachEventListeners($block, $toggle, $close) {
  $block.parentElement.addEventListener('click', (ev) => {
    if (ev.target === $block.parentElement) {
      toggleToc($toggle, $block, false);
    }
  });
  $toggle.addEventListener('click', () => {
    toggleToc($toggle, $block);
  });
  $close.addEventListener('click', () => {
    toggleToc($toggle, $block, false);
  });
}

export function addAppStoreButton($block) {
  const $icon = $block.querySelector('.icon-dl');
  if (!$icon) {
    return;
  }
  const os = getMobileOperatingSystem();
  const $button = document.createElement('a');
  const $container = $icon.parentElement.parentElement.children;
  $button.href = $container.item(0).href;
  $button.title = $container.item(0).title;
  $container.item(1).append($button);
  if (os === 'iOS') {
    $button.append(genericGetIconElement('apple-store'));
  } else {
    $button.append(genericGetIconElement('google-store'));
  }
}
