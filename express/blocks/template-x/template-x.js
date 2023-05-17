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
  addSearchQueryToHref,
  createOptimizedPicture,
  createTag,
  decorateMain,
  fetchPlaceholders,
  getIconElement,
  getLocale,
  getLottie,
  lazyLoadLottiePlayer,
  toClassName,
  getLanguage,
} from '../../scripts/scripts.js';

import { Masonry } from '../shared/masonry.js';

import { buildCarousel } from '../shared/carousel.js';

import { fetchTemplates, isValidTemplate } from './template-search-api-v3.js';
import renderTemplate from './template-rendering.js';

function wordStartsWithVowels(word) {
  return word.match('^[aieouâêîôûäëïöüàéèùœAIEOUÂÊÎÔÛÄËÏÖÜÀÉÈÙŒ].*');
}

function camelize(str) {
  return str.replace(/^\w|[A-Z]|\b\w/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase())).replace(/\s+/g, '');
}

function getTextColorBasedOnBackground(colorString) {
  let r;
  let g;
  let b;

  if (colorString.match(/^rgb/)) {
    const colorValues = colorString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
    [r, g, b] = colorValues.slice(1);
  } else {
    const hexToRgb = +(`0x${colorString.slice(1).replace(colorString.length < 5 ? /./g : '', '$&$&')}`);
    // eslint-disable-next-line no-bitwise
    r = (hexToRgb >> 16) & 255;
    // eslint-disable-next-line no-bitwise
    g = (hexToRgb >> 8) & 255;
    // eslint-disable-next-line no-bitwise
    b = hexToRgb & 255;
  }

  const hsp = Math.sqrt(
    0.299 * (r * r)
    + 0.587 * (g * g)
    + 0.114 * (b * b),
  );

  if (hsp > 127.5) {
    return '#242424';
  } else {
    return '#fff';
  }
}

async function fetchAndRenderTemplates(props) {
  const [placeholders, response] = await Promise.all([fetchPlaceholders(), fetchTemplates(props)]);
  if (!response || !response.items || !Array.isArray(response.items)) {
    return null;
  }

  if ('_links' in response) {
    // eslint-disable-next-line no-underscore-dangle
    const nextQuery = response._links.next.href;
    const starts = new URLSearchParams(nextQuery).get('start').split(',');
    props.start = starts.join(',');
  } else {
    props.start = '';
  }

  props.total = response.metadata.totalHits;

  return response.items
    .filter((item) => isValidTemplate(item))
    .map((template) => renderTemplate(template, placeholders, props));
}

async function processContentRow(block, props) {
  // const placeholders = await fetchPlaceholders();

  const templateTitle = createTag('div', { class: 'template-title' });
  templateTitle.innerHTML = props.contentRow.outerHTML;

  const aTags = templateTitle.querySelectorAll(':scope a');

  if (aTags.length > 0) {
    templateTitle.classList.add('with-link');
    aTags.forEach((aTag) => {
      aTag.className = 'template-title-link';
      const p = aTag.closest('p');
      if (p) {
        p.classList.remove('button-container');
      }
    });
  }

  block.prepend(templateTitle);

  if (props.orientation.toLowerCase() === 'horizontal') templateTitle.classList.add('horizontal');

  // todo: build collaboration and holiday variants
  // if (block.classList.contains('collaboration')) {
  //   const titleHeading = props.contentRow.querySelector('h3');
  //   const anchorLink = createTag('a', {
  //     class: 'collaboration-anchor',
  //     href: `${document.URL.replace(/#.*$/, '')}#${titleHeading.id}`,
  //   });
  //   const clipboardTag = createTag('span', { class: 'clipboard-tag' });
  //   clipboardTag.textContent = placeholders['tag-copied'];
  //
  //   anchorLink.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     navigator.clipboard.writeText(anchorLink.href);
  //     anchorLink.classList.add('copied');
  //     setTimeout(() => {
  //       anchorLink.classList.remove('copied');
  //     }, 2000);
  //   });
  //
  //   anchorLink.append(clipboardTag);
  //   titleHeading.append(anchorLink);
  // }
}

function constructProps(block) {
  const props = {
    templates: [],
    filters: {
      locales: 'en',
    },
    renditionParams: {
      format: 'jpg',
      size: 151,
    },
    tailButton: '',
    limit: 70,
    total: 0,
    start: '',
    sort: 'Most Viewed',
    masonry: undefined,
    headingTitle: null,
    headingSlug: null,
    viewAllLink: null,
    holidayIcon: null,
    backgroundColor: '#000B1D',
    backgroundAnimation: null,
    textColor: '#FFFFFF',
  };

  Array.from(block.children).forEach((row) => {
    const cols = row.querySelectorAll('div');
    const key = cols[0].querySelector('strong')?.textContent.trim().toLowerCase();
    if (cols.length === 1) {
      [props.contentRow] = cols;
    } else if (cols.length === 2) {
      const value = cols[1].textContent.trim();

      if (key && value) {
        if (['tasks', 'topics', 'locales'].includes(key) || (['premium', 'animated'].includes(key) && value.toLowerCase() !== 'all')) {
          props.filters[camelize(key)] = value;
        } else if (['yes', 'true', 'on', 'no', 'false', 'off'].includes(value.toLowerCase())) {
          props[camelize(key)] = ['yes', 'true', 'on'].includes(value.toLowerCase());
        } else {
          props[camelize(key)] = value;
        }
      }
    } else if (cols.length === 3) {
      if (key === 'template stats' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        props[camelize(key)] = cols[2].textContent.trim().toLowerCase();
      }
    } else if (cols.length === 4) {
      if (key === 'blank template') {
        cols[0].remove();
        props.templates.push(row);
      }
    } else if (cols.length === 5) {
      if (key === 'holiday block' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        const backgroundColor = cols[3].textContent.trim().toLowerCase();
        const holidayIcon = cols[2].querySelector('picture');
        const backgroundAnimation = cols[4].textContent.trim().toLowerCase();

        props.holidayBlock = true;
        props.holidayIcon = holidayIcon || null;
        if (backgroundColor) {
          props.backgroundColor = backgroundColor;
        }
        props.backgroundAnimation = backgroundAnimation || null;
        props.textColor = getTextColorBasedOnBackground(backgroundColor);
      }
    }
  });

  return props;
}

