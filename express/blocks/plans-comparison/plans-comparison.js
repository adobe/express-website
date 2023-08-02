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
  createTag,
  fixIcons,
  getIconElement,
  fetchPlainBlockFromFragment,
} from '../../scripts/scripts.js';
import { getOffer } from '../../scripts/utils/pricing.js';

async function fetchPlan(planUrl) {
  if (!window.pricingPlans) {
    window.pricingPlans = {};
  }

  let plan = window.pricingPlans[planUrl];

  if (!plan) {
    plan = {};
    const link = new URL(planUrl);
    const params = link.searchParams;

    plan.url = planUrl;
    plan.country = 'us';
    plan.language = 'en';
    plan.price = '9.99';
    plan.currency = 'US';
    plan.symbol = '$';

    if (planUrl.includes('/sp/')) {
      plan.offerId = 'FREE0';
      plan.frequency = 'monthly';
      plan.name = 'Free';
      plan.stringId = 'free-trial';
    } else {
      plan.offerId = params.get('items[0][id]');
      plan.frequency = null;
      plan.name = 'Premium';
      plan.stringId = '3-month-trial';
    }

    if (plan.offerId === '70C6FDFC57461D5E449597CC8F327CF1' || plan.offerId === 'CFB1B7F391F77D02FE858C43C4A5C64F') {
      plan.frequency = 'Monthly';
    } else if (plan.offerId === 'E963185C442F0C5EEB3AE4F4AAB52C24' || plan.offerId === 'BADDACAB87D148A48539B303F3C5FA92') {
      plan.frequency = 'Annual';
    } else {
      plan.frequency = null;
    }

    const countryOverride = new URLSearchParams(window.location.search).get('country');
    const offer = await getOffer(plan.offerId, countryOverride);

    if (offer) {
      plan.currency = offer.currency;
      plan.price = offer.unitPrice;
      plan.formatted = `${offer.unitPriceCurrencyFormatted}`;
      plan.country = offer.country;
      plan.vatInfo = offer.vatInfo;
      plan.language = offer.lang;
      plan.rawPrice = offer.unitPriceCurrencyFormatted.match(/[\d\s,.+]+/g);
      plan.prefix = offer.prefix ?? '';
      plan.suffix = offer.suffix ?? '';
      plan.formatted = plan.formatted.replace(plan.rawPrice[0], `<strong>${plan.prefix}${plan.rawPrice[0]}${plan.suffix}</strong>`);
    }

    window.pricingPlans[planUrl] = plan;
  }

  return plan;
}

async function buildPayload($block) {
  const payload = {
    free: {},
    premium: {},
    cardPadding: window.innerWidth >= 1200 ? 64 : 40,
  };

  [...$block.children].forEach(($row, index) => {
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
      payload.free.subCopy = subCopies[0].textContent.trim();
      payload.premium.subCopy = subCopies[1].textContent.trim();
      payload.premium.pricingUrl = subCopies[1].querySelector('a').href;
    }

    if (index === 3) {
      const lists = $row.querySelectorAll('ul');
      payload.free.features = lists[0].querySelectorAll('li');
      payload.premium.features = lists[1].querySelectorAll('li');
    }

    if (index === 4) {
      const ctas = $row.querySelectorAll('div');
      payload.free.ctas = ctas[0].querySelectorAll('a');
      payload.premium.ctas = ctas[1].querySelectorAll('a');
    }
  });

  if (payload && payload.premium && payload.premium.subCopy && payload.premium.pricingUrl) {
    const plan = await fetchPlan(payload.premium.pricingUrl);
    const pricing = `${plan.formatted.replace('<strong>', '').replace('</strong>', '')}`;
    const subcopy = payload.premium.subCopy;

    if (subcopy.indexOf('{{pricing}}') !== -1) {
      if (plan.vatInfo !== '') {
        payload.premium.subCopy = subcopy.replace('{{pricing}}', `${pricing} ${plan.vatInfo}`);
      } else {
        payload.premium.subCopy = subcopy.replace('{{pricing}}', pricing);
      }
    }
  }

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

