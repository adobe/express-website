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

/* eslint-disable import/named, import/extensions */
import {
  createTag,
  getHelixEnv,
  getLottie,
  lazyLoadLottiePlayer,
  getIconElement, fetchPlaceholders,
} from '../../scripts/scripts.js';
import { getOffer } from '../../scripts/utils/pricing.js';

/* eslint-disable import/named, import/extensions */
import {
  buildDropdown,
} from '../shared/dropdown.js';

function replaceUrlParam(url, paramName, paramValue) {
  const params = url.searchParams;
  params.set(paramName, paramValue);
  url.search = params.toString();
  return url;
}

function buildUrl(optionUrl, country, language) {
  const currentUrl = new URL(window.location.href);
  let planUrl = new URL(optionUrl);

  if (!planUrl.hostname.includes('commerce')) {
    return planUrl.href;
  }
  planUrl = replaceUrlParam(planUrl, 'co', country);
  planUrl = replaceUrlParam(planUrl, 'lang', language);
  let rUrl = planUrl.searchParams.get('rUrl');
  if (currentUrl.searchParams.has('host')) {
    const hostParam = currentUrl.searchParams.get('host');
    if (hostParam === 'express.adobe.com') {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    } else if (hostParam.includes('qa.adobeprojectm.com')) {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    } else if (hostParam.includes('.adobeprojectm.com')) {
      planUrl.hostname = 'commerce-stg.adobe.com';
      if (rUrl) rUrl = rUrl.replace('adminconsole.adobe.com', 'stage.adminconsole.adobe.com');
      if (rUrl) rUrl = rUrl.replace('express.adobe.com', hostParam);
    }
  }

  const env = getHelixEnv();
  if (env && env.commerce && planUrl.hostname.includes('commerce')) planUrl.hostname = env.commerce;
  if (env && env.spark && rUrl) {
    const url = new URL(rUrl);
    url.hostname = env.spark;
    rUrl = url.toString();
  }

  if (rUrl) {
    rUrl = new URL(rUrl);

    if (currentUrl.searchParams.has('touchpointName')) {
      rUrl = replaceUrlParam(rUrl, 'touchpointName', currentUrl.searchParams.get('touchpointName'));
    }
    if (currentUrl.searchParams.has('destinationUrl')) {
      rUrl = replaceUrlParam(rUrl, 'destinationUrl', currentUrl.searchParams.get('destinationUrl'));
    }
    if (currentUrl.searchParams.has('srcUrl')) {
      rUrl = replaceUrlParam(rUrl, 'srcUrl', currentUrl.searchParams.get('srcUrl'));
    }
  }

  if (currentUrl.searchParams.has('code')) {
    planUrl.searchParams.set('code', currentUrl.searchParams.get('code'));
  }

  if (currentUrl.searchParams.get('rUrl')) {
    rUrl = currentUrl.searchParams.get('rUrl');
  }

  if (rUrl) planUrl.searchParams.set('rUrl', rUrl.toString());
  return planUrl.href;
}

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

      if (plan.name !== 'Free') {
        plan.formatted += '*';
      }
    }

    window.pricingPlans[planUrl] = plan;
  }

  return plan;
}

async function buildPlansDropdown($block, $card, $button, $appList) {
  const dropdownOptions = [];

  $appList.querySelectorAll('li').forEach(($listItem) => {
    const $link = $listItem.querySelector('a');

    const option = {
      icon: $listItem.querySelector('img, svg'),
      text: $link ? $link.textContent : $listItem.textContent,
      value: $link ? $link.href : $button.href,
    };

    dropdownOptions.push(option);
  });

  const $dropdown = buildDropdown(dropdownOptions, [], async (option) => {
    const newPlan = await fetchPlan(option.value);
    const planLink = buildUrl(newPlan.url, newPlan.country, newPlan.language);

    Array.from($card.children).forEach(($row) => {
      if ($row.classList.contains('pricing-hub-card-pricing-text')) {
        $row.innerHTML = newPlan.formatted;
        $button.href = planLink;
      }

      if ($row.classList.contains('pricing-hub-card-pricing-secondary')) {
        if (newPlan.vatInfo) {
          $row.style.display = 'block';
          $row.textContent = newPlan.vatInfo;
        } else {
          $row.style.display = 'none';
        }
      }
    });

    const $firstFeature = $block.querySelector('.pricing-hub-feature.bundle-plan-feature');
    const $overlayCards = $block.querySelectorAll('.pricing-hub-scroll-overlay-card');

    if ($firstFeature) {
      const $firstFeatureHeading = $firstFeature.querySelector('h3');
      const $firstFeatureTooltip = $firstFeature.querySelector('.pricing-hub-feature-tooltip');

      if ($firstFeatureHeading) {
        $firstFeatureHeading.innerHTML = option.text;
        $firstFeatureHeading.prepend(option.icon.cloneNode(true));
      }

      if ($firstFeatureTooltip) {
        fetchPlaceholders().then((placeholders) => {
          if (placeholders['bundle-plan-description']) {
            $firstFeatureTooltip.textContent = placeholders['bundle-plan-description'].replaceAll('{{ App Name }}', option.text.replace('Adobe', ''));
          }
        });
      }
    }

    if ($overlayCards.length > 0) {
      const $bundleOverlayButton = $overlayCards[$overlayCards.length - 1].querySelector('.button-container > a');
      if ($bundleOverlayButton) $bundleOverlayButton.href = planLink;
    }

    newPlan.bundleType = option.text;
    const linksPopulated = new CustomEvent('pricingdropdown', { detail: newPlan });
    document.dispatchEvent(linksPopulated);
  });

  $appList.remove();

  Array.from($card.children).forEach(($row) => {
    if ($row.textContent.includes('{{ App Picker }}')) {
      $row.textContent = '';
      $row.append($dropdown);
    }
  });
}

