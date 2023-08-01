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
/* global digitalData _satellite */
/* eslint-disable no-underscore-dangle */

import {
  addPublishDependencies,
  createTag,
  fetchPlaceholders,
  getHelixEnv,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';
import { getOffer } from '../../scripts/utils/pricing.js';

function replaceUrlParam(url, paramName, paramValue) {
  const params = url.searchParams;
  params.set(paramName, paramValue);
  url.search = params.toString();
  return url;
}

export function buildUrl(optionUrl, country, language) {
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
  const useAlloy = (
    window.location.hostname === 'www.stage.adobe.com'
    || (
      url.searchParams.has('martech')
      && url.searchParams.get('martech').includes('alloy')
    )
  );

  if (useAlloy) {
    _satellite.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: adobeEventName,
            linkClicks: {
              value: 1,
            },
            type: 'other',
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventName: adobeEventName,
              },
            },
            spark: {
              eventData: {
                eventName: sparkEventName,
                trigger: sparkTouchpoint,
                sendTimestamp: new Date().getTime(),
                contextualData4: `billingFrequency:${plan.frequency}`,
                contextualData6: `commitmentType:${plan.frequency}`,
                contextualData7: `currencyCode:${plan.currency}`,
                contextualData9: `offerId:${plan.offerId}`,
                contextualData10: `price:${plan.price}`,
                contextualData12: `productName:${plan.name} - ${plan.frequency}`,
                contextualData14: 'quantity:1',
              },
            },
          },
        },
      },
    });
  } else {
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
}

function decorateIconList($column) {
  let $iconList = createTag('div', { class: 'pricing-iconlist' });
  let $iconListDescription;
  Array.from($column.children).forEach(($e) => {
    const $img = $e.querySelector('img.icon, svg.icon');
    if ($img) {
      const $iconListRow = createTag('div');
      const $iconDiv = createTag('div', { class: 'pricing-iconlist-icon' });
      $iconDiv.appendChild($img);
      $iconListRow.append($iconDiv);
      $iconListDescription = createTag('div', { class: 'pricing-iconlist-description' });
      $iconListRow.append($iconListDescription);
      $iconListDescription.appendChild($e);
      $iconList.appendChild($iconListRow);
    } else {
      if ($iconList.children.length > 0) {
        $column.appendChild($iconList);
        $iconList = createTag('div', { class: 'pricing-iconlist' });
      }
      $column.appendChild($e);
    }
  });
  if ($iconList.children.length > 0) $column.appendChild($iconList);
}

async function fetchPlan(planUrl) {
  const link = new URL(planUrl);
  const params = link.searchParams;

  const plan = {
    url: planUrl,
    country: 'us',
    language: 'en',
    price: '9.99',
    currency: 'US',
    symbol: '$',
  };

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
    plan.formatted = plan.formatted.replace(plan.rawPrice[0], `<strong>${plan.rawPrice[0]}</strong>`);
  }

  return plan;
}

async function selectPlan($pricingHeader, planUrl, sendAnalyticEvent) {
  const plan = await fetchPlan(planUrl);

  $pricingHeader.querySelector('.pricing-columns-price').innerHTML = plan.formatted;
  $pricingHeader.querySelector('.pricing-columns-price').classList.add(plan.currency.toLowerCase());
  $pricingHeader.querySelector('.pricing-columns-cta').href = buildUrl(plan.url, plan.country, plan.language);
  $pricingHeader.querySelector('.pricing-columns-cta').dataset.planUrl = planUrl;
  $pricingHeader.querySelector('.pricing-columns-cta').id = plan.stringId;
  $pricingHeader.querySelector('.pricing-columns-vat-info').innerHTML = plan.vatInfo || '';

  if (sendAnalyticEvent) {
    const adobeEventName = 'adobe.com:express:pricing:commitmentType:selected';
    const sparkEventName = 'pricing:commitmentTypeSelected';
    pushPricingAnalytics(adobeEventName, sparkEventName, plan);
  }
}

function decoratePlan($column) {
  const $elements = Array.from($column.children);
  const $pricingHeader = createTag('div', { class: 'pricing-columns-header' });
  const $pricingTitle = createTag('h3', { class: 'pricing-columns-title' });
  const $pricingTitleIcon = createTag('span', { class: 'pricing-columns-title-icon' });
  const plans = [];

  $elements.forEach(($element) => {
    if ($element.classList.contains('button-container')) {
      const $link = $element.querySelector('a');
      plans.push({
        name: $link.textContent.trim(),
        url: $link.href,
      });
    }
  });

  $pricingTitle.innerHTML = $elements[0].innerHTML;
  $pricingTitleIcon.innerHTML = $elements[1].innerHTML;
  $pricingTitle.prepend($pricingTitleIcon);
  $pricingHeader.append($pricingTitle);

  if (plans) {
    const $pricingPlan = createTag('div', { class: 'pricing-columns-plan' });
    const $pricingPrice = createTag('span', { class: 'pricing-columns-price' });
    const $pricingVatInfo = createTag('span', { class: 'pricing-columns-vat-info' });

    $pricingPlan.append($pricingPrice);

    if (plans.length > 1) {
      const $pricingDropdown = createTag('select', { class: 'pricing-columns-dropdown' });
      fetchPlaceholders().then((placeholders) => {
        $pricingDropdown.title = placeholders.subscription;
      });

      $pricingDropdown.addEventListener('change', () => {
        selectPlan($pricingHeader, $pricingDropdown.value, true);
      });

      plans.forEach((plan) => {
        const $option = createTag('option', { value: plan.url });
        $option.innerHTML = plan.name;
        $pricingDropdown.append($option);
      });

      $pricingPlan.append($pricingDropdown);
    }

    $pricingHeader.append($pricingPlan);
    $pricingHeader.append($pricingVatInfo);

    const $pricingCta = createTag('a', { class: 'pricing-columns-cta button large' });
    $pricingCta.innerHTML = $elements[2].textContent.trim();
    $pricingCta.href = plans[0].url;
    $pricingCta.addEventListener('click', async () => {
      const { planUrl } = $pricingCta.dataset;
      const plan = await fetchPlan(planUrl);
      const adobeEventName = 'adobe.com:express:pricing:beginPurchaseFlow';
      const sparkEventName = 'beginPurchaseFlow';
      pushPricingAnalytics(adobeEventName, sparkEventName, plan);
    });
    $pricingHeader.append($pricingCta);

    selectPlan($pricingHeader, plans[0].url, false);
  }

  if (!$elements[$elements.length - 1].classList.contains('button-container')) {
    $elements[$elements.length - 1].classList.add('pricing-columns-cta-text');
    $pricingHeader.append($elements[$elements.length - 1]);
  }

  return $pricingHeader;
}

function decoratePricingColumns($block) {
  const $rows = Array.from($block.children);
  $block.innerHTML = '';

  Array.from($rows[0].children).forEach(($column) => {
    if ($column.innerHTML) {
      const $pricingColumnsHeader = decoratePlan($column);
      $block.append($pricingColumnsHeader);
    }
  });

  Array.from($rows[1].children).forEach(($column) => {
    if ($column.innerHTML.length) {
      const $pricingColumnsContent = createTag('div', { class: 'pricing-columns-content' });
      $pricingColumnsContent.innerHTML = $column.innerHTML;
      decorateIconList($pricingColumnsContent);
      $block.append($pricingColumnsContent);
    }
  });

  addPublishDependencies('/express/system/offers.json');
}

export default function decorate($block) {
  decoratePricingColumns($block);
}
