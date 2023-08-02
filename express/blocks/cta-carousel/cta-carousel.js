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

import { createTag, fetchPlaceholders, transformLinkToAnimation } from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

function sanitizeInput(string) {
  const charMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return string.replace(/[&<>"'`=/]/g, (s) => charMap[s]);
}

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

function handleGenAISubmit(form, link) {
  const btn = form.querySelector('.gen-ai-submit');
  const input = form.querySelector('.gen-ai-input');

  btn.disabled = true;
  const genAILink = link.replace('%7B%7Bprompt-text%7D%7D', sanitizeInput(input.value).replaceAll(' ', '+'));
  if (genAILink !== '') window.location.assign(genAILink);
}

function buildGenAIForm(ctaObj) {
  const genAIForm = createTag('form', { class: 'gen-ai-input-form' });
  const formWrapper = createTag('div', { class: 'gen-ai-form-wrapper' });
  const genAIInput = createTag('textarea', {
    class: 'gen-ai-input',
    placeholder: ctaObj.subtext || '',
  });
  const genAISubmit = createTag('button', {
    class: 'gen-ai-submit',
    type: 'submit',
    disabled: true,
  });

  genAIForm.append(formWrapper);
  formWrapper.append(genAIInput, genAISubmit);

  genAISubmit.textContent = ctaObj.ctaLinks[0].textContent;
  genAISubmit.disabled = genAIInput.value === '';

  genAIInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenAISubmit(genAIForm, ctaObj.ctaLinks[0].href);
    } else {
      genAISubmit.disabled = genAIInput.value === '';
    }
  }, { passive: true });

  genAIForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenAISubmit(genAIForm, ctaObj.ctaLinks[0].href);
  });

  return genAIForm;
}

export async function decorateCards(block, payload) {
  const cards = createTag('div', { class: 'cta-carousel-cards' });
  const placeholders = await fetchPlaceholders();

  payload.actions.forEach((cta, index) => {
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

    if (mediaWrapper.children.length === 0) {
      mediaWrapper.remove();
    }

    // determine if Gen AI gets inserted after mediaWrapper has been concluded
    const hasGenAIForm = (block.classList.contains('gen-ai') && block.classList.contains('quick-action') && index === 0)
      || (block.classList.contains('gen-ai') && mediaWrapper.children.length === 0);

    if (cta.ctaLinks.length > 0) {
      if (hasGenAIForm) {
        const genAIForm = buildGenAIForm(cta);
        card.classList.add('gen-ai-action');
        cardSleeve.append(genAIForm);
        linksWrapper.remove();
      }

      if ((block.classList.contains('quick-action') || block.classList.contains('gen-ai')) && cta.ctaLinks.length === 1) {
        cta.ctaLinks[0].textContent = '';
        cta.ctaLinks[0].classList.add('clickable-overlay');
        cta.ctaLinks[0].removeAttribute('title');
      }

      cta.ctaLinks.forEach((a) => {
        if (a.href && a.href.match('adobesparkpost.app.link')) {
          const btnUrl = new URL(a.href);
          if (placeholders['search-branch-links']?.replace(/\s/g, '').split(',').includes(`${btnUrl.origin}${btnUrl.pathname}`)) {
            btnUrl.searchParams.set('search', cta.text);
            btnUrl.searchParams.set('q', cta.text);
            a.href = decodeURIComponent(btnUrl.toString());
          }
          a.removeAttribute('title');
        }
        linksWrapper.append(a);
      });
    } else {
      card.classList.add('coming-soon');
    }

    if (cta.text) {
      textWrapper.append(decorateTextWithTag(cta.text));
    }

    if (cta.subtext && !hasGenAIForm) {
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
  block.innerHTML = '';
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
      text: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container), :scope > div:nth-of-type(2) > *:last-of-type')?.textContent.trim(),
      subtext: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container) em')?.textContent.trim(),
      ctaLinks: row.querySelectorAll(':scope > div:nth-of-type(2) a'),
    };

    payload.actions.push(ctaObj);
  });

  return payload;
}

export default async function decorate(block) {
  const payload = constructPayload(block);

  decorateHeading(block, payload);
  await decorateCards(block, payload);
  buildCarousel('', block.querySelector('.cta-carousel-cards'), false);
}
