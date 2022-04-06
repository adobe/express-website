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
  fetchPlaceholders,
  getIcon,
  getIconElement,
  getLottie,
  getLocale,
  toClassName,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

// eslint-disable-next-line import/no-unresolved
import Context from '../../scripts/context.js';

let ratings;
let submissionTitle;
let submissionText;

fetchPlaceholders().then((placeholders) => {
  ratings = [
    {
      class: 'one-star',
      img: getIconElement('emoji-angry-face'),
      text: placeholders['one-star-rating'],
      textareaLabel: placeholders['one-star-rating-text'],
      textareaInside: placeholders['one-star-rating-input'],
      feedbackRequired: true,
    },
    {
      class: 'two-stars',
      img: getIconElement('emoji-thinking-face'),
      text: placeholders['two-star-rating'],
      textareaLabel: placeholders['two-star-rating-text'],
      textareaInside: placeholders['two-star-rating-input'],
      feedbackRequired: true,
    },
    {
      class: 'three-stars',
      img: getIconElement('emoji-upside-down-face'),
      text: placeholders['three-star-rating'],
      textareaLabel: placeholders['three-star-rating-text'],
      textareaInside: placeholders['three-star-rating-input'],
      feedbackRequired: true,
    },
    {
      class: 'four-stars',
      img: getIconElement('emoji-smiling-face'),
      text: placeholders['four-star-rating'],
      textareaLabel: placeholders['four-star-rating-text'],
      textareaInside: placeholders['four-star-rating-input'],
      feedbackRequired: false,
    },
    {
      class: 'five-stars',
      img: getIconElement('emoji-star-struck'),
      text: placeholders['five-star-rating'],
      textareaLabel: placeholders['five-star-rating-text'],
      textareaInside: placeholders['five-star-rating-input'],
      feedbackRequired: false,
    },
  ];

  submissionTitle = placeholders['rating-submission-title'];
  submissionText = placeholders['rating-submission-text'];
});

function hasRated(sheet) {
  // dev mode: check use-rating query parameter
  const u = new URL(window.location.href);
  const param = u.searchParams.get('action-rated');
  if (param) {
    if (param === 'true') return true;
    if (param === 'false') return false;
  }

  // "production" mode: check for localStorage
  const ccxActionRatings = localStorage.getItem('ccxActionRatings');
  return (ccxActionRatings && ccxActionRatings.includes(sheet));
}

function determineActionUsed() {
  // dev mode: check action-used query parameter
  const u = new URL(window.location.href);
  const param = u.searchParams.get('action-used');
  if (param) {
    if (param === 'true') return true;
    if (param === 'false') return false;
  }

  // "production" mode: check for audience
  const audiences = Context.get('audiences');
  return (audiences && audiences.includes('24241150'));
}

