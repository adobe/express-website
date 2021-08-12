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

/* eslint-disable import/named, import/extensions */

import {
  createTag,
} from '../../scripts/scripts.js';

let rotationInterval;

function activate(block, target) {
  // de-activate all
  block.querySelectorAll('.tip, .tip-number').forEach((item) => {
    item.classList.remove('active');
  });

  // get index of the target
  const i = parseInt(target.getAttribute('data-tip-index'), 10);
  // activate corresponding number and tip
  block.querySelectorAll(`.tip-${i}`).forEach((elem) => elem.classList.add('active'));
}

function initRotation(window, document) {
  if (window && !rotationInterval) {
    rotationInterval = window.setInterval(() => {
      document.querySelectorAll('.tip-numbers').forEach((numbers) => {
        // find next adjacent sibling of the currently activated tip
        let activeAdjacentSibling = numbers.querySelector('.tip-number.active+.tip-number');
        if (!activeAdjacentSibling) {
          // if no next adjacent, back to first
          activeAdjacentSibling = numbers.firstElementChild;
        }
        activate(numbers.parentElement, activeAdjacentSibling);
      });
    }, 5000);
  }
}

export default function decorate(block) {
  const window = block.ownerDocument.defaultView;
  const document = block.ownerDocument;

  // move first image of container outside of div for styling
  const picture = block.parentElement.querySelector('picture');
  const parent = picture.parentElement;
  block.parentElement.before(picture);
  parent.remove();

  // get viewport width
  const { documentElement } = document;
  const vw = Math.max(
    documentElement && documentElement.clientWidth ? documentElement.clientWidth : 0,
    window && window.innerWidth ? window.innerWidth : 0,
  );
  if (vw >= 900) {
    // trick to fix the image height when vw > 900 and avoid image resize when toggling the tips
    const img = picture.querySelector('img');
    const onImgLoaded = () => {
      img.style.height = `${img.naturalHeight}px`;
      picture.style.height = `${img.naturalHeight}px`;
    };

    if (img.complete) {
      onImgLoaded();
    } else {
      img.addEventListener('load', onImgLoaded);
    }
  }

  const howto = block;
  const rows = Array.from(howto.children);

  const numbers = createTag('div', { class: 'tip-numbers' });
  block.prepend(numbers);
  const tips = createTag('div', { class: 'tips' });
  block.append(tips);

  rows.forEach((row, i) => {
    row.classList.add('tip');
    row.classList.add(`tip-${i + 1}`);
    row.setAttribute('data-tip-index', i + 1);

    const cells = Array.from(row.children);

    const h3 = createTag('h3');
    h3.innerHTML = cells[0].textContent;
    const p = createTag('p');
    p.innerHTML = cells[1].textContent;
    const text = createTag('div', { class: 'tip-text' });
    text.append(h3);
    text.append(p);

    row.innerHTML = '';
    row.append(text);

    tips.prepend(row);

    const number = createTag('div', { class: `tip-number tip-${i + 1}`, tabindex: '0' });
    number.innerHTML = `<span>${i + 1}</span>`;
    number.setAttribute('data-tip-index', i + 1);

    number.addEventListener('click', (e) => {
      if (rotationInterval) {
        window.clearTimeout(rotationInterval);
      }

      let { target } = e;
      if (e.target.nodeName.toLowerCase() === 'span') {
        target = e.target.parentElement;
      }
      activate(block, target);
    });

    number.addEventListener('keyup', (e) => {
      if (e.which === 13) {
        e.preventDefault();
        e.target.click();
      }
    });

    numbers.append(number);

    if (i === 0) {
      row.classList.add('active');
      number.classList.add('active');
    }
  });

  initRotation(window, document);
}
