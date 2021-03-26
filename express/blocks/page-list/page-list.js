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
/* global window document fetch */
/* eslint-disable import/named, import/extensions */

import {
  createTag,
  readBlockConfig,
  getLocale,
} from '../../scripts/scripts.js';

function addPages(index, config, $block) {
  const $ul = createTag('ul');
  index.forEach((page) => {
    if (page.path.includes(config.filter)) {
      const { path, shortTitle } = page;
      const $p = createTag('li');
      $p.innerHTML = `<a href="${path.split('.')[0]}">${shortTitle}</a>`;
      $ul.appendChild($p);
    }
  });
  $block.appendChild($ul);
}

function setSize($cols, $flex, $hero) {
  const minWidth = 260;
  const w = $cols.parentNode.offsetWidth;
  $cols.style.width = `${Math.floor(w / minWidth) * minWidth}px`;
  $flex.style.height = `${(window.innerHeight - $hero.offsetHeight)}px`;
}

function showHide($block, $ptl) {
  if (window.innerWidth < 600) {
    $block.classList.add('hidden');
    $ptl.classList.remove('hidden');
  } else {
    $block.classList.remove('hidden');
    $ptl.classList.remove('hidden');
  }
}

async function fetchIndex() {
  const locale = getLocale(window.location);
  const indexURL = locale === 'us' ? '/express/query-index.json' : `/${locale}/query-index.json`;
  try {
    const resp = await fetch(indexURL);
    const json = await resp.json();
    // eslint-disable-next-line no-console
    console.log(`${indexURL}: ${json.data.length}`);
    return (json.data);
  } catch (e) {
    // something went wrong
    return ([]);
  }
}

async function decoratePageList($block) {
  const config = readBlockConfig($block);

  // shorten hero
  const $hero = document.querySelector('.hero');
  $hero.classList.add('hero-short');

  const $flex = document.querySelector('main .page-list-container > div');

  $flex.innerHTML = `
  <div class="page-list-left">
    <div class="page-list block">
      <ul class="page-list-ul">
      </ul>
    </div>
  </div>
  <div class="page-list-right">
  </div>
  `;

  // eslint-disable-next-line no-param-reassign
  $block = $flex.querySelector('.page-list');

  const $browse = createTag('button', { class: 'page-list-browse-button hidden' });
  $browse.innerHTML = config.label;
  const $section = $block.closest('.section-wrapper');
  $section.parentNode.insertBefore($browse, $section);

  // get $tlc
  const $tlc = document.querySelector('.template-list-container');
  const $ptl = $tlc.firstChild;
  $ptl.classList.add('page-template-list');
  $flex.querySelector('.page-list-right').appendChild($ptl);
  $tlc.remove();

  $browse.addEventListener('click', () => {
    if ($block.classList.contains('hidden')) {
      $block.classList.remove('hidden');
      $ptl.classList.add('hidden');
    } else {
      $ptl.classList.remove('hidden');
      $block.classList.add('hidden');
    }
  });

  showHide($block, $ptl);
  setSize($ptl, $flex, $hero);
  window.addEventListener('resize', () => {
    showHide($block, $ptl);
    setSize($ptl, $flex, $hero);
  });

  const index = await fetchIndex();
  const shortIndex = index.filter((e) => e.shortTitle);
  shortIndex.sort((e1, e2) => e1.shortTitle.localeCompare(e2.shortTitle));
  addPages(shortIndex, config, $block);
  $section.classList.add('appear');
  $block.classList.add('appear');
}

export default function decorate($block) {
  decoratePageList($block);
}
