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
  decorateMain,
  fetchPlaceholders,
  getIconElement,
  getLocale,
  linkImage,
  toClassName,
} from '../../scripts/scripts.js';
import { Masonry } from '../shared/masonry.js';

import { buildCarousel } from '../shared/carousel.js';

const cache = {
  templates: [],
  filters: {
    locales: '(en)',
  },
  tailButton: '',
  limit: 70,
  total: 0,
  start: '',
  masonry: undefined,
  authoringError: false,
};

function fetchTemplates() {
  if (!cache.authoringError && Object.keys(cache.filters).length !== 0) {
    const prunedFilter = Object.entries(cache.filters)
      .filter(([, value]) => value !== '()');
    const filterString = prunedFilter.reduce((string, [key, value]) => {
      if (key === prunedFilter[prunedFilter.length - 1][0]) {
        return `${string}${key}:${value}`;
      } else {
        return `${string}${key}:${value} AND `;
      }
    }, '');

    return fetch(`https://www.adobe.com/cc-express-search-api?limit=${cache.limit}&start=${cache.start}&orderBy=-remixCount&filters=${filterString}`)
      .then((response) => response.json())
      .then((response) => response);
  }
  return null;
}

async function processResponse() {
  const response = await fetchTemplates();
  let templateFetched;
  // eslint-disable-next-line no-underscore-dangle
  if (response) {
    // eslint-disable-next-line no-underscore-dangle
    templateFetched = response._embedded.results;

    if ('_links' in response) {
      // eslint-disable-next-line no-underscore-dangle
      const nextQuery = response._links.next.href;
      const start = new URLSearchParams(nextQuery).get('start')
        .split(',')[0];
      cache.start = start;
    } else {
      cache.start = '';
    }

    if (cache.total === 0) {
      // eslint-disable-next-line no-underscore-dangle
      cache.total = response._embedded.total;
    }
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
  } else {
    return null;
  }
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */

export function createOptimizedPicture(src,
  alt = '',
  eager = false,
  breakpoints = [{
    media: '(min-width: 400px)',
    width: '2000',
  }, { width: '750' }]) {
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
    }

    if ($rowWithLinkInFirstCol && !$tmplt.querySelector('img')) {
      cache.tailButton = $rowWithLinkInFirstCol;
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
          const ratios = option.split(sep)
            .map((e) => +e);
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
            const width = $block.classList.contains('sixcols') ? 165 : 200;
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
        $tmplt.querySelectorAll(':scope br')
          .forEach(($br) => $br.remove());
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
    Array.from($toggleButtons)
      .forEach(($button) => {
        $button.classList.toggle('expanded');
      });
  });

  Array.from($toggleButtons)
    .forEach(($button) => {
      $button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        $wrapper.classList.toggle('expanded');
        $section.classList.toggle('expanded');
        Array.from($toggleButtons)
          .forEach((b) => {
            b.classList.toggle('expanded');
          });
      });
    });
}

