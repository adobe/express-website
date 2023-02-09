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

function decorateButton($block, $toggle) {
  const $button = createTag('button', { class: 'content-toggle-button' });
  const tagText = $toggle.textContent.trim().match(/\[(.*?)\]/);

  if (tagText) {
    const [fullText, tagTextContent] = tagText;
    const $tag = createTag('span', { class: 'tag' });
    $button.textContent = $toggle.textContent.trim().replace(fullText, '').trim();
    $button.dataset.text = $button.textContent.toLowerCase();
    $tag.textContent = tagTextContent;
    $button.append($tag);
  } else {
    $button.textContent = $toggle.textContent.trim();
    $button.dataset.text = $button.textContent.toLowerCase();
  }
  $block.append($button);
}

function initButton($block, $sections, index) {
  const $enclosingMain = $block.closest('main');

  if ($enclosingMain) {
    const $buttons = $block.querySelectorAll('.content-toggle-button');
    const $toggleBackground = $block.querySelector('.toggle-background');

    $buttons[index].addEventListener('click', () => {
      const $activeButton = $block.querySelector('button.active');
      const blockPosition = $block.getBoundingClientRect().top;
      const offsetPosition = blockPosition + window.scrollY - 80;
      const activeButtonWidth = $buttons[index].offsetWidth + 5;
      let leftOffset = index * 10;

      for (let i = 0; i < index; i += 1) {
        leftOffset += $buttons[i].offsetWidth;
      }
      $toggleBackground.style.left = `${leftOffset}px`;
      $toggleBackground.style.width = `${activeButtonWidth}px`;

      if ($activeButton !== $buttons[index]) {
        $activeButton.classList.remove('active');
        $buttons[index].classList.add('active');

        $sections.forEach(($section) => {
          if ($buttons[index].dataset.text === $section.dataset.toggle.toLowerCase()) {
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
      $buttons[index].classList.add('active');
      const firstButtonWidthGrabbed = setInterval(() => {
        if ($buttons[index].offsetWidth > 0) {
          $toggleBackground.style.width = `${$buttons[index].offsetWidth + 5}px`;
          $toggleBackground.style.left = 0;
          clearInterval(firstButtonWidthGrabbed);
        }
      }, 200);
    }
  }
}

export default function decorate($block) {
  const $enclosingMain = $block.closest('main');
  if ($enclosingMain) {
    const $sections = $enclosingMain.querySelectorAll('[data-toggle]');
    const $toggleContainer = $block.querySelector('ul');
    const $toggleBackground = createTag('div', { class: 'toggle-background' });

    $block.innerHTML = '';

    $block.prepend($toggleBackground);

    Array.from($toggleContainer.children).forEach(($toggle, index) => {
      decorateButton($block, $toggle);
      initButton($block, $sections, index);
    });

    if ($sections) {
      $sections.forEach(($section, index) => {
        if (index > 0) {
          $section.style.display = 'none';
        }
      });
    }
  }
}
