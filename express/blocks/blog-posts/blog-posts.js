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
  const resp = await fetch('/blog/query-index.json');
  const json = await resp.json();
  return (json.data);
}

function getFeatured(index, urls) {
  const paths = urls.map((url) => new URL(url).pathname.split('.')[0]);
  const results = index.filter((post) => {
    const path = post.path.split('.')[0];
    return (paths.includes(path));
  });
  return (results);
}

async function filterBlogPosts(locale, config) {
  if (!window.blogIndex) {
    window.blogIndex = await fetchBlogIndex();
  }
  const index = window.blogIndex;
  if (!Array.isArray(config.featured)) config.featured = [config.featured];
  const featured = getFeatured(index, config.featured);

  const result = featured;

  if (!config.featuredOnly) {
    /* filter posts by tag and author */
    const f = {};
    for (const name of Object.keys(config)) {
      const filterNames = ['tag', 'author'];
      if (filterNames.includes(name)) {
        const vals = config[name];
        let v = vals;
        if (!Array.isArray(vals)) {
          v = [vals];
        }
        // eslint-disable-next-line no-console
        console.log(v);
        f[name] = v.map((e) => e.toLowerCase().trim());
      }
    }

    /* filter and ignore if already in result */
    const feed = index.filter((post) => {
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
      return (matchedAll && !result.includes(post));
    });

    result.push(...feed);
  }
  return (result);
}

async function decorateBlogPosts($blogPosts) {
  let posts = [];
  let config = {};

  const $rows = [...$blogPosts.children];
  const $firstRow = [...$rows[0].children];

  if ($rows.length === 1 && $firstRow.length === 1) {
    /* handle links */

    const links = [...$blogPosts.querySelectorAll('a')].map(($a) => $a.href);

    /* needs fixing to work with links */
    config = {
      featured: links,
      featuredOnly: true,
    };
  } else {
    config = readBlockConfig($blogPosts);
  }

  $blogPosts.innerHTML = '';
  posts = await filterBlogPosts('en-US', config);

  const hasHero = config.featured && !config.featuredOnly;

  const $cards = createTag('div', { class: 'cards' });
  posts.forEach((post, i) => {
    const {
      path, title, teaser, tags, image,
    } = post;

    const tagsArr = JSON.parse(tags);
    const eyebrow = tagsArr[0] ? tagsArr[0].replace('-', ' ') : '';
    const isHero = hasHero && !i;
    const imagePath = image.split('?')[0].split('_')[1];
    let pictureTag = `<picture><img src="./media_${imagePath}?$format=webply&optimize=medium&width=750"></picture>`;
    if (isHero) {
      pictureTag = `<picture>
        <source media="(max-width: 400px)" srcset="./media_${imagePath}?width=750&format=webply&optimize=medium">
        <img src="./media_${imagePath}?width=2000&format=webply&optimize=medium">
      </picture>`;
    }
    const $card = createTag('div', { class: `${isHero ? 'hero-card' : 'card'}` });
    $card.innerHTML = `<div class="card-image">
          ${pictureTag}
        </div>
        <div class="card-body">
        <p class="eyebrow">${eyebrow}</p>
        <h3>${title}</h3>
          <p>${teaser}</p>
        </div>`;
    $card.addEventListener('click', () => {
      window.location.href = `${path}`;
    });
    if (isHero) $blogPosts.appendChild($card);
    else $cards.appendChild($card);
  });
  $blogPosts.appendChild($cards);
}

export default function decorate($block) {
  decorateBlogPosts($block);
}
