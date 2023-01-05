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

import { createTag, getIcon } from '../../scripts/scripts.js';

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

function addCloseBtn(block) {
  const $closeBtnDiv = createTag('div', { class: 'closeBtnDiv' });
  const $closeBtnImg = createTag('img', { class: 'closeBtnImg', src: '/express/icons/close-icon.svg', alt: 'Close banner' });
  $closeBtnDiv.append($closeBtnImg);
  block.append($closeBtnDiv);
  $closeBtnDiv.addEventListener('click', () => {
    block.remove();
  });
}

function scrollDirection(block, floatingButton) {
  let $previousTouchPosition = 0;
  document.addEventListener('touchmove', (event) => {
    const $currentTouchPosition = event.touches[0].clientY;
    if ($currentTouchPosition < $previousTouchPosition) {
      block.classList.add('show');
      floatingButton.classList.add('push-up');
      setTimeout(() => {
        if (block.classList.contains('show')) {
          block.classList.add('appear');
        }
      }, 10);
    } else {
      block.classList.remove('appear');
      floatingButton.classList.remove('push-up');
      setTimeout(() => {
        if (!block.classList.contains('appear')) {
          block.classList.remove('show');
        }
      }, 500);
    }
    $previousTouchPosition = $currentTouchPosition;
  });
}

export default function decorate($block) {
  const $logo = $block.querySelector('img');
  const $title = $block.querySelector('h2');
  const $cta = $block.querySelector('a');
  const $ratings = createTag('div', { class: 'ratings' });
  const $ratingText = createTag('span', { class: 'rating-text' });
  const $addDetails = $block.querySelector('p:last-of-type');
  const ratingNumber = $ratings.textContent.split(' ')[0];
  const $secondImage = $addDetails.querySelector('img');
  const $colTwo = createTag('div', { class: 'contents' });
  const $details = createTag('div', { class: 'app-details' });
  const $floatingButton = document.querySelector('.floating-button-wrapper:not([data-audience="desktop"])');

  $logo.classList.add('main-img');
  $cta.classList.add('small');
  $ratingText.textContent = $addDetails.textContent;
  $ratings.append($ratingText);
  $secondImage.classList.add('sub-text-img');
  $block.innerHTML = '';

  $details.append($cta, $ratings, $secondImage);
  $colTwo.append($title, $details);
  $block.append($logo, $colTwo);
  $ratings.prepend(getCurrentRatingStars(ratingNumber));

  addCloseBtn($block);
  scrollDirection($block, $floatingButton);
}