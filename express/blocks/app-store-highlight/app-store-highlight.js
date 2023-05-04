/*
 * Copyright 2022 Adobe. All rights reserved.
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
  createOptimizedPicture,
  createTag,
  fetchPlaceholders,
  getIcon,
  getIconElement,
  getMetadata,
  getMobileOperatingSystem,
} from '../../scripts/scripts.js';

const imageSrcs = [
  '/express/media_1e71d9d4a13e8a8422dd1b8dbdad9a0bf4d2565f8.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_1595dccf97b235679b21f3ccd02b20efddc3f3839.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_1593e6a78c527e9799bb087cfcdb9d305a376123c.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_1d3ae36afedf6def1703f32502b30e96a30d2c7a8.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_1670698e01bd60bd8a2bc5b2e9c63b771dd9887e0.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_1d8ff5ab0f17bf993dcd73f59e09c220a98dd9337.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_169477a276ef70a1eb2b5b89a90d7eae6edd78e0c.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_10c82ab880b3859c3850e1f6ece6fa57238b8af92.jpeg?width=380&format=jpeg&optimize=medium',
  '/express/media_1e1122a588f3d5d7e6f19e27aabf5102e72457b05.jpeg?width=380&format=jpeg&optimize=medium',
];

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
    payload.copy = 'Install the Adobe Express app on your iPad or iPhone.';
  }
  if (payload.userAgent === 'Android' || payload.userAgent === 'unknown') {
    payload.copy = 'Install the Adobe Express app on your phone or tablet.';
  }
  payload.images = imageSrcs.map((imageUrl) => createOptimizedPicture(imageUrl));
}

function updatePayloadFromBlock($block, payload) {
  for (const $row of Array.from($block.children)) {
    const $divs = $row.querySelectorAll('div');
    switch ($divs[0].textContent.trim()) {
      default:
        payload.other.push($divs);
        break;
      case 'Heading':
        if (payload.userAgent === 'iOS' || payload.userAgent === 'Android') {
          payload.heading = $divs[1].textContent.trim().replace('{{dynamic-user-agent-text}}', payload.userAgent);
        }
        if (payload.userAgent === 'unknown') {
          payload.heading = $divs[1].textContent.trim().replace('{{dynamic-user-agent-text}}', 'your mobile devices');
        }
        break;
      case 'Copy':
        if (payload.userAgent === 'iOS') {
          payload.copy = $divs[1].textContent.trim().replace('{{dynamic-user-agent-text}}', 'iPad or iPhone');
        }
        if (payload.userAgent === 'Android' || payload.userAgent === 'unknown') {
          payload.copy = $divs[1].textContent.trim().replace('{{dynamic-user-agent-text}}', 'phone or tablet');
        }
        break;
      case 'Show Rating?':
        payload.showRating = $divs[1].textContent.trim().toLowerCase() === 'yes' || $divs[1].textContent.trim().toLowerCase() === 'true';
        break;
      case 'Images':
        payload.images = $divs[1].querySelectorAll('picture');
        break;
      case 'Screen Demo':
        payload.screenDemo = $divs[1].textContent.trim();
        break;
      case 'Badge Link':
        payload.badgeLink = $divs[1].textContent.trim();
        break;
    }
  }
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
  const $highlightsPlatform = createTag('div', { class: 'highlights-platform' });
  const $highlights = createTag('div', { class: 'highlights' });

  $highlightsPlatform.append($highlights);
  payload.images.forEach((image) => {
    const $previewContainer = createTag('div', { class: 'highlight' });
    $previewContainer.append(image);
    $highlights.append($previewContainer);
  });

  const $previewContainer = createTag('div', { class: 'highlight' });
  $previewContainer.append(createTag('video', {
    type: `video/${getUrlExtension(payload.screenDemo)}`,
    src: payload.screenDemo,
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
  }));
  $highlights.append($previewContainer);

  $block.append($highlightsPlatform);
}

function decorateAppStoreIcon($block, payload) {
  const $iconWrapper = createTag('a', { href: payload.badgeLink, class: 'badge' });

  if (payload.userAgent === 'iOS') {
    $iconWrapper.append(getIconElement('apple-store'));
  }
  if (payload.userAgent === 'Android') {
    $iconWrapper.append(getIconElement('google-store'));
  }

  $block.append($iconWrapper);
}

function scroll($block, height, computedStyles) {
  const $highlightsPlatform = $block.querySelector('.highlights-platform');
  const $highlightsWrapper = $highlightsPlatform.querySelector('.highlights');
  const $contentWrapper = $block.querySelector('.content-wrapper');

  $highlightsPlatform.style.height = `${height + (53 * 2)}px`;
  $highlightsWrapper.classList.add('animating');
  $contentWrapper.style.transform = 'scale(1.2)';

  document.addEventListener('scroll', () => {
    const blockPosition = $block.getBoundingClientRect();
    const blockInViewPercent = (1 - blockPosition.top / blockPosition.height) * 100;
    const blockTopToEdge = Math.round((blockPosition.top / window.innerHeight) * 100);
    const totalScroll = parseInt(computedStyles.width.replace(/\D/g, ''), 10) - window.innerWidth + 64;

    if (blockTopToEdge <= 100 && blockTopToEdge >= 30) {
      $contentWrapper.style.transform = `scale(${1 + ((blockTopToEdge - 30) * (0.2 / 70))})`;
    }

    if (blockInViewPercent <= 100 && blockInViewPercent >= 75) {
      $highlightsWrapper.style.left = `-${(totalScroll / 25) * (blockInViewPercent - 75)}px`;
    } else if (blockPosition.top < 0) {
      $highlightsWrapper.style.left = `-${totalScroll}px`;
    } else {
      $highlightsWrapper.style.left = '0px';
    }
  });
}

function initScrollAnimation($block) {
  const $highlightsPlatform = $block.querySelector('.highlights-platform');
  const $highlightsWrapper = $highlightsPlatform.querySelector('.highlights');

  if ($highlightsWrapper) {
    const $firstImg = $highlightsWrapper.querySelector('img');

    if ($firstImg) {
      $firstImg.addEventListener('load', () => {
        const computedStyles = window.getComputedStyle($highlightsWrapper);
        const height = parseInt(computedStyles.height.replace(/\D/g, ''), 10);
        scroll($block, height, computedStyles);
      });
    }
  }
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
    screenDemo: './media_1160add6fb9f21ff1d3e9a402a6eafeb6360654be.mp4',
    badgeLink: 'https://adobesparkpost.app.link/d9EzZEpk4rb',
    // other contains unwanted elements authored by mistake;
    other: [],
  };

  await fetchPlaceholders()
    .then((placeholders) => {
      if (payload.userAgent === 'iOS') {
        payload.ratingScore = placeholders['apple-store-rating-score'];
        payload.ratingCount = placeholders['apple-store-rating-count'];
      }
      if (payload.userAgent === 'Android' || payload.userAgent === 'unknown') {
        payload.ratingScore = placeholders['google-store-rating-score'];
        payload.ratingCount = placeholders['google-store-rating-count'];
      }
    });

  if (['yes', 'true', 'on'].includes(getMetadata('show-standard-app-store-blocks').toLowerCase())) {
    buildStandardPayload($block, payload);
    const enclosingMain = $block.closest('main');
    if (enclosingMain) {
      const $parentSection = $block.parentNode.parentNode;
      const $relevantRows = enclosingMain.querySelector('.template-list-horizontal-fullwidth-mini-container, .template-list-horizontal-fullwidth-mini-apipowered-spreadsheet-powered-container');
      let $elementToFollow;
      if ($relevantRows) {
        $elementToFollow = $relevantRows;
      } else {
        $elementToFollow = enclosingMain.querySelector('.columns-fullsize-center-container');
      }

      $parentSection.dataset.audience = 'mobile';

      if ($elementToFollow) {
        $elementToFollow.after($parentSection);
      }
    }
  }

  updatePayloadFromBlock($block, payload);

  $block.innerHTML = '';

  decorateContent($block, payload);
  decorateGallery($block, payload);
  decorateAppStoreIcon($block, payload);
  initScrollAnimation($block);

  const blockLinks = $block.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
}
