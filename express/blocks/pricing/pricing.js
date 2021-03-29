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

import {
  createTag,
  getOffer,
  readBlockConfig,
  toClassName,
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
  planOptions.forEach((option) => {
    const optionPlan = option['Option Plan'];
    if (planTitle === optionPlan) {
      options.push(option);
    }
  });
  return options;
}

function replaceUrlParam(url, paramName, paramValue) {
  const params = url.searchParams;
  params.set(paramName, paramValue);
  url.search = params.toString();
  return url.toString();
}

function buildUrl(optionUrl, optionPlan) {
  const planUrl = new URL(optionUrl);
  const currentUrl = new URL(window.location.href);
  let rUrl = planUrl.searchParams.get('rUrl');
  if (currentUrl.searchParams.has('host')) {
    const hostParam = currentUrl.searchParams.get('host');
    if (hostParam === 'spark.adobe.com') {
      planUrl.hostname = 'commerce.adobe.com';
      rUrl = rUrl.replace('spark.adobe.com', hostParam);
    } else if (hostParam.includes('qa.adobeprojectm.com')) {
      planUrl.hostname = 'commerce.adobe.com';
      rUrl = rUrl.replace('spark.adobe.com', hostParam);
    } else if (hostParam.includes('.adobeprojectm.com')) {
      planUrl.hostname = 'commerce-stg.adobe.com';
      rUrl = rUrl.replace('adminconsole.adobe.com', 'stage.adminconsole.adobe.com');
      rUrl = rUrl.replace('spark.adobe.com', hostParam);
    }
  }
  if (currentUrl.searchParams.has('touchpointName')) {
    rUrl = replaceUrlParam(rUrl, 'touchpointName', currentUrl.searchParams.get('touchpointName'));
  }
  if (currentUrl.searchParams.has('destinationUrl') && optionPlan === 'Individual') {
    rUrl = replaceUrlParam(rUrl, 'destinationUrl', currentUrl.searchParams.get('destinationUrl'));
  }
  if (currentUrl.searchParams.has('srcUrl')) {
    rUrl = replaceUrlParam(rUrl, 'srcUrl', currentUrl.searchParams.get('srcUrl'));
  }
  if (currentUrl.searchParams.has('code')) {
    planUrl.searchParams.set('code', currentUrl.searchParams.get('code'));
  }
  if (currentUrl.searchParams.get('rUrl')) {
    rUrl = currentUrl.searchParams.get('rUrl');
  }

  planUrl.searchParams.set('rUrl', rUrl);
  return planUrl.href;
}

async function selectPlanOption($plan, option) {
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
  let ctaUrl = buildUrl(option['Option Url'], option['Option Plan']);
  // let currency = '$';
  const countryOverride = new URLSearchParams(window.location.search).get('country');

  if (offerId) {
    const offer = await getOffer(offerId, countryOverride);
    // currency = offer.currency;
    price = offer.unitPriceCurrencyFormatted;
    ctaUrl = offer.commerceURL;
    if (!fullPriceOfferId) {
      fullPrice = offer.unitPriceCurrencyFormatted;
    }
  }

  if (fullPriceOfferId) {
    const fpOffer = await getOffer(fullPriceOfferId, countryOverride);
    fullPrice = fpOffer.unitPriceCurrencyFormatted;
    console.log(fpOffer);
  }

  const $pricing = $plan.querySelector('.plan-pricing');
  const $pricingText = $plan.querySelector('.plan-secondary');
  const $cta = $plan.querySelector('.button.primary');

  if (price === 'Free') {
    $pricing.innerHTML = '<strong>Free</strong>';
  } else {
    $pricing.innerHTML = `<span><strong>${price}</strong>/${priceUnit}</span>`;
    if (price !== fullPrice) {
      $pricing.innerHTML += `<span class="previous-pricing" aria-label="Discounted from ${fullPrice}/${fullPriceUnit}"><strong>${fullPrice}</strong>/${fullPriceUnit}</span>`;
    }
  }
  if (text) {
    $pricingText.innerHTML = text;
  }

  $cta.innerHTML = cta;
  $cta.href = ctaUrl;
}

