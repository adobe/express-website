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
} from '../../scripts/scripts.js';

function masonrize($cells, $masonry, force) {
  const colWidth = 264;

  const width = $masonry.offsetWidth;
  // console.log($masonry.offsetWidth);
  let numCols = Math.floor(width / colWidth);
  if (numCols < 1) numCols = 1;
  if ((numCols !== $masonry.children.length) || force) {
    $masonry.innerHTML = '';
    const columns = [];
    for (let i = 0; i < numCols; i += 1) {
      const $column = createTag('div', { class: 'masonry-col' });
      columns.push({
        outerHeight: 0,
        $column,
      });
      $masonry.appendChild($column);
    }

    let incomplete = false;
    $cells.forEach(($cell) => {
      const minOuterHeight = Math.min(...columns.map((column) => column.outerHeight));
      const column = columns.find((col) => col.outerHeight === minOuterHeight);
      column.$column.append($cell);

      const $image = $cell.querySelector('img');
      if ($image) {
        if (!$image.complete) {
          incomplete = true;
        }
      }
      const $video = $cell.querySelector('video');
      if ($video) {
        // console.log(`video ready state ${$video.readyState}`);
        if ($video.readyState === 0) {
          incomplete = true;
        }
      }

      // console.log(`cell offset height: ${$cell.offsetHeight}`);
      column.outerHeight += $cell.offsetHeight;
    });

    if (incomplete) {
      // console.log ('incomplete retrying in 500ms');

      setTimeout(() => {
        masonrize($cells, $masonry, true);
      }, 500);
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
  window.spark.$blueprint = $main;
  return ($main);
}

async function decorateTemplateList($block) {
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
        const $p = createTag('p');
        const $pic = createTag('picture', { class: 'hero-bg' });
        $pic.appendChild($bpHeroImage);
        $p.append($pic);

        $heroSection.classList.remove('hero-noimage');
        $heroDiv.prepend($p);
      }
    }
  }

  rows = $block.children.length;

  if (rows > 6) {
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
  for (let $tmplt of Array.from($block.children)) {
    const $link = $tmplt.querySelector(':scope > div:last-of-type > a');
    if ($link) {
      const $a = createTag('a', {
        href: $link.href || '#',
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
    $tmplt.classList.add('template');

    // wrap "linked images" with link
    const $imgLink = $tmplt.querySelector(':scope > div:first-of-type a');
    if ($imgLink) {
      const $parent = $imgLink.closest('div');
      if (!$imgLink.href.includes('.mp4')) {
        linkImage($parent);
      } else {
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
  }

  /* flex masonry */
  if (rows > 6) {
    // console.log(`masonry-rows: ${rows}`);
    const $masonryCells = Array.from($block.children);
    $block.classList.remove('masonry');
    $block.classList.add('flex-masonry');
    masonrize($masonryCells, $block);
    window.addEventListener('resize', () => {
      masonrize($masonryCells, $block);
    });
  }
}

export default function decorate($block) {
  decorateTemplateList($block);
}
