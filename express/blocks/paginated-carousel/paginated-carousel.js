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
        p.classList.add('image-container');
      }
    });
  }
}

function decoratePagination(block) {
  const paginationContainer = createTag('div', { class: 'pagination-container' });
  const originalCItems = block.querySelectorAll('.paginated-carousel-item.original');
  if (originalCItems.length > 0) {
    originalCItems.forEach(())
  }
}

function initCarousel(block) {

}

export default function decorate(block) {
  const cItems = block.querySelectorAll(':scope > div');

  if (cItems.length > 0) {
    cItems.forEach((ci, i) => {
      ci.className = 'paginated-carousel-item original';
      ci.dataset.carouselIndex = i;
      decorateParagraphs(ci);
    });

    const cItemsPrev = Array.from(cItems).map((item, index) => {
      const clone = item.cloneNode(true);
      clone.className = 'paginated-carousel-item prev';
      ci.dataset.carouselIndex = i;
      decorateParagraphs(item);
      return clone;
    });

    const cItemsNext = Array.from(cItems).map((item) => {
      const clone = item.cloneNode(true);
      clone.className = 'paginated-carousel-item next';
      decorateParagraphs(item);
      return clone;
    });

    decoratePagination(block);
    initCarousel(block);
  }
}
