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

import {
  linkImage,
  createTag,
  transformLinkToAnimation,
  addAnimationToggle,
  toClassName,
  getLocale,
  getIconElement,
} from '../../scripts/scripts.js';

import {
  displayVideoModal,
  hideVideoModal,
} from '../shared/video.js';

function transformToVideoColumn($cell, $a) {
  const $parent = $cell.parentElement;
  const title = $a.textContent;
  // gather video urls from all links in cell
  const vidUrls = [];
  $cell.querySelectorAll(':scope a.button').forEach(($button) => {
    vidUrls.push($button.href);
    if ($button !== $a) {
      $button.closest('.button-container').remove();
    }
  });

  $cell.classList.add('column-video');
  $parent.classList.add('columns-video');

  setTimeout(() => {
    const $sibling = $parent.querySelector('.column-picture');
    if ($sibling) {
      const $videoOverlay = createTag('div', { class: 'column-video-overlay' });
      const $videoOverlayIcon = getIconElement('play', 44);
      $videoOverlay.append($videoOverlayIcon);
      $sibling.append($videoOverlay);
    }
  }, 1);

  $parent.addEventListener('click', () => {
    displayVideoModal(vidUrls, title, true);
  });

  $parent.addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
      displayVideoModal(vidUrls, title);
    }
  });

  // auto-play if hash matches title
  if (toClassName(title) === window.location.hash.substring(1)) {
    displayVideoModal(vidUrls, title);
  }
}

function decorateIconList($columnCell, rowNum) {
  const icons = [...$columnCell.querySelectorAll('img.icon, svg.icon')]
    .filter(($icon) => !$icon.closest('p').classList.contains('social-links'));
  if (rowNum === 0
    && icons.length === 1
    && icons[0].closest('p').innerText === ''
    && !icons[0].closest('p').previousSibling) {
    // treat icon as brand icon if first element in first row cell and no text next to it
    icons[0].classList.add('brand');
    $columnCell.parentElement.classList.add('has-brand');
    return;
  }
  if (icons.length) {
    let $iconList = createTag('div', { class: 'columns-iconlist' });
    let $iconListDescription;
    [...$columnCell.children].forEach(($e) => {
      const imgs = $e.querySelectorAll('img.icon, svg.icon');
      // only build icon list if single icon plus text
      const $img = imgs.length === 1 ? imgs[0] : null;
      const hasText = $img ? $img.closest('p').textContent !== '' : false;
      if ($img && hasText) {
        const $iconListRow = createTag('div');
        const $iconDiv = createTag('div', { class: 'columns-iconlist-icon' });
        $iconDiv.appendChild($img);
        $iconListRow.append($iconDiv);
        $iconListDescription = createTag('div', { class: 'columns-iconlist-description' });
        $iconListRow.append($iconListDescription);
        $iconListDescription.appendChild($e);
        $iconList.appendChild($iconListRow);
      } else {
        if ($iconList.children.length > 0) {
          $columnCell.appendChild($iconList);
          $iconList = createTag('div', { class: 'columns-iconlist' });
        }
        $columnCell.appendChild($e);
      }
    });
    if ($iconList.children.length > 0) $columnCell.appendChild($iconList);
  }
}

function addHeaderSizing($block) {
  const headings = $block.querySelectorAll('h1, h2');
  // Each threshold of JP should be smaller than other languages
  // because JP characters are larger and JP sentences are longer
  const sizes = getLocale(window.location) === 'jp'
    ? [
      { name: 'long', threshold: 12 },
      { name: 'very-long', threshold: 18 },
      { name: 'x-long', threshold: 24 },
    ]
    : [
      { name: 'long', threshold: 30 },
      { name: 'very-long', threshold: 40 },
      { name: 'x-long', threshold: 50 },
    ];
  headings.forEach((h) => {
    const { length } = h.textContent;
    sizes.forEach((size) => {
      if (length >= size.threshold) h.classList.add(`columns-heading-${size.name}`);
    });
  });
}

