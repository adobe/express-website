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

import { linkImage, createTag, transformLinkToAnimation } from '../../scripts/scripts.js';

function decorateIconList($columnCell) {
  const icons = $columnCell.querySelectorAll('img.icon, svg.icon');
  if (icons.length === 1 && icons[0].closest('p').innerText === '') {
    // treat single icon without text as brand icon
    icons[0].classList.add('brand');
    return;
  }
  let $iconList = createTag('div', { class: 'columns-iconlist' });
  let $iconListDescription;
  [...$columnCell.children].forEach(($e) => {
    const $img = $e.querySelector('img.icon, svg.icon');
    const hasText = $img ? $img.closest('p').innerText !== '' : false;
    if ($img && hasText) {
      const $iconListRow = createTag('div');
      const $iconDiv = createTag('div', { class: 'columns-iconlist-icon' });
      $iconDiv.appendChild($img);
      $iconListRow.append($iconDiv);
      $iconListDescription = createTag('div', { class: 'columns-iconlist-description' });
      $iconListRow.append($iconListDescription);
      $iconListDescription.appendChild($e);
      $iconList.appendChild($iconListRow);
    } else {
      if ($iconList.children.length > 0) {
        $columnCell.appendChild($iconList);
        $iconList = createTag('div', { class: 'columns-iconlist' });
      }
      $columnCell.appendChild($e);
    }
  });
  if ($iconList.children.length > 0) $columnCell.appendChild($iconList);
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
        const $parentDiv = $pics[0].closest('div');
        const $parentParagraph = $pics[0].parentNode;
        $parentDiv.insertBefore($pics[0], $parentParagraph);
      }

      // this probably needs to be tighter and possibly earlier
      const $a = $cell.querySelector('a');
      if ($a) {
        if ($a.textContent.startsWith('https://')) {
          if ($a.href.endsWith('.mp4')) {
            transformLinkToAnimation($a);
          } else if ($pics[0]) {
            linkImage($cell);
          }
        }
      }
      if ($a && $a.classList.contains('button')) {
        if ($block.classList.contains('fullsize')) {
          $a.classList.add('xlarge');
        } else if ($a.classList.contains('light')) {
          $a.classList.replace('accent', 'primary');
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
