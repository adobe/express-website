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
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

function decorateCards($headersContainer, $cardsContainer, $buttonsContainer) {
  const $headers = Array.from($headersContainer.children);
  const $cards = Array.from($cardsContainer.children);
  const $buttonDivs = Array.from($buttonsContainer.children);

  $cardsContainer.classList.add('pricing-hub-cards');
  $cards[0].remove();

  for (let i = 1; i < 4; i += 1) {
    const $header = $headers[i];
    const $card = $cards[i];
    const $buttonContainer = $buttonDivs[i];
    const $button = $buttonContainer.querySelector('a');
    const $svg = $card.querySelector('svg');
    const $title = $card.querySelector('h2');

    if ($header.textContent) {
      $header.classList.add('pricing-hub-card-header');
      $card.prepend($header);
    } else {
      $header.remove();
    }

    if ($title && $svg) {
      $svg.parentElement.remove();
      $title.prepend($svg);
    }

    $card.classList.add('pricing-hub-card');

    if (i === 2) {
      $card.classList.add('pricing-hub-card-highlight');
    }

    if ($buttonContainer && $button) {
      $card.append($buttonContainer);

      if ($card.classList.contains('pricing-hub-card-highlight')) {
        $button.classList.remove('accent');
        $button.classList.add('large', 'dark');
      } else {
        $button.classList.add('large', 'reverse');
      }
    }
  }

  $headersContainer.remove();
  $buttonsContainer.remove();
}

function decorateFeatures($block, $rows) {
  const $features = createTag('div', { class: 'pricing-hub-features' });

  for (let i = 3; i < $rows.length; i += 1) {
    const $feature = $rows[i];
    const $columns = Array.from($feature.children);
    const $columnsContainer = createTag('div', { class: 'pricing-hub-feature-columns' });
    const $title = $feature.querySelector('h3');
    const $icon = $feature.querySelector('svg, img');

    if ($title && $icon) {
      $icon.parentElement.remove();
      $title.prepend($icon);
    }

    const $tooltip = $feature.querySelector('p');

    if ($tooltip) {
      $tooltip.remove();
    }

    $feature.classList.add('pricing-hub-feature');
    $features.append($feature);

    $columns[0].classList.add('pricing-hub-feature-title');
    $columns[1].classList.add('pricing-hub-feature-column');
    $columns[2].classList.add('pricing-hub-feature-column', 'pricing-hub-feature-column-highlight');
    $columns[3].classList.add('pricing-hub-feature-column');

    $columnsContainer.append($columns[1]);
    $columnsContainer.append($columns[2]);
    $columnsContainer.append($columns[3]);

    $feature.append($columnsContainer);
  }

  $block.append($features);
}

export default function decorate($block) {
  const $rows = Array.from($block.children);

  decorateCards($rows[0], $rows[1], $rows[2]);
  decorateFeatures($block, $rows);
}
