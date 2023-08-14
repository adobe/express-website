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

function awakeNestedCarousels(section) {
  const carousels = section.querySelectorAll('.carousel-container');

  if (carousels.length === 0) return;

  Array.from(carousels).forEach((c) => {
    c.closest('.block')?.dispatchEvent(new CustomEvent('carouselloaded'));
  });
}

function initButton(block, sections, index, props) {
  const enclosingMain = block.closest('main');

  if (enclosingMain) {
    const buttons = block.querySelectorAll('.toggle-bar-button');

    buttons[index].addEventListener('click', () => {
      const activeButton = block.querySelector('button.active');
      props.activeTab = buttons[index].dataset.text;

      localStorage.setItem('createIntent', buttons[index].dataset.text);
      if (activeButton !== buttons[index]) {
        activeButton.classList.remove('active');
        buttons[index].classList.add('active');

        sections.forEach((section) => {
          if (buttons[index].dataset.text === section.dataset.toggle.toLowerCase()) {
            section.style.display = 'block';
            props.activeSection = section;
            awakeNestedCarousels(section);
          } else {
            section.style.display = 'none';
          }
        });
      }

      if (!block.classList.contains('sticky')) {
        window.scrollTo({
          top: Math.round(window.scrollY + block.getBoundingClientRect().top) - 24,
          behavior: 'smooth',
        });
      }
    });

    if (index === 0) {
      buttons[index].classList.add('active');
      props.activeTab = buttons[index].dataset.text;
      [props.activeSection] = sections;
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

function initGNavObserver(block) {
  const gNav = document.querySelector('header.feds-header-wrapper');
  if (gNav) {
    const config = { attributes: true, childList: false, subtree: false };

    const callback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes') {
          if (gNav.classList.contains('feds-header-wrapper--scrolled')
            && !gNav.classList.contains('feds-header-wrapper--retracted')
            && block.classList.contains('sticking')
            && !block.classList.contains('hidden')) {
            block.classList.add('bumped-by-gnav');
          } else {
            block.classList.remove('bumped-by-gnav');
          }
        }
      }
    };

    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(gNav, config);
  }
}

function initStickyBehavior(block, props) {
  const toggleBar = block.querySelector('div:nth-of-type(2)');
  if (toggleBar) {
    document.addEventListener('scroll', () => {
      const blockRect = block.getBoundingClientRect();
      const sectionRect = props.activeSection.getBoundingClientRect();

      if (sectionRect.bottom < 0) {
        block.classList.add('hidden');
      } else if (blockRect.top < -45) {
        block.classList.remove('hidden');
        block.classList.add('sticking');
      } else if (blockRect.top >= -45) {
        block.classList.remove('sticking');
        block.classList.remove('hidden');
      }
    }, { passive: true });
  }

  window.addEventListener('feds.events.experience.loaded', () => {
    initGNavObserver(block);
  });
}

export default function decorate(block) {
  const props = { activeTab: '', activeSection: null };
  const enclosingMain = block.closest('main');
  if (enclosingMain) {
    const sections = enclosingMain.querySelectorAll('[data-toggle]');
    const toggles = block.querySelectorAll('li');

    toggles.forEach((toggle, index) => {
      decorateButton(block, toggle);
      initButton(block, sections, index, props);
    });

    if (sections) {
      sections.forEach((section, index) => {
        if (index > 0) {
          section.style.display = 'none';
        }
      });
    }

    syncWithStoredIntent(block);

    if (block.classList.contains('sticky')) {
      initStickyBehavior(block, props);
    }
  }
}