function populateTemplates(block, props, templates) {
  for (let tmplt of templates) {
    const isPlaceholder = tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
    const linkContainer = tmplt.querySelector(':scope > div:nth-of-type(2)');
    const rowWithLinkInFirstCol = tmplt.querySelector(':scope > div:first-of-type > a');
    const innerWrapper = block.querySelector('.template-x-inner-wrapper');

    if (innerWrapper && linkContainer) {
      const link = linkContainer.querySelector(':scope a');
      if (link) {
        if (isPlaceholder) {
          const aTag = createTag('a', {
            href: link.href ? addSearchQueryToHref(link.href) : '#',
          });

          aTag.append(...tmplt.children);
          tmplt.remove();
          tmplt = aTag;
          // convert A to SPAN
          const newLink = createTag('span', { class: 'template-link' });
          newLink.append(link.textContent.trim());

          linkContainer.innerHTML = '';
          linkContainer.append(newLink);
        }
        innerWrapper.append(tmplt);
      }
    }

    if (rowWithLinkInFirstCol && !tmplt.querySelector('img')) {
      props.tailButton = rowWithLinkInFirstCol;
      rowWithLinkInFirstCol.remove();
    }

    if (tmplt.children.length === 3) {
      // look for options in last cell
      const overlayCell = tmplt.querySelector(':scope > div:last-of-type');
      const option = overlayCell.textContent.trim();
      if (option) {
        if (isPlaceholder) {
          // add aspect ratio to template
          const sep = option.includes(':') ? ':' : 'x';
          const ratios = option.split(sep).map((e) => +e);
          props.placeholderFormat = ratios;
          if (block.classList.contains('horizontal')) {
            const height = block.classList.contains('mini') ? 100 : 200;
            if (ratios[1]) {
              const width = (ratios[0] / ratios[1]) * height;
              tmplt.style = `width: ${width}px`;
              if (width / height > 1.3) {
                tmplt.classList.add('tall');
              }
            }
          } else {
            const width = block.classList.contains('sixcols') || block.classList.contains('fullwidth') ? 165 : 200;
            if (ratios[1]) {
              const height = (ratios[1] / ratios[0]) * width;
              tmplt.style = `height: ${height - 21}px`;
              if (width / height > 1.3) {
                tmplt.classList.add('wide');
              }
            }
          }
        } else {
          // add icon to 1st cell
          const $icon = getIconElement(toClassName(option));
          $icon.setAttribute('title', option);
          tmplt.children[0].append($icon);
        }
      }
      overlayCell.remove();
    }

    if (!tmplt.querySelectorAll(':scope > div > *').length) {
      // remove empty row
      tmplt.remove();
    }
    tmplt.classList.add('template');

    if (isPlaceholder) {
      tmplt.classList.add('placeholder');
    }
  }
}

function updateLoadMoreButton(block, props, loadMore) {
  if (props.start === '') {
    loadMore.style.display = 'none';
  } else {
    loadMore.style.removeProperty('display');
  }
}

async function decorateNewTemplates(block, props, options = { reDrawMasonry: false }) {
  const newTemplates = await fetchAndRenderTemplates(props);
  const loadMore = block.parentElement.querySelector('.load-more');

  props.templates = props.templates.concat(newTemplates);
  populateTemplates(block, props, newTemplates);

  const newCells = Array.from(block.querySelectorAll('.template:not(.appear)'));

  if (options.reDrawMasonry) {
    props.masonry.cells = [props.masonry.cells[0]].concat(newCells);
  } else {
    props.masonry.cells = props.masonry.cells.concat(newCells);
  }
  props.masonry.draw(newCells);

  if (loadMore) {
    updateLoadMoreButton(block, props, loadMore);
  }
}

async function decorateLoadMoreButton(block, props) {
  const placeholders = await fetchPlaceholders();
  const loadMoreDiv = createTag('div', { class: 'load-more' });
  const loadMoreButton = createTag('button', { class: 'load-more-button' });
  const loadMoreText = createTag('p', { class: 'load-more-text' });
  loadMoreDiv.append(loadMoreButton, loadMoreText);
  loadMoreText.textContent = placeholders['load-more'];
  block.append(loadMoreDiv);
  loadMoreButton.append(getIconElement('plus-icon'));

  loadMoreButton.addEventListener('click', async () => {
    loadMoreButton.classList.add('disabled');
    const scrollPosition = window.scrollY;
    await decorateNewTemplates(block, props);
    window.scrollTo({
      top: scrollPosition,
      left: 0,
      behavior: 'smooth',
    });
    loadMoreButton.classList.remove('disabled');
  });

  return loadMoreDiv;
}

async function insertTemplateStats(props) {
  const locale = getLocale(window.location);
  const lang = getLanguage(getLocale(window.location));
  const templateCount = lang === 'es-ES' ? props.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : props.total.toLocaleString(lang);
  const heading = props.contentRow.textContent;
  const camelHeading = heading === 'Adobe Express' ? heading : heading.charAt(0).toLowerCase() + heading.slice(1);
  if (!heading) return null;

  const placeholders = await fetchPlaceholders();

  let grammarTemplate = props.templateStats || placeholders['template-placeholder'];

  if (grammarTemplate.indexOf('{{quantity}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{quantity}}', templateCount);
  }

  if (grammarTemplate.indexOf('{{Type}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{Type}}', heading);
  }

  if (grammarTemplate.indexOf('{{type}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{type}}', camelHeading);
  }

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

  return grammarTemplate;
}

