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
  const $input = $block.querySelector('input[type=range]');
  const $tooltip = $block.querySelector('.tooltip');
  const $sliderFill = $block.querySelector('.slider-fill');
  const thumbWidth = 60;
  const pos = (value - $input.getAttribute('min')) / ($input.getAttribute('max') - $input.getAttribute('min'));
  const thumbCorrect = (thumbWidth * (pos - 0.25) * -1) - 0.1;
  const titlePos = (pos * $input.offsetWidth) - (thumbWidth / 4) + thumbCorrect;
  $tooltip.style.left = `${titlePos}px`;
  $sliderFill.style.width = `${titlePos + (thumbWidth / 2)}px`;
}

// Implements the slider logic.
function sliderFunctionality($block) {
  const $input = $block.querySelector('input[type=range]');
  const $sliderFill = $block.querySelector('.slider-fill');
  const $tooltip = $block.querySelector('.tooltip');
  const $tooltipText = $block.querySelector('.tooltip--text');
  const $tooltipImg = $block.querySelector('.tooltip--image');
  const $textarea = $block.querySelector('.slider-comment textarea');
  const $textareaLabel = $block.querySelector('.slider-comment label');
  const $stars = Array.from($block.querySelectorAll('.stars'));
  const $submit = $block.querySelector('input[type=submit]');
  const $scrollAnchor = $block.querySelector('.ratings-scroll-anchor');

  const ratings = [
    {
      class: 'one-star',
      img: getIcon('emoji-angry-face'),
      text: 'Disappointing', // to-do: placeholders
      textareaLabel: "We're sorry to hear that. What went wrong?", // to-do: placeholders
      textareaInside: 'Your feedback (Required)', // to-do: placeholders
      feedbackRequired: true,
    },
    {
      class: 'two-stars',
      img: getIcon('emoji-thinking-face'),
      text: 'Insufficient', // to-do: placeholders
      textareaLabel: 'We value your feedback. How can we improve?', // to-do: placeholders
      textareaInside: 'Your feedback (Required)', // to-do: placeholders
      feedbackRequired: true,
    },
    {
      class: 'three-stars',
      img: getIcon('emoji-upside-down-face'),
      text: 'Satisfied', // to-do: placeholders
      textareaLabel: 'Satisfied is good, but what would make us great?', // to-do: placeholders
      textareaInside: 'Your feedback (Required)', // to-do: placeholders
      feedbackRequired: true,
    },
    {
      class: 'four-stars',
      img: getIcon('emoji-smiling-face'),
      text: 'Helpful', // to-do: placeholders
      textareaLabel: 'Was there more we could do to be better?', // to-do: placeholders
      textareaInside: 'Your feedback (Optional)', // to-do: placeholders
      feedbackRequired: false,
    },
    {
      class: 'five-stars',
      img: getIcon('emoji-star-struck'),
      text: 'Amazing', // to-do: placeholders
      textareaLabel: "That's great. Could you tell us what you loved?", // to-do: placeholders
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
    $block.classList.add('rated');
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
  ['mousedown', 'touchstart'].forEach((event) => {
    $input.addEventListener(event, () => {
      $tooltip.style.transition = 'none';
      $sliderFill.style.transition = 'none';
    });
  });
  let firstTime = true;
  ['mouseup', 'touchend'].forEach((event) => {
    $input.addEventListener(event, () => {
      $tooltip.style.transition = 'left .3s, right .3s';
      $sliderFill.style.transition = 'width .3s';
      if ($textarea.getAttribute('required')) {
        $textarea.focus({ preventScroll: true });
      } else {
        $submit.focus({ preventScroll: true });
      }
      if (firstTime) {
        setTimeout(() => {
          $scrollAnchor.scrollIntoViewIfNeeded(false);
        }, 450);
      } else {
        $scrollAnchor.scrollIntoViewIfNeeded(false);
      }
      firstTime = false;
    });
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
function decorateRatingSlider($block, title) {
  const $section = $block.closest('.section-wrapper');
  const $form = createTag('form');
  $block.appendChild($form);
  const $slider = createTag('div', { class: 'slider' });
  $form.appendChild($slider);
  const $input = createTag('input', {
    type: 'range', name: 'rating', id: 'rating', min: '1', max: '5', step: '0.001', value: '4.5', 'aria-labelledby': toClassName(title),
  });
  $slider.appendChild($input);
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
  $slider.appendChild(createTag('div', { class: 'slider-fill' }));

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
      <textarea id="comment" name="comment" rows="4" placeholder=""></textarea>
      <input type="submit" value="${subtmitButtonText}">
    </div>
    <div class="ratings-scroll-anchor"></div>
  `);

  // Form-submit event listener.
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rating = $input.value;
    const comment = $form.querySelector('#comment').value;

    // to-do: submit rating.

    $block.innerHTML = /* html */`
    <h2>Thank you for your feedback</h2>
    <p>
      (Testing that the block is working correctly):
      <br />
      Your rating: ${rating} stars <!-- for testing purposes -->
      <br />
      Your comment: "${comment}" <!-- for testing purposes -->
    </p>`;

    if (window.scrollY > $section.offsetTop) window.scrollTo(0, $section.offsetTop - 64);
  });
  sliderFunctionality($block, $form);
}

export default function decorate($block) {
  const $CTA = $block.querySelector('a');
  $CTA.classList.add('xlarge');
  $block.innerHTML = '';
  const title = 'Rate our Quick Action'; // to-do: placeholders
  const $h2 = createTag('h2', { id: toClassName(title) });
  $h2.textContent = title;
  const star = getIcon('star');
  const $stars = createTag('span', { class: 'rating-stars' });
  $stars.innerHTML = `${star.repeat(5)}`;
  $h2.appendChild($stars);
  $block.appendChild($h2);

  const actionUsed = true; // to-do: logic to see if the action was used.

  if (actionUsed) {
    decorateRatingSlider($block, title);
  } else {
    const $div = createTag('div', { class: 'cannot-rate' });
    const $p = createTag('p');
    $p.textContent = 'You need to use the Quick Action before you can rate it.'; // to-do: placeholders
    $div.appendChild($p);
    $div.appendChild($CTA);
    $block.appendChild($div);
  }
}
