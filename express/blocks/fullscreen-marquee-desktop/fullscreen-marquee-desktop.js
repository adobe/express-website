/*
 * Copyright 2023 Adobe. All rights reserved.
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
  addFreePlanWidget,
} from '../../scripts/scripts.js';

function styleBackgroundWithScroll($section, $marqueeBgImgSrc) {
  const $background = createTag('div', { class: 'marquee-background' });
  const $marqueeBg = createOptimizedPicture($marqueeBgImgSrc);
  $background.append($marqueeBg);
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
  let $video, $videoLink, $marqueeBgContent, $frameBgImageContent, $thumbnailsContent, $editorContent, $contentSection, $videoLooping;
  $rows.forEach(($row) => {
    const $cells = Array.from($row.children);
    const $headerCols = $cells[0];
    const $contentCols = $cells[1];
    const $imgSrc = $contentCols.querySelector('img')?.src;
    const $a = $contentCols.querySelector('a');
    switch ($headerCols.textContent) {
      case 'content':
        if ($a && $a.classList.contains('button')) {
          $a.classList.add('primaryCTA');
        }
        break;
      case 'marquee-background':
        $marqueeBgContent = $imgSrc;
        break;
      case 'picture-frame-background':
        $frameBgImageContent = $imgSrc;
        break;
      case 'editor':
        $editorContent = $imgSrc;
        break;
      case 'thumbnails':
        $thumbnailsContent = $imgSrc;
        break;
      case 'video':
        if ($a && $a.textContent.startsWith('https://') && $a.href.endsWith('.mp4')) {
          $videoLink = $a;
        }
        break;
      case 'video-looping':
        $videoLooping = $contentCols.textContent;
        break;
      default: break;
    }
  });

  const $h1 = $block.querySelector('h1');
  const $section = $block.closest('.fullscreen-marquee-desktop-container');
  if ($h1) {
    $contentSection = $h1.parentNode;
    const $textToColor = $h1.querySelectorAll('em');
    if ($textToColor.length > 0) {
      $textToColor.forEach((span) => {
        const $coloredText = createTag('span', { class: 'colorful' });
        $coloredText.textContent = span.textContent;
        $h1.replaceChild($coloredText, span);
      });
    }
  }
  styleBackgroundWithScroll($section, $marqueeBgContent);
  $block.append(addFreePlanWidget($block.querySelector('.button-container')));
  $video = transformLinkToAnimation($videoLink, $videoLooping);
  if ($video) {
    $video.addEventListener('loadstart', () => {
      const $flowers = createOptimizedPicture($frameBgImageContent);
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

      const $thumbnailImg = createOptimizedPicture($thumbnailsContent);
      const $pictureBgImg = createOptimizedPicture($editorContent);

      $video.classList.add('screen-demo');
      $thumbnailImg.classList.add('leaf-thumbnails');

      $pictureFrame.append($pictureBgImg, $video, $thumbnails);
      $thumbnails.append($thumbnailImg);
      $pictureFrameWrapper.append(
          $pictureFrameBackground,
          $flowersBoard,
          $pictureFrame,
      );

      $flowersBoard.append($flowers);
      $block.innerHTML = '';

      $block.append($contentSection);
      $block.append($pictureFrameWrapper);

      window.addEventListener('mousemove', (e) => {
        const rotateX = ((e.clientX * 10) / (window.innerWidth / 2) - 10);
        const rotateY = -((e.clientY * 10) / (window.innerHeight / 2) - 10);

        $pictureFrame.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 0px)`;
        $flowersBoard.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${0 - rotateX}px, 0px, -100px)`;
        $pictureFrameBackground.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, -50px)`;
      }, { passive: true });

    });
  }
}
