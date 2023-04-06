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

import {
  buildStaticFreePlanWidget,
  createTag,
  getLottie,
  gradateColorfulText,
  lazyLoadLottiePlayer,
  transformLinkToAnimation,
} from '../../scripts/scripts.js';

function noTextNodes(c) {
  return c.nodeName !== '#text';
}

function buildHoverContent(title, videoDiv, links) {
  const videoLink = videoDiv.querySelector('a');
  if (!videoLink) return null;
  title.style.display = 'block';
  links.style.display = 'block';
  const buttons = links.querySelectorAll('a.button');
  buttons.forEach((button, index) => {
    button.classList.add('xlarge');
    if (index === 1) button.classList.add('secondary');
  });
  const hoverElem = createTag('div', { class: 'quick-action-hub-interactive-desktop-hover' });
  const hoverContent = createTag('div', { class: 'quick-action-hub-interactive-desktop-hover-content' });
  const videoContainer = createTag('div', { class: 'video-container' });
  const overlay = createTag('div', { class: 'quick-action-hub-interactive-desktop-hover-overlay' });
  const video = createTag('a');
  hoverElem.append(overlay);

  hoverContent.append(title);
  videoContainer.append(video);
  hoverContent.append(videoContainer);
  if (videoLink && videoLink.href && videoLink.href.includes('.mp4')) {
    video.href = videoLink.href;
    transformLinkToAnimation(video);
  }
  const mouseArrow = createTag('div', { class: 'mouse-arrow' });
  mouseArrow.innerHTML = getLottie('mouse-arrow', '/express/blocks/quick-action-hub-interactive-desktop/arrow-up.json');
  overlay.append(mouseArrow);
  overlay.append(links);
  hoverElem.append(hoverContent);
  buildStaticFreePlanWidget().then((widget) => {
    hoverContent.append(widget);
  });
  hoverElem.append(overlay);
  setTimeout(() => hoverElem.classList.add('active'), 250);

  return hoverElem;
}
function buildColContent(nodes, column) {
  const fragment = new DocumentFragment();
  const hover = nodes.length === 4;
  const firstNodeChildren = [...nodes[0].children].filter(noTextNodes);
  if (firstNodeChildren.length === 2
    && (firstNodeChildren[0].nodeName === 'svg' || firstNodeChildren[0].nodeName === 'IMG')
    && firstNodeChildren[1].nodeName === 'A') {
    const image = nodes[0].querySelector(':scope img') || nodes[0].querySelector(':scope svg');
    const link = nodes[0].querySelector(':scope a');
    link.classList.add('action');
    link.prepend(image);
    if (hover) {
      nodes[1].style.display = 'none';
      nodes[2].style.display = 'none';
      nodes[3].style.display = 'none';
      const handleMouseLeave = (e) => {
        const hoverContent = column.querySelector(':scope .quick-action-hub-interactive-desktop-hover');
        if (e.toElement !== link && !hoverContent.contains(e.toElement)) {
          hoverContent.removeEventListener('mouseleave', handleMouseLeave);
          hoverContent.remove();
          link.classList.remove('hover');
        }
      };
      link.addEventListener('mouseover', () => {
        link.classList.add('hover');
        if (link.parentNode.querySelector(':scope .quick-action-hub-interactive-desktop-hover')) return;
        const hoverContent = buildHoverContent(nodes[1], nodes[2], nodes[3]);
        column.insertBefore(hoverContent, column.children[0].nextSibling);
        hoverContent.addEventListener('mouseleave', handleMouseLeave);
      });
      link.addEventListener('mouseleave', handleMouseLeave);
    }
    fragment.append(link);
  } else {
    const card = createTag('div', { class: 'card' });
    const img = nodes[0].querySelector(':scope img, :scope svg');
    const txt = nodes[0].querySelectorAll(':scope p:not(:first-child)');
    const cardLink = nodes[0].querySelector(':scope p:not(:first-child) a');
    if (img && txt.length > 0 && cardLink) {
      const textContent = createTag('div', { class: 'text-content' });
      card.appendChild(img);
      txt.forEach((t) => {
        textContent.appendChild(t);
      });
      card.appendChild(textContent);
      card.addEventListener('click', () => {
        window.location.href = cardLink.href;
      });
      fragment.append(card);
    } else {
      fragment.append(nodes[0]);
    }
  }

  return fragment;
}

export default function decorate(block) {
  const blockChildren = [...block.children];
  const container = createTag('div', { class: 'quick-action-hub-interactive-desktop-container' });
  const columns = createTag('div', { class: 'quick-action-hub-interactive-desktop-list-container' });

  let currentCol;
  const header = blockChildren.shift();
  header.classList.add('quick-action-hub-interactive-desktop-header');
  const title = header.querySelector(':scope h2');
  gradateColorfulText(title);

  let thirdColumn;
  blockChildren.forEach((el) => {
    const elChildren = [...el.children];
    const firstChild = elChildren[0];
    if (!firstChild) return;
    const firstChildNodes = [...firstChild.childNodes].filter(noTextNodes);
    if (firstChildNodes.length === 1 && ['H1', 'H2', 'H3', 'H4'].includes(firstChildNodes[0].nodeName)) {
      firstChildNodes[0].classList.add('column-title');
      if (columns.children.length === 2) {
        thirdColumn = createTag('div', { class: 'third-column' });
        columns.append(thirdColumn);
      }
      el.classList.add('quick-action-hub-column');
      if (thirdColumn) {
        thirdColumn.append(el);
      } else {
        columns.append(el);
      }
      currentCol = el;
      elChildren.shift();
    }

    const content = buildColContent(elChildren, currentCol);
    if (currentCol !== el) el.remove();
    if (currentCol) currentCol.append(content);
  });

  block.innerHTML = '';

  block.append(container);
  container.append(header);
  container.append(columns);
  lazyLoadLottiePlayer(block);
}
