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
/* eslint-disable import/named, import/extensions */

import {
  createTag,
  readBlockConfig,
} from '../../scripts/scripts.js';

function addPages(index, config, $block) {
  const $images = createTag('div', { class: 'page-list-images' });
  const $additional = createTag('div', { class: 'page-list-additional' });
  $block.appendChild($images);
  $block.appendChild($additional);

  const images = [];

  index.forEach((page) => {
    if (page.path.includes(config.filter)) {
      const { path, image, title } = page;
      if (!images.includes(image) && (images.length < +config.images)) {
        const $card = createTag('div', { class: 'card' });
        $card.innerHTML = `<div class="card-image">
              <img loading="lazy" src="${image.replace('width=2000', 'width=750')}">
            </div>
            <div class="card-body">
              <h3>${title}</h3>
            </div>`;
        $card.addEventListener('click', () => {
          window.location.href = path;
        });
        $images.appendChild($card);
        images.push(image);
      } else {
        const $p = createTag('p');
        $p.innerHTML = `<a href="${path}">${title}</a>`;
        $additional.appendChild($p);
      }
    }
  });
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
  const index = await fetchIndex();
  addPages(index, config, $block);
}

export default function decorate($block) {
  decoratePageList($block);
}
