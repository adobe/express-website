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

// Updates the front-end style of the slider.
function updateSliderStyle($block, value) {
  const thumbwidth = 60;
  const $input = $block.querySelector('input[type=range]');
  const $tooltip = $block.querySelector('.tooltip');
  const pos = (value - $input.getAttribute('min')) / ($input.getAttribute('max') - $input.getAttribute('min'));
  const thumbCorrect = (thumbwidth * (pos - 0.25) * -1) - 0.1;
  const titlepos = (pos * $input.offsetWidth) - (thumbwidth / 4) + thumbCorrect;
  $tooltip.style.left = `${titlepos}px`;
  const percent = pos * 99;
  $input.style.background = `linear-gradient(90deg, #5c5ce0 ${percent}%,#dedef9 ${percent + 0.5}%)`;
}

// Implements the slider logic.
function sliderFunctionality($block) {
  const $input = $block.querySelector('input[type=range]');
  const $tooltipText = $block.querySelector('.tooltip--text');
  const $tooltipImg = $block.querySelector('.tooltip--image');
  const $textarea = $block.querySelector('.slider-comment textarea');
  const $textareaLabel = $block.querySelector('.slider-comment label');
  const $stars = Array.from($block.querySelectorAll('.stars'));
  const ratings = [
    {
      class: 'one-star',
      img: getIcon('emoji-angry-face'),
      text: 'Upset', // to-do: placeholders
      textareaLabel: "What went wrong? We're on it.", // to-do: placeholders
      textareaInside: 'Your feedback', // to-do: placeholders
      feedbackRequired: true,
    },
    {
      class: 'two-stars',
      img: getIcon('emoji-thinking-face'),
      text: 'Dissatisfied', // to-do: placeholders
      textareaLabel: 'We value your feedback. How can we improve?', // to-do: placeholders
      textareaInside: 'Your feedback', // to-do: placeholders
      feedbackRequired: true,
    },
    {
      class: 'three-stars',
      img: getIcon('emoji-upside-down-face'),
      text: 'Content', // to-do: placeholders
      textareaLabel: 'Content is cool, but not cool enough. What can we do better?', // to-do: placeholders
      textareaInside: 'Your feedback', // to-do: placeholders
      feedbackRequired: true,
    },
    {
      class: 'four-stars',
      img: getIcon('emoji-smiling-face'),
      text: 'Satisfied', // to-do: placeholders
      textareaLabel: 'Satisfied is good, but what would make us great?', // to-do: placeholders
      textareaInside: 'Your feedback (Optional)', // to-do: placeholders
      feedbackRequired: false,
    },
    {
      class: 'five-stars',
      img: getIcon('emoji-star-struck'),
      text: 'Super happy', // to-do: placeholders
      textareaLabel: "That's great, tell us what you loved.", // to-do: placeholders
      textareaInside: 'Your feedback (Optional)', // to-do: placeholders
      feedbackRequired: false,
    },
  ];
  // Updates the value of the slider and tooltip.
  function updateSliderValue(snap = true) {
    let val = parseFloat($input.value) ?? 0;
    const index = Math.round(val);
    if (snap) {
      val = index;
      $input.value = index;
    }
    $tooltipText.textContent = ratings[index - 1].text;
    $tooltipImg.innerHTML = ratings[index - 1].img;
    $textareaLabel.textContent = ratings[index - 1].textareaLabel;
    $textarea.setAttribute('placeholder', ratings[index - 1].textareaInside);
    if (ratings[index - 1].feedbackRequired) {
      $textarea.setAttribute('required', 'true');
    } else {
      $textarea.removeAttribute('required');
    }
    ratings.forEach((obj) => $block.classList.remove(obj.class));
    $block.classList.add(ratings[index - 1].class);
    updateSliderStyle($block, $input.value);
  }
  // Slider event listeners.
  $input.addEventListener('input', () => updateSliderValue(false));
  $input.addEventListener('change', () => updateSliderValue());
  $input.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
      $input.value -= 1;
      updateSliderValue();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
      $input.value += 1;
      updateSliderValue();
    }
  });
  window.addEventListener('resize', () => {
    updateSliderStyle($block, $input.value);
  });
  $stars.forEach(($star, index) => {
    $star.addEventListener('click', () => {
      $input.value = index + 1;
      updateSliderValue();
    });
  });
}

// Generates rating slider HTML.
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
    type: 'range', name: 'rating', id: 'rating', min: '1', max: '5', step: '0.001', value: '4.5', 'aria-labelledby': toClassName(title),
  });
  $slider.append($input);
  // Initial state of the slider:
  $slider.insertAdjacentHTML('afterbegin', /* html */`
    <div class="tooltip">
      <div>
        <span class="tooltip--text"></span>
        <div class="tooltip--image">
          ${getIcon('emoji-star-struck')}
        <div>
      </div>
    </div>
  `);
  updateSliderStyle($block, $input.value);

  const subtmitButtonText = 'Submit rating'; // to-do: placeholders

  const star = getIcon('star');
  $form.insertAdjacentHTML('beforeend', /* html */`
    <div class="slider-bottom">
      <div class="vertical-line"><button type="button" aria-label="1" class="stars one-star">${star}</button></div>
      <div class="vertical-line"><button type="button" aria-label="2" class="stars two-stars">${star.repeat(2)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="3" class="stars three-stars">${star.repeat(3)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="4" class="stars four-stars">${star.repeat(4)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="5" class="stars five-stars">${star.repeat(5)}</button></div>
    </div>
    <div class="slider-comment">
      <label for="comment"></label>
      <textarea id="comment" name="comment" rows="5" placeholder=""></textarea>
      <input type="submit" value="${subtmitButtonText}">
    </div>
  `);
  // Form-submit event listener.
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rating = $input.value;
    const comment = $form.querySelector('#comment').value;

    // to-do: submit rating.

    // For Testing purposes:
    $block.innerHTML = `<h2>Thank you for your feedback</h2>
    <p>testing that it worked:</p>
    <p>
      Your rating: ${rating} stars
      <br />
      Your comment: "${comment}"
    </p>`;

    window.scrollTo(0, $block.closest('.section-wrapper').offsetTop);
  });
  sliderFunctionality($block, $form);
}

export default function decorate($block) {
  $block.innerHTML = '';
  decorateRatingSlider($block);
}
