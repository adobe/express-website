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
/* global window document fetch IntersectionObserver */
/* eslint-disable import/named, import/extensions */

import {
  createTag,
  readBlockConfig,
  getLocale,
  addPublishDependencies,
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
  decorateTemplateList($tlBlock);
}

async function outputBuckets(buckets, $block) {
  const observer = new IntersectionObserver((entries, obs) => {
    console.log('intersection triggered', entries);
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        console.log(entry.target);
        appendTemplates(entry.target);
        obs.unobserve(entry.target);
      }
    });
  });

  const bucketNames = Object.keys(buckets);
  for (const name of bucketNames) {
    const bucket = buckets[name];
    const $row = createTag('div', { class: 'page-list-row' });
    const $category = createTag('div', { class: 'page-list-category' });
    const $h3 = createTag('h3');
    $h3.innerHTML = bucket.title;
    $category.append($h3);

    for (const page of bucket.pages) {
      const path = page.path.split('.')[0];
      const $page = createTag('a', { href: path });
      $page.innerHTML = page.shortTitle;
      $category.append($page);
      $category.append(document.createTextNode(' '));
    }
    $row.append($category);
    $block.append($row);
    observer.observe($row);
    console.log('row added');
  }
}

function addPages(pages, config, $block) {
  $block.innerHTML = '';
  const buckets = {};
  if (config.buckets) {
    config.buckets.forEach((bucketConfig) => {
      const [filter, title] = bucketConfig.split(':');
      buckets[filter] = { title, pages: [] };
    });
  }

  if (Object.keys(buckets).length === 0) {
    buckets['/'] = { title: '', pages: [] };
  }

  const bucketNames = Object.keys(buckets);

  pages.forEach((page) => {
    const path = page.path.split('.')[0];
    const name = `/${path.split('/express/')[1]}`;
    for (const bucketName of bucketNames) {
      if (name.includes(bucketName)) {
        buckets[bucketName].pages.push(page);
        break;
      }
    }
  });

  outputBuckets(buckets, $block);
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

export default function decorate($block) {
  decoratePageList($block);
}
