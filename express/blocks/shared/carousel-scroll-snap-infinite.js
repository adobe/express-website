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
} from '../../scripts/scripts.js';

function getCarouselState($parent, classPrefix) {
  const platform = $parent.querySelector(`.${classPrefix}carousel-scroll-snap-infinite-platform`);
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

function infinityScroll($parent, classPrefix, $children) {
  let state = getCarouselState($parent, classPrefix);
  // Append twice to be able to simulate infinite scroll.
  const duplicateContent = () => {
    $children.forEach(($child) => {
      state.platform.append($child.cloneNode(true));
    });
  };
  const stopScrolling = () => {
    state.platform.style.overflowX = 'hidden';
    setTimeout(() => {
      state.platform.style.overflowX = 'scroll';
    }, 20);
  };
  for (let i = 0; i < 4; i += 1) {
    duplicateContent();
  }
  const moveToCenterIfScroll = (e) => {
    state = getCarouselState($parent, classPrefix);
    const scrollPos = state.platform.scrollLeft;
    const maxScroll = state.platform.scrollWidth;
    if (scrollPos > (maxScroll / 5) * 4) {
      e.preventDefault();
      stopScrolling();
      state.platform.scrollTo({
        left: ((maxScroll / 5) * 2),
        behavior: 'instant',
      });
    } else if (scrollPos < (maxScroll / 5) - state.blockWidth) {
      e.preventDefault();
      stopScrolling();
      state.platform.scrollTo({
        left: (((maxScroll / 5) * 3) - state.blockWidth),
        behavior: 'instant',
      });
    }
  };

  setTimeout(() => {
    state.platform.scrollTo({
      left: ((state.platform.scrollWidth / 5) * 2),
      behavior: 'smooth',
    });
  }, 1000);

  state.platform.addEventListener('scroll', (e) => {
    moveToCenterIfScroll(e);
  });
}

function toggleControls($parent, classPrefix, infinityScrollEnabled) {
  if (infinityScrollEnabled) return;
  const state = getCarouselState($parent, classPrefix);
  state.faderLeft.style.display = state.platform.scrollLeft > 20 ? 'block' : 'none';
  state.faderRight.style.display = (state.platform.offsetWidth + state.platform.scrollLeft >= state.platform.scrollWidth) ? 'none' : 'block';
}

function moveCarousel($parent, increment, classPrefix, infinityScrollEnabled) {
  const state = getCarouselState($parent, classPrefix);
  state.platform.scrollLeft -= increment;
  // update carousel controls
  toggleControls($parent, classPrefix, infinityScrollEnabled);
}

// eslint-disable-next-line import/prefer-default-export
export function buildCarousel(selector = ':scope > *', $parent, classPrefix) {
  const infinityScrollEnabled = true;
  const $carouselContent = selector ? $parent.querySelectorAll(selector) : $parent.children;
  const $container = createTag('div', { class: `${classPrefix}carousel-scroll-snap-infinite-container` });
  // add content to carousel
  const $platform = createTag('div', { class: `${classPrefix}carousel-scroll-snap-infinite-platform` });
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
  $arrowLeft.addEventListener('click', () => moveCarousel($parent, 240, classPrefix, infinityScrollEnabled));
  $arrowRight.addEventListener('click', () => moveCarousel($parent, -240, classPrefix, infinityScrollEnabled));
  $faderLeft.appendChild($arrowLeft);
  $faderRight.appendChild($arrowRight);

  if (infinityScrollEnabled) {
    // Infinite Scroll
    infinityScroll($parent, classPrefix, [...$carouselContent]);
    $faderLeft.style.display = 'block';
    $faderRight.style.display = 'block';
  } else {
    window.addEventListener('resize', () => toggleControls($parent, classPrefix, infinityScrollEnabled));
    $platform.addEventListener('scroll', () => toggleControls($parent, classPrefix, infinityScrollEnabled));
  }

  const media = [...$parent.querySelectorAll('img, video')];
  if (media.length) {
    // carousel with media, wait for media to load before toggling controls
    let mediaLoaded = 0;
    media.forEach(($media) => {
      $media.addEventListener('load', () => {
        mediaLoaded += 1;
        if (media.length === mediaLoaded) {
          toggleControls($parent, classPrefix, infinityScrollEnabled);
          if (infinityScrollEnabled) {
            const state = getCarouselState($parent, classPrefix);
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
    toggleControls($parent, classPrefix, infinityScrollEnabled);
  }

  // Wheel horizontal scroll event handler
  $platform.addEventListener('wheel', (e) => e.preventDefault());
  function handleWheel(e) {
    if (e.deltaY > 0) {
      moveCarousel($parent, -240, classPrefix, infinityScrollEnabled);
    } else {
      moveCarousel($parent, 240, classPrefix, infinityScrollEnabled);
    }
    $platform.removeEventListener('wheel', handleWheel);

    setTimeout(() => {
      $platform.addEventListener('wheel', handleWheel);
    }, 500);
  }
  $platform.addEventListener('wheel', handleWheel);
}
