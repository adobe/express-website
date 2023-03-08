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
import { createTag } from '../../scripts/scripts.js';

function initButton($block, $sections, index) {
  const $enclosingMain = $block.closest('main');

  if ($enclosingMain) {
    const $buttons = $block.querySelectorAll('.intent-toggle-desktop-button');
    const $toggleBackground = $block.querySelector('.intent-toggle-background');

    $buttons[index].addEventListener('click', () => {
      const $activeButton = $block.querySelector('button.active');
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
        });
      }
    });

    if (index === 0) {
      $toggleBackground.classList.add('loading');
      const firstButtonWidthGrabbed = setInterval(() => {
        if ($buttons[index].offsetWidth > 0) {
          $toggleBackground.style.width = `${$buttons[index].offsetWidth + 5}px`;
          $toggleBackground.style.left = 0;
          clearInterval(firstButtonWidthGrabbed);
        }
        $buttons[index].classList.add('active');
        $toggleBackground.classList.remove('loading');
      }, 200);

      // initializing the page with first tab sections
      $sections.forEach(($section) => {
        if ($buttons[index].dataset.text === $section.dataset.toggle.toLowerCase()) {
          $section.style.display = 'block';
        } else {
          $section.style.display = 'none';
        }
      });
    }
  }
}

function motionReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)') === true
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
}

function buildReduceMotionSwitch($block, container) {
  const reduceMotionSwitch = createTag('div', { class: 'reduce-motion-switch' });
  const reduceMotionSlider = createTag('div', { class: 'reduce-motion-slider' });
  const reduceMotionKnob = createTag('div', { class: 'reduce-motion-knob' });
  const reduceMotionText = createTag('span', { class: 'reduce-motion-text' });

  reduceMotionText.textContent = container.textContent.trim();
  container.innerHTML = '';

  reduceMotionSwitch.append(reduceMotionSlider);
  reduceMotionSlider.append(reduceMotionKnob);
  container.prepend(reduceMotionSwitch, reduceMotionText);
  $block.prepend(container);

  if (sessionStorage.getItem('reduceMotion') === null) {
    if (motionReduced()) {
      sessionStorage.setItem('reduceMotion', 'on');
      reduceMotionSlider.classList.add('on');
    } else {
      sessionStorage.setItem('reduceMotion', 'off');
    }
  } else if (sessionStorage.getItem('reduceMotion') === 'on') reduceMotionSlider.classList.add('on');

  reduceMotionSwitch.addEventListener('click', () => {
    reduceMotionSlider.classList.toggle('on');
    if (sessionStorage.getItem('reduceMotion') === 'on') {
      sessionStorage.setItem('reduceMotion', 'off');
    } else {
      sessionStorage.setItem('reduceMotion', 'on');
    }

    const reduceMotionToggled = new CustomEvent('reducemotiontoggled', {
      detail: { state: sessionStorage.getItem('reduceMotion') },
    });

    document.dispatchEvent(reduceMotionToggled);
  });

  container.classList.add('reduce-motion-switch-container');
}

function decorateToggleButtons($block, container) {
  const $enclosingMain = $block.closest('main');
  if ($enclosingMain) {
    const $sections = $enclosingMain.querySelectorAll('[data-toggle]');
    const $toggleBackground = createTag('div', { class: 'intent-toggle-background' });

    if (container && container.children.length > 0) {
      container.classList.add('intent-toggle-desktop-buttons-container');
      const content = Array.from(container.children);
      container.innerHTML = '';
      container.prepend($toggleBackground);
      $block.append(container);

      content.forEach(($toggle, index) => {
        const $button = createTag('button', { class: 'intent-toggle-desktop-button' });
        const tagText = $toggle.textContent.trim().match(/\[(.*?)]/);

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

        container.append($button);
        initButton(container, $sections, index);
      });
    }
  }
}

function decorateQuickActions($block, container) {
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach((p) => {
    const img = p.querySelector('img');
    const a = p.querySelector('a');

    if (img && a) {
      a.prepend(img);
      container.append(a);
      p.remove();
    }
  });
  $block.append(container);
  container.classList.add('quick-action-buttons');
}

export default function decorate($block) {
  const $enclosingMain = $block.closest('main');
  if ($enclosingMain) {
    const blockRows = Array.from($block.children);
    $block.innerHTML = '';

    blockRows.forEach((row) => {
      const columns = Array.from(row.children);
      if (columns.length > 1) {
        const parameter = columns[0].textContent.trim().toLowerCase();
        const contentContainer = columns[1];

        if (parameter === 'accessibility') {
          buildReduceMotionSwitch($block, contentContainer);
        }

        if (parameter === 'toggle') {
          decorateToggleButtons($block, contentContainer);
        }

        if (parameter === 'quick actions') {
          decorateQuickActions($block, contentContainer);
        }
      }
    });
  }
}
