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
import { standardizeBranchLinks } from '../../scripts/scripts.js';

export default async function decorate($block) {
  if ($block.classList.contains('spreadsheet-powered')) {
    const audience = $block.querySelector(':scope > div').textContent.trim();
    if (audience === 'mobile') {
      $block.closest('.section').remove();
    }

    const $parentSection = $block.closest('.section');
    const data = await collectFloatingButtonData($block);

    await createFloatingButton(
      $block,
      $parentSection ? audience : null,
      data,
    );
    standardizeBranchLinks($block.closest('main'), $block);
  } else {
    $block.parentElement.remove();
  }
}
