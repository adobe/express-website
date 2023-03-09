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

// async function fetchCircleImages(link) {
//   fetch(`${link}`)
//     .then((response) => response.json())
//     .then((data) => {
//       return data
//     });
// }

async function fetchCircleImages(link) {
  const resp = await fetch(`${link}`);
  const json = await resp.json();
  return json.data;
}

const grabImageSet = () => {

}

const decorateCircle = async (block) => {
  const circleList = [];
  const imagesLink = block.firstElementChild.textContent.trim();
  const images = await fetchCircleImages(imagesLink);
  console.log(images);
  Array.from(block.children).forEach((row) => {
    const defaultLink = row.firstElementChild.querySelector('a')?.getAttribute('href') ?? '';
    const label = row.firstElementChild.textContent.trim();
    const dropDownOptions = [];
    const colArray = Array.from(row.children);
    if (colArray.length > 3) {
      images.forEach((row) => {})
      const imageLinks = [];

      for (let i = 1; i < colArray.length; i += 1) {
        dropDownOptions.push({
          icon: colArray[i].querySelector('svg'),
          text: colArray[i].querySelector('a')?.textContent.trim(),
          link: colArray[i].querySelector('a')?.getAttribute('href') ?? '',
        });
      }
    }
  });
};

export default function decorate($block) {
  const circleList = [];
  circleList.push({
    imageLink: '',
    label: '',
    defaultLink: '',
    dropDownOptions: [{icon: '', text: '', link: ''}],
  });

  decorateCircle($block);
}
