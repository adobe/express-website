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

/* global window fetch */
import {
  createTag,
  getLocale,
  normalizeHeadings,
  decorateButtons,
  fixIcons,
} from '../../scripts/scripts.js';

const PROMOTION_FOLDER = 'drafts/alex';

async function fetchPromotion(name) {
  const locale = getLocale(window.location);
  const promoURL = `${locale === 'us' ? '' : locale}/${PROMOTION_FOLDER}/${name}.plain.html`;
  const resp = await fetch(promoURL);
  const html = await resp.text();
  return html;
}

export default async function decorate($block) {
  const name = $block.textContent;
  const html = await fetchPromotion(name);

  const div = createTag('div');
  div.innerHTML = html;

  normalizeHeadings(div, ['h2', 'h3']);

  const h2 = div.querySelector('h2');

  const containerDiv = createTag('div', { class: 'promotion-wrapper' });

  const heroPicture = div.querySelector('picture');
  if (heroPicture) {
    const p = heroPicture.parentNode;
    const heroDiv = createTag('div', { class: 'promotion-hero' });
    heroDiv.append(heroPicture);

    containerDiv.append(heroDiv);
    p.remove();
  }

  const contentDiv = createTag('div', { class: 'promotion-content' });
  contentDiv.append(div.firstChild);

  containerDiv.append(contentDiv);

  $block.innerHTML = '';
  $block.append(h2);
  $block.append(containerDiv);

  decorateButtons($block);
  fixIcons($block);

  // apply primary light button styles
  $block.querySelectorAll('.button.accent').forEach((b) => {
    b.classList.remove('accent');
    b.classList.add('primary');
    b.classList.add('light');
  });
}
