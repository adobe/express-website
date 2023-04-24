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
  const $background = block.querySelector('.hero-bg');
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
    $background.style.opacity = `${100 - percentageInView}%`;
  }, {
    passive: true
  });
}

function initializeConstants(rows, marqueeBgContent, frameBgImageContent, editorContent,
                             thumbnailsContent, videoLink, videoLooping) {
  console.log(rows);
  
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    frameBgImageContent = rows[1].querySelector('img').src;
    editorContent = rows[2].querySelector('img').src;
    const headerCols = cells[0];
    const $contentCols = cells[1];
    const anchor = headerCols?.querySelector('a');
    if (anchor && anchor.textContent.startsWith('https://') && anchor.href.endsWith('.mp4')) {
      videoLink = anchor;
    }
    videoLooping = $contentCols?.textContent?.indexOf('Y') > 0 ? 'yes' : 'no';
  });
  
  return { 
    marqueeBgContent,
    frameBgImageContent,
    editorContent,
    thumbnailsContent,
    videoLink,
    videoLooping
  };
}

function buildFullScreenDesktopMarqueeMarkup(video, frameBgImageContent, block, thumbnailsContent, editorContent, contentSection) {
  video.addEventListener('loadstart', () => {
    const $frameBg = createOptimizedPicture(frameBgImageContent);
    const pictureFrameWrapper = createTag('div', {
      class: 'picture-frame-wrapper'
    });
    const $marqueeBg = createTag('div', {
      class: 'hero-bg'
    });
    const pictureFrameBackground = createTag('div', {
      class: 'picture-frame-background'
    });
    const pictureFrame = createTag('div', {
      class: 'picture-frame'
    });
    const thumbnails = createTag('div', {
      class: 'picture-frame-thumbnails'
    });

    const existingCTA = block.querySelector('a.button');
    const doubleCTA = block.querySelector('.double');
    const singleCTA = block.querySelector('.single');
    if (existingCTA) {
      const $clickableOverlay = createTag('a', {
        class: 'picture-frame-clickable-layer',
        href: existingCTA.href
      });
      const cloneCta = existingCTA.cloneNode({
        deep: true
      });
      cloneCta.style.display = 'none';

      $clickableOverlay.append(cloneCta);
      pictureFrameWrapper.prepend($clickableOverlay);

      $clickableOverlay.addEventListener('mouseenter', () => {
        cloneCta.style.display = 'flex';
        singleCTA.style.display = 'block';
        singleCTA.style.opacity = '1';
        doubleCTA.style.display = 'none';
        doubleCTA.style.opacity = '0';
      }, {
        passive: true
      });
      $clickableOverlay.addEventListener('mouseleave', () => {
        cloneCta.style.display = 'none';
        singleCTA.style.display = 'none';
        singleCTA.style.opacity = '0';
        doubleCTA.style.display = 'block';
        doubleCTA.style.opacity = '1';
      }, {
        passive: true
      });
    }

    const thumbnailImg = createOptimizedPicture(thumbnailsContent);
    const pictureBgImg = createOptimizedPicture(editorContent);

    video.classList.add('screen-demo');
    thumbnailImg.classList.add('leaf-thumbnails');

    pictureFrame.append(pictureBgImg, video, thumbnails);
    thumbnails.append(thumbnailImg);
    $marqueeBg.append($frameBg);
    pictureFrameWrapper.append(
        pictureFrameBackground,
        pictureFrame,
    );

    block.innerHTML = '';

    block.append($marqueeBg);
    block.append(contentSection);
    block.append(pictureFrameWrapper);

    window.addEventListener('mousemove', (e) => {
      const rotateX = ((e.clientX * 10) / (window.innerWidth / 2) - 10);
      const rotateY = -((e.clientY * 10) / (window.innerHeight / 2) - 10);

      pictureFrame.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 0px)`;
      pictureFrameBackground.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, -50px)`;
    }, {
      passive: true
    });

  });
}

function buildCTAContainer($button, className) {
  const $ctaContainer = createTag('div', {
    class: className
  });
  $ctaContainer.innerHTML = $button.innerHTML; 
  $button.replaceWith($ctaContainer); 
}

function buildContentSection(block, contentSection) {
  const $h1 = block.querySelector('h1');
  const $p = block.querySelector('p');
  const $buttonContainer = block.querySelector('.button-container');
  const $singleButton = $buttonContainer.nextElementSibling;
  const $doubleButton = $singleButton.nextElementSibling;
  if ($h1) {
    const $textToColor = $h1.querySelectorAll('em');
    // TODO: need to check the styles are ok to proceed with
    if ($textToColor.length > 0) {
      $textToColor.forEach((span) => {
        const $coloredText = createTag('span', {
          class: 'colorful'
        });
        $coloredText.textContent = span.textContent;
        $h1.replaceChild($coloredText, span);
      });
    }
    contentSection = $h1.parentNode;
  }
  if ($p) {
    const $paragraphText = createTag('div', {
      class: 'sub-copy'
    });
    $paragraphText.textContent = $p.textContent;
    console.log($paragraphText);
    $p.replaceWith($paragraphText);
  }
  buildCTAContainer($singleButton, 'double');
  buildCTAContainer($doubleButton, 'single');
  const $doubleCta = block.querySelector('.double');
  const $singleCta = block.querySelector('.single');
  $singleCta.style.opacity = '0';
  $doubleCta.style.opacity = '1';
  $doubleCta.innerHTML = $buttonContainer.innerHTML + $doubleCta.innerHTML;
  $buttonContainer.replaceWith($doubleCta);

  return contentSection;
}

export default function decorate(block) {
  const rows = Array.from(block.children);
  let video, contentSection;
  const __ret = initializeConstants(rows);
  let marqueeBgContent = __ret.marqueeBgContent;
  let frameBgImageContent = __ret.frameBgImageContent;
  let editorContent = __ret.editorContent;
  let thumbnailsContent = __ret.thumbnailsContent;
  let videoLink = __ret.videoLink;
  let videoLooping = __ret.videoLooping;

  contentSection = buildContentSection(block, contentSection);
  if (marqueeBgContent) {
    const $section = block.closest('.fullscreen-marquee-desktop-container');
    styleBackgroundWithScroll($section, frameBgImageContent);
  }
  block.append(addFreePlanWidget(block.querySelector('.button-container')));
  video = transformLinkToAnimation(videoLink, videoLooping);
  if (video) {
    buildFullScreenDesktopMarqueeMarkup(video, frameBgImageContent, block, thumbnailsContent, editorContent, contentSection);
  }
}
