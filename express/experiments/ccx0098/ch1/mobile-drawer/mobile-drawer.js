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
// import { buildCarousel } from '../../carousel.js';
// import { buildCarousel } from '../../../../blocks/shared/carousel.js';
import {
  createTag,
  getLottie,
// eslint-disable-next-line import/no-unresolved
} from '../../../../scripts/scripts.js';


// eslint-disable-next-line import/prefer-default-export
function getHardCodedButtonWidth(clientWidth) {
  return clientWidth > 480 ? (clientWidth / 3) : 160;
  // return 160;
}

function decorateToggleCarousel(selector, $parent) {
  const $carouselContent = $parent.querySelectorAll(selector);
  const $container = createTag('div', { class: 'toggle-carousel-container' });
  const $platform = createTag('div', { class: 'toggle-carousel-platform' });
  $platform.setAttribute('role','tablist');
  $platform.setAttribute('aria-label',''); 
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

  const handleArrows = (e, tabList) => {
    tabList.classList.add('is-tabbing');
    let oldActive = tabList.querySelector('.active');
    if (e.key === "ArrowRight") {
      tabUpdateOnArrow(oldActive.nextSibling);
    } else if (e.key === "ArrowLeft") {
      tabUpdateOnArrow(oldActive.previousSibling);
    }
  }

  const debounce = (func, wait, immediate) => {
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
  };

  const addArrowNavigation = (tabList) => {
    const debouncedArrows = debounce(handleArrows,250,true);
    tabList.addEventListener('keyup', (e) => {
      e.preventDefault();
      debouncedArrows(e,tabList);
    });
  };

  const setActiveClassAndAccessibility = (allButtons, activeTextContent) => {
    allButtons.forEach((button) => {
      button.removeAttribute('id');
      button.removeAttribute('aria-controls');
      button.setAttribute('tabindex','-1');
    });
    allButtons.filter((button) => (button.textContent === activeTextContent &&
      button.getBoundingClientRect().right > 0 &&
      button.getBoundingClientRect().right < window.innerWidth)).forEach(activeButton => {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-selected',true);
        activeButton.setAttribute('tabindex',0);
        if (activeButton.parentElement.classList.contains('is-tabbing')) activeButton.focus();
        [activeButton, activeButton.nextSibling, activeButton.previousSibling].forEach((sibling) => {
          sibling.setAttribute('id', `tab-${sibling.textContent.replace(/ /g, "")}`);
          sibling.setAttribute('aria-controls', `panel-${sibling.textContent.replace(/ /g, "")} ctas-${sibling.textContent.replace(/ /g, "")}`);
          if (sibling !== activeButton) sibling.setAttribute('tabindex','-1');
        });
      });
  }
  const updateActiveCTAContainers = (clickedButton,oldActiveButtons) => {
    const newActiveCTAContainer = document.getElementById(clickedButton?.id?.replace('tab','ctas'));
    document.querySelectorAll('.drawer-item-ctas-container[id]').forEach(ctaContainer => { 
      if (ctaContainer !== newActiveCTAContainer) {
        ctaContainer.style.display = 'none';
      } else {
        ctaContainer.style.display = 'block';
      }
    });
  }
  const updateActiveDrawer = (clickedButton,isLeftButton,isRightButton,oldActiveButtons) => {
    const mobileDrawer = clickedButton.closest('.mobile-drawer');
    const oldActiveDrawerItem = mobileDrawer?.querySelector(`[data-drawer="${oldActiveButtons[0].textContent}"]`);
    const newActiveDrawerItem = mobileDrawer?.querySelector(`[data-drawer="${clickedButton.textContent}"]`); 
    if (oldActiveDrawerItem) {
      oldActiveDrawerItem.style.display = 'none'; 
      oldActiveDrawerItem.setAttribute('aria-hidden',true);
      oldActiveDrawerItem.classList.remove('drawer-item-container-shift-right');
      oldActiveDrawerItem.classList.remove('drawer-item-container-shift-left');
    }
    if (newActiveDrawerItem) {
      newActiveDrawerItem.style.display = 'block'; 
      newActiveDrawerItem.classList.remove('drawer-item-container-shift-right','drawer-item-container-shift-left');
     if (isLeftButton)  {
        newActiveDrawerItem.classList.add('drawer-item-container-shift-right');
     } else if (isRightButton) {
        newActiveDrawerItem.classList.add('drawer-item-container-shift-left');
     }
     setTimeout(()=> {
      newActiveDrawerItem.classList.remove('drawer-item-container-shift-right','drawer-item-container-shift-left');
     },275);
      newActiveDrawerItem.setAttribute('aria-hidden', false);
    }
  }
  const updateActiveTab = (clickedButton) => {
    const oldActiveButtons = clickedButton.parentElement.querySelectorAll('.active');
    oldActiveButtons.forEach((button) => {
      button.classList.remove('active');
      button.setAttribute('aria-selected',false);
    });
    const allButtons = [...clickedButton.parentElement.querySelectorAll('button')];
    setActiveClassAndAccessibility(allButtons,clickedButton.textContent);
  }

  const handleNavScroll = (hasInstant,isLeftButton,isRightButton,leftValue,$platform) => {
    if (hasInstant) {
      $platform.scrollTo({
        left: leftValue,
        behavior: 'instant',
      });
    }
    if (isLeftButton) {
      $platform.scrollLeft -= getHardCodedButtonWidth($platform.clientWidth);
    } else if (isRightButton) {
      $platform.scrollLeft += getHardCodedButtonWidth($platform.clientWidth);
    }
  };
  
  const tabUpdateOnEvents = (target,isTabbing)=> {
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
    const isRightButton = Math.round(button.getBoundingClientRect().right) >= (toggleCarouselWidth + getHardCodedButtonWidth())/2; ///Fix this value in order to handle tabbing issue on smaller screens
    const scrollPos = $platform.scrollLeft;
    const oldActiveButtons = button.parentElement.querySelectorAll('.active');
    const maxLeft = 6 * getHardCodedButtonWidth($platform.clientWidth); 

    if (isLeftButton && scrollPos <= 0) {
      handleNavScroll(true,isLeftButton,isRightButton,maxLeft,$platform);
    } else if (isRightButton && !button.nextSibling) {
      handleNavScroll(true,isLeftButton,isRightButton,0,$platform);
    } else if (isLeftButton) {
      handleNavScroll(false,isLeftButton,isRightButton,0,$platform);
    } else if (isRightButton) {
      handleNavScroll(false,isLeftButton,isRightButton,0,$platform);
    }
    updateActiveDrawer(button,isLeftButton,isRightButton,oldActiveButtons);
    updateActiveCTAContainers(button,oldActiveButtons);
    setTimeout(() => {
      updateActiveTab(button);
    },250);
  }
    
  const tabUpdateOnArrow = (target) => {
    tabUpdateOnEvents(target,true);
  }
  const tabUpdateOnClick = (e) => {
    tabUpdateOnEvents(e.target,false);
  }

  const setInitialState = () => {
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const toggleCarousel = mobileDrawer?.querySelector('.mobile-drawer-toggle .toggle-carousel-container');
    const toggleCarouselWidth = toggleCarousel?.clientWidth;
    
    if (toggleCarouselWidth) {
      const buttonWidth = getHardCodedButtonWidth($platform.clientWidth);
      const threeTabCenter = 1.5 * buttonWidth; 
      const clientMidPoint = $platform.clientWidth / 2;
      const centeringValue = threeTabCenter - clientMidPoint;
      if (centeringValue > 0 && buttonWidth === 160) {
        $platform.style.marginLeft = `-${centeringValue}px`;
        $platform.style.paddingRight = `${centeringValue}px`;
      } 
      $platform.scrollTo({
        left: 5 * getHardCodedButtonWidth($platform.clientWidth),
        behavior: 'instant',
      });

      $platform.style.overflowX = 'hidden'; 
      const buttons = [...document.querySelectorAll('.mobile-drawer-toggle button')];

      let activeButton;
      buttons.forEach((button,index) => {
        button.style.width = `${buttonWidth}px`;
        if (index === 6) {
          button.classList.add('active');
          button.setAttribute('aria-selected',true);
          button.setAttribute('tabindex','0');
          activeButton = button;
        } else {
          button.setAttribute('tabindex','-1');
        }
        button.setAttribute('role','tab');
        button.addEventListener('click', tabUpdateOnClick);
      });
      setActiveClassAndAccessibility(buttons,activeButton.textContent,true);
      addArrowNavigation($platform);
      mobileDrawer.classList.remove('initial-load');
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

function toggleListCarousel(event,$mobileDrawer) {
  if (event.target.classList.contains('mobile-drawer-list-view')) {
    $mobileDrawer.classList.add('list-view');
    $mobileDrawer.parentElement.classList.add('list-view');
  } else {
    $mobileDrawer.classList.remove('list-view');
    $mobileDrawer.parentElement.classList.remove('list-view');
  }
}

function addViewToggleIcons(listView,defaultView,$mobileDrawer) {
  Array.from(Array(3).keys()).forEach((index) => {
    defaultView.append(createTag('span'));
    if (index < 2) {
      listView.append(createTag('span'));
    }
  }); 
  [listView, defaultView].forEach((icon) => { 
    icon.setAttribute('tabindex','0')
    icon.addEventListener('click', (e) => {
      toggleListCarousel(e,$mobileDrawer);
    });
    icon.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        toggleListCarousel(e,$mobileDrawer);
      }
    });
  });
}

