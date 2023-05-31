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

import { fetchPlaceholders, getMetadata } from './scripts.js';

export default function autoUpdatePage() {
  const wl = ['{{heading_placeholder}}', '{{type}}', '{{quantity}}'];
  // FIXME: deprecate wl
  const main = document.querySelector('main');
  if (main) {
    const allReplaceableBlades = [...main.innerText.matchAll(/{{(.*?)}}/g)];

    if (allReplaceableBlades.length > 0) {
      allReplaceableBlades.forEach((regex) => {
        if (!wl.includes(regex[0].toLowerCase())) {
          main.innerHTML = main.innerHTML.replaceAll(regex[0], getMetadata(regex[1]) || '');
        }
      });
    }
  }
}

async function replaceDefaultPlaceholders(template) {
  template.innerHTML = template.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', getMetadata('create-link') || '/');

  if (getMetadata('tasks') === '') {
    const placeholders = await fetchPlaceholders();
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
  } else {
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', getMetadata('create-text') || '');
  }
}

async function updateNonBladeContent() {
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');
  const templateX = document.querySelector('.template-x');
  const browseByCat = document.querySelector('.browse-by-category');

  if (templateList) {
    await replaceDefaultPlaceholders(templateList);
  }

  if (templateX) {
    await replaceDefaultPlaceholders(templateX);
  }

  if (browseByCat && !['yes', 'true', 'on', 'Y'].includes(getMetadata('show-browse-by-category'))) {
    browseByCat.remove();
  }
}

autoUpdatePage();
await updateNonBladeContent();
