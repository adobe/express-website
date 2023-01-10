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
  fetchPlaceholders,
  getIconElement,
  getLottie,
  getMobileOperatingSystem,
  getMetadata,
  lazyLoadLottiePlayer,
  loadCSS,
  fetchMultifunctionButton,
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

function initLottieArrow($lottieScrollButton, $floatButtonWrapper, $scrollAnchor) {
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

export async function createFloatingButton($a, audience) {
  const main = document.querySelector('main');
  loadCSS('/express/blocks/floating-button/floating-button.css');

  // Floating button html
  const $floatButtonLink = $a.cloneNode(true);
  $floatButtonLink.className = '';
  $floatButtonLink.classList.add('button', 'gradient', 'xlarge');

  // Hide CTAs with same url & text as the Floating CTA && is NOT a Floating CTA (in mobile/tablet)
  const sameUrlCTAs = Array.from(main.querySelectorAll('a.button:any-link'))
    .filter((a) => (a.textContent.trim() === $a.textContent.trim() || a.href === $a.href)
      && !a.parentElement.classList.contains('floating-button'));
  sameUrlCTAs.forEach((cta) => {
    cta.classList.add('same-as-floating-button-CTA');
  });

  const $floatButtonWrapperOld = $a.closest('.floating-button-wrapper');
  const $floatButtonWrapper = createTag('div', { class: 'floating-button-wrapper' });
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
  lazyLoadLottiePlayer();
  const $scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
  if (!$scrollAnchor) {
    hideScrollArrow($floatButtonWrapper, $lottieScrollButton);
  } else {
    initLottieArrow($lottieScrollButton, $floatButtonWrapper, $scrollAnchor);
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
    const $scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
    if (originalButtonState === 'withLottie' && $scrollAnchor) {
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
  } else {
    $toolbox.classList.remove('hidden');
    $wrapper.classList.add('clamped');
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
  }, { passive: true });

  $notch.addEventListener('touchmove', (e) => {
    $toolBox.style.maxHeight = `${initialHeight - (e.changedTouches[0].clientY - touchStart)}px`;
  }, { passive: true });

  $notch.addEventListener('touchend', (e) => {
    $body.style.removeProperty('overflow');

    if (e.changedTouches[0].clientY - touchStart > 100) {
      toggleToolBox($wrapper, $lottie, scrollState);
    } else {
      $toolBox.style.maxHeight = `${initialHeight}px`;
    }

    $toolBox.removeAttribute('style');
  }, { passive: true });
}

function buildToolBox($wrapper, data) {
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

  data.tools.forEach((tool) => {
    const $tool = createTag('div', { class: 'tool' });
    $tool.append(tool.icon, tool.anchor);
    $toolBox.append($tool);
  });

  $appStoreBadge.href = data.appStore.href ? data.appStore.href : data.tools[0].anchor.href;

  $wrapper.classList.add('initial-load');
  $wrapper.classList.add('clamped');
  $wrapper.classList.add('toolbox-opened');
  $floatingButton.classList.add('toolbox-opened');
  hideScrollArrow($wrapper, $lottie);

  setTimeout(() => {
    if ($wrapper.classList.contains('initial-load')) {
      toggleToolBox($wrapper, $lottie, 'withLottie', false);
    }
  }, data.delay * 1000);

  $toggleButton.innerHTML = getLottie('plus-animation', '/express/icons/plus-animation.json');
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

function collectMultifunctionData($block, dataArray) {
  const data = {
    single: 'N',
    delay: 3,
    tools: [],
    appStore: {},
    mainCta: {},
  };

  if ($block.className.includes('spreadsheet-powered')) {
    dataArray.forEach((col, index, array) => {
      const key = col[0];
      const value = col[1];

      if (key === 'single') {
        data.single = value;
      }

      if (key === 'delay') {
        data.delay = value;
      }

      if (key === 'main cta link') {
        data.mainCta.href = value;
      }

      if (key === 'main cta text') {
        data.mainCta.text = value;
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
  } else {
    const delayInSeconds = parseFloat(Array.from($block.children)[0].textContent);
    const $tools = $block.querySelectorAll('li');

    $tools.forEach(($tool) => {
      const iconFound = $tool.querySelector('img') || $tool.querySelector('svg');
      const anchorFound = $tool.querySelector('a');
      if (iconFound) {
        if (anchorFound) {
          data.tools.push({
            icon: iconFound,
            anchor: anchorFound,
          });
        }
      } else {
        const $badgeAnchor = $tool.querySelector('a');
        if ($badgeAnchor) {
          data.appStore.href = $badgeAnchor.href;
        }
      }
    });

    if (delayInSeconds) {
      data.delay = delayInSeconds;
    }
  }

  return data;
}

function makeCTAFromSheet($block, data) {
  const $buttonContainer = createTag('div', { class: 'button-container' });
  const ctaFromSheet = createTag('a', { href: data.mainCta.href, title: data.mainCta.text });
  ctaFromSheet.textContent = data.mainCta.text;
  $buttonContainer.append(ctaFromSheet);
  $block.append($buttonContainer);

  return ctaFromSheet;
}

export async function createMultiFunctionButton($block, data) {
  if (data.tools.length > 0) {
    lazyLoadLottiePlayer();
    const $existingFloatingButtons = document.querySelectorAll('.floating-button-wrapper');
    if ($existingFloatingButtons) {
      $existingFloatingButtons.forEach(($button) => {
        if (!$button.dataset.audience) {
          $button.dataset.audience = 'desktop';
          $button.dataset.sectionStatus = 'loaded';
        } else if ($button.dataset.audience === 'mobile') {
          $button.remove();
        }
      });
    }

    const $ctaContainer = $block.querySelector('.button-container');
    const $cta = $ctaContainer.querySelector('a');
    const $buttonWrapper = await createFloatingButton(
      $cta,
      'mobile',
    ).then(((result) => result));

    $buttonWrapper.classList.add('multifunction');
    buildToolBox($buttonWrapper, data);
  }
}

export default async function decorateBlock($block) {
  let $a = $block.querySelector('a.button');
  const $parentSection = $block.closest('.section');

  if (['yes', 'true', 'on'].includes(getMetadata('show-multifunction-button')) || Array.from($block.children).length > 1) {
    const multifunctionButton = await fetchMultifunctionButton(window.location.pathname);
    const buttonParameters = [];

    if (multifunctionButton) {
      const defaultButton = await fetchMultifunctionButton('default');
      const objectKeys = Object.keys(defaultButton);

      // eslint-disable-next-line consistent-return
      objectKeys.forEach((key) => {
        if (['path', 'live'].includes(key)) return false;
        buttonParameters.push([key, multifunctionButton[key] || defaultButton[key]]);
      });
    }

    const data = collectMultifunctionData($block, buttonParameters);

    if (!$a && data.mainCta.href) {
      $a = makeCTAFromSheet($block, data);
    }

    if (['yes', 'true', 'on', 'Y'].includes(data.single)) {
      await createFloatingButton($a, $parentSection ? $parentSection.dataset.audience : null);
    } else {
      await createMultiFunctionButton($block, data);
    }
  } else if (Array.from($block.children).length > 0 && $parentSection && $a) {
    await createFloatingButton($a, $parentSection ? $parentSection.dataset.audience : null);
  }

  const sections = Array.from(document.querySelectorAll('[class="section section-wrapper"], [class="section section-wrapper floating-button-container"]'));
  const emptySections = sections.filter((s) => s.children.length === 0 || (s.children.length === 1 && s.children[0].classList.contains('floating-button-wrapper')));
  emptySections.forEach((emptySection) => {
    emptySection.remove();
  });
}
