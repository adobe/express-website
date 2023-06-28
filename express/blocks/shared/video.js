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

export async function fetchVideoAnalytics() {
  if (!window.videoAnalytics) {
    window.videoAnalytics = [];
    try {
      const resp = await fetch('/express/video-analytics.json');
      const json = await resp.json();
      json.data.forEach((entry) => {
        window.videoAnalytics.push(entry);
      });
    } catch (e) {
      // ignore
    }
  }
  return window.videoAnalytics;
}

async function getVideoAnalytic($video) {
  const videoAnalytics = await fetchVideoAnalytics();
  let videoAnalytic;

  videoAnalytics.forEach((analytic) => {
    if (window.location.pathname.includes(analytic.Page)) {
      const filenames = analytic.Filenames ? analytic.Filenames.split('\n') : [];

      filenames.forEach((filename) => {
        if ($video.currentSrc.includes(filename)) {
          videoAnalytic = {
            video: $video,
            parameters: {
              videoName: analytic.videoName ?? null,
              videoId: analytic.videoId ?? null,
              videoLength: $video.duration,
              product: 'Adobe Express',
              videoCategory: 'default',
              videoDescription: analytic.videoDescription ?? null,
              videoPlayer: 'html5-video',
              videoMediaType: 'VOD',
            },
          };
        }
      });
    }
  });

  return videoAnalytic;
}

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

function showVideoPromotion($video, vid) {
  const $promo = window.videoPromotions && window.videoPromotions[vid];
  const $overlay = $video.closest('.video-overlay');
  if ($promo && $promo.parentElement !== $overlay) {
    $overlay.append($promo);
    $video.closest('.video-overlay-video').remove();
    $promo.classList.add('appear');
  }
}

function getMimeType(src) {
  if (src.endsWith('.m3u8')) {
    return 'application/x-mpegURL';
  }
  return `video/${src.split('.').pop()}`;
}

function playInlineVideo($element, vidUrls = [], playerType, title, ts) {
  const [primaryUrl] = vidUrls;
  if (!primaryUrl) return;
  if (playerType === 'html5') {
    const sources = vidUrls.map((src) => `<source src="${src}" type="${getMimeType(src)}"></source>`).join('');
    const videoHTML = `<video controls playsinline autoplay>${sources}</video>`;
    $element.innerHTML = videoHTML;
    const $video = $element.querySelector('video');
    $video.addEventListener('loadeddata', async () => {
      if (ts) {
        $video.currentTime = ts;
      }
    });
    $video.addEventListener('loadeddata', async () => {
      // check for video promotion
      const videoPromos = await fetchVideoPromotions();
      const videoAnalytic = await getVideoAnalytic($video);
      const promoName = videoPromos[primaryUrl];
      if (typeof promoName === 'string') {
        $element.insertAdjacentHTML('beforeend', `<div class="promotion block" data-block-name="promotion">${promoName}</div>`);
        const $promo = $element.querySelector('.promotion');
        await loadBlock($promo, true);
        $promo.querySelector(':scope a.button').className = 'button accent';
        const $PromoClose = $promo.appendChild(createTag('div', { class: 'close' }));
        $PromoClose.addEventListener('click', () => {
          // eslint-disable-next-line no-use-before-define
          hideVideoModal(true);

          if (videoAnalytic) {
            const linksPopulated = new CustomEvent('videoclosed', { detail: videoAnalytic });
            document.dispatchEvent(linksPopulated);
          }
        });
        window.videoPromotions[primaryUrl] = $promo;
      }

      if (videoAnalytic) {
        const videoLoaded = new CustomEvent('videoloaded', { detail: videoAnalytic });
        document.dispatchEvent(videoLoaded);
      }

      $video.play();
    });
    $video.addEventListener('ended', async () => {
      // hide player and show promotion
      showVideoPromotion($video, primaryUrl);
    });

    const $videoClose = $element.appendChild(createTag('div', { class: 'close' }));
    $videoClose.addEventListener('click', async () => {
      const videoAnalytic = await getVideoAnalytic($video);

      // eslint-disable-next-line no-use-before-define
      hideVideoModal(true);

      if (videoAnalytic) {
        const linksPopulated = new CustomEvent('videoclosed', { detail: videoAnalytic });
        document.dispatchEvent(linksPopulated);
      }
    });
  } else {
    // iframe 3rd party player
    $element.innerHTML = `<iframe src="${primaryUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${title}"></iframe>`;
    const $videoClose = $element.appendChild(createTag('div', { class: 'close' }));
    $videoClose.addEventListener('click', () => {
      // eslint-disable-next-line no-use-before-define
      hideVideoModal(true);
    });
  }
  $element.classList.add(playerType);
}

