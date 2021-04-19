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
/* eslint-disable no-underscore-dangle */

import {
  createTag,
} from '../../scripts/scripts.js';

function cleanEmptyParagraphs($block) {
  $block.querySelectorAll('p:empty').forEach(($p) => $p.remove());
}

function selectPlan($block, plan) {
  const $title = $block.querySelector('.pricing-plan-title');
  const $dropdown = $block.querySelector('.pricing-plan-dropdown');
  $title.innerText = plan.title;
  $dropdown.innerHTML = '';
  plan.options.forEach((option) => {
    const $option = createTag('option');
    $option.innerText = option.title;
    $option.value = option.id;
    $dropdown.append($option);
  });
}

function selectPlanOption($block, planOption) {
  const $priceLine = $block.querySelector('.pricing-plan-price');
  const { price, currency, symbol } = planOption;
  $priceLine.innerHTML = `${currency}${symbol}<span class="price">${price}</span>`;
}

function buildPlans($contents) {
  const plans = [];
  const $planDivs = Array.from($contents.children);
  let plan;
  let planId = 0;
  let planOptionId = 0;
  $planDivs.forEach(($rowContent) => {
    const $rowContents = Array.from($rowContent.children);
    $rowContents.forEach(($content) => {
      if ($content.nodeName === 'H3') {
        plan = {
          id: planId,
          title: $content.innerText,
          options: [],
        };
        plans.push(plan);
        planId += 1;
      }

      if ($content.nodeName === 'P') {
        const $link = $content.querySelector('a');
        plan.options.push({
          id: planOptionId,
          title: $content.innerText,
          link: $link.href,
          price: '9.99',
          currency: 'US',
          symbol: '$',
        });

        planOptionId += 1;
      }
    });
  });
  return plans;
}

function populateOtherPlans($contents) {
  const otherPlans = [];
  const $children = Array.from($contents.children);
  const $otherPlans = Array.from($children[0].children);
  let id = 0;
  $otherPlans.forEach((plan) => {
    if (plan.nodeName === 'P') {
      otherPlans.push({
        id,
        title: plan.innerText,
      });
      id += 1;
    }
  });

  return otherPlans;
}

function decorateOtherPlans($block, otherPlans) {
  const $otherPlansContainer = $block.querySelector('.other-plans-container');

  otherPlans.forEach((plan) => {
    const $plan = createTag('div', { class: 'other-plan' });
    const $planButton = createTag('div', { class: 'other-plan-button' });
    $planButton.innerText = plan.title;
    $planButton.dataset.id = plan.id;
    $plan.append($planButton);
    const $popup = createTag('div', { class: 'other-plan' });
    $popup.append(plan.contents);
    $popup.classList.add('other-plan-popup');
    $plan.append($popup);
    $otherPlansContainer.append($plan);
    $planButton.addEventListener('click', (e) => {
      e.preventDefault();
      $popup.classList.toggle('active');
    });
  });
}

function buildOtherPlan(otherPlans, $row) {
  const $contents = Array.from($row.children);
  const title = $contents[0].innerText;
  const contents = $contents[1];
  otherPlans.forEach((plan) => {
    if (plan.title === title) {
      plan.contents = contents;
    }
  });
}

function decoratePricing($block) {
  const $rows = Array.from($block.children);
  let $left = '';
  let $right = '';
  let plans = [];
  let otherPlans = [];
  $rows.forEach(($row, index) => {
    if (index === 0) {
      $left = $row;
      $left.classList.add('pricing-left');
    } else if (index === 1) {
      $right = $row;
      $right.classList.add('pricing-right');
    } else if (index === 2) {
      plans = buildPlans($row);
    } else if (index === 3) {
      otherPlans = populateOtherPlans($row);
      const $otherPlansSection = createTag('div', { class: 'other-plans' });
      const $otherPlansTitle = createTag('span', { class: 'other-plans-title' });
      const $otherPlansContainer = createTag('div', { class: 'other-plans-container' });
      $otherPlansTitle.innerText = $row.querySelector('h3').innerText;
      $otherPlansSection.append($otherPlansTitle);
      $otherPlansSection.append($otherPlansContainer);
      $right.append($otherPlansSection);
    } else {
      buildOtherPlan(otherPlans, $row);
    }
  });

  $block.innerHTML = '';
  const $planSection = createTag('div', { class: 'pricing-plan' });
  const $planSectionTitle = createTag('h2', { class: 'pricing-plan-title' });
  const $planSectionPrice = createTag('p', { class: 'pricing-plan-price' });
  const $planSectionDropdown = createTag('select', { class: 'pricing-plan-dropdown' });
  $planSection.append($planSectionTitle);
  $planSection.append($planSectionPrice);
  $planSection.append($planSectionDropdown);
  $left.prepend($planSection);
  $block.append($left);
  $block.append($right);
  const $ctaButton = $block.querySelector('a.button.primary');
  $ctaButton.classList.add('cta');
  selectPlan($block, plans[0]);
  selectPlanOption($block, plans[0].options[0]);
  decorateOtherPlans($block, otherPlans);
  // cleanEmptyParagraphs($block);
}

export default function decorate($block) {
  decoratePricing($block);
}
