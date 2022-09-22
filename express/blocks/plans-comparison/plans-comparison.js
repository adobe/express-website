/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { createTag, loadBlocks, getLocale, getIconElement } from '../../scripts/scripts.js';

async function decorateAsFragment($block, content) {
  const path = new URL(content).pathname.split('.')[0];
  const resp = await fetch(`${path}.plain.html`);
  if (resp.status === 404) {
    $block.parentElement.parentElement.remove();
  } else {
    const html = await resp.text();
    const $newBlock = createTag('div');
    $newBlock.innerHTML = html;
    $newBlock.className = 'plans-comparison-container';
    const img = $newBlock.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'lazy');
    }
    const loadedBlocks = await loadBlocks($newBlock);
    await Promise.all(loadedBlocks);
    const $section = $block.closest('.section');
    $section.parentNode.replaceChild($newBlock, $section);
    document.dispatchEvent(new Event('planscomparisonloaded'));
  }
}

function buildPayload($block) {
  const payload = {
    free: {},
    premium: {},
  };
  Array.from($block.children).forEach(($row, index) => {
    if (index === 0) {
      const headings = $row.querySelectorAll('h3');
      payload.free.heading = headings[0].textContent;
      payload.premium.heading = headings[1].textContent;
    }

    if (index === 1) {
      const subCopies = $row.querySelectorAll('div');
      payload.free.subCopy = subCopies[0].textContent;
      payload.premium.subCopy = subCopies[1].textContent;
    }

    if (index === 2) {
      const lists = $row.querySelectorAll('ul');
      payload.free.features = Array.from(lists[0].querySelectorAll('li'));
      payload.premium.features = Array.from(lists[1].querySelectorAll('li'));
    }

    if (index === 3) {
      const ctas = $row.querySelectorAll('div');
      payload.free.ctas = Array.from(ctas[0].querySelectorAll('a'));
      payload.premium.ctas = Array.from(ctas[1].querySelectorAll('a'));
    }
  });

  return payload;
}

function toggleExpandableCard($card) {
  
}

function decorateToggleButton($card) {
  const $toggleButton = createTag('div', { class: 'toggle-button' });
  $toggleButton.append(getIconElement('plus'));

  $card.prepend($toggleButton);

  $toggleButton.addEventListener('click', () => {
    toggleExpandableCard($card);
  });
}

function decorateFeatures($block, payload, value) {
  const $featuresWrapper = createTag('ul', { class: 'features-wrapper' });
  value.features.forEach((feature) => {
    $featuresWrapper.append(feature);
  });

  return $featuresWrapper;
}

function decorateCTAs($block, payload, value) {
  const $buttonsWrapper = createTag('ul', { class: 'ctas-wrapper' });
  value.ctas.forEach((cta, index) => {
    $buttonsWrapper.append(cta);
    if (index === 0) {
      cta.classList.add('primary');
    }
  });

  return $buttonsWrapper;
}

function decorateCards($block, payload) {
  for (const [, value] of Object.entries(payload)) {
    const $card = createTag('div', { class: 'plans-comparison-card' });
    const $heading = createTag('h3', { class: 'plans-comparison-heading' });
    const $subCopy = createTag('p', { class: 'plans-comparison-sub-copy' });
    const $features = decorateFeatures($block, payload, value);
    const $ctas = decorateCTAs($block, payload, value);
    decorateToggleButton($card);

    $heading.textContent = value.heading;
    $subCopy.textContent = value.subCopy;
    $card.append($heading, $subCopy, $features, $ctas);
    $block.append($card);
  }
}

export default function decorate($block) {
  let payload;
  const locale = getLocale(new URL(window.location));
  let fragmentUrl;
  if (locale === 'us') {
    fragmentUrl = 'https://main--express-website--adobe.hlx.page/drafts/qiyundai/fragments/plans-comparison';
  } else {
    fragmentUrl = `https://main--express-website--adobe.hlx.page/drafts/qiyundai/${locale}/fragments/plans-comparison`;
  }
  decorateAsFragment($block, fragmentUrl);

  document.addEventListener('planscomparisonloaded', () => {
    const $newBlock = document.querySelector('.plans-comparison');
    if ($newBlock) {
      payload = buildPayload($newBlock);
      $newBlock.innerHTML = '';
    }

    decorateCards($newBlock, payload);
  });
}
