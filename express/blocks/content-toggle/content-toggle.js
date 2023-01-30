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
  let aTag;

  $block.innerHTML = '';

  Array.from($toggleContainer.children).forEach(($toggle, index) => {
    const $button = createTag('button');
    const section = $toggle.textContent.trim();
    const tagText = $toggle.textContent.trim().match(/\[(.*?)\]/);
    const link = $toggle.querySelector('a');

    $button.textContent = $toggle.textContent.trim();
    if ($block.classList.contains('dark') && tagText) {
      const [fullText, tagTextContent] = tagText;
      $button.textContent = $toggle.textContent.trim().replace(fullText, '').trim();
      const $tag = createTag('span', { class: 'tag' });
      $tag.textContent = tagTextContent;
      $block.append($tag);
    }

    if ($block.classList.contains('small') && link) {
      aTag = createTag('a', { href: link.getAttribute('href') });
      aTag.append($button);
      $block.append(aTag);
    } else {
      $block.append($button);
    }

    $button.addEventListener('click', () => {
      const $activeButton = $block.querySelector('button.active');
      const blockPosition = $block.getBoundingClientRect().top;
      const offsetPosition = blockPosition + window.scrollY - 80;

      if ($activeButton !== $toggle) {
        $activeButton.classList.remove('active');
        $button.classList.add('active');

        $sections.forEach(($section) => {
          if (section === $section.dataset.toggle) {
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

  const $rightArrow = $block.querySelector('.small .carousel-arrow-right');
  $rightArrow.addEventListener('click', () => {
    $block.classList.add('margin-left-zero');
  });

  const $leftArrow = $block.querySelector('.small .carousel-arrow-left');
  $leftArrow.addEventListener('click', () => {
    $block.classList.remove('margin-left-zero');
  });
}
