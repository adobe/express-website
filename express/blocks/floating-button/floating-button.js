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
  const sameUrlCTAs = Array.from(main.querySelectorAll('a.button:any-link')).filter((a) => a.textContent === $a.textContent || a.href === $a.href);
  sameUrlCTAs.forEach((cta) => cta.classList.add('same-as-floating-button-CTA'));

  const $floatButtonWrapperOld = $a.closest('.floating-button-wrapper');
  const $floatButtonWrapper = createTag('div', { class: ' floating-button-wrapper' });
  const $floatButton = createTag('div', { class: 'floating-button' });
  const $lottieScrollButton = createTag('button', { class: 'floating-button-lottie' });
  $lottieScrollButton.innerHTML = getLottie('purple-arrows', '/express/blocks/floating-button/purple-arrows.json');
  fetchPlaceholders().then((placeholders) => {
    $lottieScrollButton.setAttribute('aria-label', placeholders['see-more']);
  });
  const linksPopulated = new CustomEvent('linkspopulated', { detail: [$floatButtonLink, $lottieScrollButton] });
  document.dispatchEvent(linksPopulated);
  $floatButton.appendChild($floatButtonLink);
  $floatButton.appendChild($lottieScrollButton);
  $floatButtonWrapper.appendChild($floatButton);
  main.prepend($floatButtonWrapper);
  if ($floatButtonWrapperOld) {
    const $parent = $floatButtonWrapperOld.parentElement;
    if ($parent && $parent.children.length === 1) {
      $parent.remove();
    } else {
      $floatButtonWrapperOld.remove();
    }
  }

  // Floating button scroll/click events
  const $scrollAnchor = document.querySelector('.block.template-list, .block.layouts, .steps-highlight-container') ?? document.querySelector('.section:nth-of-type(3)');
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
      $floatButtonWrapper.classList.add('floating-button--clicked');
      window.scrollTo({ top: $scrollAnchor.offsetTop, behavior: 'smooth' });
      const checkIfScrollToIsFinished = setInterval(() => {
        if ($scrollAnchor.offsetTop <= window.pageYOffset) {
          clicked = false;
          $floatButtonWrapper.classList.remove('floating-button--clicked');
          clearInterval(checkIfScrollToIsFinished);
        }
      }, 200);
      hideScrollArrow();
    });
    window.addEventListener('scroll', () => {
      if (clicked) return;
      if ($scrollAnchor.getBoundingClientRect().top < 100) {
        hideScrollArrow();
      } else {
        showScrollArrow();
      }
    }, { passive: true });
  }

  // Intersection observer - hide button when scrolled to footer
  const $footer = document.querySelector('footer');
  if ($footer) {
    const hideButtonWhenFooter = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.intersectionRatio > 0 || entry.isIntersecting) {
        $floatButtonWrapper.classList.add('floating-button--hidden');
      } else {
        $floatButtonWrapper.classList.remove('floating-button--hidden');
      }
    }, {
      root: null,
      rootMargin: '32px',
      threshold: 0,
    });

    if (document.readyState === 'complete') {
      hideButtonWhenFooter.observe($footer);
    } else {
      window.addEventListener('load', () => {
        hideButtonWhenFooter.observe($footer);
      });
    }
  }

  const $hero = document.querySelector('div.section');
  const $heroCTA = $hero.querySelector('a.button.same-as-floating-button-CTA');
  if ($heroCTA) {
    const hideButtonWhenIntersecting = new IntersectionObserver((entries) => {
      const $e = entries[0];
      if ($e.boundingClientRect.top > window.innerHeight - 40 || $e.boundingClientRect.top === 0) {
        $floatButtonWrapper.classList.remove('floating-button--below-the-fold');
        $floatButtonWrapper.classList.add('floating-button--above-the-fold');
      } else {
        $floatButtonWrapper.classList.add('floating-button--below-the-fold');
        $floatButtonWrapper.classList.remove('floating-button--above-the-fold');
      }
      if ($e.intersectionRatio > 0 || $e.isIntersecting) {
        $floatButtonWrapper.classList.add('floating-button--intersecting');
      } else {
        $floatButtonWrapper.classList.remove('floating-button--intersecting');
      }
    }, {
      root: null,
      rootMargin: '-40px 0px -40px 0px',
      threshold: 0,
    });
    if (document.readyState === 'complete') {
      hideButtonWhenIntersecting.observe($heroCTA);
    } else {
      window.addEventListener('load', () => {
        hideButtonWhenIntersecting.observe($heroCTA);
      });
    }
  } else {
    $floatButtonWrapper.classList.add('floating-button--above-the-fold');
  }

  return $floatButtonWrapper;
}

export default function decorateBlock($block) {
  const $a = $block.querySelector('a.button');
  createFloatingButton($a);
  const sections = Array.from(document.querySelectorAll('[class="section section-wrapper"], [class="section section-wrapper floating-button-container"]'));
  const emptySections = sections.filter((s) => s.childNodes.length === 0 || (s.childNodes.length === 1 && s.childNodes[0].classList.contains('floating-button-wrapper')));
  emptySections.forEach((emptySection) => {
    emptySection.remove();
  });
}
