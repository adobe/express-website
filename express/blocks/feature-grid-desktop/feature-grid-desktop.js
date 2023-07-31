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

import { createTag } from '../../scripts/scripts.js';
import { isVideoLink } from '../shared/video.js';

function renderImageOrVideo(media) {
  let updatedMedia;
  if (media.tagName.toUpperCase() === 'PICTURE') {
    updatedMedia = media.querySelector('img');
  } else if (!media?.href) {
    return null;
  } else if (isVideoLink(media?.href)) {
    const attributes = { class: 'hero-animation-background' };
    ['playsinline', 'autoplay', 'loop', 'muted'].forEach((p) => {
      attributes[p] = '';
    });
    updatedMedia = createTag('video', attributes);
    updatedMedia.src = media.href;
  }
  return updatedMedia;
}

function renderGridNode({
  media,
  title,
  subText,
  cta,
}, index) {
  const gridItem = createTag('a', { class: `grid-item item-${index + 1}` });
  const updatedMedia = renderImageOrVideo(media);
  gridItem.href = cta?.href;

  if (title) gridItem.append(title);
  if (subText) gridItem.append(subText);
  if (cta) {
    cta.classList.add('cta');
    cta.classList.remove('button');
    gridItem.append(cta);
  }

  if (index < 4) {
    gridItem.append(updatedMedia);
  } else {
    gridItem.prepend(updatedMedia);
  }
  return gridItem;
}

const decorateLoadMoreSection = (block, loadMoreInfo) => {
  const loadMoreWrapper = createTag('div', { class: 'load-more-div' });
  const loadMoreButton = createTag('button', { class: 'load-more-button' });
  const toggleChev = createTag('div', { class: 'load-more-chev' });

  loadMoreWrapper.style.background = loadMoreInfo.color;
  loadMoreButton.append(toggleChev);
  loadMoreWrapper.append(loadMoreButton);
  block.append(loadMoreWrapper);

  loadMoreButton.addEventListener('click', () => {
    block.classList.toggle('expanded');
  });
};

const getGradient = (children) => {
  const gradientText = children.at(-1).textContent;
  children.pop();
  // eslint-disable-next-line no-useless-escape
  const regex = /linear-gradient\(([^\)]+)\)/;
  const gradientColorRow = children.findIndex((row) => row.textContent.match(regex));
  const gradientInfo = { color: 'linear-gradient(#ffffff00, #FCFAFF, #FCFAFF)', text: gradientText };

  if (gradientColorRow !== -1) {
    gradientInfo.color = children[gradientColorRow].textContent;
    children.splice(gradientColorRow, 1);
  }
  return gradientInfo;
};

export default function decorate(block) {
  const inputRows = block.querySelectorAll(':scope > div > div');
  block.innerHTML = '';
  const children = Array.from(inputRows);
  const heading = children.shift();
  const loadMoreSection = children.length > 4 ? getGradient(children) : '';
  const gridProps = children.map((child) => {
    const subText = child.querySelector('p');
    const media = child.querySelector('p:last-of-type > a, p:last-of-type > picture');
    const title = child.querySelector('h2');
    const cta = child.querySelector('a');
    return {
      media,
      title,
      subText,
      cta,
    };
  });

  if (gridProps.length > 12) {
    throw new Error(
      `Authoring issue: Feature Grid Fixed block should have 12 children. Received: ${gridProps.length}`,
    );
  }

  const gridContainer = createTag('div', { class: 'grid-container' });
  const gridItems = gridProps.map((props, index) => renderGridNode(props, index));
  heading.classList.add('heading');

  gridItems.forEach((gridItem) => {
    gridContainer.append(gridItem);
  });

  block.append(heading, gridContainer);

  if (gridProps.length > 4) {
    decorateLoadMoreSection(block, loadMoreSection);
  }
}
