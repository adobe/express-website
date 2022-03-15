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
  const $slider = $block.querySelector('.slider');
  const $input = $slider.querySelector('input[type="range');
  const $tooltip = $slider.querySelector('.tooltip');
  const $tooltipText = $slider.querySelector('.tooltip--text');
  const $tooltipImg = $slider.querySelector('.tooltip--image img');
  const ratings = [
    {
      class: 'one-star',
      text: 'Upset',
      // temporarily getting images from emojipedia. to-do getIcon
      img: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/angry-face_1f620.png',
    },
    {
      class: 'two-stars',
      text: 'Dissatisfied', // to-do: use placeholder for these text values
      img: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/thinking-face_1f914.png',
    },
    {
      class: 'three-stars',
      text: 'Content',
      img: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/upside-down-face_1f643.png',
    },
    {
      class: 'four-stars',
      text: 'Satisfied',
      img: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/apple/33/smiling-face-with-smiling-eyes_1f60a.png',
    },
    {
      class: 'five-stars',
      text: 'Super happy',
      img: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/star-struck_1f929.png',
    },
  ];
  function update(rounded = false) {
    let val = parseFloat($input.value) ?? 0;
    const index = Math.round(val);
    if (rounded) {
      val = index;
      $input.value = index;
    }
    $tooltipText.innerText = ratings[index - 1].text;
    $tooltipImg.setAttribute('src', ratings[index - 1].img);
    ratings.forEach((obj) => $block.classList.remove(obj.class));
    $block.classList.add(ratings[index - 1].class);
    // set position the tooltip with the thumb
    const thumbwidth = 60; // pixels
    const pos = (val - $input.getAttribute('min')) / ($input.getAttribute('max') - $input.getAttribute('min'));
    const thumbCorrect = thumbwidth * (pos - 0.25) * -1;
    const titlepos = (pos * $input.offsetWidth) - (thumbwidth / 4) + thumbCorrect;
    $tooltip.style.left = `${titlepos}px`;
    // show "progress" on the track
    const percent = pos * 100;
    $input.style.background = `linear-gradient(90deg, #5c5ce0 ${percent}%,#dedef9 ${percent + 0.5}%)`;
  }
  update();
  $input.addEventListener('input', () => update(false));
  $input.addEventListener('change', () => update(true));
  window.addEventListener('resize', () => update(true));
  const $stars = Array.from($slider.querySelectorAll('.stars'));
  $stars.forEach(($star, index) => {
    $star.addEventListener('click', () => {
      $input.value = index + 1;
      update(true);
    });
  });
}

function decorateRatingSlider($block) {
  const $slider = createTag('div', { class: 'slider' });
  $block.append($slider);
  const $div = createTag('div');
  $slider.append($div);
  const $input = createTag('input', {
    type: 'range', name: 'rating', id: 'rating', min: '1', max: '5', step: '0.001', value: '5',
  });
  $div.append($input);
  $div.insertAdjacentHTML('afterbegin', /* html */`
    <div class="tooltip">
      <div>
        <span class="tooltip--text">
          Super happy <!-- to-do: use placeholder -->
        </span>
        <div class="tooltip--image">
          <!-- to-do: getIcon -->
          <img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/apple/33/smiling-face-with-smiling-eyes_1f60a.png" />
        <div>
      </div>
    </div>
  `);
  const star = getIcon('star');
  $slider.insertAdjacentHTML('beforeend', /* html */`
    <div class="slider-bottom">
      <div class="vertical-line"><span class="stars one-star">${star}</span></div>
      <div class="vertical-line"><span class="stars two-stars">${star.repeat(2)}</span></div>
      <div class="vertical-line"><span class="stars three-stars">${star.repeat(3)}</span></div>
      <div class="vertical-line"><span class="stars four-stars">${star.repeat(4)}</span></div>
      <div class="vertical-line"><span class="stars five-stars">${star.repeat(5)}</span></div>
    </div>
  `);
  sliderFunctionality($block, $slider);
}

export default function decorate($block) {
  const title = 'Rate our Quick Action';
  const $h2 = createTag('h2', { id: toClassName(title) });
  $h2.textContent = title;

  $block.innerHTML = '';
  $block.append($h2);

  decorateRatingSlider($block);
}
