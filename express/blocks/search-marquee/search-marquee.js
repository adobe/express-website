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
  getLocale,
  getMetadata,
} from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

function handlelize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
    .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
    .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
    .toLowerCase(); // To lowercase
}

function initSearchFunction(block) {
  const searchBarWrapper = block.querySelector('.search-bar-wrapper');

  const searchDropdown = searchBarWrapper.querySelector('.search-dropdown-container');
  const searchForm = searchBarWrapper.querySelector('.search-form');
  const searchBar = searchBarWrapper.querySelector('input.search-bar');
  const clearBtn = searchBarWrapper.querySelector('.icon-search-clear');
  const trendsContainer = searchBarWrapper.querySelector('.trends-container');
  const suggestionsContainer = searchBarWrapper.querySelector('.suggestions-container');
  const suggestionsList = searchBarWrapper.querySelector('.suggestions-list');

  clearBtn.style.display = 'none';

  searchBar.addEventListener('click', (e) => {
    e.stopPropagation();
    searchDropdown.classList.remove('hidden');
  }, { passive: true });

  searchBar.addEventListener('keyup', () => {
    if (searchBar.value !== '') {
      clearBtn.style.display = 'inline-block';
      trendsContainer.classList.add('hidden');
      suggestionsContainer.classList.remove('hidden');
    } else {
      clearBtn.style.display = 'none';
      trendsContainer.classList.remove('hidden');
      suggestionsContainer.classList.add('hidden');
    }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const { target } = e;
    if (target !== searchBarWrapper && !searchBarWrapper.contains(target)) {
      searchDropdown.classList.add('hidden');
    }
  }, { passive: true });

  const redirectSearch = async () => {
    const placeholders = await fetchPlaceholders().then((result) => result);
    const taskMap = JSON.parse(placeholders['task-name-mapping']);

    const format = getMetadata('placeholder-format');
    let currentTasks = getMetadata('tasks');
    let searchInput = searchBar.value.toLowerCase() || getMetadata('topics');

    const tasksFoundInInput = Object.entries(taskMap).filter((task) => task[1].some((word) => {
      const searchValue = searchBar.value.toLowerCase();
      return searchValue.indexOf(word.toLowerCase()) >= 0;
    })).sort((a, b) => b[0].length - a[0].length);

    if (tasksFoundInInput.length > 0) {
      tasksFoundInInput[0][1].sort((a, b) => b.length - a.length).forEach((word) => {
        searchInput = searchInput.toLowerCase().replace(word.toLowerCase(), '');
      });

      searchInput = searchInput.trim();
      [[currentTasks]] = tasksFoundInInput;
    }

    const locale = getLocale(window.location);
    const urlPrefix = locale === 'us' ? '' : `/${locale}`;
    const topicUrl = searchInput ? `/${searchInput}` : '';
    const taskUrl = `/${handlelize(currentTasks.toLowerCase())}`;
    const targetPath = `${urlPrefix}/express/templates${taskUrl}${topicUrl}`;
    const pathMatch = (e) => e.path === targetPath;
    if (window.templates && window.templates.data.some(pathMatch)) {
      window.location = `${window.location.origin}${targetPath}`;
    } else {
      const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks}&phformat=${format}&topics=${searchInput || "''"}&q=${searchInput || "''"}`;
      window.location = `${window.location.origin}${urlPrefix}${searchUrlTemplate}`;
    }
  };

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    searchBar.disabled = true;
    await redirectSearch();
  });

  clearBtn.addEventListener('click', () => {
    searchBar.value = '';
    suggestionsList.innerHTML = '';
    trendsContainer.classList.remove('hidden');
    suggestionsContainer.classList.add('hidden');
    clearBtn.style.display = 'none';
  }, { passive: true });

  const suggestionsListUIUpdateCB = (suggestions) => {
    suggestionsList.innerHTML = '';
    const searchBarVal = searchBar.value.toLowerCase();
    if (suggestions && !(suggestions.length <= 1 && suggestions[0]?.query === searchBarVal)) {
      suggestions.forEach((item) => {
        const li = createTag('li', { tabindex: 0 });
        const valRegEx = new RegExp(searchBar.value, 'i');
        li.innerHTML = item.query.replace(valRegEx, `<b>${searchBarVal}</b>`);
        li.addEventListener('click', () => {
          if (item.query === searchBar.value) return;
          searchBar.value = item.query;
          searchBar.dispatchEvent(new Event('input'));
        });

        suggestionsList.append(li);
      });
    }
  };

  import('./useInputAutocomplete.js').then(({ default: useInputAutocomplete }) => {
    const { inputHandler } = useInputAutocomplete(
      suggestionsListUIUpdateCB, { throttleDelay: 300, debounceDelay: 500, limit: 7 },
    );
    searchBar.addEventListener('input', inputHandler);
  });
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
  const supportedImgFormat = ['jpeg', 'jpg', 'webp', 'png', 'svg'];
  const supportedVideoFormat = ['mp4'];
  const mediaRow = block.querySelector('div:nth-child(2)');

  if (mediaRow) {
    const mediaEl = mediaRow.querySelector('a, :scope > div');
    if (mediaEl) {
      const media = mediaEl.href || mediaEl.textContent;
      const splitArr = media.split('.');

      if (supportedImgFormat.includes(splitArr[splitArr.length - 1])) {
        block.style.backgroundImage = `url(${media})`;
      }

      if (supportedVideoFormat.includes(splitArr[splitArr.length - 1])) {
        // todo: support video background too
      }
    }

    mediaRow.remove();
  }
}

async function buildSearchDropdown(block) {
  const placeholders = await fetchPlaceholders();

  const searchBarWrapper = block.querySelector('.search-bar-wrapper');
  if (searchBarWrapper) {
    const dropdownContainer = createTag('div', { class: 'search-dropdown-container hidden' });
    const trendsContainer = createTag('div', { class: 'trends-container' });
    const suggestionsContainer = createTag('div', { class: 'suggestions-container hidden' });
    const suggestionsTitle = createTag('p', { class: 'dropdown-title' });
    const suggestionsList = createTag('ul', { class: 'suggestions-list' });
    const freePlanContainer = createTag('div', { class: 'free-plans-container' });

    const fromScratchLink = block.querySelector('a');
    const trendsTitle = placeholders['search-trends-title'];
    let trends;
    if (placeholders['search-trends']) trends = JSON.parse(placeholders['search-trends']);

    if (fromScratchLink) {
      const linkDiv = fromScratchLink.parentElement.parentElement;
      fromScratchLink.prepend(getIconElement('template-free-accent'));
      fromScratchLink.append(getIconElement('arrow-right'));
      fromScratchLink.classList.remove('button');
      fromScratchLink.classList.add('from-scratch-link');
      fromScratchLink.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-marquee-from-scratch-link', getMetadata('search-marquee-from-scratch-link') || '/');
      trendsContainer.append(fromScratchLink);
      linkDiv.remove();
    }

    if (trendsTitle) {
      const trendsTitleEl = createTag('p', { class: 'dropdown-title' });
      trendsTitleEl.textContent = trendsTitle;
      trendsContainer.append(trendsTitleEl);
    }

    if (trends) {
      const trendsWrapper = createTag('ul', { class: 'trends-wrapper' });
      for (const [key, value] of Object.entries(trends)) {
        const trendLinkWrapper = createTag('li');
        const trendLink = createTag('a', { class: 'trend-link', href: value });
        trendLink.textContent = key;
        trendLinkWrapper.append(trendLink);
        trendsWrapper.append(trendLinkWrapper);
      }
      trendsContainer.append(trendsWrapper);
    }

    suggestionsTitle.textContent = placeholders['search-suggestions-title'];
    suggestionsContainer.append(suggestionsTitle, suggestionsList);

    const freePlanTags = await buildStaticFreePlanWidget();

    freePlanContainer.append(freePlanTags);
    dropdownContainer.append(trendsContainer, suggestionsContainer, freePlanContainer);
    searchBarWrapper.append(dropdownContainer);
  }
}

function decorateLinkList(block) {
  const carouselItemsWrapper = block.querySelector(':scope > div:nth-of-type(2)');
  if (carouselItemsWrapper) {
    if (['yes', 'true', 'on', 'Y'].includes(getMetadata('show-search-marquee-link-list'))) {
      buildCarousel(':scope > div > p', carouselItemsWrapper);
      const carousel = carouselItemsWrapper.querySelector('.carousel-container');
      block.append(carousel);
    } else {
      carouselItemsWrapper.remove();
    }
  }
}

export default async function decorate(block) {
  await decorateSearchFunctions(block);
  decorateBackground(block);
  await buildSearchDropdown(block);
  initSearchFunction(block);
  decorateLinkList(block);

  const blockLinks = block.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
}
