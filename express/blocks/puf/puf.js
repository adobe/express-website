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
  addPublishDependencies,
  createTag,
  getHelixEnv,
  getOffer,
  // eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

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
    }

    window.pricingPlans[planUrl] = plan;
  }

  return plan;
}

async function selectPlan($card, planUrl, sendAnalyticEvent) {
  const plan = await fetchPlan(planUrl);

  if (plan) {
    const $pricingCta = $card.querySelector('.puf-card-top a');
    const $pricingHeader = $card.querySelector('.puf-pricing-header');
    const $pricingVat = $card.querySelector('.puf-vat-info');

    $pricingHeader.innerHTML = plan.formatted;
    $pricingHeader.classList.add(plan.currency.toLowerCase());
    $pricingVat.textContent = plan.vatInfo;
    $pricingCta.href = buildUrl(plan.url, plan.country, plan.language);
    $pricingCta.dataset.planUrl = planUrl;
    $pricingCta.id = plan.stringId;
  }

  if (sendAnalyticEvent) {
    const adobeEventName = 'adobe.com:express:pricing:commitmentType:selected';
    const sparkEventName = 'pricing:commitmentTypeSelected';
    pushPricingAnalytics(adobeEventName, sparkEventName, plan);
  }
}

function displayPlans($card, plans) {
  const $planContainer = $card.querySelector('.puf-card-plans');
  const $switch = createTag('label', { class: 'puf-card-switch' });
  const $checkbox = createTag('input', { type: 'checkbox', class: 'puf-card-checkbox' });
  const $slider = createTag('span', { class: 'puf-card-slider' });
  const $defaultPlan = createTag('div', { class: 'strong' });
  const $secondPlan = createTag('div');

  $defaultPlan.innerHTML = plans[0].text.replace(plans[0].plan, `<span>${plans[0].plan}</span>`);
  $secondPlan.innerHTML = plans[1].text.replace(plans[1].plan, `<span>${plans[1].plan}</span>`);

  $planContainer.append($defaultPlan);
  $planContainer.append($switch);
  $switch.append($checkbox);
  $switch.append($slider);
  $planContainer.append($secondPlan);

  $checkbox.addEventListener('change', () => {
    if ($checkbox.checked) {
      $defaultPlan.classList.remove('strong');
      $secondPlan.classList.add('strong');
      selectPlan($card, plans[1].url, true);
    } else {
      $defaultPlan.classList.add('strong');
      $secondPlan.classList.remove('strong');
      selectPlan($card, plans[0].url, true);
    }
  });

  return $planContainer;
}

function buildPlans($plans) {
  const plans = [];

  $plans.forEach(($plan) => {
    const $planLink = $plan.querySelector('a');

    if ($planLink) {
      plans.push({
        url: $planLink.href,
        plan: $planLink.textContent.trim(),
        text: $plan.textContent.trim(),
      });
    }
  });

  return plans;
}

function decorateCard($block, cardClass) {
  const $cardContainer = createTag('div', { class: 'puf-card-container' });
  const $card = createTag('div', { class: `puf-card ${cardClass}` });
  const $cardBanner = $block.children[0].children[0];
  const $cardTop = $block.children[1].children[0];
  const $cardBottom = $block.children[2].children[0];
  const $cardHeader = $cardTop.querySelector('h3');
  const $cardHeaderSvg = $cardTop.querySelector('svg');
  const $cardPricingHeader = createTag('h2', { class: 'puf-pricing-header' });
  const $cardVat = createTag('div', { class: 'puf-vat-info' });
  const $cardPlansContainer = createTag('div', { class: 'puf-card-plans' });
  const $cardCta = createTag('a', { class: 'button large' });
  const $plans = $cardTop.querySelectorAll('li');
  const $listItems = $cardBottom.querySelectorAll('svg');
  const plans = buildPlans($plans);

  if (cardClass === 'puf-left') {
    $cardCta.classList.add('reverse', 'accent');
  }

  $cardBanner.classList.add('puf-card-banner');
  $cardTop.classList.add('puf-card-top');
  $cardBottom.classList.add('puf-card-bottom');

  $card.append($cardBanner);
  $card.append($cardTop);
  $card.append($cardBottom);

  $cardTop.prepend($cardCta);
  $cardTop.prepend($cardPlansContainer);
  $cardTop.prepend($cardVat);
  $cardTop.prepend($cardPricingHeader);
  $cardTop.prepend($cardHeader);

  if (!$cardBanner.textContent.trim()) {
    $cardBanner.style.display = 'none';
  } else {
    $cardBanner.classList.add('recommended');
  }

  $cardHeader.prepend($cardHeaderSvg);

  if (plans.length) {
    selectPlan($card, plans[0].url, false);

    if (plans.length > 1) {
      displayPlans($card, plans);
    }
  }

  $cardTop.querySelector('ul').remove();

  const $ctaTextContainer = $cardTop.querySelector('strong');
  if ($ctaTextContainer) {
    $cardCta.textContent = $ctaTextContainer.textContent.trim();
    $ctaTextContainer.parentNode.remove();
  } else {
    $cardCta.textContent = 'Start your trial';
  }

  $cardContainer.append($card);

  if ($listItems) {
    $listItems.forEach(($listItem) => {
      $listItem.parentNode.classList.add('puf-list-item');
    });
  }

  return $cardContainer;
}

