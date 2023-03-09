/*
 * Copyright 2023 Adobe. All rights reserved.
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
} from '../../scripts/scripts.js';

function buildPagination(wrapper) {
  const paginationContainer = createTag('div', { class: 'pagination-container' });
  const tray = wrapper.querySelector('.paginated-carousel-tray');
  const originalCItems = tray.querySelectorAll('.paginated-carousel-item.original');

  if (originalCItems.length > 0) {
    originalCItems.forEach((cItem) => {
      const dot = createTag('span', { class: 'pagination-dot' });
      dot.dataset.carouselIndex = cItem.dataset.carouselIndex;
      paginationContainer.append(dot);
    });
  }

  wrapper.append(paginationContainer);
}

function initCarousel(container, states) {
  const tray = container.querySelector('.paginated-carousel-tray');
  const paginationDots = tray.parentElement.querySelectorAll('.pagination-dot');
  const allCards = tray.querySelectorAll('.paginated-carousel-item');

  const onScroll = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        states.currentIndex = parseInt(entry.target.dataset.carouselIndex, 10);
        paginationDots.forEach((dot) => {
          if (dot !== paginationDots[states.currentIndex]) {
            dot.classList.remove('active');
          }
        });
        paginationDots[states.currentIndex].classList.add('active');
      }
    });
  };

  const options = {
    root: tray,
    rootMargin: '0px',
    threshold: 0.99,
  };

  const scrollObserver = new IntersectionObserver(onScroll, options);
  allCards.forEach((card) => scrollObserver.observe(card));

  if (states.infinite) {
    let touchStart = 0;
    let oldTouchPos = 0;
    tray.classList.remove('scroll-snap');

    tray.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      if (e.cancelable) {
        e.preventDefault();
      }
      if (states.readyToScroll) {
        tray.classList.remove('scroll-snap');
        oldTouchPos = Math.round(e.touches[0].clientX);
        touchStart = Math.round(e.touches[0].clientX);
      }
    });

    tray.addEventListener('touchmove', (e) => {
      if (states.readyToScroll) {
        const newTouchPos = Math.round(e.touches[0].clientX);
        tray.scrollBy({
          left: oldTouchPos - newTouchPos,
        });
        oldTouchPos = newTouchPos;
      }
    }, { passive: true });

    tray.addEventListener('touchend', (e) => {
      e.preventDefault();
      states.readyToScroll = false;
      const touchEnd = Math.round(e.changedTouches[0].clientX);
      const scrollDistance = Math.abs(touchStart - touchEnd);
      const cardScrolledAway = allCards[states.currentIndex];

      if (touchEnd > touchStart && states.reordering) {
        tray.scrollBy({
          left: -(cardScrolledAway.offsetWidth - scrollDistance),
          behavior: 'smooth',
        });

        let lastScrollPos = 0;
        const scrollEndWatcher = setInterval(() => {
          if (lastScrollPos === tray.scrollLeft) {
            // offset the shift caused by reordering cards
            tray.scrollBy({
              left: cardScrolledAway.offsetWidth,
            });
            tray.prepend(tray.querySelectorAll('.paginated-carousel-item')[allCards.length - 1]);
            // snap to align once just in case;
            tray.classList.add('scroll-snap');
            clearInterval(scrollEndWatcher);
          }
          lastScrollPos = tray.scrollLeft;
          states.readyToScroll = true;
        }, 25);
      } else if (touchEnd < touchStart) {
        tray.scrollBy({
          left: cardScrolledAway.offsetWidth - scrollDistance,
          behavior: 'smooth',
        });

        let lastScrollPos = 0;
        if (states.reordering) {
          const scrollEndWatcher = setInterval(() => {
            if (lastScrollPos === tray.scrollLeft) {
              // offset the shift caused by reordering cards
              tray.scrollBy({
                left: -cardScrolledAway.offsetWidth,
              });
              tray.append(tray.querySelectorAll('.paginated-carousel-item')[0]);
              // snap to align once just in case;
              tray.classList.add('scroll-snap');
              clearInterval(scrollEndWatcher);
            }
            lastScrollPos = tray.scrollLeft;
            states.readyToScroll = true;
          }, 25);
        }
        if (!states.reordering) states.reordering = true;
      } else {
        // click when it's a click instead of scroll
        let clickedCard;
        const index = states.currentIndex;
        if (e.changedTouches[0].clientX > allCards[states.currentIndex].offsetWidth) {
          clickedCard = index + 1 <= allCards.length - 1 ? allCards[index + 1] : allCards[0];
        } else {
          clickedCard = allCards[states.currentIndex];
        }
        const a = clickedCard.querySelector('a.clickable-layer');
        window.location.assign(a.href);
      }
    });
  }
}

function addClickableLayer(element) {
  const anchor = element.querySelector('a');
  if (anchor && anchor.href) {
    const clickableLayer = createTag('a', {
      class: 'clickable-layer',
      href: anchor.href,
    });
    element.append(clickableLayer);
  }
}

function resetPagination(wrapper, states) {
  const paginationDots = wrapper.querySelectorAll('.pagination-dot');
  if (paginationDots.length > 0) {
    states.currentIndex = 0;
    paginationDots.forEach((dot) => dot.classList.remove('active'));
    paginationDots[0].classList.add('active');
  }
}

export default function buildPaginatedCarousel(selector = ':scope > *', container, infinityScrollEnabled = false) {
  loadCSS('/express/blocks/shared/paginated-carousel.css');

  const states = {
    readyToScroll: true,
    reordering: false,
    currentIndex: 0,
    infinite: infinityScrollEnabled,
  };

  const cItems = selector ? container.querySelectorAll(selector) : container.children;

  if (cItems.length > 0) {
    const wrapper = createTag('div', { class: 'paginated-carousel-wrapper' });
    const tray = createTag('div', { class: 'paginated-carousel-tray scroll-snap' });

    container.className = 'paginated-carousel-container';
    container.innerHTML = '';
    wrapper.append(tray);
    container.append(wrapper);

    cItems.forEach((ci, i) => {
      const carouselItem = createTag('div', {
        class: 'paginated-carousel-item original',
        'data-carousel-index': i,
      });
      carouselItem.innerHTML = ci.innerHTML;
      addClickableLayer(carouselItem);
      tray.append(carouselItem);
    });

    if (infinityScrollEnabled) {
      for (const [key] of Object.entries(states)) {
        if (['cItemsPrev', 'cItemsNext'].includes(key)) {
          states[key] = Array.from(cItems).map((item, index) => {
            const carouselItem = createTag('div');
            carouselItem.innerHTML = item.innerHTML;
            carouselItem.className = key === 'cItemsPrev' ? 'paginated-carousel-item prev' : 'paginated-carousel-item next';
            carouselItem.dataset.carouselIndex = index.toString();
            addClickableLayer(carouselItem);
            return carouselItem;
          });
        }
      }
    }

    buildPagination(wrapper);
    initCarousel(container, states);
    setTimeout(() => {
      if (states.currentIndex !== 0) resetPagination(wrapper, states);
    }, 20);
  }
}
