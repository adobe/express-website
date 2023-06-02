/*
 * Copyright 2023 Adobe. All rights reserved.
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
  fetchFloatingCta,
  fetchPlaceholders,
  getIconElement,
  getLottie,
  getMobileOperatingSystem,
  lazyLoadLottiePlayer,
  loadCSS,
} from '../../scripts/scripts.js';

import BlockMediator from '../../scripts/block-mediator.js';

export const hideScrollArrow = ($floatButtonWrapper, $lottieScrollButton) => {
  $floatButtonWrapper.classList.add('floating-button--scrolled');
  if (document.activeElement === $lottieScrollButton) $lottieScrollButton.blur();
  $lottieScrollButton.tabIndex = -1;
};

export const showScrollArrow = ($floatButtonWrapper, $lottieScrollButton) => {
  $floatButtonWrapper.classList.remove('floating-button--scrolled');
  $lottieScrollButton.removeAttribute('tabIndex');
};

export function openToolBox($wrapper, $lottie, data, userInitiated) {
  const $toolbox = $wrapper.querySelector('.toolbox');
  const $button = $wrapper.querySelector('.floating-button');

  const $scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
  if (data.scrollState === 'withLottie' && $scrollAnchor) {
    showScrollArrow($wrapper, $lottie);
  }
  $wrapper.classList.remove('toolbox-opened');
  if (userInitiated) {
    setTimeout(() => {
      if (!$wrapper.classList.contains('toolbox-opened')) {
        $toolbox.classList.add('hidden');
        $wrapper.classList.remove('clamped');
        $button.classList.remove('toolbox-opened');
      }
    }, 500);
  } else {
    setTimeout(() => {
      if ($wrapper.classList.contains('initial-load')) {
        $toolbox.classList.add('hidden');
        $wrapper.classList.remove('clamped');
        $button.classList.remove('toolbox-opened');
      }
    }, 2000);
  }
}

export function closeToolBox($wrapper, $lottie) {
  const $toolbox = $wrapper.querySelector('.toolbox');
  const $button = $wrapper.querySelector('.floating-button');

  $toolbox.classList.remove('hidden');
  $wrapper.classList.add('clamped');
  $button.classList.add('toolbox-opened');
  hideScrollArrow($wrapper, $lottie);

  setTimeout(() => {
    $wrapper.classList.add('toolbox-opened');
  }, 10);
}

export function initLottieArrow($lottieScrollButton, $floatButtonWrapper, $scrollAnchor, data) {
  let clicked = false;
  $lottieScrollButton.addEventListener('click', () => {
    clicked = true;
    $floatButtonWrapper.classList.add('floating-button--clicked');
    window.scrollTo({
      top: $scrollAnchor.offsetTop,
      behavior: 'smooth',
    });
    const checkIfScrollToIsFinished = setInterval(() => {
      if ($scrollAnchor.offsetTop <= window.scrollY) {
        clicked = false;
        $floatButtonWrapper.classList.remove('floating-button--clicked');
        clearInterval(checkIfScrollToIsFinished);
      }
    }, 200);
    hideScrollArrow($floatButtonWrapper, $lottieScrollButton);
  });

  window.addEventListener('scroll', () => {
    data.scrollState = $floatButtonWrapper.classList.contains('floating-button--scrolled') ? 'withoutLottie' : 'withLottie';
    const multiFunctionButtonOpened = $floatButtonWrapper.classList.contains('toolbox-opened');
    if (clicked) return;
    if ($scrollAnchor.getBoundingClientRect().top < 100) {
      hideScrollArrow($floatButtonWrapper, $lottieScrollButton);
    } else if (!multiFunctionButtonOpened) {
      showScrollArrow($floatButtonWrapper, $lottieScrollButton);
    }
  }, { passive: true });
}

function makeCTAFromSheet($block, data) {
  const audience = $block.querySelector(':scope > div').textContent.trim();
  const audienceSpecificUrl = audience && ['desktop', 'mobile'].includes(audience) ? data.mainCta[`${audience}Href`] : null;
  const $buttonContainer = createTag('div', { class: 'button-container' });
  const ctaFromSheet = createTag('a', { href: audienceSpecificUrl || data.mainCta.href, title: data.mainCta.text });
  ctaFromSheet.textContent = data.mainCta.text;
  $buttonContainer.append(ctaFromSheet);
  $block.append($buttonContainer);

  return ctaFromSheet;
}

export async function createFloatingButton($block, audience, data) {
  const $a = makeCTAFromSheet($block, data);
  const main = document.querySelector('main');
  loadCSS('/express/blocks/shared/floating-cta.css');

  // Floating button html
  const $floatButtonLink = $a.cloneNode(true);
  $floatButtonLink.className = '';
  $floatButtonLink.classList.add('button', 'gradient', 'xlarge');

  // Hide CTAs with same url & text as the Floating CTA && is NOT a Floating CTA (in mobile/tablet)
  const sameUrlCTAs = Array.from(main.querySelectorAll('a.button:any-link'))
    .filter((a) => (a.textContent.trim() === $a.textContent.trim() || a.href === $a.href)
      && !a.parentElement.parentElement.classList.contains('floating-button'));
  sameUrlCTAs.forEach((cta) => {
    cta.classList.add('same-as-floating-button-CTA');
  });

  const $floatButtonWrapperOld = $a.closest('.floating-button-wrapper');
  const $floatButtonWrapper = createTag('div', { class: 'floating-button-wrapper' });
  const $floatButton = createTag('div', {
    class: 'floating-button block',
    'data-block-name': 'floating-button',
    'data-block-status': 'loaded',
  });
  const $floatButtonInnerWrapper = createTag('div', { class: 'floating-button-inner-wrapper' });
  const $floatButtonBackground = createTag('div', { class: 'floating-button-background' });
  const $lottieScrollButton = createTag('button', { class: 'floating-button-lottie' });

  if (audience) {
    $floatButtonWrapper.dataset.audience = audience;
    $floatButtonWrapper.dataset.sectionStatus = 'loaded';
  }

  $lottieScrollButton.innerHTML = getLottie('purple-arrows', '/express/icons/purple-arrows.json');
  fetchPlaceholders().then((placeholders) => {
    $lottieScrollButton.setAttribute('aria-label', placeholders['see-more']);
  });

  const linksPopulated = new CustomEvent('linkspopulated', { detail: [$floatButtonLink, $lottieScrollButton] });
  document.dispatchEvent(linksPopulated);

  $floatButtonInnerWrapper.append($floatButtonBackground, $floatButtonLink);
  $floatButton.append($floatButtonInnerWrapper, $lottieScrollButton);
  $floatButtonWrapper.append($floatButton);
  main.append($floatButtonWrapper);
  if ($floatButtonWrapperOld) {
    const $parent = $floatButtonWrapperOld.parentElement;
    if ($parent && $parent.children.length === 1) {
      $parent.remove();
    } else {
      $floatButtonWrapperOld.remove();
    }
  }

  // Floating button scroll/click events
  lazyLoadLottiePlayer();
  const $scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
  if (!$scrollAnchor) {
    hideScrollArrow($floatButtonWrapper, $lottieScrollButton);
  } else {
    initLottieArrow($lottieScrollButton, $floatButtonWrapper, $scrollAnchor, data);
  }

  const promoBar = BlockMediator.get('promobar');
  const currentBottom = parseInt($floatButtonWrapper.style.bottom, 10);
  let promoBarHeight;
  if (promoBar) {
    const promoBarMargin = parseInt(window.getComputedStyle(promoBar.block).marginBottom, 10);
    promoBarHeight = promoBarMargin + promoBar.block.offsetHeight;
  }

  if (promoBar && promoBar.rendered && $floatButtonWrapper.dataset.audience !== 'desktop') {
    $floatButton.style.bottom = currentBottom ? `${currentBottom + promoBarHeight}px` : `${promoBarHeight}px`;
  } else {
    $floatButton.style.removeProperty('bottom');
  }

  BlockMediator.subscribe('promobar', (e) => {
    if (!e.newValue.rendered && $floatButtonWrapper.dataset.audience !== 'desktop') {
      $floatButton.style.bottom = currentBottom ? `${currentBottom - promoBarHeight}px` : '';
    } else {
      $floatButton.style.removeProperty('bottom');
    }
  });

  // Intersection observer - hide button when scrolled to footer
  const $footer = document.querySelector('footer');
  if ($footer) {
    const hideButtonWhenFooter = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.intersectionRatio > 0 || entry.isIntersecting) {
        $floatButtonWrapper.classList.add('floating-button--hidden');
        $floatButton.style.bottom = '0px';
      } else {
        $floatButtonWrapper.classList.remove('floating-button--hidden');
        if (promoBar && promoBar.block) {
          $floatButton.style.bottom = currentBottom ? `${currentBottom + promoBarHeight}px` : `${promoBarHeight}px`;
        } else if (currentBottom) {
          $floatButton.style.bottom = currentBottom;
        }
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

  const $heroCTA = document.querySelector('a.button.same-as-floating-button-CTA');
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
        $floatButton.style.bottom = '0px';
      } else {
        $floatButtonWrapper.classList.remove('floating-button--intersecting');
        if (promoBar && promoBar.block) {
          $floatButton.style.bottom = currentBottom ? `${currentBottom + promoBarHeight}px` : `${promoBarHeight}px`;
        } else if (currentBottom) {
          $floatButton.style.bottom = currentBottom;
        }
      }
    }, {
      root: null,
      rootMargin: '-40px 0px',
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

  document.dispatchEvent(new CustomEvent('floatingbuttonloaded', {
    detail: {
      block: $floatButtonWrapper,
    },
  }));

  return $floatButtonWrapper;
}

export async function collectFloatingButtonData() {
  const defaultButton = await fetchFloatingCta('default');
  const pageButton = await fetchFloatingCta(window.location.pathname);
  const dataArray = [];

  if (pageButton) {
    const objectKeys = Object.keys(defaultButton);
    // eslint-disable-next-line consistent-return
    objectKeys.forEach((key) => {
      if (['path', 'live'].includes(key)) return false;
      dataArray.push([key, pageButton[key] || defaultButton[key]]);
    });
  } else {
    const objectKeys = Object.keys(defaultButton);
    // eslint-disable-next-line consistent-return
    objectKeys.forEach((key) => {
      if (['path', 'live'].includes(key)) return false;
      dataArray.push([key, defaultButton[key]]);
    });
  }

  const data = {
    scrollState: 'withLottie',
    delay: 3,
    tools: [],
    appStore: {},
    mainCta: {},
  };

  dataArray.forEach((col, index, array) => {
    const key = col[0];
    const value = col[1];

    if (key === 'delay') {
      data.delay = value;
    }

    if (key === 'desktop cta link') {
      data.mainCta.desktopHref = value;
    }

    if (key === 'mobile cta link') {
      data.mainCta.mobileHref = value;
    }

    if (key === 'main cta link') {
      data.mainCta.href = value;
    }

    if (key === 'main cta text') {
      data.mainCta.text = value;
    }

    if (key === 'ctas above divider') {
      data.toolsToStash = value;
    }

    if (key === 'panel fragment') {
      data.panelFragment = value;
    }

    if (key === 'bubble sheet') {
      data.bubbleSheet = value;
    }

    for (let i = 1; i < 7; i += 1) {
      if (key === `cta ${i} icon`) {
        const [, href] = array[index + 1];
        const [, text] = array[index + 2];
        const $icon = getIconElement(value);
        const $a = createTag('a', { title: text, href });
        $a.textContent = text;
        data.tools.push({
          icon: $icon,
          anchor: $a,
        });
      }
    }
  });

  return data;
}

export function decorateBadge() {
  const $anchor = createTag('a');
  const OS = getMobileOperatingSystem();

  if ($anchor) {
    $anchor.textContent = '';
    $anchor.classList.add('badge');

    if (OS === 'iOS') {
      $anchor.append(getIconElement('apple-store'));
    } else {
      $anchor.append(getIconElement('google-store'));
    }
  }

  return $anchor;
}

export function buildToolBoxStructure($wrapper, data) {
  const $toolBox = createTag('div', { class: 'toolbox' });
  const $toolBoxWrapper = createTag('div', { class: 'toolbox-inner-wrapper' });
  const $notch = createTag('a', { class: 'notch' });
  const $notchPill = createTag('div', { class: 'notch-pill' });
  const $appStoreBadge = decorateBadge();
  const $background = createTag('div', { class: 'toolbox-background' });
  const $toggleButton = createTag('a', { class: 'toggle-button' });
  const $toggleIcon = getIconElement('plus-icon-22');
  const $boxTop = createTag('div', { class: 'toolbox-top' });
  const $boxBottom = createTag('div', { class: 'toolbox-bottom' });

  const $floatingButton = $wrapper.querySelector('.floating-button');

  $toggleButton.innerHTML = getLottie('plus-animation', '/express/icons/plus-animation.json');
  $toolBoxWrapper.append($boxTop, $boxBottom);
  $toolBox.append($toolBoxWrapper);
  $toggleButton.append($toggleIcon);
  $floatingButton.append($toggleButton);
  $notch.append($notchPill);
  $toolBox.append($notch, $appStoreBadge);
  $wrapper.append($toolBox, $background);

  $appStoreBadge.href = data.appStore.href ? data.appStore.href : data.tools[0].anchor.href;

  $wrapper.classList.add('initial-load');
  $wrapper.classList.add('clamped');
  $wrapper.classList.add('toolbox-opened');
  $floatingButton.classList.add('toolbox-opened');
}

export function initToolBox($wrapper, data, toggleFunction) {
  const $floatingButton = $wrapper.querySelector('.floating-button');
  const $cta = $floatingButton.querySelector('a');
  const $toggleButton = $wrapper.querySelector('.toggle-button');
  const $lottie = $wrapper.querySelector('.floating-button-lottie');
  const $notch = $wrapper.querySelector('.notch');
  const $background = $wrapper.querySelector('.toolbox-background');

  setTimeout(() => {
    if ($wrapper.classList.contains('initial-load')) {
      toggleFunction($wrapper, $lottie, data, false);
    }
  }, data.delay * 1000);

  $cta.addEventListener('click', (e) => {
    if (!$wrapper.classList.contains('toolbox-opened')) {
      e.preventDefault();
      e.stopPropagation();
      toggleFunction($wrapper, $lottie, data);
    }
  });

  [$toggleButton, $notch, $background].forEach(($element) => {
    if ($element) {
      $element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFunction($wrapper, $lottie, data);
      });
    }
  });
}
