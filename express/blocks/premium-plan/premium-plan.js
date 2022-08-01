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
  createTag,
  getIcon,
  // eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

import { buildCarousel } from '../shared/carousel.js';

export default function decorate($block) {
  if ($block.children.length) {
    const $desktopBanner = $block.children[0];
    if ($desktopBanner) {
      $desktopBanner.classList.add('premium-plan-banner', 'premium-plan-banner-desktop');
      const $desktopBannerCta = $desktopBanner.querySelector('a');
      if ($desktopBannerCta) {
        $desktopBannerCta.classList.add('dark', 'reverse');
        $desktopBannerCta.classList.remove('accent');
      }
      const $desktopImg = $desktopBanner.querySelector('picture:first-child:last-child');
      if ($desktopImg && $desktopImg.parentElement.tagName === 'P') {
        // unwrap single picture if wrapped in p tag
        const $desktopParentDiv = $desktopImg.closest('div');
        const $desktopParentParagraph = $desktopImg.parentNode;
        $desktopParentDiv.insertBefore($desktopImg, $desktopParentParagraph);
        $desktopParentParagraph.remove();
      }
      $desktopBanner.children[0].remove();
    }
  }
  if ($block.children.length > 1) {
    const $mobileBanner = $block.children[1];
    if ($mobileBanner) {
      $mobileBanner.classList.add('premium-plan-banner', 'premium-plan-banner-mobile');
      const $mobileBannerCta = $mobileBanner.querySelector('a');
      if ($mobileBannerCta) {
        $mobileBannerCta.classList.add('dark', 'reverse');
        $mobileBannerCta.classList.remove('accent');
      }
      const $mobileImg = $mobileBanner.querySelector('picture:first-child:last-child');
      if ($mobileImg && $mobileImg.parentElement.tagName === 'P') {
        // unwrap single picture if wrapped in p tag
        const $desktopParentDiv = $mobileImg.closest('div');
        const $desktopParentParagraph = $mobileImg.parentNode;
        $desktopParentDiv.insertBefore($mobileImg, $desktopParentParagraph);
        $desktopParentParagraph.remove();
      }
      $mobileBanner.children[0].remove();
    }
  }
  if ($block.children.length > 2) {
    const $container = createTag('div', { class: 'premium-plan-cards' });
    const $cards = createTag('div');
    $container.append($cards);
    let failsafe = 20;
    while ($block.children.length > 2) {
      const device = $block.children[2].children[0].textContent.toLowerCase().trim();
      const $cardDiv = $block.children[2].children[1];
      const $cardLink = $cardDiv.children[0].querySelector('a');
      let $card;

      if ($cardLink) {
        $card = createTag('a', { class: 'premium-plan-card', href: $cardLink.href });
        $cardLink.remove();
        $card.innerHTML = $cardDiv.innerHTML;
      } else {
        $card = $cardDiv;
        $card.classList.add('premium-plan-card');
      }

      if (device === 'mobile') {
        $card.classList.add('premium-plan-card-mobile');
      } else if (device === 'desktop') {
        $card.classList.add('premium-plan-card-desktop');
      }
      $cards.append($card);
      $block.children[2].remove();
      failsafe -= 1;
      if (!failsafe) { // prevent a possible infinite loop.
        break;
      }
      const $images = $card.querySelectorAll('picture');
      if ($images.length) {
        $images[0].classList.add('premium-plan-card-icon');
      }
      if ($images.length > 1) {
        $images[1].classList.add('premium-plan-card-image');
      }
      const $links = $card.querySelectorAll('li a');
      if ($links) {
        $links.forEach(($link) => {
          const iconName = $link.textContent.toLowerCase().trim();
          $link.innerHTML = getIcon(iconName);
        });
      }
    }
    $block.append($container);
    buildCarousel('.premium-plan-card', $container);
  }
}