async function fetchBlueprint(pathname) {
  if (window.spark.bluePrint) {
    return (window.spark.bluePrint);
  }

  const bpPath = pathname.substr(pathname.indexOf('/', 1))
    .split('.')[0];
  const resp = await fetch(`${bpPath}.plain.html`);
  const body = await resp.text();
  const $main = createTag('main');
  $main.innerHTML = body;
  await decorateMain($main);

  window.spark.bluePrint = $main;
  return ($main);
}

async function attachFreeInAppPills(block) {
  const freeInAppText = await fetchPlaceholders().then((json) => json['free-in-app']);

  const templateLinks = block.querySelectorAll('a.template');
  for (const templateLink of templateLinks) {
    if (!block.classList.contains('apipowered')
      && templateLink.querySelectorAll('.icon-premium').length <= 0
      && !templateLink.classList.contains('placeholder')
      && !templateLink.querySelector('.icon-free-badge')
      && freeInAppText) {
      const $freeInAppBadge = createTag('span', { class: 'icon icon-free-badge' });
      $freeInAppBadge.textContent = freeInAppText;
      templateLink.querySelector('div').append($freeInAppBadge);
    }
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
      placeholders: JSON.parse(placeholders['template-x-sort']),
      elements: {},
      icons: placeholders['template-sort-icons'].replace(/\s/g, '').split(','),
    },
  };

  Object.entries(functions).forEach((entry) => {
    entry[1].elements.wrapper = createTag('div', {
      class: `function-wrapper function-${entry[0]}`,
      'data-param': entry[0],
    });

    entry[1].elements.wrapper.subElements = {
      button: {
        wrapper: createTag('div', { class: `button-wrapper button-wrapper-${entry[0]}` }),
        subElements: {
          iconHolder: createTag('span', { class: 'icon-holder' }),
          textSpan: createTag('span', { class: `current-option current-option-${entry[0]}` }),
          chevIcon: getIconElement('drop-down-arrow'),
        },
      },
      options: {
        wrapper: createTag('div', { class: `options-wrapper options-wrapper-${entry[0]}` }),
        subElements: Object.entries(entry[1].placeholders).map((option, subIndex) => {
          const icon = getIconElement(entry[1].icons[subIndex]);
          const optionButton = createTag('div', { class: 'option-button', 'data-value': option[1] });
          [optionButton.textContent] = option;
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
  const functionWrapper = block.querySelectorAll('.function-wrapper');
  const optionsWrapper = block.querySelectorAll('.options-wrapper');

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

function decorateFunctionsContainer(block, functions, placeholders) {
  const functionsContainer = createTag('div', { class: 'functions-container' });
  const functionContainerMobile = createTag('div', { class: 'functions-drawer' });

  Object.values(functions).forEach((filter) => {
    const filterWrapper = filter.elements.wrapper;

    Object.values(filterWrapper.subElements).forEach((part) => {
      const innerWrapper = part.wrapper;

      Object.values(part.subElements).forEach((innerElement) => {
        if (innerElement) {
          innerWrapper.append(innerElement);
        }
      });

      filterWrapper.append(innerWrapper);
    });
    functionContainerMobile.append(filterWrapper.cloneNode({ deep: true }));
    functionsContainer.append(filterWrapper);
  });

  // restructure drawer for mobile design
  const filterContainer = createTag('div', { class: 'filter-container-mobile' });
  const mobileFilterButtonWrapper = createTag('div', { class: 'filter-button-mobile-wrapper' });
  const mobileFilterButton = createTag('span', { class: 'filter-button-mobile' });
  const drawer = createTag('div', { class: 'filter-drawer-mobile hidden retracted' });
  const drawerInnerWrapper = createTag('div', { class: 'filter-drawer-mobile-inner-wrapper' });
  const drawerBackground = createTag('div', { class: 'drawer-background hidden transparent' });
  const $closeButton = getIconElement('search-clear');
  const applyButtonWrapper = createTag('div', { class: 'apply-filter-button-wrapper hidden transparent' });
  const applyButton = createTag('a', { class: 'apply-filter-button button gradient', href: '#' });

  $closeButton.classList.add('close-drawer');
  applyButton.textContent = placeholders['apply-filters'];

  functionContainerMobile.children[0]
    .querySelector('.current-option-premium')
    .textContent = `${placeholders.free} ${placeholders['versus-shorthand']} ${placeholders.premium}`;

  functionContainerMobile.children[1]
    .querySelector('.current-option-animated')
    .textContent = `${placeholders.static} ${placeholders['versus-shorthand']} ${placeholders.animated}`;

  drawerInnerWrapper.append(
    functionContainerMobile.children[0],
    functionContainerMobile.children[1],
  );

  drawer.append($closeButton, drawerInnerWrapper);

  const buttonsInDrawer = drawer.querySelectorAll('.button-wrapper');
  const optionsInDrawer = drawer.querySelectorAll('.options-wrapper');

  [buttonsInDrawer, optionsInDrawer].forEach((category) => {
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

  mobileFilterButtonWrapper.append(getIconElement('scratch-icon-22'), mobileFilterButton);
  applyButtonWrapper.append(applyButton);
  filterContainer.append(
    mobileFilterButtonWrapper,
    drawer,
    applyButtonWrapper,
    drawerBackground,
  );
  functionContainerMobile.prepend(filterContainer);

  mobileFilterButton.textContent = placeholders.filter;
  const sortButton = functionContainerMobile.querySelector('.current-option-sort');
  if (sortButton) {
    sortButton.textContent = placeholders.sort;
    sortButton.className = 'filter-mobile-option-heading';
  }

  return { mobile: functionContainerMobile, desktop: functionsContainer };
}

function closeTaskDropdown(block) {
  const searchBarWrappers = block.querySelectorAll('.search-bar-wrapper');
  searchBarWrappers.forEach((wrapper) => {
    const taskDropdown = wrapper.querySelector('.task-dropdown');
    const taskDropdownList = taskDropdown.querySelector('.task-dropdown-list');
    taskDropdown.classList.remove('active');
    taskDropdownList.classList.remove('active');
  });
}

function updateLottieStatus(block) {
  const drawer = block.querySelector('.filter-drawer-mobile');
  const inWrapper = drawer.querySelector('.filter-drawer-mobile-inner-wrapper');
  const lottieArrows = drawer.querySelector('.lottie-wrapper');
  if (lottieArrows) {
    if (inWrapper.scrollHeight - inWrapper.scrollTop === inWrapper.offsetHeight) {
      lottieArrows.style.display = 'none';
      drawer.classList.remove('scrollable');
    } else {
      lottieArrows.style.removeProperty('display');
      drawer.classList.add('scrollable');
    }
  }
}

async function decorateCategoryList(block, props) {
  const placeholders = await fetchPlaceholders();
  const locale = getLocale(window.location);
  const mobileDrawerWrapper = block.querySelector('.filter-drawer-mobile');
  const drawerWrapper = block.querySelector('.filter-drawer-mobile-inner-wrapper');
  const categories = JSON.parse(placeholders['task-categories']);
  const categoryIcons = placeholders['task-category-icons'].replace(/\s/g, '').split(',');
  const categoriesDesktopWrapper = createTag('div', { class: 'category-list-wrapper' });
  const categoriesToggleWrapper = createTag('div', { class: 'category-list-toggle-wrapper' });
  const categoriesToggle = getIconElement('drop-down-arrow');
  const $categories = createTag('ul', { class: 'category-list' });

  categoriesToggleWrapper.append(categoriesToggle);
  categoriesDesktopWrapper.append(categoriesToggleWrapper, $categories);

  Object.entries(categories).forEach((category, index) => {
    const format = `${props.placeholderFormat[0]}:${props.placeholderFormat[1]}`;
    const targetTasks = category[1];
    const currentTasks = props.filters.tasks ? props.filters.tasks : "''";
    const currentTopic = props.filters.topics;

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

  const categoriesMobileWrapper = categoriesDesktopWrapper.cloneNode({ deep: true });
  const mobileCategoriesToggle = createTag('span', { class: 'category-list-toggle' });
  mobileCategoriesToggle.textContent = placeholders['jump-to-category'];
  categoriesMobileWrapper.querySelector('.category-list-toggle-wrapper > .icon')?.replaceWith(mobileCategoriesToggle);
  const lottieArrows = createTag('a', { class: 'lottie-wrapper' });
  mobileDrawerWrapper.append(lottieArrows);
  drawerWrapper.append(categoriesMobileWrapper);
  lottieArrows.innerHTML = getLottie('purple-arrows', '/express/icons/purple-arrows.json');
  lazyLoadLottiePlayer();

  categoriesDesktopWrapper.classList.add('desktop-only');

  block.prepend(categoriesDesktopWrapper);
  block.classList.add('with-categories-list');

  const toggleButton = categoriesMobileWrapper.querySelector('.category-list-toggle-wrapper');
  toggleButton.append(getIconElement('drop-down-arrow'));
  toggleButton.addEventListener('click', () => {
    const listWrapper = toggleButton.parentElement;
    toggleButton.classList.toggle('collapsed');
    if (toggleButton.classList.contains('collapsed')) {
      if (listWrapper.classList.contains('desktop-only')) {
        listWrapper.classList.add('collapsed');
        listWrapper.style.maxHeight = '40px';
      } else {
        listWrapper.classList.add('collapsed');
        listWrapper.style.maxHeight = '24px';
      }
    } else {
      listWrapper.classList.remove('collapsed');
      listWrapper.style.maxHeight = '1000px';
    }

    setTimeout(() => {
      if (!listWrapper.classList.contains('desktop-only')) {
        updateLottieStatus(block);
      }
    }, 510);
  }, { passive: true });

  lottieArrows.addEventListener('click', () => {
    drawerWrapper.scrollBy({
      top: 300,
      behavior: 'smooth',
    });
  }, { passive: true });

  drawerWrapper.addEventListener('scroll', () => {
    updateLottieStatus(block);
  }, { passive: true });
}

function closeDrawer(toolBar) {
  const drawerBackground = toolBar.querySelector('.drawer-background');
  const drawer = toolBar.querySelector('.filter-drawer-mobile');
  const applyButton = toolBar.querySelector('.apply-filter-button-wrapper');

  drawer.classList.add('retracted');
  drawerBackground.classList.add('transparent');
  applyButton.classList.add('transparent');

  setTimeout(() => {
    drawer.classList.add('hidden');
    drawerBackground.classList.add('hidden');
    applyButton.classList.add('hidden');
  }, 500);
}

async function updateOptionsStatus(block, props, toolBar) {
  const wrappers = toolBar.querySelectorAll('.function-wrapper');
  const placeholders = await fetchPlaceholders();
  const waysOfSort = JSON.parse(placeholders['template-x-sort']);

  wrappers.forEach((wrapper) => {
    const currentOption = wrapper.querySelector('.current-option');
    const options = wrapper.querySelectorAll('.option-button');

    options.forEach((option) => {
      const paramType = wrapper.dataset.param;
      const paramValue = option.dataset.value;
      if (props[paramType] === paramValue
        || props.filters[paramType] === paramValue
        || waysOfSort[props[paramType]] === paramValue) {
        if (currentOption) {
          currentOption.textContent = option.textContent;
        }

        options.forEach((o) => {
          if (option !== o) {
            o.classList.remove('active');
          }
        });
        option.classList.add('active');
      }
    });

    updateFilterIcon(block);
  });
}

function initDrawer(block, props, toolBar) {
  const filterButton = toolBar.querySelector('.filter-button-mobile-wrapper');
  const drawerBackground = toolBar.querySelector('.drawer-background');
  const drawer = toolBar.querySelector('.filter-drawer-mobile');
  const closeDrawerBtn = toolBar.querySelector('.close-drawer');
  const applyButton = toolBar.querySelector('.apply-filter-button-wrapper');

  const functionWrappers = drawer.querySelectorAll('.function-wrapper');

  let currentFilters;

  filterButton.addEventListener('click', () => {
    currentFilters = { ...props.filters };
    drawer.classList.remove('hidden');
    drawerBackground.classList.remove('hidden');
    applyButton.classList.remove('hidden');
    updateLottieStatus(block);
    closeTaskDropdown(block);

    setTimeout(() => {
      drawer.classList.remove('retracted');
      drawerBackground.classList.remove('transparent');
      applyButton.classList.remove('transparent');
      functionWrappers.forEach((wrapper) => {
        const button = wrapper.querySelector('.button-wrapper');
        if (button) {
          button.style.maxHeight = `${button.nextElementSibling.offsetHeight}px`;
        }
      });
    }, 100);
  }, { passive: true });

  [drawerBackground, closeDrawerBtn].forEach((el) => {
    el.addEventListener('click', async () => {
      props.filters = { ...currentFilters };
      closeDrawer(toolBar);
      updateOptionsStatus(block, props, toolBar);
    }, { passive: true });
  });

  drawer.classList.remove('hidden');
  functionWrappers.forEach((wrapper) => {
    const button = wrapper.querySelector('.button-wrapper');
    let maxHeight;
    if (button) {
      const wrapperMaxHeightGrabbed = setInterval(() => {
        if (wrapper.offsetHeight > 0) {
          maxHeight = `${wrapper.offsetHeight}px`;
          wrapper.style.maxHeight = maxHeight;
          clearInterval(wrapperMaxHeightGrabbed);
        }
      }, 200);

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const btnWrapper = wrapper.querySelector('.button-wrapper');
        if (btnWrapper) {
          const minHeight = `${btnWrapper.offsetHeight - 8}px`;
          wrapper.classList.toggle('collapsed');
          wrapper.style.maxHeight = wrapper.classList.contains('collapsed') ? minHeight : maxHeight;
        }
      }, { passive: true });
    }
  });

  drawer.classList.add('hidden');
}

function updateQuery(functionWrapper, props, option) {
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
        filtersObj[paramType] = `${paramValue}`;
      }
    } else if (paramValue !== 'remove') {
      filtersObj[paramType] = `${paramValue}`;
    }

    props.filters = filtersObj;
  }
}

async function redrawTemplates(block, props, toolBar) {
  const heading = toolBar.querySelector('h2');
  const currentTotal = props.total.toLocaleString('en-US');
  props.templates = [props.templates[0]];
  props.start = '';
  block.querySelectorAll('.template:not(.placeholder)').forEach((card) => {
    card.remove();
  });

  await decorateNewTemplates(block, props, { reDrawMasonry: true });

  heading.textContent = heading.textContent.replace(`${currentTotal}`, props.total.toLocaleString('en-US'));
  updateOptionsStatus(block, props, toolBar);
  if (block.querySelectorAll('.template').length <= 0) {
    const $viewButtons = toolBar.querySelectorAll('.view-toggle-button');
    $viewButtons.forEach((button) => {
      button.classList.remove('active');
    });
    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      block.classList.remove(className);
    });
  }
}

async function toggleAnimatedText(block, props, toolBar) {
  const toolbarWrapper = toolBar.parentElement;

  const placeholders = await fetchPlaceholders();
  const existingText = block.querySelector('.animated-template-text');
  const animatedTemplateText = createTag('h5', { class: 'animated-template-text' });
  animatedTemplateText.textContent = placeholders['open-to-see-animation'];

  if (existingText) {
    existingText.remove();
  }

  if (props.filters.animated === '(true)') {
    toolbarWrapper.insertAdjacentElement('afterend', animatedTemplateText);
  }
}

function initFilterSort(block, props, toolBar) {
  const buttons = toolBar.querySelectorAll('.button-wrapper');
  const applyFilterButton = toolBar.querySelector('.apply-filter-button');

  if (buttons.length > 0) {
    buttons.forEach((button) => {
      const wrapper = button.parentElement;
      const currentOption = wrapper.querySelector('span.current-option');
      const optionsList = button.nextElementSibling;
      const options = optionsList.querySelectorAll('.option-button');

      button.addEventListener('click', () => {
        if (!button.classList.contains('in-drawer')) {
          buttons.forEach((b) => {
            if (button !== b) {
              b.parentElement.classList.remove('opened');
            }
          });

          wrapper.classList.toggle('opened');
        }

        closeTaskDropdown(toolBar);
      }, { passive: true });

      options.forEach((option) => {
        const updateOptions = async () => {
          buttons.forEach((b) => {
            b.parentElement.classList.remove('opened');
          });

          if (currentOption) {
            currentOption.textContent = option.textContent;
          }

          options.forEach((o) => {
            if (option !== o) {
              o.classList.remove('active');
            }
          });
          option.classList.add('active');

          updateQuery(wrapper, props, option);
          updateFilterIcon(block);

          if (!optionsList.classList.contains('in-drawer')) {
            await toggleAnimatedText(block, props, toolBar);
          }

          if (!button.classList.contains('in-drawer')) {
            await redrawTemplates(block, props, toolBar);
          }
        };

        option.addEventListener('click', async (e) => {
          e.stopPropagation();
          await updateOptions();
        }, { passive: true });
      });

      document.addEventListener('click', (e) => {
        const { target } = e;
        if (target !== wrapper && !wrapper.contains(target) && !button.classList.contains('in-drawer')) {
          wrapper.classList.remove('opened');
        }
      }, { passive: true });
    });

    if (applyFilterButton) {
      applyFilterButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await redrawTemplates(block, props, toolBar);
        closeDrawer(toolBar);
        await toggleAnimatedText(block, props, toolBar);
      });
    }

    // sync current filter & sorting method with toolbar current options
    updateOptionsStatus(block, props, toolBar);
    updateFilterIcon(block);
  }
}

function getPlaceholderWidth(block) {
  let width;
  if (window.innerWidth >= 900) {
    if (block.classList.contains('sm-view')) {
      width = 165;
    }

    if (block.classList.contains('md-view')) {
      width = 258.5;
    }

    if (block.classList.contains('lg-view')) {
      width = 352;
    }
  } else if (window.innerWidth >= 600) {
    if (block.classList.contains('sm-view')) {
      width = 165;
    }

    if (block.classList.contains('md-view')) {
      width = 227.33;
    }

    if (block.classList.contains('lg-view')) {
      width = 352;
    }
  } else {
    if (block.classList.contains('sm-view')) {
      width = 106.33;
    }

    if (block.classList.contains('md-view')) {
      width = 165.5;
    }

    if (block.classList.contains('lg-view')) {
      width = 335;
    }
  }

  return width;
}

function toggleMasonryView(block, props, button, toggleButtons) {
  const templatesToView = block.querySelectorAll('.template:not(.placeholder)');
  const blockWrapper = block.closest('.template-x-wrapper');

  if (!button.classList.contains('active') && templatesToView.length > 0) {
    toggleButtons.forEach((b) => {
      if (b !== button) {
        b.classList.remove('active');
      }
    });

    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      if (className !== `${button.dataset.view}-view`) {
        block.classList.remove(className);
        blockWrapper.classList.remove(className);
      }
    });
    button.classList.add('active');
    block.classList.add(`${button.dataset.view}-view`);
    blockWrapper.classList.add(`${button.dataset.view}-view`);

    props.masonry.draw();
  }

  const placeholder = block.querySelector('.template.placeholder');
  const ratios = props.placeholderFormat;
  const width = getPlaceholderWidth(block);

  if (ratios[1]) {
    const height = (ratios[1] / ratios[0]) * width;
    placeholder.style = `height: ${height - 21}px`;
    if (width / height > 1.3) {
      placeholder.classList.add('wide');
    }
  }
}

