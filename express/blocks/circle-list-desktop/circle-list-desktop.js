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

import { createTag, getIconElement } from '../../scripts/scripts.js';

async function fetchCircleImages(link) {
  const resp = await fetch(`${link}`);
  const json = await resp.json();
  return json.data;
}

const grabImageSet = (category, imageData) => {
  const targetRow = imageData.filter((row) => category === row.Category);
  return Object.values(targetRow[0]).slice(1);
};

const extractContent = async (block) => {
  const circleList = [];
  const imagesLink = block.firstElementChild.textContent.trim();
  const imageData = await fetchCircleImages(imagesLink);

  const circleRows = Array.from(block.children).slice(1);
  circleRows.forEach((row) => {
    const circleObject = {};
    const defaultLink = row.firstElementChild.querySelector('a')?.getAttribute('href') ?? '';
    let imageLinks;
    const label = row.firstElementChild.textContent.trim();
    const dropDownOptions = [];
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
      const subText = colArray[1].textContent.trim();
      circleObject.subText = subText;
    }

    circleObject.label = label;
    circleObject.defaultLink = defaultLink;
    circleList.push(circleObject);
  });
  block.innerHTML = '';
  return circleList;
};

const buildCircleList = (circles) => {
  console.log(circles);
  circles.forEach((circle) => {
    console.log(circle);
  })
}

export default function decorate($block) {
  const circleList = extractContent($block);
  buildCircleList(circleList);
}
