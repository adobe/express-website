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
  getMobileOperatingSystem,
  getIconElement,
  fetchPlainBlockFromFragment,
  fixIcons,
  readBlockConfig,
  toClassName,
} from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

function updatePayload(block, payload) {
  Array.from(block.children).forEach(($row) => {
    const $columns = $row.querySelectorAll('div');
    const $featureCarousel = createTag('div', { class: 'feature-carousel' });
    switch ($columns[0].textContent.trim()) {
      default:
        payload.other.push($columns);
        break;
      case 'Heading':
        payload.heading = $columns[1].firstElementChild;
        break;
      case 'Copy':
        payload.copy = createTag('span');
        payload.copy.textContent = $columns[1].textContent.trim();
        break;
      case 'Feature Carousel':
        Array.from($columns[1].children).forEach((feature) => {
          const $featureLink = createTag('a', { href: feature.querySelector('a').getAttribute('href') });
          const image = feature.querySelector('svg');
          const $imageWrapper = createTag('div', { class: 'feature-image-wrapper' });
          const $span = createTag('span');
          $span.innerText = feature.querySelector('a').innerText.trim();
          $imageWrapper.append(image);
          $featureLink.append($imageWrapper);
          $featureLink.append($span);
          $featureCarousel.append($featureLink);
        });
        payload.featureCarousel = $featureCarousel;
        break;
      case 'App Store Badge':
        if (payload.userAgent === 'iOS') {
          payload.appBadge.image = getIconElement('apple-store');
        } else {
          payload.appBadge.image = getIconElement('google-store');
        }
        payload.appBadge.link = $columns[1].querySelector('div a');
        break;
      case 'Free Plan Tags':
        Array.from($columns[1].children).forEach((tag) => {
          payload.freePlanTags.push({
            icon: getIconElement('checkmark'),
            text: tag.textContent.trim(),
          });
        });
    }
  });

  const $adobeLogo = createTag('div', { class: 'adobe-logo-wrapper' });
  $adobeLogo.append(getIconElement('adobe-express-rebrand-logo'));
  payload.adobeLogo = $adobeLogo;
}

function buildStandardPayload(block, payload) {
  const $appBadgeWrapper = createTag('div', { class: 'app-badge-wrapper' });
  const $appBadge = createTag('a', { class: 'app-badge', href: payload.appBadge.link });
  const $freePlanLogoContainer = createTag('div', { class: 'free-plan-logo-container' });
  const $freePlanContainer = createTag('div', { class: 'free-plan-container' });

  $appBadgeWrapper.append(payload.appBadge.image);
  $appBadge.append($appBadgeWrapper);
  payload.freePlanTags.forEach((tag) => {
    const $tagWrapper = createTag('div');
    const $checkWrapper = createTag('div', { class: 'check-wrapper' });
    $checkWrapper.append(tag.icon);
    $tagWrapper.append($checkWrapper, tag.text);
    $freePlanContainer.append($tagWrapper);
  });
  $freePlanLogoContainer.append($freePlanContainer, payload.adobeLogo);
  block.append(
    payload.heading,
    payload.copy,
    payload.featureCarousel,
    $appBadge,
    $freePlanLogoContainer,
  );

  buildCarousel(':scope > a', payload.featureCarousel);
  block.querySelector('.carousel-fader-left').remove();
  block.querySelector('.carousel-fader-right').remove();
  const $featureCarousel = block.querySelector('.feature-carousel');
  $featureCarousel.replaceWith($featureCarousel.firstElementChild);
}

async function buildBlockFromFragment($block) {
  const fragmentName = $block.querySelector('div').textContent.trim();
  const section = await fetchPlainBlockFromFragment(`/express/fragments/quick-action-card/${fragmentName}`, 'quick-action-card');
  if (!section) {
    return false;
  }
  const newBlock = section.querySelector('.quick-action-card');
  const sectionMeta = section.querySelector('div.section-metadata');

  if (sectionMeta) {
    const metadata = readBlockConfig(sectionMeta);
    const keys = Object.keys(metadata);
    keys.forEach((key) => {
      if (key === 'style') {
        section.classList.add(...metadata.style.split(', ').map(toClassName));
      } else if (key === 'anchor') {
        section.id = toClassName(metadata.anchor);
      } else {
        section.dataset[key] = metadata[key];
      }
    });
    sectionMeta.remove();
  }

  await fixIcons(newBlock);

  return newBlock;
}

export default async function decorate($block) {
  const payload = {
    userAgent: getMobileOperatingSystem(),
    heading: '',
    copy: '',
    appBadge: {},
    freePlanTags: [],
    adobeLogo: '',
    other: [],
  };

  let block = $block;
  if ($block.classList.contains('spreadsheet-powered')) {
    block = await buildBlockFromFragment($block);
    const $stepsSection = document.querySelector('.steps-highlight-schema-container, .section:nth-child(2)');
    if (!$stepsSection) {
      block.closest('.quick-action-card-container').remove();
    }
    $stepsSection.insertAdjacentElement('beforebegin', block.closest('.quick-action-card-container'));
  }

  updatePayload(block, payload);
  block.innerHTML = '';
  buildStandardPayload(block, payload);
}
