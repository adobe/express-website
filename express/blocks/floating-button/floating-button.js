/*
 * Copyright 2020 Adobe. All rights reserved.
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
  loadCSS,
  lazyLoadLottiePlayer,
  getLottie,
  fetchPlaceholders,
} from '../../scripts/scripts.js';

export async function createFloatingButton($a) {
  const main = document.querySelector('main');
  loadCSS('/express/blocks/floating-button/floating-button.css');

  // Floating button html
  const $floatButtonLink = $a.cloneNode(true);
  $floatButtonLink.className = '';
  $floatButtonLink.classList.add('button', 'gradient', 'xlarge');

  // Hide CTAs on the page that are duplicates of the Floating CTA (in mobile/tablet)
  const sameUrlCTAs = Array.from(main.querySelectorAll('a.button:any-link')).filter((a) => a.href === $a.href && a.textContent === $a.textContent);
  sameUrlCTAs.forEach((cta) => cta.classList.add('same-as-floating-button-CTA'));

  const $floatButtonWrapper = createTag('div', { class: 'floating-button-wrapper' });
  const $floatButton = createTag('div', { class: 'floating-button' });
  const $lottieScrollButton = createTag('button', { class: 'floating-button-lottie' });
  $lottieScrollButton.innerHTML = getLottie('purple-arrows', '/express/blocks/floating-button/purple-arrows.json');
  fetchPlaceholders().then((placeholders) => {
    $lottieScrollButton.setAttribute('aria-label', placeholders['see-more']);
  });
  $floatButton.appendChild($floatButtonLink);
  $floatButton.appendChild($lottieScrollButton);
  $floatButtonWrapper.appendChild($floatButton);
  main.prepend($floatButtonWrapper);

  // Floating button scroll/click events
  const $scrollAnchor = document.querySelector('.block.template-list, .block.layouts, .steps-highlight-container') ?? document.querySelector('.section-wrapper:nth-of-type(3)');
  const hideScrollArrow = () => {
    $floatButtonWrapper.classList.add('floating-button--scrolled');
    if (document.activeElement === $lottieScrollButton) $lottieScrollButton.blur();
    $lottieScrollButton.tabIndex = -1;
  };
  const showScrollArrow = () => {
    $floatButtonWrapper.classList.remove('floating-button--scrolled');
    $lottieScrollButton.removeAttribute('tabIndex');
  };
  if (!$scrollAnchor) {
    hideScrollArrow();
  } else {
    lazyLoadLottiePlayer();
    let clicked = false;
    $lottieScrollButton.addEventListener('click', () => {
      clicked = true;
      window.scrollTo({ top: $scrollAnchor.offsetTop, behavior: 'smooth' });
      const checkIfScrollToIsFinished = setInterval(() => {
        if ($scrollAnchor.offsetTop === window.pageYOffset) {
          clicked = false;
          clearInterval(checkIfScrollToIsFinished);
        }
      }, 25);
      hideScrollArrow();
    });
    window.addEventListener('scroll', () => {
      if (clicked) return;
      if ($scrollAnchor.getBoundingClientRect().top < 100) {
        hideScrollArrow();
      } else {
        showScrollArrow();
      }
    }, { passive: false });
  }
}

export default function decorateBlock($block) {
  const $a = $block.querySelector('a.button');
  createFloatingButton($a);
  $block.remove();
}
