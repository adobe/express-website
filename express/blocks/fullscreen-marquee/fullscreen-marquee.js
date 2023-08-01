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
  transformLinkToAnimation,
  createOptimizedPicture,
} from '../../scripts/scripts.js';
import { addFreePlanWidget } from '../../scripts/utils/free-plan.js';

function styleBackgroundWithScroll($section) {
  const $background = createTag('div', { class: 'marquee-background' });

  $section.prepend($background);

  const calculate = () => {
    const viewport = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight,
    };

    const elementBoundingRect = $section.getBoundingClientRect();
    const elementPos = {
      top: elementBoundingRect.y + window.scrollY,
      bottom: elementBoundingRect.y + elementBoundingRect.height + window.scrollY,
    };

    if (viewport.top > elementPos.bottom || viewport.bottom < elementPos.top) {
      return 0;
    }

    // Element is fully within viewport
    if (viewport.top < elementPos.top && viewport.bottom > elementPos.bottom) {
      return 100;
    }

    // Element is bigger than the viewport
    if (elementPos.top < viewport.top && elementPos.bottom > viewport.bottom) {
      return 100;
    }

    const elementHeight = elementBoundingRect.height;
    let elementHeightInView = elementHeight;

    if (elementPos.top < viewport.top) {
      elementHeightInView = elementHeight - (window.scrollY - elementPos.top);
    }

    if (elementPos.bottom > viewport.bottom) {
      return 100;
    }

    return (elementHeightInView / window.innerHeight) * 100;
  };

  window.addEventListener('scroll', () => {
    const percentageInView = calculate();
    $background.style.opacity = `${110 - percentageInView}%`;
  }, { passive: true });
}

export default function decorate($block) {
  const $rows = Array.from($block.children);

  $rows.forEach(($row) => {
    const $cells = Array.from($row.children);
    $cells.forEach(($cell) => {
      const $a = $cell.querySelector('a');
      if ($a) {
        if ($a.textContent.startsWith('https://')) {
          if ($a.href.endsWith('.mp4')) {
            const $video = transformLinkToAnimation($a);

            if ($video) {
              $video.addEventListener('loadstart', () => {
                const $flowers = [
                  './media_1cb8136ac752c1bb70c81e4c6e4f6745c36735d1a.png#width=500&height=437',
                  './media_107e6a2960331b70143bbc3321d6b92ef7f49e9c7.png#width=500&height=498',
                  './media_1544ba4009bb401c6a51a9a1b5e52ec47ba686cab.png#width=500&height=556',
                  './media_1c0098a95dac73540743f7b31fbd1ac7853835261.png#width=500&height=544',
                  './media_1d8381305371e958459da1ab5b9df1f2e5c086dc6.png#width=500&height=514',
                  './media_129a7f284a56bd157c4fbec64ab3cdd032725cd82.png#width=500&height=378',
                ].map((url) => createOptimizedPicture(url));

                if ($video) {
                  const $columnWrapper = $video.parentElement;
                  const $pictureFrameWrapper = createTag('div', { class: 'picture-frame-wrapper' });
                  const $flowersBoard = createTag('div', { class: 'flowers' });
                  const $pictureFrameBackground = createTag('div', { class: 'picture-frame-background' });
                  const $pictureFrame = createTag('div', { class: 'picture-frame' });
                  const $thumbnails = createTag('div', { class: 'picture-frame-thumbnails' });

                  const $existingCTA = $block.querySelector('a.button');

                  if ($existingCTA) {
                    const $clickableOverlay = createTag('a', { class: 'picture-frame-clickable-layer', href: $existingCTA.href });
                    const $cloneCta = $existingCTA.cloneNode({ deep: true });
                    $cloneCta.style.display = 'none';

                    $clickableOverlay.append($cloneCta);
                    $pictureFrameWrapper.prepend($clickableOverlay);

                    $clickableOverlay.addEventListener('mouseenter', () => {
                      $cloneCta.style.display = 'flex';
                    }, { passive: true });
                    $clickableOverlay.addEventListener('mouseleave', () => {
                      $cloneCta.style.display = 'none';
                    }, { passive: true });
                  }

                  const $thumbnailImg = createOptimizedPicture('./media_1662d0e0741d0c9b7b2573bb197f95cdd35465f54.png#width=500&height=1026');

                  $video.classList.add('screen-demo');
                  $thumbnailImg.classList.add('leaf-thumbnails');

                  $pictureFrame.append($video, $thumbnails);
                  $thumbnails.append($thumbnailImg);
                  $pictureFrameWrapper.append(
                    $pictureFrameBackground,
                    $flowersBoard,
                    $pictureFrame,
                  );

                  $flowers.forEach(($flower, index) => {
                    $flowersBoard.append($flower);
                    $flower.className = `flower flower-${index}`;
                  });

                  $block.append($pictureFrameWrapper);

                  $columnWrapper.remove();

                  window.addEventListener('mousemove', (e) => {
                    const rotateX = ((e.clientX * 10) / (window.innerWidth / 2) - 10);
                    const rotateY = -((e.clientY * 10) / (window.innerHeight / 2) - 10);

                    $pictureFrame.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 0px)`;
                    $flowersBoard.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${0 - rotateX}px, 0px, -100px)`;
                    $pictureFrameBackground.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, -50px)`;
                  }, { passive: true });
                }
              });
            }
          }
        }
      }
      if ($a && $a.classList.contains('button')) {
        const $h1 = $block.querySelector('h1');
        const $section = $block.closest('.fullscreen-marquee-container');

        if ($h1) {
          const $textToColor = $h1.querySelectorAll('em');

          if ($textToColor.length > 0) {
            $textToColor.forEach((span) => {
              const $coloredText = createTag('span', { class: 'colorful' });
              $coloredText.textContent = span.textContent;
              $h1.replaceChild($coloredText, span);
            });
          }
        }

        $a.classList.add('primaryCTA');
        styleBackgroundWithScroll($section);
        addFreePlanWidget($block.querySelector('.button-container'));
      }
    });
  });
}
