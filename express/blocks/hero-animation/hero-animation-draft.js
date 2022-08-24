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
  addAnimationToggle,
  addFreePlanWidget,
  createTag,
  toClassName,
  getLocale,
  addHeaderSizing,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

import {
  isVideoLink,
  displayVideoModal,
} from '../shared/video.js';

const animationBreakPointSettings = [
  {
    breakpoint: 'mobile',
    minWidth: 0,
  },
  {
    breakpoint: 'desktop',
    minWidth: 400,
  },
  {
    breakpoint: 'hd',
    minWidth: 1440,
  },
];

export default async function decorate($block) {
  const $rows = [...$block.children];
  $rows.forEach(($row, index) => {
    let rowType = 'animation';
    if (index + 1 === $row.length) rowType = 'content';
    if ([...$row.children].length > 1) rowType = $row.children[0].textContent.trim().toLowerCase();

    
  });
}
