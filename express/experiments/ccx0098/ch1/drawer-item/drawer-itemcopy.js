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

// eslint-disable-next-line import/no-unresolved
import { buildCarousel } from '../../../../blocks/shared/carousel.js';
import { 
    normalizeHeadings,
    getIconElement,
    getLottie,
    getMobileOperatingSystem,
    createTag,
    transformLinkToAnimation,
    fixIcons, 
} from '../../../../scripts/scripts.js';
// eslint-disable-next-line import/no-unresolved
// import { buildCarousel } from '../../../../blocks/shared/carousel.js';
function createIndicators(count,carousel) {
  if (count && carousel) {
    const drawerIndicatorsWrapper = createTag('div', { class: 'mobile-drawer-indicators-wrapper' });
    const drawerIndicators = createTag('div', { class: 'mobile-drawer-indicators' });
    for (let i = 0; i < count; i++) {
      let isActiveClass = i === 0 ? 'active' : '';
      drawerIndicators.append(createTag('div', { class: `${isActiveClass}` }));
    }
    const indicators = drawerIndicators.querySelectorAll('div');

    drawerIndicatorsWrapper.append(drawerIndicators);
    let previousScrollLeft = carousel.scrollLeft;
    let activeItem = 0;
    carousel.addEventListener('scroll',(e)=> {
      if (Math.abs(e.target.scrollLeft - previousScrollLeft) > 25) {
        const newActiveItem = count - Math.round((e.target.scrollWidth - e.target.scrollLeft)/ e.target.clientWidth);
        if (newActiveItem !== activeItem) {
          indicators[activeItem]?.classList?.remove('active');
          indicators[newActiveItem]?.classList?.add('active');
          activeItem = newActiveItem;
        }
      }
    });

    return drawerIndicatorsWrapper;
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
  })
}
function getMissingIcon(iconName) {
  const icons = {'scratch':'blank','start-from-scratch': 'blank','design-assets': 'design-assets','blank':'blank', 
  'color': 'color', 'trim video': 'trim-video','merge-video': 'merge-video','photos':'photos','videos': 'videos',
  'fonts':'fonts','remove-background':'remove-background','resize-image':'resize','convert-to-gif':'convert-to-gif',
  'trim-video':'trim-video','resize-video':'resize','merge-video':'merge-video','social-content':'social-content',
  'flyer':'flyer','banner':'banner','logo':'logo','poster':'poster','meme':'meme','templates':'templates','create-blank':'blank-white'};
  iconName = iconName.trim().toLowerCase().split(' ').join('-');

  return icons[iconName];
}

// function decorateBadge() {
//   const $anchor = createTag('a');
//   const OS = getMobileOperatingSystem();

//   if ($anchor) {
//     $anchor.textContent = '';
//     $anchor.classList.add('badge');

//     if (OS === 'iOS') {
//       $anchor.append(getIconElement('apple-store'));
//     } else {
//       $anchor.append(getIconElement('google-store'));
//     }
//   }

