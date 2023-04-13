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
  addAnimationToggle,
  addSearchQueryToHref,
  createOptimizedPicture,
  createTag,
  decorateMain,
  fetchPlaceholders,
  fetchRelevantRows,
  getIconElement,
  getLanguage,
  getLocale,
  getLottie,
  getMetadata,
  lazyLoadLottiePlayer,
  linkImage,
  toClassName,
} from '../../scripts/scripts.js';

import { Masonry } from '../shared/masonry.js';

import { buildCarousel } from '../shared/carousel.js';

const props = {
  templates: [],
  filters: {
    locales: '(en)',
  },
  tailButton: '',
  limit: 70,
  total: 0,
  start: '',
  sort: '-_score,-remixCount',
  masonry: undefined,
  authoringError: false,
  headingTitle: null,
  headingSlug: null,
  viewAllLink: null,
};

function wordStartsWithVowels(word) {
  return word.match('^[aieouâêîôûäëïöüàéèùœAIEOUÂÊÎÔÛÄËÏÖÜÀÉÈÙŒ].*');
}

function handlelize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
    .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
    .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
    .toLowerCase(); // To lowercase
}

function trimFormattedFilterText(attr, capitalize) {
  const resultString = attr.substring(1, attr.length - 1).replaceAll('"', '');

  return capitalize ? resultString.charAt(0).toUpperCase() + resultString.slice(1) : resultString;
}

async function populateHeadingPlaceholder(locale) {
  const heading = props.heading.replace("''", '');
  const placeholders = await fetchPlaceholders();
  const lang = getLanguage(getLocale(window.location));
  let grammarTemplate;

  if (getMetadata('template-search-page') === 'Y') {
    grammarTemplate = placeholders['template-search-grid-heading-placeholder'] || placeholders['template-placeholder'];
  } else {
    grammarTemplate = placeholders['template-placeholder'];
  }

  if (grammarTemplate) {
    grammarTemplate = grammarTemplate
      .replace('{{quantity}}', props.total.toLocaleString(lang))
      .replace('{{Type}}', heading)
      .replace('{{type}}', heading.charAt(0).toLowerCase() + heading.slice(1));

    if (locale === 'fr') {
      grammarTemplate.split(' ').forEach((word, index, words) => {
        if (index + 1 < words.length) {
          if (word === 'de' && wordStartsWithVowels(words[index + 1])) {
            words.splice(index, 2, `d'${words[index + 1].toLowerCase()}`);
            grammarTemplate = words.join(' ');
          }
        }
      });
    }
  }

  return grammarTemplate;
}

function formatSearchQuery(limit, start, sort, filters) {
  const prunedFilter = Object.entries(filters).filter(([, value]) => value !== '()');
  const filterString = prunedFilter.reduce((string, [key, value]) => {
    if (key === prunedFilter[prunedFilter.length - 1][0]) {
      return `${string}${key}:${value}`;
    } else {
      return `${string}${key}:${value} AND `;
    }
  }, '');

  return `https://www.adobe.com/cc-express-search-api?limit=${limit}&start=${start}&orderBy=${sort}&filters=${filterString}`;
}

async function fetchTemplates() {
  if (!props.authoringError && Object.keys(props.filters).length !== 0) {
    props.queryString = formatSearchQuery(props.limit, props.start, props.sort, props.filters);

    const result = await fetch(props.queryString)
      .then((response) => response.json())
      .then((response) => response);

    // eslint-disable-next-line no-underscore-dangle
    if (result._embedded.total > 0) {
      return result;
    } else {
      // save fetch if search query returned 0 templates. "Bad result is better than no result"
      return fetch(`https://www.adobe.com/cc-express-search-api?limit=${props.limit}&start=${props.start}&orderBy=${props.sort}&filters=locales:(en)`)
        .then((response) => response.json())
        .then((response) => response);
    }
  }
  return null;
}

function fetchTemplatesByTasks(tasks) {
  const tempFilters = { ...props.filters };

  if (tasks) {
    tempFilters.tasks = `(${tasks})`;
  }

  if (!props.authoringError && Object.keys(tempFilters).length !== 0) {
    const tempQ = formatSearchQuery(props.limit, '', props.sort, tempFilters);

    return fetch(tempQ)
      .then((response) => response.json())
      .then((response) => response);
  }

  return null;
}

async function appendCategoryTemplatesCount($section) {
  const categories = $section.querySelectorAll('ul.category-list > li');
  const currentTask = props.filters.tasks;
  const lang = getLanguage(getLocale(window.location));

  for (const li of categories) {
    const anchor = li.querySelector('a');
    if (anchor) {
      // eslint-disable-next-line no-await-in-loop
      const json = await fetchTemplatesByTasks(anchor.dataset.tasks);
      const countSpan = createTag('span', { class: 'category-list-template-count' });
      // eslint-disable-next-line no-underscore-dangle
      countSpan.textContent = `(${json._embedded.total.toLocaleString(lang)})`;
      anchor.append(countSpan);
    }
  }

  props.filters.tasks = currentTask;
}

async function processResponse() {
  const placeholders = await fetchPlaceholders();
  const response = await fetchTemplates();
  let templateFetched;
  if (response) {
    // eslint-disable-next-line no-underscore-dangle
    templateFetched = response._embedded.results;

    if ('_links' in response) {
      // eslint-disable-next-line no-underscore-dangle
      const nextQuery = response._links.next.href;
      const starts = new URLSearchParams(nextQuery).get('start').split(',');
      starts.pop();
      props.start = starts.join(',');
    } else {
      props.start = '';
    }

    // eslint-disable-next-line no-underscore-dangle
    props.total = response._embedded.total;
  }

  const renditionParams = {
    format: 'jpg',
    dimension: 'width',
    size: 400,
  };

  if (templateFetched) {
    return templateFetched.map((template) => {
      const $template = createTag('div');
      const $pictureWrapper = createTag('div');

      ['format', 'dimension', 'size'].forEach((param) => {
        template.rendition.href = template.rendition.href.replace(`{${param}}`, renditionParams[param]);
      });
      const $picture = createTag('img', {
        src: template.rendition.href,
        alt: template.title,
      });
      const $buttonWrapper = createTag('div', { class: 'button-container' });
      const $button = createTag('a', {
        href: template.branchURL,
        title: placeholders['edit-this-template'] ?? 'Edit this template',
        class: 'button accent',
      });

      $button.textContent = placeholders['edit-this-template'] ?? 'Edit this template';
      $pictureWrapper.insertAdjacentElement('beforeend', $picture);
      $buttonWrapper.insertAdjacentElement('beforeend', $button);
      $template.insertAdjacentElement('beforeend', $pictureWrapper);
      $template.insertAdjacentElement('beforeend', $buttonWrapper);
      return $template;
    });
  } else {
    return null;
  }
}

async function fetchBlueprint(pathname) {
  if (window.spark.$blueprint) {
    return (window.spark.$blueprint);
  }

  const bpPath = pathname.substr(pathname.indexOf('/', 1))
    .split('.')[0];
  const resp = await fetch(`${bpPath}.plain.html`);
  const body = await resp.text();
  const $main = createTag('main');
  $main.innerHTML = body;
  await decorateMain($main);

  window.spark.$blueprint = $main;
  return ($main);
}

