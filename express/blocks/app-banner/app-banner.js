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

export default function decorate($block) {
  const $logo = $block.querySelector('img');
  $logo.classList.add('main-img');
  const $title = $block.querySelector('h2');
  const $cta = $block.querySelector('a');
  $cta.classList.add('small');
  const $ratings = createTag('div', { class: 'ratings' });
  const $ratingText = createTag('span', { class: 'rating-text' });
  const $addDetails = $block.querySelector('p:last-of-type');
  $ratingText.textContent = $addDetails.textContent;
  $ratings.append($ratingText);
  const ratingNumber = $ratings.textContent.split(' ')[0];
  const $secondImage = $addDetails.querySelector('img');
  $secondImage.classList.add('sub-text-img');
  $block.innerHTML = '';

  $block.append($logo);
  const $colTwo = createTag('div', { class: 'contents' });
  const $details = createTag('div', { class: 'app-details' });

  $colTwo.append($title);
  $details.append($cta);
  $details.append($ratings);
  $details.append($secondImage);
  $colTwo.append($details);
  $block.append($colTwo);

  $ratings.prepend(getCurrentRatingStars(ratingNumber));
  addCloseBtn($block);
}
