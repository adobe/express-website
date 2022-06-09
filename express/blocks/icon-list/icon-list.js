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
  toClassName,
  getIcon,
  addBlockClasses,
  createTag,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

export default function decorate($block) {
  let numCols = 0;
  const $rows = [...$block.children];
  if ($rows[0]) {
    numCols = $rows[0].children.length;
  }
  if (numCols === 2) {
    /* legacy icon list */
    addBlockClasses($block, ['icon-list-image', 'icon-list-description']);
    $block.querySelectorAll(':scope>div').forEach(($row) => {
      if ($row.children && $row.children[1]) {
        const iconName = toClassName($row.children[0].textContent);
        if (iconName && !iconName.startsWith('-')) {
          $row.children[0].innerHTML = iconName ? getIcon(iconName) : '';
        }
      }
    });
  }

  if (numCols === 4) {
    const $cols = ['left', 'right'].map(() => createTag('div', { class: 'icon-list-column' }));
    $rows.forEach(($row, i) => {
      $cols.forEach(($col) => $col.append(createTag('div')));
      const $cells = [...$row.children];
      $cells.forEach(($cell, j) => {
        $cols[Math.floor(j / 2)].children[i].append($cell);
        if (j % 2) {
          if ($cell.querySelector('h3')) {
            $cell.parentNode.classList.add('icon-list-heading');
          } else {
            $cell.parentNode.classList.add('icon-list-regular');
          }
        }
      });
      $row.remove();
    });
    $cols.forEach(($col) => {
      addBlockClasses($col, ['icon-list-image', 'icon-list-description']);
      $block.append($col);
    });
    $block.classList.add('two-column');
    $block.closest('div.section').classList.add('icon-list-two-column-container');
  }
}