//   return $anchor;
// }
function createIcon(name) {
  return `<img class="icon icon-${getMissingIcon(name)}-22" src="/express/icons/${getMissingIcon(name)}-22.svg" alt="${name}">`;
}
function addDecorativeBubbles(bubbleContainer) {
  for (let i = 0; i < 7; i++) {
    let bigBubble = bubbleContainer.querySelector(`.drawer-item:nth-of-type(${i + 1})`);
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
// TODO IF DONE: convert this to another class option: gradientBubble or something similar
function convertLastDrawerItemToGradientWithIcon(drawerItem) {
  const link = drawerItem.querySelector('a');
  const iconAndTextWrapper = createTag('div');
  const text = createTag('p');
  const icon = createTag('div');
  text.innerText = 'Create blank'; //use localization function here
  icon.innerHTML = createIcon(text.innerText);
  iconAndTextWrapper.append(icon);
  iconAndTextWrapper.append(text);
  link.innerHTML = '';

  link.classList.add('button');
  link.classList.add('gradient');
  link.append(iconAndTextWrapper);
}

function createCTA(hasList,text,link,isBubblesView) {
  const ctaContainer = createTag('div',{class: 'drawer-item-cta-container'});
  // console.log('hasList:', hasList);
  // console.log('text: ', text);
  // console.log('link ',link);
  // console.log('isBubblesView',isBubblesView);
//   if (isBubblesView) {
  const cta = createTag('a',{class: 'drawer-cta'});
  const ctaText = createTag('p');
  ctaText.innerText = text;
  
  if (hasList) {
    const gradientCTALottie = createTag('div', { class: 'cta-lottie' });
    if (getMobileOperatingSystem() === 'iOS') {
      gradientCTALottie.innerHTML = getLottie('apple-lottie', '/express/experiments/ccx0098/ch1/drawer-item/app_store_icons_apple.json');
    } else {
      gradientCTALottie.innerHTML = getLottie('android-lottie', '/express/experiments/ccx0098/ch1/drawer-item/google_g_app_store.json');
    }
    cta.append(...gradientCTALottie.children);
    cta.append(ctaText);

    cta.classList.add('button', 'gradient', 'xlarge');
  }
  cta.href = link;
  ctaContainer.append(cta);
  return ctaContainer;

}
function updatePayloadFromBlock($block, payload) {
  // TODO: refactor to use 'payload' -- see app-store-blade
  $block.querySelectorAll(':scope>div').forEach((item) => {
    let row = Array.from(item.children);
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
        break;
      case 'media':
        payload.media = row[1];
        let mediaAnchor = payload.media?.cloneNode().querySelector('a');
        if (mediaAnchor && mediaAnchor?.href?.includes('.mp4')) {
          payload.media.innerHtml = '';
          payload.media = mediaAnchor;
        } else if (payload.media?.querySelector('picture')) {
          payload.media = payload.media?.querySelector('picture');
        }
        break;
      case 'media link':
        payload.mediaLink = row[1]?.querySelector('a');
        break;
      case 'media text':
        payload.mediaText.textContent = row[1]?.textContent;
        break;
      case 'cta text':
        payload.ctaText = row[1]?.textContent;
        break;
      case 'cta link':
        payload.ctaLink = row[1]?.querySelector('a');
        break;
      case 'download link':
        payload.downloadLink = row[1]?.querySelector('a');
        break;
      default:
        console.log('nothing matched:', item);
        break;
    }
  });
}
// function addSingleIconContainer(payload) {
//   if (payload.iconLink && payload.hasList) {
//     const $drawerItemSectionIconsContainer = payload.main.querySelector(`[data-container="${payload.drawerItemContainer.dataset.drawer}"]`);
//     let headerId = payload.drawerItemContainer?.previousElementSibling?.querySelector('.drawer-item-icons-header')?.id;
//     if (headerId) {
//       payload.iconLink.setAttribute('aria-labelledby', `${headerId}`);
//     }
//     payload.iconLink.append(payload.icon);
//     payload.iconLink.append(payload.iconName);
//     payload.iconContainer.append(payload.iconLink);
//     $drawerItemSectionIconsContainer.append(payload.iconContainer);
//   } 
// }
// function addListViewCta(payload) {
//   const iconsCtaContainer = document.querySelector('.drawer-items-icon-cta');
//   if (payload.$ctasWrapper && payload.hasList && iconsCtaContainer) {
//     if (iconsCtaContainer.children.length < 1) {
//       const iconCTA = createCTA(payload.hasList, payload.ctaText, payload.downloadLink, false);
//       iconsCtaContainer.append(iconCTA);
//     }
//   }
// }
// function addMediaDrawerItem(payload) {
//   // debugger;
//   console.log(payload);
//   if (payload.mediaText && payload.mediaLink) {
//     const isNotBubbleItem = !!payload.mediaText.textContent; 
//     const drawerItem = createTag('div',{class:'drawer-item'});
//     payload.mediaLink.textContent = '';
//     payload.mediaLink.append(payload.media);
//     drawerItem.append(payload.mediaLink);
//     if (isNotBubbleItem) {
//       drawerItem.append(payload.itemName);
//       drawerItem.append(payload.mediaText);
//     }
//     payload.drawerItemContainer.append(drawerItem);
//   } 
// }
// function decorateBubbleView(payload) {
//   if (payload.isBubbleView) {
//     const bubbleContainer = createTag('div', { class: 'drawer-item-bubbles-container' });
//     convertLastDrawerItemToGradientWithIcon(payload.drawerItemContainer.children[payload.drawerItemContainer.children.length - 1]);
//     tempWorkAroundForBubbleOrder(payload.drawerItemContainer);
//     removeCarouselGeneratedArrows(payload.$mobileDrawer);
//     bubbleContainer.append(...payload.drawerItemContainer.children);
//     addDecorativeBubbles(bubbleContainer);
//     payload.drawerItemContainer.append(bubbleContainer);
//     // const bubblesCTA = createCTA(payload.hasList,payload.ctaText,payload.downloadLink,true);

//     // .append(bubblesCTA);

//   }
// }
// function initPostLoadActivities(payload) {
//   if (payload.drawerItemContainer.dataset.itemCount === payload.drawerItemContainer.dataset.itemLoadedCount) {
//     decorateBubbleView(payload);
//     if (payload.drawerItemContainer.classList.contains('drawer-item-animations-view-container')) {
//       payload.drawerItemContainer.querySelectorAll('a').forEach((link) => {
//       // $mobileDrawer.querySelectorAll('.drawer-item-container-1 a').forEach((link) => {
//         // ******************** UNCOMMENT FOR CHECKIN: ******************
//         // uncomment before checkin since this won't work in local:
//         // if (link?.href?.includes('.mp4')) {
//           // console.log('test worked for:', link);
//           // transformLinkToAnimation(link);
//         // }
//         // remove before checkin:
//           // ********************TEMP FIX TO TEST IN LOCAL ---REMOVE: ******************
//         if (link.href.trim().startsWith('http://localhost:3000')) {
//           if (link.href.trim().endsWith('.mp4')) {
//             transformLinkToAnimation(link);
//           }
//         }
//       });
     

//     }  
//     // if (!payload.isBubbleView) {
//     //   buildCarousel('.drawer-item', payload.drawerItemContainer);
//     //   let carousel = payload.drawerItemContainer.querySelector('.carousel-platform');
//     //   const indicators = createIndicators(parseInt(payload.drawerItemContainer.dataset.itemLoadedCount), carousel);
//     //   payload.drawerItemContainer.append(indicators);
//     // }
//   }

// }
export default function decorate($block) {
  // const payload = {
  //   block: $block,
  //   drawerItemContainer: $block.closest('[data-drawer]'),
  //   iconContainer: createTag('div', { class: 'drawer-item-icon-container' }),
  //   iconName: createTag('p'),
  //   itemName: createTag('h5'),
  //   mediaText: createTag('p'),
  //   icon: createTag('div', { class: 'drawer-item-icon' }),
  //   iconLink: '',
  //   mediaLink: '',
  //   media: '',
  //   ctaText: '',
  //   ctaLink: '',
  //   downloadLink: '',
  //   $mobileDrawer: document.querySelector('.mobile-drawer'),
  //   // hasList: this.$mobileDrawer.classList.contains('has-list'),
  //   // isBubbleView: this.drawerItemContainer.classList.contains('drawer-item-bubbles-view-container'),
  //   $ctasWrapper: document.querySelector('.drawer-items-all-ctas-wrapper')
  // }
  // payload.ctasID = `ctas-${payload.drawerItemContainer.dataset.drawer.replace(/ /g, "")}`;
  // payload.main = payload.drawerItemContainer.closest('main');
  // payload.hasList = payload.$mobileDrawer.classList.contains('has-list');
  // payload.isBubbleView = payload.drawerItemContainer.classList.contains('drawer-item-bubbles-view-container');

  const drawerItemContainer = $block.closest('[data-drawer]');

  const ctasID = `ctas-${drawerItemContainer.dataset.drawer.replace(/ /g, "")}`;
  const main = drawerItemContainer.closest('main');
  const iconContainer = createTag('div', { class: 'drawer-item-icon-container' });
  const iconName = createTag('p');
  const itemName = createTag('h5');
  const mediaText = createTag('p');
  let icon = createTag('div', { class: 'drawer-item-icon' });
  let iconLink, mediaLink, media, ctaText, ctaLink, downloadLink;
  const $mobileDrawer = document.querySelector('.mobile-drawer');
  const hasList = $mobileDrawer.classList.contains('has-list');
  const isBubbleView = drawerItemContainer.classList.contains('drawer-item-bubbles-view-container');
  const $ctasWrapper = document.querySelector('.drawer-items-all-ctas-wrapper');
  

  // TODO: refactor to use 'payload' -- see app-store-blade
  $block.querySelectorAll(':scope>div').forEach((item) => {
    let row = Array.from(item.children);
    let content = row[0]?.textContent.trim().toLowerCase();
    if (content === 'item name') {
      iconName.textContent = row[1]?.textContent.trim();
      itemName.textContent = iconName.textContent;
    } else if (content === 'icon') {
      const loadedIcon = row[1]?.querySelector('svg'); 
      if (loadedIcon && !getMissingIcon(iconName.textContent)) {
        icon.append(row[1]?.querySelector('svg'));
      } else if (getMissingIcon(iconName.textContent)) {
        icon.innerHTML = createIcon(iconName.textContent);
      }
      // if (!loadedIcon) console.log('name of missing icon', iconName.textContent);
    } else if (content === 'icon link') {
      iconLink = row[1]?.querySelector('a');
      iconLink.textContent = '';
    } else if (content === 'media') {
      media = row[1];
      let mediaAnchor = media?.cloneNode().querySelector('a');
      if (mediaAnchor && mediaAnchor?.href?.includes('.mp4')) {
        media.innerHtml = '';
        media = mediaAnchor;
      } else if (media?.querySelector('picture')) {
        media = media?.querySelector('picture');
      }
    } else if (content === 'media link') {
      mediaLink = row[1]?.querySelector('a');
    } else if (content === 'media text') {
      mediaText.textContent = row[1]?.textContent;  
    } else if (content === 'cta text') {
      ctaText = row[1]?.textContent;
    } else if (content === 'cta link') {
      ctaLink = row[1]?.querySelector('a');
    } else if (content === 'download link') {
      downloadLink = row[1]?.querySelector('a');
    }
  });
// to be removed if possible end******

  // updatePayloadFromBlock($block, payload);

  // console.log(payload);


  // addSingleIconContainer(payload);
  // addListViewCta(payload);
  const iconsCtaContainer = document.querySelector('.drawer-items-icon-cta');
  if ($ctasWrapper && hasList && iconsCtaContainer) {
    if (iconsCtaContainer.children.length < 1) {
      console.log('should be appendeding icon cta');
      const iconCTA = createCTA(hasList,ctaText,downloadLink,false);
      iconsCtaContainer.append(iconCTA);

    }
  }

  if (iconLink && hasList) {
    const $drawerItemSectionIconsContainer = main.querySelector(`[data-container="${drawerItemContainer.dataset.drawer}"]`);
    let headerId = drawerItemContainer?.previousElementSibling?.querySelector('.drawer-item-icons-header')?.id;
    if (headerId) {
      iconLink.setAttribute('aria-labelledby', `${headerId}`);
    }
    iconLink.append(icon);
    iconLink.append(iconName);
    iconContainer.append(iconLink);
    $drawerItemSectionIconsContainer.append(iconContainer);
  } 
  // addMediaDrawerItem(payload);




  if (mediaText && mediaLink) {
    const isNotBubbleItem = !!mediaText.textContent; 
    const drawerItem = createTag('div',{class:'drawer-item'});
    mediaLink.textContent = '';
    mediaLink.append(media);
    drawerItem.append(mediaLink);
    if (isNotBubbleItem) {
      drawerItem.append(itemName);
      drawerItem.append(mediaText);
    }
    drawerItemContainer.append(drawerItem);
  }

  

  // Start from and Quick actions lists for carousel will go here
  drawerItemContainer.dataset.itemLoadedCount = parseInt(drawerItemContainer.dataset.itemLoadedCount) + 1;

  // initPostLoadActivities(payload);

  

  if (drawerItemContainer.dataset.itemCount === drawerItemContainer.dataset.itemLoadedCount) {
    // payload.drawerItemContainer.querySelectorAll('.drawer-item-wrapper').forEach(oldItem => {
      // oldItem.remove();
    // });
    // console.log('operating system:',getMobileOperatingSystem());
    if (drawerItemContainer.classList.contains('drawer-item-animations-view-container')) {
      drawerItemContainer.querySelectorAll('a').forEach((link) => {
        $mobileDrawer.querySelectorAll('.drawer-item-container-1 a').forEach((link) => {
        // ******************** UNCOMMENT FOR CHECKIN: ******************
        // uncomment before checkin since this won't work in local:
        // if (link?.href?.includes('.mp4')) {
          // console.log('test worked for:', link);
          // transformLinkToAnimation(link);
        // }
        // remove before checkin:
          // ********************TEMP FIX TO TEST IN LOCAL ---REMOVE: ******************
          if (link.href.trim().startsWith('http://localhost:3000')) {
            if (link.href.trim().endsWith('.mp4')) {
              transformLinkToAnimation(link);
            }
          }
        });
      })
    }

    if (isBubbleView) {
      const bubbleContainer = createTag('div', { class: 'drawer-item-bubbles-container' });
      convertLastDrawerItemToGradientWithIcon(drawerItemContainer.children[drawerItemContainer.children.length - 1]);
      tempWorkAroundForBubbleOrder(drawerItemContainer);
      removeCarouselGeneratedArrows($mobileDrawer);
      bubbleContainer.append(...drawerItemContainer.children);
      addDecorativeBubbles(bubbleContainer);
      drawerItemContainer.append(bubbleContainer);
      // const bubblesCTA = createCTA(hasList,ctaText,downloadLink,true);

      //   // .append(bubblesCTA);

    } else {
      buildCarousel('.drawer-item', drawerItemContainer);
      let carousel = drawerItemContainer.querySelector('.carousel-platform');
      const indicators = createIndicators(parseInt(drawerItemContainer.dataset.itemLoadedCount), carousel);
      drawerItemContainer.append(indicators);
    }
  }

}