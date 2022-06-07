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
  createTag,
  // eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

export default function decorate($block) {
  if ($block.children.length) {
    const $banner = $block.children[0];
    if ($banner) {
      $banner.classList.add('premium-plan-banner');
      const $bannerCta = $banner.querySelector('a');
      if ($bannerCta) {
        $bannerCta.classList.add('dark', 'reverse');
        $bannerCta.classList.remove('accent');
      }
      const $img = $banner.querySelector('picture:first-child:last-child');
      if ($img && $img.parentElement.tagName === 'P') {
        // unwrap single picture if wrapped in p tag
        const $parentDiv = $img.closest('div');
        const $parentParagraph = $img.parentNode;
        $parentDiv.insertBefore($img, $parentParagraph);
        $parentParagraph.remove();
      }
    }
  }
  if ($block.children.length > 1) {
    const $container = createTag('div', { class: 'premium-plan-cards' });
    const $cards = createTag('div');
    $container.append($cards);
    let failsafe = 20;
    while ($block.children.length > 1) {
      const $card = $block.children[1].children[0];
      if ($card) {
        $cards.append($card);
        $card.classList.add('premium-plan-card');
      }
      $block.children[1].remove();
      failsafe -= 1;
      if (!failsafe) { // prevent a possible infinite loop.
        break;
      }
      const $images = $card.querySelectorAll('picture');
      if ($images.length) {
        $images[0].classList.add('premium-plan-card-icon');
      }
      if ($images.length > 1) {
        $images[1].classList.add('premium-plan-card-image');
      }
    }
    $block.append($container);
    buildCarousel('.premium-plan-card', $container);
  }
}