export function isVideoLink(url) {
  return url.includes('youtu')
    || url.includes('vimeo')
    || /.*\/media_.*(mp4|webm|m3u8)$/.test(new URL(url).pathname);
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

export function displayVideoModal(url = [], title, push) {
  let vidUrls = typeof url === 'string' ? [url] : url;
  const [primaryUrl] = vidUrls;
  const canPlayInline = vidUrls
    .some((src) => src && isVideoLink(src));
  if (canPlayInline) {
    const $overlay = createTag('div', { class: 'video-overlay' });
    const $video = createTag('div', { class: 'video-overlay-video', id: 'video-overlay-video' });

    $overlay.appendChild($video);
    $overlay.addEventListener('click', async () => {
      hideVideoModal(true);

      const $videoElement = $video.querySelector('video');

      if ($videoElement) {
        const videoAnalytic = await getVideoAnalytic($videoElement);

        if (videoAnalytic) {
          const linksPopulated = new CustomEvent('videoclosed', { detail: videoAnalytic });
          document.dispatchEvent(linksPopulated);
        }
      }
    });
    $video.addEventListener('click', (evt) => {
      evt.stopPropagation();
    });
    window.onkeyup = async ({ key }) => {
      if (key === 'Escape') {
        hideVideoModal(true);

        const $videoElement = $video.querySelector('video');

        if ($videoElement) {
          const videoAnalytic = await getVideoAnalytic($videoElement);

          if (videoAnalytic) {
            const linksPopulated = new CustomEvent('videoclosed', { detail: videoAnalytic });
            document.dispatchEvent(linksPopulated);
          }
        }
      }
    };
    if (push) {
      // create new history entry
      window.history.pushState({ url: primaryUrl, title }, `${docTitle} | ${title}`, `#${toClassName(title)}`);
    }
    const $main = document.querySelector('main');
    $main.append($overlay);

    let vidType = 'default';
    let ts = 0;
    if (primaryUrl.includes('youtu')) {
      vidType = 'youtube';
      const yturl = new URL(primaryUrl);
      let vid = yturl.searchParams.get('v');
      if (!vid) {
        vid = yturl.pathname.substr(1);
      }
      vidUrls = [`https://www.youtube.com/embed/${vid}?feature=oembed&autoplay=1`];
    } else if (primaryUrl.includes('vimeo')) {
      vidType = 'vimeo';
      const vid = new URL(primaryUrl).pathname.split('/')[1];
      vidUrls = [`https://player.vimeo.com/video/${vid}?app_id=122963&autoplay=1`];
    } else if (primaryUrl.includes('/media_')) {
      vidType = 'html5';
      const { hash } = new URL(vidUrls[0]);
      if (hash.startsWith('#t=')) {
        ts = parseInt(hash.substring(3), 10);
        if (Number.isNaN(ts)) ts = 0;
      }
      // local video url(s), remove origin, extract timestamp
      vidUrls = vidUrls.map((vidUrl) => new URL(vidUrl).pathname);
    }
    playInlineVideo($video, vidUrls, vidType, title, ts);
  } else {
    // redirect to first video url
    [window.location.href] = vidUrls;
  }
}
