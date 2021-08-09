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

export default function decorate(block, name, doc) {
  // move first image of container outside of div for styling
  const picture = block.parentElement.querySelector('picture');
  const parent = picture.parentElement;
  block.parentElement.before(picture);
  parent.remove();

  const howto = block;
  const heading = howto.previousElementSibling;
  const rows = Array.from(howto.children);
  const script = createTag('script', { type: 'application/ld+json' });
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: heading.textContent,
    step: [],
  };

  const numbers = createTag('div', { class: 'tip-numbers' });
  block.prepend(numbers);

  rows.forEach((row, i) => {
    row.classList.add('tip');
    row.classList.add(`tip-${i + 1}`);

    const cells = Array.from(row.children);
    schema.step.push({
      '@type': 'HowToStep',
      position: i + 1,
      name: cells[0].textContent,
      itemListElement: {
        '@type': 'HowToDirection',
        text: cells[1].textContent,
      },
    });

    const h3 = createTag('h3');
    h3.innerHTML = cells[0].textContent;
    const p = createTag('p');
    p.innerHTML = cells[1].textContent;
    const text = createTag('div', { class: 'tip-text' });
    text.append(h3);
    text.append(p);

    row.innerHTML = '';
    row.append(text);

    const number = createTag('div', { class: 'tip-number', tabindex: '0' });
    number.innerHTML = `<span>${i + 1}</span>`;
    number.addEventListener('click', (e) => {
      block.querySelectorAll('.tip, .tip-number').forEach((item) => {
        item.classList.remove('active');
      });
      let { target } = e;
      if (e.target.nodeName.toLowerCase() === 'span') {
        target = e.target.parentElement;
      }
      target.classList.add('active');
      block.querySelector(`.tip-${i + 1}`).classList.add('active');
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

  script.innerHTML = JSON.stringify(schema);
  if (doc.head) {
    doc.head.append(script);
  }
}
