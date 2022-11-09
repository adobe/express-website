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
  getIconElement,
  addFreePlanWidget,
  addHeaderSizing,
  createOptimizedPicture,
} from '../../scripts/scripts.js';

import {
  displayVideoModal,
  hideVideoModal,
  isVideoLink,
} from '../shared/video.js';

import {
  createFloatingButton,
} from '../floating-button/floating-button.js';

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

function decorateIconList($columnCell, rowNum, blockClasses) {
  const icons = [...$columnCell.querySelectorAll('img.icon, svg.icon')]
    .filter(($icon) => !$icon.closest('p').classList.contains('social-links'));
  // decorate offer icons
  if (rowNum === 0 && blockClasses.contains('offer')) {
    const $titleIcon = $columnCell.querySelector('img.icon, svg.icon');
    const $title = $columnCell.querySelector('h1, h2, h3, h4, h5, h6');
    if ($title && $titleIcon) {
      const $titleIconWrapper = createTag('span', { class: 'columns-offer-icon' });
      $titleIconWrapper.append($titleIcon);
      $title.prepend($titleIconWrapper);
    }
    return;
  }

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

function styleBackgroundWithScroll($section) {
  const $background = createTag('div', { class: 'marquee-background' });

  $section.prepend($background);

  const calculate = () => {
    const viewport = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight,
    };

    const elementBoundingRect = $section.getBoundingClientRect();
    const elementPos = {
      top: elementBoundingRect.y + window.scrollY,
      bottom: elementBoundingRect.y + elementBoundingRect.height + window.scrollY,
    };

    if (viewport.top > elementPos.bottom || viewport.bottom < elementPos.top) {
      return 0;
    }

    // Element is fully within viewport
    if (viewport.top < elementPos.top && viewport.bottom > elementPos.bottom) {
      return 100;
    }

    // Element is bigger than the viewport
    if (elementPos.top < viewport.top && elementPos.bottom > viewport.bottom) {
      return 100;
    }

    const elementHeight = elementBoundingRect.height;
    let elementHeightInView = elementHeight;

    if (elementPos.top < viewport.top) {
      elementHeightInView = elementHeight - (window.scrollY - elementPos.top);
    }

    if (elementPos.bottom > viewport.bottom) {
      return 100;
    }

    return (elementHeightInView / window.innerHeight) * 100;
  };

  window.addEventListener('scroll', () => {
    const percentageInView = calculate();
    $background.style.opacity = `${110 - percentageInView}%`;
  }, { passive: true });
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
        decorateIconList($cell, rowNum, $block.classList);
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

      // this probably needs to be tighter and possibly earlier
      const $a = $cell.querySelector('a');
      if ($a) {
        if (isVideoLink($a.href) && $row.parentElement.classList.contains('highlight')) {
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
          $a.classList.add('primaryCTA');
          createFloatingButton($a, $block.closest('.section').dataset.audience);
        } else if ($a.classList.contains('light')) {
          $a.classList.replace('accent', 'primary');
        }

        if ($block.classList.contains('fullscreen')) {
          const $flowers = [
            'https://main--express-website--adobe.hlx.page/media_1cb8136ac752c1bb70c81e4c6e4f6745c36735d1a.png#width=500&height=437',
            'https://main--express-website--adobe.hlx.page/media_107e6a2960331b70143bbc3321d6b92ef7f49e9c7.png#width=500&height=498',
            'https://main--express-website--adobe.hlx.page/media_1544ba4009bb401c6a51a9a1b5e52ec47ba686cab.png#width=500&height=556',
            'https://main--express-website--adobe.hlx.page/media_1c0098a95dac73540743f7b31fbd1ac7853835261.png#width=500&height=544',
            'https://main--express-website--adobe.hlx.page/media_1d8381305371e958459da1ab5b9df1f2e5c086dc6.png#width=500&height=514',
            'https://main--express-website--adobe.hlx.page/media_129a7f284a56bd157c4fbec64ab3cdd032725cd82.png#width=500&height=378',
          ].map((url) => createOptimizedPicture(url));
          const $h1 = $block.querySelector('h1');
          const $picture = $block.querySelector('picture');
          const $section = $block.closest('.columns-fullscreen-center-container');

          if ($h1) {
            const $textToColor = $h1.querySelectorAll('em');

            if ($textToColor.length > 0) {
              $textToColor.forEach((span) => {
                const $coloredText = createTag('span', { class: 'colorful' });
                $coloredText.textContent = span.textContent;
                $h1.replaceChild($coloredText, span);
              });
            }
          }

          styleBackgroundWithScroll($section);

          if ($picture) {
            const $cloneCta = $a.cloneNode({ deep: true });
            const $columnWrapper = $picture.parentElement;
            const $pictureFrameWrapper = createTag('div', { class: 'picture-frame-wrapper' });
            const $flowersBoard = createTag('div', { class: 'flowers' });
            const $pictureFrameBackground = createTag('div', { class: 'picture-frame-background' });
            const $pictureFrame = createTag('div', { class: 'picture-frame' });
            const $thumbnails = createTag('div', { class: 'picture-frame-thumbnails' });
            const $clickableOverlay = createTag('a', { class: 'picture-frame-clickable-layer', href: $a.href });
            const $thumbnailImg = createOptimizedPicture('https://www.adobe.com/express/media_1662d0e0741d0c9b7b2573bb197f95cdd35465f54.png#width=500&height=1026');

            $picture.classList.add('screen-demo');
            $thumbnailImg.classList.add('leaf-thumbnails');
            $cloneCta.style.display = 'none';
            $thumbnails.append($thumbnailImg);
            $clickableOverlay.append($cloneCta);
            $pictureFrameWrapper.append(
              $clickableOverlay,
              $pictureFrameBackground,
              $flowersBoard,
              $pictureFrame,
              $picture,
              $thumbnails,
            );

            $flowers.forEach(($flower, index) => {
              $flowersBoard.append($flower);
              $flower.className = `flower flower-${index}`;
            });

            $block.append($pictureFrameWrapper);

            $columnWrapper.remove();

            $clickableOverlay.addEventListener('mouseenter', () => {
              $a.style.display = 'none';
              $cloneCta.style.display = 'block';
            }, { passive: true });

            $clickableOverlay.addEventListener('mouseleave', () => {
              $a.style.removeProperty('display');
              $cloneCta.style.display = 'none';
            }, { passive: true });

            window.addEventListener('mousemove', (e) => {
              const rotateX = ((e.clientX * 10) / (window.innerWidth / 2) - 10);
              const rotateY = -((e.clientY * 10) / (window.innerHeight / 2) - 10);

              $pictureFrame.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 0px)`;
              $flowersBoard.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${0 - rotateX}px, 0px, -100px)`;
              $pictureFrameBackground.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, -50px)`;
              $thumbnails.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, ${((rotateX + 10) + ((rotateX + 10) * 2))}px)`;
              $picture.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 50px)`;
            }, { passive: true });
          }
        }
      }

      // handle history events
      window.addEventListener('popstate', ({ state }) => {
        hideVideoModal();
        const { url, title } = state || {};
        if (url) {
          displayVideoModal(url, title);
        }
      });

      $cell.querySelectorAll(':scope p:empty').forEach(($p) => $p.remove());

      $cell.classList.add('column');
      if ($cell.firstElementChild && $cell.firstElementChild.tagName === 'PICTURE') {
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
  addHeaderSizing($block, 'columns-heading');

  // decorate offer
  if ($block.classList.contains('offer')) {
    $block.querySelectorAll('a.button').forEach(($a) => $a.classList.add('large', 'wide'));
    if ($rows.length > 1) {
      // move all content into first row
      $rows.forEach(($row, rowNum) => {
        if (rowNum > 0) {
          const $cells = Array.from($row.children);
          $cells.forEach(($cell, cellNum) => {
            $rows[0].children[cellNum].append(...$cell.children);
          });
          $row.remove();
        }
      });
    }
  }

  // add free plan widget to first columns block on every page
  if (document.querySelector('main .columns') === $block
    && document.querySelector('main .block') === $block) {
    addFreePlanWidget($block.querySelector('.button-container')
      || $block.querySelector(':scope .column:not(.hero-animation-overlay,.columns-picture)'));
  }

  // invert buttons in regular columns inside columns-highlight-container
  if ($block.closest('.section.columns-highlight-container') && !$block.classList.contains('highlight')) {
    $block.querySelectorAll('a.button').forEach(($button) => {
      $button.classList.add('dark');
    });
  }
}
