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
} from '../../scripts/scripts.js';

function decorateParagraphs(carouselItem) {
  const paragraphs = carouselItem.querySelectorAll(':scope > div > p');
  if (paragraphs.length > 0) {
    paragraphs.forEach((p) => {
      if (p.querySelectorAll(':scope > picture').length > 0) {
        const img = p.querySelector('img');
        img.removeAttribute('loading');
        p.classList.add('image-container');
      }

      if (p.classList.contains('button-container')) {
        const anchor = p.querySelector('a');
        if (anchor) {
          const content = createTag('p', { class: 'content' });
          content.textContent = anchor.textContent.trim();
          anchor.innerText = '';
          carouselItem.append(content);
        }
      }
    });
  }
}

function decoratePagination(block, payload) {
  const paginationContainer = createTag('div', { class: 'pagination-container' });
  const originalCItems = block.querySelectorAll('.paginated-carousel-item.original');
  if (originalCItems.length > 0) {
    originalCItems.forEach((cItem) => {
      const dot = createTag('span', { class: 'pagination-dot' });
      dot.dataset.carouselIndex = cItem.dataset.carouselIndex;
      paginationContainer.append(dot);

      dot.addEventListener('click', () => {
        const offset = payload.backwardInfinite ? originalCItems.length * cItem.offsetWidth : 0;
        block.scrollTo({
          left: offset + (cItem.offsetWidth * dot.dataset.carouselIndex),
          behavior: 'smooth',
        });
      });
    });
  }

  block.insertAdjacentElement('afterend', paginationContainer);
}

function stopScrolling(block) { // To prevent safari shakiness
  block.style.overflowX = 'hidden';
  setTimeout(() => {
    block.style.removeProperty('overflow-x');
  }, 20);
}

function initCarousel(block, payload) {
  const originalCards = block.querySelectorAll('.paginated-carousel-item.original');
  const paginationDots = block.parentElement.querySelectorAll('.pagination-dot');

  const onScroll = (entries) => {
    entries.forEach((entry) => {
      const card = entry.target;
      payload.currentIndex = entry.target.dataset.carouselIndex;

      if (entry.isIntersecting) {
        paginationDots.forEach((dot) => {
          if (dot !== paginationDots[payload.currentIndex]) {
            dot.classList.remove('active');
          }
        });
        paginationDots[payload.currentIndex].classList.add('active');

        if (card.classList.contains('prev') && payload.currentIndex === (originalCards.length - 1).toString()) {
          stopScrolling(block);
          block.scrollBy({ left: originalCards.length * card.offsetWidth });
        }

        if (card.classList.contains('next') && payload.currentIndex === (originalCards.length - 1).toString()) {
          stopScrolling(block);
          block.scrollBy({ left: -(originalCards.length * card.offsetWidth) });
        }
      } else {
        if (card.classList.contains('next') && payload.currentIndex !== (originalCards.length - 1).toString()) {
          stopScrolling(block);
          block.scrollBy({ left: -(originalCards.length * card.offsetWidth) });
        }

        if (card.classList.contains('prev') && payload.currentIndex !== (originalCards.length - 1).toString()) {
          stopScrolling(block);
          block.scrollBy({ left: originalCards.length * card.offsetWidth });
        }
      }
    });
  };

  const options = {
    root: block,
    rootMargin: '0px',
    threshold: 1.00,
  };

  const scrollObserver = new IntersectionObserver(onScroll, options);

  payload.cItemsNext.forEach((card) => {
    block.append(card);
  });

  payload.cItemsPrev.reverse().forEach((card) => {
    block.prepend(card);
  });

  const allCards = block.querySelectorAll('.paginated-carousel-item');
  allCards.forEach((card) => {
    scrollObserver.observe(card);
    if (card.classList.contains('original') && card.dataset.carouselIndex === '0') {
      block.scrollBy({ left: originalCards.length * card.offsetWidth });
    }
  });

  block.addEventListener('scroll', (e) => {
    if (!payload.backwardInfinite) {
      const prevCards = block.querySelectorAll('.paginated-carousel-item.prev');
      prevCards.forEach((pCard) => {
        pCard.classList.remove('hidden');
      });
      payload.backwardInfinite = true;
    }
  });
}

export default function decorate(block) {
  const payload = {
    cItemsPrev: [],
    cItemsNext: [],
    backwardInfinite: false,
    currentIndex: 0,
  };

  const cItems = block.querySelectorAll(':scope > div');

  if (cItems.length > 0) {
    cItems.forEach((ci, i) => {
      ci.className = 'paginated-carousel-item original';
      ci.dataset.carouselIndex = i;
      decorateParagraphs(ci);
    });

    for (const [key] of Object.entries(payload)) {
      if (['cItemsPrev', 'cItemsNext'].includes(key)) {
        payload[key] = Array.from(cItems).map((item, index) => {
          const clone = item.cloneNode(true);
          clone.className = key === 'cItemsPrev' ? 'paginated-carousel-item prev hidden' : 'paginated-carousel-item next';
          clone.dataset.carouselIndex = index.toString();
          decorateParagraphs(item);
          return clone;
        });
      }
    }

    decoratePagination(block, payload);
    initCarousel(block, payload);
  }
}
