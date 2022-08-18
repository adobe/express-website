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
  createTag,
  decorateMain, fetchPlaceholders,
  getIconElement,
  getLocale,
  linkImage,
  toClassName,
} from '../../scripts/scripts.js';
import { Masonry } from '../shared/masonry.js';

import { buildCarousel } from '../shared/carousel.js';

const cache = {
  templates: [],
  queryString: '',
  start: '',
  masonry: undefined,
};

function fetchTemplates(queryString, start) {
  return fetch(`https://www.adobe.com/cc-express-search-api?filters=tasks:${queryString} AND locales:en&schema=template&orderBy=-remixCount&premium=false&limit=70&start=${start}`)
    .then((response) => response.json())
    .then((response) => response);
}

async function normalizeFetchedTemplates(queryString) {
  const response = await fetchTemplates(queryString, cache.start);
  // eslint-disable-next-line no-underscore-dangle
  const templateFetched = response._embedded.results;
  // eslint-disable-next-line no-underscore-dangle
  const nextQuery = response._links.next.href;
  const params = new URLSearchParams(nextQuery);
  cache.start = params.get('start').split(',')[0];
  const renditionParams = {
    format: 'jpg',
    dimension: 'width',
    size: 240,
  };
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
      title: 'Edit this template',
      class: 'button accent',
    });

    $button.textContent = 'Edit this template';
    $pictureWrapper.insertAdjacentElement('beforeend', $picture);
    $buttonWrapper.insertAdjacentElement('beforeend', $button);
    $template.insertAdjacentElement('beforeend', $pictureWrapper);
    $template.insertAdjacentElement('beforeend', $buttonWrapper);
    return $template;
  });
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */

export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
    }
  });

  return picture;
}

async function fetchBlueprint(pathname) {
  if (window.spark.$blueprint) {
    return (window.spark.$blueprint);
  }

  const bpPath = pathname.substr(pathname.indexOf('/', 1)).split('.')[0];
  const resp = await fetch(`${bpPath}.plain.html`);
  const body = await resp.text();
  const $main = createTag('main');
  $main.innerHTML = body;
  decorateMain($main);

  window.spark.$blueprint = $main;
  return ($main);
}

