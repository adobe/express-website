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

import { createTag, getLottie, lazyLoadLottiePlayer } from '../../scripts/scripts.js';

async function fetchCircleImages(link) {
  const resp = await fetch(`${link}`);
  const json = await resp.json();
  return json.data;
}

const grabImageSet = (category, imageData) => {
  const targetRow = imageData.find((row) => category.toLowerCase() === row.Category.toLowerCase());
  return Object.values(targetRow).slice(1);
};

const buildDropdownList = (circle) => {
  const list = createTag('ul', { class: 'dropdown' });
  circle.dropDownOptions.forEach((option) => {
    const li = createTag('li');
    const aTag = createTag('a');
    const label = createTag('span');

    label.textContent = option.text;
    aTag.href = option.link;
    aTag.append(option.icon, label);
    li.append(aTag);
    list.append(li);
  });
  return list;
};

const extractContent = async (block) => {
  const circleList = [];
  const imagesLink = block.firstElementChild.textContent.trim();
  const imageData = await fetchCircleImages(imagesLink);
  const circleRows = Array.from(block.children).slice(1);

  circleRows.forEach((row) => {
    const circleObject = {};
    const dropDownOptions = [];
    let imageLinks;
    const defaultLink = row.firstElementChild.querySelector('a')?.getAttribute('href') ?? '';
    let imageLinks;
    const label = row.firstElementChild.textContent.trim();
    const colArray = Array.from(row.children);

    if (colArray.length > 2) {
      imageLinks = grabImageSet(label, imageData);
      for (let i = 1; i < colArray.length; i += 1) {
        dropDownOptions.push({
          icon: colArray[i].querySelector('svg'),
          text: colArray[i].querySelector('a')?.textContent.trim(),
          link: colArray[i].querySelector('a')?.getAttribute('href') ?? '',
        });
      }
      circleObject.imageLinks = imageLinks;
      circleObject.dropDownOptions = dropDownOptions;
    } else if (colArray.length === 2) {
      circleObject.lottie = getLottie('blank-canvas', '/express/blocks/circle-list-desktop/blank-canvas.json');
      circleObject.subText = colArray[1].textContent.trim();
      circleObject.type = 'lottie';
    }
    circleObject.label = label;
    circleObject.defaultLink = defaultLink;
    circleList.push(circleObject);
  });
  block.innerHTML = '';
  return circleList;
};

const buildCircleList = (block, circles) => {
  const circleContainer = createTag('div', { class: 'circles-container' });
  circles.forEach((circle) => {
    const circleWrapper = createTag('div', { class: 'circle-wrapper' });
    const defaultLink = createTag('a');

    defaultLink.href = circle.defaultLink;
    if (circle.type !== 'lottie') {
      const imageWrapper = createTag('div', { class: 'img-wrapper' });
      const heroImage = createTag('img', { class: 'hero-img' });
      [heroImage.src] = circle.imageLinks;
      imageWrapper.append(heroImage);

      for (let i = 1; i < circle.imageLinks.length; i += 1) {
        const altImg = createTag('img', { class: 'alt-img' });
        altImg.src = circle.imageLinks[i];
        imageWrapper.append(altImg);
      }

      circleWrapper.append(imageWrapper);
      circleWrapper.append(buildDropdownList(circle));
    } else {
      const lottieWrapper = createTag('div', { class: 'lottie-wrapper' });
      lazyLoadLottiePlayer();
      const lottie = createTag('div', { class: 'lottie-animation' });
      lottie.innerHTML = circle.lottie;
      lottieWrapper.append(lottie);
      circleWrapper.append(lottieWrapper);
    }

    const label = createTag('span', { class: 'circle-label' });
    label.textContent = circle.label;
    circleWrapper.append(label);
    defaultLink.append(circleWrapper);
    circleContainer.append(defaultLink);
  });
  block.append(circleContainer);
};

function initResetImage(wrapper) {
  wrapper.addEventListener('mouseleave', (e) => {
    const hoveredImgs = Array.from(e.target.parentElement.querySelectorAll('img'));
    hoveredImgs.forEach((img) => {
      img.setAttribute('style', 'transform: scale3d(0.85, 0.85, 0.85); transform-style: preserve-3d; transition-property: transform 0.4s');
    });
  });
}

function initImageShuffling(wrapper) {
  const imageWrapper = wrapper.querySelector('.img-wrapper');
  const imageCount = imageWrapper.querySelectorAll('img').length;
  let activeImageIndex = 0;
  let backgroundImageIndex = 0;

  imageWrapper.addEventListener('mousemove', (e) => {
    const wrapperWidth = imageWrapper.offsetWidth;
    const switchPxThreshold = wrapperWidth / imageCount;
    const mouseX = e.clientX - wrapper.offsetLeft < 0 ? 0 : e.clientX - wrapper.offsetLeft;
    const photoList = Array.from(imageWrapper.children);

    backgroundImageIndex = Math.max(activeImageIndex - 1, 0);
    photoList[activeImageIndex].setAttribute('style', 'transform: scale3d(0.85, 0.85, 0.85); opacity: 0; z-index: 0; transition-property: transform');
    photoList[backgroundImageIndex].setAttribute('style', 'transform: scale(0.85, 0.85, 0.85); opacity: 0');
    activeImageIndex = Math.floor(mouseX / switchPxThreshold) >= imageCount ? imageCount - 1
      : Math.floor(mouseX / switchPxThreshold);
    backgroundImageIndex = Math.max(activeImageIndex - 1, 0);
    const pxFromImageSwap = mouseX - activeImageIndex * switchPxThreshold;
    const minResizeScale = 0.85;
    const resizeScale = Math.max((100 + pxFromImageSwap - switchPxThreshold) / 100, minResizeScale);
    photoList[activeImageIndex].setAttribute('style', `transform: scale3d(${resizeScale}, ${resizeScale}, ${resizeScale}); opacity: 1; z-index: 5; transition-property: none`);
    photoList[backgroundImageIndex].setAttribute('style', 'transform: scale3d(1, 1, 1); opacity: 1; z-index: 3');
  });
}

export default async function decorate($block) {
  let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const circleList = await extractContent($block);
  buildCircleList($block, circleList);
  const circleWrappers = $block.querySelectorAll('.circles-container > a');

  window.addEventListener('reduce-motion-toggle', (e) => {
    prefersReducedMotion = e.detail.reduceMotionEnabled;
  });

  if (prefersReducedMotion) {
    const player = $block.querySelector('lottie-player');
    const lottiePlaying = setInterval(() => {
      if (player.hasUpdated) {
        player.setSpeed(0);
        player.seek(200);
        clearInterval(lottiePlaying);
      }
    }, 100);
  } else {
    circleWrappers.forEach((wrapper) => {
      const imageWrapper = wrapper.querySelector('.img-wrapper');
      if (imageWrapper) {
        initResetImage(wrapper);
        initImageShuffling(wrapper);
      }
    });
  }
}