function initViewToggle(block, props, toolBar) {
  const toggleButtons = toolBar.querySelectorAll('.view-toggle-button ');
  block.classList.add('sm-view');
  block.parentElement.classList.add('sm-view');
  toggleButtons[0].classList.add('active');

  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      toggleMasonryView(block, props, button, toggleButtons);
    }, { passive: true });
  });
}

function initToolbarShadow(block, toolbar) {
  const toolbarWrapper = toolbar.parentElement;
  document.addEventListener('scroll', () => {
    if (toolbarWrapper.getBoundingClientRect().top <= 0) {
      toolbarWrapper.classList.add('with-box-shadow');
    } else {
      toolbarWrapper.classList.remove('with-box-shadow');
    }
  });
}

async function decorateToolbar(block, props) {
  const placeholders = await fetchPlaceholders();
  const sectionHeading = createTag('h2');
  const tBarWrapper = createTag('div', { class: 'toolbar-wrapper' });
  const tBar = createTag('div', { class: 'api-templates-toolbar' });
  const contentWrapper = createTag('div', { class: 'wrapper-content-search' });
  const functionsWrapper = createTag('div', { class: 'wrapper-functions' });

  sectionHeading.textContent = await insertTemplateStats(props);

  block.prepend(tBarWrapper);
  tBarWrapper.append(tBar);
  tBar.append(contentWrapper, functionsWrapper);
  contentWrapper.append(sectionHeading);

  if (tBar) {
    const viewsWrapper = createTag('div', { class: 'views' });

    const smView = createTag('a', { class: 'view-toggle-button small-view', 'data-view': 'sm' });
    smView.append(getIconElement('small_grid'));
    const mdView = createTag('a', { class: 'view-toggle-button medium-view', 'data-view': 'md' });
    mdView.append(getIconElement('medium_grid'));
    const lgView = createTag('a', { class: 'view-toggle-button large-view', 'data-view': 'lg' });
    lgView.append(getIconElement('large_grid'));

    const functionsObj = makeTemplateFunctions(placeholders);
    const functions = decorateFunctionsContainer(block, functionsObj, placeholders);

    viewsWrapper.append(smView, mdView, lgView);
    functionsWrapper.append(viewsWrapper, functions.desktop);

    tBar.append(contentWrapper, functionsWrapper, functions.mobile);

    initDrawer(block, props, tBar);
    initFilterSort(block, props, tBar);
    initViewToggle(block, props, tBar);
    initToolbarShadow(block, tBar);
  }
}

