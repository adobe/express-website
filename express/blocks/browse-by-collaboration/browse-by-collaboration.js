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

import {
  createTag,
} from '../../scripts/scripts.js';

import {
  buildCarousel,
} from '../shared/carousel.js';

export function decorateHeading($block, payload) {
  const $headingSection = createTag('div', { class: 'browse-by-collaboration-heading-section' });
  const $heading = createTag('h3', { class: 'browse-by-collaboration-heading' });

  $heading.textContent = payload.heading;
  $headingSection.append($heading);
  $block.append($headingSection);
}

export function decorateCollaborations($block, payload) {
  const $categoriesWrapper = createTag('div', { class: 'browse-by-collaborations-wrapper' });

  payload.categories.forEach((collaboration) => {
    const $collaboration = createTag('a', { class: 'browse-by-collaboration-card', href: collaboration.link });
    const $collaborationImageWrapper = createTag('div', { class: 'browse-by-collaboration-image-wrapper' });
    const $collaborationImage = collaboration.$image;
    const $collaborationTitle = createTag('h4', { class: 'browse-by-collaboration-title' });
    const $buttonWrapper = createTag('div', { class: 'button-container' });
    const $button = createTag('a', {
      href: collaboration.link,
      title: collaboration.linkText,
      class: 'button accent',
    });

    $button.textContent = collaboration.linkText;
    $collaborationTitle.textContent = collaboration.text;
    $collaborationImageWrapper.append($collaborationImage);
    $buttonWrapper.append($button);
    $collaboration.append($collaborationImageWrapper, $collaborationTitle, $buttonWrapper);
    $categoriesWrapper.append($collaboration);
  });

  $block.append($categoriesWrapper);
}

export default async function decorate($block) {
  const $rows = Array.from($block.children);
  const $headingDiv = $rows.shift();

  const payload = {
    heading: $headingDiv.querySelector('h4').textContent,
    categories: [],
  };

  $rows.forEach(($row) => {
    payload.categories.push({
      $image: $row.querySelector('picture'),
      text: $row.querySelectorAll('div')[1].textContent,
      link: $row.querySelector('a.button').href,
      linkText: $row.querySelector('a.button').textContent,
    });
  });

  $block.innerHTML = '';

  decorateHeading($block, payload);
  decorateCollaborations($block, payload);
  buildCarousel('.browse-by-collaboration-card', $block, false);
}