function expandCard($card, payload, initialLoad) {
  const $heading = $card.querySelector('.plans-comparison-heading');
  const $subcopy = $card.querySelector('.plans-comparison-sub-copy');
  const $featuresWrapper = $card.querySelector('.features-wrapper');
  const $ctasWrapper = $card.querySelector('.ctas-wrapper');
  if (!$card.classList.contains('expanded')) {
    $card.classList.add('expanded');
    if (window.innerWidth >= 1200) {
      if (!initialLoad) {
        $card.classList.add('clip');
        $card.style.maxWidth = `${$card.parentElement.offsetWidth - 354}px`;
        setTimeout(() => {
          $card.classList.remove('clip');
        }, 700);
      } else {
        $card.style.transition = 'unset';
        $card.style.maxWidth = `${$card.parentElement.offsetWidth - 354}px`;
        $card.style.removeProperty('transition');
      }
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

function toggleExpandableCard($block, $cardClicked, payload, initial) {
  const $cards = $block.querySelectorAll('.plans-comparison-card');
  const $paginations = $block.querySelectorAll('.pagination-pill');
  $cards.forEach(($card, index) => {
    if ($card !== $cardClicked) {
      collapseCard($card, payload);
      $paginations[index].classList.remove('active');
    } else {
      $paginations[index].classList.add('active');
    }
  });
  expandCard($cardClicked, payload, initial);
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
  if (value && value.features) {
    value.features.forEach((feature) => {
      $featuresWrapper.append(feature);
    });
  }
  return $featuresWrapper;
}

function decorateCTAs($block, payload, value) {
  const $buttonsWrapper = createTag('ul', { class: 'ctas-wrapper' });
  if (value && value.ctas) {
    value.ctas.forEach((cta, index) => {
      $buttonsWrapper.append(cta);
      if (index === 0) {
        cta.classList.add('primary');
      }

      cta.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  }

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
    }
  }
}

function decoratePagination($block, payload) {
  const $paginationWrapper = createTag('div', { class: 'pagination-wrapper' });
  const $cards = $block.querySelectorAll('.plans-comparison-card');
  if ($cards) {
    $cards.forEach(($card) => {
      const $paginationPill = createTag('span', { class: 'pagination-pill' });
      $paginationWrapper.append($paginationPill);

      $paginationPill.addEventListener('click', () => {
        toggleExpandableCard($block, $card, payload);
      });
    });
    $block.append($paginationWrapper);
  }
}

function resizeCards($cards, $featuresWrappers, payload) {
  $cards.forEach(($card, index) => {
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

      $featuresWrappers.forEach((wrapper) => {
        wrapper.style.maxHeight = payload.desiredHeight;
      });
    } else {
      $card.style.maxWidth = '';
      if ($card.classList.contains('expanded')) {
        $card.style.maxHeight = `${$card.offsetHeight}px`;
      } else {
        collapseCard($card, payload);
      }

      $featuresWrappers.forEach((wrapper) => {
        wrapper.style.maxHeight = 'none';
      });
    }
  });
}

export default async function decorate($block) {
  const enclosingMain = $block.closest('main');
  if (enclosingMain) {
    let payload;
    const $linkList = enclosingMain.querySelector('.link-list-container');
    const $oldSection = $block.closest('.section');
    const $newSection = await fetchPlainBlockFromFragment('/express/fragments/plans-comparison', 'plans-comparison');

    if ($oldSection) {
      $oldSection.parentNode.replaceChild($newSection, $oldSection);
    }

    if ($newSection) {
      // hide section to avoid showing broken block
      $newSection.style.display = 'none';
      if ($linkList) {
        $linkList.before($newSection);
      }

      const $blockFromFragment = $newSection.querySelector('.plans-comparison');
      if ($blockFromFragment) {
        payload = await buildPayload($blockFromFragment);
        $blockFromFragment.innerHTML = payload.mainHeading;
        $blockFromFragment.querySelector('div').classList.add('main-heading-wrapper');
        decorateCards($blockFromFragment, payload);
        decoratePagination($blockFromFragment, payload);
        const $cards = $blockFromFragment.querySelectorAll('.plans-comparison-card');
        const $featuresWrappers = $blockFromFragment.querySelectorAll('.features-wrapper');

        if ($cards) {
          setTimeout(() => {
            $newSection.style.removeProperty('display');
            toggleExpandableCard($blockFromFragment, $cards[1], payload, true);
            resizeCards($cards, $featuresWrappers, payload);
            payload.desiredHeight = `${$featuresWrappers[1].offsetHeight}px`;
            toggleExpandableCard($blockFromFragment, $cards[0], payload, true);

            if (window.innerWidth >= 1200) {
              $featuresWrappers.forEach((wrapper) => {
                wrapper.style.maxHeight = payload.desiredHeight;
              });
            }

            $blockFromFragment.classList.add('restrained');
          }, 100);

          setTimeout(() => {
            $cards.forEach(($card) => {
              $card.classList.add('transition');
            });
          }, 700);
        }

        window.addEventListener('resize', () => {
          resizeCards($cards, $featuresWrappers, payload);
        });

        fixIcons($blockFromFragment);

        const $blockLinks = $blockFromFragment.querySelectorAll('a');

        if ($blockLinks) {
          const linksPopulated = new CustomEvent('linkspopulated', { detail: $blockLinks });
          document.dispatchEvent(linksPopulated);
        }

        document.dispatchEvent(new Event('planscomparisonloaded'));
      }
    }
  }
}