async function decorateCards($block) {
  const $rows = Array.from($block.children);

  const $headersContainer = $rows[0];
  const $cardsContainer = $rows[1];
  const $buttonsContainer = $rows[2];

  const $headers = Array.from($headersContainer.children);
  const $cards = Array.from($cardsContainer.children);
  const $buttonDivs = Array.from($buttonsContainer.children);

  $cardsContainer.classList.add('pricing-hub-cards');
  $cards[0].remove();

  for (let i = 1; i < 4; i += 1) {
    const $header = $headers[i];
    const $card = $cards[i];
    const $buttonContainer = $buttonDivs[i];
    const $button = $buttonContainer.querySelector('a');
    const $svg = $card.querySelector('svg');
    const $title = $card.querySelector('h2');

    if ($header.textContent) {
      $header.classList.add('pricing-hub-card-header');
      $card.prepend($header);
    } else {
      $header.remove();
    }

    if ($title && $svg) {
      $svg.parentElement.remove();
      $title.prepend($svg);
    }

    $card.classList.add('pricing-hub-card');

    if (i === 2) {
      $card.classList.add('pricing-hub-card-highlight');
    }

    if ($buttonContainer && $button) {
      $card.append($buttonContainer);

      if ($card.classList.contains('pricing-hub-card-highlight')) {
        $button.classList.remove('accent');
        $button.classList.add('large', 'dark');
      } else {
        $button.classList.add('large', 'reverse');
      }

      // eslint-disable-next-line no-await-in-loop
      const plan = await fetchPlan($button.href);

      if ($card.textContent.includes('{{ App Picker }}')) {
        const $appList = $card.querySelector('ul');

        if ($appList) {
          // eslint-disable-next-line no-await-in-loop
          await buildPlansDropdown($block, $card, $button, $appList);
        }
      }

      if (plan) {
        Array.from($card.children).forEach(($row) => {
          if ($row.textContent.includes('{{ Pricing }}')) {
            $row.classList.add('pricing-hub-card-pricing-text');
            $row.innerHTML = $row.innerHTML.replace('{{ Pricing }}', plan.formatted);

            const $pricingSecondaryText = createTag('p', { class: 'pricing-hub-card-pricing-secondary' });
            $row.parentElement.insertBefore($pricingSecondaryText, $row.nextSibling);

            if (plan.vatInfo) {
              $pricingSecondaryText.style.display = 'block';
              $pricingSecondaryText.textContent = plan.vatInfo;
            } else {
              $pricingSecondaryText.style.display = 'none';
            }

            $button.href = buildUrl(plan.url, plan.country, plan.language);
          }
        });
      }
      $button.removeAttribute('target');
    }
  }

  $headersContainer.remove();
  $buttonsContainer.remove();
}

