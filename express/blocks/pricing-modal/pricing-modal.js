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

/* global window, document */

import {
  createTag,
} from '../../scripts/scripts.js';

import Context from '../../scripts/context.js';

const RETURNING_VISITOR_AUDIENCE_ID = 'ReturningVisitorAudienceID';

function isReturningVisitor() {
  const audiences = Context.get('audiences');
  if (audiences && audiences.includes(RETURNING_VISITOR_AUDIENCE_ID)) {
    return true;
  }
  return false;
}

function displayPopup(e) {
  if (isReturningVisitor()) {
    e.preventDefault();
    e.target.removeEventListener('click', displayPopup);
    document.querySelector('.pricing-modal-container').style.display = 'flex';
  }
  // else do nothing
}

function closePopup(e) {
  e.preventDefault();
  document.querySelector('.pricing-modal-container').style.display = 'none';
}

function decoratePricingModal($block) {
  const $rows = Array.from($block.children);
  $rows.forEach(($row, index) => {
    if (index === 0) {
      $row.classList.add('modal-banner');
      const $columns = Array.from($row.children);
      $columns.forEach(($column, columnIndex) => {
        if (columnIndex === 0) {
          $column.classList.add('modal-banner-text');
        } else if (columnIndex === 1) {
          $column.classList.add('modal-banner-image');
        }
      });
    } else if (index === 1) {
      $row.classList.add('modal-content');
      const $contents = Array.from($row.firstChild.children);
      $contents.forEach(($content, contentIndex) => {
        $content.classList.add(`content-${contentIndex + 1}`);
      });
    }
  });
  const $header = createTag('div', { class: 'modal-header' });
  const $headerClose = createTag('a', { class: 'close' });
  $headerClose.classList.add('modal-header-close');
  $headerClose.addEventListener('click', closePopup);
  const $cta = document.querySelector('a.cta.large');
  if ($cta) {
    $cta.addEventListener('click', displayPopup);
    const $continue = $block.querySelector(':scope .button-container:last-of-type a.button');
    $continue.className = '';
    $continue.href = '#';
    $continue.addEventListener('click', (e) => {
      // continue with originally clicked offer
      e.preventDefault();
      window.location.href = $cta.href;
    });
  }
  $header.append($headerClose);
  $block.prepend($header);
  $block.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  const $container = $block.closest('.pricing-modal-container');
  $container.addEventListener('click', closePopup);
  document.onkeydown = (event) => {
    if (event.code === 'Escape') {
      $container.style.display = 'none';
    }
  };
}

export default function decorate($block) {
  decoratePricingModal($block);
}
