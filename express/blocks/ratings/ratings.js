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
  createTag,
  getIcon,
  toClassName,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

function sliderFunctionality($block) {
  const $input = $block.querySelector('input[type="range');
  const $tooltip = $block.querySelector('.tooltip');
  const $tooltipText = $block.querySelector('.tooltip--text');
  const $tooltipImg = $block.querySelector('.tooltip--image');
  const $textareaLabel = $block.querySelector('.slider-comment label');
  const ratings = [
    {
      class: 'one-star',
      text: 'Upset',
      // temporarily getting images from emojipedia.
      // to-do: getIcon()
      img: '<img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/angry-face_1f620.png" />',
      textareaLabel: "What went wrong? We're on it.",
    },
    {
      class: 'two-stars',
      text: 'Dissatisfied', // to-do: use placeholder for these text values
      img: '<img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/thinking-face_1f914.png" />',
      textareaLabel: 'We value your feedback. How can we improve?',
    },
    {
      class: 'three-stars',
      text: 'Content',
      img: '<img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/upside-down-face_1f643.png" />',
      textareaLabel: 'Content is cool, but not cool enough. What can we do better?',
    },
    {
      class: 'four-stars',
      text: 'Satisfied',
      img: '<img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/apple/33/smiling-face-with-smiling-eyes_1f60a.png" />',
      textareaLabel: 'Satisfied is good, but what would make us great?',
    },
    {
      class: 'five-stars',
      text: 'Super happy',
      img: '<img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/star-struck_1f929.png" />',
      textareaLabel: "That's great, tell us what you loved.",
    },
  ];
  function update(snap = true) {
    let val = parseFloat($input.value) ?? 0;
    const index = Math.round(val);
    if (snap) {
      val = index;
      $input.value = index;
    }
    $tooltipText.innerText = ratings[index - 1].text;
    $tooltipImg.innerHTML = ratings[index - 1].img;
    $textareaLabel.innerText = ratings[index - 1].textareaLabel;
    ratings.forEach((obj) => $block.classList.remove(obj.class));
    $block.classList.add(ratings[index - 1].class);
    // set position the tooltip with the thumb
    const thumbwidth = 60; // pixels
    const pos = (val - $input.getAttribute('min')) / ($input.getAttribute('max') - $input.getAttribute('min'));
    const thumbCorrect = thumbwidth * (pos - 0.25) * -1;
    const titlepos = (pos * $input.offsetWidth) - (thumbwidth / 4) + thumbCorrect;
    $tooltip.style.right = 'auto';
    $tooltip.style.left = `${titlepos}px`;
    // show "progress" on the track
    const percent = pos * 100;
    $input.style.background = `linear-gradient(90deg, #5c5ce0 ${percent}%,#dedef9 ${percent + 0.5}%)`;
  }

  // Event listeners to update the tooltip & thumb
  $input.addEventListener('input', () => update(false));
  $input.addEventListener('change', () => update());
  $input.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
      $input.value -= 1;
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
      $input.value += 1;
    }
    update();
  });
  window.addEventListener('resize', () => update());

  // Update when click on star
  const $stars = Array.from($block.querySelectorAll('.stars'));
  $stars.forEach(($star, index) => {
    $star.addEventListener('click', () => {
      $input.value = index + 1;
      update();
    });
  });
}

function decorateRatingSlider($block) {
  const title = 'Rate our Quick Action';
  const $h2 = createTag('h2', { id: toClassName(title) });
  $h2.textContent = title;
  $block.append($h2);
  const $form = createTag('form');
  $block.append($form);
  const $slider = createTag('div', { class: 'slider' });
  $form.append($slider);
  const $input = createTag('input', {
    type: 'range', name: 'rating', id: 'rating', min: '1', max: '5', step: '0.001', value: '5', 'aria-labelledby': toClassName(title),
  });
  $slider.append($input);
  // Initial state of the slider:
  $slider.insertAdjacentHTML('afterbegin', /* html */`
    <div class="tooltip">
      <div>
        <span class="tooltip--text">Super happy</span>
        <div class="tooltip--image">
          <img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/star-struck_1f929.png" />
        <div>
      </div>
    </div>
  `);
  const star = getIcon('star');

  const textArea = "That's great, tell us what you loved."; // to-do: placeholders
  const textAreaInside = 'Your feedback (Optional)'; // to-do: placeholders

  $form.insertAdjacentHTML('beforeend', /* html */`
    <div class="slider-bottom">
      <div class="vertical-line"><button type="button" aria-label="1" class="stars one-star">${star}</button></div>
      <div class="vertical-line"><button type="button" aria-label="2" class="stars two-stars">${star.repeat(2)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="3" class="stars three-stars">${star.repeat(3)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="4" class="stars four-stars">${star.repeat(4)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="5" class="stars five-stars">${star.repeat(5)}</button></div>
    </div>
    <div class="slider-comment">
      <label for="comment">${textArea}</label>
      <textarea id="comment" name="comment" rows="5" placeholder="${textAreaInside}"></textarea>
      <input type="submit" class="button btn" value="Submit feedback">
    </div>
  `);

  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rating = $input.value;
    const comment = $form.querySelector('#comment').value;
    // eslint-disable-next-line no-console
    console.log(`${rating} stars - "${comment}"`); // test

    // to-do: submit rating.
    $block.innerHTML = `<h2>Thank you for your feedback</h2>
    <p>testing that it worked:</p>
    <p>Your rating: ${rating} stars</p>
    <p>Your comment: "${comment}"</p>`;
  });
  sliderFunctionality($block, $form);
}

export default function decorate($block) {
  $block.innerHTML = '';

  decorateRatingSlider($block);
}
