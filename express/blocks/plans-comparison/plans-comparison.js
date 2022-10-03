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

import {
  createTag, getIconElement, getLocale, loadBlocks,
} from '../../scripts/scripts.js';

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
    $newBlock.id = 'plans-comparison-container';
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
    cardPadding: window.innerWidth >= 1200 ? 64 : 40,
  };
  Array.from($block.children).forEach(($row, index) => {
    if (index === 0) {
      payload.mainHeading = $row.innerHTML;
    }

    if (index === 1) {
      const headings = $row.querySelectorAll('div');
      payload.free.heading = headings[0].innerHTML;
      payload.premium.heading = headings[1].innerHTML;
    }

    if (index === 2) {
      const subCopies = $row.querySelectorAll('div');
      payload.free.subCopy = subCopies[0].textContent;
      payload.premium.subCopy = subCopies[1].textContent;
    }

    if (index === 3) {
      const lists = $row.querySelectorAll('ul');
      payload.free.features = Array.from(lists[0].querySelectorAll('li'));
      payload.premium.features = Array.from(lists[1].querySelectorAll('li'));
    }

    if (index === 4) {
      const ctas = $row.querySelectorAll('div');
      payload.free.ctas = Array.from(ctas[0].querySelectorAll('a'));
      payload.premium.ctas = Array.from(ctas[1].querySelectorAll('a'));
    }
  });

  return payload;
}

function collapseCard($card, payload) {
  const $heading = $card.querySelector('.plans-comparison-heading');
  const $subcopy = $card.querySelector('.plans-comparison-sub-copy');
  $card.classList.remove('expanded');
  if (window.innerWidth >= 1200) {
    $card.style.maxWidth = `${354 - payload.cardPadding}px`;
  } else {
    $card.style.maxHeight = `${
      $heading.offsetHeight
      + $subcopy.offsetHeight
      + payload.cardPadding}px`;
    $card.style.maxWidth = '';
  }
}

function expandCard($card, payload) {
  const $heading = $card.querySelector('.plans-comparison-heading');
  const $subcopy = $card.querySelector('.plans-comparison-sub-copy');
  const $featuresWrapper = $card.querySelector('.features-wrapper');
  const $ctasWrapper = $card.querySelector('.ctas-wrapper');
  if (!$card.classList.contains('expanded')) {
    $card.classList.add('expanded');
    if (window.innerWidth >= 1200) {
      $card.style.maxWidth = `${$card.parentElement.offsetWidth - 354}px`;
      $card.classList.add('clip');
      setTimeout(() => {
        $card.classList.remove('clip');
      }, 700);
    } else {
      $card.style.maxHeight = `${
        $heading.offsetHeight
        + $subcopy.offsetHeight
        + $featuresWrapper.offsetHeight
        + $ctasWrapper.offsetHeight
        + payload.cardPadding * 2
      }px`;
    }
  }
}

function toggleExpandableCard($block, $cardClicked, payload) {
  const $cards = $block.querySelectorAll('.plans-comparison-card');
  const $paginations = $block.querySelectorAll('.pagination-pill');
  Array.from($cards).forEach(($card, index) => {
    if ($card !== $cardClicked) {
      collapseCard($card, payload);
      $paginations[index].classList.remove('active');
    } else {
      $paginations[index].classList.add('active');
    }
  });
  expandCard($cardClicked, payload);
}

function decorateToggleButton($block, $card, payload) {
  const $toggleButton = createTag('div', { class: 'toggle-button' });
  $toggleButton.append(getIconElement('plus-heavy'));

  $card.append($toggleButton);

  $card.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!$card.classList.contains('expanded')) {
      toggleExpandableCard($block, $card, payload);
    } else {
      const $otherCard = $block.querySelector('.plans-comparison-card:not(.expanded)');
      toggleExpandableCard($block, $otherCard, payload);
    }
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
  const $cardsWrapper = createTag('div', { class: 'plans-comparison-cards' });
  $block.append($cardsWrapper);

  for (const [key, value] of Object.entries(payload)) {
    if (['free', 'premium'].includes(key)) {
      const $card = createTag('div', { class: `plans-comparison-card card-${key}` });
      const $contentTop = createTag('div', { class: 'content-top' });
      const $contentBottom = createTag('div', { class: 'content-bottom' });
      const $heading = createTag('div', { class: 'plans-comparison-heading' });
      const $subCopy = createTag('p', { class: 'plans-comparison-sub-copy' });
      const $features = decorateFeatures($block, payload, value);
      const $ctas = decorateCTAs($block, payload, value);

      $cardsWrapper.append($card);
      $contentTop.append($heading, $subCopy, $features);
      $contentBottom.append($ctas);
      $heading.innerHTML = value.heading;
      $subCopy.textContent = value.subCopy;
      $card.append($contentTop, $contentBottom);
      decorateToggleButton($block, $card, payload);

      if (key === 'premium') {
        expandCard($card, payload);
        payload.cardHeight = $card.offsetHeight;
        collapseCard($card, payload);
      }

      $card.classList.add('transition');
    }
  }
}

