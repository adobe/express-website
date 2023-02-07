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
import { createTag } from '../../scripts/scripts.js';
import { buildCarousel } from '../shared/carousel.js';

export default function decorate($block) {
  const $sections = document.querySelectorAll('[data-toggle]');
  const $toggleContainer = $block.querySelector('ul');
  let $aElement;

  $block.innerHTML = '';

  Array.from($toggleContainer.children).forEach(($toggle, index) => {
    let sectionText = $toggle.textContent.trim();
    const tagTextBrackets = sectionText.match(/\[(.*?)\]/);
    const tagText = tagTextBrackets ? tagTextBrackets[1] : null;
    const link = $toggle.querySelector('a');
    const $tag = createTag('span', { class: 'tag' });
    const $button = createTag('button', { class: 'content-toggle-button' });
    let $toggleElement;

    if (tagText) {
      sectionText = sectionText.replace(tagTextBrackets[0], '').trim();
      $tag.textContent = tagText;
    }
    if (link) {
      $aElement = createTag('a', { href: link.getAttribute('href'), class: 'content-toggle-button' });
      $aElement.textContent = sectionText;
      $toggleElement = $aElement;
      $block.append($aElement);
      if (tagText) {
        $aElement.append($tag);
      }
    } else {
      $button.textContent = sectionText;
      $toggleElement = $button;
      $block.append($button);
      if (tagText) {
        $button.append($tag);
      }
    }

    $toggleElement.addEventListener('click', () => {
      const $activeButton = $block.querySelector('button.active');
      const blockPosition = $block.getBoundingClientRect().top;
      const offsetPosition = blockPosition + window.scrollY - 80;

      if ($activeButton !== $toggle) {
        $activeButton.classList.remove('active');
        $button.classList.add('active');

        $sections.forEach(($section) => {
          if ($section === $section.dataset.toggle) {
            $section.style.display = 'block';
          } else {
            $section.style.display = 'none';
          }

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        });
      }
    });

    if (index === 0) {
      $button.classList.add('active');
    }
  });

  if ($sections) {
    $sections.forEach(($section, index) => {
      if (index > 0) {
        $section.style.display = 'none';
      }
    });
  }

  buildCarousel('.content-toggle > *', $block);
}
