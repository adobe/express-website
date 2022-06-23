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
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

import {
  displayVideoModal,
  hideVideoModal,
} from '../shared/video.js';

function createTutorialCard(title, url, time, $picture) {
  const $card = createTag('a', { class: 'tutorial-card', title, tabindex: 0 });
  const $cardTop = createTag('div', { class: 'tutorial-card-top' });
  $cardTop.innerHTML = `<div class="tutorial-card-overlay"><div class="tutorial-card-play"></div>
  <div class="tutorial-card-duration">${time}</div></div>`;
  $cardTop.querySelector(':scope .tutorial-card-play').appendChild(getIconElement('play', 44));
  $cardTop.prepend($picture);
  const $cardBottom = createTag('div', { class: 'tutorial-card-text' });
  $cardBottom.innerHTML = `<h3>${title}</h3>`;
  $card.addEventListener('click', () => {
    displayVideoModal(url, title, true);
  });
  $card.addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
      displayVideoModal(url, title);
    }
  });
  $card.appendChild($cardTop);
  $card.appendChild($cardBottom);
  const linksPopulated = new CustomEvent('linkspopulated', { detail: [$card] });
  document.dispatchEvent(linksPopulated);
  return ($card);
}

function decorateTutorials($block) {
  const $tutorials = [...$block.children];
  $tutorials.forEach(($tutorial) => {
    const [$link, $time, $picture] = [...$tutorial.children];
    const $a = $link.querySelector('a');
    const url = $a && $a.href;
    const title = $link.textContent;
    const time = $time.textContent;
    const $card = createTutorialCard(title, url, time, $picture);
    $block.appendChild($card);
    $tutorial.remove();
    // autoplay if hash matches title
    if (toClassName(title) === window.location.hash.substr(1)) {
      displayVideoModal(url, title);
    }
  });
  // handle history events
  window.addEventListener('popstate', ({ state }) => {
    hideVideoModal();
    const { url, title } = state || {};
    if (url) {
      displayVideoModal(url, title);
    }
  });
}

export default function decorate($block) {
  decorateTutorials($block);
}
