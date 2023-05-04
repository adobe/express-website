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
  createOptimizedPicture,
  createTag,
  fetchPlaceholders,
  getIcon,
  getIconElement,
  getMetadata,
} from '../../scripts/scripts.js';

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */

function createStandardImage(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]) {
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
  const $subHeading = createTag('p');
  const $copy = createTag('p');
  const $orToLink = createTag('a', { href: 'bit.ly/3zWOkVU' });

  payload.heading = 'Create on the go with the Adobe Express app.';
  $subHeading.textContent = 'Scan QR code to download';
  $copy.textContent = 'Or, go to ';
  $orToLink.textContent = 'bit.ly/3zWOkVU';
  $copy.append($orToLink);
  payload.copyParagraphs.push($subHeading, $copy);
  payload.image = createOptimizedPicture('/express/media_19efee4e43868abe18cd3f60225041a781599614a.png?width=1160&height=816');
  payload.image.classList.add('foreground-image');
  payload.QRCode = createStandardImage('/express/blocks/app-store-blade/mobileappsblade_jdi_standard.png');
  payload.QRCode.classList.add('qr-code');
  payload.badgeLink = 'https://adobesparkpost.app.link/eOBwLjVLpsb';
}

function updatePayloadFromBlock($block, payload) {
  Array.from($block.children).forEach(($row) => {
    const $divs = $row.querySelectorAll('div');
    switch ($divs[0].textContent.trim()) {
      default:
        payload.other.push($divs);
        break;
      case 'Heading':
        payload.heading = $divs[1].textContent.trim();
        break;
      case 'Copy':
        payload.copyParagraphs = $divs[1].querySelectorAll('p');
        break;
      case 'Show Rating?':
        payload.showRating = $divs[1].textContent.trim().toLowerCase() === 'yes' || $divs[1].textContent.trim().toLowerCase() === 'true';
        break;
      case 'Image':
        payload.image = $divs[1].querySelector('picture');
        payload.image.classList.add('foreground-image');
        break;
      case 'QR Code':
        payload.QRCode = $divs[1].querySelector('picture');
        payload.QRCode.classList.add('qr-code');
        break;
      case 'Badge Link':
        payload.badgeLink = $divs[1].trim();
        break;
    }
  });
}

function buildTamplateTitle($block) {
  const $heading = $block.querySelector('.heading');
  $heading.innerHTML = $heading.innerHTML.replace('{{', '<span>');
  $heading.innerHTML = $heading.innerHTML.replace('}}', '</span>');
}

function handleClipboard($block) {
  const $orToLink = $block.querySelector('.or-to-link');
  const $innerAnchor = $orToLink.querySelector('.bitly-span');
  if (!$orToLink.classList.contains('copied')) {
    navigator.clipboard.writeText($innerAnchor.textContent.trim());
  }
  $orToLink.classList.toggle('copied');
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
    $ratingWrapper.append($editorChoice);
    $ratingWrapper.append($stars);
  }
}

function decorateBlade($block, payload) {
  const $mainContainer = createTag('div', { class: 'main-container' });
  const $heading = createTag('h3', { class: 'heading' });
  const $body = createTag('div', { class: 'body' });
  const $bodyContentWrapper = createTag('div', { class: 'body-content-wrapper' });
  const $copyWrapper = createTag('div', { class: 'copy-wrapper' });
  const $badgesWrapper = createTag('div', { class: 'badges-wrapper' });
  const $ratingWrapper = createTag('div', { class: 'rating-wrapper' });
  const appleStoreLink = createTag('a', { href: payload.badgeLink });
  const googleStoreLink = createTag('a', { href: payload.badgeLink });
  appleStoreLink.append(getIconElement('apple-store'));
  googleStoreLink.append(getIconElement('google-store'));

  $heading.textContent = payload.heading;
  for (let i = 0; i < payload.copyParagraphs.length; i += 1) {
    const paragraph = payload.copyParagraphs[i];
    $copyWrapper.append(paragraph);
    if (i === 0) {
      paragraph.classList.add('heading-small');
    }

    if (paragraph.querySelector('a')) {
      const bitlyLink = paragraph.querySelector('a');
      const bitlySpan = createTag('span', { class: 'bitly-span' });
      bitlySpan.innerHTML = bitlyLink.innerHTML;
      paragraph.replaceChild(bitlySpan, bitlyLink);
      paragraph.classList.add('or-to-link');
      paragraph.append(getIconElement('copy'));
      const $clipboardTag = createTag('span', { class: 'clipboard-tag' });
      fetchPlaceholders().then((placeholders) => {
        $clipboardTag.textContent = placeholders['tag-copied'];
      });

      paragraph.append($clipboardTag);

      paragraph.addEventListener('click', () => {
        handleClipboard($block);
      });
    }
  }

  $badgesWrapper.append(appleStoreLink, googleStoreLink);
  $bodyContentWrapper.append($copyWrapper, $badgesWrapper, $ratingWrapper);
  $body.append(payload.QRCode, $bodyContentWrapper);
  $mainContainer.append($heading, $body, payload.image);
  $block.append($mainContainer);

  buildTamplateTitle($block);

  decorateRatings($block, payload);
}

export default async function decorate($block) {
  const payload = {
    heading: '',
    copyParagraphs: [],
    showRating: true,
    ratingScore: '',
    ratingCount: '',
    image: '',
    QRCode: '',
    badgeLink: '',
    // other contains unwanted elements authored by mistake;
    other: [],
  };

  await fetchPlaceholders()
    .then((placeholders) => {
      payload.ratingScore = placeholders['apple-store-rating-score'];
      payload.ratingCount = placeholders['apple-store-rating-count'];
    });

  if (['yes', 'true', 'on'].includes(getMetadata('show-standard-app-store-blocks').toLowerCase())) {
    const enclosingMain = $block.closest('main');
    if (enclosingMain) {
      buildStandardPayload($block, payload);
      const $parentSection = $block.parentNode.parentNode;
      const $elementToFollow = enclosingMain.querySelector('.link-list-container');
      $parentSection.dataset.audience = 'desktop';

      if ($elementToFollow) {
        $elementToFollow.after($parentSection);
      }
    }
  }

  updatePayloadFromBlock($block, payload);

  $block.innerHTML = '';

  decorateBlade($block, payload);
  const blockLinks = $block.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
}
