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
/* global window, fetch, digitalData, _satellite */
/* eslint-disable no-underscore-dangle */

import {
  createTag,
  getOffer,
  readBlockConfig,
  getHelixEnv,
} from '../../scripts/scripts.js';

async function fetchPricingTab(sheet, tab) {
  const url = `./${sheet}.json?sheet=${tab}`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

function buildWordList(header) {
  const words = [];
  header.forEach((row) => {
    const word = row['Header Words'];
    words.push(word);
  });
  return words;
}

function animateHeader($header, words) {
  let i = 0;
  const max = words.length;
  const firstWord = words[0];
  const headerWordTemplate = `<span id="pricing-header-word" aria-hidden="true">${firstWord}</span>`;
  $header.innerHTML = $header.innerHTML.replace('[x]', headerWordTemplate);
  $header.setAttribute('aria-label', $header.innerText);
  const $headerWord = $header.children[0];
  const interval = setInterval(() => {
    $headerWord.style.opacity = '0';
    setTimeout(() => {
      i += 1;
      if (i >= max) {
        i = 0;
      }

      $headerWord.innerHTML = words[i];
      $headerWord.style.opacity = '1';
    }, 1500);
  }, 4000);
  $headerWord.addEventListener('click', () => {
    clearInterval(interval);
    $headerWord.style.cursor = 'inherit';
  });
}

function decorateHeader($block, header) {
  const headerText = header[0]['Header Title'];
  const $header = createTag('h2', { class: 'pricing-header' });
  const words = buildWordList(header);
  $header.innerHTML = headerText;
  $block.append($header);
  animateHeader($header, words);
}

function getPlanOptions(planTitle, planOptions) {
  const options = [];
  let optionId = 0;
  planOptions.forEach((option) => {
    const optionPlan = option['Option Plan'];
    if (planTitle === optionPlan) {
      option.optionId = optionId;
      options.push(option);
      optionId += 1;
    }
  });
  return options;
}

function replaceUrlParam(url, paramName, paramValue) {
  const params = url.searchParams;
  params.set(paramName, paramValue);
  url.search = params.toString();
  return url;
}

function buildUrl(optionUrl, optionPlan, country, language) {
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
    if (hostParam === 'spark.adobe.com') {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('spark.adobe.com', hostParam);
    } else if (hostParam.includes('qa.adobeprojectm.com')) {
      planUrl.hostname = 'commerce.adobe.com';
      if (rUrl) rUrl = rUrl.replace('spark.adobe.com', hostParam);
    } else if (hostParam.includes('.adobeprojectm.com')) {
      planUrl.hostname = 'commerce-stg.adobe.com';
      if (rUrl) rUrl = rUrl.replace('adminconsole.adobe.com', 'stage.adminconsole.adobe.com');
      if (rUrl) rUrl = rUrl.replace('spark.adobe.com', hostParam);
    }
  }

  const env = getHelixEnv();
  if (env && env.commerce && planUrl.hostname.includes('commerce')) planUrl.hostname = env.commerce;

  if (rUrl) {
    rUrl = new URL(rUrl);

    if (currentUrl.searchParams.has('touchpointName')) {
      rUrl = replaceUrlParam(rUrl, 'touchpointName', currentUrl.searchParams.get('touchpointName'));
    }
    if (currentUrl.searchParams.has('destinationUrl') && optionPlan === 'Individual') {
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

function selectPlanAnalytics($plan, options) {
  const $cta = $plan.querySelector('.button');
  $cta.addEventListener('click', (e) => {
    const $optionPlan = e.target.closest('.plan');
    const $plans = $optionPlan.closest('.pricing-plans');
    const { optionId } = $optionPlan.dataset;
    const optionData = options[optionId];
    const option = {
      id: optionData.id,
      position: Array.prototype.slice.call($plans.children).indexOf($plan) + 1,
      plan: optionData.plan,
      name: optionData.name,
      price: optionData.priceUnformatted,
      frequency: optionData.frequency,
      currency: optionData.currency,
    };
    let adobeEventName;
    let sparkEventName;
    // determine whether individual | starter | etc.
    // Buy Now
    if ($cta.hostname.includes('commerce.adobe.com')) {
      // individual
      if ($cta.search.includes('spark.adobe.com')) {
        adobeEventName += `pricing:individual:${option.position}:buyNow:Click`;
        // team
      } else if ($cta.search.includes('adminconsole.adobe.com')) {
        adobeEventName += `pricing:team:${option.position}:buyNow:Click`;
      }
      sparkEventName = 'beginPurchaseFlow';
      // anything else
    } else {
      adobeEventName += `pricing:starter:${option.position}:getStarted:Click`;
      sparkEventName = 'pricing:ctaPressed';
    }

    digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
    digitalData._set('spark.eventData.eventName', sparkEventName);
    digitalData._set('primaryProduct.productInfo.amountWithoutTax', option.price);
    digitalData._set('primaryProduct.productInfo.billingFrequency', option.frequency);
    digitalData._set('primaryProduct.productInfo.cardPosition', option.position);
    digitalData._set('primaryProduct.productInfo.commitmentType', option.frequency);
    digitalData._set('primaryProduct.productInfo.currencyCode', option.currency);
    digitalData._set('primaryProduct.productInfo.offerId', option.id);
    digitalData._set('primaryProduct.productInfo.price', option.price);
    digitalData._set('primaryProduct.productInfo.productName', `${option.plan} - ${option.name}`);
    digitalData._set('primaryProduct.productInfo.quantity', 1);
    //   primaryProduct: {
    //     productInfo: {
    //       amountWithoutTax:'79.99',
    //       billingFrequency:'MONTHLY',
    //       cardPosition:'1',
    //       commitmentType:'YEAR',
    //       currencyCode:'USD',
    //       label:'ccle_direct_indirect_team',//
    //       offerId:'08A2CD1688E89927614A5F402329DB5B',
    //       price:'59.99',
    //       productCode:'ccle_direct_indirect_team',
    //       productName: '', //product Name -> 'Creative Cloud All Apps'
    // or as per the details available of the product
    //       sku:'65296994',
    //       quantity:''//Number of licenses
    //     }
    //   }
    digitalData._set('spark.eventData.contextualData4', `billingFrequency:${option.frequency}`);
    digitalData._set('spark.eventData.contextualData5', `cardPosition:${option.position}`);
    digitalData._set('spark.eventData.contextualData6', `commitmentType:${option.frequency}`);
    digitalData._set('spark.eventData.contextualData7', `currencyCode:${option.currency}`);
    digitalData._set('spark.eventData.contextualData9', `offerId:${option.id}`);
    digitalData._set('spark.eventData.contextualData10', `price:${option.price}`);
    digitalData._set('spark.eventData.contextualData12', `productName:${option.plan} - ${option.name}`);
    digitalData._set('spark.eventData.contextualData14', 'quantity:1');
    // spark.eventData.contextualData3: 'amountWithoutTax:79.99' or
    // whatever is set in primaryProduct.productInfo.amountWithoutTax
    // spark.eventData.contextualData4: 'billingFrequency:MONTHLY'
    // spark.eventData.contextualData5: 'cardPosition:1'
    // spark.eventData.contextualData6: 'commitmentType:YEAR'
    // spark.eventData.contextualData7: 'currencyCode:USD'
    // spark.eventData.contextualData8: 'label:ccle_direct_indirect_team'
    // spark.eventData.contextualData9: 'offerId:08A2CD1688E89927614A5F402329DB5B'
    // spark.eventData.contextualData10: 'price:59.99'
    // spark.eventData.contextualData11: 'productCode:ccle_direct_indirect_team'
    // spark.eventData.contextualData12: 'productName: '', //product Name ->
    // 'Creative Cloud All Apps' or as per the details available of the product
    // spark.eventData.contextualData13: 'sku:65296994'
    // spark.eventData.contextualData14: 'quantity:''//Number of licenses"
    _satellite.track('event', { digitalData: digitalData._snapshot() });
    digitalData._delete('primaryEvent.eventInfo.eventName');
    digitalData._delete('spark.eventData.eventName');
    digitalData._delete('primaryEvent.eventInfo.eventName');
    digitalData._delete('spark.eventData.eventName');
    digitalData._delete('primaryProduct.productInfo.amountWithoutTax');
    digitalData._delete('primaryProduct.productInfo.billingFrequency');
    digitalData._delete('primaryProduct.productInfo.cardPosition');
    digitalData._delete('primaryProduct.productInfo.commitmentType');
    digitalData._delete('primaryProduct.productInfo.currencyCode');
    digitalData._delete('primaryProduct.productInfo.offerId');
    digitalData._delete('primaryProduct.productInfo.price');
    digitalData._delete('primaryProduct.productInfo.productName');
    digitalData._delete('primaryProduct.productInfo.quantity');
    digitalData._delete('spark.eventData.contextualData3');
    digitalData._delete('spark.eventData.contextualData4');
    digitalData._delete('spark.eventData.contextualData5');
    digitalData._delete('spark.eventData.contextualData6');
    digitalData._delete('spark.eventData.contextualData7');
    digitalData._delete('spark.eventData.contextualData9');
    digitalData._delete('spark.eventData.contextualData10');
    digitalData._delete('spark.eventData.contextualData12');
    digitalData._delete('spark.eventData.contextualData14');
  });
}

async function rebuildOptionWithOffer(option) {
  const priceString = option['Option Price'].split('/');
  const fullPriceString = option['Option Full Price'].split('/');
  let price = priceString[0];
  const priceUnit = priceString[1];
  let fullPrice = fullPriceString[0];
  const fullPriceUnit = fullPriceString[1];
  const text = option['Option Text'];
  const cta = option['Option CTA'];
  // eslint-disable-next-line dot-notation
  const offerId = option['OfferID'];
  const fullPriceOfferId = option['Full Price OfferID'];
  let priceUnformatted = parseFloat(price);
  let language = 'en';
  let country = 'us';
  let currency = 'USD';
  const ctaUrl = option['Option Url'];
  const countryOverride = new URLSearchParams(window.location.search).get('country');

  if (offerId) {
    const offer = await getOffer(offerId, countryOverride);
    currency = offer.currency;
    price = offer.unitPriceCurrencyFormatted;
    priceUnformatted = offer.unitPrice;
    country = offer.country;
    language = offer.lang;
    if (!fullPriceOfferId) {
      fullPrice = offer.unitPriceCurrencyFormatted;
    }
  }

  if (fullPriceOfferId) {
    const fpOffer = await getOffer(fullPriceOfferId, countryOverride);
    fullPrice = fpOffer.unitPriceCurrencyFormatted;
  }

  option.id = offerId;
  option.price = price;
  option.priceUnformatted = priceUnformatted;
  option.unit = priceUnit;
  option.fullPrice = fullPrice;
  option.fullPriceUnit = fullPriceUnit;
  option.text = text;
  option.url = buildUrl(ctaUrl, option['Option Plan'], country, language);
  option.cta = cta;
  option.currency = currency;
  option.frequency = option['Analytics Frequency do-not-translate'];
  option.plan = option['Analytics Plan do-not-translate'];
  option.name = option['Analytics Name do-not-translate'];

  return option;
}

async function selectPlanOption($plan, option) {
  $plan.dataset.optionId = option.optionId;
  // eslint-disable-next-line no-param-reassign
  option = await rebuildOptionWithOffer(option);
  const $pricing = $plan.querySelector('.plan-pricing');
  const $pricingText = $plan.querySelector('.plan-secondary');
  const $cta = $plan.querySelector('.button.primary');
  if (option.price === 'Free') {
    $pricing.innerHTML = '<strong>Free</strong>';
  } else {
    $pricing.innerHTML = `<span><strong>${option.price}</strong>/${option.unit}</span>`;
    if (option.price !== option.fullPrice) {
      $pricing.innerHTML += `<span class="previous-pricing" aria-label="Discounted from ${option.fullPrice}/${option.fullPriceUnit}"><strong>${option.fullPrice}</strong>/${option.fullPriceUnit}</span>`;
    }
  }
  if (option.text) {
    $pricingText.innerHTML = option.text;
  }
  $cta.innerHTML = option.cta;
  $cta.href = option.url;
}

async function addDropdownEventListener($plan, options) {
  const $dropdown = $plan.querySelector('.plan-dropdown');

  $dropdown.addEventListener('change', async (e) => {
    const option = options[e.target.selectedIndex];
    await selectPlanOption($plan, option);

    digitalData._set('primaryEvent.eventInfo.eventName', `adobe.com:express:CTA:pricing:${option.frequency}:dropDown:Click`);
    _satellite.track('event', { digitalData: digitalData._snapshot() });
    digitalData._delete('primaryEvent.eventInfo.eventName');
  });
}

function decoratePlans($block, plans, planOptions) {
  const $plans = createTag('div', { class: 'pricing-plans' });
  $block.append($plans);
  plans.forEach((plan) => {
    const title = plan['Plan Title'];
    const description = plan['Plan Description'];
    const imageName = plan['Plan Image'];
    const imagePath = `/express/icons/${imageName}.svg`;
    const $plan = createTag('div', { class: 'plan' });
    const options = getPlanOptions(title, planOptions);
    const promotion = plan['Plan Special'];
    $plans.append($plan);
    const $header = createTag('div', { class: 'plan-header' });
    $plan.append($header);
    if (promotion) {
      $plan.classList.add('promotional');
      const $promotionalHeader = createTag('div', { class: 'plan-promotional-header' });
      $plan.append($promotionalHeader);
      const $promotionalHeaderText = createTag('span');
      $promotionalHeaderText.innerHTML = promotion;
      $promotionalHeader.append($promotionalHeaderText);
    }
    const $headerContainer = createTag('div');
    $header.append($headerContainer);
    const $title = createTag('span');
    $title.innerHTML = title;
    $headerContainer.append($title);
    const $description = createTag('p');
    $description.innerHTML = description;
    $headerContainer.append($description);
    const $icon = createTag('img', { src: imagePath, class: 'plan-icon', alt: '' });
    $header.append($icon);
    const $pricing = createTag('div', { class: 'plan-pricing' });
    $plan.append($pricing);
    const $pricingText = createTag('span', { class: 'plan-secondary' });
    $plan.append($pricingText);
    const $footer = createTag('div', { class: 'plan-footer' });
    $plan.append($footer);
    if (options.length > 1) {
      const $dropdown = createTag('select', { class: 'plan-dropdown' });
      $dropdown.setAttribute('arial-label', 'Select your plan');
      let i = 0;
      options.forEach((option) => {
        const name = option['Option Name'];
        const $option = createTag('option', { value: i });
        $option.innerHTML = name;
        $dropdown.append($option);
        i += 1;
      });
      $footer.append($dropdown);
      addDropdownEventListener($plan, options);
    }
    const $cta = createTag('a', { class: 'button primary' });
    $footer.append($cta);
    selectPlanOption($plan, options[0]);
    selectPlanAnalytics($plan, options);
  });
}

function decorateTable($block, features) {
  const categories = [];
  let categoryId = 0;
  const $featuresTable = createTag('table', { class: 'features' });
  let odd = false;
  $block.append($featuresTable);
  features.forEach((feature) => {
    const { Category, Description, Special } = feature;
    const columnOneCheck = feature['Column 1'];
    const columnTwoCheck = feature['Column 2'];
    const columnThreeCheck = feature['Column 3'];
    if (!categories.includes(Category)) {
      const categoryImage = `/express/icons/feature-category-${categoryId}.svg`;
      const $categoryRow = createTag('tr', { class: 'category' });
      $featuresTable.append($categoryRow);
      const $featureLogoColumn = createTag('td');
      $categoryRow.append($featureLogoColumn);
      const $categoryImage = createTag('img', { src: categoryImage, class: 'category-image' });
      $featureLogoColumn.append($categoryImage);
      const $categoryHeaderColumn = createTag('td', { class: 'category-text' });
      $categoryHeaderColumn.innerHTML = Category;
      $categoryRow.append($categoryHeaderColumn);
      categories.push(Category);
      odd = false;
      categoryId += 1;
    }
    const $featureRow = createTag('tr', { class: 'feature' });
    if (odd) {
      $featureRow.classList.add('odd');
    }
    odd = !odd;
    $featuresTable.append($featureRow);
    const $featureSpecialColumn = createTag('td', { class: 'feature-special' });
    $featureRow.append($featureSpecialColumn);
    if (Special) {
      const $specialText = createTag('span');
      $specialText.innerHTML = Special;
      $featureSpecialColumn.append($specialText);
    }
    const $featureText = createTag('td', { class: 'feature-text' });
    $featureText.innerHTML = Description;
    $featureRow.append($featureText);
    const $featureColumnOne = createTag('td', { class: 'feature-column' });
    $featureRow.append($featureColumnOne);
    const $columnOneImage = createTag('img');
    if (columnOneCheck === 'Y') {
      $columnOneImage.src = '/express/icons/checkmark.svg';
      $columnOneImage.alt = 'Yes';
    } else {
      $columnOneImage.src = '/express/icons/crossmark.svg';
      $columnOneImage.alt = '';
    }
    $featureColumnOne.append($columnOneImage);
    const $featureColumnTwo = createTag('td', { class: 'feature-column' });
    const $columnTwoImage = createTag('img');
    if (columnTwoCheck === 'Y') {
      $columnTwoImage.src = '/express/icons/checkmark.svg';
    } else {
      $columnTwoImage.src = '/express/icons/crossmark.svg';
    }
    $featureColumnTwo.append($columnTwoImage);
    $featureRow.append($featureColumnTwo);
    const $featureColumnThree = createTag('td', { class: 'feature-column' });
    const $columnThreeImage = createTag('img');
    if (columnThreeCheck === 'Y') {
      $columnThreeImage.src = '/express/icons/checkmark.svg';
    } else {
      $columnThreeImage.src = '/express/icons/crossmark.svg';
    }
    $featureColumnThree.append($columnThreeImage);
    $featureRow.append($featureColumnThree);
  });
}

async function fetchPricingSheet(sheet) {
  const data = {};
  const tabs = ['header', 'plans', 'plan-options', 'table'];
  const names = ['header', 'plans', 'planOptions', 'features'];
  await Promise.all(tabs.map(async (tab, i) => {
    try {
      data[names[i]] = await fetchPricingTab(sheet, tab);
    } catch (e) {
      // something went wrong
    }
  }));
  return data;
}

async function decoratePricing($block) {
  const config = readBlockConfig($block);
  const { sheet } = config;

  const {
    header, plans, planOptions, features,
  } = await fetchPricingSheet(sheet);

  $block.innerHTML = '';

  decorateHeader($block, header);
  decoratePlans($block, plans, planOptions);
  decorateTable($block, features);

  $block.classList.add('appear');
}

export default function decorate($block) {
  decoratePricing($block);
}
