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
// import { buildCarousel } from '../shared/carousel.js';

export default function decorate($block) {
  if ($block.children.length) {
    const $marquee = $block.children[0];
    // decorate project links
    $marquee.querySelectorAll(':scope ul li a').forEach(($link) => {
      const $icon = $link.previousSibling;
      if ($icon) {
        // remove title from SVG
        $icon.firstElementChild.remove();
        $link.prepend($icon);
      }
    });
    // add carousel
    // buildCarousel('ul', $marquee);
  }
  if ($block.children.length > 1) {
    // decorate description row
    const $desc = $block.children[1];
    $desc.classList.add('make-a-project-description');
    // make CTA buttons large
    $desc.querySelectorAll('a.button').forEach(($button) => $button.classList.add('large'));
  }
}
