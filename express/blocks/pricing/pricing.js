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
/* global window, fetch */

import {
  createTag,
  readBlockConfig,
  toClassName,
} from '../../scripts/scripts.js';

async function fetchHeader(sheet) {
  const url = `./${sheet}.json?sheet=header`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

async function fetchPlans(sheet) {
  const url = `./${sheet}.json?sheet=plans`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

async function fetchPlanOptions(sheet) {
  const url = `./${sheet}.json?sheet=plan-options`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data;
}

async function fetchFeatures(sheet) {
  const url = `./${sheet}.json?sheet=table`;
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
  const headerWordTemplate = `<span id="pricing-header-word">${firstWord}</span>`;
  $header.innerHTML = $header.innerHTML.replace('[x]', headerWordTemplate);
  const $headerWord = $header.children[0];
  setInterval(() => {
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
  planUrl.searchParams.set('rUrl', rUrl);
  return planUrl.href;
}

function selectPlanOption($plan, option) {
  const priceString = option['Option Price'].split('/');
  const fullPriceString = option['Option Full Price'].split('/');
  const price = priceString[0];
  const priceUnit = priceString[1];
  const fullPrice = fullPriceString[0];
  const fullPriceUnit = fullPriceString[1];
  const text = option['Option Text'];
  const cta = option['Option CTA'];
  const ctaUrl = buildUrl(option['Option Url'], option['Option Plan']);

  const $pricing = $plan.querySelector('.plan-pricing');
  const $pricingText = $plan.querySelector('.plan-secondary');
  const $cta = $plan.querySelector('.button.primary');

  if (price === 'Free') {
    $pricing.innerHTML = '<strong>Free</strong>';
  } else {
    $pricing.innerHTML = `<span>US $<strong>${price}</strong>/${priceUnit}</span>`;
    if (price !== fullPrice) {
      $pricing.innerHTML += `<span class="previous-pricing">US $<strong>${fullPrice}</strong>/${fullPriceUnit}</span>`;
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
    const imagePath = `icons/${imageName}.svg`;
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
    const $icon = createTag('img', { src: imagePath, class: 'plan-icon' });
    $header.append($icon);
    const $pricing = createTag('div', { class: 'plan-pricing' });
    $plan.append($pricing);
    const $pricingText = createTag('span', { class: 'plan-secondary' });
    $plan.append($pricingText);
    const $footer = createTag('div', { class: 'plan-footer' });
    $plan.append($footer);
    if (options.length > 1) {
      const $dropdown = createTag('select', { class: 'plan-dropdown' });
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
  });
}

function decorateTable($block, features) {
  const categories = [];
  const categoryContainers = [];
  const $features = createTag('div', { class: 'features' });
  $block.append($features);
  features.forEach((feature) => {
    const { Category, Description, Special } = feature;
    const columnOneCheck = feature['Column 1'];
    const columnTwoCheck = feature['Column 2'];
    const columnThreeCheck = feature['Column 3'];
    if (!categories.includes(Category)) {
      const imageName = toClassName(Category);
      const categoryImage = `icons/${imageName}.svg`;
      const $category = createTag('div', { class: 'category' });
      $features.append($category);
      const $categoryHeader = createTag('div', { class: 'category-header' });
      $category.append($categoryHeader);
      const $categoryImage = createTag('img', { src: categoryImage, class: 'category-image' });
      $categoryHeader.append($categoryImage);
      const $categoryText = createTag('span', { class: 'category-text' });
      $categoryText.innerHTML = Category;
      $categoryHeader.append($categoryText);
      categories.push(Category);
      categoryContainers[Category] = $category;
    }
    const $feature = createTag('div', { class: 'feature' });
    categoryContainers[Category].append($feature);
    const $featureSpecial = createTag('div', { class: 'feature-special' });
    $feature.append($featureSpecial);
    if (Special) {
      const $specialText = createTag('span');
      $specialText.innerHTML = Special;
      $featureSpecial.append($specialText);
    }
    const $featureText = createTag('div', { class: 'feature-text' });
    $featureText.innerHTML = Description;
    $feature.append($featureText);
    const $featureColumnOne = createTag('div', { class: 'feature-column' });
    $feature.append($featureColumnOne);
    const $columnOneImage = createTag('img');
    if (columnOneCheck === 'Y') {
      $columnOneImage.src = 'icons/checkmark.svg';
    } else {
      $columnOneImage.src = 'icons/crossmark.svg';
    }
    $featureColumnOne.append($columnOneImage);
    const $featureColumnTwo = createTag('div', { class: 'feature-column' });
    const $columnTwoImage = createTag('img');
    if (columnTwoCheck === 'Y') {
      $columnTwoImage.src = 'icons/checkmark.svg';
    } else {
      $columnTwoImage.src = 'icons/crossmark.svg';
    }
    $featureColumnTwo.append($columnTwoImage);
    $feature.append($featureColumnTwo);
    const $featureColumnThree = createTag('div', { class: 'feature-column' });
    const $columnThreeImage = createTag('img');
    if (columnThreeCheck === 'Y') {
      $columnThreeImage.src = 'icons/checkmark.svg';
    } else {
      $columnThreeImage.src = 'icons/crossmark.svg';
    }
    $featureColumnThree.append($columnThreeImage);
    $feature.append($featureColumnThree);
  });
}

async function decoratePricing($block) {
  const config = readBlockConfig($block);
  const { sheet } = config;

  const header = await fetchHeader(sheet);
  const plans = await fetchPlans(sheet);
  const planOptions = await fetchPlanOptions(sheet);
  const features = await fetchFeatures(sheet);

  $block.innerHTML = '';

  decorateHeader($block, header);
  decoratePlans($block, plans, planOptions);
  decorateTable($block, features);
}

export default function decorate($block) {
  decoratePricing($block);
}
