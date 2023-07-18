/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable import/named, import/extensions */

import { createTag } from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

export function decorateHeading(block, payload) {
  const headingSection = createTag('div', { class: 'browse-by-category-heading-section' });
  const heading = createTag('h3', { class: 'browse-by-category-heading' });
  const viewAllButtonWrapper = createTag('p', { class: 'browse-by-category-link-wrapper' });

  if (payload.viewAllLink.href !== '') {
    const viewAllButton = createTag('a', { class: 'browse-by-category-link', href: payload.viewAllLink.href });
    viewAllButton.textContent = payload.viewAllLink.text;
    viewAllButtonWrapper.append(viewAllButton);
  }

  heading.textContent = payload.heading;
  headingSection.append(heading, viewAllButtonWrapper);
  block.append(headingSection);
}

export function decorateCategories(block, payload) {
  const categoriesWrapper = createTag('div', { class: 'browse-by-category-categories-wrapper' });

  payload.categories.forEach((categoryCard) => {
    const category = createTag('div', { class: 'browse-by-category-card' });
    const categoryImageWrapper = createTag('div', { class: 'browse-by-category-image-wrapper' });
    const categoryImageShadowWrapper = createTag('div', { class: 'browse-by-category-image-shadow-wrapper' });
    const categoryImageShadow = createTag('div', { class: 'browse-by-category-image-shadow' });
    const categoryImage = categoryCard.image;
    const categoryTitle = createTag('h4', { class: 'browse-by-category-card-title' });
    const categoryAnchor = createTag('a', { class: 'browse-by-category-card-link' });

    categoryTitle.textContent = categoryCard.text;
    categoryAnchor.href = categoryCard.link;
    categoryImageShadowWrapper.append(categoryImageShadow, categoryImage);
    categoryImageWrapper.append(categoryImageShadowWrapper);
    category.append(categoryAnchor, categoryImageWrapper, categoryTitle);
    categoriesWrapper.append(category);
  });

  block.append(categoriesWrapper);
}

export default async function decorate(block) {
  const rows = Array.from(block.children);
  const headingDiv = rows.shift();

  const payload = {
    heading: headingDiv.querySelector('h4') ? headingDiv.querySelector('h4').textContent.trim() : '',
    viewAllLink: {
      text: headingDiv.querySelector('a.button') ? headingDiv.querySelector('a.button').textContent.trim() : '',
      href: headingDiv.querySelector('a.button') ? headingDiv.querySelector('a.button').href : '',
    },
    categories: [],
  };

  rows.forEach((row) => {
    payload.categories.push({
      image: row.querySelector('picture'),
      text: row.querySelector('a.button') ? row.querySelector('a.button').textContent.trim() : 'missing category text',
      link: row.querySelector('a.button') ? row.querySelector('a.button').href : 'missing category link',
    });
  });

  block.innerHTML = '';

  decorateHeading(block, payload);
  decorateCategories(block, payload);
  buildCarousel('.browse-by-category-card', block, false);

  if (block.classList.contains('fullwidth')) {
    const blockWrapper = block.parentNode;

    if (blockWrapper && blockWrapper.classList.contains('browse-by-category-wrapper')) {
      blockWrapper.classList.add('fullwidth');
    }
  }
}
