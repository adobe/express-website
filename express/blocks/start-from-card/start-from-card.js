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

import {

} from '../../scripts/scripts.js';

import buildPaginatedCarousel from '../shared/paginated-carousel.js';

export default async function decorate($block) {
  const payload = {
    carouselArray: [],
    other: [],
  };
  for (const $row of $block.children) {
    const $divs = $row.querySelectorAll('div');
    switch ($divs[0].textContent.trim()) {
      default:
        payload.other.push($divs);
        break;
      case 'Feature Carousel':
        buildPaginatedCarousel(':scope > p', $divs[1], true);
        $divs[0].remove();
        break;
    }
  }
}
