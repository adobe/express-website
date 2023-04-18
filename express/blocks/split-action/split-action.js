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

import { createTag, getIconElement } from '../../scripts/scripts.js';

function show(block) {
  const body = document.querySelector('body');
  body.style.overflow = 'hidden';
  const blockWrapper = block.parentNode;
  if (blockWrapper.parentElement.classList.contains('split-action-container')) {
    blockWrapper.parentElement.classList.remove('hidden');
    setTimeout(() => {
      blockWrapper.parentElement.classList.remove('transparent');
      block.style.bottom = '0';
    }, 10);
  }
}

function initCTAListener(block, href) {
  const buttons = block.closest('main').querySelectorAll('.button');

  for (let i = 0; i < buttons.length; i += 1) {
    if (buttons[i].href === href && !buttons[i].classList.contains('no-event')) {
      buttons[i].addEventListener('click', (e) => {
        e.preventDefault();
        const buttonOuterWrapper = buttons[i].parentElement.parentElement;
        if (buttonOuterWrapper.classList.contains('multifunction')) {
          if (buttons[i].parentElement.classList.contains('toolbox-opened')) {
            buttonOuterWrapper.remove();
            show(block);
          }
        } else {
          show(block);
        }
      });
    }
  }
}

function initNotchDragAction(block) {
  let touchStart = 0;
  const notch = block.querySelector('.notch');

  notch.addEventListener('touchstart', (e) => {
    block.style.transition = 'none';
    touchStart = e.changedTouches[0].clientY;
  });

  notch.addEventListener('touchmove', (e) => {
    block.style.bottom = `-${e.changedTouches[0].clientY - touchStart}px`;
  });

  notch.addEventListener('touchend', (e) => {
    block.style.transition = 'bottom 0.2s';
    if (e.changedTouches[0].clientY - touchStart > 100) {
      notch.click();
    } else {
      block.style.bottom = '0';
    }
  });
}

export default function decorate(block) {
  const section = block.closest('.section');
  const buttonsWrapper = createTag('div', { class: 'buttons-wrapper' });
  const blockBackground = createTag('div', { class: 'block-background' });
  const underlay = createTag('a', { class: 'underlay' });
  const notch = createTag('a', { class: 'notch' });
  const notchPill = createTag('div', { class: 'notch-pill' });
  const blockWrapper = block.parentNode;

  let hrefHolder = '';

  if (section) {
    section.classList.add('hidden');
    section.classList.add('transparent');
  }

  block.prepend(getIconElement('adobe-express-white'));

  Array.from(block.children).forEach((div) => {
    const anchor = div.querySelector('a');

    if (anchor) {
      buttonsWrapper.append(anchor);
      div.remove();
      const buttons = document.querySelectorAll('.button.primaryCTA');
      const matchingButtons = Array.from(buttons).filter((button) => button.href === anchor.href);

      if (anchor.classList.contains('same-as-floating-button-CTA') || matchingButtons.length > 0) {
        anchor.classList.add('no-event');
        anchor.target = '_self';
        hrefHolder = anchor.href;
      }
    }

    if (div.querySelector('picture')) {
      blockBackground.append(div.querySelector('picture'));
      div.remove();
    }
  });

  notch.append(notchPill);
  blockBackground.append(underlay);
  blockWrapper.append(blockBackground);
  block.append(notch, buttonsWrapper);

  [notch, underlay].forEach((element) => {
    element.addEventListener('click', () => {
      const actionCta = block.querySelector('.button[target="_self"]');
      window.location.href = actionCta.href;
    });
  });

  if (window.innerWidth < 900) {
    initNotchDragAction(block);
    initCTAListener(block, hrefHolder);

    document.addEventListener('floatingbuttonloaded', (e) => {
      initCTAListener(e.details.block, hrefHolder);
    });

    document.dispatchEvent(new Event('splitactionloaded'));
  }
}
