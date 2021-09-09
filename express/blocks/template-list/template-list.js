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

/* global window fetch document */
/* eslint-disable import/named, import/extensions */

import {
  getLocale,
  createTag,
  linkImage,
  webpPolyfill,
  addSearchQueryToHref,
  getIconElement,
  toClassName,
} from '../../scripts/scripts.js';

import {
  buildCarousel,
} from '../shared/carousel.js';

class Masonry {
  constructor($block, cells) {
    this.$block = $block;
    this.cells = cells;
    this.columns = [];
    this.nextColumn = null;
    this.startResizing = 0;
  }

  // set up fresh grid if necessary
  setupColumns() {
    let redraw = false;
    const colWidth = this.$block.classList.contains('sixcols') ? 175 : 264;
    const width = this.$block.offsetWidth;
    let numCols = Math.floor(width / colWidth);
    if (numCols < 1) numCols = 1;
    if (numCols !== this.$block.querySelectorAll('.masonry-col').length) {
      this.$block.innerHTML = '';
      this.columns = [];
      for (let i = 0; i < numCols; i += 1) {
        const $column = createTag('div', { class: 'masonry-col' });
        this.columns.push({
          outerHeight: 0,
          $column,
        });
        this.$block.appendChild($column);
      }
      redraw = true;
    }
    [this.nextColumn] = this.columns;
    return redraw;
  }

  // calculate least tallest column to add next cell to
  getNextColumn() {
    if (this.nextColumn) {
      return this.nextColumn;
    } else {
      const minOuterHeight = Math.min(...this.columns.map((col) => col.outerHeight));
      this.nextColumn = this.columns.find((col) => col.outerHeight === minOuterHeight);
      return this.nextColumn;
    }
  }

  // add cell to next column
  addCell($cell) {
    const column = this.getNextColumn();
    column.$column.append($cell);
    $cell.classList.add('appear');
    column.outerHeight += $cell.offsetHeight;
    this.nextColumn = null;
  }

  // distribute cells to columns
  draw(cells) {
    if (!cells) {
      if (!this.setupColumns()) {
        // no redrawing needed
        return;
      }
    }
    const workList = [...(cells || this.cells)];
    for (let i = 0; i < workList.length; i += 1) {
      const $cell = workList[i];

      const $image = $cell.querySelector(':scope picture > img');
      if ($image && !$image.complete) {
        // continue when image is loaded
        $image.addEventListener('load', () => {
          this.draw(workList);
        });
        return;
      }
      const $video = $cell.querySelector('video');
      if ($video && $video.readyState === 0) {
        // continue when video is loaded
        $video.addEventListener('loadeddata', () => {
          this.draw(workList);
        });
        return;
      }
      this.addCell($cell);
      // remove already processed cell
      workList.splice(i, 1);
    }
    if (workList.length > 0) {
      // draw rest
      this.draw(workList);
    }
  }
}

async function fetchBlueprint(pathname) {
  if (window.spark.$blueprint) {
    return (window.spark.$blueprint);
  }

  const bpPath = pathname.substr(pathname.indexOf('/', 1)).split('.')[0];
  const resp = await fetch(`${bpPath}.plain.html`);
  // eslint-disable-next-line no-console
  // console.log(`fetching...${bpPath}`);
  const body = await resp.text();
  const $main = createTag('main');
  $main.innerHTML = body;
  webpPolyfill($main);
  window.spark.$blueprint = $main;
  return ($main);
}

export async function decorateTemplateList($block) {
  // use lower resolution image and preload
  $block.querySelectorAll(':scope picture > img').forEach(($img) => {
    $img.setAttribute('src', $img.getAttribute('src').replace('width=2000&', 'width=750&'));
    $img.setAttribute('loading', 'eager');
  });
  let rows = $block.children.length;
  const locale = getLocale(window.location);
  if (rows === 0 && locale !== 'us') {
    const tls = Array.from($block.closest('main').querySelectorAll('.template-list'));
    const i = tls.indexOf($block);

    // eslint-disable-next-line no-await-in-loop
    const $blueprint = await fetchBlueprint(window.location.pathname);

    const $bpBlock = $blueprint.querySelectorAll('.template-list')[i];
    if ($bpBlock) {
      $block.innerHTML = $bpBlock.innerHTML;
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
    $titleRow.querySelectorAll(':scope a').forEach(($a) => {
      $a.className = 'template-title-link';
      $a.closest('p').classList.remove('button-container');
    });
  }

  rows = templates.length;

  if (rows > 6 && !$block.classList.contains('horizontal')) {
    $block.classList.add('masonry');
  }

  if (rows === 1) {
    $block.classList.add('large');
  }

  // find the edit link and turn the template DIV into the A
  // A
  // +- DIV
  //    +- PICTURE
  // +- DIV
  //    +- SPAN
  //       +- "Edit this template"
  //
  // make copy of children to avoid modifying list while looping
  for (let $tmplt of templates) {
    const isPlaceholder = $tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
    const $link = $tmplt.querySelector(':scope > div:nth-of-type(2) > a');
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
      $newLink.append(...$link.childNodes);
      $link.parentNode.append($newLink);
      $link.remove();
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
          const width = $block.classList.contains('sixcols') ? 145 : 200;
          if (ratios[1]) {
            const height = (ratios[1] / ratios[0]) * width;
            $tmplt.style = `height: ${height}px`;
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
        $tmplt.querySelectorAll(':scope br').forEach(($br) => $br.remove());
        const $picture = $tmplt.querySelector('picture');
        if ($picture) {
          const $video = createTag('video', {
            playsinline: '',
            autoplay: '',
            loop: '',
            muted: '',
          });
          $video.append(createTag('source', {
            src: $imgLink.href,
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

  if ($block.classList.contains('horizontal')) {
    /* carousel */
    buildCarousel(':scope > .template', $block, '');
  } else if (rows > 6) {
    /* flex masonry */
    // console.log(`masonry-rows: ${rows}`);
    const cells = Array.from($block.children);
    $block.classList.remove('masonry');
    $block.classList.add('flex-masonry');
    const masonry = new Masonry($block, cells);
    masonry.draw();
    window.addEventListener('resize', () => {
      masonry.draw();
    });
  }
}

export default async function decorate($block) {
  return decorateTemplateList($block);
}