function updateURLParameter(url, param, paramVal) {
  let newAdditionalURL = '';
  let tempArray = url.split('?');
  const baseURL = tempArray[0];
  const additionalURL = tempArray[1];
  let temp = '';
  if (additionalURL) {
    tempArray = additionalURL.split('&');
    for (let i = 0; i < tempArray.length; i += 1) {
      if (tempArray[i].split('=')[0] !== param) {
        newAdditionalURL += temp + tempArray[i];
        temp = '&';
      }
    }
  }

  const rowText = `${temp}${param}=${paramVal}`;
  return `${baseURL}?${newAdditionalURL}${rowText}`;
}

function loadBetterAssetsInBackground(block, props) {
  props.renditionParams.size = 400;
  const existingTemplates = block.querySelectorAll('.template:not(.placeholder)');
  if (existingTemplates.length > 0) {
    existingTemplates.forEach((tmplt) => {
      const img = tmplt.querySelector('div:first-of-type > img');
      if (img && img.src) {
        const updateImgRes = () => {
          const imgParams = new URLSearchParams(img.src);
          if (imgParams.get('size') !== '400') {
            img.src = updateURLParameter(img.src, 'size', 400);
          } else {
            img.removeEventListener('load', updateImgRes);
          }
        };

        img.addEventListener('load', updateImgRes);
      }
    });
  }
}