function updatePUFCarousel($block) {
  const $carouselContainer = $block.querySelector('.carousel-container');
  const $carouselPlatform = $block.querySelector('.carousel-platform');
  let $leftCard = $block.querySelector('.puf-left');
  let $rightCard = $block.querySelector('.puf-right');
  $carouselContainer.classList.add('slide-1-selected');
  const slideFunctionality = () => {
    $carouselPlatform.scrollLeft = $carouselPlatform.offsetWidth;
    $carouselContainer.style.minHeight = `${$leftCard.clientHeight + 140}px`;
    const $rightArrow = $carouselContainer.querySelector('.carousel-fader-right');
    const $leftArrow = $carouselContainer.querySelector('.carousel-fader-left');
    const changeSlide = (index) => {
      if (index === 0) {
        $carouselContainer.classList.add('slide-1-selected');
        $carouselContainer.classList.remove('slide-2-selected');
        $carouselContainer.style.minHeight = `${$leftCard.clientHeight + 40}px`;
      } else {
        $carouselContainer.classList.remove('slide-1-selected');
        $carouselContainer.classList.add('slide-2-selected');
        $carouselContainer.style.minHeight = `${$rightCard.clientHeight + 110}px`;
      }
    };
    $leftArrow.addEventListener('click', () => changeSlide(0));
    $rightArrow.addEventListener('click', () => changeSlide(1));
    $block.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') {
        changeSlide(0);
      } else if (e.key === 'ArrowRight') {
        changeSlide(1);
      }
    });
    let initialX = null;
    let initialY = null;
    const startTouch = (e) => {
      initialX = e.touches[0].clientX;
      initialY = e.touches[0].clientY;
    };
    const moveTouch = (e) => {
      if (initialX === null || initialY === null) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = initialX - currentX;
      const diffY = initialY - currentY;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          changeSlide(1);
        } else {
          changeSlide(0);
        }
        e.preventDefault();
      }
      initialX = null;
      initialY = null;
    };
    $block.addEventListener('touchstart', startTouch, false);
    $block.addEventListener('touchmove', moveTouch, false);
  };
  const waitForCardsToLoad = setInterval(() => {
    if (!$leftCard && !$rightCard) {
      $leftCard = $block.querySelector('.puf-left');
      $rightCard = $block.querySelector('.puf-right');
    } else {
      clearInterval(waitForCardsToLoad);
      slideFunctionality();
    }
  }, 400);
}

function wrapTextAndSup($block) {
  const supTags = $block.getElementsByTagName('sup');
  Array.from(supTags).forEach((supTag) => {
    supTag.classList.add('puf-sup');
  });

  const $listItems = $block.querySelectorAll('.puf-list-item');
  $listItems.forEach(($listItem) => {
    const $childNodes = $listItem.childNodes;

    const filteredChildren = Array.from($childNodes).filter((node) => {
      const isSvg = node.tagName && node.tagName.toLowerCase() === 'svg';
      const isTextNode = node.nodeType === Node.TEXT_NODE;
      return !isSvg && (isTextNode || node.nodeType === Node.ELEMENT_NODE);
    });

    const filteredChildrenExceptFirstText = filteredChildren.slice(1);

    const $textAndSupWrapper = createTag('div', { class: 'puf-text-and-sup-wrapper' });
    $textAndSupWrapper.append(...filteredChildrenExceptFirstText);
    $listItem.append($textAndSupWrapper);
  });
}

function highlightText($block) {
  const $highlightRegex = /^\(\(.*\)\)$/;
  const $blockElements = Array.from($block.querySelectorAll('*'));

  if (!$blockElements.some(($element) => $highlightRegex.test($element.textContent))) {
    return;
  }

  const $highlightedElements = $blockElements
    .filter(($element) => $highlightRegex.test($element.textContent));

  $highlightedElements.forEach(($element) => {
    $element.classList.add('puf-highlighted-text');
    $element.textContent = $element.textContent.replace(/^\(\(/, '').replace(/\)\)$/, '');
  });
}

function decorateFooter($block) {
  if ($block?.children?.[3]) {
    const $footer = createTag('div', { class: 'puf-pricing-footer' });
    $footer.append($block.children[3]);
    return $footer;
  } else {
    return '';
  }
}

export default function decorate($block) {
  const $leftCard = decorateCard($block, 'puf-left');
  const $rightCard = decorateCard($block, 'puf-right');
  const $footer = decorateFooter($block);

  $block.innerHTML = '';
  $block.append($leftCard, $rightCard);

  buildCarousel('.puf-card-container', $block);
  updatePUFCarousel($block);
  addPublishDependencies('/express/system/offers-new.json');
  wrapTextAndSup($block);

  $block.append($footer);
  highlightText($block);
}
