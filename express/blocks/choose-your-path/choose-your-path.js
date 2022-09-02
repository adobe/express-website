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

// eslint-disable-next-line import/no-unresolved
import {
  createTag,
  fetchPlaceholders,
  getLottie,
} from '../../scripts/scripts.js';

function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth,
  );
}

function getHeight() {
  return window.screen.height;
}

async function enableMouseAnimation($block) {
  const $slides = $block.querySelectorAll('.choose-your-path-slide ');
  const $images = $block.querySelectorAll('.choose-your-path-slide-image');

  document.addEventListener('mousemove', (e) => {
    const maxWidth = getWidth();

    if (maxWidth > 600) {
      // eslint-disable-next-line no-mixed-operators
      const mousePercentage = (e.clientX * 100 / maxWidth).toFixed(2);
      const mousePosition = mousePercentage - 50;
      const leftWidth = 50 - (mousePosition / 4);
      const rightWidth = 100 - leftWidth;
      let leftImageScale = 1.2 - (mousePosition / 2000);
      let rightImageScale = 1.2 + (mousePosition / 2000);
      let leftBrightness = 100 - ((mousePercentage - 50) / 1.5);
      let rightBrightness = 100 - ((50 - mousePercentage) / 1.5);

      if (leftBrightness > 100) {
        leftBrightness = 100;
      }

      if (rightBrightness > 100) {
        rightBrightness = 100;
      }

      if (leftImageScale < 1) {
        leftImageScale = 1;
      }

      if (rightImageScale < 1) {
        rightImageScale = 1;
      }

      $slides[0].style.width = `${leftWidth}%`;
      $slides[1].style.width = `${rightWidth}%`;
      $slides[0].style.filter = `brightness(${leftBrightness}%)`;
      $slides[1].style.filter = `brightness(${rightBrightness}%)`;
      $images[0].style.transform = `scale(${leftImageScale})`;
      $images[1].style.transform = `scale(${rightImageScale})`;
    }
  });

  window.addEventListener('resize', () => {
    const maxWidth = getWidth();

    if (maxWidth <= 600) {
      $slides[0].style.width = '100%';
      $slides[1].style.width = '100%';
      $slides[0].style.filter = 'brightness(100%)';
      $slides[1].style.filter = 'brightness(100%)';
      $images[0].style.transform = 'scale(1)';
      $images[1].style.transform = 'scale(1)';
    } else {
      $slides[0].style.width = '50%';
      $slides[1].style.width = '50%';
      $images[0].style.transform = 'scale(1.2)';
      $images[1].style.transform = 'scale(1.2)';
    }
  });
  const placeholders = await fetchPlaceholders();

  const $mouseLeftAnimation = createTag('div', { class: 'choose-your-path-mouse choose-your-path-mouse-left hidden' });
  const $mouseLeftContainer = createTag('div', { class: 'choose-your-path-mouse-container' });
  const $mouseRightAnimation = createTag('div', { class: 'choose-your-path-mouse choose-your-path-mouse-right hidden' });
  const $mouseLeftLottie = createTag('div', { class: 'choose-your-path-mouse-lottie' });
  const $mouseRightContainer = createTag('div', { class: 'choose-your-path-mouse-container' });
  const $mouseRightLottie = createTag('div', { class: 'choose-your-path-mouse-lottie' });
  $mouseLeftContainer.textContent = placeholders['choose-your-path-cc'];
  $mouseRightContainer.textContent = placeholders['choose-your-path-express'];
  $mouseLeftLottie.innerHTML = getLottie('mouse-arrow', '/express/blocks/choose-your-path/mouse-arrow.json');
  $mouseRightLottie.innerHTML = getLottie('mouse-arrow', '/express/blocks/choose-your-path/mouse-arrow.json');
  $mouseLeftAnimation.append($mouseLeftContainer);
  $mouseRightAnimation.append($mouseRightContainer);
  $mouseLeftAnimation.append($mouseLeftLottie);
  $mouseRightAnimation.append($mouseRightLottie);
  $block.append($mouseLeftAnimation);
  $block.append($mouseRightAnimation);

  document.addEventListener('mousemove', (e) => {
    setTimeout(() => {
      const maxWidth = getWidth();
      const maxHeight = getHeight();

      $mouseLeftAnimation.style.left = `${e.pageX - 60}px`;
      $mouseLeftAnimation.style.top = `${e.pageY - 160}px`;
      $mouseRightAnimation.style.left = `${e.pageX - 60}px`;
      $mouseRightAnimation.style.top = `${e.pageY - 160}px`;

      if (!$mouseLeftAnimation.classList.contains('small') && e.pageY < maxHeight / 5) {
        $mouseLeftAnimation.classList.add('small');
        $mouseLeftContainer.classList.add('hidden');
        $mouseRightAnimation.classList.add('small');
        $mouseRightContainer.classList.add('hidden');
        $slides[0].classList.add('no-mouse');
        $slides[1].classList.add('no-mouse');
      } else if ($mouseLeftAnimation.classList.contains('small') && e.pageY >= maxHeight / 5) {
        $mouseLeftAnimation.classList.remove('small');
        $mouseLeftContainer.classList.remove('hidden');
        $mouseRightAnimation.classList.remove('small');
        $mouseRightContainer.classList.remove('hidden');
        $slides[0].classList.remove('no-mouse');
        $slides[1].classList.remove('no-mouse');
      }

      if (!$mouseLeftAnimation.classList.contains('hidden') && e.pageX > maxWidth / 2) {
        $mouseLeftAnimation.classList.add('hidden');
        $mouseRightAnimation.classList.remove('hidden');
      } else if ($mouseLeftAnimation.classList.contains('hidden') && e.pageX <= maxWidth / 2) {
        $mouseLeftAnimation.classList.remove('hidden');
        $mouseRightAnimation.classList.add('hidden');
      }
    }, 100);
  });
}

export default function decorate($block) {
  const $rows = Array.from($block.children);
  const $slides = [];

  document.body.classList.add('no-scroll');
  $block.innerHTML = '';

  Array.from($rows[0].children).forEach(($linkContainer) => {
    const currentUrl = new URL(window.location.href);
    const $link = $linkContainer.querySelector('a');
    let $slide;

    if ($link) {
      const slideUrl = new URL($link.href);
      $slide = createTag('a', { class: 'choose-your-path-slide' });

      currentUrl.searchParams.forEach((value, param) => {
        if (!slideUrl.searchParams.has(param)) {
          slideUrl.searchParams.set(param, value);
        }
      });

      $slide.href = slideUrl.href;

      $link.parentNode.remove();
    } else {
      $slide = createTag('div', { class: 'choose-your-path-slide' });
    }

    $slides.push($slide);
  });

  Array.from($rows[1].children).forEach(($backgroundContainer, index) => {
    const $background = $backgroundContainer.querySelector('picture');
    $background.classList.add('choose-your-path-slide-background');
    $slides[index].append($background);
  });

  Array.from($rows[2].children).forEach(($copyContainer, index) => {
    const $header = $copyContainer.children[0];
    const $image = $copyContainer.children[2].querySelector('picture');

    $header.classList.add('choose-your-path-slide-title');
    $image.classList.add('choose-your-path-slide-image');
    $image.parentNode.remove();
    $copyContainer.append($image);
    $slides[index].append($copyContainer);
    $block.append($slides[index]);
  });

  enableMouseAnimation($block);
}
