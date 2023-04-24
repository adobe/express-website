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
  getLanguage,
  getLocale,
  getLottie,
  lazyLoadLottiePlayer,
  linkImage,
  toClassName,
} from '../../scripts/scripts.js';

import { Masonry } from '../shared/masonry.js';

import { buildCarousel } from '../shared/carousel.js';

function wordStartsWithVowels(word) {
  return word.match('^[aieouâêîôûäëïöüàéèùœAIEOUÂÊÎÔÛÄËÏÖÜÀÉÈÙŒ].*');
}

function camelize(str) {
  return str.replace(/^\w|[A-Z]|\b\w/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase())).replace(/\s+/g, '');
}

async function processContentRow(block, props) {
  const placeholders = await fetchPlaceholders();

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

  if (block.classList.contains('collaboration')) {
    const titleHeading = props.contentRow.querySelector('h3');
    const anchorLink = createTag('a', {
      class: 'collaboration-anchor',
      href: `${document.URL.replace(/#.*$/, '')}#${titleHeading.id}`,
    });
    const clipboardTag = createTag('span', { class: 'clipboard-tag' });
    clipboardTag.textContent = placeholders['tag-copied'];

    anchorLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(anchorLink.href);
      anchorLink.classList.add('copied');
      setTimeout(() => {
        anchorLink.classList.remove('copied');
      }, 2000);
    });

    anchorLink.append(clipboardTag);
    titleHeading.append(anchorLink);
  }
}

