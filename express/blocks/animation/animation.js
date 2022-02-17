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

export default function decorate($block, name, doc) {
  doc.querySelectorAll('.animation a[href], .video a[href]').forEach(($a) => {
    const { href } = $a;
    const url = new URL(href);
    const suffix = url.pathname.split('/media_')[1];
    const $parent = $a.parentNode;

    if (href.endsWith('.mp4')) {
      const isAnimation = !!$a.closest('.animation');
      // const isAnimation = true;

      let attribs = { controls: '' };
      if (isAnimation) {
        attribs = {
          playsinline: '', autoplay: '', loop: '', muted: '',
        };
      }
      const $poster = $a.closest('div').querySelector('img');
      if ($poster) {
        attribs.poster = $poster.src;
        $poster.remove();
      }

      const $video = createTag('video', attribs);
      /*
      if (href.startsWith('https://hlx.blob.core.windows.net/external/')) {
        href='/hlx_'+href.split('/')[4].replace('#image','');
      }
      */
      $video.innerHTML = `<source src="./media_${suffix}" type="video/mp4">`;
      $a.parentNode.replaceChild($video, $a);
      if (isAnimation) {
        $video.addEventListener('canplay', () => {
          $video.muted = true;
          $video.play();
        });
      }
    }

    const $next = $parent.nextElementSibling;
    if ($next && $next.tagName === 'P' && $next.innerHTML.trim().startsWith('<em>')) {
      $next.classList.add('legend');
    }
  });
}
