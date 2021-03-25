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
} from '../../scripts/scripts.js';

function addPages(index, config, $block) {
  const $ul = createTag('ul');
  index.forEach((page) => {
    if (page.path.includes(config.filter)) {
      const { path, shortTitle } = page;
      const $p = createTag('li');
      $p.innerHTML = `<a href="${path}">${shortTitle}</a>`;
      $ul.appendChild($p);
    }
  });
  $block.appendChild($ul);
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
  /*
  const locale = getLocale();
  const indexURL = locale === 'en' ? '/express/query-index.json' : `/${locale}/query-index.json`;
  */

  const indexURL = '/express/dev-query-index.json';
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
  $block.innerHTML = '';

  const $browse = createTag('button', { class: 'page-list-browse-button hidden' });
  $browse.innerHTML = config.label;
  $block.appendChild($browse);
  const $section = $block.closest('.section-wrapper');
  $section.parentNode.insertBefore($browse, $section);

  // shorten hero
  const $hero = document.querySelector('.hero');
  $hero.classList.add('hero-short');

  const $flex = document.querySelector('main .page-list-container > div');
  $flex.style.height = `${(window.innerHeight - $hero.offsetHeight)}px`;

  // get $tlc
  const $tlc = document.querySelector('.template-list-container');
  const $ptl = $tlc.firstChild;
  $ptl.classList.add('page-template-list');
  $block.parentNode.appendChild($ptl);
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
  window.addEventListener('resize', () => {
    showHide($block, $ptl);
  });

  const index = await fetchIndex();
  index.sort((e1, e2) => e1.shortTitle.localeCompare(e2.shortTitle));
  addPages(index, config, $block);
}

export default function decorate($block) {
  decoratePageList($block);
}