function constructProps(block) {
  const props = {
    templates: [],
    filters: {
      locales: '(en)',
    },
    renditionParams: {
      format: 'jpg',
      size: 220,
    },
    tailButton: '',
    limit: 70,
    total: 0,
    start: '',
    sort: '-_score,-remixCount',
    masonry: undefined,
    headingTitle: null,
    headingSlug: null,
    viewAllLink: null,
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
        } else {
          props[camelize(key)] = value;
        }
      }
    } else if (cols.length === 3) {
      if (key === 'template stats' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        props[camelize(key)] = cols[2].textContent.trim().toLowerCase();
      }

      if (key === 'holiday block' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        const graphic = cols[2].querySelector('picture');
        if (graphic) {
          props[camelize(key)] = graphic;
        }
      }
    } else if (cols.length === 4) {
      if (key === 'blank template') {
        cols[0].remove();
        props.templates.push(row);
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
        const aTag = createTag('a', {
          href: link.href ? addSearchQueryToHref(link.href) : '#',
        });

        aTag.append(...tmplt.children);
        tmplt.remove();
        tmplt = aTag;
        innerWrapper.append(aTag);

        // convert A to SPAN
        const newLink = createTag('span', { class: 'template-link' });
        newLink.append(link.textContent.trim());

        linkContainer.innerHTML = '';
        linkContainer.append(newLink);
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

    // wrap "linked images" with link
    const imgLink = tmplt.querySelector(':scope > div:first-of-type a');
    if (imgLink) {
      const parent = imgLink.closest('div');
      if (!imgLink.href.includes('.mp4')) {
        linkImage(parent);
      } else {
        let videoLink = imgLink.href;
        if (videoLink.includes('/media_')) {
          videoLink = `./media_${videoLink.split('/media_')[1]}`;
        }
        tmplt.querySelectorAll(':scope br').forEach(($br) => $br.remove());
        const picture = tmplt.querySelector('picture');
        if (picture) {
          const img = tmplt.querySelector('img');
          const video = createTag('video', {
            playsinline: '',
            autoplay: '',
            loop: '',
            muted: '',
            poster: img.getAttribute('src'),
            title: img.getAttribute('alt'),
          });
          video.append(createTag('source', {
            src: videoLink,
            type: 'video/mp4',
          }));
          parent.replaceChild(video, picture);
          imgLink.remove();
          video.addEventListener('canplay', () => {
            video.muted = true;
            video.play();
          });
        }
      }
    }

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

function formatFilterString(filters) {
  // FIXME: check how filters can be formed, how it's handling or and and
  const {
    // eslint-disable-next-line no-unused-vars
    animated, locales, premium, tasks, topics,
  } = filters;
  let str = '';
  if (premium === 'false') {
    str += '&filters=licensingCategory==free';
  }
  if (animated && animated !== '()') {
    str += `&filters=animated==${animated}`;
  }
  if (tasks && tasks !== '()') {
    str += `&filters=tasks==[${tasks}]`;
  }
  // FIXME: check if q is for topics now
  if (topics && topics !== '()') {
    str += `&q=${topics}`;
  }
  if (locales !== '()') {
    str += `&filters=language==${locales.split('OR').map((l) => getLanguage(l))}`;
  }

  return str;
}

const fetchSearchUrl = async ({ limit, start, filters }) => {
  // FIXME: orderBy fields are now different.
  const base = 'https://spark-search.adobe.io/v3/content';
  const collectionId = 'urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418';
  const queryType = 'search';
  const filterStr = formatFilterString(filters);
  const startParam = start ? `&start=${start}` : '';
  const url = encodeURI(`${base}?collectionId=${collectionId}&queryType=${queryType}&limit=${limit}${startParam}${filterStr}`);

  return fetch(url, {
    headers: {
      'x-api-key': 'projectx_webapp',
    },
  }).then((response) => response.json());
};

async function fetchTemplates(props) {
  const result = await fetchSearchUrl(props);

  if (result?.metadata?.totalHits > 0) {
    return result;
  } else {
    // save fetch if search query returned 0 templates. "Bad result is better than no result"
    return fetchSearchUrl({ ...props, filters: {} });
  }
}

async function processApiResponse(props) {
  const placeholders = await fetchPlaceholders();
  const response = await fetchTemplates(props);
  let templateFetched;
  if (response) {
    // eslint-disable-next-line no-underscore-dangle
    templateFetched = response.items;

    if ('_links' in response) {
      // eslint-disable-next-line no-underscore-dangle
      const nextQuery = response._links.next.href;
      const starts = new URLSearchParams(nextQuery).get('start').split(',');
      props.start = starts.join(',');
    } else {
      props.start = '';
    }

    props.total = response.metadata.totalHits;
  }

  if (!templateFetched) {
    return null;
  }

  return templateFetched.map((template) => {
    const tmpltEl = createTag('div');
    const btnElWrapper = createTag('div', { class: 'button-container' });
    const btnEl = createTag('a', {
      href: template.customLinks.branchUrl,
      title: placeholders['edit-this-template'] ?? 'Edit this template',
      class: 'button accent',
    });
    const picElWrapper = createTag('div');
    const videoWrapper = createTag('div');

    // eslint-disable-next-line no-underscore-dangle
    const imageHref = template._links['http://ns.adobe.com/adobecloud/rel/rendition'].href
      .replace('{&page,size,type,fragment}',
        `&size=${props.renditionParams.size}&type=image/jpg&fragment=id=${template.pages[0].rendition.image.thumbnail.componentId}`);

    if (template.pages[0].rendition?.video) {
      // eslint-disable-next-line no-underscore-dangle
      const videoHref = template._links['http://ns.adobe.com/adobecloud/rel/component'].href
        .replace('{&revision,component_id}',
          `&revision=0&component_id=${template.pages[0].rendition.video.thumbnail.componentId}`);
      const video = createTag('video', {
        loop: true,
        muted: true,
        playsinline: '',
        poster: imageHref,
        title: template.title['i-default'],
        preload: 'metadata',
      });
      video.append(createTag('source', {
        src: videoHref,
        type: 'video/mp4',
      }));
      // TODO: another approach: show an image, only insert the video node when hover
      btnElWrapper.addEventListener('mouseenter', () => {
        // video.src = videoHref;
        video.muted = true;
        video.play().catch((e) => {
          if (e instanceof DOMException && e.name === 'AbortError') {
            // ignore
          }
        });
      });
      btnElWrapper.addEventListener('mouseleave', () => {
        // console.log('reloading');
        // video.load();
        // console.log('removing src');
        // video.src = ''; // need to reset video.src=videoHref
        // console.log('pausing and set time=0');
        video.pause();
        video.currentTime = 0;
      });
      videoWrapper.insertAdjacentElement('beforeend', video);
      tmpltEl.insertAdjacentElement('beforeend', videoWrapper);
    } else {
      const picEl = createTag('img', {
        src: imageHref,
        alt: template.title['i-default'],
      });
      picElWrapper.insertAdjacentElement('beforeend', picEl);
      tmpltEl.insertAdjacentElement('beforeend', picElWrapper);
    }

    btnEl.textContent = placeholders['edit-this-template'] ?? 'Edit this template';
    btnElWrapper.insertAdjacentElement('beforeend', btnEl);
    tmpltEl.insertAdjacentElement('beforeend', btnElWrapper);
    return tmpltEl;
  });
}

async function decorateNewTemplates(block, props, options = { reDrawMasonry: false }) {
  const newTemplates = await processApiResponse(props);
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

  const heading = props.contentRow.textContent;
  if (!heading) return null;

  const placeholders = await fetchPlaceholders();

  let grammarTemplate = props.templateStats || placeholders['template-placeholder'];

  if (grammarTemplate.indexOf('{{quantity}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{quantity}}', props.total.toLocaleString('en-US'));
  }

  if (grammarTemplate.indexOf('{{Type}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{Type}}', heading);
  }

  if (grammarTemplate.indexOf('{{type}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{type}}', heading.charAt(0).toLowerCase() + heading.slice(1));
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

async function generateToolBar(block, props) {
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
      placeholders: JSON.parse(placeholders['template-sort']),
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

function updateOptionsStatus(block, props, toolBar) {
  const wrappers = toolBar.querySelectorAll('.function-wrapper');

  wrappers.forEach((wrapper) => {
    const currentOption = wrapper.querySelector('.current-option');
    const options = wrapper.querySelectorAll('.option-button');

    options.forEach((option) => {
      const paramType = wrapper.dataset.param;
      const paramValue = paramType === 'sort' ? option.dataset.value : `(${option.dataset.value})`;

      if (props[paramType] === paramValue
        || props.filters[paramType] === paramValue
        || ((!props.filters[paramType] || props.filters[paramType] === '()') && paramValue === '(remove)')) {
        const drawerCs = ['filter-drawer-mobile-inner-wrapper', 'functions-drawer'];
        let toReorder = false;
        if (drawerCs.every((className) => !wrapper.parentElement.classList.contains(className))) {
          toReorder = true;
        }

        if (toReorder) {
          option.parentElement.prepend(option);
        }

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
    el.addEventListener('click', () => {
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

function updateQueryURL(functionWrapper, props, option) {
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

          updateQueryURL(wrapper, props, option);
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

async function toggleMasonryView(block, props, button, toggleButtons) {
  props.start = '';
  props.templates = [];
  await decorateNewTemplates(block, props, { reDrawMasonry: true });
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
  } else {
    button.classList.remove('active');
    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      block.classList.remove(className);
      blockWrapper.classList.remove(className);
    });

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

async function initViewToggle(block, props, toolBar) {
  const toggleButtons = toolBar.querySelectorAll('.view-toggle-button ');
  block.classList.add('sm-view');
  block.parentElement.classList.add('sm-view');

  toggleButtons.forEach((button, index) => {
    if (index === 0) {
      button.classList.add('active');
    }
    button.addEventListener('click', () => {
      if (button.dataset.view === 'sm') {
        props.renditionParams.size = 220;
      }

      if (button.dataset.view === 'md') {
        props.renditionParams.size = 320;
      }

      if (button.dataset.view === 'lg') {
        props.renditionParams.size = 420;
      }

      toggleMasonryView(block, props, button, toggleButtons);
    }, { passive: true });
  });

  props.renditionParams.size = 420;
  props.templates = await processApiResponse(props);
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
  const toolBar = block.querySelector('.api-templates-toolbar');

  if (toolBar) {
    const toolBarFirstWrapper = toolBar.querySelector('.wrapper-content-search');
    const functionsWrapper = toolBar.querySelector('.wrapper-functions');

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

    toolBar.append(toolBarFirstWrapper, functionsWrapper, functions.mobile);

    initDrawer(block, props, toolBar);
    initFilterSort(block, props, toolBar);
    await initViewToggle(block, props, toolBar);
    initToolbarShadow(block, toolBar);
  }
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

  const templateLinks = block.querySelectorAll('a.template');
  const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
  document.dispatchEvent(linksPopulated);
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

  const templates = await processApiResponse(props);
  if (templates) {
    const blockInnerWrapper = createTag('div', { class: 'template-x-inner-wrapper' });
    block.append(blockInnerWrapper);
    props.templates = props.templates.concat(templates);
    props.templates.forEach((template) => {
      blockInnerWrapper.append(template);
    });
  }

  if (props.toolBar) {
    await generateToolBar(block, props);
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
    // TODO: add fx appendCategoryTemplatesCount(block)
  }

  if (props.orientation && props.orientation.toLowerCase() === 'horizontal') {
    const innerWrapper = block.querySelector('.template-x-inner-wrapper');
    if (innerWrapper) {
      buildCarousel(':scope > .template', innerWrapper, false);
    } else {
      block.remove();
    }
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