async function decorateScrollOverlay(block) {
  const cards = Array.from(block.querySelectorAll('.pricing-hub-card'));
  if (!cards || cards.length !== 3) return;
  const scrollOverlay = createTag('div', { class: 'pricing-hub-scroll-overlay' });
  cards.forEach((card, index) => {
    const scrollCard = createTag('div', { class: 'pricing-hub-scroll-overlay-card' });
    scrollOverlay.append(scrollCard);
    const title = card.querySelector('h2').cloneNode(true);
    const cta = card.querySelector('.button-container').cloneNode(true);
    scrollCard.append(title, cta);
    const scrollToCard = (e) => {
      if (e.target.tagName === 'A') return;
      window.scrollTo({
        top: document.querySelector(`.pricing-hub-cards > :nth-child(${index + 1})`).getBoundingClientRect().top + window.scrollY - 85,
        behavior: 'smooth',
      });
    };
    scrollCard.addEventListener('click', scrollToCard);
    scrollCard.addEventListener('touchstart', scrollToCard);
  });
  block.append(scrollOverlay);

  const featuresSection = block.querySelector('.pricing-hub-features');
  if (featuresSection) {
    const checkIfScrolled = () => {
      const rect = featuresSection.getBoundingClientRect();
      if (rect.height > 0 && rect.top < 80 && rect.bottom > 0) {
        scrollOverlay.classList.add('pricing-hub-scroll-overlay-scrolled');
      } else {
        scrollOverlay.classList.remove('pricing-hub-scroll-overlay-scrolled');
      }
    };
    document.addEventListener('scroll', checkIfScrolled);
    document.addEventListener('resize', checkIfScrolled);
  }
}

function decorateMidSection($block) {
  const $rows = Array.from($block.children);
  const $midSection = $rows[1];
  const $midSectionHeader = $midSection.querySelector('strong');
  $midSectionHeader.classList.add('pricing-hub-lottie-button-scroll');
  $midSectionHeader.addEventListener('click', () => {
    window.scrollTo({
      top: $midSectionHeader.getBoundingClientRect().bottom + window.scrollY + 90,
      behavior: 'smooth',
    });
  });

  const $midSectionAnimation = createTag('span', { class: 'pricing-hub-lottie' });

  $midSection.classList.add('pricing-hub-midsection');
  $midSectionAnimation.innerHTML = getLottie('purple-arrows', '/express/blocks/pricing-hub/purple-arrows.json');
  $midSectionHeader.append($midSectionAnimation);
  lazyLoadLottiePlayer();
}

function decorateFeatures($block) {
  const $rows = Array.from($block.children);
  const $features = createTag('div', { class: 'pricing-hub-features' });
  $features.append(createTag('div', { class: 'pricing-hub-gradient' }));

  for (let i = 2; i < $rows.length; i += 1) {
    const $feature = $rows[i];
    const $columns = Array.from($feature.children);
    const $columnsContainer = createTag('div', { class: 'pricing-hub-feature-columns' });
    const $title = $feature.querySelector('h3');
    const $icon = $feature.querySelector('svg, img');

    if (i === 2) {
      $feature.classList.add('bundle-plan-feature');
    }

    if ($title && $icon) {
      $icon.parentElement.remove();
      $title.prepend($icon);
    }

    const $tooltipText = $feature.querySelector('p');

    if ($tooltipText) {
      const tooltipText = $tooltipText.textContent.trim();

      if (tooltipText) {
        const tooltipIcon = getIconElement('info');
        const tooltipChevron = createTag('div', { class: 'pricing-hub-feature-tooltip-chevron' });
        const $tooltip = createTag('div', {
          class: 'pricing-hub-feature-tooltip-icon',
          'aria-label': $tooltipText.textContent,
          role: 'tooltip',
          tabindex: '0',
        });

        $tooltipText.classList.add('pricing-hub-feature-tooltip');
        $tooltip.append(tooltipIcon);

        $columns[0].append($tooltip);
        $tooltip.append(tooltipChevron);
        $tooltip.append($tooltipText);
      }
    }

    $feature.classList.add('pricing-hub-feature');
    $features.append($feature);

    $columns[0].classList.add('pricing-hub-feature-title');

    [$columns[1], $columns[2], $columns[3]].forEach(($column, index) => {
      const $columnChildren = Array.from($column.children);
      $column.classList.add('pricing-hub-feature-column');

      if (index === 1) {
        $columns[2].classList.add('pricing-hub-feature-column-highlight');
      }

      if ($columnChildren.length === 3) {
        $columnChildren[1].classList.add('pricing-hub-feature-text-desktop');
        $columnChildren[2].classList.add('pricing-hub-feature-text-mobile');
      }
    });

    $columnsContainer.append($columns[1]);
    $columnsContainer.append($columns[2]);
    $columnsContainer.append($columns[3]);

    $feature.append($columnsContainer);
  }

  $block.append($features);
}

export default async function decorate($block) {
  await decorateCards($block);
  decorateMidSection($block);
  decorateFeatures($block);
  await decorateScrollOverlay($block);
}