export default function decorate($block) {
  const $rows = Array.from($block.children);

  let numCols = 0;
  if ($rows[0]) numCols = $rows[0].children.length;

  if (numCols) $block.classList.add(`width-${numCols}-columns`);

  let total = $rows.length;
  const isNumberedList = $block.classList.contains('numbered');
  if (isNumberedList && $block.classList.length > 4) {
    const i = parseInt($block.classList[3], 10);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(i)) {
      total = i;
    }
  }

  $rows.forEach(($row, rowNum) => {
    const $cells = Array.from($row.children);
    $cells.forEach(($cell, cellNum) => {
      if ($cell.querySelector('img.icon, svg.icon')) {
        decorateIconList($cell, rowNum);
      }

      if (cellNum === 0 && isNumberedList) {
        // add number to first cell
        let num = rowNum + 1;
        if (total > 9) {
          // stylize with total for 10 or more items
          num = `${num}/${total} —`;
          if (rowNum < 9) {
            // pad number with 0
            num = `0${num}`;
          }
        } else {
          // regular ordered list style for 1 to 9 items
          num = `${num}.`;
        }
        $cell.innerHTML = `<span class="num">${num}</span>${$cell.innerHTML}`;
      }

      const $pics = $cell.querySelectorAll(':scope picture');
      if ($pics.length === 1 && $pics[0].parentElement.tagName === 'P') {
        // unwrap single picture if wrapped in p tag, see https://github.com/adobe/helix-word2md/issues/662
        const $parentDiv = $pics[0].closest('div');
        const $parentParagraph = $pics[0].parentNode;
        $parentDiv.insertBefore($pics[0], $parentParagraph);
      }

      // legal copy
      $cell.querySelectorAll(':scope p').forEach(($p) => {
        if ($p.textContent.trim().startsWith('* ')) {
          $p.classList.add('legal-copy');
        }
      });

      // this probably needs to be tighter and possibly earlier
      const $a = $cell.querySelector('a');
      if ($a) {
        if (($a.href.includes('vimeo') || $a.href.includes('youtu') || $a.href.includes('/media_'))
          && $row.parentElement.classList.contains('highlight')) {
          transformToVideoColumn($cell, $a);

          $a.addEventListener('click', (e) => {
            e.preventDefault();
          });
        }
        if ($a.textContent.startsWith('https://')) {
          if ($a.href.endsWith('.mp4')) {
            transformLinkToAnimation($a);
          } else if ($pics[0]) {
            linkImage($cell);
          }
        }
      }
      if ($a && $a.classList.contains('button')) {
        if ($block.classList.contains('fullsize')) {
          $a.classList.add('xlarge');

          const $primaryCTA = $a;
          const $floatButton = $primaryCTA.parentElement.cloneNode(true);
          $floatButton.classList.add('fixed-button');
          document.body.classList.add('has-fixed-button');
          $cell.appendChild($floatButton);
          $primaryCTA.classList.add('primaryCTA');
          $floatButton.style.display = 'none';

          setTimeout(() => {
            $floatButton.classList.remove('shown');
            $floatButton.style.display = '';
          }, 1000);

          const hideButtonWhenInView = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.intersectionRatio > 0) {
                $floatButton.classList.remove('shown');
              } else if (document.body.classList.contains('has-fixed-button')) {
                $floatButton.classList.add('shown');
              }
            });
          }, { threshold: 0 });

          hideButtonWhenInView.observe($primaryCTA);
          const banner = document.querySelector('.banner-container');
          if (banner) {
            hideButtonWhenInView.observe(banner);
          }
        } else if ($a.classList.contains('light')) {
          $a.classList.replace('accent', 'primary');
        }
      }

      // handle history events
      window.addEventListener('popstate', ({ state }) => {
        hideVideoModal();
        const { url, title } = state;
        if (url) {
          displayVideoModal(url, title);
        }
      });

      $cell.querySelectorAll(':scope p:empty').forEach(($p) => $p.remove());

      $cell.classList.add('column');
      if ($cell.firstElementChild.tagName === 'PICTURE') {
        $cell.classList.add('column-picture');
      }

      const $pars = $cell.querySelectorAll('p');
      for (let i = 0; i < $pars.length; i += 1) {
        if ($pars[i].innerText.match(/Powered by/)) {
          $pars[i].classList.add('powered-by');
        }
      }
    });
  });
  addAnimationToggle($block);
  addHeaderSizing($block);
}
