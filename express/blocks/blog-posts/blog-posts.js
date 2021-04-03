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
  getOptimizedImageURL,
} from '../../scripts/scripts.js';

async function fetchBlogIndex() {
  const resp = await fetch('/express/learn/blog/query-index.json');
  const json = await resp.json();
  const byPath = {};
  json.data.forEach((post) => {
    byPath[post.path.split('.')[0]] = post;
  });
  const index = { data: json.data, byPath };
  return (index);
}

function getFeatured(index, urls) {
  const paths = urls.map((url) => new URL(url).pathname.split('.')[0]);
  const results = [];
  paths.forEach((path) => {
    const post = index.byPath[path];
    if (post) {
      results.push(post);
    }
  });

  return (results);
}

async function filterBlogPosts(locale, config) {
  if (!window.blogIndex) {
    window.blogIndex = await fetchBlogIndex();
  }
  const result = [];
  const index = window.blogIndex;
  if (config.featured) {
    if (!Array.isArray(config.featured)) config.featured = [config.featured];
    const featured = getFeatured(index, config.featured);
    result.push(...featured);
  }

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
    const feed = index.data.filter((post) => {
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

async function decorateBlogPosts($blogPosts, config, offset = 0) {
  let posts = [];

  posts = await filterBlogPosts('en-US', config);

  const hasHero = config.featured && !config.featuredOnly && !offset;

  const limit = hasHero ? 13 : 12;

  let $cards = $blogPosts.querySelector('.blog-cards');
  if (!$cards) {
    $cards = createTag('div', { class: 'blog-cards' });
    $blogPosts.appendChild($cards);
  }

  const pageEnd = offset + limit;
  const max = pageEnd > posts.length ? posts.length : pageEnd;
  for (let i = offset; i < max; i += 1) {
    const post = posts[i];
    const {
      title, teaser, image, category,
    } = post;

    const path = post.path.split('.')[0];

    const eyebrow = category;
    const isHero = hasHero && !i;
    const imagePath = image.split('?')[0].split('_')[1];
    const imageSrc = getOptimizedImageURL(`./media_${imagePath}?format=webply&optimize=medium&width=750`);
    const heroSrc = getOptimizedImageURL(`./media_${imagePath}?format=webply&optimize=medium&width=2000`);
    let pictureTag = `<picture><img src="${imageSrc}"></picture>`;
    if (isHero) {
      pictureTag = `<picture>
        <source media="(max-width: 400px)" srcset="${imageSrc}">
        <img src="${heroSrc}">
      </picture>`;
    }
    const $card = createTag('a', {
      class: `${isHero ? 'blog-hero-card' : 'blog-card'}`,
      href: path,
    });
    $card.innerHTML = `<div class="blog-card-image">
          ${pictureTag}
        </div>
        <div class="blog-card-body">
        <p class="eyebrow">${eyebrow}</p>
        <h3>${title}</h3>
          <p>${teaser}</p>
        </div>`;
    if (isHero) $blogPosts.prepend($card);
    else $cards.append($card);
  }
  if (posts.length > pageEnd) {
    const $loadMore = createTag('a', { class: 'load-more button secondary', href: '#' });
    $loadMore.innerHTML = 'Load more articles';
    $blogPosts.append($loadMore);
    $loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      $loadMore.remove();
      decorateBlogPosts($blogPosts, config, pageEnd);
    });
  }
}

export default function decorate($block) {
  let config = {};

  const $rows = [...$block.children];
  const $firstRow = [...$rows[0].children];

  if ($rows.length === 1 && $firstRow.length === 1) {
    /* handle links */

    const links = [...$block.querySelectorAll('a')].map(($a) => $a.href);

    /* needs fixing to work with links */
    config = {
      featured: links,
      featuredOnly: true,
    };
  } else {
    config = readBlockConfig($block);
  }
  $block.innerHTML = '';

  decorateBlogPosts($block, config);
}
