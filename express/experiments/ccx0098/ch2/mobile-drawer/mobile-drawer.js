/*
 * Copyright 2021 Adobe. All rights reserved.
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
  getLottie,
  lazyLoadLottiePlayer,
  // eslint-disable-next-line import/no-unresolved
} from '../../../../scripts/scripts.js';

function getMaxButtonWidth() {
  return 540;
}

function getDynamicButtonWidth(clientWidth) {
  return clientWidth > getMaxButtonWidth() ? (clientWidth / 3) : (getMaxButtonWidth() / 3);
}

function updateActiveDrawer(clickedButton, isLeftButton, isRightButton, oldActiveButtons) {
  const mobileDrawer = clickedButton.closest('.mobile-drawer');
  const oldActiveDrawerItem = mobileDrawer?.querySelector(`[data-drawer="${oldActiveButtons[0].textContent}"]`);
  const newActiveDrawerItem = mobileDrawer?.querySelector(`[data-drawer="${clickedButton.textContent}"]`);
  const drawerClasses = ['drawer-item-container-shift-right', 'drawer-item-container-shift-left', 'indicators-transition'];
  if (oldActiveDrawerItem) {
    oldActiveDrawerItem.style.display = 'none';
    oldActiveDrawerItem.setAttribute('aria-hidden', true);
    oldActiveDrawerItem.classList.remove(...drawerClasses);
  }
  if (newActiveDrawerItem) {
    newActiveDrawerItem.style.display = 'block';
    newActiveDrawerItem.classList.add('indicators-transition');
    if (isLeftButton) {
      newActiveDrawerItem.classList.add('drawer-item-container-shift-right');
    } else if (isRightButton) {
      newActiveDrawerItem.classList.add('drawer-item-container-shift-left');
    }
    setTimeout(() => {
      newActiveDrawerItem.classList.remove(...drawerClasses);
    }, 275);
    newActiveDrawerItem.setAttribute('aria-hidden', false);
  }
}
function setActiveButtonAttributes(activeButton, nextSibling, previousSibling) {
  [activeButton, nextSibling, previousSibling].forEach((sibling) => {
    sibling?.setAttribute('id', `tab-${sibling.textContent.replace(/ /g, '')}`);
    sibling?.setAttribute('aria-controls', `panel-${sibling.textContent.replace(/ /g, '')} ctas-${sibling.textContent.replace(/ /g, '')}`);
    if (sibling !== activeButton) sibling.setAttribute('tabindex', '-1');
  });
}
function setActiveClassAndAccessibility(allButtons, activeTextContent, initialLoad) {
  allButtons.forEach((button) => {
    button.removeAttribute('id');
    button.removeAttribute('aria-controls');
    button.setAttribute('tabindex', '-1');
    if (!initialLoad) {
      button.classList.remove('left-sibling', 'right-sibling', 'active');
    }
  });
  allButtons.filter((button) => (button.textContent === activeTextContent
    && button.getBoundingClientRect().right > 0
    && button.getBoundingClientRect().right < window.innerWidth)).forEach((activeButton) => {
    activeButton.classList.add('active');
    activeButton.previousElementSibling.classList.add('left-sibling');
    activeButton.nextElementSibling.classList.add('right-sibling');
    activeButton.setAttribute('aria-selected', true);
    activeButton.setAttribute('tabindex', 0);
    if (activeButton.parentElement.classList.contains('is-tabbing')) activeButton.focus();
    if (activeButton && activeButton.nextSibling && activeButton.previousSibling) {
      setActiveButtonAttributes(
        activeButton, activeButton.nextSibling, activeButton.previousSibling,
      );
    }
  });
}
function updateActiveTab(clickedButton) {
  const oldActiveButtons = clickedButton.parentElement.querySelectorAll('.active');
  oldActiveButtons.forEach((button) => {
    button.classList.remove('active');
    button.setAttribute('aria-selected', false);
  });
  const allButtons = [...clickedButton.parentElement.querySelectorAll('button')];
  setActiveClassAndAccessibility(allButtons, clickedButton.textContent);
}
function handleNavScroll(hasInstant, isLeftButton, isRightButton, leftValue, $platform) {
  if (hasInstant) {
    $platform.scrollTo({
      left: leftValue,
      behavior: 'instant',
    });
  }
  if (isLeftButton) {
    $platform.scrollLeft -= getDynamicButtonWidth($platform.clientWidth);
  } else if (isRightButton) {
    $platform.scrollLeft += getDynamicButtonWidth($platform.clientWidth);
  }
}
function updateActiveCTAContainers(activeButton) {
  const newActiveCTAContainer = document.getElementById(activeButton?.id?.replace('tab', 'ctas'));
  document.querySelectorAll('.drawer-item-ctas-container[id]').forEach((ctaContainer) => {
    if (ctaContainer === newActiveCTAContainer) {
      ctaContainer.style.display = 'block';
    } else {
      ctaContainer.style.display = 'none';
    }
  });
}
function tabUpdateOnEvents(target, isTabbing, $platform) {
  const button = target;
  const tabList = target.parentElement;
  if (isTabbing) {
    tabList?.classList.add('is-tabbing');
  } else {
    tabList?.classList.remove('is-tabbing');
  }
  const carousel = target.closest('.toggle-carousel-container');
  const toggleCarouselWidth = carousel?.clientWidth;
  const isLeftButton = Math.floor(button.getBoundingClientRect().left) <= 0;
  const isRightButton = Math.round(button.getBoundingClientRect().right)
    >= (toggleCarouselWidth + getDynamicButtonWidth()) / 2;
  const scrollPos = $platform.scrollLeft;
  const oldActiveButtons = button.parentElement.querySelectorAll('.active');
  const maxLeft = 6 * getDynamicButtonWidth($platform.clientWidth);

  if (isLeftButton && scrollPos <= 0) {
    handleNavScroll(true, isLeftButton, isRightButton, maxLeft, $platform);
  } else if (isRightButton && !button.nextSibling) {
    handleNavScroll(true, isLeftButton, isRightButton, 0, $platform);
  } else if (isLeftButton) {
    handleNavScroll(false, isLeftButton, isRightButton, 0, $platform);
  } else if (isRightButton) {
    handleNavScroll(false, isLeftButton, isRightButton, 0, $platform);
  }
  updateActiveDrawer(button, isLeftButton, isRightButton, oldActiveButtons);
  updateActiveCTAContainers(button);
  setTimeout(() => {
    updateActiveTab(button);
  }, 250);
}

function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}
function handleArrows(e, tabList) {
  tabList.classList.add('is-tabbing');
  const oldActive = tabList.querySelector('.active');
  if (e.key === 'ArrowRight') {
    tabUpdateOnEvents(oldActive.nextElementSibling, true, tabList);
  } else if (e.key === 'ArrowLeft') {
    tabUpdateOnEvents(oldActive.previousElementSibling, true, tabList);
  }
}

function addArrowNavigation(tabList) {
  const debouncedArrows = debounce(handleArrows, 250, true);
  tabList.addEventListener('keyup', (e) => {
    e.preventDefault();
    debouncedArrows(e, tabList);
  });
}
function decorateToggleCarousel(selector, $parent) {
  const $carouselContent = $parent.querySelectorAll(selector);
  const $container = createTag('div', { class: 'toggle-carousel-container' });
  const $platform = createTag('div', { class: 'toggle-carousel-platform' });
  $platform.setAttribute('role', 'tablist');
  $platform.append(...$carouselContent);
  $container.appendChild($platform);
  $parent.appendChild($container);

  const infinityScroll = ($children) => {
    const duplicateContent = () => {
      [...$children].forEach(($child) => {
        const $duplicate = $child.cloneNode(true);
        $platform.append($duplicate);
      });
    };
    // Duplicate children to simulate smooth scrolling
    for (let i = 0; i < 2; i += 1) {
      duplicateContent();
    }
  };

  const setInitialState = () => {
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const toggleCarousel = mobileDrawer?.querySelector('.mobile-drawer-toggle .toggle-carousel-container');
    const toggleCarouselWidth = toggleCarousel?.clientWidth;
    lazyLoadLottiePlayer();

    if (toggleCarouselWidth) {
      const buttonWidth = getDynamicButtonWidth($platform.clientWidth);
      const threeTabCenter = 1.5 * buttonWidth;
      const clientMidPoint = $platform.clientWidth / 2;
      const centeringValue = threeTabCenter - clientMidPoint;
      if (centeringValue > 0 && buttonWidth === (getMaxButtonWidth() / 3)) {
        $platform.style.marginLeft = `-${centeringValue}px`;
        $platform.style.paddingRight = `${centeringValue}px`;
      }
      const buttons = [...document.querySelectorAll('.mobile-drawer-toggle button')];

      let activeButton;
      buttons.forEach((button, index) => {
        button.style.width = `${buttonWidth}px`;
        if (index === 6) {
          button.previousElementSibling.classList.add('left-sibling');
          button.classList.add('active');
          button.nextElementSibling.classList.add('right-sibling');
          activeButton = button;
        } else {
          button.setAttribute('tabindex', '-1');
        }
        button.setAttribute('role', 'tab');
        button.addEventListener('click', (e) => tabUpdateOnEvents(e.target, false, $platform));
      });

      setTimeout(() => {
        // For Firefox, inital scrollTo is handled by fireFoxToggleFix below
        $platform.scrollTo({
          left: 5 * getDynamicButtonWidth($platform.clientWidth),
          behavior: 'instant',
        });

        setActiveClassAndAccessibility(buttons, activeButton.textContent, true);
        updateActiveCTAContainers(activeButton);
        addArrowNavigation($platform);
        mobileDrawer.parentElement.classList.remove('initial-load');
        mobileDrawer.classList.remove('initial-load');
        $platform.style.overflowX = 'hidden';
      }, 300);
    }
  };
  const initialState = () => {
    infinityScroll([...$carouselContent]);
    setTimeout(() => {
      setInitialState();
    }, 0);
  };
  initialState();
}

function toggleListCarousel(event, $mobileDrawer, fireFoxToggleFix) {
  if (event.target.classList.contains('mobile-drawer-list-view')) {
    $mobileDrawer.parentElement.classList.add('list-view');
  } else {
    $mobileDrawer.parentElement.classList.remove('list-view');
    if (fireFoxToggleFix.isFirstClick) {
      const $platform = $mobileDrawer.querySelector('.toggle-carousel-platform');
      if ($platform) {
        $platform.scrollTo({
          left: 5 * getDynamicButtonWidth($platform.clientWidth),
          behavior: 'instant',
        });
        $platform.style.overflowX = 'hidden';
      }
      fireFoxToggleFix.isFirstClick = false;
    }
  }
}

function addViewToggleIcons(listView, defaultView, $mobileDrawer) {
  const fireFoxToggleFix = { isFirstClick: true };
  Array.from(Array(3).keys()).forEach((index) => {
    defaultView.append(createTag('span'));
    if (index < 2) {
      listView.append(createTag('span'));
    }
  });
  [listView, defaultView].forEach((icon) => {
    icon.setAttribute('tabindex', '0');
    icon.addEventListener('click', (e) => {
      toggleListCarousel(e, $mobileDrawer, fireFoxToggleFix);
    });
    icon.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        toggleListCarousel(e, $mobileDrawer, fireFoxToggleFix);
      }
    });
  });
}

function createMobileDrawerViewToggleContainer($mobileDrawer, hasListView) {
  const $mobileDrawerViewToggleContainer = createTag('div', { class: 'mobile-drawer-view-toggle' });
  if (hasListView) {
    const $mobileDrawerListView = createTag('a', { class: 'mobile-drawer-list-view' });
    const $mobileDrawerDefaultView = createTag('a', { class: 'mobile-drawer-default-view' });
    $mobileDrawerListView.setAttribute('aria-label', 'show icon view');
    $mobileDrawerListView.dataset.ll = ('showIconView');
    $mobileDrawerDefaultView.setAttribute('aria-label', 'show carousel view');
    $mobileDrawerDefaultView.dataset.ll = ('showCarouselView');
    addViewToggleIcons($mobileDrawerListView, $mobileDrawerDefaultView, $mobileDrawer);
    $mobileDrawerViewToggleContainer.append($mobileDrawerListView);
    $mobileDrawerViewToggleContainer.append($mobileDrawerDefaultView);
  }
  return $mobileDrawerViewToggleContainer;
}

function createMobileDrawer($block, $sections, $topTab, listViewClass) {
  const $mobileDrawerWrapper = createTag('div', { class: `mobile-drawer-wrapper${listViewClass}` });
  const $mobileDrawer = createTag('div', { class: `mobile-drawer${listViewClass}` });
  $mobileDrawer.setAttribute('data-block-name', 'mobile-drawer');
  $mobileDrawer.setAttribute('data-block-status', 'loaded');
  const $mobileDrawerNotch = createTag('a', { class: 'mobile-drawer-notch' });
  const $mobileDrawerNotchPill = createTag('div', { class: 'mobile-drawer-notch-pill' });
  const $mobileDrawerTogglesContainer = createTag('div', { class: 'mobile-drawer-toggles-container' });
  const $mobileDrawerItemsContainer = createTag('div', { class: 'mobile-drawer-items-container' });
  const hasListView = $mobileDrawerWrapper.classList.contains('list-view');
  const $allCtasWrapper = createTag('div', { class: 'drawer-items-all-ctas-wrapper' });
  const $oldWrapper = $block.parentElement;
  $block.classList = 'mobile-drawer-toggle';
  $block.removeAttribute('data-block-name');
  $block.removeAttribute('data-block-status');

  $mobileDrawerNotch.setAttribute('tabindex', '0');
  $mobileDrawerNotch.dataset.ll = 'drawerNotch';
  $mobileDrawerNotch.setAttribute('aria-label', 'toggle drawer');
  $mobileDrawerNotch.append($mobileDrawerNotchPill);
  $mobileDrawer.append($mobileDrawerNotch);
  const $mobileDrawerViewToggleContainer = createMobileDrawerViewToggleContainer(
    $mobileDrawer, hasListView,
  );
  const $drawerItemsAllCtasWrapper = createTag('div', { class: 'drawer-items-all-ctas-wrapper' });
  const $listViewCtaContainer = createTag('div', { class: 'list-view-cta-container drawer-item-ctas-container' });
  $drawerItemsAllCtasWrapper.append($listViewCtaContainer);
  $mobileDrawer.append($mobileDrawerViewToggleContainer);

  decorateToggleCarousel('button', $block);

  $mobileDrawerTogglesContainer.append($block);

  const $drawerItemCTASContainer = createTag('div', { class: ' drawer-item-ctas-container' });
  const $iconCtaContainer = $drawerItemCTASContainer.cloneNode();
  $iconCtaContainer.classList.add('drawer-item-icon-cta-container');
  $allCtasWrapper.append($iconCtaContainer);

  $sections.forEach((section, index) => {
    const ctasContainer = $drawerItemCTASContainer.cloneNode();
    let elipsis = '';
    if (index === 0) {
      elipsis = '...';
      section.style.display = 'block';
      section.setAttribute('aria-hidden', false);
    }
    section.setAttribute('aria-hidden', true);
    section.setAttribute('tabindex', '0');
    section.setAttribute('id', `panel-${section.dataset.drawer.trim().replace(/ /g, '')}`);
    ctasContainer.setAttribute('id', `ctas-${section.dataset.drawer.trim().replace(/ /g, '')}`);
    $allCtasWrapper.append(ctasContainer);
    section.classList.remove('section');
    section.classList.remove('section-wrapper');
    section.removeAttribute('data-section-status');
    if (hasListView) {
      const $drawerItemIcons = createTag('div', { class: 'drawer-item-icons' });
      const $drawerItemIconsHeader = createTag('h5', { class: 'drawer-item-icons-header' });
      const header = $drawerItemIconsHeader;
      header.setAttribute('id', `icon-header-${index}`);
      $drawerItemIcons.dataset.container = section.dataset.drawer;
      header.textContent = `${section.dataset.drawer}${elipsis}`;

      $drawerItemIcons.classList.add(`drawer-item-icons-${index}`);
      $drawerItemIcons.append(header);
      $mobileDrawerItemsContainer.append($drawerItemIcons);
    }
    section.dataset.itemCount = section.childElementCount;
    section.dataset.itemLoadedCount = 0;
    section.classList.add(`drawer-item-container-${index}`);
    $mobileDrawerItemsContainer.append(section);
  });
  $mobileDrawer.append($mobileDrawerTogglesContainer);
  $mobileDrawer.append($mobileDrawerItemsContainer);
  $mobileDrawerWrapper.append($mobileDrawer);
  $mobileDrawerWrapper.append($allCtasWrapper);
  $mobileDrawerWrapper.prepend($topTab);
  $mobileDrawerWrapper.dataset.audience = 'mobile';
  $mobileDrawerWrapper.dataset.sectionStatus = 'loaded';
  $mobileDrawerWrapper.dataset.lh = 'mobileDrawer';
  $oldWrapper.remove();
  return $mobileDrawerWrapper;
}

function handleShakyLoadingImages($wrapper) {
  $wrapper.querySelectorAll('.drawer-item-default-view-container img[loading="lazy"]').forEach((lazyLoadedImg) => {
    lazyLoadedImg.setAttribute('loading', 'eager');
  });
}

function toggleDrawer($wrapper, $lottie, open = true, $body) {
  const rootForClasses = document.querySelector(':root');
  handleShakyLoadingImages($wrapper);
  $wrapper.style.transition = '0.3s';
  if (open) {
    rootForClasses?.style.setProperty('--mobile-drawer-window-height', `${window.innerHeight - 64}px`);
    $body.classList.add('mobile-drawer-opened'); // used in both mobile-drawer.css and drawer-item.css
    $wrapper.classList.add('drawer-opened');
    if ($lottie && $lottie.pause) {
      $lottie.pause();
    }
    setTimeout(() => {
      $body.style.overflow = 'hidden'; // allows down scroll to hide the mobile headers first
    }, 300);
    $wrapper.querySelector('.mobile-drawer-items-container')?.setAttribute('aria-hidden', false);
  } else {
    $wrapper.classList.remove('drawer-opened');
    $body.style.overflow = 'visible';
    setTimeout(() => {
      $body.classList.remove('mobile-drawer-opened');
    }, 250);
    $wrapper.transition = 'marginTop 300ms';
    $wrapper.style.marginTop = '0px';
    if ($lottie && $lottie.play) {
      $lottie.play();
    }
    $wrapper.querySelector('.mobile-drawer-items-container')?.setAttribute('aria-hidden', true);
  }
  $wrapper.style = '';
}
function handleDraggableEvents(e, $wrapper, $lottie, $body) {
  e.preventDefault();
  e.stopPropagation();
  if (!$wrapper.classList.contains('drawer-opened')) {
    toggleDrawer($wrapper, $lottie, true, $body);
  } else if ($wrapper.classList.contains('drawer-opened')) {
    toggleDrawer($wrapper, $lottie, false, $body);
  }
}
function initNotchDragAction($wrapper) {
  const $body = document.querySelector('body');
  const $dragables = $wrapper.querySelectorAll('.mobile-drawer-notch,.tab-lottie-container');
  const $lottie = $wrapper.querySelector('lottie-player');
  let touchStart = 0;
  let initialHeight;

  $dragables.forEach((dragable) => {
    if ('ontouchstart' in window) {
      dragable.addEventListener('touchstart', (e) => {
        initialHeight = $wrapper.clientHeight;
        touchStart = e.changedTouches[0].clientY;
        $body.classList.add('mobile-drawer-opened');
        $wrapper.classList.add('mobile-drawer--dragged');
      }, { passive: true });
      dragable.addEventListener('touchmove', (e) => {
        const newHeight = `${initialHeight - (e.changedTouches[0].clientY - touchStart)}`;
        if (newHeight < window.innerHeight) {
          $wrapper.style.transition = 'none';
          $wrapper.style.height = `${newHeight}px`;
        }
      }, { passive: true });
      dragable.addEventListener('touchend', () => {
        if (!$wrapper.classList.contains('drawer-opened')) {
          toggleDrawer($wrapper, $lottie, true, $body);
        } else if ($wrapper.classList.contains('drawer-opened')) {
          toggleDrawer($wrapper, $lottie, false, $body);
        }
        $wrapper.classList.remove('mobile-drawer--dragged');

        setTimeout(() => {
          initialHeight = $wrapper.clientHeight;
          if (!$wrapper.classList.contains('drawer-opened')) {
            $body.classList.remove('mobile-drawer-opened');
          }
        }, 500);
      }, { passive: true });
    } else {
      dragable.addEventListener('click', (e) => {
        handleDraggableEvents(e, $wrapper, $lottie, $body);
      });
    }
    dragable.addEventListener('keyup', (e) => {
      const isClosed = !e.target.closest('.mobile-drawer-wrapper').classList.contains('draw-opened');
      if (e.target.classList.contains('mobile-drawer-notch') && e.type === 'keyup' && (e.key === 'Enter' || e.key === 'Escape')) {
        handleDraggableEvents(e, $wrapper, $lottie, $body);
      } else if ((e.target.classList.contains('mobile-drawer-notch') && e.key === 'Tab' && isClosed)) {
        e.preventDefault();
      }
    });
  });
}

function handleSwipeAction(direction, $mobileDrawer) {
  const $platform = $mobileDrawer.querySelector('.toggle-carousel-platform');
  const leftSibling = $mobileDrawer.querySelector('.left-sibling');
  const rightSibling = $mobileDrawer.querySelector('.right-sibling');
  if (direction === 'right' && rightSibling && $platform) {
    tabUpdateOnEvents(leftSibling, false, $platform);
  } else if (direction === 'left' && leftSibling && $platform) {
    tabUpdateOnEvents(rightSibling, false, $platform);
  }
}
function initSwipeAction($mobileDrawer) {
  const swipeables = $mobileDrawer.querySelectorAll('.drawer-item-default-view-container, .drawer-item-animations-view-container, .drawer-item-bubbles-view-container');
  swipeables.forEach((swipeable) => {
    let touchStart = 0;
    swipeable.addEventListener('touchstart', (e) => {
      touchStart = e.changedTouches[0].clientX;
    }, { passive: true });
    swipeable.addEventListener('touchend', (e) => {
      const swipeThreshold = e.target?.parentElement.parentElement.classList.contains('drawer-item-bubles-container') ? 20 : 10;
      if (e.target.classList.contains('drawer-swipeable-right') && e.changedTouches[0].clientX - touchStart > swipeThreshold) {
        handleSwipeAction('right', $mobileDrawer);
      } else if (e.target.classList.contains('drawer-swipeable-left') && e.changedTouches[0].clientX - touchStart < (-swipeThreshold)) {
        handleSwipeAction('left', $mobileDrawer);
      }
    }, { passive: true });
  });
}
export default async function decorate($block) {
  const listViewClass = $block.classList.contains('list-view') ? ' has-list list-view initial-load' : '';
  const $main = document.querySelector('main');
  const $sections = $main.querySelectorAll('[data-drawer]');
  const $toggles = $block.querySelector('ul');
  const $oldMobileDrawerSection = document.querySelector('.mobile-drawer-container, .mobile-drawer-list-view-container');
  const $tabLottieContainer = createTag('div', { class: 'tab-lottie-container' });
  const $tabLottie = createTag('div', { class: 'tab-lottie' });
  const $tabText = $oldMobileDrawerSection.querySelector('.default-content-wrapper p');
  $tabLottie.innerHTML = getLottie('compass-lottie-white', '/express/experiments/ccx0098/ch2/mobile-drawer/compass-lottie-white.json');
  $tabLottie.append($tabText);
  $tabLottieContainer.append($tabLottie);
  $block.innerHTML = '';

  Array.from($toggles.children).forEach(($toggle) => {
    const $button = createTag('button');
    const $span = createTag('span');
    $span.textContent = $toggle.textContent.trim();
    $button.append($span);
    $block.append($button);
  });

  if ($sections) {
    $sections.forEach(($section, index) => {
      if (index === 0) {
        $section.style.display = 'block';
      } else {
        $section.style.display = 'none';
      }
    });
  }

  const $mobileDrawer = createMobileDrawer($block, $sections, $tabLottieContainer, listViewClass);

  $main.append($mobileDrawer);
  initNotchDragAction($mobileDrawer);
  initSwipeAction($mobileDrawer);
}
