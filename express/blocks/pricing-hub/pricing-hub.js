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
  createTag, getHelixEnv, getOffer,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

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

function pushPricingAnalytics(adobeEventName, sparkEventName, plan) {
  const url = new URL(window.location.href);
  const sparkTouchpoint = url.searchParams.get('touchpointName');

  /* eslint-disable no-underscore-dangle */
  /* global digitalData _satellite */
  digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
  digitalData._set('spark.eventData.eventName', sparkEventName);
  digitalData._set('spark.eventData.contextualData4', `billingFrequency:${plan.frequency}`);
  digitalData._set('spark.eventData.contextualData6', `commitmentType:${plan.frequency}`);
  digitalData._set('spark.eventData.contextualData7', `currencyCode:${plan.currency}`);
  digitalData._set('spark.eventData.contextualData9', `offerId:${plan.offerId}`);
  digitalData._set('spark.eventData.contextualData10', `price:${plan.price}`);
  digitalData._set('spark.eventData.contextualData12', `productName:${plan.name} - ${plan.frequency}`);
  digitalData._set('spark.eventData.contextualData14', 'quantity:1');
  digitalData._set('spark.eventData.trigger', sparkTouchpoint);

  _satellite.track('event', {
    digitalData: digitalData._snapshot(),
  });

  digitalData._delete('primaryEvent.eventInfo.eventName');
  digitalData._delete('spark.eventData.eventName');
  digitalData._delete('spark.eventData.contextualData4');
  digitalData._delete('spark.eventData.contextualData6');
  digitalData._delete('spark.eventData.contextualData7');
  digitalData._delete('spark.eventData.contextualData9');
  digitalData._delete('spark.eventData.contextualData10');
  digitalData._delete('spark.eventData.contextualData12');
  digitalData._delete('spark.eventData.contextualData14');
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

      if (plan) {
        Array.from($card.children).forEach(($row) => {
          if ($row.textContent.includes('{{ Pricing }}')) {
            $row.classList.add('pricing-hub-card-pricing-text');
            $row.innerHTML = $row.innerHTML.replace('{{ Pricing }}', plan.formatted);
            $button.href = buildUrl(plan.url, plan.country, plan.language);
          }
        });
      }
    }
  }

  $headersContainer.remove();
  $buttonsContainer.remove();
}

function decorateFeatures($block) {
  const $rows = Array.from($block.children);
  const $features = createTag('div', { class: 'pricing-hub-features' });

  for (let i = 2; i < $rows.length; i += 1) {
    const $feature = $rows[i];
    const $columns = Array.from($feature.children);
    const $columnsContainer = createTag('div', { class: 'pricing-hub-feature-columns' });
    const $title = $feature.querySelector('h3');
    const $icon = $feature.querySelector('svg, img');

    if ($title && $icon) {
      $icon.parentElement.remove();
      $title.prepend($icon);
    }

    const $tooltip = $feature.querySelector('p');

    if ($tooltip) {
      $tooltip.classList.add('pricing-hub-feature-tooltip');
      const tooltipIcon = createTag('div', { class: 'pricing-hub-feature-tooltip-icon' });
      const tooltipChevron = createTag('div', { class: 'pricing-hub-feature-tooltip-chevron' });
      tooltipIcon.innerHTML = 'i';
      $columns[0].append(tooltipIcon);
      tooltipIcon.append(tooltipChevron);
      tooltipIcon.append($tooltip);
    }

    $feature.classList.add('pricing-hub-feature');
    $features.append($feature);

    $columns[0].classList.add('pricing-hub-feature-title');
    $columns[1].classList.add('pricing-hub-feature-column');
    $columns[2].classList.add('pricing-hub-feature-column', 'pricing-hub-feature-column-highlight');
    $columns[3].classList.add('pricing-hub-feature-column');

    $columnsContainer.append($columns[1]);
    $columnsContainer.append($columns[2]);
    $columnsContainer.append($columns[3]);

    $feature.append($columnsContainer);
  }

  $block.append($features);
}

export default async function decorate($block) {
  await decorateCards($block);
  decorateFeatures($block);
}