function decoratePagination($block, payload) {
  const $paginationWrapper = createTag('div', { class: 'pagination-wrapper' });
  const $cards = $block.querySelectorAll('.plans-comparison-card');
  if ($cards) {
    Array.from($cards).forEach(($card) => {
      const $paginationPill = createTag('span', { class: 'pagination-pill' });
      $paginationWrapper.append($paginationPill);

      $paginationPill.addEventListener('click', () => {
        toggleExpandableCard($block, $card, payload);
      });
    });
    $block.append($paginationWrapper);
  }
}

export default function decorate($block) {
  let payload;
  const locale = getLocale(new URL(window.location));
  const $linkList = document.querySelector('.link-list-container');
  let fragmentUrl;
  if (locale === 'us') {
    fragmentUrl = 'https://main--express-website--adobe.hlx.page/drafts/qiyundai/fragments/plans-comparison';
  } else {
    fragmentUrl = `https://main--express-website--adobe.hlx.page/drafts/qiyundai/${locale}/fragments/plans-comparison`;
  }
  decorateAsFragment($block, fragmentUrl);

  document.addEventListener('planscomparisonloaded', () => {
    const $section = document.querySelector('.plans-comparison-container');
    if ($linkList) {
      $linkList.before($section);
    }
    if ($section) {
      const $newBlock = $section.querySelector('.plans-comparison');
      if ($newBlock) {
        payload = buildPayload($newBlock);
        $newBlock.innerHTML = payload.mainHeading;
        $newBlock.querySelector('div').classList.add('main-heading-wrapper');
        decorateCards($newBlock, payload);
        decoratePagination($newBlock, payload);
        const $cards = $newBlock.querySelectorAll('.plans-comparison-card');
        const $featuresWrappers = $newBlock.querySelectorAll('.features-wrapper');
        if ($cards) {
          Array.from($cards).forEach(($card, index) => {
            if (index === 0) {
              toggleExpandableCard($newBlock, $card, payload);
            }

            if (index === 1) {
              payload.desiredHeight = `${$featuresWrappers[index].offsetHeight}px`;
            }
          });

          Array.from($featuresWrappers).forEach((wrapper) => {
            wrapper.style.maxHeight = payload.desiredHeight;
          });

          $newBlock.classList.add('restrained');

          window.addEventListener('resize', () => {
            Array.from($cards).forEach(($card, index) => {
              if (window.innerWidth >= 1200) {
                $card.style.maxHeight = '';
                if ($card.classList.contains('expanded')) {
                  $card.style.maxWidth = `${$card.offsetWidth}px`;

                  if ($card.classList.contains('card-premium')) {
                    $featuresWrappers[index].style.maxHeight = '';
                    payload.desiredHeight = `${$featuresWrappers[index].offsetHeight}px`;
                  }
                } else {
                  collapseCard($card, payload);
                }

                Array.from($featuresWrappers).forEach((wrapper) => {
                  wrapper.style.maxHeight = payload.desiredHeight;
                });
              } else {
                $card.style.maxWidth = '';
                if ($card.classList.contains('expanded')) {
                  $card.style.maxHeight = `${$card.offsetHeight}px`;
                } else {
                  collapseCard($card, payload);
                }

                Array.from($featuresWrappers).forEach((wrapper) => {
                  wrapper.style.maxHeight = 'none';
                });
              }
            });
          });
        }
      }
    }
  });
}
