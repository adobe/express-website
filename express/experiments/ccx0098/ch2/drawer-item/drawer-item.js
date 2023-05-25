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

import { buildCarousel } from '../../../../blocks/shared/carousel.js';

import {
  getIcon,
  getIconElement,
  getLottie,
  getMobileOperatingSystem,
  createTag,
  transformLinkToAnimation,
} from '../../../../scripts/scripts.js';

function createIndicators(payload, carousel) {
  const count = parseInt(payload.drawerItemContainer.dataset.itemLoadedCount, 10);
  let eventName = '';
  if (payload.isAnimationsView) {
    eventName = 'animation';
  } else if (payload.isDefaultView) {
    eventName = 'default';
  }

  if (count && carousel) {
    const drawerIndicatorsWrapper = createTag('div', { class: 'mobile-drawer-indicators-wrapper' });
    const drawerIndicators = createTag('div', { class: 'mobile-drawer-indicators' });
    for (let i = 0; i < count; i += 1) {
      const isActiveClass = i === 0 ? 'active' : '';
      drawerIndicators.append(createTag('div', { class: `${isActiveClass}` }));
    }
    const indicators = drawerIndicators.querySelectorAll('div');

    drawerIndicatorsWrapper.append(drawerIndicators);
    const previousScrollLeft = carousel.scrollLeft;
    let activeItem = 0;
    carousel.addEventListener('scroll', (e) => {
      if (Math.abs(e.target.scrollLeft - previousScrollLeft) > 25) {
        const newActiveItem = count
          - Math.round((e.target.scrollWidth - e.target.scrollLeft) / e.target.clientWidth);
        if (newActiveItem !== activeItem) {
          indicators[activeItem]?.classList?.remove('active');
          indicators[newActiveItem]?.classList?.add('active');
          const newScrolledToItem = new CustomEvent(`di_itemscrolledto${eventName}`, {
            detail: {
              oldActive: activeItem,
              newActive: newActiveItem,
            },
          });
          document.dispatchEvent(newScrolledToItem);
          activeItem = newActiveItem;
        }
      }
    }, { passive: true });

    return drawerIndicatorsWrapper;
  } else {
    return '';
  }
}
function tempWorkAroundForBubbleOrder(drawerItemContainer) {
  drawerItemContainer.prepend(drawerItemContainer.querySelector('.drawer-item:nth-of-type(3)'));
  drawerItemContainer.prepend(drawerItemContainer.querySelector('.drawer-item:nth-of-type(2)'));
  drawerItemContainer.prepend(drawerItemContainer.querySelector('.drawer-item:nth-of-type(6)'));
  drawerItemContainer.prepend(drawerItemContainer.querySelector('.drawer-item:nth-of-type(7)'));
  drawerItemContainer.prepend(drawerItemContainer.querySelector('.drawer-item:nth-of-type(6)'));
  drawerItemContainer.prepend(drawerItemContainer.querySelector('.drawer-item:nth-of-type(7)'));
  drawerItemContainer.prepend(drawerItemContainer.querySelector('.drawer-item:nth-of-type(7)'));
}
function removeCarouselGeneratedArrows($mobileDrawer) {
  $mobileDrawer.querySelectorAll('.carousel-fader-left,.carousel-fader-right').forEach((arrow) => {
    arrow.remove();
  });
}
function getMissingIcon(iconName) {
  const icons = {
    scratch: 'blank',
    'start-from-scratch': 'blank',
    'design-assets': 'design-assets',
    blank: 'blank',
    color: 'color',
    'trim video': 'trim-video',
    photos: 'photos',
    videos: 'videos',
    fonts: 'fonts',
    'remove-background': 'remove-background',
    'resize-image': 'resize',
    'convert-to-gif': 'convert-to-gif',
    'trim-video': 'trim-video',
    'resize-video': 'resize',
    'merge-video': 'merge-video',
    'social-content': 'social-content',
    flyer: 'flyer',
    banner: 'banner',
    logo: 'logo',
    poster: 'poster',
    meme: 'meme',
    templates: 'templates',
    'create-blank': 'blank-white',
  };

  return icons[iconName.trim().toLowerCase().split(' ').join('-')];
}

