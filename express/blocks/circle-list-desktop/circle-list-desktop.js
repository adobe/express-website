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
import preferenceStore, { eventNames } from '../../scripts/preference-store.js';

// Fetches images from the spreadsheet
async function fetchCircleImages(link) {
  const resp = await fetch(`${link}`);
  const json = await resp.json();
  return json.data;
}

// Fetches the corresponding row in the spreadsheet based on the label name
const grabImageSet = (category, imageData) => {
  const targetRow = imageData.find((row) => category.toLowerCase() === row.Category.toLowerCase());
  return Object.values(targetRow).slice(1);
};

const buildDropdownList = (circle) => {
  const list = createTag('ul', { class: 'dropdown' });
  list.classList.add('hidden', 'transparent');
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
      circleObject.label = label;
    } else if (colArray.length === 2) {
      circleObject.lottie = getLottie('blank-canvas', '/express/blocks/circle-list-desktop/blank-canvas.json');
      circleObject.subText = label;
      circleObject.type = 'lottie';
      circleObject.label = colArray[1].textContent.trim();
    }
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
      const subText = createTag('span', { class: 'sub-text' });
      subText.textContent = circle.subText;
      lottie.innerHTML = circle.lottie;
      lottieWrapper.append(lottie);
      circleWrapper.append(lottieWrapper);
      circleWrapper.append(subText);
    }

    const label = createTag('span', { class: 'circle-label' });
    label.textContent = circle.label;
    circleWrapper.append(label);
    defaultLink.append(circleWrapper);
    circleContainer.append(defaultLink);
  });
  block.append(circleContainer);
};

// Adds a class to handle transitions for door handle appearing
function initDoorHandle(imgWrapper, dropDown, circleWrapper) {
  circleWrapper.addEventListener('mouseenter', () => {
    dropDown.classList.remove('hidden');
    setTimeout(() => {
      dropDown.classList.remove('transparent');
    }, 10);
  });
}

// Resets all the images to their default state and handles classes transition:off classes
function initResetDoorHandle(wrapper, dropDown) {
  wrapper.addEventListener('mouseleave', (e) => {
    const hoveredImgs = Array.from(e.currentTarget.querySelectorAll('img'));
    const circleWrapper = wrapper.querySelector('.circle-wrapper');

    circleWrapper.setAttribute('style', 'z-index: 1');
    dropDown.classList.add('transparent');
    setTimeout(() => {
      dropDown.classList.add('hidden');
    }, 201);
    hoveredImgs.forEach((img) => {
      img.setAttribute('style', 'transform-style: preserve-3d; transition-property: transform 0.4s; z-index: 0');
    });
  });
}

// Snaps back to hero image, even if mouse leaves image on partial transition
function initResetHeroImage(imgWrapper) {
  const heroImage = imgWrapper.querySelector('.hero-img');
  const altImages = Array.from(imgWrapper.querySelectorAll('.alt-img'));

  imgWrapper.addEventListener('mouseleave', () => {
    heroImage.setAttribute('style', 'transform: scale3d(1, 1, 1); transform-style: preserve-3d; transition-property: transform 0.4s; opacity: 1');
    altImages.forEach((altImg) => {
      altImg.setAttribute('style', 'opacity: 0');
    });
  });
}

function initImageShuffling(wrapper, block) {
  const imageWrapper = wrapper.querySelector('.img-wrapper');
  const imageCount = imageWrapper.querySelectorAll('img').length;
  let activeImageIndex = 0;
  let backgroundImageIndex = 0;
  const player = block.querySelector('lottie-player');
  const reducedMotion = preferenceStore.get(eventNames.reduceMotion);
  const circleWrapper = wrapper.querySelector('.circle-wrapper');

  // Handles the shuffling of images based on mouse position
  const shuffle = (e) => {
    circleWrapper.setAttribute('style', 'z-index: 3');
    if (!block.classList.contains('no-animation')) {
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
      photoList[activeImageIndex].setAttribute('style', `transform: scale3d(${resizeScale}, ${resizeScale}, ${resizeScale}); opacity: 1; z-index: 2; transition-property: none`);
      photoList[backgroundImageIndex].setAttribute('style', 'transform: scale3d(1, 1, 1); opacity: 1; z-index: 1');
    } else {
      wrapper.querySelector('.hero-img').setAttribute('style', 'transform: scale3d(1, 1, 1); opacity: 1; z-index: 1');
    }
  };

  // Pauses lottie and disables shuffling of images
  const toggleAnimationState = (reduceMotion) => {
    const lottiePlaying = setInterval(() => {
      if (player.hasUpdated) {
        if (reduceMotion === 'on') {
          block.classList.add('no-animation');
          player.setSpeed(0);
          player.seek(200);
        } else {
          block.classList.remove('no-animation');
          player.setSpeed(1);
        }
        clearInterval(lottiePlaying);
      }
    }, 100);
  };

  toggleAnimationState(reducedMotion);
  preferenceStore.subscribe(eventNames.reduceMotion, block, (value) => toggleAnimationState(value));
  imageWrapper.addEventListener('mousemove', shuffle);
}

export default async function decorate($block) {
  const circleList = await extractContent($block);
  buildCircleList($block, circleList);
  const circleWrappers = $block.querySelectorAll('.circles-container > a');

  circleWrappers.forEach((wrapper) => {
    const imageWrapper = wrapper.querySelector('.img-wrapper');
    const dropDown = wrapper.querySelector('.dropdown');
    if (imageWrapper) {
      initDoorHandle(imageWrapper, dropDown, wrapper);
      initResetDoorHandle(wrapper, dropDown);
      initImageShuffling(wrapper, $block);
      initResetHeroImage(imageWrapper);
    }
  });
}
