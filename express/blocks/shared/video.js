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
  createTag, toClassName,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

const docTitle = document.title;

function playInlineVideo($element, vid, type, title) {
  $element.innerHTML = `<iframe src="${vid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${title}"></iframe>`;
  $element.classList.add(type);
}

export function hideVideoModal(push) {
  const $overlay = document.querySelector('main .video-overlay');
  if ($overlay) {
    $overlay.remove();
    window.onkeyup = null;
  }
  if (push) {
    // create new history entry
    window.history.pushState({}, docTitle, window.location.href.split('#')[0]);
  }
}

export function displayVideoModal(url, title, push) {
  const canPlayInline = url && (url.includes('youtu') || url.includes('vimeo'));
  if (canPlayInline) {
    const $overlay = createTag('div', { class: 'video-overlay' });
    const $video = createTag('div', { class: 'video-overlay-video', id: 'video-overlay-video' });
    $overlay.appendChild($video);
    $overlay.addEventListener('click', () => {
      hideVideoModal(true);
    });
    window.onkeyup = ({ key }) => {
      if (key === 'Escape') {
        hideVideoModal(true);
      }
    };
    if (push) {
      // create new history entry
      window.history.pushState({ url, title }, `${docTitle} | ${title}`, `#${toClassName(title)}`);
    }
    const $main = document.querySelector('main');
    $main.append($overlay);
    let vidUrl = '';
    let vidType = 'default';
    if (url.includes('youtu')) {
      vidType = 'youtube';
      const yturl = new URL(url);
      let vid = yturl.searchParams.get('v');
      if (!vid) {
        vid = yturl.pathname.substr(1);
      }
      vidUrl = `https://www.youtube.com/embed/${vid}?feature=oembed&autoplay=1`;
    } else if (url.includes('vimeo')) {
      vidType = 'vimeo';
      const vid = new URL(url).pathname.split('/')[1];
      vidUrl = `https://player.vimeo.com/video/${vid}?app_id=122963&autoplay=1`;
    }
    playInlineVideo($video, vidUrl, vidType, title);
  } else {
    window.location.href = url;
  }
}
