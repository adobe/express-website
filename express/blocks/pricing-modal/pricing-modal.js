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
/* eslint-disable no-underscore-dangle */

import {
  createTag,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

import BlockMediator from '../../scripts/block-mediator.js';

const ENABLE_PRICING_MODAL_AUDIENCE = 'enablePricingModal';

function enablePricingModal() {
  // dev mode: check pricing-modal query parameter
  const u = new URL(window.location.href);
  const param = u.searchParams.get('pricing-modal');
  if (param) {
    if (param === 'on') return true;
    if (param === 'off') return false;
  }

  // "production" mode: check for audience
  const audiences = BlockMediator.get('audiences');
  return audiences && audiences.includes(ENABLE_PRICING_MODAL_AUDIENCE);
}

function displayPopup(e) {
  if (enablePricingModal()) {
    e.preventDefault();
    e.target.removeEventListener('click', displayPopup);
    document.querySelector('.pricing-modal-container').style.display = 'flex';
    const usp = new URLSearchParams(window.location.search);
    const useAlloy = (
      window.location.hostname === 'www.stage.adobe.com'
      || (
        usp.has('martech')
        && usp.get('martech').includes('alloy')
      )
    );

    if (useAlloy) {
      const { _satellite } = window;
      _satellite.track('event', {
        xdm: {},
        data: {
          eventType: 'web.webinteraction.linkClicks',
          web: {
            webInteraction: {
              name: 'pricingModalDisplayed',
              linkClicks: {
                value: 1,
              },
              type: 'other',
            },
          },
          _adobe_corpnew: {
            digitalData: {
              primaryEvent: {
                eventInfo: {
                  eventName: 'pricingModalDisplayed',
                },
              },
              spark: {
                eventData: {
                  eventName: 'pricingModalDisplayed',
                  sendTimestamp: new Date().getTime(),
                },
              },
            },
          },
        },
      });
    } else if (window.digitalData && window._satellite) {
      const { digitalData, _satellite } = window;
      digitalData._set('primaryEvent.eventInfo.eventName', 'pricingModalDisplayed');
      digitalData._set('spark.eventData.eventName', 'pricingModalDisplayed');

      _satellite.track('event', {
        digitalData: digitalData._snapshot(),
      });
    }
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
      const $contents = Array.from($row.firstElementChild.children);
      $contents.forEach(($content, contentIndex) => {
        $content.classList.add(`content-${contentIndex + 1}`);
      });
    }
  });
  const $header = createTag('div', { class: 'modal-header' });
  const $headerClose = createTag('a', { class: 'close' });
  $headerClose.classList.add('modal-header-close');
  $headerClose.addEventListener('click', closePopup);
  const ctas = document.querySelectorAll('a.pricing-columns-cta.large');
  const $cta = ctas ? ctas[ctas.length - 1] : null;
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
