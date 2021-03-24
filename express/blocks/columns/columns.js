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
/* global */

import { linkImage } from '../../scripts/scripts.js';

export default function decorate($block) {
  const $rows = Array.from($block.children);
  $rows.forEach(($row, rowNum) => {
    const $cells = Array.from($row.children);
    $cells.forEach(($cell, cellNum) => {
      if (cellNum === 0 && $block.classList.contains('numbered')) {
        $cell.innerHTML = `<span class="num">${rowNum + 1}/${$rows.length} —</span>${$cell.innerHTML}`;
      }
      /* this probably needs to be tighter and possibly earlier */
      if ($cell.querySelector('img') && $cell.querySelector('a')) {
        linkImage($cell);
      }
    });
  });
}
