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
  linkImage,
  toClassName,
} from '../../scripts/scripts.js';

import { Masonry } from '../shared/masonry.js';

const props = {
  templates: [],
  filters: { locales: '(en)' },
  tailButton: '',
  limit: 30,
  total: 0,
  start: '',
  sort: '-_score,-remixCount',
  masonry: undefined,
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

async function readRowsFromBlock($block, templatesContainer) {
  const fetchedTemplates = await processResponse();

  if (fetchedTemplates) {
    props.templates = props.templates.concat(fetchedTemplates);
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

export async function decorateTemplateList(block, placeholders, templatesContainer) {
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

  if (rows > 6 && !templatesContainer.classList.contains('horizontal')) {
    templatesContainer.classList.add('masonry');
  }

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
  if (!templatesContainer.classList.contains('horizontal')) {
    if (rows > 6 || templatesContainer.classList.contains('sixcols') || templatesContainer.classList.contains('fullwidth')) {
      /* flex masonry */
      const cells = Array.from(templatesContainer.children);
      templatesContainer.classList.remove('masonry');
      templatesContainer.classList.add('flex-masonry');

      props.masonry = new Masonry(templatesContainer, cells);
      props.masonry.draw();
      window.addEventListener('resize', () => {
        props.masonry.draw();
      });
    } else {
      templatesContainer.classList.add('template-list-complete');
    }
  }
}
export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  block.innerHTML = block.innerHTML.replaceAll('{{template-list-ace-title}}', placeholders['template-list-ace-title'])
    .replaceAll('{{template-list-ace-button}}', placeholders['template-list-ace-button'])
    .replaceAll('{{template-list-ace-suggestions-title}}', placeholders['template-list-ace-suggestions-title'])
    .replaceAll('{{template-list-ace-suggestions}}', placeholders['template-list-ace-suggestions']);

  const rows = Array.from(block.children);
  const titleRow = rows.shift();
  const title = titleRow.querySelector(':scope h2');
  const searchRows = rows.shift().querySelectorAll('div');
  const button = searchRows[1].querySelector('a');
  const suggestions = searchRows[2].querySelectorAll(':scope > p');
  const templatesContainer = createTag('div', { class: 'templates-container' });
  block.append(templatesContainer);
  await readRowsFromBlock(block, templatesContainer);

  await decorateTemplateList(block, placeholders, templatesContainer);
  // if ($block.classList.contains('spreadsheet-powered')) {
  //   const placeholders = await fetchPlaceholders().then((result) => result);
  //   const relevantRowsData = await fetchRelevantRows(window.location.pathname);
  //   props.limit = parseInt(placeholders['relevant-rows-templates-limit'], 10) || 10;
  //
  //   if (relevantRowsData) {
  //     $block.closest('.section').dataset.audience = 'mobile';
  //
  //     props.headingTitle = relevantRowsData.header || null;
  //     props.headingSlug = relevantRowsData.shortTitle || null;
  //     props.viewAllLink = relevantRowsData.viewAllLink || null;
  //
  //     $block.innerHTML = $block.innerHTML.replaceAll('default-title', relevantRowsData.shortTitle || '');
  //     $block.innerHTML = $block.innerHTML.replaceAll('default-tasks', relevantRowsData.templateTasks || '');
  //     $block.innerHTML = $block.innerHTML.replaceAll('default-topics', relevantRowsData.templateTopics || '');
  //     $block.innerHTML = $block.innerHTML.replaceAll('default-locale', relevantRowsData.templateLocale || 'en');
  //     $block.innerHTML = $block.innerHTML.replaceAll('default-premium', relevantRowsData.templatePremium || '');
  //     $block.innerHTML = $block.innerHTML.replaceAll('default-animated', relevantRowsData.templateAnimated || '');
  //     $block.innerHTML = $block.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', relevantRowsData.createLink || '/');
  //     $block.innerHTML = $block.innerHTML.replaceAll('default-format', relevantRowsData.placeholderFormat || '');
  //
  //     if (relevantRowsData.templateTasks === '') {
  //       $block.innerHTML = $block.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
  //     } else {
  //       $block.innerHTML = $block.innerHTML.replaceAll('default-create-link-text', relevantRowsData.createText || '');
  //     }
  //   } else {
  //     $block.remove();
  //   }
  // }
  //
  // if ($block.classList.contains('apipowered') && !$block.classList.contains('holiday')) {
  //   cacheCreatedTemplate($block);
  // }
  //
  // await decorateTemplateList($block);
  //
  // if ($block.classList.contains('horizontal')) {
  //   const requireInfiniteScroll = !$block.classList.contains('mini') && !$block.classList.contains('collaboration');
  //   buildCarousel(':scope > .template', $block, requireInfiniteScroll);
  // } else {
  //   addAnimationToggle($block);
  // }
  //
  // if ($block.classList.contains('apipowered') && !$block.classList.contains('holiday') && !$block.classList.contains('mini')) {
  //   const $loadMore = await decorateLoadMoreButton($block);
  //
  //   if ($loadMore) {
  //     updateLoadMoreButton($block, $loadMore);
  //   }
  // }

}
