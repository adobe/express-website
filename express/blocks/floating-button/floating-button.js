/*
 * Copyright 2022 Adobe. All rights reserved.
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
  createFloatingButton,
  collectFloatingButtonData,
} from '../shared/floating-cta.js';

import BlockMediator from '../../scripts/block-mediator.js';

export default async function decorate($block) {
  if ($block.classList.contains('spreadsheet-powered')) {
    const audience = $block.querySelector(':scope > div').textContent.trim();
    if (audience === 'mobile') {
      $block.closest('.section').remove();
    }

    const $parentSection = $block.closest('.section');
    const data = await collectFloatingButtonData($block);

    const blockWrapper = await createFloatingButton(
      $block,
      $parentSection ? audience : null,
      data,
    );

    const promoBar = BlockMediator.get('promobar');
    const currentBottom = parseInt(blockWrapper.style.bottom, 10);

    if (promoBar && promoBar.rendered) {
      blockWrapper.style.bottom = currentBottom ? `${currentBottom + promoBar.block.offsetHeight}px` : `${promoBar.block.offsetHeight}px`;
    }

    BlockMediator.subscribe('promobar', (e) => {
      if (!e.newValue.rendered) {
        blockWrapper.style.bottom = currentBottom ? `${currentBottom - promoBar.block.offsetHeight}px` : '';
      }
    });
  } else {
    $block.parentElement.remove();
  }
}