function populateTemplates($block, templates) {
  for (let $tmplt of templates) {
    const isPlaceholder = $tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
    const $linkContainer = $tmplt.querySelector(':scope > div:nth-of-type(2)');
    const $rowWithLinkInFirstCol = $tmplt.querySelector(':scope > div:first-of-type > a');

    if ($linkContainer) {
      const $link = $linkContainer.querySelector(':scope a');
      if ($link) {
        const $a = createTag('a', {
          href: $link.href ? addSearchQueryToHref($link.href) : '#',
        });

        $a.append(...$tmplt.children);
        $tmplt.remove();
        $tmplt = $a;
        $block.append($a);

        // convert A to SPAN
        const $newLink = createTag('span', { class: 'template-link' });
        $newLink.append($link.textContent.trim());

        $linkContainer.innerHTML = '';
        $linkContainer.append($newLink);
      }
    }

    if ($rowWithLinkInFirstCol && !$tmplt.querySelector('img')) {
      props.tailButton = $rowWithLinkInFirstCol;
      $rowWithLinkInFirstCol.remove();
    }

    if ($tmplt.children.length === 3) {
      // look for options in last cell
      const $overlayCell = $tmplt.querySelector(':scope > div:last-of-type');
      const option = $overlayCell.textContent.trim();
      if (option) {
        if (isPlaceholder) {
          // add aspect ratio to template
          const sep = option.includes(':') ? ':' : 'x';
          const ratios = option.split(sep).map((e) => +e);
          props.placeholderFormat = ratios;
          if ($block.classList.contains('horizontal')) {
            const height = $block.classList.contains('mini') ? 100 : 200;
            if (ratios[1]) {
              const width = (ratios[0] / ratios[1]) * height;
              $tmplt.style = `width: ${width}px`;
              if (width / height > 1.3) {
                $tmplt.classList.add('tall');
              }
            }
          } else {
            const width = $block.classList.contains('sixcols') || $block.classList.contains('fullwidth') ? 165 : 200;
            if (ratios[1]) {
              const height = (ratios[1] / ratios[0]) * width;
              $tmplt.style = `height: ${height - 21}px`;
              if (width / height > 1.3) {
                $tmplt.classList.add('wide');
              }
            }
          }
        } else {
          // add icon to 1st cell
          const $icon = getIconElement(toClassName(option));
          $icon.setAttribute('title', option);
          $tmplt.children[0].append($icon);
        }
      }
      $overlayCell.remove();
    }

    if (!$tmplt.querySelectorAll(':scope > div > *').length) {
      // remove empty row
      $tmplt.remove();
    }
    $tmplt.classList.add('template');

    // wrap "linked images" with link
    const $imgLink = $tmplt.querySelector(':scope > div:first-of-type a');
    if ($imgLink) {
      const $parent = $imgLink.closest('div');
      if (!$imgLink.href.includes('.mp4')) {
        linkImage($parent);
      } else {
        let videoLink = $imgLink.href;
        if (videoLink.includes('/media_')) {
          videoLink = `./media_${videoLink.split('/media_')[1]}`;
        }
        $tmplt.querySelectorAll(':scope br').forEach(($br) => $br.remove());
        const $picture = $tmplt.querySelector('picture');
        if ($picture) {
          const $img = $tmplt.querySelector('img');
          const $video = createTag('video', {
            playsinline: '',
            autoplay: '',
            loop: '',
            muted: '',
            poster: $img.getAttribute('src'),
            title: $img.getAttribute('alt'),
          });
          $video.append(createTag('source', {
            src: videoLink,
            type: 'video/mp4',
          }));
          $parent.replaceChild($video, $picture);
          $imgLink.remove();
          $video.addEventListener('canplay', () => {
            $video.muted = true;
            $video.play();
          });
        }
      }
    }

    if (isPlaceholder) {
      $tmplt.classList.add('placeholder');
    }
  }
}

function initToggle($section) {
  const $bar = $section.querySelector('.toggle-bar');
  const $wrapper = $section.querySelector('.template-list-wrapper');
  const $toggleButtons = $section.querySelectorAll('.toggle-button');

  $bar.addEventListener('click', (e) => {
    e.preventDefault();
    $wrapper.classList.toggle('expanded');
    $section.classList.toggle('expanded');
    Array.from($toggleButtons).forEach(($button) => {
      $button.classList.toggle('expanded');
    });
  });

  Array.from($toggleButtons).forEach(($button) => {
    const chev = $button.querySelector('.toggle-button-chev');
    const a = $button.querySelector('a');

    a.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    chev.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      $wrapper.classList.toggle('expanded');
      $section.classList.toggle('expanded');
      Array.from($toggleButtons).forEach((b) => {
        b.classList.toggle('expanded');
      });
    });
  });
}

async function attachFreeInAppPills($block) {
  const freeInAppText = await fetchPlaceholders().then((json) => json['free-in-app']);

  const $templateLinks = $block.querySelectorAll('a.template');
  for (const $templateLink of $templateLinks) {
    if (!$block.classList.contains('apipowered')
      && $templateLink.querySelectorAll('.icon-premium').length <= 0
      && !$templateLink.classList.contains('placeholder')
      && !$templateLink.querySelector('.icon-free-badge')
      && freeInAppText) {
      const $freeInAppBadge = createTag('span', { class: 'icon icon-free-badge' });
      $freeInAppBadge.textContent = freeInAppText;
      $templateLink.querySelector('div').append($freeInAppBadge);
    }
  }
}

async function readRowsFromBlock($block) {
  if ($block.children.length > 0) {
    Array.from($block.children).forEach((row, index, array) => {
      const cells = row.querySelectorAll('div');
      if (index === 0) {
        if (cells.length >= 2 && ['type*', 'type'].includes(cells[0].textContent.trim().toLowerCase())) {
          props.filters.tasks = `(${cells[1].textContent.trim().toLowerCase()})`;
          props.heading = cells[1].textContent.trim();
        } else if ($block.classList.contains('holiday')) {
          props.heading = row;
        } else {
          props.heading = row.textContent.trim();
        }
        row.remove();
      } else if (cells[0].textContent.toLowerCase() === 'auto-collapse delay') {
        props.autoCollapseDelay = parseFloat(cells[1].textContent.trim()) * 1000;
      } else if (cells[0].textContent.toLowerCase() === 'background animation') {
        props.backgroundAnimation = cells[1].textContent.trim();
        cells[1].remove();
      } else if (cells[0].textContent.toLowerCase() === 'background color') {
        props.backgroundColor = cells[1].textContent.trim();
      } else if (index < array.length) {
        if (cells.length >= 2) {
          if (['type*', 'type'].includes(cells[0].textContent.trim().toLowerCase())) {
            props.filters.tasks = `(${cells[1].textContent.trim().toLowerCase()})`;
          } else {
            props.filters[`${cells[0].textContent.trim().toLowerCase()}`] = `(${cells[1].textContent.trim().toLowerCase()})`;
          }
        }
        row.remove();
      }
    });

    const fetchedTemplates = await processResponse();

    if (fetchedTemplates) {
      props.templates = props.templates.concat(fetchedTemplates);
      props.templates.forEach((template) => {
        const clone = template.cloneNode(true);
        $block.append(clone);
      });
    }
  } else {
    props.heading = 'Authoring error: first row must specify the template “type”';
    props.authoringError = true;
  }
}

