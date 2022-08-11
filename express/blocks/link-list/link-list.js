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

// eslint-disable-next-line import/no-unresolved
import { normalizeHeadings } from '../../scripts/scripts.js';
// eslint-disable-next-line import/no-unresolved
import { buildCarousel } from '../shared/carousel.js';

export default function decorate(block) {
  normalizeHeadings(block, ['h3']);
  const links = [...block.querySelectorAll('p.button-container')];
  if (links.length) {
    links.forEach((p) => {
      const link = p.querySelector('a');
      link.classList.add('medium', 'secondary');
      link.classList.remove('accent');
    });
    const div = links[0].closest('div');
    const platformEl = document.createElement('div');
    platformEl.classList.add('link-list-platform');
    buildCarousel('p.button-container', div, false);
    div.append(platformEl);
  }
}
