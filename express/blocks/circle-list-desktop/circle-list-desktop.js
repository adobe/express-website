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
      circleObject.lottie = getLottie('blank-canvas', 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js');
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
      const image = createTag('img', { class: 'circle-image' });
      image.src = circle.imageLinks[0]
      circleWrapper.append(image);
      circleWrapper.append(buildDropdownList(circle));
    } else {
      lazyLoadLottiePlayer();
      const lottie = createTag('div', { class: 'lottie-animation' });
      lottie.innerHTML = circle.lottie;
      circleWrapper.append(lottie);
    }
    const label = createTag('span', { class: 'circle-label' });
    label.textContent = circle.label;

    circleWrapper.append(label);
    defaultLink.append(circleWrapper);
    circleContainer.append(defaultLink);
  });
  block.append(circleContainer);
};

const initHoverState = (e) => {
  console.log('Mouse is stillll over');
  e.target.parentElement.classList.add('door-handle');
};
const initUnHoverState = (e) => {
  e.target.firstElementChild.classList.remove('door-handle');
};

const initImageShuffle = (direction) => {
  // console.log(event);
};

export default async function decorate($block) {
  const circleList = await extractContent($block);
  buildCircleList($block, circleList);

  const circleWrappers = $block.querySelectorAll('.circles-container > a');
  const images = $block.querySelectorAll('.circle-wrapper img');
  const lastMousePoint = { x: null, y: null };
  images.forEach((image) => {
    image.addEventListener('mouseover', initHoverState);
    image.addEventListener('mousemove', (e) => {
      const leftOrRight = () => {
        if (e.clientX > lastMousePoint.x) return 'right';
        else if (e.clientX < lastMousePoint.x) return 'left';
      };
      initImageShuffle(leftOrRight());
      lastMousePoint.x = e.clientX;
      lastMousePoint.y = e.clientY;
    });
  });
  circleWrappers.forEach((wrapper) => {
    wrapper.addEventListener('mouseleave', initUnHoverState);
  });
}