async function redirectSearch($searchBar) {
  const placeholders = await fetchPlaceholders().then((result) => result);
  const taskMap = JSON.parse(placeholders['task-name-mapping']);
  if ($searchBar) {
    const wrapper = $searchBar.closest('.search-bar-wrapper');
    const $selectorTask = wrapper.querySelector('.task-dropdown-list > .option.active');
    props.filters.tasks = `(${$selectorTask.dataset.tasks})`;
  }

  const format = `${props.placeholderFormat[0]}:${props.placeholderFormat[1]}`;
  let currentTasks = trimFormattedFilterText(props.filters.tasks);
  const currentTopic = trimFormattedFilterText(props.filters.topics);
  let searchInput = $searchBar ? $searchBar.value.toLowerCase() : currentTopic;

  const tasksFoundInInput = Object.entries(taskMap).filter((task) => task[1].some((word) => {
    const searchValue = $searchBar.value.toLowerCase();
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
  const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks}&phformat=${format}&topics=${searchInput || "''"}`;
  const targetPath = `${urlPrefix}/express/templates${taskUrl}${topicUrl}`;
  const searchUrl = `${window.location.origin}${urlPrefix}${searchUrlTemplate}`;
  const pathMatch = (e) => e.path === targetPath;
  if (window.templates && window.templates.data.some(pathMatch)) {
    window.location = `${window.location.origin}${targetPath}`;
  } else {
    window.location = searchUrl;
  }
}

function makeTemplateFunctions(placeholders) {
  const functions = {
    premium: {
      placeholders: JSON.parse(placeholders['template-filter-premium']),
      elements: {},
      icons: placeholders['template-filter-premium-icons'].replace(/\s/g, '').split(','),
    },
    animated: {
      placeholders: JSON.parse(placeholders['template-filter-animated']),
      elements: {},
      icons: placeholders['template-filter-animated-icons'].replace(/\s/g, '').split(','),
    },
    sort: {
      placeholders: JSON.parse(placeholders['template-sort']),
      elements: {},
      icons: placeholders['template-sort-icons'].replace(/\s/g, '').split(','),
    },
  };

  Object.entries(functions).forEach((entry) => {
    entry[1].elements.wrapper = createTag('div', {
      class: `function-wrapper function-${Object.values(entry)[0]}`,
      'data-param': Object.values(entry)[0],
    });

    entry[1].elements.wrapper.subElements = {
      button: {
        wrapper: createTag('div', { class: `button-wrapper button-wrapper-${Object.values(entry)[0]}` }),
        subElements: {
          iconHolder: createTag('span', { class: 'icon-holder' }),
          textSpan: createTag('span', { class: `current-option current-option-${Object.values(entry)[0]}` }),
          chevIcon: getIconElement('drop-down-arrow'),
        },
      },
      options: {
        wrapper: createTag('div', { class: `options-wrapper options-wrapper-${Object.values(entry)[0]}` }),
        subElements: Object.entries(entry[1].placeholders).map((option, subIndex) => {
          const icon = getIconElement(entry[1].icons[subIndex]);
          const optionButton = createTag('div', { class: 'option-button', 'data-value': Object.values(option)[1] });
          [optionButton.textContent] = Object.values(option);
          optionButton.prepend(icon);
          return optionButton;
        }),
      },
    };

    const $span = entry[1].elements.wrapper.subElements.button.subElements.textSpan;
    [[$span.textContent]] = Object.entries(entry[1].placeholders);
  });

  return functions;
}

function updateFilterIcon(block) {
  const section = block.closest('.section.template-list-fullwidth-apipowered-container');
  const functionWrapper = section.querySelectorAll('.function-wrapper');
  const optionsWrapper = section.querySelectorAll('.options-wrapper');

  functionWrapper.forEach((wrap, index) => {
    const iconHolder = wrap.querySelector('.icon-holder');
    const activeOption = optionsWrapper[index].querySelector('.option-button.active');
    if (iconHolder && activeOption) {
      const activeIcon = activeOption.querySelector('.icon');
      if (activeIcon) {
        iconHolder.innerHTML = activeIcon.outerHTML;
      }
    }
  });
}

function decorateFunctionsContainer($block, $section, functions, placeholders) {
  const $functionsContainer = createTag('div', { class: 'functions-container' });
  const $functionContainerMobile = createTag('div', { class: 'functions-drawer' });

  Object.entries(functions).forEach((filter) => {
    const $filterWrapper = filter[1].elements.wrapper;

    Object.entries($filterWrapper.subElements).forEach((part) => {
      const $innerWrapper = part[1].wrapper;

      Object.entries(part[1].subElements).forEach((innerElement) => {
        if (Object.values(innerElement)[1]) {
          $innerWrapper.append(Object.values(innerElement)[1]);
        }
      });

      $filterWrapper.append($innerWrapper);
    });
    $functionContainerMobile.append($filterWrapper.cloneNode({ deep: true }));
    $functionsContainer.append($filterWrapper);
  });

  // restructure drawer for mobile design
  const $filterContainer = createTag('div', { class: 'filter-container-mobile' });
  const $mobileFilterButtonWrapper = createTag('div', { class: 'filter-button-mobile-wrapper' });
  const $mobileFilterButton = createTag('span', { class: 'filter-button-mobile' });
  const $drawer = createTag('div', { class: 'filter-drawer-mobile hidden retracted' });
  const $drawerInnerWrapper = createTag('div', { class: 'filter-drawer-mobile-inner-wrapper' });
  const $drawerBackground = createTag('div', { class: 'drawer-background hidden transparent' });
  const $closeButton = getIconElement('search-clear');
  const $applyButtonWrapper = createTag('div', { class: 'apply-filter-button-wrapper hidden transparent' });
  const $applyButton = createTag('a', { class: 'apply-filter-button button gradient', href: '#' });

  $closeButton.classList.add('close-drawer');
  $applyButton.textContent = placeholders['apply-filters'];

  $functionContainerMobile.children[0]
    .querySelector('.current-option-premium')
    .textContent = `${placeholders.free} ${placeholders['versus-shorthand']} ${placeholders.premium}`;

  $functionContainerMobile.children[1]
    .querySelector('.current-option-animated')
    .textContent = `${placeholders.static} ${placeholders['versus-shorthand']} ${placeholders.animated}`;

  $drawerInnerWrapper.append(
    $functionContainerMobile.children[0],
    $functionContainerMobile.children[1],
  );

  $drawer.append($closeButton, $drawerInnerWrapper);

  const $buttonsInDrawer = $drawer.querySelectorAll('.button-wrapper');
  const $optionsInDrawer = $drawer.querySelectorAll('.options-wrapper');

  [$buttonsInDrawer, $optionsInDrawer].forEach((category) => {
    category.forEach((element) => {
      element.classList.add('in-drawer');
      const heading = element.querySelector('.current-option');
      const iconHolder = element.querySelector('.icon-holder');
      if (heading) {
        heading.className = 'filter-mobile-option-heading';
      }
      if (iconHolder) {
        iconHolder.remove();
      }
    });
  });

  $mobileFilterButtonWrapper.append(getIconElement('scratch-icon-22'), $mobileFilterButton);
  $applyButtonWrapper.append($applyButton);
  $filterContainer.append(
    $mobileFilterButtonWrapper,
    $drawer,
    $applyButtonWrapper,
    $drawerBackground,
  );
  $functionContainerMobile.prepend($filterContainer);

  $mobileFilterButton.textContent = placeholders.filter;
  const $sortButton = $functionContainerMobile.querySelector('.current-option-sort');
  if ($sortButton) {
    $sortButton.textContent = placeholders.sort;
    $sortButton.className = 'filter-mobile-option-heading';
  }

  return { mobile: $functionContainerMobile, desktop: $functionsContainer };
}

function resetTaskDropdowns($section) {
  const $taskDropdowns = $section.querySelectorAll('.task-dropdown');
  const $taskDropdownLists = $section.querySelectorAll('.task-dropdown-list');

  $taskDropdowns.forEach((dropdown) => {
    dropdown.classList.remove('active');
  });

  $taskDropdownLists.forEach((list) => {
    list.classList.remove('active');
  });
}

function closeTaskDropdown($toolBar) {
  const $section = $toolBar.closest('.section.template-list-fullwidth-apipowered-container');
  const $searchBarWrappers = $section.querySelectorAll('.search-bar-wrapper');
  $searchBarWrappers.forEach(($wrapper) => {
    const $taskDropdown = $wrapper.querySelector('.task-dropdown');
    const $taskDropdownList = $taskDropdown.querySelector('.task-dropdown-list');
    $taskDropdown.classList.remove('active');
    $taskDropdownList.classList.remove('active');
  });
}

function initSearchFunction($toolBar, $stickySearchBarWrapper, $searchBarWrapper) {
  const $section = $toolBar.closest('.section.template-list-fullwidth-apipowered-container');
  const $stickySearchBar = $stickySearchBarWrapper.querySelector('input.search-bar');
  const $searchBarWrappers = $section.querySelectorAll('.search-bar-wrapper');
  const $toolbarWrapper = $toolBar.parentElement;

  const searchBarWatcher = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) {
      $toolbarWrapper.classList.add('sticking');
      resetTaskDropdowns($section);
    } else {
      $toolbarWrapper.classList.remove('sticking');
    }
  }, { rootMargin: '0px', threshold: 1 });

  searchBarWatcher.observe($searchBarWrapper);

  $searchBarWrappers.forEach(($wrapper) => {
    const $searchForm = $wrapper.querySelector('.search-form');
    const $searchBar = $wrapper.querySelector('input.search-bar');
    const $clear = $wrapper.querySelector('.icon-search-clear');
    const $taskDropdown = $wrapper.querySelector('.task-dropdown');
    const $taskDropdownToggle = $taskDropdown.querySelector('.task-dropdown-toggle');
    const $taskDropdownList = $taskDropdown.querySelector('.task-dropdown-list');
    const $taskOptions = $taskDropdownList.querySelectorAll('.option');

    $searchBar.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTaskDropdown($toolBar);
    }, { passive: true });

    $searchBar.addEventListener('keyup', () => {
      if ($searchBar.value !== '') {
        $clear.style.display = 'inline-block';
      } else {
        $clear.style.display = 'none';
      }
    }, { passive: true });

    $searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await redirectSearch($searchBar);
    });

    $clear.addEventListener('click', () => {
      $searchBar.value = '';
      $clear.style.display = 'none';
    }, { passive: true });

    $taskDropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      $taskDropdown.classList.toggle('active');
      $taskDropdownList.classList.toggle('active');
    }, { passive: true });

    document.addEventListener('click', (e) => {
      const { target } = e;
      if (target !== $taskDropdown && !$taskDropdown.contains(target)) {
        $taskDropdown.classList.remove('active');
        $taskDropdownList.classList.remove('active');
      }
    }, { passive: true });

    $taskOptions.forEach((option) => {
      const updateTaskOptions = () => {
        $taskOptions.forEach((o) => {
          if (o !== option) {
            o.classList.remove('active');
          }
        });

        option.classList.add('active');
        props.filters.tasks = `(${option.dataset.tasks})`;
        $taskDropdownToggle.textContent = option.textContent.trim();
        closeTaskDropdown($toolBar);
      };

      option.addEventListener('click', (e) => {
        e.stopPropagation();
        updateTaskOptions();
      }, { passive: true });
    });

    document.addEventListener('click', (e) => {
      if (e.target !== $wrapper && !$wrapper.contains(e.target)) {
        if ($wrapper.classList.contains('sticky-search-bar')) {
          $wrapper.classList.remove('ready');
          $wrapper.classList.add('collapsed');
        }
      }
    }, { passive: true });
  });

  $stickySearchBar.addEventListener('click', (e) => {
    e.stopPropagation();

    $stickySearchBarWrapper.classList.remove('collapsed');
    setTimeout(() => {
      if (!$stickySearchBarWrapper.classList.contains('collapsed')) {
        $stickySearchBarWrapper.classList.add('ready');
      }
    }, 500);
  }, { passive: true });

  $stickySearchBarWrapper.addEventListener('mouseenter', () => {
    $stickySearchBarWrapper.classList.remove('collapsed');
    setTimeout(() => {
      if (!$stickySearchBarWrapper.classList.contains('collapsed')) {
        $stickySearchBarWrapper.classList.add('ready');
      }
    }, 500);
  }, { passive: true });

  $stickySearchBarWrapper.addEventListener('mouseleave', () => {
    if (!$stickySearchBar || $stickySearchBar !== document.activeElement) {
      $stickySearchBarWrapper.classList.remove('ready');
      $stickySearchBarWrapper.classList.add('collapsed');
      resetTaskDropdowns($section);
    }
  }, { passive: true });
}

function updateLottieStatus($section) {
  const $drawer = $section.querySelector('.filter-drawer-mobile');
  const $inWrapper = $drawer.querySelector('.filter-drawer-mobile-inner-wrapper');
  const $lottieArrows = $drawer.querySelector('.lottie-wrapper');
  if ($lottieArrows) {
    if ($inWrapper.scrollHeight - $inWrapper.scrollTop === $inWrapper.offsetHeight) {
      $lottieArrows.style.display = 'none';
      $drawer.classList.remove('scrollable');
    } else {
      $lottieArrows.style.removeProperty('display');
      $drawer.classList.add('scrollable');
    }
  }
}

function decorateCategoryList($block, $section, placeholders) {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (params.tasks) {
    const locale = getLocale(window.location);
    const $blockWrapper = $block.closest('.template-list-wrapper');
    const $mobileDrawerWrapper = $section.querySelector('.filter-drawer-mobile');
    const $inWrapper = $section.querySelector('.filter-drawer-mobile-inner-wrapper');
    const categories = JSON.parse(placeholders['task-categories']);
    const categoryIcons = placeholders['task-category-icons'].replace(/\s/g, '').split(',');
    const $categoriesDesktopWrapper = createTag('div', { class: 'category-list-wrapper' });
    const $categoriesToggleWrapper = createTag('div', { class: 'category-list-toggle-wrapper' });
    const $categoriesToggle = createTag('span', { class: 'category-list-toggle' });
    const $categories = createTag('ul', { class: 'category-list' });

    $categoriesToggle.textContent = placeholders['jump-to-category'];

    $categoriesToggleWrapper.append($categoriesToggle);
    $categoriesDesktopWrapper.append($categoriesToggleWrapper, $categories);

    Object.entries(categories).forEach((category, index) => {
      const format = `${props.placeholderFormat[0]}:${props.placeholderFormat[1]}`;
      const targetTasks = category[1];
      const currentTasks = trimFormattedFilterText(props.filters.tasks) ? trimFormattedFilterText(props.filters.tasks) : "''";
      const currentTopic = trimFormattedFilterText(props.filters.topics);

      const $listItem = createTag('li');
      if (category[1] === currentTasks) {
        $listItem.classList.add('active');
      }

      let icon;
      if (categoryIcons[index] && categoryIcons[index] !== '') {
        icon = categoryIcons[index];
      } else {
        icon = 'template-static';
      }

      const iconElement = getIconElement(icon);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      const $a = createTag('a', {
        'data-tasks': targetTasks,
        href: `${urlPrefix}/express/templates/search?tasks=${targetTasks}&phformat=${format}&topics=${currentTopic || "''"}`,
      });
      [$a.textContent] = category;

      $a.prepend(iconElement);
      $listItem.append($a);
      $categories.append($listItem);
    });

    const $categoriesMobileWrapper = $categoriesDesktopWrapper.cloneNode({ deep: true });

    const $lottieArrows = createTag('a', { class: 'lottie-wrapper' });
    $mobileDrawerWrapper.append($lottieArrows);
    $inWrapper.append($categoriesMobileWrapper);
    $lottieArrows.innerHTML = getLottie('purple-arrows', '/express/icons/purple-arrows.json');
    lazyLoadLottiePlayer();

    $categoriesDesktopWrapper.classList.add('desktop-only');

    if ($blockWrapper) {
      $blockWrapper.prepend($categoriesDesktopWrapper);
      $blockWrapper.classList.add('with-categories-list');
    }

    const $toggleButton = $categoriesMobileWrapper.querySelector('.category-list-toggle-wrapper');
    $toggleButton.append(getIconElement('drop-down-arrow'));
    $toggleButton.addEventListener('click', () => {
      const $listWrapper = $toggleButton.parentElement;
      $toggleButton.classList.toggle('collapsed');
      if ($toggleButton.classList.contains('collapsed')) {
        if ($listWrapper.classList.contains('desktop-only')) {
          $listWrapper.classList.add('collapsed');
          $listWrapper.style.maxHeight = '40px';
        } else {
          $listWrapper.classList.add('collapsed');
          $listWrapper.style.maxHeight = '24px';
        }
      } else {
        $listWrapper.classList.remove('collapsed');
        $listWrapper.style.maxHeight = '1000px';
      }

      setTimeout(() => {
        if (!$listWrapper.classList.contains('desktop-only')) {
          updateLottieStatus($section);
        }
      }, 510);
    }, { passive: true });

    $lottieArrows.addEventListener('click', () => {
      $inWrapper.scrollBy({
        top: 300,
        behavior: 'smooth',
      });
    }, { passive: true });

    $inWrapper.addEventListener('scroll', () => {
      updateLottieStatus($section);
    }, { passive: true });
  }
}

async function decorateSearchFunctions($toolBar, $section, placeholders) {
  const $inBlockLocation = $toolBar.querySelector('.wrapper-content-search');
  const $inSectionLocation = $section.querySelector('.link-list-wrapper');
  const $searchBarWrapper = createTag('div', { class: 'search-bar-wrapper' });
  const $searchForm = createTag('form', { class: 'search-form' });
  const $searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    placeholder: placeholders['template-search-placeholder'] ?? 'Search for over 50,000 templates',
    enterKeyHint: placeholders.search ?? 'Search',
  });

  // Tasks Dropdown
  const $taskDropdownContainer = createTag('div', { class: 'task-dropdown-container' });
  const $taskDropdown = createTag('div', { class: 'task-dropdown' });
  const $taskDropdownChev = getIconElement('drop-down-arrow');
  const $taskDropdownToggle = createTag('button', { class: 'task-dropdown-toggle' });
  const $taskDropdownList = createTag('ul', { class: 'task-dropdown-list' });
  const categories = JSON.parse(placeholders['task-categories']);
  const categoryIcons = placeholders['task-category-icons'].replace(/\s/g, '').split(',');
  let optionMatched = false;

  Object.entries(categories).forEach((category, index) => {
    const $itemIcon = getIconElement(categoryIcons[index]);
    const $listItem = createTag('li', { class: 'option', 'data-tasks': category[1] });
    [$listItem.textContent] = category;
    $listItem.prepend($itemIcon);
    $taskDropdownList.append($listItem);

    if (handlelize($listItem.dataset.tasks) === trimFormattedFilterText(props.filters.tasks)) {
      optionMatched = true;
      $listItem.classList.add('active');
      $taskDropdownToggle.textContent = $listItem.textContent;
    }
  });

  if (!optionMatched) {
    const $optionAll = $taskDropdownList.querySelector('.option[data-tasks="\'\'"]');
    if ($optionAll) {
      $optionAll.classList.add('active');
      $taskDropdownToggle.textContent = $optionAll.textContent;
    }
  }

  $searchForm.append($searchBar);
  $searchBarWrapper.append(getIconElement('search'), getIconElement('search-clear'));
  $taskDropdownContainer.append($taskDropdown);
  $taskDropdown.append($taskDropdownToggle, $taskDropdownList, $taskDropdownChev);
  $searchBarWrapper.append($searchForm, $taskDropdownContainer);

  const $stickySearchBarWrapper = $searchBarWrapper.cloneNode({ deep: true });

  $stickySearchBarWrapper.classList.add('sticky-search-bar');
  $stickySearchBarWrapper.classList.add('collapsed');
  $inBlockLocation.append($stickySearchBarWrapper);
  $inSectionLocation.insertAdjacentElement('beforebegin', $searchBarWrapper);

  initSearchFunction($toolBar, $stickySearchBarWrapper, $searchBarWrapper);
}

function closeDrawer($toolBar) {
  const $drawerBackground = $toolBar.querySelector('.drawer-background');
  const $drawer = $toolBar.querySelector('.filter-drawer-mobile');
  const $applyButton = $toolBar.querySelector('.apply-filter-button-wrapper');

  $drawer.classList.add('retracted');
  $drawerBackground.classList.add('transparent');
  $applyButton.classList.add('transparent');

  setTimeout(() => {
    $drawer.classList.add('hidden');
    $drawerBackground.classList.add('hidden');
    $applyButton.classList.add('hidden');
  }, 500);
}

function updateOptionsStatus($block, $toolBar) {
  const $wrappers = $toolBar.querySelectorAll('.function-wrapper');

  $wrappers.forEach(($wrapper) => {
    const $currentOption = $wrapper.querySelector('.current-option');
    const $options = $wrapper.querySelectorAll('.option-button');

    $options.forEach(($option) => {
      const paramType = $wrapper.dataset.param;
      const paramValue = paramType === 'sort' ? $option.dataset.value : `(${$option.dataset.value})`;
      if (props[paramType] === paramValue
        || props.filters[paramType] === paramValue
        || ((!props.filters[paramType] || props.filters[paramType] === '()') && paramValue === '(remove)')) {
        const drawerCs = ['filter-drawer-mobile-inner-wrapper', 'functions-drawer'];
        let toReorder = false;
        if (drawerCs.every((className) => !$wrapper.parentElement.classList.contains(className))) {
          toReorder = true;
        }

        if (toReorder) {
          $option.parentElement.prepend($option);
        }
        if ($currentOption) {
          $currentOption.textContent = $option.textContent;
        }

        $options.forEach((o) => {
          if ($option !== o) {
            o.classList.remove('active');
          }
        });
        $option.classList.add('active');
      }
    });

    updateFilterIcon($block);
  });
}

function initDrawer($block, $section, $toolBar) {
  const $filterButton = $toolBar.querySelector('.filter-button-mobile-wrapper');
  const $drawerBackground = $toolBar.querySelector('.drawer-background');
  const $drawer = $toolBar.querySelector('.filter-drawer-mobile');
  const $closeDrawer = $toolBar.querySelector('.close-drawer');
  const $applyButton = $toolBar.querySelector('.apply-filter-button-wrapper');

  const $functionWrappers = $drawer.querySelectorAll('.function-wrapper');

  let currentFilters;

  $filterButton.addEventListener('click', () => {
    currentFilters = { ...props.filters };
    $drawer.classList.remove('hidden');
    $drawerBackground.classList.remove('hidden');
    $applyButton.classList.remove('hidden');
    updateLottieStatus($section);
    closeTaskDropdown($toolBar);

    setTimeout(() => {
      $drawer.classList.remove('retracted');
      $drawerBackground.classList.remove('transparent');
      $applyButton.classList.remove('transparent');
      $functionWrappers.forEach(($wrapper) => {
        const $button = $wrapper.querySelector('.button-wrapper');
        if ($button) {
          $button.style.maxHeight = `${$button.nextElementSibling.offsetHeight}px`;
        }
      });
    }, 100);
  }, { passive: true });

  [$drawerBackground, $closeDrawer].forEach(($element) => {
    $element.addEventListener('click', () => {
      props.filters = { ...currentFilters };
      closeDrawer($toolBar);
      updateOptionsStatus($block, $toolBar);
    }, { passive: true });
  });

  $drawer.classList.remove('hidden');
  $functionWrappers.forEach(($wrapper) => {
    const $button = $wrapper.querySelector('.button-wrapper');
    let maxHeight;
    if ($button) {
      const wrapperMaxHeightGrabbed = setInterval(() => {
        if ($wrapper.offsetHeight > 0) {
          maxHeight = `${$wrapper.offsetHeight}px`;
          $wrapper.style.maxHeight = maxHeight;
          clearInterval(wrapperMaxHeightGrabbed);
        }
      }, 200);

      $button.addEventListener('click', (e) => {
        e.stopPropagation();
        const button = $wrapper.querySelector('.button-wrapper');
        if (button) {
          const minHeight = `${button.offsetHeight - 8}px`;
          $wrapper.classList.toggle('collapsed');
          $wrapper.style.maxHeight = $wrapper.classList.contains('collapsed') ? minHeight : maxHeight;
        }
      }, { passive: true });
    }
  });

  $drawer.classList.add('hidden');
}

function updateQueryURL(functionWrapper, option) {
  const paramType = functionWrapper.dataset.param;
  const paramValue = option.dataset.value;

  if (paramType === 'sort') {
    props.sort = paramValue;
  } else {
    const filtersObj = props.filters;

    if (paramType in filtersObj) {
      if (paramValue === 'remove') {
        delete filtersObj[paramType];
      } else {
        filtersObj[paramType] = `(${paramValue})`;
      }
    } else if (paramValue !== 'remove') {
      filtersObj[paramType] = `(${paramValue})`;
    }

    props.filters = filtersObj;
  }
}

function updateLoadMoreButton($block, $loadMore) {
  if (props.start === '') {
    $loadMore.style.display = 'none';
  } else {
    $loadMore.style.removeProperty('display');
  }
}

async function decorateNewTemplates($block, options = { reDrawMasonry: false }) {
  const newTemplates = await processResponse();
  const $loadMore = $block.parentElement.querySelector('.load-more');

  props.templates = props.templates.concat(newTemplates);
  populateTemplates($block, newTemplates);

  const newCells = Array.from($block.querySelectorAll('.template:not(.appear)'));

  if (options.reDrawMasonry) {
    props.masonry.cells = [props.masonry.cells[0]].concat(newCells);
  } else {
    props.masonry.cells = props.masonry.cells.concat(newCells);
  }
  props.masonry.draw(newCells);

  if ($loadMore) {
    updateLoadMoreButton($block, $loadMore);
  }
}

async function redrawTemplates($block, $toolBar) {
  const $heading = $toolBar.querySelector('h2');
  const lang = getLanguage(getLocale(window.location));
  const currentTotal = props.total.toLocaleString(lang);
  props.templates = [props.templates[0]];
  props.start = '';
  $block.querySelectorAll('.template:not(.placeholder)').forEach(($card) => {
    $card.remove();
  });

  await decorateNewTemplates($block, { reDrawMasonry: true }).then(() => {
    $heading.textContent = $heading.textContent.replace(`${currentTotal}`, props.total.toLocaleString(lang));
    updateOptionsStatus($block, $toolBar);
    if ($block.querySelectorAll('.template').length <= 0) {
      const $viewButtons = $toolBar.querySelectorAll('.view-toggle-button');
      $viewButtons.forEach(($button) => {
        $button.classList.remove('active');
      });
      ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
        $block.classList.remove(className);
      });
    }
  });
}

async function toggleAnimatedText($block, $toolBar) {
  const section = $block.closest('.section.template-list-fullwidth-apipowered-container');
  const $toolbarWrapper = $toolBar.parentElement;

  if (section) {
    const placeholders = await fetchPlaceholders();
    const existingText = section.querySelector('.animated-template-text');
    const animatedTemplateText = createTag('h5', { class: 'animated-template-text' });
    animatedTemplateText.textContent = placeholders['open-to-see-animation'];

    if (existingText) {
      existingText.remove();
    }

    if (props.filters.animated === '(true)') {
      $toolbarWrapper.insertAdjacentElement('afterend', animatedTemplateText);
    }
  }
}

function initFilterSort($block, $toolBar) {
  const $buttons = $toolBar.querySelectorAll('.button-wrapper');
  const $applyFilterButton = $toolBar.querySelector('.apply-filter-button');

  if ($buttons.length > 0) {
    $buttons.forEach(($button) => {
      const $wrapper = $button.parentElement;
      const $currentOption = $wrapper.querySelector('span.current-option');
      const $optionsList = $button.nextElementSibling;
      const $options = $optionsList.querySelectorAll('.option-button');

      $button.addEventListener('click', () => {
        if (!$button.classList.contains('in-drawer')) {
          $buttons.forEach((b) => {
            if ($button !== b) {
              b.parentElement.classList.remove('opened');
            }
          });

          $wrapper.classList.toggle('opened');
        }

        closeTaskDropdown($toolBar);
      }, { passive: true });

      $options.forEach(($option) => {
        const updateOptions = async () => {
          $buttons.forEach((b) => {
            b.parentElement.classList.remove('opened');
          });

          if ($currentOption) {
            $currentOption.textContent = $option.textContent;
          }

          $options.forEach((o) => {
            if ($option !== o) {
              o.classList.remove('active');
            }
          });
          $option.classList.add('active');

          updateQueryURL($wrapper, $option);
          updateFilterIcon($block);

          if (!$optionsList.classList.contains('in-drawer')) {
            await toggleAnimatedText($block, $toolBar);
          }

          if (!$button.classList.contains('in-drawer')) {
            await redrawTemplates($block, $toolBar);
          }
        };

        const radio = $option.querySelector('.option-radio');
        if (radio) {
          radio.addEventListener('keydown', async (e) => {
            e.stopPropagation();
            if (e.keyCode === 13) {
              await updateOptions();
            }
          }, { passive: true });
        }

        $option.addEventListener('click', async (e) => {
          e.stopPropagation();
          await updateOptions();
        }, { passive: true });
      });

      document.addEventListener('click', (e) => {
        const { target } = e;
        if (target !== $wrapper && !$wrapper.contains(target) && !$button.classList.contains('in-drawer')) {
          $wrapper.classList.remove('opened');
        }
      }, { passive: true });
    });

    if ($applyFilterButton) {
      $applyFilterButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await redrawTemplates($block, $toolBar);
        closeDrawer($toolBar);
        await toggleAnimatedText($block, $toolBar);
      });
    }

    // sync current filter & sorting method with toolbar current options
    updateOptionsStatus($block, $toolBar);
    updateFilterIcon($block);
  }
}

function getPlaceholderWidth($block) {
  let width;
  if (window.innerWidth >= 900) {
    if ($block.classList.contains('sm-view')) {
      width = 165;
    }

    if ($block.classList.contains('md-view')) {
      width = 258.5;
    }

    if ($block.classList.contains('lg-view')) {
      width = 352;
    }
  } else if (window.innerWidth >= 600) {
    if ($block.classList.contains('sm-view')) {
      width = 165;
    }

    if ($block.classList.contains('md-view')) {
      width = 227.33;
    }

    if ($block.classList.contains('lg-view')) {
      width = 352;
    }
  } else {
    if ($block.classList.contains('sm-view')) {
      width = 106.33;
    }

    if ($block.classList.contains('md-view')) {
      width = 165.5;
    }

    if ($block.classList.contains('lg-view')) {
      width = 335;
    }
  }

  return width;
}

function toggleMasonryView($block, $button, $toggleButtons) {
  const $templatesToView = $block.querySelectorAll('.template:not(.placeholder)');
  const $blockWrapper = $block.closest('.template-list-wrapper');
  if (!$button.classList.contains('active') && $templatesToView.length > 0) {
    $toggleButtons.forEach((b) => {
      if (b !== $button) {
        b.classList.remove('active');
      }
    });

    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      if (className !== `${$button.dataset.view}-view`) {
        $block.classList.remove(className);
        $blockWrapper.classList.remove(className);
      }
    });
    $button.classList.add('active');
    $block.classList.add(`${$button.dataset.view}-view`);
    $blockWrapper.classList.add(`${$button.dataset.view}-view`);

    props.masonry.draw();
  } else {
    $button.classList.remove('active');
    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      $block.classList.remove(className);
      $blockWrapper.classList.remove(className);
    });

    props.masonry.draw();
  }

  const placeholder = $block.querySelector('.template.placeholder');
  const ratios = props.placeholderFormat;
  const width = getPlaceholderWidth($block);

  if (ratios[1]) {
    const height = (ratios[1] / ratios[0]) * width;
    placeholder.style = `height: ${height - 21}px`;
    if (width / height > 1.3) {
      placeholder.classList.add('wide');
    }
  }
}

function initViewToggle($block, $toolBar) {
  const $toggleButtons = $toolBar.querySelectorAll('.view-toggle-button ');

  $toggleButtons.forEach(($button, index) => {
    if (index === 0) {
      toggleMasonryView($block, $button, $toggleButtons);
    }

    $button.addEventListener('click', () => {
      toggleMasonryView($block, $button, $toggleButtons);
    }, { passive: true });
  });
}

function initToolbarShadow($block, $toolbar) {
  const $toolbarWrapper = $toolbar.parentElement;
  document.addEventListener('scroll', () => {
    if ($toolbarWrapper.getBoundingClientRect().top <= 0) {
      $toolbarWrapper.classList.add('with-box-shadow');
    } else {
      $toolbarWrapper.classList.remove('with-box-shadow');
    }
  });
}

function decorateToolbar($block, $section, placeholders) {
  const $toolBar = $section.querySelector('.api-templates-toolbar');

  if ($toolBar) {
    const toolBarFirstWrapper = $toolBar.querySelector('.wrapper-content-search');
    const functionsWrapper = $toolBar.querySelector('.wrapper-functions');

    const $viewsWrapper = createTag('div', { class: 'views' });

    const smView = createTag('a', { class: 'view-toggle-button small-view', 'data-view': 'sm' });
    smView.append(getIconElement('small_grid'));
    const mdView = createTag('a', { class: 'view-toggle-button medium-view', 'data-view': 'md' });
    mdView.append(getIconElement('medium_grid'));
    const lgView = createTag('a', { class: 'view-toggle-button large-view', 'data-view': 'lg' });
    lgView.append(getIconElement('large_grid'));

    const functionsObj = makeTemplateFunctions(placeholders);
    const $functions = decorateFunctionsContainer($block, $section, functionsObj, placeholders);

    $viewsWrapper.append(smView, mdView, lgView);
    functionsWrapper.append($viewsWrapper, $functions.desktop);

    $toolBar.append(toolBarFirstWrapper, functionsWrapper, $functions.mobile);

    decorateSearchFunctions($toolBar, $section, placeholders);
    initDrawer($block, $section, $toolBar);
    initFilterSort($block, $toolBar);
    initViewToggle($block, $toolBar);
    initToolbarShadow($block, $toolBar);
  }
}

export async function decorateTemplateList($block) {
  const locale = getLocale(window.location);
  const placeholders = await fetchPlaceholders().then((result) => result);
  if ($block.classList.contains('apipowered')) {
    await readRowsFromBlock($block);

    const $parent = $block.closest('.section');
    if ($parent) {
      if ($block.classList.contains('holiday')) {
        if (props.backgroundColor) {
          $parent.style.background = props.backgroundColor;
        }
        const $wrapper = $parent.querySelector('.template-list-wrapper');
        const $icon = props.heading.querySelector('picture');
        const $content = Array.from(props.heading.querySelectorAll('p'))
          .filter((p) => p.textContent.trim() !== '' && p.querySelector('a') === null);
        const $seeTemplatesLink = props.heading.querySelector('a');

        const $toggleBar = createTag('div', { class: 'toggle-bar' });
        const $toggle = createTag('div', { class: 'expanded toggle-button' });
        const $toggleChev = createTag('div', { class: 'toggle-button-chev' });
        const $topElements = createTag('div', { class: 'toggle-bar-top' });
        const $bottomElements = createTag('div', { class: 'toggle-bar-bottom' });
        const $mobileSubtext = $content[1].cloneNode(true);

        $seeTemplatesLink.classList.remove('button');
        $seeTemplatesLink.classList.remove('accent');
        $mobileSubtext.classList.add('mobile-only');

        $toggleBar.append($topElements, $bottomElements);
        if ($icon) {
          $parent.classList.add('with-icon');
          $topElements.append($icon, $content[0]);
        }
        $topElements.append($content[0]);
        $toggle.append($seeTemplatesLink, $toggleChev);
        $bottomElements.append($content[1], $toggle);
        $wrapper.prepend($mobileSubtext);

        const $mobileToggle = $toggle.cloneNode(true);
        $mobileToggle.classList.add('mobile-only');

        $wrapper.insertAdjacentElement('afterend', $mobileToggle);
        $wrapper.classList.add('expanded');

        $parent.prepend($toggleBar);
        $parent.classList.add('expanded');
        initToggle($parent);

        setTimeout(() => {
          if ($wrapper.classList.contains('expanded')) {
            const $toggleButtons = $parent.querySelectorAll('.toggle-button');

            $wrapper.classList.toggle('expanded');
            $parent.classList.toggle('expanded');
            Array.from($toggleButtons)
              .forEach(($button) => {
                $button.classList.toggle('expanded');
              });
          }
        }, props.autoCollapseDelay);
      } else {
        const $toolBar = $parent.querySelector('.default-content-wrapper');
        const $templateListWrapper = $parent.querySelector('.template-list-wrapper');
        const $sectionHeading = $parent.querySelector('div > h2');
        let $sectionSlug = null;

        const $toolBarWrapper = createTag('div', { class: 'toolbar-wrapper' });
        const $contentWrapper = createTag('div', { class: 'wrapper-content-search' });
        const $functionsWrapper = createTag('div', { class: 'wrapper-functions' });

        if ($sectionHeading.textContent.trim().indexOf('{{heading_placeholder}}') >= 0) {
          if ($block.classList.contains('spreadsheet-powered') && props.headingTitle) {
            $sectionHeading.textContent = props.headingTitle || '';

            if (props.headingSlug) {
              $sectionSlug = createTag('p');
              $sectionSlug.textContent = props.headingSlug;
            }
          } else if (props.authoringError) {
            $sectionHeading.textContent = props.heading;
          } else {
            $sectionHeading.textContent = await populateHeadingPlaceholder(locale) || '';
          }
        }

        $toolBar.classList.add('api-templates-toolbar');
        $toolBar.classList.remove('default-content-wrapper');

        $templateListWrapper.before($toolBarWrapper);
        $toolBarWrapper.append($toolBar);
        $toolBar.append($contentWrapper, $functionsWrapper);
        $contentWrapper.append($sectionHeading);

        if ($sectionSlug) {
          $contentWrapper.append($sectionSlug);
        }
      }

      const $linkList = $parent.querySelector('.link-list-wrapper');
      if ($linkList
        && $linkList.previousElementSibling.classList.contains('hero-animation-wrapper')
        && placeholders['template-filter-premium']) {
        document.addEventListener('linkspopulated', (e) => {
          if (e.detail.length > 0 && e.detail[0].parentElement.classList.contains('template-list')) {
            decorateToolbar($block, $parent, placeholders);
            decorateCategoryList($block, $parent, placeholders);
            appendCategoryTemplatesCount($parent);
          }
        });
      }
    }
  }

  let rows = $block.children.length;
  if ((rows === 0 || $block.querySelectorAll('img').length === 0) && locale !== 'us') {
    const i18nTexts = $block.firstElementChild
      // author defined localized edit text(s)
      && ($block.firstElementChild.querySelector('p')
        // multiple lines in separate p tags
        ? Array.from($block.querySelectorAll('p'))
          .map(($p) => $p.textContent.trim())
        // single text directly in div
        : [$block.firstElementChild.textContent.trim()]);
    $block.innerHTML = '';
    const tls = Array.from($block.closest('main')
      .querySelectorAll('.template-list'));
    const i = tls.indexOf($block);

    const $blueprint = await fetchBlueprint(window.location.pathname);

    const $bpBlocks = $blueprint.querySelectorAll('.template-list');
    if ($bpBlocks[i] && $bpBlocks[i].className === $block.className) {
      $block.innerHTML = $bpBlocks[i].innerHTML;
    } else if ($bpBlocks.length > 1 && $bpBlocks[i].className !== $block.className) {
      for (let x = 0; x < $bpBlocks.length; x += 1) {
        if ($bpBlocks[x].className === $block.className) {
          $block.innerHTML = $bpBlocks[x].innerHTML;
          break;
        }
      }
    } else {
      $block.remove();
    }

    if (i18nTexts && i18nTexts.length > 0) {
      const [placeholderText] = i18nTexts;
      let [, templateText] = i18nTexts;
      if (!templateText) {
        templateText = placeholderText;
      }
      $block.querySelectorAll('a')
        .forEach(($a, index) => {
          $a.textContent = index === 0 ? placeholderText : templateText;
        });
    }

    const $heroPicture = document.querySelector('.hero-bg');

    if (!$heroPicture && $blueprint) {
      const $bpHeroImage = $blueprint.querySelector('div:first-of-type img');
      if ($bpHeroImage) {
        const $heroSection = document.querySelector('main .hero');
        const $heroDiv = document.querySelector('main .hero > div');

        if ($heroSection && !$heroDiv) {
          const $p = createTag('p');
          const $pic = createTag('picture', { class: 'hero-bg' });
          $pic.appendChild($bpHeroImage);
          $p.append($pic);
          $heroSection.classList.remove('hero-noimage');
          $heroDiv.prepend($p);
        }
      }
    }
  }

  const templates = Array.from($block.children);
  // process single column first row as title
  if (templates[0] && templates[0].children.length === 1) {
    const $parent = $block.closest('.section');
    const $titleRow = templates.shift();
    $titleRow.classList.add('template-title');
    $titleRow.querySelectorAll(':scope a')
      .forEach(($a) => {
        $a.className = 'template-title-link';
        const p = $a.closest('p');
        if (p) {
          p.classList.remove('button-container');
        }
      });

    if ($parent && $parent.classList.contains('toc-container')) {
      const $tocCollidingArea = createTag('div', { class: 'toc-colliding-area' });
      const $tocSlot = createTag('div', { class: 'toc-slot' });
      const h2 = $titleRow.querySelector('h2');
      if (h2) {
        h2.parentElement.prepend($tocCollidingArea);
        $tocCollidingArea.append($tocSlot, h2);
      }
    }

    if ($block.classList.contains('collaboration')) {
      const $titleHeading = $titleRow.querySelector('h3');
      const $anchorLink = createTag('a', {
        class: 'collaboration-anchor',
        href: `${document.URL.replace(/#.*$/, '')}#${$titleHeading.id}`,
      });
      const $clipboardTag = createTag('span', { class: 'clipboard-tag' });
      $clipboardTag.textContent = placeholders['tag-copied'];

      $anchorLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText($anchorLink.href);
        $anchorLink.classList.add('copied');
        setTimeout(() => {
          $anchorLink.classList.remove('copied');
        }, 2000);
      });

      $anchorLink.append($clipboardTag);
      $titleHeading.append($anchorLink);
    }
  }

  rows = templates.length;
  let breakpoints = [{ width: '400' }];

  if (rows > 6 && !$block.classList.contains('horizontal')) {
    $block.classList.add('masonry');
  }

  if (rows === 1) {
    $block.classList.add('large');
    breakpoints = [{
      media: '(min-width: 600px)',
      width: '2000',
    }, { width: '750' }];
  }

  $block.querySelectorAll(':scope picture > img').forEach(($img) => {
    const { src, alt } = $img;
    $img.parentNode.replaceWith(createOptimizedPicture(src, alt, true, breakpoints));
  });

  // find the edit link and turn the template DIV into the A
  // A
  // +- DIV
  //    +- PICTURE
  // +- DIV
  //    +- SPAN
  //       +- "Edit this template"
  //
  // make copy of children to avoid modifying list while looping

  populateTemplates($block, templates);
  if (!$block.classList.contains('horizontal')) {
    if (rows > 6 || $block.classList.contains('sixcols') || $block.classList.contains('fullwidth')) {
      /* flex masonry */
      const cells = Array.from($block.children);
      $block.classList.remove('masonry');
      $block.classList.add('flex-masonry');

      props.masonry = new Masonry($block, cells);
      props.masonry.draw();
      window.addEventListener('resize', () => {
        props.masonry.draw();
      });
    } else {
      $block.classList.add('template-list-complete');
    }
  }

  await attachFreeInAppPills($block);

  const $templateLinks = $block.querySelectorAll('a.template');
  const linksPopulated = new CustomEvent('linkspopulated', { detail: $templateLinks });
  document.dispatchEvent(linksPopulated);
}