function createIcon(name) {
  return `<img class="icon icon-${getMissingIcon(name)}-22" src="/express/icons/${getMissingIcon(name)}-22.svg" alt="${name}">`;
}
function addDecorativeBubbles(bubbleContainer) {
  for (let i = 0; i < 7; i += 1) {
    const bigBubble = bubbleContainer.querySelector(`.drawer-item:nth-of-type(${i + 1})`);
    if (bigBubble && i !== 3) {
      bigBubble.append(createTag('div', { class: `drawer-item-bubble drawer-item-bubble-large large-bubble-${i}` }));
      bigBubble.append(createTag('div', { class: `drawer-item-bubble drawer-item-bubble-small small-bubble-${i}` }));
      if (i < 2) {
        bigBubble.append(createTag('div', { class: `drawer-item-bubble drawer-item-bubble-medium medium-bubble-${i}` }));
        bigBubble.append(createTag('div', { class: `drawer-item-bubble drawer-item-bubble-xs xs-bubble-${i}` }));
      }
    }
  }
}
function convertLastDrawerItemToGradientWithIcon(drawerItem) {
  const link = drawerItem.querySelector('a');
  const iconAndTextWrapper = createTag('div');
  const text = createTag('p');
  const icon = createTag('div');
  text.innerText = 'Create blank';
  icon.innerHTML = createIcon(text.innerText);
  iconAndTextWrapper.append(icon);
  iconAndTextWrapper.append(text);
  link.innerHTML = '';
  link.classList.add('button', 'gradient');
  link.append(iconAndTextWrapper);
}
function createCTA(payload, link, isSingleDownloadCTA) {
  const ctaContainer = createTag('div', { class: 'drawer-item-cta-container' });
  const cta = createTag('a', { class: 'drawer-cta' });
  const ctaText = createTag('p');
  cta.title = payload.ctaText;
  cta.href = link;
  ctaText.innerText = payload.ctaText;
  if (isSingleDownloadCTA) {
    if (payload.isBubbleView) {
      cta.dataset.ll = 'downloadBubblesView';
    } else {
      cta.dataset.ll = 'download';
    }
  } else {
    cta.dataset.ll = payload.itemName.textContent.trim().split(' ').join('');
  }

  if (payload.hasList) {
    const gradientCTALottie = createTag('div', { class: 'cta-lottie' });
    if (getMobileOperatingSystem() === 'iOS') {
      gradientCTALottie.innerHTML = getLottie('apple-lottie', '/express/experiments/ccx0098/ch2/drawer-item/app_store_icons_apple.json');
    } else {
      gradientCTALottie.innerHTML = getLottie('android-lottie', '/express/experiments/ccx0098/ch2/drawer-item/google_g_app_store.json');
    }
    cta.append(...gradientCTALottie.children);
    cta.append(ctaText);
    cta.classList.add('button', 'gradient', 'xlarge');
  } else {
    const widget = createTag('div', { class: 'cta-download-details' });
    const ctaDownloadBadgeContainer = createTag('div', { class: 'cta-download-badge-container' });
    const ctaDownloadBadge = createTag('div', { class: 'cta-download-badge' });
    const checkmark1 = getIcon('D861F3-check');
    const checkmark2 = getIcon('F263B0-check');
    widget.innerHTML = `
      <div>${checkmark1}<div>Free use forever</div></div>
      <div>${checkmark2}<div>No credit card required</div></div>
    `;
    if (getMobileOperatingSystem() === 'iOS') {
      ctaDownloadBadge.append(getIconElement('apple-store'));
    } else {
      ctaDownloadBadge.append(getIconElement('google-store'));
    }
    ctaDownloadBadgeContainer.append(ctaDownloadBadge);
    cta.append(ctaDownloadBadgeContainer);
    cta.append(widget);
  }
  ctaContainer.append(cta);
  return ctaContainer;
}

