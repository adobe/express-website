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
/* eslint-disable import/named, import/extensions */

import {
  createTag,
} from '../../scripts/scripts.js';

import {
  buildCarousel,
} from '../shared/carousel.js';

export function decorateHeading($block, payload) {
  const $headingSection = createTag('div', { class: 'category-list-heading-section' });
  const $heading = createTag('h3', { class: 'category-list-heading' });
  const $viewAllButtonWrapper = createTag('p', { class: 'category-list-link-wrapper' });
  const $viewAllButton = createTag('a', { class: 'category-list-link', href: payload.viewAllLink });

  $heading.textContent = payload.heading;
  $viewAllButton.textContent = 'View all';
  $viewAllButtonWrapper.append($viewAllButton);
  $headingSection.append($heading, $viewAllButtonWrapper);
  $block.append($headingSection);
}

export function decorateCategories($block, payload) {
  const $categoriesWrapper = createTag('div', { class: 'category-list-categories-wrapper' });

  payload.categories.forEach((category) => {
    const $category = createTag('div', { class: 'category-list-category' });
    const $categoryImageWrapper = createTag('div', { class: 'category-list-category-image-wrapper' });
    const $categoryImageShadow = createTag('div', { class: 'category-list-category-image-shadow' });
    const $categoryImage = category.$image;
    const $categoryTitle = createTag('h4', { class: 'category-list-category-title' });
    const $categoryAnchor = createTag('a', { class: 'category-list-category-anchor' });

    $categoryTitle.textContent = category.text;
    $categoryAnchor.href = category.link;
    $categoryImageWrapper.append($categoryImageShadow, $categoryImage);
    $category.append($categoryAnchor, $categoryImageWrapper, $categoryTitle);
    $categoriesWrapper.append($category);
  });

  $block.append($categoriesWrapper);
}

export default async function decorate($block) {
  const $rows = Array.from($block.children);
  const $headingDiv = $rows.shift();

  const payload = {
    heading: $headingDiv.querySelector('h4').textContent,
    viewAllLink: $headingDiv.querySelector('a.button').href,
    categories: [],
  };

  $rows.forEach(($row) => {
    payload.categories.push({
      $image: $row.querySelector('picture'),
      text: $row.querySelector('a.button').textContent,
      link: $row.querySelector('a.button').href,
    });
  });

  $block.innerHTML = '';

  decorateHeading($block, payload);
  decorateCategories($block, payload);
  // decorateCategoryList($block);
  buildCarousel('.category-list-category', $block, false);
}
