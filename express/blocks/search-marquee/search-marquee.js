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
  buildStaticFreePlanWidget,
  createTag,
  fetchPlaceholders,
  getIconElement,
} from '../../scripts/scripts.js';

import BlockMediator from '../../scripts/block-mediator.js';

function initSearchFunction(block) {
  const searchBarWrapper = block.querySelector('.search-bar-wrapper');

  const searchDropdown = searchBarWrapper.querySelector('.search-dropdown-container');
  const searchForm = searchBarWrapper.querySelector('.search-form');
  const searchBar = searchBarWrapper.querySelector('input.search-bar');
  const clearBtn = searchBarWrapper.querySelector('.icon-search-clear');

  clearBtn.style.display = 'none';

  searchBar.addEventListener('click', (e) => {
    e.stopPropagation();
    searchDropdown.classList.remove('hidden');
  }, { passive: true });

  searchBar.addEventListener('keyup', () => {
    if (searchBar.value !== '') {
      clearBtn.style.display = 'inline-block';
    } else {
      clearBtn.style.display = 'none';
    }
  }, { passive: true });

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
  });

  clearBtn.addEventListener('click', () => {
    searchBar.value = '';
    clearBtn.style.display = 'none';
  }, { passive: true });
}

async function decorateSearchFunctions(block) {
  const placeholders = await fetchPlaceholders();
  const searchBarWrapper = createTag('div', { class: 'search-bar-wrapper' });
  const searchForm = createTag('form', { class: 'search-form' });
  const searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    placeholder: placeholders['template-search-placeholder'] ?? 'Search for over 50,000 templates',
    enterKeyHint: placeholders.search ?? 'Search',
  });

  // Tasks Dropdown

  searchForm.append(searchBar);
  searchBarWrapper.append(getIconElement('search'), getIconElement('search-clear'));
  searchBarWrapper.append(searchForm);

  block.append(searchBarWrapper);
}

function decorateBackground(block) {
  const mediaRow = block.querySelector('div:nth-child(2)');

  if (mediaRow) {
    const mediaEl = mediaRow.querySelector('a, :scope > div');
    if (mediaEl) {
      const media = mediaEl.href || mediaEl.textContent;
      const splitArr = media.split('.');

      if (['jpeg', 'jpg', 'webp', 'png'].includes(splitArr[splitArr.length - 1])) {
        block.style.backgroundImage = `url(${media})`;
      }

      if (['mp4'].includes(splitArr[splitArr.length - 1])) {
        // todo: support video background too
      }
    }

    mediaRow.remove();
  }
}

async function buildSearchDropdown(block) {
  const searchBarWrapper = block.querySelector('.search-bar-wrapper');
  if (searchBarWrapper) {
    const dropdownContainer = createTag('div', { class: 'search-dropdown-container hidden' });
    const suggestContainer = createTag('div', { class: 'suggestions-container' });
    const predictContainer = createTag('div', { class: 'predictions-container' });
    const freePlanContainer = createTag('div', { class: 'free-plans-container' });

    const freePlanTags = await buildStaticFreePlanWidget();

    freePlanContainer.append(freePlanTags);
    dropdownContainer.append(suggestContainer, predictContainer, freePlanContainer);
    searchBarWrapper.append(dropdownContainer);
  }
}

export default async function decorate(block) {
  await decorateSearchFunctions(block);
  decorateBackground(block);
  await buildSearchDropdown(block);
  initSearchFunction(block);
}
