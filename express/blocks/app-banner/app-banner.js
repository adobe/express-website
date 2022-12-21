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
  removeDomLevelBelow,
  replaceParentwChild,
  getIcon,
} from '../../scripts/scripts.js';

function getCurrentRatingStars(rating = 5) {
  const star = getIcon('star');
  const starHalf = getIcon('star-half');
  const starEmpty = getIcon('star-empty');
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
  const $clostBtnDiv = createTag('div', { class: 'closeBtnDiv' });
  const $clostBtnImg = createTag('img', { class: 'closeBtnImg', src: '/express/icons/close-icon.svg' });
  $clostBtnDiv.append($clostBtnImg);
  block.append($clostBtnDiv);

  $clostBtnDiv.addEventListener('click', () => {
    block.remove();
  });
}

export default function decorate($block) {
  const $logo = $block.querySelector('p');
  const $cta = $block.querySelectr('a');
  $cta.classList.add('cta');

  // Remove unecesary divs
  removeDomLevelBelow($block);
  removeDomLevelBelow($block);

  // Create a div for the second column
  const $colTwo = createTag('div', { class: 'colTwo' });
  [...$block.children].slice(1).forEach((child) => {
    $colTwo.appendChild(child);
  });
  $block.appendChild($colTwo);

  // Wrap the app details in a div
  const $pTags = $colTwo.querySelectorAll('p');
  const $details = createTag('div', { class: 'details' });
  $pTags.forEach((pTag) => {
    $details.appendChild(pTag);
  });
  $colTwo.appendChild($details);

  // remove p tag from the logo
  replaceParentwChild($logo);
  replaceParentwChild($cta.parentElement);

  // Move imgs out of p tag to the end of the 'details' div
  $details.querySelectorAll('img').forEach((image) => {
    $details.appendChild(image);
  });

  const $ratings = $details.querySelector('p');
  $ratings.classList.add('ratings');
  const ratingNumber = $ratings.textContent.split(' ')[0];
  $ratings.prepend(getCurrentRatingStars(ratingNumber));

  addCloseBtn($block);
}