function submitRating(sheet, rating, comment) {
  const content = {
    data: [
      {
        name: 'Segments',
        value: Context.get('audiences') ?? '',
      },
      {
        name: 'Locale',
        value: getLocale(window.location),
      },
      {
        name: 'Rating',
        value: rating,
      },
      {
        name: 'Timestamp',
        value: new Date().toLocaleString(),
      },
      {
        name: 'Comment',
        value: comment,
      },
    ],
  };

  fetch(`https://www.adobe.com/reviews-api/ccx${sheet}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });

  let ccxActionRatings = localStorage.getItem('ccxActionRatings');

  if (ccxActionRatings) {
    ccxActionRatings.push(sheet);
  } else {
    ccxActionRatings = [sheet];
  }

  localStorage.setItem('ccxActionRatings', ccxActionRatings);
}

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
  const $commentBox = $block.querySelector('.slider-comment');
  const $timer = createTag('div', { class: 'timer' });
  // Countdown timer to auto-submit
  const countdown = (bool) => {
    if (bool) {
      $timer.innerHTML = getLottie('countdown', '/express/blocks/ratings/countdown.json', false);
      let counter = 10;
      window.ratingSubmitCountdown = setInterval(() => {
        if (counter > 0) {
          counter -= 1;
        } else {
          clearInterval(window.ratingSubmitCountdown);
          $submit.click();
        }
        // eslint-disable-next-line no-console
        console.log(`rating will be submitted in: ${counter} seconds.`);
      }, 950);
    } else if (window.ratingSubmitCountdown) clearInterval(window.ratingSubmitCountdown);
  };
  // Updates the comment box
  const updateCommentBoxAndTimer = () => {
    const val = parseFloat($input.value) ?? 0;
    const index = Math.round(val);
    if (val !== index) return;
    if (ratings[index - 1].feedbackRequired || $textarea.value !== '') {
      $commentBox.classList.add('submit--appear');
      $timer.remove();
      countdown(false);
    } else {
      $commentBox.classList.remove('submit--appear');
      $stars[index - 1].parentElement.appendChild($timer);
      countdown(true);
    }
    $commentBox.classList.add('comment--appear');
  };
  // Updates the value of the slider and tooltip.
  const updateSliderValue = (snap = true) => {
    $timer.remove();
    countdown(false);
    let val = parseFloat($input.value) ?? 0;
    const index = Math.round(val);
    if (snap) {
      val = index;
      $input.value = index;
      updateCommentBoxAndTimer();
    }
    $tooltipText.textContent = ratings[index - 1].text;
    $tooltipImg.innerHTML = '';
    $tooltipImg.appendChild(ratings[index - 1].img);
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
  };
  // Slider event listeners.
  $input.addEventListener('input', () => updateSliderValue(false));
  $input.addEventListener('change', () => updateSliderValue());
  let firstTimeInteract = true;
  const scrollToScrollAnchor = () => {
    if (firstTimeInteract) {
      setTimeout(() => {
        $scrollAnchor.scrollIntoViewIfNeeded(false);
      }, 450); // Allows for comment slide animation.
      firstTimeInteract = false;
    } else {
      $scrollAnchor.scrollIntoViewIfNeeded(false);
    }
  };
  $input.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
      $input.value -= 1;
      updateSliderValue();
      scrollToScrollAnchor();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
      $input.value += 1;
      updateSliderValue();
      scrollToScrollAnchor();
    }
  });
  ['mousedown', 'touchstart'].forEach((event) => {
    $input.addEventListener(event, () => {
      $tooltip.style.transition = 'none';
      $sliderFill.style.transition = 'none';
    });
  });
  ['mouseup', 'touchend'].forEach((event) => {
    $input.addEventListener(event, () => {
      $tooltip.style.transition = 'left .3s, right .3s';
      $sliderFill.style.transition = 'width .3s';
      //  remove next 3 lines after timer has been added.
      if (!$textarea.getAttribute('required') || $textarea.value !== '') {
        $submit.focus({ preventScroll: true });
      }
      scrollToScrollAnchor();
    });
  });
  window.addEventListener('resize', () => {
    updateSliderStyle($block, $input.value);
  });
  // Stars event listeners.
  $stars.forEach(($star, index) => {
    $star.addEventListener('click', () => {
      $input.value = index + 1;
      updateSliderValue();
      scrollToScrollAnchor();
    });
  });
  $textarea.addEventListener('focus', () => {
    $commentBox.classList.add('submit--appear');
    $timer.remove();
    countdown(false);
  });
}

// Gets the current rating and returns star span element.
function getCurrentRatingStars() {
  const star = getIcon('star');
  const starHalf = getIcon('star-half');
  const starEmpty = getIcon('star-empty');
  const $stars = createTag('span', { class: 'rating-stars' });

  const rating = 3.6; // to-do: get correct rating.
  const ratingAmount = 75694; // to-do: get correct number of ratings.

  if (ratingAmount >= 10000) {
    const ratingRoundedHalf = Math.round(rating * 2) / 2;
    const filledStars = Math.floor(ratingRoundedHalf);
    const halfStars = (filledStars === ratingRoundedHalf) ? 0 : 1;
    const emptyStars = (halfStars === 1) ? 4 - filledStars : 5 - filledStars;
    $stars.innerHTML = `${star.repeat(filledStars)}${starHalf.repeat(halfStars)}${starEmpty.repeat(emptyStars)}`;
    const $votes = createTag('span', { class: 'rating-votes' });
    const votesText = 'Votes'; // to-do: placeholders
    $votes.innerHTML = `<strong>${rating} / 5</strong> - ${ratingAmount} ${votesText}`;
    $stars.appendChild($votes);
  } else {
    $stars.innerHTML = `${star.repeat(5)}`;
  }
  return $stars;
}

// Decorates the rating Form and Slider HTML.
function decorateRatingSlider($block, title, sheet) {
  const $h2 = createTag('h2', { id: toClassName(title) });
  $h2.textContent = title;
  const $stars = getCurrentRatingStars();
  $h2.appendChild($stars);
  $block.appendChild($h2);
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
  const submitButtonText = 'Submit rating'; // to-do: placeholders
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
      <input type="submit" value="${submitButtonText}">
    </div>
    <div class="ratings-scroll-anchor"></div>
  `);
  // Form-submit event listener.
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rating = $input.value;
    const comment = $form.querySelector('#comment').value;
    submitRating(sheet, rating, comment);
    $block.innerHTML = /* html */`
    <h2>${submissionTitle}</h2>
    <div class="no-slider">
      <p>${submissionText}</p>
    </div>`;
    if (window.scrollY > $section.offsetTop) window.scrollTo(0, $section.offsetTop - 64);
  });
  sliderFunctionality($block, $form);
}

