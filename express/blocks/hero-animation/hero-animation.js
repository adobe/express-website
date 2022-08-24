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
    typeHint: 'default',
    minWidth: 0,
  },
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
  let breakpoint = 'default';
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

function adjustLayout(animations, $parent) {
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

  // auto-play if hash matches title
  if (toClassName(title) === window.location.hash.substring(1)) {
    displayVideoModal(vidUrls, title);
  }
}

export default async function decorate($block) {
  const possibleOptions = ['mobile', 'desktop', 'hd'];
  const $sectionWrapper = $block.closest('.section-wrapper');
  const animations = {};
  if ($block.classList.contains('wide')) {
    $sectionWrapper.classList.add('hero-animation-wide-container');
  } else {
    $sectionWrapper.classList.add('hero-animation-container');
  }
  const $rows = [...$block.children];
  $rows.forEach(($div, index) => {
    let rowType = 'animation';
    let typeHint;
    if (index + 1 === $rows.length) rowType = 'content';
    if ([...$div.children].length > 1) {
      typeHint = $div.children[0].textContent.trim().toLowerCase();
    }
    if (['shadow', 'background'].includes(typeHint)) {
      rowType = 'option';
    } else if (!possibleOptions.includes(typeHint)) typeHint = 'default';

    if (rowType === 'animation') {
      if (typeHint !== 'default') $block.classList.add(`has-${typeHint}-animation`);
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
      let optimizedPosterSrc;
      if ($poster) {
        const srcURL = new URL($poster.src);
        const srcUSP = new URLSearchParams(srcURL.search);
        srcUSP.set('format', 'webply');
        srcUSP.set('width', typeHint === 'mobile' ? 750 : 2000);
        optimizedPosterSrc = `${srcURL.pathname}?${srcUSP.toString()}`;
      }

      animations[typeHint] = {
        source,
        poster: optimizedPosterSrc || '',
        title: ($poster && $poster.getAttribute('alt')) || '',
        params: videoParameters,
      };

      $div.remove();
    }

    if (rowType === 'content') {
      const $video = createAnimation(animations);
      $div.prepend($video);

      $video.addEventListener('canplay', () => {
        $video.muted = true;
        $video.play();
      });

      if ($video) {
        const $innerDiv = $video.closest('div');
        $innerDiv.classList.add('hero-animation-overlay');
        const $videoParent = $video.parentNode;
        window.addEventListener('resize', () => {
          adjustLayout(animations, $videoParent);
        });
        adjustLayout(animations, $videoParent);
      }
      $div.querySelectorAll('p:empty').forEach(($p) => $p.remove());

      const videoLink = [...$div.querySelectorAll('a')]
        .find(($a) => isVideoLink($a.href));
      if (videoLink) {
        transformToVideoLink($div, videoLink);
      }
      addFreePlanWidget($div.querySelector('.button-container') || $div.children[0]);
    }

    if (rowType === 'option') {
      if (typeHint === 'shadow') {
        const shadow = ($div.querySelector('picture')) ? $div.querySelector('picture') : createTag('img', { src: '/express/blocks/hero-animation/shadow.png' });
        $div.innerHTML = '';
        $div.appendChild(shadow);
        $div.classList.add('hero-shadow');
      }
      if (typeHint === 'background') {
        const color = $div.children[1].textContent.trim().toLowerCase();
        if (color) $sectionWrapper.style.background = color;
        const lightness = (
          parseInt(color.substr(1, 2), 16)
          + parseInt(color.substr(3, 2), 16)
          + parseInt(color.substr(5, 2), 16)) / 3;
        if (lightness < 200) $block.classList.add('white-text')
        $div.remove();
      }
    }
  });

  if ($block.classList.contains('shadow') && !$block.querySelector('.hero-shadow')) {
    const shadowDiv = createTag('div', { class: 'hero-shadow' });
    const shadow = createTag('img', { src: '/express/blocks/hero-animation/shadow.png' });
    shadowDiv.appendChild(shadow);
    $block.appendChild(shadowDiv);
  }

  const button = $block.querySelector('.button');
  if (button) button.classList.add('xlarge');

  if ($block.classList.contains('wide')) {
    addAnimationToggle($block);
  }
  if (getLocale(window.location) === 'jp') {
    addHeaderSizing($block);
  }
  $block.classList.add('appear');
}
