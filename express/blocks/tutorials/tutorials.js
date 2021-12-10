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
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js?ccx';

const docTitle = document.title;

function playInlineVideo($element, vid, type, title) {
  $element.innerHTML = `<iframe src="${vid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${title}"></iframe>`;
  $element.classList.add(type);
}

function hideTutorial(push) {
  const $overlay = document.querySelector('main .tutorials-overlay');
  if ($overlay) {
    $overlay.remove();
    window.onkeyup = null;
  }
  if (push) {
    // create new history entry
    window.history.pushState({}, docTitle, window.location.href.split('#')[0]);
  }
}

function displayTutorial(url, title, push) {
  const canPlayInline = url.includes('youtu') || url.includes('vimeo');
  if (canPlayInline) {
    const $overlay = createTag('div', { class: 'tutorials-overlay' });
    const $video = createTag('div', { class: 'tutorials-overlay-video', id: 'tutorials-overlay-video' });
    $overlay.appendChild($video);
    $overlay.addEventListener('click', () => {
      hideTutorial(true);
    });
    window.onkeyup = ({ key }) => {
      if (key === 'Escape') {
        hideTutorial(true);
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

function createTutorialCard(title, url, time, $picture) {
  const $card = createTag('a', { class: 'tutorial-card', title, tabindex: 0 });
  const $cardTop = createTag('div', { class: 'tutorial-card-top' });
  $cardTop.innerHTML = `<div class="tutorial-card-overlay"><div class="tutorial-card-play"></div>
  <div class="tutorial-card-duration">${time}</div></div>`;
  $cardTop.prepend($picture);
  const $cardBottom = createTag('div', { class: 'tutorial-card-text' });
  $cardBottom.innerHTML = `<h3>${title}</h3>`;
  $card.addEventListener('click', () => {
    displayTutorial(url, title, true);
  });
  $card.addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
      displayTutorial(url, title);
    }
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
  // handle history events
  window.addEventListener('popstate', ({ state }) => {
    hideTutorial();
    const { url, title } = state;
    if (url) {
      displayTutorial(url, title);
    }
  });
}

export default function decorate($block) {
  decorateTutorials($block);
}
