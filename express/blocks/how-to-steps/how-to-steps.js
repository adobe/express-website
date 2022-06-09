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
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

export default function decorate($block, name, doc) {
  const $howto = $block;
  const $heading = $howto.closest('.section').querySelector('h2, h3, h4');
  const $rows = Array.from($howto.children);

  const includeSchema = !$block.classList.contains('noschema');

  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: ($heading && $heading.textContent) || document.title,
    step: [],
  };

  $rows.forEach(($row, i) => {
    const $cells = Array.from($row.children);
    schema.step.push({
      '@type': 'HowToStep',
      position: i + 1,
      name: $cells[0].textContent,
      itemListElement: {
        '@type': 'HowToDirection',
        text: $cells[1].textContent,
      },
    });
    const $h3 = createTag('h3');
    $h3.innerHTML = $cells[0].textContent;
    const $p = createTag('p');
    $p.innerHTML = $cells[1].innerHTML;
    const $text = createTag('div', { class: 'tip-text' });
    $text.append($h3);
    $text.append($p);
    const $number = createTag('div', { class: 'tip-number' });
    $number.innerHTML = `<span>${i + 1}</span>`;
    $cells[0].remove();
    $cells[1].innerHTML = '';
    $cells[1].classList.add('tip');
    $cells[1].append($number);
    $cells[1].append($text);
  });

  if (includeSchema) {
    const $schema = createTag('script', { type: 'application/ld+json' });
    $schema.innerHTML = JSON.stringify(schema);
    const $head = doc.head;
    $head.append($schema);
  }
}
