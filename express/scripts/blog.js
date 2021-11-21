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
  toClassName,
  getOptimizedImageURL,
  getMeta,
  loadBlock,
} from './scripts.js';

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

async function fetchAuthorImage($image, author) {
  const resp = await fetch(`/express/learn/blog/authors/${toClassName(author)}.plain.html`);
  const main = await resp.text();
  if (resp.status === 200) {
    const $div = createTag('div');
    $div.innerHTML = main;
    const $img = $div.querySelector('img');
    const src = $img.src.replace('width=2000', 'width=200');
    $image.src = getOptimizedImageURL(src);
  }
}

function copyToClipboard(copyButton) {
  navigator.clipboard.writeText(window.location.href).then(() => {
    copyButton.classList.add('copy-success');
  }, (err) => {
    copyButton.classList.add('copy-failure');
    console.error('Async: Could not copy text: ', err);
  });
}

export default async function decorateBlogPage() {
  const $main = document.querySelector('main');
  const $h1 = document.querySelector('main h1');
  const author = getMeta('author');
  const date = getMeta('publication-date');

  if ($h1 && author && date) {
    const $heroPicture = $h1.parentElement.querySelector('picture');
    const $heroSection = createTag('div', { class: 'hero' });
    const $div = createTag('div');
    $heroSection.append($div);
    $div.append($h1);
    $main.prepend($heroSection);

    document.body.classList.add('blog-article');
    const $blogHeader = createTag('div', { class: 'blog-header' });
    $div.append($blogHeader);
    const $eyebrow = createTag('div', { class: 'eyebrow' });
    const tagString = getMeta('article:tag');
    // eslint-disable-next-line no-unused-vars
    const tags = tagString.split(',');
    $eyebrow.innerHTML = getMeta('category');
    // $eyebrow.innerHTML = tags[0];
    $blogHeader.append($eyebrow);
    $blogHeader.append($h1);
    const description = getMeta('description');
    if (description) {
      const $description = createTag('p', { class: 'subheading' });
      $description.innerHTML = description;
      $blogHeader.append($description);
    }
    if (author) {
      const $author = createTag('div', { class: 'author' });
      const url = encodeURIComponent(window.location.href);
      $author.innerHTML = `<div class="image"><img src="/express/gnav-placeholder/adobe-logo.svg"/></div>
      <div>
        <div class="name">${author}</div>
        <div class="date">${date}</div>
      </div>
      <div class="author-social">
        <span>
          <a target="_blank" href="http://twitter.com/share?&url=${url}">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-twitter">
            <use href="/express/icons/ccx-sheet_22.svg#twitter22"></use>
          </svg>
          </a>
        </span>
        <span>
          <a target="_blank" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-linkedin">
            <use href="/express/icons/ccx-sheet_22.svg#linkedin22"></use>
          </svg>
          </a>
        </span>
        <span>
        <a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${url}">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-facebook">
            <use href="/express/icons/ccx-sheet_22.svg#facebook22"></use>
          </svg>
          </a>
        </span>
        <span>
        <a>
          <svg id="copy-to-clipboard" xmlns="http://www.w3.org/2000/svg" class="icon icon-globe">
            <use href="/express/icons/ccx-sheet_22.svg#globe22"></use>
          </svg>
          </a>
        </span>
      </div>`;
      fetchAuthorImage($author.querySelector('img'), author);
      $blogHeader.append($author);
      const copyButton = document.getElementById('copy-to-clipboard');
      copyButton.addEventListener('click', () => {
        copyToClipboard(copyButton);
      });
    }
    $div.append($blogHeader);
    if ($heroPicture) {
      $div.append($heroPicture);
    }
  }

  const pictures = document.querySelectorAll('main div.section-wrapper > div > picture');
  pictures.forEach((picture) => {
    const section = picture.closest('.section-wrapper');
    section.classList.add('fullwidth');
  });
  const introText = document.querySelector('main div.section-wrapper p');
  if (introText) {
    introText.classList.add('intro-text');
  }

  const section = createTag('div', { class: 'section-wrapper' });
  const block = buildBlock('tags', '');
  block.classList.add('block');
  block.setAttribute('data-block-name', 'tags');
  section.appendChild(block);
  $main.appendChild(section);
  loadBlock(block);
}
