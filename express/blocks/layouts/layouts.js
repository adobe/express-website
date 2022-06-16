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
  getIcon,
} from '../../scripts/scripts.js';
import {
  Masonry,
} from '../shared/masonry.js';

export default function decorate($block) {
  const $layouts = Array.from($block.children);
  const layouts = [];
  $layouts.forEach(($layout) => {
    const row = Array.from($layout.children).map(($e) => $e.textContent);
    const layout = {
      name: row[0],
      res: row[1],
      icon: row[2],
      link: row[3],
    };
    const sep = layout.res.includes(':') ? ':' : 'x';
    const ratios = layout.res.split(sep).map((e) => +e);
    if (ratios[1]) layout.ratio = ratios[1] / ratios[0];
    layouts.push(layout);
  });
  $block.innerHTML = '';
  const knownIcons = ['instagram', 'youtube', 'facebook', 'twitter', 'snapchat'];
  layouts.forEach((layout) => {
    const $layout = createTag('div', { class: 'layout', style: `height: ${layout.ratio * 200}px` });
    let iconString = layout.icon;
    if (knownIcons.includes(iconString)) {
      iconString = getIcon(layout.icon);
    }
    $layout.innerHTML = `<div class="layout-inside">
      <div class="layout-content">
        <div class="layout-icon">${iconString}</div>  
        <div class="layout-description">${layout.name} - ${layout.res}</div>
      </div>
    </div>`;

    if (layout.link) {
      $layout.addEventListener('click', () => {
        window.location.href = layout.link;
      });
    }

    $block.append($layout);
  });

  const masonry = new Masonry($block, [...$block.children]);
  masonry.draw();
  window.addEventListener('resize', () => {
    masonry.draw();
  });
}
