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
  fetchPlaceholders,
  getIconElement,
} from '../../scripts/scripts.js';

import BlockMediator from '../../scripts/block-mediator.js';

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

  // todo: build actual search function with q param
  // initSearchFunction(searchBarWrapper);

  block.append(searchBarWrapper);
}

export default async function decorate(block) {
  await decorateSearchFunctions(block);
}
