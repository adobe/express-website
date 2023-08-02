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

// Wait for all media to load
function waitForMediaToLoad($parent) {
  const media = [...$parent.querySelectorAll('img, video')];
  return new Promise((resolve) => {
    if (!media.length) resolve();
    let mediaLoaded = 0;
    const mediaLoadedIncrement = () => {
      mediaLoaded += 1;
      if (media.length === mediaLoaded) {
        resolve();
      }
    };
    media.forEach(($media) => {
      if ($media.tagName.toUpperCase() === 'VIDEO' && $media.readyState < 3) {
        $media.addEventListener('loadeddata', mediaLoadedIncrement, false);
      } else if ($media.tagName.toUpperCase() === 'IMG' && !($media.complete && $media.naturalHeight !== 0)) {
        $media.addEventListener('load', mediaLoadedIncrement);
      } else {
        // this media has already loaded
        mediaLoadedIncrement();
      }
    });
  });
}

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
    if ($platform.classList.contains('infinity-scroll-loaded')) {
      $faderRight.classList.remove('arrow-hidden');
      $faderLeft.classList.remove('arrow-hidden');
    } else {
      const platformScrollLeft = $platform.scrollLeft;
      const left = (platformScrollLeft > 33);
      toggleArrow($faderLeft, left);
      const right = !($platform.offsetWidth + platformScrollLeft >= ($platform.scrollWidth - 31));
      toggleArrow($faderRight, right);
    }
    if (hideControls) {
      $container.classList.add('controls-hidden');
    }
  };
  let x = 0;
  const refreshArrows = setInterval(() => {
    toggleControls();
    x += 1;
    if (x > 15) clearInterval(refreshArrows);
  }, 200);

  $parent.closest('.block')?.addEventListener('carouselloaded', () => {
    toggleControls();
  }, { passive: true });

  // Scroll the carousel by clicking on the controls
  const moveCarousel = (increment) => {
    $platform.scrollLeft -= increment;
    toggleControls();
  };
  $faderLeft.addEventListener('click', () => {
    const increment = Math.max(($platform.offsetWidth / 4) * 3, 300);
    moveCarousel(increment);
  });
  $faderRight.addEventListener('click', () => {
    const increment = Math.max(($platform.offsetWidth / 4) * 3, 300);
    moveCarousel(-increment);
  });
  window.addEventListener('resize', toggleControls);

  // Carousel loop functionality (if enabled)
  const stopScrolling = () => { // To prevent safari shakiness
    $platform.style.overflowX = 'hidden';
    setTimeout(() => {
      $platform.style.removeProperty('overflow-x');
    }, 20);
  };
  const moveToCenterIfNearTheEdge = (e = null) => {
    // Start at the center and snap back to center if the user scrolls to the edges
    const scrollPos = $platform.scrollLeft;
    const maxScroll = $platform.scrollWidth;
    if ((scrollPos > (maxScroll / 5) * 4) || scrollPos < 30) {
      if (e) e.preventDefault();
      stopScrolling();
      $platform.scrollTo({
        left: ((maxScroll / 5) * 2),
        behavior: 'instant',
      });
    }
  };

  const infinityScroll = ($children) => {
    const duplicateContent = () => {
      [...$children].forEach(($child) => {
        const $duplicate = $child.cloneNode(true);
        const $duplicateLinks = $duplicate.querySelectorAll('a');
        $platform.append($duplicate);

        if ($duplicate.tagName.toLowerCase() === 'a') {
          const linksPopulated = new CustomEvent('linkspopulated', { detail: [$duplicate] });
          document.dispatchEvent(linksPopulated);
        }

        if ($duplicateLinks) {
          const linksPopulated = new CustomEvent('linkspopulated', { detail: $duplicateLinks });
          document.dispatchEvent(linksPopulated);
        }
      });
    };
    // Duplicate children to simulate smooth scrolling
    for (let i = 0; i < 4; i += 1) {
      duplicateContent();
    }
    $platform.addEventListener('scroll', (e) => {
      moveToCenterIfNearTheEdge(e);
    }, { passive: false });

    waitForMediaToLoad($platform).then(() => {
      moveToCenterIfNearTheEdge();
      $platform.classList.add('infinity-scroll-loaded');
      toggleControls();
    });
  };

  const initialState = () => {
    if (infinityScrollEnabled) {
      infinityScroll([...$carouselContent]);
    }
    toggleControls();
  };

  waitForMediaToLoad($platform).then(() => {
    initialState();
  });

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
  }, { passive: true });
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
  }, { passive: true });
}
