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
  addSearchQueryToHref,
  createOptimizedPicture,
  createTag,
  fetchPlaceholders,
  getIconElement,
  toClassName,
  loadScript,
} from '../../scripts/scripts.js';

import { renderModalContent } from './results-modal.js';

import { buildCarousel } from '../shared/carousel.js';

const IMS_COMMERCE_CLIENT_ID = 'aos_milo_commerce';
const IMS_PROD_URL = 'https://auth.services.adobe.com/imslib/imslib.min.js';

const getImsToken = async () => {
  window.adobeid = {
    client_id: IMS_COMMERCE_CLIENT_ID,
    environment: 'prod',
    scope: 'AdobeID,openid',
  };
  const promise = new Promise((resolve) => {
    const callback = () => {
      if (!window.adobeIMS.isSignedInUser()) {
        window.adobeIMS.signIn();
      }
      resolve();
    };
    if (!window.adobeIMS) {
      loadScript(IMS_PROD_URL, callback);
    }
  });
  await promise;
};

const props = {
  templates: [],
  filters: { locales: '(en)' },
  renditionParams: {
    format: 'jpg',
    size: 400,
  },
  tailButton: '',
  limit: 10,
  total: 0,
  start: '',
  sort: '-_score,-remixCount',
  authoringError: false,
  headingTitle: null,
  headingSlug: null,
  viewAllLink: null,
};

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
      return fetch(`https://www.adobe.com/cc-express-search-api?limit=${props.limit}&start=${props.start}&orderBy=${props.sort}&filters=locales:(${props.filters.locales})`)
        .then((response) => response.json())
        .then((response) => response);
    }
  }
  return null;
}

async function fetchAndRenderTemplates() {
  const [placeholders, response] = await Promise.all([fetchPlaceholders(), fetchTemplates()]);
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

async function readRowsFromBlock($block, templatesContainer) {
  const fetchedTemplates = await fetchAndRenderTemplates();

  if (fetchedTemplates) {
    props.templates = fetchedTemplates;
    props.templates.forEach((template) => {
      const clone = template.cloneNode(true);
      templatesContainer.append(clone);
    });
  }
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

    if (isPlaceholder) {
      $tmplt.classList.add('placeholder');
    }
  }
}

