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

function capitalizeFirstLetter(string) {
  const words = string.split(' ').map((word) => word[0].toUpperCase() + word.substring(1));
  return words.join(' ');
}

export function decorateBreadcrumb($block) {
  const pathArray = Array.from(window.location.pathname.split('/')).splice(1);
  let previousCrumb = '';
  const urlArray = pathArray.map((path) => {
    previousCrumb = `${previousCrumb}/${path}`;
    return previousCrumb;
  });
  const $homeCrumb = createTag('a', { href: `${urlArray[0]}` });
  $homeCrumb.textContent = 'Home / ';
  $block.append($homeCrumb);
  urlArray.shift();
  pathArray.shift();
  pathArray.forEach((path, index, paths) => {
    const linkText = capitalizeFirstLetter(path.replace('-', ' '));
    const $crumb = createTag('a', { href: urlArray[index] });
    if (index === paths.length - 1) {
      $crumb.classList.add('current-crumb');
      $crumb.textContent = `${linkText}`;
    } else {
      $crumb.textContent = `${linkText} / `;
    }
    $block.append($crumb);
  });
}

export default async function decorate($block) {
  decorateBreadcrumb($block);
}
