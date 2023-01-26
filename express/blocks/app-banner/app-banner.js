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
  createTag,
  getIcon,
  getMobileOperatingSystem,
  fetchPlaceholders,
  getIconElement,
} from '../../scripts/scripts.js';

async function buildPayload($block) {
  const payload = {
    userAgent: getMobileOperatingSystem(),
    ratingScore: 0,
    ratingCount: '',
  };

  const $floatingButton = document.querySelector('.floating-button-wrapper[data-audience="mobile"]');
  const $section = $block.closest('.section');

  if ($floatingButton) {
    payload.floatingButton = $floatingButton;
  }

  if ($section) {
    payload.section = $section;
  }

  await fetchPlaceholders().then((placeholders) => {
    if (payload.userAgent === 'iOS') {
      payload.ratingScore = placeholders['apple-store-rating-score'];
      payload.ratingCount = placeholders['apple-store-rating-count'];
    } else {
      payload.ratingScore = placeholders['google-store-rating-score'];
      payload.ratingCount = placeholders['google-store-rating-count'];
    }
  });

  return payload;
}

function getCurrentRatingStars(rating = 5) {
  const star = getIcon('star', 'Full star');
  const starHalf = getIcon('star-half', 'Half star');
  const starEmpty = getIcon('star-empty', 'Empty star');
  const stars = createTag('span', { class: 'rating-stars' });
  let newRating = rating;
  if (newRating > 5) newRating = 5;
  newRating = Math.round(newRating * 10) / 10; // round nearest decimal point
  const newRatingRoundedHalf = Math.round(newRating * 2) / 2;
  const filledStars = Math.floor(newRatingRoundedHalf);
  const halfStars = (filledStars === newRatingRoundedHalf) ? 0 : 1;
  const emptyStars = (halfStars === 1) ? 4 - filledStars : 5 - filledStars;
  stars.innerHTML = `${star.repeat(filledStars)}${starHalf.repeat(halfStars)}${starEmpty.repeat(emptyStars)}`;
  const votes = createTag('span', { class: 'rating-votes' });
  stars.appendChild(votes);
  return stars;
}

function addCloseBtn(block, payload) {
  const $background = payload.section.querySelector('.gradient-background');
  const $closeBtnDiv = createTag('div', { class: 'close-btn-div' });
  const $closeBtnImg = getIconElement('close-icon');

  $closeBtnDiv.append($closeBtnImg);
  block.append($closeBtnDiv);

  $closeBtnDiv.addEventListener('click', () => {
    payload.section.classList.add('block-removed');
    payload.floatingButton.classList.remove('push-up');
    block.remove();

    setTimeout(() => {
      $background.remove();
      payload.floatingButton.classList.remove('no-background');
    }, 600);
  });
}

function initScrollDirection(block, payload) {
  const background = payload.section.querySelector('.gradient-background');
  let lastScrollTop = 0;

  document.addEventListener('scroll', () => {
    if (!payload.section.classList.contains('block-removed')) {
      const { scrollTop } = document.documentElement;
      if (scrollTop < lastScrollTop) {
        block.classList.remove('appear');
        payload.floatingButton.classList.remove('push-up');
        setTimeout(() => {
          if (!block.classList.contains('appear')) {
            payload.floatingButton.classList.remove('no-background');
            background.classList.remove('show');
            block.classList.remove('show');
          }
        }, 600);
      } else {
        block.classList.add('show');
        payload.floatingButton.classList.add('push-up', 'no-background');
        background.classList.add('show');
        setTimeout(() => {
          if (block.classList.contains('show')) {
            block.classList.add('appear');
          }
        }, 10);
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }
  }, { passive: true });
}

function decorateBanner($block, payload) {
  const $logo = $block.querySelector('img');
  const $title = $block.querySelector('h2');
  const $cta = $block.querySelector('a');
  const $addDetails = $block.querySelector('p:last-of-type');
  const $secondImage = $addDetails.querySelector('img');

  const $ratings = createTag('div', { class: 'ratings' });
  const $ratingText = createTag('span', { class: 'rating-text' });
  const $background = createTag('div', { class: 'gradient-background' });
  const $colTwo = createTag('div', { class: 'contents' });
  const $details = createTag('div', { class: 'app-details' });

  $ratingText.textContent = `${payload.ratingScore} • ${payload.ratingCount} ${$addDetails.textContent}`;
  const ratingNumber = payload.ratingScore;

  $logo.classList.add('main-img');
  $cta.classList.add('small');
  $secondImage.classList.add('sub-text-img');
  $block.innerHTML = '';

  $ratings.append($ratingText);
  $details.append($cta, $ratings, $secondImage);
  $colTwo.append($title, $details);
  $block.append($logo, $colTwo);
  payload.section.prepend($background);
  $ratings.prepend(getCurrentRatingStars(ratingNumber));
}

export default async function decorate($block) {
  const payload = await buildPayload($block);
  decorateBanner($block, payload);
  addCloseBtn($block, payload);
  initScrollDirection($block, payload);
}
