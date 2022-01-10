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
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

function decoratePricingPlan($block) {
  const blockContent = $block.firstElementChild.innerHTML;
  $block.innerHTML = '';
  const $gradientBorder = createTag('div', { class: 'gradient-border' });
  $block.append($gradientBorder);
  const $innerRectangle = createTag('div', { class: 'inner-rectangle' });
  $gradientBorder.append($innerRectangle);
  $innerRectangle.innerHTML = blockContent;
  const paragraphs = Array.from($innerRectangle.querySelectorAll('p'));
  const prices = paragraphs.filter((p) => /\$/.test(p.innerHTML));
  prices.forEach(($price) => {
    $price.classList.add('price');
  });
}

export default function decorate($block) {
  decoratePricingPlan($block);
}
