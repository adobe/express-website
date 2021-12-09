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
  createTag,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js?ccx';

function getCarouselState($parent, classPrefix) {
  const platform = $parent.querySelector(`.${classPrefix}carousel-platform`);
  const blockStyle = window.getComputedStyle($parent);
  const platformStyle = window.getComputedStyle(platform);
  const blockWidth = parseInt(blockStyle.getPropertyValue('width'), 10);
  const platformWidth = parseInt(platformStyle.getPropertyValue('width'), 10);
  const platformLeft = parseInt(platformStyle.getPropertyValue('left'), 10) || 0;
  return {
    platform,
    platformLeft,
    blockWidth,
    platformWidth,
    platformOffset: platformWidth - blockWidth - Math.abs(platformLeft),
    faderLeft: $parent.querySelector(`.${classPrefix}carousel-fader-left`),
    faderRight: $parent.querySelector(`.${classPrefix}carousel-fader-right`),
  };
}

function toggleControls($parent, newLeft = 0, classPrefix) {
  const state = getCarouselState($parent, classPrefix);
  state.faderLeft.style.display = newLeft < 0 ? 'block' : 'none';
  state.faderRight.style.display = state.blockWidth < state.platformWidth - Math.abs(newLeft) ? 'block' : 'none';
}

function moveCarousel($parent, increment, classPrefix) {
  const state = getCarouselState($parent, classPrefix);
  let newLeft = state.platformLeft;
  if (increment < 0
      && state.platformWidth > state.blockWidth
      && state.platformOffset - Math.abs(increment) <= 0) {
    // near right end
    // eslint-disable-next-line no-param-reassign
    newLeft += -(state.platformOffset);
  } else if (increment > 0 && Math.abs(state.platformLeft) < increment) {
    // near left end
    // eslint-disable-next-line no-param-reassign
    newLeft += Math.abs(state.platformLeft);
  } else {
    newLeft += increment;
  }
  state.platform.style.left = `${newLeft}px`;
  // update carousel controls
  toggleControls($parent, newLeft, classPrefix);
}

// eslint-disable-next-line import/prefer-default-export
export function buildCarousel(selector = ':scope > *', $parent, classPrefix) {
  const $carouselContent = selector ? $parent.querySelectorAll(selector) : $parent.children;
  const $container = createTag('div', { class: `${classPrefix}carousel-container` });
  // add content to carousel
  const $platform = createTag('div', { class: `${classPrefix}carousel-platform` });
  $platform.append(...$carouselContent);
  $container.appendChild($platform);
  $parent.appendChild($container);
  // faders
  const $faderLeft = createTag('div', { class: `${classPrefix}carousel-fader-left` });
  // $faderLeft.style.display = 'none';
  const $faderRight = createTag('div', { class: `${classPrefix}carousel-fader-right` });
  $container.appendChild($faderLeft);
  $container.appendChild($faderRight);
  // controls
  const $arrowLeft = createTag('a', { class: `button ${classPrefix}carousel-arrow ${classPrefix}carousel-arrow-left` });
  const $arrowRight = createTag('a', { class: `button ${classPrefix}carousel-arrow ${classPrefix}carousel-arrow-right` });
  $arrowLeft.addEventListener('click', () => moveCarousel($parent, 240, classPrefix));
  $arrowRight.addEventListener('click', () => moveCarousel($parent, -240, classPrefix));
  $faderLeft.appendChild($arrowLeft);
  $faderRight.appendChild($arrowRight);
  const media = [...$parent.querySelectorAll('img, video')];
  if (media.length) {
    // carousel with media, wait for media to load before toggling controls
    let mediaLoaded = 0;
    media.forEach(($media) => {
      $media.addEventListener('load', () => {
        mediaLoaded += 1;
        if (media.length === mediaLoaded) {
          toggleControls($parent, 0, classPrefix);
        }
      });
    });
  } else {
    // carousel without media, toggle controls right away
    toggleControls($parent, 0, classPrefix);
  }
  window.addEventListener('resize', () => toggleControls($parent, 0, classPrefix));
}
