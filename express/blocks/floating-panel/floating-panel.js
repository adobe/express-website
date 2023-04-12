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
  fetchPlaceholders,
  fetchPlainBlockFromFragment,
  getLottie,
  lazyLoadLottiePlayer,
} from '../../scripts/scripts.js';

import { collectFloatingButtonData } from '../shared/floating-cta.js';

const hideScrollArrow = ($floatButtonWrapper, $lottieScrollButton) => {
  $floatButtonWrapper.classList.add('scrolled');
  if (document.activeElement === $lottieScrollButton) $lottieScrollButton.blur();
  $lottieScrollButton.tabIndex = -1;
};

const showScrollArrow = ($floatButtonWrapper, $lottieScrollButton) => {
  $floatButtonWrapper.classList.remove('scrolled');
  $lottieScrollButton.removeAttribute('tabIndex');
};

function initLottieArrow($lottieScrollButton, buttonWrapper, $scrollAnchor, section) {
  let clicked = false;
  $lottieScrollButton.addEventListener('click', () => {
    clicked = true;
    buttonWrapper.classList.add('floating-panel-button--clicked');
    window.scrollTo({ top: $scrollAnchor.offsetTop, behavior: 'smooth' });

    const checkIfScrollToIsFinished = setInterval(() => {
      if ($scrollAnchor.offsetTop <= window.scrollY) {
        clicked = false;
        buttonWrapper.classList.remove('floating-button--clicked');
        clearInterval(checkIfScrollToIsFinished);
      }
    }, 200);
    hideScrollArrow(buttonWrapper, $lottieScrollButton);
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      section.style.bottom = '0';
    } else {
      section.style.bottom = `-${section.offsetHeight + 8}px`;
    }

    if (clicked) return;
    if ($scrollAnchor.getBoundingClientRect().top < 100) {
      hideScrollArrow(buttonWrapper, $lottieScrollButton);
    } else {
      showScrollArrow(buttonWrapper, $lottieScrollButton);
    }
  }, { passive: true });
}

async function decorateLottieButton(block) {
  const buttonContainers = block.querySelectorAll('p.button-container');
  const $lottieScrollButton = createTag('button', { class: 'floating-panel-lottie' });

  $lottieScrollButton.innerHTML = getLottie('purple-arrows', '/express/icons/purple-arrows.json');
  fetchPlaceholders().then((placeholders) => {
    $lottieScrollButton.setAttribute('aria-label', placeholders['see-more']);
  });

  if (buttonContainers.length > 0) {
    buttonContainers[buttonContainers.length - 1].append($lottieScrollButton);
  }

  return {
    cta: buttonContainers[buttonContainers.length - 1],
    lottie: $lottieScrollButton,
  };
}

function togglePanel(section, otherCTAs) {
  let CTAsOffBounds = 0;

  for (let i = 0; i < otherCTAs.length; i += 1) {
    const options = {
      root: document,
      rootMargin: '0px',
      threshold: 1.0,
    };

    // eslint-disable-next-line no-loop-func
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          CTAsOffBounds += 1;
          observer.disconnect();
          if (CTAsOffBounds === otherCTAs.length) {
            section.style.bottom = '0';
          } else {
            section.style.bottom = `-${section.offsetHeight}px`;
          }
        }
      });
    }, options);
    observer.observe(otherCTAs[i]);
  }
}
function initCTAWatcher(section) {
  const buttons = section.querySelectorAll('a');

  if (buttons.length > 0) {
    const ctaInBlock = buttons[buttons.length - 1];
    ctaInBlock.classList.add('floating-panel-cta');
    const otherCTAs = document.querySelectorAll(`a.button[href='${ctaInBlock.href}']:not(.floating-panel-cta)`);

    togglePanel(section, otherCTAs);

    window.addEventListener('resize', () => {
      togglePanel(section, otherCTAs);
    }, { passive: true });
  }
}

function standardizeSection(section, audience) {
  const wrapperDiv = section.querySelector(':scope > div');
  const block = section.querySelector('.floating-panel');
  const buttons = block.querySelectorAll('a');
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');

  section.dataset.audience = audience;
  block.classList.add('block');
  wrapperDiv.classList.add('floating-panel-wrapper');

  if (buttons.length > 0) {
    buttons.forEach((button) => {
      const buttonWrapper = button.parentElement;
      button.classList.add('button');
      buttonWrapper.classList.add('button-container');
      buttonWrapper.parentElement.classList.add('buttons-container');
    });
  }

  if (heading) {
    heading.parentElement.classList.add('content-container');
  }
}

export default async function decorateBlock(block) {
  if (block.classList.contains('spreadsheet-powered')) {
    const audience = block.querySelector(':scope > div').textContent.trim();
    const data = await collectFloatingButtonData();
    const container = await fetchPlainBlockFromFragment(block, `/express/fragments/floating-panel/${data.panelFragment}`, 'floating-panel');

    if (container) {
      const $section = block.closest('.section');
      $section.parentNode.replaceChild(container, $section);
      standardizeSection(container, audience);

      lazyLoadLottiePlayer();
      const ctaElements = await decorateLottieButton(container);

      const $scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
      if (!$scrollAnchor) {
        hideScrollArrow(ctaElements.cta, ctaElements.lottie);
      } else {
        initLottieArrow(ctaElements.lottie, ctaElements.cta, $scrollAnchor, container);
      }

      initCTAWatcher(container);
    }
  }
}
