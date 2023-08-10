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
  fetchRelevantRows,
  normalizeHeadings,
} from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

async function loadSpreadsheetData($block, relevantRowsData) {
  const $default = $block.querySelector('.button-container');
  const $defaultParent = $default.parentElement;

  relevantRowsData.linkListCategories.split('\n').forEach((listData) => {
    const list = listData.split(',');
    const $list = $default.cloneNode(true);

    $list.innerHTML = $list.innerHTML.replaceAll('Default', list[0].trim());
    $list.innerHTML = $list.innerHTML.replace('/express/templates/default', list[1].trim());

    $defaultParent.append($list);
  });

  $default.remove();

  if (relevantRowsData.linkListTitle) {
    $block.innerHTML = $block.innerHTML.replaceAll('link-list-title', relevantRowsData.linkListTitle.trim());
  }
}

export default async function decorate($block) {
  if ($block.classList.contains('spreadsheet-powered')) {
    const relevantRowsData = await fetchRelevantRows(window.location.pathname);

    if (relevantRowsData && relevantRowsData.linkListCategories) {
      await loadSpreadsheetData($block, relevantRowsData);
    } else {
      $block.remove();
    }
  }

  normalizeHeadings($block, ['h3']);
  const links = [...$block.querySelectorAll('p.button-container')];
  if (links.length) {
    links.forEach((p) => {
      const link = p.querySelector('a');
      if (!$block.classList.contains('shaded')) {
        link.classList.add('secondary');
      }

      if ($block.classList.contains('shaded') && new URL(link.href).pathname === window.location.pathname) {
        link.classList.add('active');
      }

      link.classList.add('medium');
      link.classList.remove('accent');
    });
    const div = links[0].closest('div');
    const platformEl = document.createElement('div');
    platformEl.classList.add('link-list-platform');
    buildCarousel('p.button-container', div, false);
    div.append(platformEl);
  }

  if (window.location.href.includes('/express/templates/')) {
    const { default: updateAsyncBlocks } = await import('../../scripts/ckg-link-list.js');
    await updateAsyncBlocks();
  }
}