function buildRatingSchema() {
  fetch('https://www.adobe.com/reviews-api/ccx/dev/remove-background.json')
    .then((response) => response.json())
    .then((response) => {
      // actually build the schema.
    });
}

// Decorate block state when user is not allowed to rate (already rated / hasn't used block)
function decorateCannotRateBlock($block, title, paragraph, $CTA = null) {
  const $h2 = createTag('h2', { id: toClassName(title) });
  $h2.textContent = title;
  const $stars = getCurrentRatingStars();
  $h2.appendChild($stars);
  $block.appendChild($h2);
  const $textAndCTA = createTag('div', { class: 'no-slider' });
  const $p = createTag('p');
  $p.textContent = paragraph;
  $textAndCTA.appendChild($p);
  if ($CTA) $textAndCTA.appendChild($CTA);
  $block.appendChild($textAndCTA);
}

// Determine if user is allowed to rate, and then re-decorate the block.
function regenerateBlockState($block, title, $CTA, sheet) {
  $block.innerHTML = '';
  const actionRated = hasRated(sheet);
  const actionUsed = determineActionUsed();
  if (actionRated) {
    const titleText = 'This Quick Action is rated'; // to-do: placeholders
    const paragraphText = 'You have already submitted your rating for this action. Thank you for your feedback!'; // to-do: placeholders
    decorateCannotRateBlock($block, titleText, paragraphText);
  } else if (actionUsed) {
    decorateRatingSlider($block, title, sheet);
  } else {
    const paragraphText = 'You need to use the Quick Action before you can rate it.'; // to-do: placeholders
    decorateCannotRateBlock($block, title, paragraphText, $CTA);
  }
}

// Lazy-load lottie player if you scroll to ratings block.
function lazyLoadLottiePlayer($block) {
  let alreadyLoaded = false;
  const loadLottiePlayer = () => {
    if (alreadyLoaded) return;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '/express/scripts/lottie-player-min.js';
    document.head.appendChild(script);
    alreadyLoaded = true;
  };
  const observer = (entries) => {
    const entry = entries[0];
    if (entry.isIntersecting) {
      if (entry.intersectionRatio >= 0.25) {
        loadLottiePlayer();
      }
    }
  };
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: [0.0, 0.25],
  };
  const intersectionObserver = new IntersectionObserver(observer, options);
  intersectionObserver.observe($block);
}

// Initiate ratings block
export default function decorate($block) {
  const $title = $block.querySelector('h2');
  const title = $title ? $title.textContent : 'Rate our Quick Action'; // to-do: placeholders
  const $sheet = $block.querySelector('strong');
  const sheet = $sheet.textContent;
  const $CTA = $block.querySelector('a');
  $CTA.classList.add('xlarge');
  $block.innerHTML = '';

  // to-do: listen for state-change then call function below whenever it changes.
  regenerateBlockState($block, title, $CTA, sheet);

  buildRatingSchema();

  // Lazy-load lottie player:
  if (document.readyState === 'complete') {
    lazyLoadLottiePlayer($block);
  } else {
    window.addEventListener('load', () => {
      lazyLoadLottiePlayer($block);
    });
  }
}
