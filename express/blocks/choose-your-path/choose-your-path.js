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
import { createTag } from '../../scripts/scripts.js';

function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth,
  );
}

function enableMouseAnimation($block) {
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
}

export default function decorate($block) {
  const $rows = Array.from($block.children);
  const $slides = [];

  document.body.classList.add('no-scroll');
  $block.innerHTML = '';

  Array.from($rows[0].children).forEach(($linkContainer) => {
    const $link = $linkContainer.querySelector('a');
    let $slide;

    if ($link) {
      $slide = createTag('a', { href: $link.href, class: 'choose-your-path-slide' });
      $link.parentNode.remove();
    } else {
      $slide = createTag('div', { class: 'choose-your-path-slide' });
      $slide.addEventListener('click', () => {
        $block.style.opacity = '0';
        setTimeout(() => {
          $block.remove();
        }, 510);
        document.body.classList.remove('no-scroll');
      });
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