function setAttributes(element, attributes) {
  Object.keys(attributes).forEach((key) => element.setAttribute(key, attributes[key]));
}

function addBackgroundAnimation(block, animationUrl) {
  // Don't fully understand purpose of this, but leaving in for now
  const parent = block.closest('.template-x-wrapper.fullwidth.holiday');

  if (parent) {
    parent.classList.add('with-animation');
    const videoBackground = createTag('video', { class: 'animation-background' });
    videoBackground.append(createTag('source', { src: animationUrl, type: 'video/mp4' }));
    setAttributes(videoBackground, {
      autoplay: '',
      muted: '',
      loop: '',
      playsinline: '' ,
    });
    block.prepend(videoBackground);
    videoBackground.muted = true;
  }
}

function initExpandCollapseBlock(block) {
  const toggleElements = Array.from(block.querySelectorAll('.toggle-button'));
  const templatesWrapper = block.querySelector('.template-x-inner-wrapper');
  const toggleBar = block.querySelector('.toggle-bar');
  toggleElements.push(templatesWrapper, toggleBar);
  toggleElements.forEach((element) => {
    element.classList.toggle('expanded');
  });
}

// event listeners for expanding/collapsing templates
function initToggleHoliday(block) {
  const toggleBar = block.querySelector('.toggle-bar');
  const aTag = toggleBar.querySelector('a');
  const chev = toggleBar.querySelector('.toggle-button-chev');
  const mobileChev = block.querySelector('.toggle-button.mobile');

  aTag.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  toggleBar.addEventListener('click', (e) => {
    e.preventDefault();
    initExpandCollapseBlock(block);
  });

  chev.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    initExpandCollapseBlock(block);
  });

  mobileChev.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    initExpandCollapseBlock(block);
  });
}

