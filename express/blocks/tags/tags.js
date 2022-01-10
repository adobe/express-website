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

// eslint-disable-next-line import/no-unresolved
import { normalizeHeadings } from '../../scripts/scripts.js';

/**
 * Retrieves the content of a metadata tag.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((el) => el.content).join(', ');
  return meta;
}

export default function decorate(block) {
  normalizeHeadings(block, ['h3']);
  const tags = getMetadata('article:tag');
  tags.split(',').forEach((tag) => {
    if (tag) {
      const link = document.createElement('a');
      link.innerHTML = tag.trim();
      link.href = '#';
      link.classList.add('medium', 'secondary', 'button');
      block.appendChild(link);
    }
  });
}