function updatePayloadFromBlock($block, payload) {
  $block.querySelectorAll(':scope>div').forEach((item) => {
    const row = Array.from(item.children);
    switch (row[0]?.textContent.trim().toLowerCase()) {
      case 'item name':
        payload.iconName.textContent = row[1]?.textContent.trim();
        payload.itemName.textContent = payload.iconName.textContent;
        break;
      case 'icon':
        if (row[1]?.querySelector('svg') && !getMissingIcon(payload.iconName.textContent)) {
          payload.icon.append(row[1]?.querySelector('svg'));
        } else if (getMissingIcon(payload.iconName.textContent)) {
          payload.icon.innerHTML = createIcon(payload.iconName.textContent);
        }
        break;
      case 'icon link':
        payload.iconLink = row[1]?.querySelector('a');
        payload.iconLink.textContent = '';
        payload.iconLink.dataset.ll = payload.iconName.textContent.trim().split(' ').join('');
        break;
      case 'media': {
        [, payload.media] = row;
        const mediaAnchor = payload.media?.cloneNode().querySelector('a');
        if (mediaAnchor && mediaAnchor?.href?.includes('.mp4')) {
          payload.media.innerHtml = '';
          payload.media = mediaAnchor;
        } else if (payload.media?.querySelector('picture')) {
          payload.media = payload.media?.querySelector('picture');
          if (payload.isBubbleView && payload.media) {
            payload.media?.querySelector('img').classList.add('drawer-swipeable-left', 'drawer-swipeable-right');
          }
        }
        break;
      }
      case 'media link':
        payload.mediaLink = row[1]?.querySelector('a');
        payload.mediaLink.dataset.ll = payload.itemName.textContent.trim().split(' ').join('');
        break;
      case 'media text':
        payload.mediaText.textContent = row[1]?.textContent;
        break;
      case 'cta text':
        payload.ctaText = row[1]?.textContent;
        break;
      case 'download link':
        payload.downloadLink = row[1]?.querySelector('a');
        break;
      case 'secondary link text':
        payload.secondaryCTAText = row[1]?.textContent;
        break;
      case 'secondary cta link':
        payload.secondaryCTALink = row[1]?.querySelector('a');
        payload.secondaryCTALink.textContent = payload.secondaryCTAText;
        payload.secondaryCTALink.dataset.ll = `${payload.secondaryCTAText.trim().split(' ').join('')}:${payload.itemName.textContent.trim().split(' ').join('')}`;
        break;
      default:
        break;
    }
  });
}
function decorateIcon(payload) {
  if (payload.iconLink && payload.hasList) {
    const $drawerItemSectionIconsContainer = payload.main.querySelector(`[data-container="${payload.drawerItemContainer.dataset.drawer}"]`);
    const headerId = payload.drawerItemContainer?.previousElementSibling?.querySelector('.drawer-item-icons-header')?.id;
    if (headerId) {
      payload.iconLink.setAttribute('aria-labelledby', `${headerId}`);
    }
    payload.iconLink.append(payload.icon);
    payload.iconLink.append(payload.iconName);
    payload.iconContainer.append(payload.iconLink);
    $drawerItemSectionIconsContainer.append(payload.iconContainer);
  }
}
function decorateMedia(payload) {
  if (payload.mediaText && payload.mediaLink) {
    payload.mediaLink.title = payload.itemName.textContent;
    const isNotBubbleItem = !!payload.mediaText.textContent;
    const drawerItem = createTag('div', { class: 'drawer-item' });
    payload.mediaLink.textContent = '';
    payload.mediaLink.append(payload.media);
    drawerItem.append(payload.mediaLink);
    if (isNotBubbleItem) {
      drawerItem.append(payload.itemName);
      drawerItem.append(payload.mediaText);
    }
    if (payload.isAnimationsView && payload.secondaryCTALink) {
      payload.secondaryCTALink.classList.add('drawer-item-secondary-cta');
      drawerItem.append(payload.secondaryCTALink);
    }
    payload.drawerItemContainer.append(drawerItem);
  }
}
function decorateAnimationsViewMedia(payload) {
  if (payload.drawerItemContainer.classList.contains('drawer-item-animations-view-container')) {
    const animationLinks = payload.drawerItemContainer.querySelectorAll('a');
    animationLinks.forEach((link, index) => {
      if (link?.href?.includes('.mp4')) {
        transformLinkToAnimation(link);
        if (index === 0) link.classList.add('drawer-swipeable-right');
        if (index === animationLinks.length - 1) link.classList.add('drawer-swipeable-left');
      }
    });
  }
}
function appendSingleCTA(payload, container) {
  if (payload.$ctasWrapper && container && container.children.length < 1) {
    const cta = createCTA(payload, payload.downloadLink.href, true);
    container.append(cta);
  }
}
function decorateBubbleCTAContainer(payload, selector) {
  const ctaContainerId = payload.drawerItemContainer.id.replace('panel-', 'ctas-');
  const container = document.getElementById(ctaContainerId);
  container.classList.add(selector);
  container.style.display = 'none';
  appendSingleCTA(payload, container);
}
function decorateBubblesView(payload) {
  if (payload.$mobileDrawer && payload.drawerItemContainer?.classList.contains('drawer-item-bubbles-view-container')) {
    const bubbleContainer = createTag(
      'div',
      { class: 'drawer-item-bubbles-container' },
    );
    [...payload.drawerItemContainer.children].forEach((bubbleItem) => {
      bubbleItem.querySelector('a')?.classList.add('drawer-swipeable-left', 'drawer-swipeable-right');
    });
    convertLastDrawerItemToGradientWithIcon(
      payload.drawerItemContainer.children[payload.drawerItemContainer.children.length - 1],
    );
    tempWorkAroundForBubbleOrder(payload.drawerItemContainer);
    removeCarouselGeneratedArrows(payload.$mobileDrawer);
    bubbleContainer.append(...payload.drawerItemContainer.children);
    addDecorativeBubbles(bubbleContainer);
    payload.drawerItemContainer.append(bubbleContainer);
    decorateBubbleCTAContainer(payload, 'drawer-item-bubbles-cta-container');
    payload.drawerItemContainer.dataset.lh = payload.drawerItemContainer.dataset.drawer.trim().split(' ').join('');
  }
}
function decorateCarouselSwipeableItems(carouselItems) {
  if (carouselItems && carouselItems.length) {
    carouselItems[0]?.classList.add('drawer-swipeable-right');
    carouselItems[carouselItems.length - 1]?.classList.add('drawer-swipeable-left');
  }
}
function decorateCarouselViews(payload) {
  if (payload.isDefaultView) {
    decorateCarouselSwipeableItems(payload.drawerItemContainer.querySelectorAll('.drawer-item a'));
  } else if (payload.isAnimationsView) {
    decorateCarouselSwipeableItems(payload.drawerItemContainer.querySelectorAll('.drawer-item a:nth-child(1)'));
  }

  if (!payload.isBubbleView) {
    buildCarousel('.drawer-item', payload.drawerItemContainer);
    const carousel = payload.drawerItemContainer.querySelector('.carousel-platform');
    const indicators = createIndicators(payload, carousel);
    payload.drawerItemContainer.append(indicators);
    payload.drawerItemContainer.dataset.lh = payload.drawerItemContainer.dataset.drawer.trim().split(' ').join('');
  }
}
function decorateCTA(payload) {
  const ctaContainerId = payload.drawerItemContainer.id.replace('panel-', 'ctas-');
  const container = document.getElementById(ctaContainerId);
  if (payload.isDefaultView) {
    container.classList.add('drawer-item-default-ctas-container');
  } else if (payload.isAnimationsView) {
    container.classList.add('drawer-item-animations-ctas-container');
  }
  if (!payload.isBubbleView) {
    const cta = createCTA(payload, payload.mediaLink.href, false);
    cta.classList.add('cta-hidden');
    container.style.display = 'none';
    container.append(cta);
  }
  container.dataset.lh = `maincta:${payload.drawerItemContainer.dataset.drawer.trim().split(' ').join('')}`;
}

