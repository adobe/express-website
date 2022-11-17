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
  transformLinkToAnimation,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

export default function decorate($block) {
  const $rows = Array.from($block.children);
  const $header = $rows[0].firstChild;
  const $container = createTag('div', { class: 'quick-action-hub-container' });
  const $listContainer = createTag('div', { class: 'quick-action-hub-list-container' });
  const $contentContainer = createTag('div', { class: 'quick-action-hub-content-container' });
  const $columns = Array.from($rows[2].children);

  $header.classList.add('quick-action-hub-header');
  $contentContainer.innerHTML = $rows[1].innerHTML;

  const $animations = $contentContainer.querySelectorAll('a');

  if ($animations) {
    $animations.forEach(($animation) => {
      if ($animation && $animation.href && $animation.href.includes('.mp4')) {
        transformLinkToAnimation($animation);
      }
    });
  }

  $columns.forEach(($column) => {
    const $columnRows = Array.from($column.children);

    $columnRows.forEach(($row) => {
      if ($row.tagName === 'P') {
        let $image = $row.querySelector('img');
        if (!$image) {
          $image = $row.querySelector('svg');
        }
        const $link = $row.querySelector('a');
        $column.append($link);
        $link.prepend($image);
        $row.remove();
      } else {
        $column.append($row);
      }
    });

    $column.classList.add('quick-action-hub-column');
    $listContainer.append($column);
  });

  $block.innerHTML = '';

  $block.append($container);
  $block.append($contentContainer);
  $container.append($header);
  $container.append($listContainer);
}
