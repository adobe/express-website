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

function adjustLayout($overlay, $attributions, $icon) {
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
  if (window.innerWidth >= 900) {
    $icon.src = '/express/icons/adobe-creative-cloud-express.svg';
  } else {
    $icon.src = '/express/icons/cc-express-logo.svg';
  }
}
export default function decorate($block) {
  const $rows = [...$block.children];
  const attributions = [];
  const $attributions = createTag('div', { class: 'hero-animation-attributions' });
  $rows.forEach(($div, i) => {
    if (i === 0) {
      const $a = $div.querySelector('a');
      const href = $a.getAttribute('href');
      const url = new URL(href);
      const helixId = url.pathname.split('/')[2];

      if (href.endsWith('.mp4')) {
        const isAnimation = true;

        let attribs = { controls: '' };
        if (isAnimation) {
          attribs = {
            playsinline: '', autoplay: '', loop: '', muted: '',
          };
        }
        const $poster = $a.closest('div').querySelector('picture source');
        if ($poster) {
          attribs.poster = $poster.srcset;
          $poster.parentNode.remove();
        }
        const videoHref = `./media_${helixId}.mp4`;
        const $video = createTag('video', attribs);
        /*
        if (href.startsWith('https://hlx.blob.core.windows.net/external/')) {
          href='/hlx_'+href.split('/')[4].replace('#image','');
        }
        */
        $video.innerHTML = `<source src="${videoHref}" type="video/mp4">`;
        const $innerDiv = $a.closest('div');
        $innerDiv.prepend($video);
        $innerDiv.classList.add('hero-animation-overlay');
        $a.remove();
        if (isAnimation) {
          $video.addEventListener('canplay', () => {
            $video.muted = true;
            $video.play();
          });
        }

        $video.addEventListener('timeupdate', () => {
          attributions.forEach((att) => {
            if ($video.currentTime >= att.start && $video.currentTime <= att.end) {
              att.$elem.classList.add('appear');
            } else {
              att.$elem.classList.remove('appear');
            }
          });
        });

        const $icon = $block.querySelector('.icon');

        window.addEventListener('resize', () => {
          adjustLayout($innerDiv, $attributions, $icon);
        });
        adjustLayout($innerDiv, $attributions, $icon);
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