function decorateHoliday(block, props) {
  const templateTitle = block.querySelector('.template-title');
  const templatesWrapper = block.querySelector('.template-x-inner-wrapper');
  const toggleBar = templateTitle.querySelector('div');
  const { holidayIcon } = props;
  const heading = templateTitle.querySelector('h4');
  const subheading = templateTitle.querySelector('p');
  const blankTemplate = templateTitle.querySelector('svg');
  const link = templateTitle.querySelector('.template-title-link');
  const linkWrapper = link.closest('p');
  const toggle = createTag('div', { class: 'expanded toggle-button' });
  const topElements = createTag('div', { class: 'toggle-bar-top' });
  const bottomElements = createTag('div', { class: 'toggle-bar-bottom' });
  const toggleChev = createTag('div', { class: 'toggle-button-chev' });
  const carouselFaderLeft = block.querySelector('.carousel-fader-left');
  const carouselFaderRight = block.querySelector('.carousel-fader-right');
  let mouseInBlock;
  // const customColorElements = [block, carouselFaderLeft, carouselFaderRight];

  console.log(block)
  block.addEventListener('mouseenter', () => {
    mouseInBlock = true;
  });

  block.addEventListener('mouseleave', () => {
    mouseInBlock = false;
  });

  if (blankTemplate) {
    blankTemplate.style.fill = props.textColor;
  }

  if (props.holidayIcon) {
    topElements.append(holidayIcon);
  }

  if (props.backgroundAnimation) {
    addBackgroundAnimation(block, props.backgroundAnimation);
  }

  if (props.backgroundColor) {
    carouselFaderRight.style.backgroundImage = `linear-gradient(to right, rgba(0, 255, 255, 0), ${props.backgroundColor}`;
    carouselFaderLeft.style.backgroundImage = `linear-gradient(to left, rgba(0, 255, 255, 0), ${props.backgroundColor}`;
  }

  block.classList.add('expanded');
  toggleBar.classList.add('expanded', 'toggle-bar');
  templatesWrapper.classList.add('expanded');
  toggleBar.append(toggle);
  toggle.append(link);
  linkWrapper.remove();
  toggle.append(toggleChev);
  const mobileToggle = toggle.cloneNode(true);
  mobileToggle.classList.add('mobile');
  topElements.append(heading);
  toggleBar.append(topElements);
  bottomElements.append(subheading, toggle);
  toggleBar.append(bottomElements);

  block.style.backgroundColor = props.backgroundColor;
  heading.style.color = props.textColor;
  subheading.style.color = props.textColor;
  link.style.color = props.textColor;
  toggleChev.style.borderColor = props.textColor;
  block.append(mobileToggle);
  initToggleHoliday(block);

  setTimeout(() => {
    if (block.classList.contains('expanded') && !mouseInBlock) {
      initExpandCollapseBlock(block);
    }
  }, 3000);
}