function populateTemplates($block, templates) {
  for (let $tmplt of templates) {
    const isPlaceholder = $tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
    const $linkContainer = $tmplt.querySelector(':scope > div:nth-of-type(2)');
    const $link = $linkContainer.querySelector(':scope a');
    if ($link) {
      const $a = createTag('a', {
        href: $link.href ? addSearchQueryToHref($link.href) : '#',
      });

      $a.append(...$tmplt.childNodes);
      $tmplt.remove();
      $tmplt = $a;
      $block.append($a);

      // convert A to SPAN
      const $newLink = createTag('span', { class: 'template-link' });
      $newLink.append($link.textContent);

      $linkContainer.innerHTML = '';
      $linkContainer.append($newLink);
    }

    if ($tmplt.children.length === 3) {
      // look for for options in last cell
      const $overlayCell = $tmplt.querySelector(':scope > div:last-of-type');
      const option = $overlayCell.textContent.trim();
      if (option) {
        if (isPlaceholder) {
          // add aspect ratio to template
          const sep = option.includes(':') ? ':' : 'x';
          const ratios = option.split(sep).map((e) => +e);
          const width = $block.classList.contains('sixcols') ? 165 : 200;
          if (ratios[1]) {
            const height = (ratios[1] / ratios[0]) * width;
            $tmplt.style = `height: ${height - 21}px`;
            if (width / height > 1.3) {
              $tmplt.classList.add('wide');
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

export async function decorateTemplateList($block) {
  if ($block.classList.contains('apipowered')) {
    if ($block.children[0].querySelectorAll('div')[0].textContent === 'Search query') {
      cache.queryString = $block.children[0].querySelectorAll('div')[1].textContent;
    }
    const { templates, queryString } = cache;
    cache.templates = templates.concat(await normalizeFetchedTemplates(queryString));
    cache.templates.forEach((template) => {
      const clone = template.cloneNode(true);
      $block.append(clone);
    });
  }

  let rows = $block.children.length;
  const locale = getLocale(window.location);
  if ((rows === 0 || $block.querySelectorAll('picture').length === 0)
    && locale !== 'us') {
    const i18nTexts = $block.firstElementChild
      // author defined localized edit text(s)
      && ($block.firstElementChild.querySelector('p')
        // multiple lines in separate p tags
        ? Array.from($block.querySelectorAll('p')).map(($p) => $p.textContent.trim())
        // single text directly in div
        : [$block.firstElementChild.textContent.trim()]);
    $block.innerHTML = '';
    const tls = Array.from($block.closest('main').querySelectorAll('.template-list'));
    const i = tls.indexOf($block);

    const $blueprint = await fetchBlueprint(window.location.pathname);

    const $bpBlock = $blueprint.querySelectorAll('.template-list')[i];
    if ($bpBlock) {
      $block.innerHTML = $bpBlock.innerHTML;
    } else {
      $block.remove();
    }

    if (i18nTexts && i18nTexts.length > 0) {
      const [placeholderText] = i18nTexts;
      let [, templateText] = i18nTexts;
      if (!templateText) {
        templateText = placeholderText;
      }
      $block.querySelectorAll('a').forEach(($a, index) => {
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

  if (templates[0] && templates[0].children.length === 1) {
    const $titleRow = templates.shift();
    $titleRow.classList.add('template-title');
    $titleRow.querySelectorAll(':scope a').forEach(($a) => {
      $a.className = 'template-title-link';
      $a.closest('p').classList.remove('button-container');
    });
  }

  rows = templates.length;
  let breakpoints = [{ width: '400' }];

  if (rows > 6 && !$block.classList.contains('horizontal')) {
    $block.classList.add('masonry');
  }

  if (rows === 1) {
    $block.classList.add('large');
    breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }];
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

      const masonry = new Masonry($block, cells);
      cache.masonry = masonry;
      masonry.draw();
      window.addEventListener('resize', () => {
        masonry.draw();
      });
    } else {
      $block.classList.add('template-list-complete');
    }
  }

  const $templateLinks = $block.querySelectorAll('a.template');
  const linksPopulated = new CustomEvent('linkspopulated', { detail: $templateLinks });
  document.dispatchEvent(linksPopulated);
}

async function decorateNewTamplates($block) {
  const { templates, queryString, masonry } = cache;
  const newTemplates = await normalizeFetchedTemplates(queryString);

  cache.templates = templates.concat(newTemplates);
  populateTemplates($block, newTemplates);
  newTemplates.forEach((template) => {
    const clone = template.cloneNode(true);
    $block.append(clone);
  });

  const newCells = Array.from($block.querySelectorAll('.template:not(.appear)'));
  masonry.cells = masonry.cells.concat(newCells);
  masonry.draw(newCells);
}

function decorateLoadMoreButton($block) {
  const $loadMoreDiv = createTag('div', { class: 'load-more' });
  const $loadMoreButton = createTag('button', { class: 'load-more-button' });
  const $loadMoreText = createTag('p', { class: 'load-more-text' });
  $loadMoreDiv.append($loadMoreButton, $loadMoreText);
  fetchPlaceholders().then((placeholders) => {
    $loadMoreText.textContent = placeholders['load-more'];
  });
  $block.insertAdjacentElement('afterend', $loadMoreDiv);
  $loadMoreButton.textContent = '+';

  $loadMoreButton.addEventListener('click', async () => {
    $loadMoreButton.classList.add('disabled');
    const scrollPosition = window.scrollY;
    await decorateNewTamplates($block);
    window.scrollTo({
      top: scrollPosition,
      left: 0,
      behavior: 'smooth',
    });
    $loadMoreButton.classList.remove('disabled');
  });
}

function cacheCreatedTemplate($block) {
  cache.templates.push($block.children[$block.children.length - 1]);
  $block.children[$block.children.length - 1].remove();
}

export default async function decorate($block) {
  if ($block.classList.contains('apipowered')) {
    cacheCreatedTemplate($block);
  }

  await decorateTemplateList($block);
  if ($block.classList.contains('horizontal')) {
    /* carousel */
    buildCarousel(':scope > .template', $block, true);
  } else {
    addAnimationToggle($block);
  }

  if ($block.classList.contains('apipowered')) {
    decorateLoadMoreButton($block);
  }
}
