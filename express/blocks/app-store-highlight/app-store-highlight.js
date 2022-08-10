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
  createTag, getIcon, getIconElement, getMetadata, createOptimizedPicture, getMeta
} from '../../scripts/scripts.js';

const imageFiles = [
  'express/blocks/app-store-highlight/standard-images/01-Adobe-AdobeExpress-iPhone55-Splash-Screen_AdobeExpress-1242x2208-en_US.jpg',
  'express/blocks/app-store-highlight/standard-images/02-Adobe-AdobeExpress-iPhone55-Splash-Screen_AdobeExpress-1242x2208-en_US.jpg',
  'express/blocks/app-store-highlight/standard-images/03-Adobe-AdobeExpress-iPhone55-Templates-1242x2208-EN-US.jpg',
  'express/blocks/app-store-highlight/standard-images/04-Adobe-AdobeExpress-iPhone55-Stock-1242x2208-EN-US.jpg',
  'express/blocks/app-store-highlight/standard-images/05-Adobe-AdobeExpress-iPhone55-Animate-1242x2208-EN-US.jpg',
  'express/blocks/app-store-highlight/standard-images/06-Adobe-AdobeExpress-iPhone55-Effects-1242x2208-EN-US.jpg',
  'express/blocks/app-store-highlight/standard-images/07-Adobe-AdobeExpress-iPhone55-Text-1242x2208-EN-US.jpg',
  'express/blocks/app-store-highlight/standard-images/08-Adobe-AdobeExpress-iPhone55-Brand-1242x2208-EN-US.jpg',
  'express/blocks/app-store-highlight/standard-images/09-Adobe-AdobeExpress-iPhone55-Resize-1242x2208-EN-US.jpg',
];

function createStandardImage(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, window.location.origin);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

function buildStandardPayload($block, payload) {
  // load default heading
  if (payload.userAgent === 'iOS' || payload.userAgent === 'Android') {
    payload.heading = `Express it on ${payload.userAgent}.`;
  }
  if (payload.userAgent === 'unknown') {
    payload.heading = 'Express it on your mobile devices.';
  }
  // load default copy
  if (payload.userAgent === 'iOS') {
    payload.copy = 'Install the Adobe Express app on your iPad or iPhone';
  }
  if (payload.userAgent === 'Android' || payload.userAgent === 'unknown') {
    payload.copy = 'Install the Adobe Express app on your phone or tablet';
  }
  // load ratings score
  payload.ratingScore = getMetadata('app-rating-score');
  payload.ratingCount = getMetadata('app-rating-count');
  payload.images = imageFiles.map((imageUrl) => createStandardImage(imageUrl));
}

function buildPayloadFromBlock($block, payload) {
  Array.from($block.children)
    .forEach(($row) => {
      const $divs = $row.querySelectorAll('div');
      switch ($divs[0].textContent) {
        default:
          payload.other.push($divs);
          break;
        case 'Heading':
          if (payload.userAgent === 'iOS' || payload.userAgent === 'Android') {
            payload.heading = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', payload.userAgent);
          }
          if (payload.userAgent === 'unknown') {
            payload.heading = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', 'your mobile devices');
          }
          break;
        case 'Copy':
          if (payload.userAgent === 'iOS') {
            payload.copy = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', 'iPad or iPhone');
          }
          if (payload.userAgent === 'Android' || payload.userAgent === 'unknown') {
            payload.copy = $divs[1].textContent.replace('{{dynamic-user-agent-text}}', 'phone or tablet');
          }
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
        case 'Badge Link':
          payload.badgeLink = $divs[1].textContent;
          break;
      }
    });
}

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

function getUrlExtension(url) {
  return url.split(/[#?]/)[0].split('.').pop().trim();
}

function decorateRatings($block, payload) {
  const $ratingWrapper = $block.querySelector('.rating-wrapper');

  if (payload.showRating) {
    const star = getIcon('star');
    const starHalf = getIcon('star-half');
    const starEmpty = getIcon('star-empty');
    const $stars = createTag('span', { class: 'rating-stars' });
    const ratingRoundedHalf = Math.round(payload.ratingScore * 2) / 2;
    const filledStars = Math.floor(ratingRoundedHalf);
    const halfStars = (filledStars === ratingRoundedHalf) ? 0 : 1;
    const emptyStars = (halfStars === 1) ? 4 - filledStars : 5 - filledStars;
    $stars.innerHTML = `${star.repeat(filledStars)}${starHalf.repeat(halfStars)}${starEmpty.repeat(emptyStars)} `;
    const $votes = createTag('span', { class: 'rating-votes' });
    $votes.textContent = `${payload.ratingScore} • ${payload.ratingCount} Ratings`;
    $stars.appendChild($votes);
    const $editorChoice = createTag('img', { class: 'icon-editor-choice', src: '/express/icons/editor-choice.png', alt: 'editor-choice' });

    $ratingWrapper.append($stars);
    if (payload.userAgent === 'iOS') {
      $ratingWrapper.append($editorChoice);
    }
  }
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

  decorateRatings($block, payload);
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
    type: `video/${getUrlExtension(payload.screenDemo)}`,
    src: payload.screenDemo,
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
  }));
  $gallery.append($previewContainer);

  $block.append($gallery);
}

function decorateAppStoreIcon($block, payload) {
  const $iconWrapper = createTag('a', { href: payload.badgeLink });

  if (payload.userAgent === 'iOS') {
    $iconWrapper.append(getIconElement('apple-store'));
  }
  if (payload.userAgent === 'Android') {
    $iconWrapper.append(getIconElement('google-store'));
  }

  $block.append($iconWrapper);
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

export default async function decorate($block) {
  const payload = {
    userAgent: getMobileOperatingSystem(),
    heading: '',
    copy: '',
    showRating: true,
    ratingScore: 0,
    ratingCount: '',
    images: [],
    screenDemo: 'https://main--express-website--adobe.hlx3.page/media_1160add6fb9f21ff1d3e9a402a6eafeb6360654be.mp4',
    badgeLink: 'https://adobesparkpost.app.link/d9EzZEpk4rb',
    // other contains unwanted elements authored by mistake;
    other: [],
  };

  if (['yes', 'true', 'on'].includes(getMetadata('show-standard-app-store-blocks').toLowerCase())) {
    buildStandardPayload($block, payload);
  } else {
    buildPayloadFromBlock($block, payload);
  }

  $block.innerHTML = '';

  decorateContent($block, payload);
  decorateGallery($block, payload);
  decorateAppStoreIcon($block, payload);
  initScrollAnimation($block);
}
