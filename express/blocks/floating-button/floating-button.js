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
  fetchMultifunctionButton, getLocale,
} from '../../scripts/scripts.js';

let scrollState = 'withLottie';

const bubbleUI = {
  addEventListeners(boxBottom) {
    const allBubbles = boxBottom.querySelectorAll('.bubble');

    if (allBubbles.length > 0) {
      allBubbles.forEach((bubble) => {
        bubble.addEventListener('click', (e) => {
          let { target } = e;
          if (!target.hasAttribute('data-href')) {
            target = target.closest('[data-href]');
          }
          if (target && !target.classList.contains('small-bubble') && !target.classList.contains('tiny-bubble')) {
            window.location = target.getAttribute('data-href');
          }
        });
      });
    }

    const vp = boxBottom.querySelector('.bubble-viewport');
    vp.addEventListener('scroll', () => {
      this.resizeBubbles(boxBottom);
    });
    window.addEventListener(
      'orientationchange',
      () => {
        this.centerBubbles();
      },
      false,
    );
    window.addEventListener('resize', () => {
      this.centerBubbles();
    });
  },
  centerBubbles(boxBottom) {
    const vp = boxBottom.querySelector('.bubble-viewport');
    const vpc = this.getCenter(vp);

    const hb = boxBottom.querySelector('.center-piece > div');
    const hbc = this.getCenter(hb);

    vp.scrollTo({ top: hbc.y - vpc.y, left: hbc.x - vpc.x });
    this.resizeBubbles(boxBottom);

    setTimeout(() => {
      const bubbleRowContainers = boxBottom.querySelectorAll('.bubble-row-container');

      if (bubbleRowContainers.length > 0) {
        bubbleRowContainers.forEach((el) => {
          el.style.opacity = '1';
        });
      }
    }, 300);
  },
  getCenter(el) {
    const box = el.getBoundingClientRect();
    return {
      x: box.width / 2 + box.x,
      y: box.height / 2 + box.y,
    };
  },
  minMax(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },
  resizeBubbles(boxBottom) {
    const maxDiameter = 110;
    const minDiameter = 5;
    const vp = boxBottom.querySelector('.bubble-viewport');
    const vpb = vp.getBoundingClientRect();
    const vpc = this.getCenter(vp);

    const bubbles = boxBottom.querySelectorAll('.bubble-container');
    bubbles.forEach((b) => {
      const bb = b.getBoundingClientRect();
      const bc = this.getCenter(b);

      const props = {
        left: 0,
        top: 0,
        diameter: maxDiameter,
        height: maxDiameter,
        // viewport edge overlap
        horizontal: 'none',
        vertical: 'none',
      };

      // calculate width
      if (bb.left < vpb.left) {
        // over left border
        props.diameter = bb.right - vpb.left;
        props.horizontal = 'left';
      } else if (vpb.right < bb.right) {
        // over right border
        props.diameter = vpb.right - bb.left;
        props.horizontal = 'right';
      }
      // calculate height
      if (bb.top < vpb.top) {
        // over top border
        props.height = bb.bottom - vpb.top;
        props.vertical = 'top';
      } else if (vpb.bottom < bb.bottom) {
        // over bottom border
        props.height = vpb.bottom - bb.top;
        props.vertical = 'bottom';
      }

      // get the smallest to keep circle shape versus oval
      props.diameter = this.minMax(props.diameter, minDiameter, props.height);

      // if smaller than max, calculate positioning
      if (props.diameter < maxDiameter) {
        if (props.horizontal === 'none') {
          // top or bottom edge
          if (props.horizontal === 'none') {
            // top center or bottom center - if too far to the side, make a little smaller
            if (vpc.x - bc.x > 60) {
              // eslint-disable-next-line operator-assignment
              props.diameter = 0.8 * props.diameter;
            }
          }
          // vertical center
          props.left = (bb.width - props.diameter) / 2;
          if (props.vertical === 'top') {
            // push to bottom
            props.top = bb.height - props.diameter;
          }
          // center right - already pushed to left
          // center center - would be full size and already positioned
        } else {
          // not on top or bottom edge - horizontal center bubble
          props.top = (bb.height - props.diameter) / 2;
          if (props.horizontal === 'left') {
            // center left - push to right
            props.left = bb.width - props.diameter;
          }
          // center right - already pushed to left
          // center center - would be full size and already positioned
        }
      }

      props.diameter = this.minMax(props.diameter, minDiameter, bb.width);
      // max left and top offset before pushed out of box;
      const maxOffset = bb.width - props.diameter;
      props.left = this.minMax(props.left, 0, maxOffset);
      props.top = this.minMax(props.top, 0, maxOffset);

      const bubble = b.querySelector('.bubble');
      if (props.diameter < 30) {
        bubble.classList.add('tiny-bubble');
        bubble.classList.remove('small-bubble');
      } else if (props.diameter < 60) {
        bubble.classList.remove('tiny-bubble');
        bubble.classList.add('small-bubble');
      } else {
        bubble.classList.remove('tiny-bubble');
        bubble.classList.remove('small-bubble');
      }
      bubble.style.left = `${props.left}px`;
      bubble.style.top = `${props.top}px`;
      bubble.style.width = `${props.diameter}px`;
      bubble.style.height = `${props.diameter}px`;
    });
  },
};

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
    .filter((a) => (a.textContent.trim() === $a.textContent.trim() || a.href === $a.href)
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

function buildHexagon(values) {
  // Create an empty result array
  const result = [];

  // Determine the dimensions of the honeycomb grid
  // based on the number of values provided
  const size = Math.ceil(Math.sqrt(values.length));
  const half = Math.ceil(size / 2);

  result.push(size);

  for (let i = size - 1; i >= half; i -= 1) {
    result.push(i);
    result.unshift(i);
  }

  const accountedFor = result.reduce((partialSum, a) => partialSum + a, 0);

  let counter = 0;
  for (let i = accountedFor; i < values.length; i += 1) {
    result[counter] += 1;

    if (counter + 1 >= result.length) {
      counter = 0;
    } else {
      counter += 1;
    }
  }

  // Return the result array
  return result;
}

function initBubbleUI(boxBottom) {
  bubbleUI.centerBubbles(boxBottom);
  bubbleUI.addEventListeners(boxBottom);
}

async function decorateBubbleUI($boxBottom, data) {
  $boxBottom.classList.add('bubble-ui');

  const bubbleViewportContainer = createTag('div', { class: 'bubble-viewport-container' });
  const bubbleViewport = createTag('div', { class: 'bubble-viewport' });
  const bubbleRowContainer = createTag('div', { class: 'bubble-row-container' });

  $boxBottom.append(bubbleViewportContainer);
  bubbleViewportContainer.append(bubbleViewport);
  bubbleViewport.append(bubbleRowContainer);

  const locale = getLocale(window.location);
  const urlPrefix = locale === 'us' ? '' : `/${locale}`;
  const resp = await fetch(`${urlPrefix}/express/bubbles/${data.bubbleSheet}.json`).then((result) => result.json());
  const bubblesArray = resp.data;
  const hexTemplate = buildHexagon(bubblesArray);
  let bubbleIdCounter = 0;
  hexTemplate.forEach((row, index) => {
    const bubbleRow = createTag('div', { id: `bubble-row-${index + 1}`, class: 'bubble-row' });

    for (let i = 0; i < row; i += 1) {
      bubbleIdCounter += 1;
      bubbleRow.append(createTag('div', { id: `bubble-${bubbleIdCounter}`, class: 'bubble-container' }));
    }

    bubbleRowContainer.append(bubbleRow);
  });

  const builtBubbles = bubbleRowContainer.querySelectorAll('.bubble-container');

  builtBubbles.forEach((bubbleContainer, i) => {
    const bubble = createTag('div', { class: 'bubble', 'data-href': bubblesArray[i].link });
    let img;
    if (bubblesArray[i].icon) {
      img = getIconElement(bubblesArray[i].icon);
      img.classList.remove('icon');
    }

    bubble.style.backgroundColor = bubblesArray[i].hexValue;
    bubble.style.backgroundImage = `url('${bubblesArray[i].image}')`;

    if (['yes', 'true', 'on', 'Y'].includes(bubblesArray[i].centerPiece)) {
      bubbleContainer.classList.add('center-piece');
      bubble.style.backgroundColor = 'transparent';
    }

    if (img) {
      bubble.append(img);
    }

    bubbleContainer.append(bubble);
  });

  $boxBottom.append(bubbleViewportContainer);
}

async function buildToolBox($wrapper, data) {
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
  const $boxTop = createTag('div', { class: 'toolbox-top' });
  const $boxBottom = createTag('div', { class: 'toolbox-bottom' });

  if (['yes', 'true', 'on', 'Y'].includes(data.bubbleUI)) {
    console.log(data)
    data.tools.forEach((tool, index) => {
      if (index < data.toolsToStash) {
        const $tool = createTag('div', { class: 'tool' });
        $tool.append(tool.icon, tool.anchor);
        $boxTop.append($tool);
      }
    });

    await decorateBubbleUI($boxBottom, data);
    setTimeout(() => {
      initBubbleUI($boxBottom);
    }, 100);
  } else {
    data.tools.forEach((tool, index) => {
      const $tool = createTag('div', { class: 'tool' });
      $tool.append(tool.icon, tool.anchor);

      if (index < data.toolsToStash) {
        $boxTop.append($tool);
      } else {
        $boxBottom.append($tool);
      }
    });
  }

  $toolBox.append($boxTop, $boxBottom);

  $appStoreBadge.href = data.appStore.href ? data.appStore.href : data.tools[0].anchor.href;

  $wrapper.classList.add('initial-load');
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
    toolsToStash: 1,
    bubbleSheet: 'fallback-bubbles-sheet',
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

      if (key === 'tools to stash') {
        data.toolsToStash = value;
      }

      if (key === 'bubble sheet') {
        data.bubbleSheet = value;
      }

      if (key === 'bubble UI') {
        data.bubbleUI = value;
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
    const $buttonWrapper = await createFloatingButton($cta, 'mobile').then(((result) => result));

    $buttonWrapper.classList.add('multifunction');
    await buildToolBox($buttonWrapper, data);
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
