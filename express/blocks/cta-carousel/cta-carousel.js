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
  createTag, transformLinkToAnimation,
} from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

function decorateTextWithTag(textSource) {
  const text = createTag('p', { class: 'cta-card-text' });
  const tagText = textSource.match(/\[(.*?)]/);

  if (tagText) {
    const [fullText, tagTextContent] = tagText;
    const $tag = createTag('span', { class: 'tag' });
    text.textContent = textSource.replace(fullText, '').trim();
    text.dataset.text = text.textContent.toLowerCase();
    $tag.textContent = tagTextContent;
    text.append($tag);
  } else {
    text.textContent = textSource;
    text.dataset.text = text.textContent.toLowerCase();
  }
  return text;
}

export function decorateHeading(block, payload) {
  const headingSection = createTag('div', { class: 'cta-carousel-heading-section' });
  const headingTextWrapper = createTag('div', { class: 'text-wrapper' });
  const heading = createTag('h2', { class: 'cta-carousel-heading' });

  heading.textContent = payload.heading;
  headingSection.append(headingTextWrapper);
  headingTextWrapper.append(heading);

  if (payload.subHeadings.length > 0) {
    payload.subHeadings.forEach((p) => {
      headingTextWrapper.append(p);
    });
  }

  if (payload.viewAllLink.href !== '') {
    const viewAllButton = createTag('a', {
      class: 'cta-carousel-link',
      href: payload.viewAllLink.href,
    });
    viewAllButton.textContent = payload.viewAllLink.text;
    headingSection.append(viewAllButton);
  }

  block.append(headingSection);
}

export function decorateCards(block, payload) {
  const cards = createTag('div', { class: 'cta-carousel-cards' });

  payload.actions.forEach((cta) => {
    const card = createTag('div', { class: 'card' });
    const cardSleeve = createTag('div', { class: 'card-sleeve' });
    const linksWrapper = createTag('div', { class: 'links-wrapper' });
    const mediaWrapper = createTag('div', { class: 'media-wrapper' });
    const textWrapper = createTag('div', { class: 'text-wrapper' });

    cardSleeve.append(mediaWrapper, linksWrapper);
    card.append(cardSleeve, textWrapper);

    if (cta.image) mediaWrapper.append(cta.image);

    if (cta.videoLink) {
      const video = transformLinkToAnimation(cta.videoLink, true);
      mediaWrapper.append(video);
    }

    if (cta.icon) mediaWrapper.append(cta.icon);

    if (cta.ctaLinks.length > 0) {
      if (block.classList.contains('quick-action') && cta.ctaLinks.length === 1) {
        cta.ctaLinks[0].textContent = '';
        cta.ctaLinks[0].classList.add('clickable-overlay');
      }

      cta.ctaLinks.forEach((a) => {
        linksWrapper.append(a);
      });
    }

    if (cta.text) {
      textWrapper.append(decorateTextWithTag(cta.text));
    }

    if (cta.subtext) {
      const subtext = createTag('p', { class: 'subtext' });
      subtext.textContent = cta.subtext;
      textWrapper.append(subtext);
    }

    cards.append(card);
  });

  block.append(cards);
}

function constructPayload(block) {
  const rows = Array.from(block.children);
  const headingDiv = rows.shift();

  const payload = {
    heading: headingDiv.querySelector('h2, h3, h4, h5, h6')?.textContent?.trim(),
    subHeadings: headingDiv.querySelectorAll('p:not(.button-container)'),
    viewAllLink: {
      text: headingDiv.querySelector('a.button')?.textContent?.trim(),
      href: headingDiv.querySelector('a.button')?.href,
    },
    actions: [],
  };

  rows.forEach((row) => {
    const ctaObj = {
      image: row.querySelector(':scope > div:nth-of-type(1) picture'),
      videoLink: row.querySelector(':scope > div:nth-of-type(1) a'),
      icon: row.querySelector(':scope > div:nth-of-type(1) img.icon'),
      text: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container)')?.textContent.trim(),
      subtext: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container) em')?.textContent.trim(),
      ctaLinks: row.querySelectorAll(':scope > div:nth-of-type(2) a'),
    };

    payload.actions.push(ctaObj);
  });

  return payload;
}

export default async function decorate(block) {
  const payload = constructPayload(block);

  block.innerHTML = '';

  decorateHeading(block, payload);
  decorateCards(block, payload);
  buildCarousel('.card', block, false);
}
