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

import { createTag, getIcon, getIconElement } from '../../scripts/scripts.js';

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

function decorateContent($block, payload) {
  const $contentWrapper = createTag('div', { class: 'content-wrapper' });
  const $heading = createTag('h3', { class: 'heading' });
  const $subHeading = createTag('p', { class: 'sub-heading' });
  const $ratingWrapper = createTag('div', { class: 'rating-wrapper' });

  $heading.textContent = payload.heading;
  $subHeading.textContent = payload.copy;

  $contentWrapper.append($heading, $subHeading, $ratingWrapper);
  $block.append($contentWrapper);

  if (payload.showRating) {
    fetch(`https://www.adobe.com/reviews-api/ccx${payload.ratingSheet}.json`)
      .then((response) => response.json())
      .then((response) => {
        let ratingTotal;
        let ratingAverage;
        if (response.data[0].Average) {
          ratingAverage = parseFloat(response.data[0].Average).toFixed(2);
        }

        if (response.data[0].Total) {
          ratingTotal = parseFloat(response.data[0].Total);
        }

        if (ratingAverage && ratingTotal) {
          const star = getIcon('star');
          const starHalf = getIcon('star-half');
          const starEmpty = getIcon('star-empty');
          const $stars = createTag('span', { class: 'rating-stars' });
          let rating = ratingAverage ?? 5;
          rating = Math.round(rating * 10) / 10; // round nearest decimal point
          const ratingAmount = ratingTotal ?? 0;
          const ratingRoundedHalf = Math.round(rating * 2) / 2;
          const filledStars = Math.floor(ratingRoundedHalf);
          const halfStars = (filledStars === ratingRoundedHalf) ? 0 : 1;
          const emptyStars = (halfStars === 1) ? 4 - filledStars : 5 - filledStars;
          $stars.innerHTML = `${star.repeat(filledStars)}${starHalf.repeat(halfStars)}${starEmpty.repeat(emptyStars)} `;
          const $votes = createTag('span', { class: 'rating-votes' });
          $votes.textContent = `${rating} • ${ratingAmount} Ratings`;
          $stars.appendChild($votes);
          $ratingWrapper.append($stars);
        }
      });
  }
}

function decorateGallery($block, payload) {
  const $gallery = createTag('div', { class: 'cards' });
  payload.images.forEach((image) => {
    const $previewContainer = createTag('div', { class: 'card' });
    $previewContainer.append(image);
    $gallery.append($previewContainer);
  });

  const $previewContainer = createTag('div', { class: 'card' });
  $previewContainer.append(createTag('video', {
    src: payload.screenDemo, autoplay: true, loop: true, muted: true,
  }));
  $gallery.append($previewContainer);

  $block.append($gallery);
}

function decorateAppStoreIcon($block, payload) {
  if (payload.userAgent === 'iOS') {
    const $iconWrapper = createTag('a', { href: payload.badgeLinks.ios });
    $iconWrapper.append(getIconElement('apple-store'));
    $block.append($iconWrapper);
  }

  if (payload.userAgent === 'Android') {
    const $iconWrapper = createTag('a', { href: payload.badgeLinks.android });
    $iconWrapper.append(getIconElement('google-store'));
    $block.append($iconWrapper);
  }
}

function initScrollAnimation($block) {
  const $contentWrapper = $block.querySelector('.content-wrapper');
  const $cards = $block.querySelector('.cards');

  $contentWrapper.style.transform = 'scale(1.2)';
  document.addEventListener('scroll', () => {
    const blockPosition = $block.getBoundingClientRect();
    const blockInViewPercent = (1 - blockPosition.top / blockPosition.height) * 100;
    const blockTopToEdge = Math.round((blockPosition.top / window.innerHeight) * 100);

    if (blockTopToEdge <= 100 && blockTopToEdge >= 30) {
      $contentWrapper.style.transform = `scale(${1 + ((blockTopToEdge - 30) * (0.2 / 70))})`;
    }

    if (blockInViewPercent <= 100 && blockInViewPercent >= 75) {
      const totalScroll = $cards.scrollWidth - window.innerWidth;
      $cards.scrollLeft = (totalScroll / 25) * (blockInViewPercent - 75);
    }
  });
}

export default function decorate($block) {
  const payload = {
    userAgent: getMobileOperatingSystem(),
    heading: '',
    copy: '',
    ratingSheet: '',
    showRating: false,
    ratingScore: 0,
    ratingCount: '',
    images: [],
    screenDemo: '',
    badgeLinks: {
      ios: '',
      android: '',
    },
    // other contains unwanted elements authored by mistake;
    other: [],
  };

  Array.from($block.children).forEach(($row) => {
    const $divs = $row.querySelectorAll('div');
    switch ($divs[0].textContent) {
      default:
        payload.other.push($divs);
        break;
      case 'Heading':
        if (payload.userAgent === 'iOS') {
          payload.heading = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', 'iOS');
        }
        if (payload.userAgent === 'Android') {
          payload.heading = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', 'Android');
        }
        break;
      case 'Copy':
        if (payload.userAgent === 'iOS') {
          payload.copy = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', 'iPad or iPhone');
        }
        if (payload.userAgent === 'Android') {
          payload.copy = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', 'phone or tablet');
        }
        break;
      case 'Rating Sheet':
        payload.ratingSheet = $divs[1].textContent;
        break;
      case 'Show Rating?':
        payload.showRating = $divs[1].textContent.toLowerCase() === 'yes' || $divs[1].textContent.toLowerCase() === 'true';
        break;
      case 'Rating Score':
        payload.ratingScore = parseFloat($divs[1].textContent);
        payload.ratingCount = $divs[3].textContent;
        break;
      case 'Images':
        payload.images = $divs[1].querySelectorAll('picture');
        break;
      case 'Screen Demo':
        payload.screenDemo = $divs[1].textContent;
        break;
      case 'iOS Badge Link':
        payload.badgeLinks.ios = $divs[1].textContent;
        break;
      case 'Android Badge Link':
        payload.badgeLinks.android = $divs[1].textContent;
        break;
    }
  });

  $block.innerHTML = '';

  decorateContent($block, payload);
  decorateGallery($block, payload);
  decorateAppStoreIcon($block, payload);

  initScrollAnimation($block);
}
