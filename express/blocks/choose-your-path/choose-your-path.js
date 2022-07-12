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
  const $images = $block.querySelectorAll('.choose-your-path-slide-image img');

  document.addEventListener('mousemove', (e) => {
    const maxWidth = getWidth();
    // eslint-disable-next-line no-mixed-operators
    const mousePercentage = (e.clientX * 100 / maxWidth).toFixed(2);
    const mousePosition = mousePercentage - 50;
    const leftWidth = 50 - (mousePosition / 4);
    const rightWidth = 100 - leftWidth;
    const leftImageScale = 1 - (mousePosition / 2000);
    const rightImageScale = 1 + (mousePosition / 2000);
    let leftBrightness = 100 - (mousePercentage / 2);
    let rightBrightness = 100 - ((100 - mousePercentage) / 2);

    if (leftBrightness > 100) {
      leftBrightness = 100;
    }

    if (rightBrightness > 100) {
      rightBrightness = 100;
    }

    $slides[0].style.width = `${leftWidth}%`;
    $slides[1].style.width = `${rightWidth}%`;
    $slides[0].style.filter = `brightness(${leftBrightness}%)`;
    $slides[1].style.filter = `brightness(${rightBrightness}%)`;
    $images[0].style.transform = `translateX(-50%) scale(${leftImageScale})`;
    $images[1].style.transform = `translateX(-50%) scale(${rightImageScale})`;
  });
}

export default function decorate($block) {
  const $slides = Array.from($block.children[0].children);
  $block.innerHTML = '';

  $slides.forEach(($slideContents) => {
    const $link = $slideContents.children[0].querySelector('a');
    const $header = $slideContents.children[1];
    const $background = $header.querySelector('picture');
    const $image = $slideContents.children[4].querySelector('picture');
    let $slide;

    if ($link) {
      $slide = createTag('a', { href: $link.href, class: 'choose-your-path-slide' });
      $link.parentNode.remove();
    } else {
      $slide = createTag('div', { class: 'choose-your-path-slide' });
    }

    $header.classList.add('choose-your-path-slide-title');
    $background.classList.add('choose-your-path-slide-background');
    $image.classList.add('choose-your-path-slide-image');
    $image.parentNode.remove();
    $slideContents.append($image);

    $slide.append($background);
    $slide.append($slideContents);
    $block.append($slide);
  });

  enableMouseAnimation($block);
}
