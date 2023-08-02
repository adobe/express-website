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

import { createTag, fetchRelevantRows } from '../../scripts/scripts.js';
import { buildStaticFreePlanWidget } from '../../scripts/utils/free-plan.js';
import buildPaginatedCarousel from '../shared/paginated-carousel.js';
import { buildAppStoreBadge } from '../shared/app-store-badge.js';

export default async function decorate($block) {
  const payload = {
    carouselArray: [],
    other: [],
    relevantRowsData: null,
  };

  if ($block.classList.contains('spreadsheet-powered')) {
    payload.relevantRowsData = await fetchRelevantRows(window.location.pathname);

    if (payload.relevantRowsData && payload.relevantRowsData.startFromCard !== 'Y') {
      $block.remove();
    }
  }

  Array.from($block.children).forEach(($row) => {
    const $columns = Array.from($row.children);
    const parameter = $columns[0].textContent.trim();
    const $value = $columns[1];

    if (parameter === 'Heading') {
      const $heading = createTag('h3');
      let headingText = $value.textContent;

      if (payload.relevantRowsData && payload.relevantRowsData.startFromCardTitle) {
        headingText = payload.relevantRowsData.startFromCardTitle;
      }

      $heading.textContent = headingText;
      $row.replaceWith($heading);
    } else if (parameter === 'Feature Carousel') {
      buildPaginatedCarousel(':scope > div > p', $row, false);
    } else if (parameter === 'App Store Badge') {
      $row.replaceWith(buildAppStoreBadge($value.firstElementChild.href, { class: 'gradient-border' }));
    } else {
      payload.other.push($columns);
    }
  });

  const freePlanTags = await buildStaticFreePlanWidget();
  $block.insertAdjacentElement('afterend', freePlanTags);
}
