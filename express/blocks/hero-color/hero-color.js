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
} from '../../scripts/scripts.js';

function isDarkOverlayReadable(colorString) {
  let r;
  let g;
  let b;

  if (colorString.match(/^rgb/)) {
    const colorValues = colorString.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/,
    );
    [r, g, b] = colorValues.slice(1);
  } else {
    const hexToRgb = +`0x${colorString
      .slice(1)
      .replace(colorString.length < 5 ? /./g : '', '$&$&')}`;
    // eslint-disable-next-line no-bitwise
    r = (hexToRgb >> 16) & 255;
    // eslint-disable-next-line no-bitwise
    g = (hexToRgb >> 8) & 255;
    // eslint-disable-next-line no-bitwise
    b = hexToRgb & 255;
  }

  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 140;
}

function changeTextColorAccordingToBg(
  primaryColor,
  block,
) {
  block.classList.add(isDarkOverlayReadable(primaryColor) ? 'light-bg' : 'dark-bg');
}

function loadSvgInsideWrapper(svgId, svgWrapper, secondaryColor) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const xlinkNS = 'http://www.w3.org/1999/xlink';

  // create svg element
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'color-svg-img hidden-svg');

  // create use element
  const useSvg = document.createElementNS(svgNS, 'use');
  useSvg.setAttributeNS(xlinkNS, 'xlink:href', `/express/icons/color-sprite.svg#${svgId}`);

  // append use element to svg element
  svg.appendChild(useSvg);

  // append new svg and remove old one
  svgWrapper.replaceChildren();
  svgWrapper.appendChild(svg);
  svgWrapper.firstElementChild.style.fill = secondaryColor;
}

function displaySvgWithObject(block, secondaryColor) {
  const svg = block.firstElementChild;
  const svgId = svg.firstElementChild.textContent;
  const svgWrapper = createTag('div', { class: 'color-svg' });

  svg.remove();
  loadSvgInsideWrapper(svgId, svgWrapper, secondaryColor);
  const heroColorContentContainer = block.querySelector('.content-container');
  heroColorContentContainer.append(svgWrapper);
}

function copyTextBlock(block, text) {
  const title = block.querySelector('h2');
  const cta = block.querySelector('.button-container');
  const descriptions = block.querySelectorAll('p:not(:last-of-type)');
  const descriptionContainer = createTag('div', { class: 'description-container' });

  Array.from(descriptions).forEach((textDescription) => {
    descriptionContainer.append(textDescription);
  });

  text.classList.add('text');
  text.append(title, descriptionContainer, cta);
}

function cloneTextForSmallerMediaQueries(text) {
  const clonedTextBlock = text.cloneNode(true);
  clonedTextBlock.classList.add('text-container');
  const textContent = clonedTextBlock.children[0];

  copyTextBlock(clonedTextBlock, textContent);

  return clonedTextBlock;
}

function groupTextElements(text, block) {
  const button = block.querySelector('.button');

  copyTextBlock(block, text);
  button.style.border = 'none';
}

function decorateText(block) {
  const text = block.firstElementChild;
  const heroColorContentContainer = block.querySelector('.content-container');
  const smallMediaQueryBlock = cloneTextForSmallerMediaQueries(text);

  groupTextElements(text, block);
  heroColorContentContainer.append(text);
  block.append(smallMediaQueryBlock);
}

function extractColorElements(colors) {
  const primaryColor = colors.children[0].textContent.split(',')[0].trim();
  const secondaryColor = colors.children[0].textContent.split(',')[1].trim();
  colors.remove();

  return { primaryColor, secondaryColor };
}

function decorateColors(block) {
  const colors = block.firstElementChild;
  const { primaryColor, secondaryColor } = extractColorElements(colors);

  block.style.backgroundColor = primaryColor;

  changeTextColorAccordingToBg(primaryColor, block);

  return { secondaryColor };
}

function getContentContainerHeight() {
  const contentContainer = document.querySelector('.content-container');

  return contentContainer?.clientHeight;
}

function resizeSvgOnLoad() {
  const interval = setInterval(() => {
    if (document.readyState === 'complete') {
      const height = getContentContainerHeight();
      if (height) {
        const svg = document.querySelector('.color-svg-img');
        svg.classList.remove('hidden-svg');
        svg.style.height = `${height}px`;
        clearInterval(interval);
      }
    }
  }, 50);
}

function resizeSvgOnMediaQueryChange() {
  const mediaQuery = window.matchMedia('(min-width: 900px)');
  mediaQuery.addEventListener('change', (event) => {
    const height = getContentContainerHeight();
    const svg = document.querySelector('.color-svg-img');
    if (event.matches) {
      svg.style.height = `${height}px`;
    } else {
      svg.style.height = '200px';
    }
  });
}

export default function decorate(block) {
  const heroColorContentContainer = createTag('div', {
    class: 'content-container',
  });

  block.append(heroColorContentContainer);

  // text
  decorateText(block);

  // colors
  const { secondaryColor } = decorateColors(block);

  // svg
  displaySvgWithObject(block, secondaryColor);
  resizeSvgOnLoad();
  resizeSvgOnMediaQueryChange();
}
