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

import { createTag } from '../../scripts/scripts.js';
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
  }

  return plan;
}

function handleHeader(column) {
  column.classList.add('pricing-column');

  const title = column.querySelector('h2');
  const icon = column.querySelector('img');
  const header = createTag('div', { class: 'pricing-header' });

  header.append(title, icon);

  return header;
}

function handlePrice(column) {
  const price = column.querySelector('[title="{{pricing}}"]');
  const priceContainer = price?.parentNode;
  const plan = priceContainer?.nextElementSibling;

  const priceText = createTag('div', { class: 'pricing-price' });
  const pricePlan = createTag('div', { class: 'pricing-plan' });

  pricePlan.append(priceText, plan);

  fetchPlan(price?.href).then((response) => {
    priceText.innerHTML = response.formatted;
  });

  priceContainer?.remove();

  return pricePlan;
}

function handleCtas(column) {
  const ctaContainers = column.querySelectorAll('.button-container');

  const ctas = column.querySelectorAll('a');
  ctas[0]?.classList.add(ctas[1] ? 'details-cta' : 'cta', 'xlarge');
  ctas[1]?.classList.add('cta', 'xlarge');

  ctaContainers.forEach((container) => {
    container.querySelector('em')?.children[0]?.classList.add('secondary', 'dark');
  });

  return ctaContainers[ctaContainers.length - 1];
}

function handleDescription(column) {
  const description = createTag('div', { class: 'pricing-description' });
  const texts = [...column.children];

  texts.pop();

  description.append(...texts);

  return description;
}

export default function decorate(block) {
  const pricingContainer = block.children[1];

  pricingContainer.classList.add('pricing-container');

  const columnsContainer = createTag('div', { class: 'columns-container' });

  const columns = Array.from(pricingContainer.children);

  columns.forEach((column) => {
    const header = handleHeader(column);
    const pricePlan = handlePrice(column);
    const cta = handleCtas(column);
    const description = handleDescription(column);
    const spacer = createTag('div', { class: 'spacer' });

    column.append(header, description, spacer, pricePlan, cta);
    columnsContainer.append(column);
  });

  pricingContainer.append(columnsContainer);
}