async function decorateLoadMoreButton($block) {
  const placeholders = await fetchPlaceholders()
    .then((result) => result);
  const $loadMoreDiv = createTag('div', { class: 'load-more' });
  const $loadMoreButton = createTag('button', { class: 'load-more-button' });
  const $loadMoreText = createTag('p', { class: 'load-more-text' });
  $loadMoreDiv.append($loadMoreButton, $loadMoreText);
  $loadMoreText.textContent = placeholders['load-more'];
  $block.insertAdjacentElement('afterend', $loadMoreDiv);
  $loadMoreButton.append(getIconElement('plus-icon'));

  $loadMoreButton.addEventListener('click', async () => {
    $loadMoreButton.classList.add('disabled');
    const scrollPosition = window.scrollY;
    await decorateNewTemplates($block);
    window.scrollTo({
      top: scrollPosition,
      left: 0,
      behavior: 'smooth',
    });
    $loadMoreButton.classList.remove('disabled');
  });

  return $loadMoreDiv;
}

async function decorateTailButton($block) {
  const $carouselPlatform = $block.querySelector('.carousel-platform');

  if ($block.classList.contains('spreadsheet-powered')) {
    const placeholders = await fetchPlaceholders().then((result) => result);

    if (placeholders['relevant-rows-view-all'] && (props.viewAllLink || placeholders['relevant-rows-view-all-link'])) {
      props.tailButton = createTag('a', { class: 'button accent tail-cta' });
      props.tailButton.innerText = placeholders['relevant-rows-view-all'];
      props.tailButton.href = props.viewAllLink || placeholders['relevant-rows-view-all-link'];
    }
  }

  if ($carouselPlatform && props.tailButton) {
    props.tailButton.classList.add('tail-cta');
    $carouselPlatform.append(props.tailButton);
  }
}

