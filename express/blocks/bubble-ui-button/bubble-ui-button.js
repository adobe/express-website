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
  getIconElement,
  getLottie,
  getLocale,
} from '../../scripts/scripts.js';

import {
  createFloatingButton,
  showScrollArrow,
  hideScrollArrow,
  collectFloatingButtonData,
  decorateBadge,
} from '../shared/floating-cta.js';

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

function toggleBubblesToolBox($wrapper, $lottie, data, userInitiated = true) {
  const $toolbox = $wrapper.querySelector('.toolbox');
  const $button = $wrapper.querySelector('.floating-button');

  if (userInitiated) {
    $wrapper.classList.remove('initial-load');
  }

  if ($wrapper.classList.contains('toolbox-opened')) {
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
  } else {
    $toolbox.classList.remove('hidden');
    $wrapper.classList.add('clamped');
    $button.classList.add('toolbox-opened');
    hideScrollArrow($wrapper, $lottie);

    setTimeout(() => {
      $wrapper.classList.add('toolbox-opened');
    }, 10);

    setTimeout(() => {
      bubbleUI.resizeBubbles($wrapper.querySelector('.bubble-ui'));
    }, 500);
  }
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

  const vp = boxBottom.querySelector('.bubble-viewport');
  if (vp) {
    setTimeout(() => {
      vp.addEventListener('scroll', () => {
        const parent = boxBottom.closest('.floating-button-wrapper');
        if (parent) {
          parent.classList.remove('initial-load');
        }
      }, { passive: true });
    }, 100);
  }
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

function initNotchDragAction($wrapper, data) {
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
      toggleBubblesToolBox($wrapper, $lottie, data);
    } else {
      $toolBox.style.maxHeight = `${initialHeight}px`;
    }

    $toolBox.removeAttribute('style');
  }, { passive: true });
}

async function buildBubblesToolBox($wrapper, data) {
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

  $appStoreBadge.href = data.appStore.href ? data.appStore.href : data.tools[0].anchor.href;

  $wrapper.classList.add('initial-load');
  $wrapper.classList.add('clamped');
  $wrapper.classList.add('toolbox-opened');
  $floatingButton.classList.add('toolbox-opened');
  hideScrollArrow($wrapper, $lottie);

  setTimeout(() => {
    if ($wrapper.classList.contains('initial-load')) {
      toggleBubblesToolBox($wrapper, $lottie, data, false);
    }
  }, data.delay * 1000);

  $toggleButton.innerHTML = getLottie('plus-animation', '/express/icons/plus-animation.json');
  $toolBox.append($boxTop, $boxBottom);
  $toggleButton.append($toggleIcon);
  $floatingButton.append($toggleButton);
  $notch.append($notchPill);
  $toolBox.append($notch, $appStoreBadge);
  $wrapper.append($toolBox, $background);

  $cta.addEventListener('click', (e) => {
    if (!$wrapper.classList.contains('toolbox-opened')) {
      e.preventDefault();
      e.stopPropagation();
      toggleBubblesToolBox($wrapper, $lottie, data);
    }
  });

  [$toggleButton, $notch, $background].forEach(($element) => {
    if ($element) {
      $element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBubblesToolBox($wrapper, $lottie, data);
      });
    }
  });

  initNotchDragAction($wrapper, data);
}

export async function createMultiFunctionButton($block, data, audience) {
  const $buttonWrapper = await createFloatingButton($block, audience, data)
    .then(((result) => result));
  $buttonWrapper.classList.add('multifunction');
  await buildBubblesToolBox($buttonWrapper, data);
}

export default async function decorateBlock($block) {
  const audience = $block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    $block.closest('.section').remove();
  }

  const data = await collectFloatingButtonData();
  await createMultiFunctionButton($block, data, audience);
}
