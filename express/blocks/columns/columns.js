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

import { linkImage, createTag } from '../../scripts/scripts.js';

function decorateIconList($columnCell) {
  $columnCell.querySelectorAll('p:empty').forEach(($p) => $p.remove());

  const $iconList = createTag('div', { class: 'columns-iconlist' });
  const $icons = [...$columnCell.querySelectorAll('img.icon, svg.icon')];
  let $before;
  $icons.forEach(($icon, i) => {
    if (!i) $before = $icon.previousSibling;
    const $iconListRow = createTag('div');
    const $iconListDescription = createTag('div', { class: 'columns-iconlist-description' });
    $iconListDescription.appendChild($icon.nextSibling);
    const $iconDiv = createTag('div', { class: 'columns-iconlist-icon' });
    $iconDiv.appendChild($icon);
    $iconListRow.appendChild($iconDiv);
    $iconListRow.appendChild($iconListDescription);
    $iconList.appendChild($iconListRow);
  });

  if ($icons.length > 0) {
    if ($before) {
      $columnCell.insertBefore($iconList, $before.nextSibling);
    }
  }
}

export function onLoadCallback(maxLines = 3) {
  const $headings = document.querySelectorAll('main .columns h1, main .columns h2, main .columns h3, main .columns h4, main .columns h5');
  $headings.forEach((heading) => {
    const style = window.getComputedStyle(heading);
    const { height, lineHeight, fontSize } = style;
    const fontSizeInt = parseInt(fontSize.match('\\d+')[0]);
    const lineHeightFloat = parseFloat(lineHeight.match('\\d+\.\d+'));
    const ratio = lineHeightFloat / fontSizeInt;
    const unit = 'px';
    do {
      fontSizeInt = fontSizeInt - 1; 
      lineHeightFloat = lineHeightFloat - ratio;
    } while (height > lineHeight * maxLines);
    heading.style.fontSize = fontSizeInt+unit;
    heading.style.lineHeight = lineHeightFloat+unit;
  });
}

export default function decorate($block) {
  const $rows = Array.from($block.children);
  if ($rows.length > 1) {
    $block.classList.add('table');
  }

  let numCols = 0;
  if ($rows[0]) numCols = $rows[0].children.length;

  if (numCols) $block.classList.add(`width-${numCols}-columns`);

  let total = $rows.length;
  const isNumberedList = $block.classList.contains('numbered');
  if (isNumberedList && $block.classList.length > 4) {
    const i = parseInt($block.classList[3], 10);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(i)) {
      total = i;
    }
  }

  $rows.forEach(($row, rowNum) => {
    const $cells = Array.from($row.children);
    $cells.forEach(($cell, cellNum) => {
      if ($cell.querySelector('img.icon, svg.icon')) {
        decorateIconList($cell);
      }

      if (cellNum === 0 && isNumberedList) {
        // add number to first cell
        let num = rowNum + 1;
        if (total > 9) {
          // stylize with total for 10 or more items
          num = `${num}/${total} —`;
          if (rowNum < 9) {
            // pad number with 0
            num = `0${num}`;
          }
        } else {
          // regular ordered list style for 1 to 9 items
          num = `${num}.`;
        }
        $cell.innerHTML = `<span class="num">${num}</span>${$cell.innerHTML}`;
      }

      const $pics = $cell.querySelectorAll(':scope picture');
      if ($pics.length === 1 && $pics[0].parentElement.tagName === 'P') {
        // unwrap single picture if wrapped in p tag, see https://github.com/adobe/helix-word2md/issues/662
        const $parent = $pics[0].closest('div');
        $parent.append($pics[0]);
      }

      // this probably needs to be tighter and possibly earlier
      const $a = $cell.querySelector('a');
      if ($pics[0] && $a) {
        if ($a.textContent.startsWith('https://')) {
          linkImage($cell);
        }
      }

      $cell.querySelectorAll(':scope p:empty').forEach(($p) => $p.remove());

      $cell.classList.add('column');
      if ($cell.firstElementChild.tagName === 'PICTURE') {
        $cell.classList.add('column-picture');
      }

      const $pars = $cell.querySelectorAll('p');
      for (let i = 0; i < $pars.length; i += 1) {
        if ($pars[i].innerText.match(/Powered by/)) {
          $pars[i].classList.add('powered-by');
        }
      }
    });
  });
}
