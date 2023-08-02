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

import {
  createTag,
  addPublishDependencies,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';
import {
  buildUrl,
  buildPlans,
// eslint-disable-next-line import/no-unresolved
} from '../pricing/pricing.js';
import { getOffer, formatPrice, getCurrency } from '../../scripts/utils/pricing.js';

async function decorateCommerceCTA($block) {
  const $rows = Array.from($block.children);
  let plans = [];
  let planTitle;
  let planCadence = 'mo';
  let $ctaButton;
  $rows.forEach(($row, index) => {
    if (index === 0) {
      plans = buildPlans($row);
      if ($row.querySelector('h3')) {
        planTitle = $row.querySelector('h3').textContent.trim();
      }
      if ($row.querySelector('a')) {
        $ctaButton = $row.querySelector('a').cloneNode(true);
      }
    }
    if (index === 1) {
      planCadence = $row.textContent.trim();
    }
  });
  $block.innerHTML = '';
  if (!$ctaButton) return;
  if (!plans[0]) return;

  const plan = plans[0].options[0];
  const countryOverride = new URLSearchParams(window.location.search).get('country');
  const offer = await getOffer(plan.offerId, countryOverride);
  if (offer) {
    plan.title = offer.title;
    plan.currency = offer.currency;
    plan.price = offer.unitPrice;
    plan.formatted = offer.unitPriceCurrencyFormatted;
    plan.country = offer.country;
    plan.language = offer.lang;
  } else {
    plan.formatted = formatPrice(plan.price, getCurrency());
  }

  $ctaButton.href = buildUrl(plan.link, plan.country, plan.language);
  $ctaButton.classList.add('large');

  const $planSection = createTag('div', { class: 'pricing-plan' });
  const $planSectionTitle = createTag('p', { class: 'pricing-plan-title' });
  $planSectionTitle.dataset.id = '0';
  $planSectionTitle.textContent = planTitle;
  const $planPrice = createTag('p', { class: 'pricing-plan-price' });
  $planPrice.textContent = plan.formatted;
  const $planCadence = createTag('span', { class: 'pricing-plan-cadence' });
  $planCadence.textContent = `/${planCadence}`;
  $planPrice.appendChild($planCadence);
  $block.appendChild($planSectionTitle);
  $planSection.appendChild($planPrice);
  $planSection.appendChild($ctaButton);
  $block.appendChild($planSection);
  addPublishDependencies('/express/system/offers.json');
}

export default async function decorate($block) {
  return decorateCommerceCTA($block);
}
