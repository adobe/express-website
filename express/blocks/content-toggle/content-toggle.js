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
import { createTag } from '../../scripts/scripts.js';

export default function decorate($block) {
  const $sections = document.querySelectorAll('[data-toggle]');
  const $toggleContainer = $block.querySelector('ul');

  $block.innerHTML = '';
  const $toggleBackground = createTag('div', { class: 'toggle-background' });
  $block.prepend($toggleBackground);

  Array.from($toggleContainer.children).forEach(($toggle, index) => {
    const $button = createTag('button', { class: 'content-toggle-button'});
    const tagText = $toggle.textContent.trim().match(/\[(.*?)\]/);
    $button.textContent = $toggle.textContent.trim();

    if (tagText) {
      const [fullText, tagTextContent] = tagText;
      $button.textContent = $toggle.textContent.trim().replace(fullText, '').trim();
      const $tag = createTag('span', { class: 'tag' });
      $tag.textContent = tagTextContent;
      $button.append($tag);
      $block.append($button);
    } else {
      $block.append($button);
    }

    $button.addEventListener('click', () => {
      const $activeButton = $block.querySelector('button.active');
      const blockPosition = $block.getBoundingClientRect().top;
      const offsetPosition = blockPosition + window.scrollY - 80;

      const activeWidth = $button.offsetWidth + 5;
      const allButtons = $block.querySelectorAll('.content-toggle-button');
      let leftOffset = index * 10;
      for (let i = 0; i < index; i += 1) {
        leftOffset += allButtons[i].offsetWidth;
      }
      $toggleBackground.style.left = `${leftOffset}px`;
      $toggleBackground.style.width = `${activeWidth}px`;

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
      const firstButtonWidthGrabbed = setInterval(() => {
        if ($button.offsetWidth > 0) {
          $toggleBackground.style.width = `${$button.offsetWidth + 5}px`;
          $toggleBackground.style.left = 0;
          clearInterval(firstButtonWidthGrabbed);
        }
      }, 200);
    }
  });

  if ($sections) {
    $sections.forEach(($section, index) => {
      if (index > 0) {
        $section.style.display = 'none';
      }
    });
  }
}