async function decorateTemplates(block, props) {
  const locale = getLocale(window.location);
  const innerWrapper = block.querySelector('.template-x-inner-wrapper');

  let rows = block.children.length;
  if ((rows === 0 || block.querySelectorAll('img').length === 0) && locale !== 'us') {
    const i18nTexts = block.firstElementChild
      // author defined localized edit text(s)
      && (block.firstElementChild.querySelector('p')
        // multiple lines in separate p tags
        ? Array.from(block.querySelectorAll('p'))
          .map((p) => p.textContent.trim())
        // single text directly in div
        : [block.firstElementChild.textContent.trim()]);
    block.innerHTML = '';
    const tls = Array.from(block.closest('main').querySelectorAll('.template-x'));
    const i = tls.indexOf(block);

    const bluePrint = await fetchBlueprint(window.location.pathname);

    const $bpBlocks = bluePrint.querySelectorAll('.template-x');
    if ($bpBlocks[i] && $bpBlocks[i].className === block.className) {
      block.innerHTML = $bpBlocks[i].innerHTML;
    } else if ($bpBlocks.length > 1 && $bpBlocks[i].className !== block.className) {
      for (let x = 0; x < $bpBlocks.length; x += 1) {
        if ($bpBlocks[x].className === block.className) {
          block.innerHTML = $bpBlocks[x].innerHTML;
          break;
        }
      }
    } else {
      block.remove();
    }

    if (i18nTexts && i18nTexts.length > 0) {
      const [placeholderText] = i18nTexts;
      let [, templateText] = i18nTexts;
      if (!templateText) {
        templateText = placeholderText;
      }
      block.querySelectorAll('a')
        .forEach((aTag, index) => {
          aTag.textContent = index === 0 ? placeholderText : templateText;
        });
    }

    const heroPicture = document.querySelector('.hero-bg');

    if (!heroPicture && bluePrint) {
      const bpHeroImage = bluePrint.querySelector('div:first-of-type img');
      if (bpHeroImage) {
        const heroSection = document.querySelector('main .hero');
        const $heroDiv = document.querySelector('main .hero > div');

        if (heroSection && !$heroDiv) {
          const p = createTag('p');
          const pic = createTag('picture', { class: 'hero-bg' });
          pic.appendChild(bpHeroImage);
          p.append(pic);
          heroSection.classList.remove('hero-noimage');
          $heroDiv.prepend(p);
        }
      }
    }
  }

  const templates = Array.from(innerWrapper.children);

  rows = templates.length;
  let breakpoints = [{ width: '400' }];

  if (rows > 6 && !block.classList.contains('horizontal')) {
    innerWrapper.classList.add('masonry');
  }

  if (rows === 1) {
    block.classList.add('large');
    breakpoints = [{
      media: '(min-width: 600px)',
      width: '2000',
    }, { width: '750' }];
  }

  block.querySelectorAll(':scope picture > img').forEach((img) => {
    const { src, alt } = img;
    img.parentNode.replaceWith(createOptimizedPicture(src, alt, true, breakpoints));
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

  populateTemplates(block, props, templates);
  if (props.orientation.toLowerCase() !== 'horizontal') {
    if (rows > 6 || block.classList.contains('sixcols') || block.classList.contains('fullwidth')) {
      /* flex masonry */

      if (innerWrapper) {
        const cells = Array.from(innerWrapper.children);
        innerWrapper.classList.remove('masonry');
        innerWrapper.classList.add('flex-masonry');
        props.masonry = new Masonry(innerWrapper, cells);
      } else {
        block.remove();
      }

      props.masonry.draw();
      window.addEventListener('resize', () => {
        props.masonry.draw();
      });
    } else {
      block.classList.add('template-x-complete');
    }
  }

  await attachFreeInAppPills(block);

  const templateLinks = block.querySelectorAll('.template .button-container > a, a.template.placeholder');
  const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
  document.dispatchEvent(linksPopulated);
}

async function appendCategoryTemplatesCount(block, props) {
  const categories = block.querySelectorAll('ul.category-list > li');
  const tempProps = JSON.parse(JSON.stringify(props));
  const lang = getLanguage(getLocale(window.location));

  for (const li of categories) {
    const anchor = li.querySelector('a');
    if (anchor) {
      const countSpan = createTag('span', { class: 'category-list-template-count' });
      tempProps.filters.tasks = anchor.dataset.tasks;
      // eslint-disable-next-line no-await-in-loop
      const response = await fetchTemplates(tempProps, false);
      if (!response || !response.items || !Array.isArray(response.items)) {
        countSpan.textContent = '(0)';
      } else {
        countSpan.textContent = `(${response.metadata.totalHits.toLocaleString(lang)})`;
      }
      anchor.append(countSpan);
    }
  }
}

async function buildTemplateList(block, props, type = []) {
  if (type?.length > 0) {
    type.forEach((typeName) => {
      block.parentElement.classList.add(typeName);
      block.classList.add(typeName);
    });
  }

  if (!props.templateStats) {
    await processContentRow(block, props);
  }

  const templates = await fetchAndRenderTemplates(props);
  if (templates) {
    const blockInnerWrapper = createTag('div', { class: 'template-x-inner-wrapper' });
    block.append(blockInnerWrapper);
    props.templates = props.templates.concat(templates);
    props.templates.forEach((template) => {
      blockInnerWrapper.append(template);
    });
  }

  await decorateTemplates(block, props);

  // templates are finished rendering at this point.

  if (props.loadMoreTemplates) {
    const loadMore = await decorateLoadMoreButton(block, props);
    if (loadMore) {
      updateLoadMoreButton(block, props, loadMore);
    }
  }

  if (props.toolBar) {
    await decorateToolbar(block, props);
    await decorateCategoryList(block, props);
    appendCategoryTemplatesCount(block, props);
  }

  if (props.orientation && props.orientation.toLowerCase() === 'horizontal') {
    const innerWrapper = block.querySelector('.template-x-inner-wrapper');
    if (innerWrapper) {
      buildCarousel(':scope > .template', innerWrapper, false);
    } else {
      block.remove();
    }
  }

  if (props.holidayBlock) {
    decorateHoliday(block, props);
  }
}

function determineTemplateXType(props) {
  // todo: build layers of aspects based on props conditions - i.e. orientation -> style -> use case
  const type = [];

  // orientation aspect
  if (props.orientation && props.orientation.toLowerCase() === 'horizontal') type.push('horizontal');

  // style aspect
  if (props.width && props.width.toLowerCase() === 'full') type.push('fullwidth');
  if (props.width && props.width.toLowerCase() === 'sixcols') type.push('sixcols');
  if (props.width && props.width.toLowerCase() === 'fourcols') type.push('fourcols');
  if (props.mini) type.push('mini');

  // use case aspect
  if (props.holidayBlock) type.push('holiday');
  if (props.collaborationBlock) type.push('collaboration');

  return type;
}

export default async function decorate(block) {
  const props = constructProps(block);
  block.innerHTML = '';
  await buildTemplateList(block, props, determineTemplateXType(props));
}
