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

import {
  addBlockClasses,
  createTag,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

export default function decorate(block) {
  addBlockClasses(block, ['step-image', 'step-description']);

  const section = block.closest('.section');
  const heading = section.querySelector('h2, h3, h4');

  const includeSchema = block.classList.contains('schema');
  if (includeSchema) {
    // this is due to block loader setting full options container class name
    // reverse engineer the container name
    if (block.classList.contains('highlight')) {
      section.classList.add('steps-highlight-container');
    } else if (block.classList.contains('dark')) {
      section.classList.add('steps-dark-container');
    } else {
      section.classList.add('steps-container');
    }
  }

  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent) || document.title,
    step: [],
  };

  block.querySelectorAll('.step-description').forEach((step, i) => {
    const h = step.querySelector('h3, h4, h5, h6');
    const p = step.querySelector('p');

    if (h && p) {
      schema.step.push({
        '@type': 'HowToStep',
        position: i + 1,
        name: h.textContent,
        itemListElement: {
          '@type': 'HowToDirection',
          text: p.textContent,
        },
      });
    }
  });

  if (includeSchema) {
    const $schema = createTag('script', { type: 'application/ld+json' });
    $schema.innerHTML = JSON.stringify(schema);
    const $head = document.head;
    $head.append($schema);
  }
}
