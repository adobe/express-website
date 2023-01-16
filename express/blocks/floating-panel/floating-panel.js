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
  fetchPlaceholders, getLocale,
  getLottie,
  lazyLoadLottiePlayer, loadBlocks,
} from '../../scripts/scripts.js';

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
      if ($scrollAnchor.offsetTop <= window.pageYOffset) {
        clicked = false;
        buttonWrapper.classList.remove('floating-button--clicked');
        clearInterval(checkIfScrollToIsFinished);
      }
    }, 200);
    hideScrollArrow(buttonWrapper, $lottieScrollButton);
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      section.style.bottom = '0px';
    } else {
      section.style.bottom = `-${section.offsetHeight}px`;
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

  $lottieScrollButton.innerHTML = getLottie('purple-arrows', '/express/blocks/floating-panel/purple-arrows.json');
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

function isInViewport(rect) {
  return (
    rect.top >= 0
    && rect.left >= 0
    && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    && rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function togglePanel(section, otherCTAs) {
  let CTAsOffBounds = 0;

  for (let i = 0; i < otherCTAs.length; i += 1) {
    const rect = otherCTAs[i].getBoundingClientRect();
    if (!isInViewport(rect)) {
      CTAsOffBounds += 1;
    }
  }

  if (CTAsOffBounds === otherCTAs.length) {
    section.style.bottom = '0px';
  } else {
    section.style.bottom = `-${section.offsetHeight}px`;
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

async function fetchPlainBlockFromFragment($block, content) {
  const location = new URL(window.location);
  const locale = getLocale(location);
  let fragmentUrl;
  if (locale === 'us') {
    fragmentUrl = `${location.origin}${content}`;
  } else {
    fragmentUrl = `${location.origin}/${locale}${content}`;
  }

  const path = new URL(fragmentUrl).pathname.split('.')[0];
  const resp = await fetch(`${path}.plain.html`);
  if (resp.status === 404) {
    $block.parentElement.parentElement.remove();
  } else {
    const html = await resp.text();
    const $newBlock = createTag('div');
    $newBlock.innerHTML = html;
    $newBlock.className = 'section section-wrapper floating-panel-container';
    $newBlock.id = 'floating-panel-container';
    const img = $newBlock.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'lazy');
    }
    const loadedBlocks = await loadBlocks($newBlock);
    await Promise.all(loadedBlocks);
    const $section = $block.closest('.section');
    $section.parentNode.replaceChild($newBlock, $section);
    return $newBlock;
  }
  return null;
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
  const audience = block.querySelector(':scope > div').textContent.trim();
  const container = await fetchPlainBlockFromFragment(block, '/drafts/qiyundai/fragments/default-floating-panel');

  if (container) {
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
