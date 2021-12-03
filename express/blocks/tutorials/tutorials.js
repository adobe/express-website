/*
 * Copyright 2020 Adobe. All rights reserved.
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

function playInlineVideo($element, vid, type, title) {
  $element.innerHTML = `<iframe src="${vid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${title}"></iframe>`;
  $element.classList.add(type);
}

function displayTutorial(url, title) {
  const canPlayInline = url.includes('youtu') || url.includes('vimeo');
  if (canPlayInline) {
    const $overlay = createTag('div', { class: 'tutorials-overlay' });
    const $video = createTag('div', { class: 'tutorials-overlay-video', id: 'tutorials-overlay-video' });
    $overlay.appendChild($video);
    $overlay.addEventListener('click', () => {
      window.location.hash = '';
      $overlay.remove();
    });
    window.location.hash = toClassName(title);
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

  // eslint-disable-next-line no-console
  console.log(url);
}

function createTutorialCard(title, url, time, $picture) {
  const $card = createTag('div', { class: 'tutorial-card', tabstop: '0' });
  const $cardTop = createTag('div', { class: 'tutorial-card-top' });
  $cardTop.innerHTML = `<div class="tutorial-card-overlay"><div class="tutorial-card-play"></div>
  <div class="tutorial-card-duration">${time}</div></div>`;
  $cardTop.prepend($picture);
  const $cardBottom = createTag('div', { class: 'tutorial-card-text' });
  $cardBottom.innerHTML = `<h3>${title}</h3>`;
  $card.addEventListener('click', () => {
    displayTutorial(url, title);
  });
  $card.appendChild($cardTop);
  $card.appendChild($cardBottom);
  return ($card);
}

function decorateTutorials($block) {
  const $tutorials = [...$block.children];
  $tutorials.forEach(($tutorial) => {
    const [$link, $time, $picture] = [...$tutorial.children];
    const url = $link.querySelector('a').href;
    const title = $link.textContent;
    const time = $time.textContent;
    const $card = createTutorialCard(title, url, time, $picture);
    $block.appendChild($card);
    $tutorial.remove();
    if (toClassName(title) === window.location.hash.substr(1)) {
      displayTutorial(url, title);
    }
  });
}

export default function decorate($block) {
  decorateTutorials($block);
}