function decorateIconCTAContainer(payload, selector) {
  const container = document.querySelector(selector);
  if (container) {
    container.dataset.lh = 'iconView';
    appendSingleCTA(payload, container);
  }
}

function showFirstCTAInContainer(wrapper, selector) {
  wrapper?.querySelector(`${selector} > .drawer-item-cta-container:first-child`)?.classList.remove('cta-hidden');
}

function updateCTAsOnCarouselScroll(payload) {
  let selector;
  let eventName;
  if (payload.isDefaultView) {
    selector = '.drawer-item-default-ctas-container';
    eventName = 'di_itemscrolledtodefault';
  } else if (payload.isAnimationsView) {
    selector = '.drawer-item-animations-ctas-container';
    eventName = 'di_itemscrolledtoanimation';
  }
  const container = payload.$ctasWrapper?.querySelector(selector);
  if (container) {
    document.addEventListener(eventName, (e) => {
      container.children[e.detail.oldActive]?.classList.add('cta-hidden');
      container.children[e.detail.newActive]?.classList.remove('cta-hidden');
    });
  }
}
function showActiveCTAContainer(activeTabButton) {
  const activeCTAContainerID = activeTabButton?.id?.replace('tab-', 'ctas-');
  const activeCTAContainer = document.getElementById(activeCTAContainerID);
  if (activeCTAContainer) {
    activeCTAContainer.style.display = 'block';
  }
}
function updateCTAContainersOnInitialLoad(payload) {
  if (payload.$mobileDrawer && payload.$ctasWrapper) {
    const activeTabButton = payload.$mobileDrawer.parentNode.querySelector('.toggle-carousel-platform > .active');
    let selector;
    if (payload.isDefaultView) {
      selector = '.drawer-item-default-ctas-container';
    } else if (payload.isAnimationsView) {
      selector = '.drawer-item-animations-ctas-container';
    }
    if (payload.isDefaultView || payload.isAnimationsView) {
      showFirstCTAInContainer(payload.$ctasWrapper, selector);
    }
    showActiveCTAContainer(activeTabButton);
  }
}
function decorateCarouselCTAList(payload) {
  if (payload.isAnimationsView || payload.isDefaultView) {
    updateCTAContainersOnInitialLoad(payload);
    updateCTAsOnCarouselScroll(payload);
  }
}
function addScratchLottie(payload) {
  if (payload.hasScratchLottie && !document.querySelector('.scratch-lottie-container')) {
    const scratchLottie = createTag('div', { class: 'scratch-lottie-container' });
    scratchLottie.innerHTML = getLottie('scratch-lottie', '/express/experiments/ccx0098/ch2/drawer-item/s2_create_0.1_from_blank.json');
    scratchLottie.style.position = 'absolute';
    const scratchIMG = document.querySelector('.drawer-item [title="Scratch"]');
    if (scratchIMG) {
      scratchIMG.style.position = 'relative';
      scratchIMG.append(scratchLottie);
    }
  }
}
function initAfterDrawerFullyLoaded(payload) {
  const isFullyLoaded = payload.drawerItemContainer.dataset.itemCount
    === payload.drawerItemContainer.dataset.itemLoadedCount;
  if (isFullyLoaded) {
    payload.drawerItemContainer.querySelectorAll('.drawer-item-wrapper').forEach((oldItem) => {
      oldItem.remove();
    });
    decorateAnimationsViewMedia(payload);
    decorateBubblesView(payload);
    if (payload.hasList) {
      decorateIconCTAContainer(payload, '.drawer-item-icon-cta-container');
    }
    decorateCarouselViews(payload);
    decorateCarouselCTAList(payload);
    addScratchLottie(payload);
  }
}
function trackTotalItemsLoaded(payload) {
  payload.drawerItemContainer.dataset.itemLoadedCount = parseInt(
    payload.drawerItemContainer.dataset.itemLoadedCount, 10,
  ) + 1;
}
export default function decorate($block) {
  const payload = {
    drawerItemContainer: $block.closest('[data-drawer]'),
    main: '',
    iconContainer: createTag('div', { class: 'drawer-item-icon-container' }),
    iconName: createTag('p'),
    itemName: createTag('h5'),
    mediaText: createTag('p'),
    icon: createTag('div', { class: 'drawer-item-icon' }),
    iconLink: '',
    mediaLink: '',
    media: '',
    ctaText: '',
    ctaLink: '',
    downloadLink: '',
    $mobileDrawer: document.querySelector('.mobile-drawer'),
    $ctasWrapper: document.querySelector('.drawer-items-all-ctas-wrapper'),
    bubbleViewCTA: null,
    iconViewCTA: null,
    defaultViewCTAS: [],
    animationViewCTAs: [],
    hasScratchLottie: $block.classList.contains('scratchlottie'),
  };
  payload.main = payload.drawerItemContainer?.closest('main');
  payload.hasList = payload.$mobileDrawer?.parentElement.classList.contains('has-list');
  payload.isBubbleView = payload.drawerItemContainer?.classList.contains('drawer-item-bubbles-view-container');
  payload.isAnimationsView = payload.drawerItemContainer?.classList.contains('drawer-item-animations-view-container');
  payload.isDefaultView = payload.drawerItemContainer?.classList.contains('drawer-item-default-view-container');

  updatePayloadFromBlock($block, payload);
  decorateIcon(payload);
  decorateMedia(payload);
  decorateCTA(payload);
  trackTotalItemsLoaded(payload);
  initAfterDrawerFullyLoaded(payload);
}
