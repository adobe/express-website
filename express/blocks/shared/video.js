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
  createTag, getLocale, loadBlock, toClassName,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

const docTitle = document.title;

async function fetchVideoPromotions() {
  if (!window.videoPromotions) {
    window.videoPromotions = {};
    try {
      const locale = getLocale(window.location);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      const resp = await fetch(`${urlPrefix}/express/video-promotions.json`);
      const json = await resp.json();
      json.data.forEach((entry) => {
        const video = entry.Video;
        if (video) {
          window.videoPromotions[new URL(video).pathname] = entry.Promotion;
        }
      });
    } catch (e) {
      // ignore
    }
  }
  return window.videoPromotions;
}

function playInlineVideo($element, vid, type, title) {
  if (type === 'html5') {
    const kind = vid.split('.').pop();
    $element.innerHTML = `<video controls autoplay><source src="${vid}" type="video/${kind}"></source></video>`;
    const $video = $element.querySelector('video');
    $video.addEventListener('loadeddata', async () => {
      // check for video promotion
      const videoPromos = await fetchVideoPromotions();
      const promoName = videoPromos[vid];
      if (promoName) {
        $element.insertAdjacentHTML('beforeend', `<div class="promotion block" data-block-name="promotion">${promoName}</div>`);
        const $promo = $element.querySelector('.promotion');
        await loadBlock($promo, true);
        $promo.querySelector(':scope a.button').className = 'button accent';
        const $close = $promo.appendChild(createTag('div', { class: 'close' }));
        $close.addEventListener('click', () => {
          // eslint-disable-next-line no-use-before-define
          hideVideoModal(true);
        });
      }
    });
    $video.addEventListener('ended', ({ target }) => {
      const $promo = target.nextSibling;
      if ($promo) {
        $element.closest('.video-overlay').append($promo);
        target.parentNode.remove();
        $promo.classList.add('appear');
      }
    });
  } else {
    $element.innerHTML = `<iframe src="${vid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${title}"></iframe>`;
  }
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
  const canPlayInline = url && (url.includes('youtu') || url.includes('vimeo') || url.includes('/media_'));
  if (canPlayInline) {
    const $overlay = createTag('div', { class: 'video-overlay' });
    const $video = createTag('div', { class: 'video-overlay-video', id: 'video-overlay-video' });
    $overlay.appendChild($video);
    $overlay.addEventListener('click', () => {
      hideVideoModal(true);
    });
    $video.addEventListener('click', (evt) => {
      evt.stopPropagation();
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
    } else if (url.includes('/media_')) {
      vidType = 'html5';
      vidUrl = new URL(url).pathname;
    }
    playInlineVideo($video, vidUrl, vidType, title);
  } else {
    window.location.href = url;
  }
}
