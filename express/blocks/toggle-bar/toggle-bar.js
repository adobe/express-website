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

function decorateButton(block, toggle) {
  const button = createTag('button', { class: 'toggle-bar-button' });
  const iconsWrapper = createTag('div', { class: 'icons-wrapper' });
  const textWrapper = createTag('div', { class: 'text-wrapper' });
  const icons = toggle.querySelectorAll('img');

  const tagText = toggle.textContent.trim().match(/\[(.*?)\]/);

  if (tagText) {
    const [fullText, tagTextContent] = tagText;
    const tag = createTag('span', { class: 'tag' });
    textWrapper.textContent = toggle.textContent.trim().replace(fullText, '').trim();
    button.dataset.text = textWrapper.textContent.toLowerCase();
    tag.textContent = tagTextContent;
    textWrapper.append(tag);
  } else {
    textWrapper.textContent = toggle.textContent.trim();
    button.dataset.text = textWrapper.textContent.toLowerCase();
  }

  if (icons.length > 0) {
    icons.forEach((icon) => {
      iconsWrapper.append(icon);
    });
  }

  button.append(iconsWrapper, textWrapper);
  toggle.parentNode.replaceChild(button, toggle);
}

function initButton(block, sections, index) {
  const enclosingMain = block.closest('main');

  if (enclosingMain) {
    const buttons = block.querySelectorAll('.toggle-bar-button');

    buttons[index].addEventListener('click', () => {
      const activeButton = block.querySelector('button.active');

      localStorage.setItem('createIntent', buttons[index].dataset.text);
      if (activeButton !== buttons[index]) {
        activeButton.classList.remove('active');
        buttons[index].classList.add('active');

        sections.forEach((section) => {
          if (buttons[index].dataset.text === section.dataset.toggle.toLowerCase()) {
            section.style.display = 'block';
          } else {
            section.style.display = 'none';
          }
        });
      }
    });

    if (index === 0) {
      buttons[index].classList.add('active');
    }
  }
}

function syncWithStoredIntent(block) {
  const buttons = block.querySelectorAll('button');
  const createIntent = localStorage.getItem('createIntent');

  if (createIntent) {
    const targetBtn = Array.from(buttons).find((btn) => btn.dataset.text === createIntent);
    if (targetBtn) targetBtn.click();
  }
}
export default function decorate(block) {
  const enclosingMain = block.closest('main');
  if (enclosingMain) {
    const sections = enclosingMain.querySelectorAll('[data-toggle]');
    const toggles = block.querySelectorAll('li');

    toggles.forEach((toggle, index) => {
      decorateButton(block, toggle);
      initButton(block, sections, index);
    });

    if (sections) {
      sections.forEach((section, index) => {
        if (index > 0) {
          section.style.display = 'none';
        }
      });
    }

    syncWithStoredIntent(block);
  }
}
