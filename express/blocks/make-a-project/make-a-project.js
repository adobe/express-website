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

import { createTag } from '../../scripts/scripts.js';
import { addFreePlanWidget } from '../../scripts/utils/free-plan.js';
import { buildCarousel } from '../shared/carousel.js';

export default function decorate($block) {
  if ($block.children.length) {
    const $projectlist = createTag('div', { class: 'make-a-project-projectlist' });
    const $marquee = createTag('div', { class: 'make-a-project-marquee' });
    const $rows = Array.from($block.children);
    $rows.forEach(($row, index) => {
      const $cells = Array.from($row.children);
      if (index === 0 && $cells.length === 1) {
        $row.classList.add('make-a-project-CTA');
        $marquee.appendChild($row);
      } else if ($row.querySelector(':scope > div > ul:first-child:last-child')) {
        $marquee.appendChild($row);
        $block.classList.add('dark');
        $row.querySelectorAll(':scope ul li a').forEach(($link) => {
          const $icon = $link.previousElementSibling;
          if ($icon) {
            if ($icon.firstElementChild) {
              // remove title from SVG
              $icon.firstElementChild.remove();
            }
            $link.prepend($icon);
          }
        });
      } else if ($cells.length > 1) {
        $row.classList.add('make-a-project-item');
        $row.querySelectorAll('a').forEach(($link) => {
          $link.classList.remove('button');
        });
        const $pictureContainer = $cells[0];
        const img = $pictureContainer.querySelector('img');
        if (img) img.removeAttribute('loading');
        const $linkContainer = $cells[1];
        const $iconSvgContainer = $cells[2];
        const icon = $iconSvgContainer.querySelector('img, svg');
        let $iconDiv = null;
        if (icon) {
          $iconDiv = createTag('div', { class: 'make-a-project-icon' });
          $iconDiv.appendChild($iconSvgContainer);
        }
        const $numbersContainer = $cells[3];
        if ($numbersContainer) $numbersContainer.classList.add('make-a-project-numbers');
        const $a = $linkContainer.querySelector(':scope a');
        if ($a) {
          $linkContainer.classList.remove('button-container');
          if (icon) $a.prepend($iconDiv);
          if ($numbersContainer) $a.appendChild($numbersContainer);
          $a.prepend($pictureContainer);
        } else {
          if (icon) $linkContainer.prepend($iconDiv);
          if ($numbersContainer) $linkContainer.appendChild($numbersContainer);
          $linkContainer.prepend($pictureContainer);
        }
        const $svgImageInsteadOfPicture = $pictureContainer.querySelector('svg');
        if ($svgImageInsteadOfPicture) {
          $pictureContainer.classList.add('make-a-project-item-svg-image');
        }
        $projectlist.appendChild($row);
      } else {
        $row.classList.add('make-a-project-description');
        addFreePlanWidget($row.firstElementChild);
      }
    });
    if ($projectlist.children.length) {
      $marquee.appendChild($projectlist);
      buildCarousel(':scope > div', $projectlist);
    }
    $block.prepend($marquee);
    const $CTA = $block.querySelector('.make-a-project-CTA');
    if ($CTA) $CTA.querySelectorAll('a.button').forEach(($button) => $button.classList.add('large'));
  }
}