function addDropdownEventListener($plan, options) {
  const $dropdown = $plan.querySelector('.plan-dropdown');

  $dropdown.addEventListener('change', (e) => {
    const option = options[e.target.selectedIndex];
    selectPlanOption($plan, option);
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

    $cta.addEventListener('click', () => {
      let adobeEventName;
      let sparkEventName;
      const option = {};
      // get the position of the card in the plans
      const cardPosition = Array.prototype.slice.call($plans.children).indexOf($plan) + 1;
      // determine whether individual | starter | etc.
      // Buy Now
      if ($cta.hostname.includes('commerce.adobe.com')) {
        // individual
        if ($cta.search.includes('spark.adobe.com')) {
          adobeEventName += `pricing:individual:${cardPosition}:buyNow:Click`;
        // team
        } else if ($cta.search.includes('adminconsole.adobe.com')) {
          adobeEventName += `pricing:team:${cardPosition}:buyNow:Click`;
        }
        sparkEventName = 'beginPurchaseFlow';
      // anything else
      } else {
        adobeEventName += `pricing:starter:${cardPosition}:getStarted:Click`;
        sparkEventName = 'pricing:ctaPressed';
      }

      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.eventName', sparkEventName);
      // TODO: option.priceWithoutTax - price withou tax if you have it, otherwise ignore this
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.amountWithoutTax', option.priceWithoutTax);
      // TODO: option.billingFrequency - Set to Monthly or whatever is in the drop-down
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.billingFrequency', option.billingFrequency);
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.cardPosition', cardPosition);
      // TODO: option.commitmentType - Month, year, or whatever
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.commitmentType', option.commitmentType);
      // TODO: option.currencyCode - USD or whatever currency type is being used
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.currencyCode', option.currencyCode);
      // TODO: option.offerId - 08A2CD1688E89927614A5F402329DB5B or whatever the offer is
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.offerId', option.offerId);
      // TODO: option.price - the price with tax or whatever price
      // value you have if non-distinguishable
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.price', option.price);
      // TODO: option.productName - If there is a user friendly product name, put it here
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('primaryProduct.productInfo.productName', option.productName);
      // eslint-disable-next-line no-underscore-dangle
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
      // TODO: option.priceWithoutTax - price withou tax if you have it, otherwise ignore this
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData3', `amountWithoutTax:${option.priceWithoutTax}`);
      // TODO: option.billingFrequency - Set to Monthly or whatever is in the drop-down
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData4', `billingFrequency:${option.billingFrequency}`);
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData5', `cardPosition:${cardPosition}`);
      // TODO: option.commitmentType - Month, year, or whatever
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData6', `commitmentType:${option.commitmentType}`);
      // TODO: option.currencyCode - USD or whatever currency type is being used
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData7', `currencyCode:${option.currencyCode}`);
      // TODO: option.offerId - 08A2CD1688E89927614A5F402329DB5B or whatever the offer is
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData9', `offerId:${option.offerId}`);
      // TODO: option.price - the price with tax or whatever price
      // value you have if non-distinguishable
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData10', `price:${option.price}`);
      // TODO: option.productName - If there is a user friendly product name, put it here
      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData12', `productName:${option.productName}`);
      // eslint-disable-next-line no-underscore-dangle
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

      // eslint-disable-next-line no-underscore-dangle
      _satellite.track('event', { digitalData: digitalData._snapshot() });

      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryEvent.eventInfo.eventName');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.eventName');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryEvent.eventInfo.eventName');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.eventName');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.amountWithoutTax');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.billingFrequency');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.cardPosition');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.commitmentType');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.currencyCode');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.offerId');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.price');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.productName');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('primaryProduct.productInfo.quantity');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData3');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData4');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData5');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData6');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData7');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData9');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData10');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData12');
      // eslint-disable-next-line no-underscore-dangle
      digitalData._delete('spark.eventData.contextualData14');
    });

    selectPlanOption($plan, options[0]);
  });
}

function decorateTable($block, features) {
  const categories = [];
  const $featuresTable = createTag('table', { class: 'features' });
  let odd = false;
  $block.append($featuresTable);
  features.forEach((feature) => {
    const { Category, Description, Special } = feature;
    const columnOneCheck = feature['Column 1'];
    const columnTwoCheck = feature['Column 2'];
    const columnThreeCheck = feature['Column 3'];
    if (!categories.includes(Category)) {
      const imageName = toClassName(Category);
      const categoryImage = `/express/icons/${imageName}.svg`;
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
