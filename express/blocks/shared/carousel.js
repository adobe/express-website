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
  createTag, loadCSS,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

function getCarouselState($parent) {
  const platform = $parent.querySelector('.carousel-platform');
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
    faderLeft: $parent.querySelector('.carousel-fader-left'),
    faderRight: $parent.querySelector('.carousel-fader-right'),
  };
}

function infinityScroll($parent, $children) {
  let state = getCarouselState($parent);
  const stopScrolling = () => { // To prevent mobile shakiness
    state.platform.style.overflowX = 'hidden';
    setTimeout(() => {
      state.platform.style.overflowX = 'scroll';
    }, 20);
  };
  const duplicateContent = () => {
    $children.forEach(($child) => {
      state.platform.append($child.cloneNode(true));
    });
  };
  for (let i = 0; i < 4; i += 1) {
    duplicateContent();
  }
  const moveToCenterIfScroll = (e) => {
    state = getCarouselState($parent);
    const scrollPos = state.platform.scrollLeft;
    const maxScroll = state.platform.scrollWidth;
    if ((scrollPos > (maxScroll / 5) * 4) || scrollPos < 30) {
      if (e) e.preventDefault();
      stopScrolling();
      state.platform.scrollTo({
        left: ((maxScroll / 5) * 2),
        behavior: 'instant',
      });
    }
  };
  moveToCenterIfScroll();
  state.platform.addEventListener('scroll', (e) => {
    moveToCenterIfScroll(e);
  });
}

function toggleControls($parent, infinityScrollEnabled) {
  if (infinityScrollEnabled) return;
  const state = getCarouselState($parent);
  state.faderLeft.style.display = state.platform.scrollLeft > 20 ? 'flex' : 'none';
  state.faderRight.style.display = (state.platform.offsetWidth + state.platform.scrollLeft >= state.platform.scrollWidth) ? 'none' : 'flex';
}

function moveCarousel($parent, increment, infinityScrollEnabled) {
  const state = getCarouselState($parent);
  state.platform.scrollLeft -= increment;
  // update carousel controls
  toggleControls($parent, infinityScrollEnabled);
}

// eslint-disable-next-line import/prefer-default-export
export function buildCarousel(selector = ':scope > *', $parent, infinityScrollEnabled = false) {
  loadCSS('/express/blocks/shared/carousel.css');
  const $carouselContent = selector ? $parent.querySelectorAll(selector) : $parent.children;
  const $container = createTag('div', { class: 'carousel-container' });
  // add content to carousel
  const $platform = createTag('div', { class: 'carousel-platform' });
  $platform.append(...$carouselContent);
  $container.appendChild($platform);
  $parent.appendChild($container);
  // faders
  const $faderLeft = createTag('div', { class: 'carousel-fader-left' });
  // $faderLeft.style.display = 'none';
  const $faderRight = createTag('div', { class: 'carousel-fader-right' });
  $container.appendChild($faderLeft);
  $container.appendChild($faderRight);
  // controls
  const $arrowLeft = createTag('a', { class: 'button carousel-arrow carousel-arrow-left' });
  const $arrowRight = createTag('a', { class: 'button carousel-arrow carousel-arrow-right' });
  $arrowLeft.addEventListener('click', () => moveCarousel($parent, 240, infinityScrollEnabled));
  $arrowRight.addEventListener('click', () => moveCarousel($parent, -240, infinityScrollEnabled));
  $faderLeft.appendChild($arrowLeft);
  $faderRight.appendChild($arrowRight);
  if (infinityScrollEnabled) {
    // Infinite Scroll
    infinityScroll($parent, [...$carouselContent]);
    $faderLeft.style.display = 'flex';
    $faderRight.style.display = 'flex';
  } else {
    window.addEventListener('resize', () => toggleControls($parent, infinityScrollEnabled));
    $platform.addEventListener('scroll', () => toggleControls($parent, infinityScrollEnabled));
  }
  const media = [...$parent.querySelectorAll('img, video')];
  if (media.length) {
    // carousel with media, wait for media to load before toggling controls
    let mediaLoaded = 0;
    media.forEach(($media) => {
      $media.addEventListener('load', () => {
        mediaLoaded += 1;
        if (media.length === mediaLoaded) {
          toggleControls($parent, infinityScrollEnabled);
          if (infinityScrollEnabled) {
            const state = getCarouselState($parent);
            state.platform.scrollTo({
              left: ((state.platform.scrollWidth / 5) * 2),
              behavior: 'smooth',
            });
          }
        }
      });
    });
  } else {
    // carousel without media, toggle controls right away
    toggleControls($parent, infinityScrollEnabled);
  }
  // Wheel horizontal scroll event handler
  $platform.addEventListener('wheel', (e) => e.preventDefault());
  function handleWheel(e) {
    if (e.deltaY > 0) {
      moveCarousel($parent, -240, infinityScrollEnabled);
    } else {
      moveCarousel($parent, 240, infinityScrollEnabled);
    }
    $platform.removeEventListener('wheel', handleWheel);
    setTimeout(() => {
      $platform.addEventListener('wheel', handleWheel);
    }, 300);
  }
  $platform.addEventListener('wheel', handleWheel);
}
