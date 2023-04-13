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

import { Masonry } from '../shared/masonry.js';

import { buildCarousel } from '../shared/carousel.js';

function camelize(str) {
  return str.replace(/^\w|[A-Z]|\b\w/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

function constructProps(block) {
  const singleColumnContentTypes = ['title', 'subtitle'];
  let props = {
    templates: [],
    filters: {
      locales: '(en)',
    },
    tailButton: '',
    limit: 70,
    total: 0,
    start: '',
    sortBy: '-_score,-remixCount',
    masonry: undefined,
    authoringError: false,
    headingTitle: null,
    headingSlug: null,
    viewAllLink: null,
  };

  Array.from(block.children).forEach((row) => {
    const cols = row.querySelectorAll('div');
    if (cols.length === 1) {
      const paragraphs = cols[0].querySelectorAll('p');
      singleColumnContentTypes.forEach((key, index) => {
        if (paragraphs[index]) {
          props[key] = paragraphs[index].textContent.trim();
        }
      });
    } else if (cols.length === 2) {
      const key = cols[0].querySelector('strong')?.textContent.trim();
      const value = cols[1].textContent.trim().toLowerCase();
      if (value) {
        props[camelize(key)] = value;
      }
    } else if (cols.length === 3) {
      const key = cols[0].querySelector('strong')?.textContent.trim();

      if (key === 'Template Stats' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        props[camelize(key)] = cols[2].textContent.trim().toLowerCase();
      }

      if (key === 'Holiday Block' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        const graphic = cols[2].querySelector('picture');
        if (graphic) {
          props[camelize(key)] = graphic;
        }
      }

      if (key === 'Blank Template') {
        const text = cols[1].querySelector('a')?.textContent.trim();
        const url = cols[1].querySelector('a')?.href;
        const graphic = cols[2].querySelector('svg');

        if (text && url && graphic) {
          props[camelize(key)] = { text, url, graphic };
        }
      }
    }
  });

  return props;
}

export default async function decorate(block) {
  const props = constructProps(block);
  block.innerHTML = '';
}
