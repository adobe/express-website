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

function createAnimation(animations) {
  const attribs = {};
  ['playsinline', 'autoplay', 'loop', 'muted'].forEach((p) => {
    attribs[p] = '';
  });

  Object.keys(animations).forEach((k) => {
    animations[k].active = false;
  });

  const breakpoint = window.innerWidth <= 400 ? 'mobile' : 'desktop';
  attribs.poster = animations[breakpoint].poster;
  const { source } = animations[breakpoint];
  animations[breakpoint].active = true;

  // replace anchor with video element
  const $video = createTag('video', attribs);
  $video.innerHTML = `
  <source src="${source}" type="video/mp4">`;
  return $video;
}

function adjustLayout($overlay, $attributions, animations, $parent) {
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

  const breakpoint = window.innerWidth <= 400 ? 'mobile' : 'desktop';
  if (!animations[breakpoint].active) {
    const $newVideo = createAnimation(animations);
    $parent.replaceChild($newVideo, $parent.querySelector('video'));
    $newVideo.addEventListener('canplay', () => {
      $newVideo.muted = true;
      $newVideo.play();
    });
  }
}

export default function decorate($block) {
  const $rows = [...$block.children];
  const attributions = [];
  const $attributions = createTag('div', { class: 'hero-animation-attributions' });
  const animations = {};
  $rows.forEach(($div) => {
    const typeHint = $div.children[0].textContent.trim().toLowerCase();
    let rowType = 'content';
    if (typeHint === 'mobile' || typeHint === 'desktop') rowType = 'animation';
    if (typeHint.startsWith('00:')) rowType = 'timecode';

    // content row
    if (rowType === 'animation') {
      const $a = $div.querySelector('a');
      const $poster = $div.querySelector('img');
      const id = new URL($a.href).pathname.split('/')[2];
      const source = `./media_${id}.mp4`;

      animations[typeHint] = { source, poster: $poster.currentSrc };
      $div.remove();
    }

    // content row
    if (rowType === 'content') {
      const $video = createAnimation(animations);
      $div.children[0].prepend($video);
      $video.addEventListener('canplay', () => {
        $video.muted = true;
        $video.play();
      });

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
        const $videoParent = $video.parentNode;
        window.addEventListener('resize', () => {
          adjustLayout($innerDiv, $attributions, animations, $videoParent);
        });
        adjustLayout($innerDiv, $attributions, animations, $videoParent);
      }
      $div.querySelectorAll('p:empty').forEach(($p) => $p.remove());
    }

    // timecode animations
    if (rowType === 'timecode') {
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
  const button = $block.querySelector('.button');
  if (button) button.classList.add('large');
  $block.append($attributions);
  $block.classList.add('appear');
}
