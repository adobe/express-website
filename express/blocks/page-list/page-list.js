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
/* eslint-disable import/named, import/extensions */

import {
  createTag,
  readBlockConfig,
  getLocale,
  addPublishDependencies,
  loadCSS,
} from '../../scripts/scripts.js';

import {
  decorateTemplateList,
} from '../template-list/template-list.js';

async function fetchIndex(indexURL) {
  try {
    addPublishDependencies(indexURL);
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

async function fetchTemplates(path) {
  const resp = await fetch(`${path}.plain.html`);
  const html = await resp.text();
  const $div = createTag('div');
  $div.innerHTML = html;
  const $templateLists = $div.querySelectorAll('.template-list');
  const $templates = [];
  $templateLists.forEach(($tl) => {
    $templates.push(...$tl.children);
  });
  return $templates;
}
async function appendTemplates($row) {
  const $pages = [...$row.querySelectorAll('.page-list-category a')];
  loadCSS('/express/blocks/template-list/template-list.css');
  const $templates = [];
  let i = 0;
  while (($templates.length < 20) && (i < $pages.length)) {
    const path = new URL($pages[i].href).pathname;
    // eslint-disable-next-line no-await-in-loop
    const $pageTemplates = await fetchTemplates(path);
    $templates.push(...$pageTemplates);
    i += 1;
  }

  const $tlBlock = createTag('div', { class: 'template-list' });
  $templates.forEach(($template, j) => {
    if (j < 20) {
      $tlBlock.appendChild($template);
    }
  });
  $row.append($tlBlock);
  return decorateTemplateList($tlBlock);
}

async function outputPages(pages, $block) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        appendTemplates(entry.target);
        obs.unobserve(entry.target);
      }
    });
  });

  const $row = createTag('div', { class: 'page-list-row' });
  const $category = createTag('div', { class: 'page-list-category' });

  for (const page of pages) {
    const path = page.path.split('.')[0];
    const $page = createTag('a', { href: path });
    $page.innerHTML = page.shortTitle;
    $category.append($page);
    $category.append(document.createTextNode(' '));
  }

  $row.append($category);
  $block.append($row);
  observer.observe($row);
}

function addPages(pages, config, $block) {
  $block.innerHTML = '';
  $block.setAttribute('data-filter', config.filter);

  const filteredPages = pages.filter((page) => {
    const path = page.path.split('.')[0];
    const $existing = document.querySelector(`a[href="${path}"]`);
    if ($existing) {
      const $pageList = $existing.closest('.page-list');
      if ($pageList && $pageList.getAttribute('data-filter').length < config.filter.length) {
        $existing.remove();
        return true;
      } else {
        return false;
      }
    }
    return true;
  });

  outputPages(filteredPages, $block);
}

async function decoratePageList($block) {
  const $section = $block.closest('div.section-wrapper');
  const config = readBlockConfig($block);

  // shorten hero
  const $hero = document.querySelector('.hero');
  $hero.classList.add('hero-short');

  const locale = getLocale(window.location);
  const indexURL = locale === 'us' ? '/express/query-index.json' : `/${locale}/express/query-index.json`;
  const index = await fetchIndex(indexURL);
  const shortIndex = index.filter((e) => (e.shortTitle
    && e.path && e.path.includes(config.filter)));
  shortIndex.sort((e1, e2) => e1.shortTitle.localeCompare(e2.shortTitle));

  addPages(shortIndex, config, $block);
  $section.classList.add('appear');
  $block.classList.add('appear');
}

export default async function decorate($block) {
  return decoratePageList($block);
}
