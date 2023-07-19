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
  createTag,
  getLocale,
  normalizeHeadings,
  decorateButtons,
  fixIcons,
  toClassName,
  createOptimizedPicture,
} from '../../scripts/scripts.js';

const PROMOTION_FOLDER = 'express/promotions';

async function fetchPromotion(name) {
  const locale = getLocale(window.location);
  const promoURL = `${locale === 'us' ? '' : `/${locale}`}/${PROMOTION_FOLDER}/${toClassName(name)}.plain.html`;
  const resp = await fetch(promoURL);
  if (resp.ok) {
    const html = await resp.text();
    return html;
  }
  return null;
}

export default async function decorate($block) {
  const name = $block.textContent.trim();
  if (!name) return;

  const html = await fetchPromotion(name);
  if (html) {
    const div = createTag('div');
    div.innerHTML = html;

    normalizeHeadings(div, ['h2', 'h3']);

    const h2 = div.querySelector('h2');

    const containerDiv = createTag('div', { class: 'promotion-wrapper' });

    containerDiv.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const heroPicture = div.querySelector('picture');
    if (heroPicture) {
      const img = heroPicture.querySelector('img');
      const newPicture = createOptimizedPicture(img.src, img.alt, false);
      const p = heroPicture.parentNode;
      p.replaceChild(newPicture, heroPicture);

      const heroDiv = createTag('div', { class: 'promotion-hero' });
      heroDiv.append(newPicture);

      containerDiv.append(heroDiv);
      p.remove();
    }

    const contentDiv = createTag('div', { class: 'promotion-content' });
    contentDiv.append(div.firstElementChild);

    containerDiv.append(contentDiv);

    $block.innerHTML = '';
    if (h2) $block.append(h2);
    $block.append(containerDiv);

    decorateButtons($block);
    fixIcons($block);

    // apply primary light button styles
    $block.querySelectorAll('.button.accent').forEach((b) => {
      b.classList.remove('accent');
      b.classList.add('primary');
      b.classList.add('light');
    });
  } else {
    $block.innerHTML = '';
  }

  const $links = $block.querySelectorAll('a');

  if ($links) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: $links });
    document.dispatchEvent(linksPopulated);
  }
}
