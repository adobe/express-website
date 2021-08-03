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

/* global window */

import {
  createTag,
  toClassName,
  transformLinkToAnimation,
} from '../../scripts/scripts.js';

function timecodeToSeconds(timecode) {
  const splits = timecode.split(':');
  let seconds = 0;
  splits.forEach((seg) => {
    seconds *= 60;
    seconds += +seg;
  });
  return seconds;
}

function adjustLayout($overlay, $attributions) {
  $overlay.style.minHeight = `${Math.max((window.innerWidth * 700) / 1440, 375)}px`;
  const scale = window.innerWidth / 1440;
  if (window.innerWidth > 375 * (1440 / 700)) {
    $attributions.style.transform = `scale(${scale})`;
    $attributions.style.top = `${scale * 545}px`;
    $attributions.style.left = `${scale * 1030}px`;
  } else {
    $attributions.style.transform = 'scale(0.4)';
    $attributions.style.top = '300px';
    $attributions.style.left = '80px';
  }
}

export default function decorate($block) {
  const $rows = [...$block.children];
  const attributions = [];
  const $attributions = createTag('div', { class: 'hero-animation-attributions' });
  $rows.forEach(($div, i) => {
    if (i === 0) {
      const $video = transformLinkToAnimation($div.querySelector('a'));
      if ($video) {
        const $innerDiv = $video.closest('div');
        $innerDiv.classList.add('hero-animation-overlay');

        $video.addEventListener('timeupdate', () => {
          attributions.forEach((att) => {
            if ($video.currentTime >= att.start && $video.currentTime <= att.end) {
              att.$elem.classList.add('appear');
            } else {
              att.$elem.classList.remove('appear');
            }
          });
        });

        window.addEventListener('resize', () => {
          adjustLayout($innerDiv, $attributions);
        });
        adjustLayout($innerDiv, $attributions);
      }
      $div.querySelectorAll('p:empty').forEach(($p) => $p.remove());
    } else {
      const $cols = [...$div.children];
      const attribution = { $elem: $div };
      $div.classList.add('hero-animation-attribution');
      $cols.forEach(($cell, j) => {
        if (j === 0) {
          const seconds = timecodeToSeconds($cell.textContent.trim());
          attribution.start = seconds;
          $cell.remove();
        }

        if (j === 1) {
          const seconds = timecodeToSeconds($cell.textContent.trim());
          attribution.end = seconds;
          $cell.remove();
        }

        if (j === 2) {
          const className = toClassName($cell.textContent);
          $div.classList.add(`hero-animation-${className}`);
          $cell.remove();
        }
      });
      attributions.push(attribution);
      $attributions.append($div);
    }
  });
  $block.append($attributions);
  $block.classList.add('appear');
}
