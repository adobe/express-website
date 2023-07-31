/*
 * Copyright 2023 Adobe. All rights reserved.
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
  createTag,
} from '../../scripts/scripts.js';

const LIBRARY_PATH = '/docs/library/library.json';

async function loadBlocks(content, list, query) {
  const { default: blocks } = await import('./lists/blocks.js');
  blocks(content, list, query);
}

function addSearch(content, list) {
  const skLibrary = list.closest('.sk-library');
  const header = skLibrary.querySelector('.sk-library-header');
  let search = skLibrary.querySelector('.sk-library-search');
  if (!search) {
    search = createTag('div', { class: 'sk-library-search' });
    const searchInput = createTag('input', { class: 'sk-library-search-input', placeholder: 'Search...' });
    const clear = createTag('div', { class: 'sk-library-search-clear is-hidden' });
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (query === '') {
        clear.classList.add('is-hidden');
      } else {
        clear.classList.remove('is-hidden');
      }
      loadBlocks(content, list, query);
    });
    clear.addEventListener('click', (e) => {
      e.target.classList.add('is-hidden');
      e.target.closest('.sk-library-search').querySelector('.sk-library-search-input').value = '';
      loadBlocks(content, list);
    });
    search.append(searchInput);
    search.append(clear);
    header.append(search);
  } else {
    search.classList.remove('is-hidden');
  }
}

async function loadList(type, content, list) {
  list.innerHTML = '';
  const query = list.closest('.sk-library').querySelector('.sk-library-search-input')?.value;
  addSearch(content, list);
  loadBlocks(content, list, query);
}

async function fetchLibrary(domain) {
  const library = `${domain}${LIBRARY_PATH}`;
  try {
    const resp = await fetch(library);
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

function createList(libraries) {
  const container = createTag('div', { class: 'con-container' });

  const libraryList = createTag('ul', { class: 'sk-library-list' });
  container.append(libraryList);

  Object.keys(libraries).forEach((type) => {
    if (!libraries[type] || libraries[type].length === 0) return;

    const item = createTag('li', { class: 'content-type' });
    item.innerText = type.replace('_', ' ');
    libraryList.append(item);

    const list = document.createElement('ul');
    list.classList.add('con-type-list', `con-${type}-list`);
    container.append(list);

    item.addEventListener('click', (e) => {
      const skLibrary = e.target.closest('.sk-library');
      skLibrary.querySelector('.sk-library-title-text').textContent = type.replace('_', ' ');
      libraryList.classList.add('inset');
      list.classList.add('inset');
      skLibrary.classList.add('allow-back');
      loadList(type, libraries[type], list);
    });
  });

  return container;
}

function createHeader() {
  const nav = createTag('button', { class: 'sk-library-logo' });
  nav.innerText = 'Franklin Library';
  const title = createTag('div', { class: 'sk-library-title' });
  title.append(nav);
  const libraryText = createTag('p', { class: 'sk-library-title-text' });
  libraryText.innerText = 'Pick a library';
  title.append(libraryText);
  const header = createTag('div', { class: 'sk-library-header' });
  header.append(title);

  nav.addEventListener('click', (e) => {
    const skLibrary = e.target.closest('.sk-library');
    skLibrary.querySelector('.sk-library-search')?.classList.add('is-hidden');
    skLibrary.querySelector('.sk-library-title-text').textContent = 'Pick a library';
    const insetEls = skLibrary.querySelectorAll('.inset');
    insetEls.forEach((el) => {
      el.classList.remove('inset');
    });
    skLibrary.classList.remove('allow-back');
  });
  return header;
}

function detectContext() {
  if (window.self === window.top) {
    document.body.classList.add('in-page');
  }
}

export default async function init(el) {
  el.querySelector('div').remove();
  detectContext();

  // Get the data
  const base = await fetchLibrary(window.location.origin);
  const library = {
    blocks: base.data,
  };

  // Create the UI
  const skLibrary = createTag('div', { class: 'sk-library' });

  const header = createHeader();
  skLibrary.append(header);

  const list = createList(library);
  skLibrary.append(list);

  el.append(skLibrary);
}
