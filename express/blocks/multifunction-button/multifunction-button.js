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
  getIconElement,
  getMobileOperatingSystem,
} from '../../scripts/scripts.js';

let scrollState = 'withLottie';

const hideScrollArrow = ($floatButtonWrapper, $lottieScrollButton) => {
  $floatButtonWrapper.classList.add('floating-button--scrolled');
  if (document.activeElement === $lottieScrollButton) $lottieScrollButton.blur();
  $lottieScrollButton.tabIndex = -1;
};

const showScrollArrow = ($floatButtonWrapper, $lottieScrollButton) => {
  $floatButtonWrapper.classList.remove('floating-button--scrolled');
  $lottieScrollButton.removeAttribute('tabIndex');
};

export async function createFloatingButton($a, audience) {
  const main = document.querySelector('main');
  loadCSS('/express/blocks/floating-button/floating-button.css');

  // Floating button html
  const $floatButtonLink = $a.cloneNode(true);
  $floatButtonLink.className = '';
  $floatButtonLink.classList.add('button', 'gradient', 'xlarge');

  // Hide CTAs with same url & text as the Floating CTA && is NOT a Floating CTA (in mobile/tablet)
  const sameUrlCTAs = Array.from(main.querySelectorAll('a.button:any-link'))
    .filter((a) => (a.textContent === $a.textContent || a.href === $a.href)
      && !a.parentElement.classList.contains('floating-button'));
  sameUrlCTAs.forEach((cta) => {
    cta.classList.add('same-as-floating-button-CTA');
  });

  const $floatButtonWrapperOld = $a.closest('.floating-button-wrapper');
  const $floatButtonWrapper = createTag('div', { class: ' floating-button-wrapper' });
  const $floatButton = createTag('div', { class: 'floating-button' });
  const $lottieScrollButton = createTag('button', { class: 'floating-button-lottie' });

  if (audience) {
    $floatButtonWrapper.dataset.audience = audience;
    $floatButtonWrapper.dataset.sectionStatus = 'loaded';
  }

  $lottieScrollButton.innerHTML = getLottie('purple-arrows', '/express/blocks/floating-button/purple-arrows.json');
  fetchPlaceholders()
    .then((placeholders) => {
      $lottieScrollButton.setAttribute('aria-label', placeholders['see-more']);
    });

  const linksPopulated = new CustomEvent('linkspopulated', { detail: [$floatButtonLink, $lottieScrollButton] });
  document.dispatchEvent(linksPopulated);

  $floatButton.append($floatButtonLink);
  $floatButton.append($lottieScrollButton);
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
  const $scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
  if (!$scrollAnchor) {
    hideScrollArrow($floatButtonWrapper, $lottieScrollButton);
  } else {
    lazyLoadLottiePlayer();
    let clicked = false;
    $lottieScrollButton.addEventListener('click', () => {
      clicked = true;
      $floatButtonWrapper.classList.add('floating-button--clicked');
      window.scrollTo({
        top: $scrollAnchor.offsetTop,
        behavior: 'smooth',
      });
      const checkIfScrollToIsFinished = setInterval(() => {
        if ($scrollAnchor.offsetTop <= window.pageYOffset) {
          clicked = false;
          $floatButtonWrapper.classList.remove('floating-button--clicked');
          clearInterval(checkIfScrollToIsFinished);
        }
      }, 200);
      hideScrollArrow($floatButtonWrapper, $lottieScrollButton);
    });
    window.addEventListener('scroll', () => {
      scrollState = $floatButtonWrapper.classList.contains('floating-button--scrolled') ? 'withoutLottie' : 'withLottie';
      const multiFunctionButtonOpened = $floatButtonWrapper.classList.contains('toolbox-opened');
      if (clicked) return;
      if ($scrollAnchor.getBoundingClientRect().top < 100) {
        hideScrollArrow($floatButtonWrapper, $lottieScrollButton);
      } else if (!multiFunctionButtonOpened) {
        showScrollArrow($floatButtonWrapper, $lottieScrollButton);
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

function decorateBadge() {
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

function toggleToolBox($wrapper, $lottie, originalButtonState, userInitiated = true) {
  const $toolbox = $wrapper.querySelector('.toolbox');
  const $button = $wrapper.querySelector('.floating-button');

  if (userInitiated) {
    $wrapper.classList.remove('initial-load');
  }

  if ($wrapper.classList.contains('toolbox-opened')) {
    if (originalButtonState === 'withLottie') {
      showScrollArrow($wrapper, $lottie);
    }
    $wrapper.classList.remove('toolbox-opened');
    if (userInitiated) {
      setTimeout(() => {
        $toolbox.classList.add('hidden');
        $button.classList.remove('toolbox-opened');
      }, 500);
    } else {
      setTimeout(() => {
        if ($wrapper.classList.contains('initial-load')) {
          $toolbox.classList.add('hidden');
          $button.classList.remove('toolbox-opened');
        }
      }, 2000);
    }
  } else {
    $toolbox.classList.remove('hidden');
    $button.classList.add('toolbox-opened');
    hideScrollArrow($wrapper, $lottie);

    setTimeout(() => {
      $wrapper.classList.add('toolbox-opened');
    }, 10);
  }
}

function initNotchDragAction($wrapper) {
  const $body = document.querySelector('body');
  const $notch = $wrapper.querySelector('.notch');
  const $toolBox = $wrapper.querySelector('.toolbox');
  const $lottie = $wrapper.querySelector('.floating-button-lottie');
  let touchStart = 0;
  const initialHeight = $toolBox.offsetHeight;
  $notch.addEventListener('touchstart', (e) => {
    $body.style.overflow = 'hidden';
    $toolBox.style.transition = 'none';
    touchStart = e.changedTouches[0].clientY;
  });

  $notch.addEventListener('touchmove', (e) => {
    $toolBox.style.maxHeight = `${initialHeight - (e.changedTouches[0].clientY - touchStart)}px`;
  });

  $notch.addEventListener('touchend', (e) => {
    $body.style.removeProperty('overflow');

    if (e.changedTouches[0].clientY - touchStart > 100) {
      toggleToolBox($wrapper, $lottie, scrollState);
    } else {
      $toolBox.style.maxHeight = `${initialHeight}px`;
    }

    $toolBox.removeAttribute('style');
  });
}

function buildTools($wrapper, $tools, delayInSeconds = 3) {
  const $toolBox = createTag('div', { class: 'toolbox' });
  const $notch = createTag('a', { class: 'notch' });
  const $notchPill = createTag('div', { class: 'notch-pill' });
  const $appStoreBadge = decorateBadge();
  const $background = createTag('div', { class: 'toolbox-background' });
  const $floatingButton = $wrapper.querySelector('.floating-button');
  const $cta = $floatingButton.querySelector('a');
  const $toggleButton = createTag('a', { class: 'toggle-button' });
  const $toggleIcon = getIconElement('plus-icon-22');
  const $lottie = $wrapper.querySelector('.floating-button-lottie');

  $tools.forEach(($tool) => {
    const iconFound = $tool.querySelector('img') || $tool.querySelector('svg');
    if (iconFound) {
      $tool.classList.add('tool');
      $toolBox.append($tool);
    } else {
      const $badgeAnchor = $tool.querySelector('a');
      if ($badgeAnchor) {
        $appStoreBadge.href = $badgeAnchor.href;
      }
    }
  });

  $wrapper.classList.add('initial-load');
  $wrapper.classList.add('toolbox-opened');
  $floatingButton.classList.add('toolbox-opened');
  hideScrollArrow($wrapper, $lottie);

  setTimeout(() => {
    if ($wrapper.classList.contains('initial-load')) {
      toggleToolBox($wrapper, $lottie, 'withLottie', false);
    }
  }, delayInSeconds * 1000);

  $toggleButton.append($toggleIcon);
  $floatingButton.append($toggleButton);
  $notch.append($notchPill);
  $toolBox.append($notch, $appStoreBadge);
  $wrapper.append($toolBox, $background);

  $cta.addEventListener('click', (e) => {
    if (!$wrapper.classList.contains('toolbox-opened')) {
      e.preventDefault();
      e.stopPropagation();
      toggleToolBox($wrapper, $lottie, scrollState);
    }
  });

  [$toggleButton, $notch, $background].forEach(($element) => {
    if ($element) {
      $element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleToolBox($wrapper, $lottie, scrollState);
      });
    }
  });

  initNotchDragAction($wrapper);
}

export async function createMultiFunctionButton($block, $parentSection) {
  const delayInSeconds = parseFloat(Array.from($block.children)[0].textContent);
  const $ctaContainer = $block.querySelector('.button-container');
  const tools = $block.querySelectorAll('li');
  if ($ctaContainer) {
    const $cta = $ctaContainer.querySelector('a');
    loadCSS('/express/blocks/floating-button/floating-button.css');

    let $buttonWrapper;
    if ($parentSection) {
      $buttonWrapper = await createFloatingButton($cta, $parentSection.dataset.audience)
        .then(((result) => result));
    } else {
      $buttonWrapper = await createFloatingButton($cta)
        .then(((result) => result));
    }

    $buttonWrapper.classList.add('multifunction');
    if (delayInSeconds) {
      buildTools($buttonWrapper, tools, delayInSeconds);
    } else {
      buildTools($buttonWrapper, tools);
    }
  }
}

export default function decorateBlock($block) {
  const $a = $block.querySelector('a.button');
  const $parentSection = $block.closest('.section');

  if (Array.from($block.children).length > 0) {
    if (Array.from($block.children).length === 1) {
      if ($parentSection) {
        createFloatingButton($a, $parentSection.dataset.audience);
      } else {
        createFloatingButton($a);
      }
    } else if ($parentSection) {
      createMultiFunctionButton($block, $parentSection);
    } else {
      createMultiFunctionButton($block);
    }
  }

  const sections = Array.from(document.querySelectorAll('[class="section section-wrapper"], [class="section section-wrapper floating-button-container"]'));
  const emptySections = sections.filter((s) => s.childNodes.length === 0 || (s.childNodes.length === 1 && s.childNodes[0].classList.contains('floating-button-wrapper')));
  emptySections.forEach((emptySection) => {
    emptySection.remove();
  });
}