export async function decorateTemplateList($block) {
  if ($block.classList.contains('apipowered')) {
    if ($block.children.length > 0) {
      Array.from($block.children)
        .forEach((row, index, array) => {
          const cells = row.querySelectorAll('div');
          if (index === 0) {
            if (cells.length >= 2 && ['type*', 'type'].includes(cells[0].textContent.toLowerCase())) {
              cache.filters.tasks = `(${cells[1].textContent.toLowerCase()})`;
              cache.heading = cells[1].textContent;
            } else if ($block.classList.contains('highlight')) {
              cache.heading = row;
            } else {
              cache.heading = row.textContent;
            }
            row.remove();
          } else if (cells[0].textContent.toLowerCase() === 'auto-collapse delay') {
            cache.autoCollapseDelay = parseFloat(cells[1].textContent) * 1000;
          } else if (cells[0].textContent.toLowerCase() === 'background animation') {
            cache.backgroundAnimation = cells[1].textContent;
          } else if (index < array.length) {
            if (cells.length >= 2) {
              if (['type*', 'type'].includes(cells[0].textContent.toLowerCase())) {
                cache.filters.tasks = `(${cells[1].textContent.toLowerCase()})`;
              } else {
                cache.filters[`${cells[0].textContent.toLowerCase()}`] = `(${cells[1].textContent.toLowerCase()})`;
              }
            }
            row.remove();
          }
        });

      const fetchedTemplates = await processResponse();

      if (fetchedTemplates) {
        cache.templates = cache.templates.concat(fetchedTemplates);
        cache.templates.forEach((template) => {
          const clone = template.cloneNode(true);
          $block.append(clone);
        });
      }
    } else {
      cache.heading = 'Authoring error: first row must specify the template “type”';
      cache.authoringError = true;
    }

    const $parent = $block.closest('.section');
    if ($parent) {
      if ($block.classList.contains('highlight')) {
        const $wrapper = $parent.querySelector('.template-list-wrapper');
        const $icon = cache.heading.querySelector('picture');
        const $content = Array.from(cache.heading.querySelectorAll('p'))
          .filter((p) => p.textContent !== '' && p.querySelector('a') === null);
        const $a = cache.heading.querySelector('a');
        $a.classList.add('expanded');
        $a.classList.add('toggle-button');
        $a.classList.remove('button');
        $a.classList.remove('accent');

        const $toggleBar = createTag('div', { class: 'toggle-bar' });
        const $topElements = createTag('div', { class: 'toggle-bar-top' });
        const $bottomElements = createTag('div', { class: 'toggle-bar-bottom' });
        const $mobileSubtext = $content[1].cloneNode(true);
        const $mobileAnchor = $a.cloneNode(true);
        $mobileSubtext.classList.add('mobile-only');
        $mobileAnchor.classList.add('mobile-only');

        $toggleBar.append($topElements, $bottomElements);
        $topElements.append($icon, $content[0]);
        $bottomElements.append($content[1], $a);
        $wrapper.prepend($mobileSubtext);
        $wrapper.insertAdjacentElement('afterend', $mobileAnchor);
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
        }, cache.autoCollapseDelay);
      } else {
        const $sectionHeading = $parent.querySelector('div > h2');
        if ($sectionHeading.textContent.indexOf('{{heading_placeholder}}') >= 0) {
          if (cache.authoringError) {
            $sectionHeading.textContent = cache.heading;
          } else {
            const headingEnding = await fetchPlaceholders()
              .then((placeholders) => placeholders['api-powered-grid-heading']);
            $sectionHeading.textContent = `${cache.total.toLocaleString('en-US')} ${cache.heading} ${headingEnding}`;
          }
        }
      }
    }
  }

  let rows = $block.children.length;
  const locale = getLocale(window.location);
  if ((rows === 0 || $block.querySelectorAll('picture').length === 0)
    && locale !== 'us') {
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

    if ($block.classList.contains('collaboration')) {
      const $titleHeading = $titleRow.querySelector('h3');
      const $anchorLink = createTag('a', {
        class: 'collaboration-anchor',
        href: `${document.URL.replace(/#.*$/, '')}#${$titleHeading.id}`,
      });
      const $clipboardTag = createTag('span', { class: 'clipboard-tag' });
      fetchPlaceholders()
        .then((placeholders) => {
          $clipboardTag.textContent = placeholders['tag-copied'];
        });

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
      media: '(min-width: 400px)',
      width: '2000',
    }, { width: '750' }];
  }

  $block.querySelectorAll(':scope picture > img')
    .forEach(($img) => {
      const {
        src,
        alt,
      } = $img;
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
  let freeInAppText;
  await fetchPlaceholders()
    .then((placeholders) => {
      freeInAppText = placeholders['free-in-app'];
    });
  for (const $templateLink of $templateLinks) {
    const isPremium = $templateLink.querySelectorAll('.icon-premium').length > 0;
    if (!isPremium && !$templateLink.classList.contains('placeholder')) {
      const $freeInAppBadge = createTag('span', { class: 'icon icon-free-badge' });
      $freeInAppBadge.textContent = freeInAppText;
      $templateLink.querySelector('div')
        .append($freeInAppBadge);
    }
  }
  const linksPopulated = new CustomEvent('linkspopulated', { detail: $templateLinks });
  document.dispatchEvent(linksPopulated);
}

function updateButtonStatus($block, $loadMore) {
  if (cache.start === '') {
    $loadMore.style.display = 'none';
  }
}

async function decorateNewTamplates($block, $loadMore) {
  const newTemplates = await processResponse();

  cache.templates = cache.templates.concat(newTemplates);
  populateTemplates($block, newTemplates);
  newTemplates.forEach((template) => {
    const clone = template.cloneNode(true);
    $block.append(clone);
  });

  const newCells = Array.from($block.querySelectorAll('.template:not(.appear)'));
  cache.masonry.cells = cache.masonry.cells.concat(newCells);
  cache.masonry.draw(newCells);
  updateButtonStatus($block, $loadMore);
}

function decorateLoadMoreButton($block) {
  const $loadMoreDiv = createTag('div', { class: 'load-more' });
  const $loadMoreButton = createTag('button', { class: 'load-more-button' });
  const $loadMoreText = createTag('p', { class: 'load-more-text' });
  $loadMoreDiv.append($loadMoreButton, $loadMoreText);
  fetchPlaceholders()
    .then((placeholders) => {
      $loadMoreText.textContent = placeholders['load-more'];
    });
  $block.insertAdjacentElement('afterend', $loadMoreDiv);
  $loadMoreButton.textContent = '+';

  $loadMoreButton.addEventListener('click', async () => {
    $loadMoreButton.classList.add('disabled');
    const scrollPosition = window.scrollY;
    await decorateNewTamplates($block, $loadMoreDiv);
    window.scrollTo({
      top: scrollPosition,
      left: 0,
      behavior: 'smooth',
    });
    $loadMoreButton.classList.remove('disabled');
  });
  updateButtonStatus($block, $loadMoreDiv);
}

function decorateTailButton($block) {
  const $carouselPlatform = $block.querySelector('.carousel-platform');

  if ($carouselPlatform) {
    cache.tailButton.classList.add('tail-cta');
    $carouselPlatform.append(cache.tailButton);
  }
}

function cacheCreatedTemplate($block) {
  cache.templates.push($block.children[$block.children.length - 1]);
  $block.children[$block.children.length - 1].remove();
}

function addBackgroundAnimation($block, animationName) {
  const animations = {
    firework: function startFirework($section) {
      (function () {
        const requestAnimationFrame = window.requestAnimationFrame
          || window.mozRequestAnimationFrame
          || window.webkitRequestAnimationFrame
          || window.msRequestAnimationFrame;
        window.requestAnimationFrame = requestAnimationFrame;
      }());

      const canvas = $section.querySelector('.animation-canvas');
      const ctx = canvas.getContext('2d');
      let width = 0;
      let height = 0;
      let vanishPointY = 0;
      let vanishPointX = 0;
      const focalLength = 300;
      let angleX = 180;
      let angleY = 180;
      let angleZ = 180;
      let angle = 0;
      let cycle = 0;
      const colors = {
        r: 255,
        g: 0,
        b: 0,
      };

      canvas.width = width;
      canvas.height = height;

      function Particle(x, y, z, color) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.startX = this.x;
        this.startY = this.y;
        this.startZ = this.z;

        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;

        this.xPos = 0;
        this.yPos = 0;

        this.vx = (Math.random() * 10) - 5;
        this.vy = (Math.random() * 10) - 5;
        this.vz = (Math.random() * 10) - 5;

        this.color = [color.r, color.g, color.b];
        this.render = true;

        this.size = Math.round(1 + Math.random() * 1);
      }

      // Controls the emitter
      function Emitter() {
        this.reset();
      }

      Emitter.prototype.reset = function () {
        const PART_NUM = 200;
        const x = (Math.random() * 400) - 200;
        const y = (Math.random() * 400) - 200;
        const z = (Math.random() * 800) - 200;

        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.particles = [];

        for (let i = 0; i < PART_NUM; i += 1) {
          this.particles.push(new Particle(this.x, this.y, this.z, {
            r: colors.r,
            g: colors.g,
            b: colors.b,
          }));
        }
      };

      Emitter.prototype.update = function () {
        const partLen = this.particles.length;

        angleY = (angle - vanishPointX) * 0.0001;
        angleX = (angle - vanishPointX) * 0.0001;

        this.particles.sort((a, b) => b.z - a.z);

        for (let i = 0; i < partLen; i += 1) {
          this.particles[i].update();
        }

        if (this.particles.length <= 0) {
          this.reset();
        }
      };

      Emitter.prototype.render = function (imgData) {
        const { data } = imgData;

        for (let i = 0; i < this.particles.length; i += 1) {
          const particle = this.particles[i];
          const dist = Math.sqrt((particle.x - particle.ox)
            * (particle.x - particle.ox)
            + (particle.y - particle.oy)
            * (particle.y - particle.oy)
            + (particle.z - particle.oz)
            * (particle.z - particle.oz));

          if (dist > 255) {
            particle.render = false;
            this.particles.splice(i, 1);
            this.particles.length -= 1;
          }

          if (particle.render
            && particle.xPos < width
            && particle.xPos > 0
            && particle.yPos > 0
            && particle.yPos < height) {
            for (let w = 0; w < particle.size; w += 1) {
              for (let h = 0; h < particle.size; h += 1) {
                if (particle.xPos + w < width
                  && particle.xPos + w > 0
                  && particle.yPos + h > 0
                  && particle.yPos + h < height) {
                  const pData = (Math.floor(particle.xPos + w)
                    + (Math.floor(particle.yPos + h) * width)) * 4;
                  [data[pData], data[pData + 1], data[pData + 2]] = particle.color;
                  data[pData + 3] = 255 - dist;
                }
              }
            }
          }
        }
      };

      // Controls the individual particles

      Particle.prototype.rotate = function () {
        const x = this.startX * Math.cos(angleZ) - this.startY * Math.sin(angleZ);
        const y = this.startY * Math.cos(angleZ) + this.startX * Math.sin(angleZ);

        this.x = x;
        this.y = y;
      };

      Particle.prototype.update = function () {
        this.cosY = Math.cos(angleX);
        this.sinY = Math.sin(angleX);
        this.startX += this.vx;
        this.x = this.startX;
        this.startY += this.vy;
        this.y = this.startY;
        this.startZ -= this.vz;
        this.z = this.startZ;
        this.rotate();

        this.vy += 0.1;
        this.x += this.vx;
        this.y += this.vy;
        this.z -= this.vz;

        this.render = false;

        if (this.z > -focalLength) {
          const scale = focalLength / (focalLength + this.z);

          this.size = scale * 2;
          this.xPos = vanishPointX + this.x * scale;
          this.yPos = vanishPointY + this.y * scale;
          this.render = true;
        }
      };

      const emitters = [];

      function colorCycle() {
        cycle += 0.6;
        if (cycle > 100) {
          cycle = 0;
        }

        colors.r = Math.floor(Math.sin(0.3 * cycle + 0) * 127 + 128);
        colors.g = Math.floor(Math.sin(0.3 * cycle + 2) * 127 + 128);
        colors.b = Math.floor(Math.sin(0.3 * cycle + 4) * 127 + 128);
      }

      function render() {
        colorCycle();
        // eslint-disable-next-line no-unused-vars
        angleY = Math.sin(angle += 0.01);
        angleX = Math.sin(angle);
        angleZ = Math.sin(angle);

        const imgData = ctx.createImageData(width, height);

        for (let e = 0; e < 30; e += 1) {
          emitters[e].update();
          emitters[e].render(imgData);
        }
        ctx.putImageData(imgData, 0, 0);
        requestAnimationFrame(render);
      }

      for (let e = 0; e < 30; e += 1) {
        colorCycle();
        emitters.push(new Emitter());
      }

      function adjustSize() {
        canvas.width = $section.offsetWidth;
        width = canvas.width;
        canvas.height = $section.offsetHeight;
        height = canvas.height;
        vanishPointY = height / 2;
        vanishPointX = width / 2;
      }

      setTimeout(() => {
        adjustSize();
        render();

        window.addEventListener('resize', adjustSize);
      }, 500);
    },
  };

  const $parent = $block.closest('.section');

  if ($parent) {
    const $canvas = createTag('canvas', { class: 'animation-canvas' });
    $parent.append($canvas);

    animations[animationName]($parent);
  }
}

export default async function decorate($block) {
  if ($block.classList.contains('apipowered') && !$block.classList.contains('highlight')) {
    cacheCreatedTemplate($block);
  }

  await decorateTemplateList($block);
  if ($block.classList.contains('horizontal')) {
    const requireInfiniteScroll = !$block.classList.contains('mini') && !$block.classList.contains('collaboration');
    buildCarousel(':scope > .template', $block, requireInfiniteScroll);
  } else {
    addAnimationToggle($block);
  }

  if ($block.classList.contains('apipowered') && !$block.classList.contains('highlight')) {
    decorateLoadMoreButton($block);
  }

  if ($block.classList.contains('mini')) {
    decorateTailButton($block);
  }

  if ($block.classList.contains('highlight') && cache.backgroundAnimation) {
    addBackgroundAnimation($block, cache.backgroundAnimation);
  }
}
