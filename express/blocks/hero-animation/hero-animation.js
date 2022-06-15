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
  createTag,
  toClassName,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

import {
  isVideoLink,
  displayVideoModal,
} from '../shared/video.js';

function timecodeToSeconds(timecode) {
  const splits = timecode.split(':');
  let seconds = 0;
  splits.forEach((seg) => {
    seconds *= 60;
    seconds += +seg;
  });
  return seconds;
}

const animationBreakPointSettings = [
  {
    typeHint: 'mobile',
    minWidth: 0,
  },
  {
    typeHint: 'desktop',
    minWidth: 400,
  },
  {
    typeHint: 'hd',
    minWidth: 1440,
  },
];

function getBreakpoint(animations) {
  let breakpoint = animations[Object.keys(animations)[0]].typeHint;
  animationBreakPointSettings.forEach((bp) => {
    if ((window.innerWidth > bp.minWidth) && animations[bp.typeHint]) breakpoint = bp.typeHint;
  });
  return breakpoint;
}

function getAnimation(animations, breakpoint) {
  return animations[breakpoint];
}

function createAnimation(animations) {
  const attribs = {};
  ['playsinline', 'autoplay', 'muted'].forEach((p) => {
    attribs[p] = '';
  });

  Object.keys(animations).forEach((k) => {
    animations[k].active = false;
  });

  const breakpoint = getBreakpoint(animations);
  const animation = getAnimation(animations, breakpoint);

  if (animation.params.loop) {
    attribs.loop = '';
  }
  attribs.poster = animation.poster;
  attribs.title = animation.title;
  const { source } = animation;
  animation.active = true;

  // replace anchor with video element
  const $video = createTag('video', attribs);
  if (source) {
    $video.innerHTML = `<source src="${source}" type="video/mp4">`;
  }
  return $video;
}

function adjustLayout($overlay, $attributions, animations, $parent) {
  if (!$parent.closest('.block').classList.contains('wide')) {
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

  const breakpoint = getBreakpoint(animations);
  const animation = getAnimation(animations, breakpoint);

  if (!animation.active) {
    const $newVideo = createAnimation(animations);
    $parent.replaceChild($newVideo, $parent.querySelector('video'));
    $newVideo.addEventListener('canplay', () => {
      $newVideo.muted = true;
      $newVideo.play();
    });
  }
}

function transformToVideoLink($cell, $a) {
  $a.addEventListener('click', (e) => {
    e.preventDefault();
  });
  const title = $a.textContent;
  // gather video urls from all links in cell
  const vidUrls = [];
  [...$cell.querySelectorAll(':scope a')]
    .filter(($link) => isVideoLink($link.href))
    .forEach(($link) => {
      vidUrls.push($link.href);
      if ($link !== $a) {
        if ($link.classList.contains('button')) {
          // remove button with container
          $link.closest('.button-container').remove();
        } else {
          // remove link only
          $link.remove();
        }
      }
    });

  $a.addEventListener('click', (e) => {
    e.preventDefault();
    displayVideoModal(vidUrls, title, true);
  });

  $a.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      displayVideoModal(vidUrls, title);
    }
  });
}

export default async function decorate($block) {
  const $rows = [...$block.children];
  const attributions = [];
  const $attributions = createTag('div', { class: 'hero-animation-attributions' });
  const animations = {};
  $rows.forEach(($div) => {
    const typeHint = $div.children[0].textContent.trim().toLowerCase();
    let rowType = 'content';
    if (animationBreakPointSettings.map((e) => e.typeHint).includes(typeHint)) rowType = 'animation';
    if (typeHint.startsWith('00:')) rowType = 'timecode';
    if (typeHint.startsWith('shadow')) rowType = 'shadow';

    // content row
    if (rowType === 'animation') {
      let source;
      let videoParameters = {};
      const $a = $div.querySelector('a');
      const $poster = $div.querySelector('img');
      if ($a) {
        const url = new URL($a.href);
        const params = new URLSearchParams(url.search);
        videoParameters = {
          loop: params.get('loop') !== 'false',
        };
        const id = url.hostname.includes('hlx.blob.core') ? url.pathname.split('/')[2] : url.pathname.split('media_')[1].split('.')[0];
        source = `./media_${id}.mp4`;
      }

      const srcURL = new URL($poster.src);
      const srcUSP = new URLSearchParams(srcURL.search);
      srcUSP.set('format', 'webply');
      srcUSP.set('width', typeHint === 'desktop' ? 2000 : 750);
      const optimizedPosterSrc = `${srcURL.pathname}?${srcUSP.toString()}`;

      animations[typeHint] = {
        source,
        poster: optimizedPosterSrc,
        title: $poster.getAttribute('alt') || '',
        params: videoParameters,
      };

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

      // check for video link
      const videoLink = [...$div.querySelectorAll('a')]
        .find(($a) => isVideoLink($a.href));
      if (videoLink) {
        transformToVideoLink($div, videoLink);
      }
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

    // timecode animations
    if (rowType === 'shadow') {
      $div.children[0].remove();
      $div.classList.add('hero-shadow');
    }
  });
  const button = $block.querySelector('.button');
  if (button) button.classList.add('large');

  $block.append($attributions);
  addAnimationToggle($block);
  $block.classList.add('appear');
}
