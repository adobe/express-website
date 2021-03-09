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

async function fetchBlogIndex() {
  const resp = await fetch('/blog-index.json');
  const json = await resp.json();
  return (json.data);
}

async function filterBlogPosts(locale, filters) {
  if (!window.blogIndex) {
    window.blogIndex = await fetchBlogIndex();
  }
  const index = window.blogIndex;

  const f = {};
  for (const name of Object.keys(filters)) {
    const vals = filters[name];
    let v = vals;
    if (!Array.isArray(vals)) {
      v = [vals];
    }
    // eslint-disable-next-line no-console
    console.log(v);
    f[name] = v.map((e) => e.toLowerCase().trim());
  }

  const result = index.filter((post) => {
    let matchedAll = true;
    for (const name of Object.keys(f)) {
      let matched = false;
      f[name].forEach((val) => {
        if (post[name].toLowerCase().includes(val)) {
          matched = true;
        }
      });
      if (!matched) {
        matchedAll = false;
        break;
      }
    }
    return (matchedAll);
  });

  return (result);
}

async function decorateBlogPosts($blogPosts) {
  let posts = [];

  if ($blogPosts.querySelector('a')) {
    /* handle links */

    const links = [];
    $blogPosts.querySelectorAll('a').forEach(($a) => {
      links.push($a.href);
    });

    $blogPosts.innerHTML = '';

    /* needs fixing to work with links */
    posts = await filterBlogPosts('en-US', { path: links });
  } else {
    const config = readBlockConfig($blogPosts);
    posts = await filterBlogPosts('en-US', config);
  }
  $blogPosts.innerHTML = '';
  posts.forEach((post) => {
    const $card = createTag('div', { class: 'card' });
    $card.innerHTML = `<div class="card-image">
          <img loading="lazy" src="${post.image}">
        </div>
        <div class="card-body">
          <h3>${post.title}</h3>
          <p>${post.teaser}</p>
        </div>`;
    $card.addEventListener('click', () => {
      window.location.href = `/${post.path}`;
    });
    $blogPosts.appendChild($card);
  });
}

export default function decorate($block) {
  decorateBlogPosts($block);
}
