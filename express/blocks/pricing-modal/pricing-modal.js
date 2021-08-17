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
  createTag,
} from '../../scripts/scripts.js';

function decoratePricingModal($block) {
  const $rows = Array.from($block.children);
  $rows.forEach(($row, index) => {
    if (index === 0) {
      $row.classList.add('modal__banner');
      const $columns = Array.from($row.children);
      $columns.forEach(($column, columnIndex) => {
        if (columnIndex === 0) {
          $column.classList.add('modal__banner-text');
        } else if (columnIndex === 1) {
          $column.classList.add('modal__banner-image');
        }
      });
    } else if (index === 1) {
      $row.classList.add('modal__content');
      const $contents = Array.from($row.firstChild.children);
      $contents.forEach(($content, contentIndex) => {
        $content.classList.add(`content-${contentIndex + 1}`);

        if (contentIndex === 4) {
          $content.classList.add('button');
        }
      });
    }
  });
}

export default function decorate($block) {
  decoratePricingModal($block);
}
