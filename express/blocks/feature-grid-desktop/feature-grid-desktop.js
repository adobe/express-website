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
import preferenceStore, { preferenceNames } from '../../scripts/preference-store.js';

const ITEM_CLASS = [
  'features',
  'resize',
  'quick-actions',
  'effects',
  'branding',
  'templates',
  'fonts',
  'stock',
  'graphic-groups',
  'customization',
  'animations',
];

const ANIMATION_CLS = 'enter-animation';
const ENTERED_CLS = 'entered';

function renderGridNode({ picture, title, ctas }, index) {
  const grid = createTag('div', { class: `grid-item ${ITEM_CLASS[index]}` });

  // adding text
  if (title) {
    const titleWrapper = createTag('div', { class: 'title-wrapper' });
    titleWrapper.append(title.textContent.trim());
    grid.append(titleWrapper);
  }

  // adding img background
  const img = picture.querySelector('img');
  grid.style.backgroundImage = `url(${img.src})`;
  grid.style.backgroundRepeat = 'no-repeat';
  grid.style.backgroundPositionX = 'center';

  // adding feature-overlay
  const overlay = createTag('div', { class: 'feature-overlay' });
  ctas.forEach((cta) => {
    // itallic or light class is used to indicate secondary CTA
    if (cta.classList.contains('light')) {
      cta.classList.remove('light');
      cta.classList.add('secondary');
    } else {
      cta.classList.add('primaryCTA');
    }
    overlay.append(cta);
  });
  grid.append(overlay);
  return grid;
}

const observerCallback = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target);
      entry.target.classList.add(ENTERED_CLS);
    }
  });
};

export default function decorate(block) {
  const inputRows = block.querySelectorAll(':scope > div > div');
  block.innerHTML = '';
  const children = Array.from(inputRows);
  const footnote = children.pop().textContent;
  const gridProps = children.map((child) => {
    const picture = child.querySelector('picture');
    const title = child.querySelector('strong');
    const ctas = child.querySelectorAll('a');
    return { picture, title, ctas };
  });

  if (gridProps.length !== 11) {
    throw new Error(
      `Authoring issue: Feature Grid Fixed block should have 11 children. Received: ${gridProps.length}`,
    );
  }

  const gridContainer = createTag('div', {
    class: 'grid-container',
  });

  // for scroll-in-view animation
  const containerObserver = new IntersectionObserver(observerCallback, {
    threshold: 0.5,
  });
  const itemsObserver = new IntersectionObserver(observerCallback, {
    threshold: 0.5,
  });

  containerObserver.observe(gridContainer);

  const gridItems = gridProps.map((props, index) => renderGridNode(props, index));

  gridItems.forEach((gridItem) => {
    itemsObserver.observe(gridItem);
    gridContainer.append(gridItem);
  });

  // for 900px layout, ctas are small
  const bigLayoutMediaQuery = window.matchMedia('(min-width: 1200px)');
  const overlayedCTAs = gridContainer.querySelectorAll('.feature-overlay a.button');
  const reactToScale = (big) => {
    if (big) {
      overlayedCTAs.forEach((cta) => {
        cta.classList.remove('small');
      });
    } else {
      overlayedCTAs.forEach((cta) => {
        cta.classList.add('small');
      });
    }
  };
  reactToScale();

  bigLayoutMediaQuery.addEventListener('change', (e) => {
    reactToScale(e.matches);
  });

  // react to reduceMotion preference change event
  const reactToPreference = ({ value }) => {
    if (value) {
      gridContainer.classList.remove(ANIMATION_CLS);
      gridItems.forEach((gridItem) => {
        gridItem.classList.remove(ANIMATION_CLS);
      });
    } else {
      gridContainer.classList.add(ANIMATION_CLS);
      gridItems.forEach((gridItem) => {
        gridItem.classList.add(ANIMATION_CLS);
      });
    }
  };

  reactToPreference({ value: preferenceStore.get(preferenceNames.reduceMotion.name) });

  preferenceStore.subscribe(preferenceNames.reduceMotion.name, block, reactToPreference);

  const footnoteContainer = createTag('div', {
    class: 'footnote-container',
  });
  footnoteContainer.append(footnote);

  block.append(gridContainer);
  block.append(footnoteContainer);
}