function cacheCreatedTemplate($block) {
  const lastRow = $block.children[$block.children.length - 1];
  if (lastRow && lastRow.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg')) {
    props.templates.push(lastRow.cloneNode(true));
    lastRow.remove();
  }
}

function addBackgroundAnimation($block, animationUrl) {
  const $parent = $block.closest('.template-list-horizontal-apipowered-holiday-container');

  if ($parent) {
    $parent.classList.add('with-animation');
    const $videoBackground = createTag('video', {
      class: 'animation-background',
    });
    $videoBackground.append(createTag('source', { src: animationUrl, type: 'video/mp4' }));
    $videoBackground.setAttribute('autoplay', '');
    $videoBackground.setAttribute('muted', '');
    $videoBackground.setAttribute('loop', '');
    $videoBackground.setAttribute('playsinline', '');
    $parent.prepend($videoBackground);
    $videoBackground.muted = true;
  }
}

export default async function decorate($block) {
  if ($block.classList.contains('spreadsheet-powered')) {
    const placeholders = await fetchPlaceholders().then((result) => result);
    const relevantRowsData = await fetchRelevantRows(window.location.pathname);
    props.limit = parseInt(placeholders['relevant-rows-templates-limit'], 10) || 10;

    if (relevantRowsData) {
      $block.closest('.section').dataset.audience = 'mobile';

      props.headingTitle = relevantRowsData.header || null;
      props.headingSlug = relevantRowsData.shortTitle || null;
      props.viewAllLink = relevantRowsData.viewAllLink || null;

      $block.innerHTML = $block.innerHTML.replaceAll('default-title', relevantRowsData.shortTitle || '');
      $block.innerHTML = $block.innerHTML.replaceAll('default-tasks', relevantRowsData.templateTasks || '');
      $block.innerHTML = $block.innerHTML.replaceAll('default-topics', relevantRowsData.templateTopics || '');
      $block.innerHTML = $block.innerHTML.replaceAll('default-locale', relevantRowsData.templateLocale || 'en');
      $block.innerHTML = $block.innerHTML.replaceAll('default-premium', relevantRowsData.templatePremium || '');
      $block.innerHTML = $block.innerHTML.replaceAll('default-animated', relevantRowsData.templateAnimated || '');
      $block.innerHTML = $block.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', relevantRowsData.createLink || '/');
      $block.innerHTML = $block.innerHTML.replaceAll('default-format', relevantRowsData.placeholderFormat || '');

      if (relevantRowsData.templateTasks === '') {
        $block.innerHTML = $block.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
      } else {
        $block.innerHTML = $block.innerHTML.replaceAll('default-create-link-text', relevantRowsData.createText || '');
      }
    } else {
      $block.remove();
    }
  }

  if ($block.classList.contains('apipowered') && !$block.classList.contains('holiday')) {
    cacheCreatedTemplate($block);
  }

  await decorateTemplateList($block);

  if ($block.classList.contains('horizontal')) {
    const requireInfiniteScroll = !$block.classList.contains('mini') && !$block.classList.contains('collaboration');
    buildCarousel(':scope > .template', $block, requireInfiniteScroll);
  } else {
    addAnimationToggle($block);
  }

  if ($block.classList.contains('apipowered') && !$block.classList.contains('holiday') && !$block.classList.contains('mini')) {
    const $loadMore = await decorateLoadMoreButton($block);

    if ($loadMore) {
      updateLoadMoreButton($block, $loadMore);
    }
  }

  if ($block.classList.contains('mini') || $block.classList.contains('apipowered')) {
    decorateTailButton($block);
  }

  if ($block.classList.contains('holiday') && props.backgroundAnimation) {
    addBackgroundAnimation($block, props.backgroundAnimation);
  }
}