export async function decorateTemplateList(block, placeholders, templatesContainer) {
  debugger;
  const templates = Array.from(templatesContainer.children);
  // process single column first row as title
  if (templates[0] && templates[0].children.length === 1) {
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
  }

  const rows = templates.length;
  let breakpoints = [{ width: '400' }];

  if (rows === 1) {
    templatesContainer.classList.add('large');
    breakpoints = [{
      media: '(min-width: 600px)',
      width: '2000',
    }, { width: '750' }];
  }

  templatesContainer.querySelectorAll(':scope picture > img').forEach(($img) => {
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

  populateTemplates(templatesContainer, templates);
}

function removeOnClickOutsideElement(element, event, button) {
  const func = (evt) => {
    if (event === evt) return; // ignore initial click event
    let targetEl = evt.target;
    while (targetEl) {
      if (targetEl === element) {
        // click inside
        return;
      }
      // Go up the DOM
      targetEl = targetEl.parentNode;
    }
    // This is a click outside.
    element.remove();
    button.setAttribute('aria-expanded', false);
    document.removeEventListener('click', func);
  };
  document.addEventListener('click', func);
}

function decorateForOnPickerSelect(option, list, dropdownText, firstElem, block, placeholders) {
  option.addEventListener('click', () => {
    list.remove();
    const downArrow = createTag('img', {
      class: 'icon down-arrow',
      src: '../../express/icons/drop-down-arrow.svg',
      width: 15,
      height: 9,
    });
    dropdownText.textContent = option.textContent;
    dropdownText.appendChild(downArrow);
    if (firstElem) {
      dropdownText.classList.remove('selected');
    } else if (!dropdownText.classList.contains('selected')) {
      dropdownText.classList.add('selected');
    }
    loadTemplates(block, placeholders, firstElem ? '' : option.textContent);
    option.classList.add('selected');
    console.log(option.textContent);
  });
}

function openPicker(button, texts, dropText, event, block, placeholders) {
  if (document.querySelector('main .template-list-ace .picker')) {
    return;
  }
  const list = createTag('ul', { class: 'picker' });
  texts.forEach((d, index) => {
    const span = createTag('span');
    span.textContent = d;
    const li = createTag('li');
    li.appendChild(span);
    if (index !== 0 && d === dropText.textContent) {
      span.classList.add('selected');
      const checkArrow = createTag('img', {
        class: 'icon check-arrow',
        src: '../../express/icons/checkmark.svg',
        width: 15,
        height: 15,
      });
      span.appendChild(checkArrow);
    }
    list.appendChild(li);
    decorateForOnPickerSelect(span, list, dropText, index === 0, block, placeholders);
  });
  button.appendChild(list);
  button.setAttribute('aria-expanded', true);
  removeOnClickOutsideElement(list, event, button);
}

async function loadTemplates(block, placeholders, topic) {
  if (topic) {
    props.filters.topics = topic;
  } else {
    delete props.filters.topics;
  }
  const existingContainer = block.querySelector('.templates-container');
  if (existingContainer) existingContainer.remove();
  const templatesContainer = createTag('div', { class: 'templates-container' });
  block.append(templatesContainer);
  await readRowsFromBlock(block, templatesContainer);

  await decorateTemplateList(block, placeholders, templatesContainer);
  //buildCarousel(':scope .template', block, true);
}

function createDropdown(titleRow, placeholders, block) {
  const title = titleRow.querySelector(':scope h1');
  const dropdownTexts = placeholders['template-list-ace-categories-dropdown'].split(',');
  const downArrow = createTag('img', {
    class: 'icon down-arrow',
    src: '../../express/icons/drop-down-arrow.svg',
    width: 15,
    height: 9,
  });
  const dropdown = createTag('div', {
    class: 'picker-open', role: 'button', 'aria-haspopup': true, 'aria-expanded': false,
  });
  const dropdownText = createTag('span', { class: 'picker-open-text' });
  dropdownText.textContent = dropdownTexts[0];
  dropdownText.appendChild(downArrow);
  dropdown.append(dropdownText);
  const span = createTag('span');
  span.style.flexBasis = '100%';
  title.innerHTML = title.innerHTML.replaceAll('{{ace-dropdown}}', dropdown.outerHTML);
  title.innerHTML = title.innerHTML.replaceAll('{{breakline}}', span.outerHTML);

  const drop = title.querySelector('.picker-open');
  const dropText = title.querySelector('.picker-open-text');

  dropText.addEventListener('click', (e) => {
    openPicker(drop, dropdownTexts, dropText, e, block, placeholders);
  });
}

function openModal(query, searchForm, cleanup) {
  const modalContent = createTag('div');
  modalContent.style.height = '740px';
  modalContent.style.width = '1200px';
  modalContent.append(renderModalContent(query, searchForm, cleanup));
  import('../modal/modal.js').then((mod) => {
    mod.getModal(null, {
      class: 'generated-results-modal', id: 'generated-results-modal', content: modalContent, closeEvent: 'closeGeneratedResultsModal',
    });
  });
}

function createSearchBar(searchRows, placeholders, titleRow) {
  const searchForm = createTag('form', { class: 'search-form' });
  const searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    placeholder: placeholders['template-list-ace-search-hint'] ?? 'Describe what you want to generate...',
    enterKeyHint: placeholders.search ?? 'Search',
  });
  searchForm.append(searchBar);
  const button = searchRows[1];
  searchForm.append(button);

  const titleRowDiv = titleRow.querySelector(':scope > div');
  const title = titleRowDiv.querySelector(':scope > h1');
  // title.innerHTML += searchForm.outerHTML;
  title.append(searchForm);
  const cleanup = () => {
    titleRowDiv.append(title);
  };
  const buttonLink = title.querySelector(':scope a');
  buttonLink.href = '#';
  buttonLink.addEventListener('click', (event) => {
    event.preventDefault();
    if (!searchBar.value) {
      alert('search should not be empty!');
      return;
    }
    openModal(searchBar.value, title);
  });
  // todo I don't think we need this jingle
  window.addEventListener('milo:modal:closed', () => {
    cleanup();
  });

  titleRowDiv.classList.add('title-search');
  // titleRowDiv.append(searchForm);

  const suggestions = searchRows[2].querySelectorAll(':scope > p');
  return searchBar;
}

function isProd(url) {
  return !/\.hlx/.test(url);
}

export default async function decorate(block) {
  if (!isProd(window.location.href)) {
    await getImsToken();
  }
  const placeholders = await fetchPlaceholders();
  block.innerHTML = block.innerHTML.replaceAll('{{template-list-ace-title}}', placeholders['template-list-ace-title'])
    .replaceAll('{{template-list-ace-button}}', placeholders['template-list-ace-button'])
    .replaceAll('{{template-list-ace-suggestions-title}}', placeholders['template-list-ace-suggestions-title'])
    .replaceAll('{{template-list-ace-suggestions}}', placeholders['template-list-ace-suggestions']);

  props.filters.tasks = '(poster)';
  props.sort = '-_score,-remixCount';
  const rows = Array.from(block.children);
  const titleRow = rows.shift();
  createDropdown(titleRow, placeholders, block);
  const searchRows = rows.shift();
  createSearchBar(searchRows.querySelectorAll('div'), placeholders, titleRow);
  const placeholdersRow = rows.shift();
  searchRows.remove();
  placeholdersRow.remove();
  await loadTemplates(block, placeholders, '');
}
