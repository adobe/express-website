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
/* global window fetch document */

import {
  getLocale,
  createTag,
} from '../../scripts/scripts.js';

async function fetchBlueprint(pathname) {
  if (window.spark.$blueprint) {
    return (window.spark.$blueprint);
  }

  const bpPath = pathname.substr(pathname.indexOf('/', 1)).split('.')[0];
  const resp = await fetch(`${bpPath}.plain.html`);
  // eslint-disable-next-line no-console
  console.log(`fetching...${bpPath}`);
  const body = await resp.text();
  const $main = createTag('main');
  $main.innerHTML = body;
  window.spark.$blueprint = $main;
  return ($main);
}

async function decorateTemplateList($block) {
  const rows = $block.children.length;
  const locale = getLocale(window.location);

  $block.querySelectorAll('div > div:first-of-type a').forEach(($a) => {
    const $parent = $a.closest('div');
    $a.remove();
    const picture = $parent.innerHTML;
    $parent.innerHTML = '';
    $parent.appendChild($a);
    $a.innerHTML = picture;
    $a.className = '';
  });

  if (rows === 0 && locale !== 'en-US') {
    const tls = Array.from($block.closest('main').querySelectorAll('.template-list'));
    const i = tls.indexOf($block);

    // eslint-disable-next-line no-await-in-loop
    const $blueprint = await fetchBlueprint(window.location.pathname);

    const $bpBlock = $blueprint.querySelectorAll('.template-list')[i];
    if ($bpBlock) {
      $block.innerHTML = $bpBlock.innerHTML;
    }

    const $heroPicture = document.querySelector('.hero-bg');

    if (!$heroPicture && window.spark.$blueprint) {
      const $bpHeroImage = window.spark.$blueprint.querySelector('div:first-of-type img');
      if ($bpHeroImage) {
        const $heroSection = document.querySelector('main .hero');
        const $heroDiv = document.querySelector('main .hero > div');
        const $p = createTag('p');
        const $pic = createTag('picture', { class: 'hero-bg' });
        $pic.appendChild($bpHeroImage);
        $p.append($pic);

        $heroSection.classList.remove('hero-noimage');
        $heroDiv.prepend($p);
      }
    }
  }
}

export default function decorate($block) {
  decorateTemplateList($block);
}