function createMobileDrawerViewToggleContainer($mobileDrawer,hasListView) {
  const $mobileDrawerViewToggleContainer = createTag('div', { class: 'mobile-drawer-view-toggle' });
  if (hasListView) {
    const $mobileDrawerListView = createTag('a', { class: 'mobile-drawer-list-view' });
    const $mobileDrawerDefaultView = createTag('a', { class: 'mobile-drawer-default-view' });
    $mobileDrawerListView.setAttribute('aria-label','show list view'); //translate aria-label
    $mobileDrawerDefaultView.setAttribute('aria-label','show default view'); //translate aria-label
    addViewToggleIcons($mobileDrawerListView, $mobileDrawerDefaultView, $mobileDrawer);
    $mobileDrawerViewToggleContainer.append($mobileDrawerListView);
    $mobileDrawerViewToggleContainer.append($mobileDrawerDefaultView);
  }
  return $mobileDrawerViewToggleContainer;
}

function createMobileDrawer($block,$sections,$topTab,listViewClass) {
  const $mobileDrawerWrapper = createTag('div', { class: `mobile-drawer-wrapper${listViewClass}` });
  const $mobileDrawer = createTag('div', { class: `mobile-drawer${listViewClass}` });
  $mobileDrawer.setAttribute('data-block-name','mobile-drawer');
  $mobileDrawer.setAttribute('data-block-status','loaded');
  const $mobileDrawerNotch = createTag('a', { class: 'mobile-drawer-notch' }); 
  const $mobileDrawerNotchPill = createTag('div', { class: 'mobile-drawer-notch-pill' });
  const $mobileDrawerTogglesContainer = createTag('div', { class: 'mobile-drawer-toggles-container' });
  const $mobileDrawerItemsContainer = createTag('div', { class: 'mobile-drawer-items-container' });
  const hasListView = $mobileDrawer.classList.contains('list-view'); 
  const $allCtasWrapper = createTag('div', {class: 'drawer-items-all-ctas-wrapper'});
  const $oldWrapper = $block.parentElement;
  $block.classList = 'mobile-drawer-toggle';
  $block.removeAttribute('data-block-name');
  $block.removeAttribute('data-block-status');
  
  $mobileDrawerNotch.setAttribute('tabindex','0');
  $mobileDrawerNotch.dataset.ll = "drawerNotch";
  $mobileDrawerNotch.setAttribute('aria-label','open drawer'); //translate aria-label
  $mobileDrawerNotch.append($mobileDrawerNotchPill);
  $mobileDrawer.append($mobileDrawerNotch);
  const $mobileDrawerViewToggleContainer = createMobileDrawerViewToggleContainer($mobileDrawer,hasListView);
  const $drawerItemsAllCtasWrapper = createTag('div',{class: 'drawer-items-all-ctas-wrapper'});
  const $listViewCtaContainer = createTag('div',{class:'list-view-cta-container drawer-item-ctas-container'});
  $drawerItemsAllCtasWrapper.append($listViewCtaContainer);
  $mobileDrawer.append($mobileDrawerViewToggleContainer);

  decorateToggleCarousel('button', $block);
  
  $mobileDrawerTogglesContainer.append($block);

  const $drawerItemCTASContainer = createTag('div',{class:' drawer-item-ctas-container'});
  const $iconCtaContainer = $drawerItemCTASContainer.cloneNode();
  $iconCtaContainer.classList.add('drawer-item-icon-cta-container');
  $allCtasWrapper.append($iconCtaContainer);

  $sections.forEach((section,index) => { 
    const ctasContainer = $drawerItemCTASContainer.cloneNode();
    if (index === 0) {
      section.style.display = 'block';
      section.setAttribute('aria-hidden', false);
    }
    section.setAttribute('aria-hidden',true);
    section.setAttribute('tabindex','0');
    section.setAttribute('id',`panel-${section.dataset.drawer.trim().replace(/ /g, "")}`);
    ctasContainer.setAttribute('id',`ctas-${section.dataset.drawer.trim().replace(/ /g, "")}`);
    $allCtasWrapper.append(ctasContainer);
    

    section.classList.remove('section');
    section.classList.remove('section-wrapper');
    section.removeAttribute('data-section-status');
    if (hasListView) {
      const $drawerItemIcons = createTag('div',{ class: 'drawer-item-icons'});
      const $drawerItemIconsHeader = createTag('h5',{ class: 'drawer-item-icons-header'});
      let header = $drawerItemIconsHeader;
      header.setAttribute('id',`icon-header-${index}`);
      $drawerItemIcons.dataset.container = section.dataset.drawer;  
      header.textContent = `${section.dataset.drawer}...`;

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
  $wrapper.querySelectorAll('.drawer-item-default-view-container img[loading="lazy"]').forEach(lazyLoadedImg => {
    lazyLoadedImg.setAttribute('loading','eager');
  })
}

function toggleDrawer($wrapper,$lottie,open=true) {
  const floatingButton = document.querySelector('.floating-button-wrapper[data-audience="mobile"]');
  handleShakyLoadingImages($wrapper);
   $wrapper.style.transition = '0.5s';
    $wrapper.style.top = ''; 
    if (open) {
      $wrapper.classList.add('drawer-opened'); 
      $lottie.pause();
      $wrapper.querySelector('.mobile-drawer-items-container')?.setAttribute('aria-hidden',false);
      if (floatingButton) {
        floatingButton.style.transition = 'opacity 500ms';
        floatingButton.style.opacity = '0';
        setTimeout(()=> {
          floatingButton.style.display = 'none';

        },500);
      }
      // TODO: add aria-label to Notch with close drawer message -- what about localization?
    } else {
      if (floatingButton) {
        floatingButton.style.display = 'block';
        floatingButton.style.opacity = '1';
      }

      $wrapper.classList.remove('drawer-opened'); 
      $lottie.play();
      $wrapper.querySelector('.mobile-drawer-items-container')?.setAttribute('aria-hidden',true);
      // TODO: add aria-label to Notch with Open drawer message -- what about localization ?
    }
}
function handleSwipeablesEvents(e,$wrapper,$lottie) {
  e.preventDefault();
  e.stopPropagation();
  if (!$wrapper.classList.contains('drawer-opened')) {
    toggleDrawer($wrapper,$lottie,true);
  } else if ($wrapper.classList.contains('drawer-opened')) {
    toggleDrawer($wrapper,$lottie,false);
  }
}
function initNotchDragAction($wrapper) {
  const $body = document.querySelector('body');
  const $swipeables = $wrapper.querySelectorAll('.mobile-drawer-notch,.tab-lottie-container');
  const $lottie = $wrapper.querySelector('lottie-player');
  let touchStart = 0;
  let initialTop = $wrapper.offsetTop;

  $swipeables.forEach((swipeable) => {
    swipeable.addEventListener('touchstart', (e) => {
      touchStart = e.changedTouches[0].clientY;
      $body.style.overflow = 'hidden'; //might be safer as a class
    }, { passive: true });
    swipeable.addEventListener('touchmove', (e) => {
      $wrapper.style.transition = 'none';
      $wrapper.style.top = `${initialTop + (e.changedTouches[0].clientY - touchStart)}px`;
    }, { passive: true })
    swipeable.addEventListener('touchend', (e) => {
      if (!$wrapper.classList.contains('drawer-opened') && e.changedTouches[0].clientY - touchStart < -50) {
        toggleDrawer($wrapper,$lottie,true);
      } else if ($wrapper.classList.contains('drawer-opened') && e.changedTouches[0].clientY - touchStart > 50) {
        toggleDrawer($wrapper,$lottie,false);
      } else {
        $wrapper.style.transition = '0.5s';
        $wrapper.style.top = `${initialTop}px`;
      }

      setTimeout(() => { 
        initialTop = $wrapper.offsetTop;
        if (!$wrapper.classList.contains('drawer-opened')) {
          $body.style.overflow = ''; //maybe safer as a class?
        }
       }, 600);

    }, { passive: true });
    swipeable.addEventListener('click',(e) => {
      handleSwipeablesEvents(e,$wrapper,$lottie);
    });
    swipeable.addEventListener('keyup',(e) => {
      const isClosed = !e.target.closest('.mobile-drawer-wrapper').classList.contains('draw-opened');
      if (e.target.classList.contains('mobile-drawer-notch') && e.type === 'keyup' && (e.key === 'Enter' || e.key === 'Escape')) {
        handleSwipeablesEvents(e,$wrapper,$lottie)
      } else if ((e.target.classList.contains('mobile-drawer-notch') && e.key === 'Tab' && isClosed)) {
        e.preventDefault();
      }
    });
  });
}
export default async function decorate($block) {
  const listViewClass = $block.classList.contains('list-view') ? ' has-list list-view initial-load' : '';
  const $main = document.querySelector('main');
  const $sections = $main.querySelectorAll('[data-drawer]'); //drawer-toggle is illegal format becausse of hyphen?
  const $toggles = $block.querySelector('ul');
  const $oldMobileDrawerSection = document.querySelector('.mobile-drawer-container, .mobile-drawer-list-view-container');
  const $tabLottieContainer = createTag('div', { class: 'tab-lottie-container' });
  const $tabLottie = createTag('div', { class: 'tab-lottie' });
  const $tabText = $oldMobileDrawerSection.querySelector('.default-content-wrapper p');
  $tabLottie.innerHTML = getLottie('compass-lottie-white', '/express/experiments/ccx0098/ch1/mobile-drawer/compass-lottie-white.json');
  $tabLottie.append($tabText);
  $tabLottieContainer.append($tabLottie)

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
 
  const $mobileDrawer = createMobileDrawer($block,$sections,$tabLottieContainer,listViewClass); 

  $main.append($mobileDrawer);
  initNotchDragAction($mobileDrawer);
}
