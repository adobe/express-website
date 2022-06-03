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
  loadCSS,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

// eslint-disable-next-line import/prefer-default-export
export function buildCarousel(selector = ':scope > *', $parent, infinityScrollEnabled = false) {
  // Load CSS
  loadCSS('/express/blocks/shared/carousel.css');
  // Build the carousel HTML
  const $carouselContent = selector ? $parent.querySelectorAll(selector) : $parent.children;
  const $container = createTag('div', { class: 'carousel-container' });
  const $platform = createTag('div', { class: 'carousel-platform' });
  $platform.append(...$carouselContent);
  $container.appendChild($platform);
  $parent.appendChild($container);
  const $faderLeft = createTag('div', { class: 'carousel-fader-left' });
  const $faderRight = createTag('div', { class: 'carousel-fader-right' });
  $container.appendChild($faderLeft);
  $container.appendChild($faderRight);
  const $arrowLeft = createTag('a', { class: 'button carousel-arrow carousel-arrow-left' });
  const $arrowRight = createTag('a', { class: 'button carousel-arrow carousel-arrow-right' });
  $faderLeft.appendChild($arrowLeft);
  $faderRight.appendChild($arrowRight);

  // Hide controls if reaches the end of carousel, or if not using buttons to scroll.
  let hideControls = false;
  const toggleArrow = ($fader, shown = true) => {
    if (shown) {
      $fader.classList.remove('arrow-hidden');
    } else {
      $fader.classList.add('arrow-hidden');
    }
  };
  const toggleControls = () => {
    if (!infinityScrollEnabled) {
      const showLeft = ($platform.scrollLeft > 33);
      toggleArrow($faderLeft, showLeft);
      const showRight = !($platform.offsetWidth + $platform.scrollLeft >= $platform.scrollWidth);
      toggleArrow($faderRight, showRight);
    }
    if (hideControls) {
      $container.classList.add('controls-hidden');
    }
  };

  // Scroll the carousel by clicking on the controls
  const moveCarousel = (increment) => {
    $platform.scrollLeft -= increment;
    toggleControls();
  };
  $arrowLeft.addEventListener('click', () => {
    moveCarousel(240);
  });
  $arrowRight.addEventListener('click', () => {
    moveCarousel(-240);
  });
  window.addEventListener('resize', toggleControls);

  // Carousel loop functionality (if enabled)
  const infinityScroll = ($children) => {
    const duplicateContent = () => {
      $children.forEach(($child) => {
        $platform.append($child.cloneNode(true));
      });
    };
    // Duplicate children 5 times to simulate smooth scrolling
    for (let i = 0; i < 4; i += 1) {
      duplicateContent();
    }
    // Start at the center and snap back to center if the user scrolls to the edges
    const moveToCenterIfScrollToEdge = (e) => {
      const scrollPos = $platform.scrollLeft;
      const maxScroll = $platform.scrollWidth;
      if ((scrollPos > (maxScroll / 5) * 4) || scrollPos < 30) {
        if (e) e.preventDefault();
        $platform.scrollTo({
          left: ((maxScroll / 5) * 2),
          behavior: 'instant',
        });
      }
    };
    moveToCenterIfScrollToEdge();
    $platform.addEventListener('scroll', (e) => {
      moveToCenterIfScrollToEdge(e);
    }, { passive: false });
  };
  if (infinityScrollEnabled) infinityScroll([...$carouselContent]);
  const initialState = () => {
    if (infinityScrollEnabled) {
      $platform.scrollTo({
        left: (($platform.scrollWidth / 5) * 2),
        behavior: 'smooth',
      });
    }
    toggleControls();
  };

  // Carousel with media: wait for media to load before toggling controls and infinityScroll
  const media = [...$parent.querySelectorAll('img, video')];
  if (media.length) {
    let mediaLoaded = 0;
    media.forEach(($media) => {
      $media.addEventListener('load', () => {
        mediaLoaded += 1;
        if (media.length === mediaLoaded) {
          initialState();
          setTimeout(initialState, 2000);
        }
      });
    });
  } else {
    initialState();
    setTimeout(initialState, 2000);
  }

  // Hide controls if the user swipes through the carousel
  let isScrolling = false;
  let scrollTimer = -1;
  $platform.addEventListener('scroll', () => {
    toggleControls();
    if (scrollTimer !== -1) clearTimeout(scrollTimer);
    isScrolling = true;
    scrollTimer = window.setTimeout(() => {
      isScrolling = false;
    }, 400);
  }, { passive: true });

  let lastPos = null;
  $platform.addEventListener('touchstart', (e) => {
    lastPos = e;
  });
  $platform.addEventListener('touchmove', (e) => {
    if (lastPos && !e.target.classList.contains('carousel-arrow')) {
      const relativePosX = e.touches[0].pageX - lastPos.touches[0].pageX;
      if ((relativePosX > 30 || relativePosX < -30) && isScrolling) {
        hideControls = true;
      }
    }
  }, { passive: true });
  $platform.addEventListener('touched', () => {
    lastPos = null;
  });
}
