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
/* eslint-disable no-console */
/* global digitalData _satellite __satelliteLoadedCallback alloy */

import {
  loadScript,
  getLocale,
  getLanguage,
  getMetadata,
  checkTesting,
  fetchPlaceholders,
// eslint-disable-next-line import/no-unresolved
} from './scripts.js';

import BlockMediator from './block-mediator.js';

function getPlacement(btn) {
  const parentBlock = btn.closest('.block');
  let placement = 'outside-blocks';

  if (parentBlock) {
    const blockName = parentBlock.dataset.blockName || parentBlock.classList[0];
    const sameBlocks = btn.closest('main')?.querySelectorAll(`.${blockName}`);

    if (sameBlocks && sameBlocks.length > 1) {
      sameBlocks.forEach((b, i) => {
        if (b === parentBlock) {
          placement = `${blockName}-${i + 1}`;
        }
      });
    } else {
      placement = blockName;
    }

    if (['template-list', 'template-x'].includes(blockName) && btn.classList.contains('placeholder')) {
      placement = 'blank-template-cta';
    }
  }

  return placement;
}

async function trackBranchParameters($links) {
  const placeholders = await fetchPlaceholders();
  const rootUrl = new URL(window.location.href);
  const rootUrlParameters = rootUrl.searchParams;

  const { experiment } = window.hlx;
  const { referrer } = window.document;
  const experimentStatus = experiment ? experiment.status.toLocaleLowerCase() : null;
  const templateSearchTag = getMetadata('short-title');
  const pageUrl = window.location.pathname;
  const sdid = rootUrlParameters.get('sdid');
  const mv = rootUrlParameters.get('mv');
  const mv2 = rootUrlParameters.get('mv2');
  const sKwcId = rootUrlParameters.get('s_kwcid');
  const efId = rootUrlParameters.get('ef_id');
  const promoId = rootUrlParameters.get('promoid');
  const trackingId = rootUrlParameters.get('trackingid');
  const cgen = rootUrlParameters.get('cgen');

  $links.forEach(($a) => {
    if ($a.href && $a.href.match('adobesparkpost.app.link')) {
      const btnUrl = new URL($a.href);
      const urlParams = btnUrl.searchParams;
      const placement = getPlacement($a);

      if (templateSearchTag
        && placeholders['search-branch-links']?.replace(/\s/g, '').split(',').includes(`${btnUrl.origin}${btnUrl.pathname}`)) {
        urlParams.set('search', templateSearchTag);
        urlParams.set('q', templateSearchTag);
        urlParams.set('category', 'templates');
        urlParams.set('searchCategory', 'templates');
      }

      if (referrer) {
        urlParams.set('referrer', referrer);
      }

      if (pageUrl) {
        urlParams.set('url', pageUrl);
      }

      if (sdid) {
        urlParams.set('sdid', sdid);
      }

      if (mv) {
        urlParams.set('mv', mv);
      }

      if (mv2) {
        urlParams.set('mv2', mv2);
      }

      if (efId) {
        urlParams.set('efid', efId);
      }

      if (sKwcId) {
        const sKwcIdParameters = sKwcId.split('!');

        if (typeof sKwcIdParameters[2] !== 'undefined' && sKwcIdParameters[2] === '3') {
          urlParams.set('customer_placement', 'Google%20AdWords');
        }

        if (typeof sKwcIdParameters[8] !== 'undefined' && sKwcIdParameters[8] !== '') {
          urlParams.set('keyword', sKwcIdParameters[8]);
        }
      }

      if (promoId) {
        urlParams.set('promoid', promoId);
      }

      if (trackingId) {
        urlParams.set('trackingid', trackingId);
      }

      if (cgen) {
        urlParams.set('cgen', cgen);
      }

      if (experimentStatus === 'active') {
        urlParams.set('expid', `${experiment.id}-${experiment.selectedVariant}`);
      }

      if (placement) {
        urlParams.set('ctaid', placement);
      }

      btnUrl.search = urlParams.toString();
      $a.href = decodeURIComponent(btnUrl.toString());
    }
  });
}

// this saves on file size when this file gets minified...
const w = window;
const d = document;
const loc = w.location;
const { pathname } = loc;
const usp = new URLSearchParams(window.location.search);
const martech = usp.get('martech');

// alloy feature flag
let useAlloy;
let martechURL;
if (martech === 'legacy') {
  useAlloy = false;
  if (window.spark && window.spark.hostname === 'www.stage.adobe.com') {
    martechURL = 'https://www.adobe.com/marketingtech/main.stage.min.js';
  } else {
    martechURL = 'https://www.adobe.com/marketingtech/main.min.js';
  }
} else {
  useAlloy = true;
  if (
    (window.spark && window.spark.hostname === 'www.stage.adobe.com')
    || martech === 'alloy-qa'
  ) {
    martechURL = 'https://www.adobe.com/marketingtech/main.standard.qa.js';
  } else {
    martechURL = 'https://www.adobe.com/marketingtech/main.standard.min.js';
  }
}

if (useAlloy) {
  w.marketingtech = {
    adobe: {
      launch: {
        url: (
          (
            (window.spark && window.spark.hostname === 'www.stage.adobe.com')
            || martech === 'alloy-qa'
          )
            ? 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-2c94beadc94f-development.js'
            : 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-5dd5dd2177e6.min.js'
        ),
      },
      alloy: {
        edgeConfigId: (
          (
            (window.spark && window.spark.hostname === 'www.stage.adobe.com')
            || martech === 'alloy-qa'
          )
            ? '8d2805dd-85bf-4748-82eb-f99fdad117a6'
            : '2cba807b-7430-41ae-9aac-db2b0da742d5'
        ),
      },
      target: checkTesting(),
      audienceManager: true,
    },
  };
  // w.targetGlobalSettings = w.targetGlobalSettings || {};
  // w.targetGlobalSettings.bodyHidingEnabled = checkTesting();
} else {
  w.marketingtech = {
    adobe: {
      launch: {
        property: 'global',
        environment: 'production',
      },
      analytics: {
        additionalAccounts: 'adbemmarvelweb.prod, adbadobesparkprod',
      },
      target: checkTesting(),
      audienceManager: true,
    },
  };
  w.targetGlobalSettings = w.targetGlobalSettings || {};
  w.targetGlobalSettings.bodyHidingEnabled = checkTesting();
}

loadScript(martechURL, () => {
  /* eslint-disable no-underscore-dangle */

  const set = (path, value) => {
    if (useAlloy) {
      const obj = w.alloy_all;
      const newPath = `data._adobe_corpnew.digitalData.${path}`;
      const segs = newPath.split('.');
      let temp = obj;
      let i = 0;
      const il = segs.length - 1;
      // get to the path
      // eslint-disable-next-line no-plusplus
      for (; i < il; i++) {
        const seg = segs[i];
        temp[seg] = temp[seg] || {};
        temp = temp[seg];
      }
      // set the value
      temp[segs[i]] = value;
      return obj;
    } else {
      return digitalData._set(path, value);
    }
  };

  function urlPathToName(text) {
    const splits = text.toLowerCase().split('-');
    const camelCase = splits.map((s, i) => (i ? s.charAt(0).toUpperCase() + s.substr(1) : s)).join('');
    const pathName = camelCase.replace('Jpg', 'JPG').replace('Png', 'PNG').replace('Gif', 'GIF').replace('Mp4', 'MP4');
    return (pathName);
  }

  //------------------------------------------------------------------------------------
  // gathering the data
  //------------------------------------------------------------------------------------

  const locale = getLocale(w.location);
  const pathSegments = pathname.substr(1).split('/');
  if (locale !== 'us') pathSegments.shift();
  const pageName = `adobe.com:${pathSegments.join(':')}`;

  const language = getLanguage(getLocale(window.location));

  let category = getMetadata('category');
  if (!category && (pathname.includes('/create/')
      || pathname.includes('/feature/'))) {
    category = 'design';
    if (pathname.includes('/image')) category = 'photo';
    if (pathname.includes('/video')) category = 'video';
  }

  let sparkLandingPageType;
  // home
  if (
    pathname === '/express'
      || pathname === '/express/'
  ) {
    sparkLandingPageType = 'home';
    // seo
  } else if (
    pathname === '/express/create'
      || pathname.includes('/create/')
      || pathname === '/express/make'
      || pathname.includes('/make/')
      || pathname === '/express/feature'
      || pathname.includes('/feature/')
      || pathname === '/express/discover'
      || pathname.includes('/discover/')
  ) {
    sparkLandingPageType = 'seo';
    // learn
  } else if (
    pathname === '/express/tools'
    || pathname.includes('/tools/')
  ) {
    sparkLandingPageType = 'quickAction';
  } else if (
    pathname === '/express/learn'
      || (
        pathname.includes('/learn/')
        && !pathname.includes('/blog/')
      )
  ) {
    if (pathname.includes('/express-your-brand')) {
      sparkLandingPageType = 'express-your-brand';
    } else {
      sparkLandingPageType = 'learn';
    }
    // blog
  } else if (
    pathname === '/express/learn/blog'
      || pathname.includes('/learn/blog/')
  ) {
    sparkLandingPageType = 'blog';
    // pricing
  } else if (
    pathname.includes('/pricing')
  ) {
    sparkLandingPageType = 'pricing';
    // edu
  } else if (
    pathname.includes('/education/')
  ) {
    sparkLandingPageType = 'edu';
    // other
  } else if (
    pathname.includes('/express-your-fandom')
  ) {
    sparkLandingPageType = 'express-your-fandom';
  } else {
    sparkLandingPageType = 'other';
  }
  const sparkUserType = (w.adobeIMS && w.adobeIMS.isSignedInUser()) ? 'knownNotAuth' : 'unknown';
  const url = new URL(loc.href);
  const sparkTouchpoint = url.searchParams.get('touchpointName');

  //----------------------------------------------------------------------------
  // set some global and persistent data layer properties
  //----------------------------------------------------------------------------
  set('page.pageInfo.pageName', pageName);
  set('page.pageInfo.language', language);
  set('page.pageInfo.siteSection', 'adobe.com:express');
  set('page.pageInfo.category', category);

  //----------------------------------------------------------------------------
  // spark specific global and persistent data layer properties
  //----------------------------------------------------------------------------
  set('page.pageInfo.pageurl', loc.href);
  set('page.pageInfo.namespace', 'express');

  /* set experiment and variant information */
  if (window.hlx.experiment) {
    const { experiment } = window.hlx;
    set('adobe.experienceCloud.target.info.primarytest.testinfo.campaignid', experiment.id);
    set('adobe.experienceCloud.target.info.primarytest.testinfo.offerid', experiment.selectedVariant);
  }

  set('spark.eventData.pageurl', loc.href);
  set('spark.eventData.pageReferrer', d.referrer);
  set('spark.eventData.pageTitle', d.title);
  set('spark.eventData.landingPageType', sparkLandingPageType);
  set('spark.eventData.landingPageReferrer', d.referrer);
  set('spark.eventData.landingPageUrl', loc.href);
  set('spark.eventData.userType', sparkUserType);
  set('spark.eventData.premiumEntitled', '');
  set('spark.eventData.displayedLanguage', language);
  set('spark.eventData.deviceLanguage', navigator.language);
  set('spark.eventData.pagename', pageName);
  set('spark.eventData.platformName', 'web');
  if (category) {
    set('spark.eventData.contextualData3', `category:${category}`);
  }

  if (pathname.includes('/tools/')) {
    const sparkContextualData = urlPathToName(pathname.split('/').pop());
    set('spark.eventData.contextualData1', `quickActionType:${sparkContextualData}`);
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  }

  if (pathname.includes('/create/video/animation')) {
    set('spark.eventData.contextualData1', 'quickActionType:animateFromAudio');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/resize')) {
    set('spark.eventData.contextualData1', 'quickActionType:imageResize');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/crop')) {
    set('spark.eventData.contextualData1', 'quickActionType:imageCrop');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/qr-code-generator')) {
    set('spark.eventData.contextualData1', 'quickActionType:qrCodeGenerator');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/remove-background')) {
    set('spark.eventData.contextualData1', 'quickActionType:removeBackground');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/transparent-background')) {
    set('spark.eventData.contextualData1', 'quickActionType:removeBackground');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/jpg-to-png')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToPNG');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/png-to-jpg')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToJPG');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/image/convert/svg')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToSVG');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/video/animate/audio')) {
    set('spark.eventData.contextualData1', 'quickActionType:animateFromAudio');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/video/trim')) {
    set('spark.eventData.contextualData1', 'quickActionType:trimVideo');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/video/resize')) {
    set('spark.eventData.contextualData1', 'quickActionType:resizeVideo');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/video/crop')) {
    set('spark.eventData.contextualData1', 'quickActionType:cropVideo');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/video/video-to-gif')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToGIF');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/change-speed')) {
    set('spark.eventData.contextualData1', 'quickActionType:changeVideoSpeed');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/merge')) {
    set('spark.eventData.contextualData1', 'quickActionType:mergeVideo');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/convert/mp4-to-gif')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToGIF');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/convert/mp4')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/convert/gif-to-mp4')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/convert/mov-to-mp4')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/convert/video-to-gif')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToGIF');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/convert/wmv-to-mp4')) {
    set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.endsWith('/feature/video/reverse')) {
    set('spark.eventData.contextualData1', 'quickActionType:reverseVideo');
    set('spark.eventData.contextualData2', 'actionLocation:seo');
  }

  //------------------------------------------------------------------------------------
  // Fire extra spark events
  //------------------------------------------------------------------------------------

  // Fire the viewedPage event
  if (useAlloy) {
    _satellite.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: 'viewedPage',
            linkClicks: {
              value: 1,
            },
            type: 'other',
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventName: 'viewedPage',
              },
            },
            spark: {
              eventData: {
                eventName: 'viewedPage',
                sendTimestamp: new Date().getTime(),
              },
            },
          },
        },
      },
    });
  } else {
    digitalData._set('primaryEvent.eventInfo.eventName', 'viewedPage');
    digitalData._set('spark.eventData.eventName', 'viewedPage');
    digitalData._set('spark.eventData.sendTimestamp', new Date().getTime());

    _satellite.track('event', {
      digitalData: digitalData._snapshot(),
    });

    digitalData._delete('primaryEvent.eventInfo.eventName');
    digitalData._delete('spark.eventData.eventName');
    digitalData._delete('spark.eventData.sendTimestamp');
  }

  // Fire the landing:viewedPage event
  if (useAlloy) {
    _satellite.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: 'landing:viewedPage',
            linkClicks: {
              value: 1,
            },
            type: 'other',
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventName: 'landing:viewedPage',
              },
            },
            spark: {
              eventData: {
                eventName: 'landing:viewedPage',
                sendTimestamp: new Date().getTime(),
              },
            },
          },
        },
      },
    });
  } else {
    digitalData._set('primaryEvent.eventInfo.eventName', 'landing:viewedPage');
    digitalData._set('spark.eventData.eventName', 'landing:viewedPage');
    digitalData._set('spark.eventData.sendTimestamp', new Date().getTime());

    _satellite.track('event', {
      digitalData: digitalData._snapshot(),
    });

    digitalData._delete('primaryEvent.eventInfo.eventName');
    digitalData._delete('spark.eventData.eventName');
    digitalData._delete('spark.eventData.sendTimestamp');
  }

  // Fire the displayPurchasePanel event if it is the pricing site
  if (
    sparkLandingPageType === 'pricing'
      && sparkTouchpoint
  ) {
    if (useAlloy) {
      _satellite.track('event', {
        xdm: {},
        data: {
          eventType: 'web.webinteraction.linkClicks',
          web: {
            webInteraction: {
              name: 'displayPurchasePanel',
              linkClicks: {
                value: 1,
              },
              type: 'other',
            },
          },
          _adobe_corpnew: {
            digitalData: {
              primaryEvent: {
                eventInfo: {
                  eventName: 'displayPurchasePanel',
                },
              },
              spark: {
                eventData: {
                  eventName: 'displayPurchasePanel',
                  trigger: sparkTouchpoint,
                  sendTimestamp: new Date().getTime(),
                },
              },
            },
          },
        },
      });
    } else {
      digitalData._set('primaryEvent.eventInfo.eventName', 'displayPurchasePanel');
      digitalData._set('spark.eventData.eventName', 'displayPurchasePanel');
      digitalData._set('spark.eventData.sendTimestamp', new Date().getTime());
      digitalData._set('spark.eventData.trigger', sparkTouchpoint);

      _satellite.track('event', {
        digitalData: digitalData._snapshot(),
      });

      digitalData._delete('primaryEvent.eventInfo.eventName');
      digitalData._delete('spark.eventData.eventName');
      digitalData._delete('spark.eventData.sendTimestamp');
      digitalData._delete('spark.eventData.trigger');
    }
  }

  function textToName(text) {
    const splits = text.toLowerCase().split(' ');
    const camelCase = splits.map((s, i) => (i ? s.charAt(0).toUpperCase() + s.substr(1) : s)).join('');
    return (camelCase);
  }

  function appendLinkText(eventName, $a) {
    let $img;
    let alt;
    let newEventName;

    if ($a.textContent.trim()) {
      newEventName = eventName + textToName($a.textContent.trim());
    } else {
      $img = $a.querySelector('img');
      alt = $img && $img.getAttribute('alt');
      if (alt) {
        newEventName = eventName + textToName(alt);
      } else {
        newEventName = eventName;
      }
    }

    return newEventName;
  }

  function trackButtonClick($a) {
    let adobeEventName = 'adobe.com:express:cta:';
    let sparkEventName;
    let sparkButtonId;

    const $templateContainer = $a.closest('.template-list');
    const $tutorialContainer = $a.closest('.tutorial-card');
    const $contentToggleContainer = $a.closest('.content-toggle');
    const $chooseYourPathContainer = $a.closest('.choose-your-path');
    // let cardPosition;
    // Template button click
    if ($templateContainer) {
      adobeEventName += 'template:';
      sparkEventName = 'landing:templatePressed';

      const $img = $a.querySelector('img');

      // try to get the image alternate text
      if ($a.classList.contains('template-title-link')) {
        adobeEventName += 'viewAll';
        sparkEventName = 'landing:templateViewAllPressed';
      } else if ($a.classList.contains('placeholder')) {
        adobeEventName += 'createFromScratch';
      } else if ($img && $img.alt) {
        adobeEventName += textToName($img.alt);
      } else {
        adobeEventName += 'Click';
      }

      if (w.location.href.includes('/express-your-fandom')) {
        const $templates = document.querySelectorAll('a.template');
        const templateIndex = Array.from($templates).indexOf($a) + 1;
        sparkEventName += `:${templateIndex}`;
      }
      // Button in the FAQ
    } else if ($tutorialContainer) {
      const videoName = textToName($a.querySelector('h3').textContent.trim());
      adobeEventName = `${adobeEventName}tutorials:${videoName}:tutorialPressed`;
      sparkEventName = 'landing:tutorialPressed';
    } else if ($chooseYourPathContainer) {
      const $slideTitle = $a.querySelector('.choose-your-path-slide-title');
      const slideName = $slideTitle ? textToName($slideTitle.textContent.trim()) : 'slide';

      adobeEventName = `${adobeEventName}chooseYourPath:${slideName}:slidePressed`;
      sparkEventName = 'landing:chooseYourPathSlidePressed';
    } else if ($contentToggleContainer) {
      const toggleName = textToName($a.textContent.trim());
      adobeEventName = `${adobeEventName}contentToggle:${toggleName}:buttonPressed`;
      sparkEventName = 'landing:contentToggleButtonPressed';
    } else if ($a.classList.contains('floating-button-lottie')) {
      adobeEventName = `${adobeEventName}floatingButton:scrollPressed`;
      sparkEventName = 'landing:floatingButtonScrollPressed';
    } else if ($a.classList.contains('video-player-inline-player-overlay')) {
      const sessionName = $a.parentNode.parentNode.parentNode.querySelector('.video-player-session-number').textContent.trim();
      const videoName = $a.parentNode.parentNode.parentNode.querySelector('.video-player-video-title').textContent.trim();
      adobeEventName = `${adobeEventName}playing:${sessionName}-${videoName}`;
      sparkEventName = `playing:${sessionName}-${videoName}`;
    } else if ($a.classList.contains('notch')) {
      adobeEventName = `${adobeEventName}splitAction:notch`;
      sparkEventName = 'landing:splitActionNotch';
    } else if ($a.classList.contains('underlay')) {
      adobeEventName = `${adobeEventName}splitAction:background`;
      sparkEventName = 'landing:splitActionBackground';
    } else if ($a.parentElement.classList.contains('floating-button')) {
      adobeEventName = `${adobeEventName}floatingButton:ctaPressed`;
      sparkEventName = 'landing:floatingButtonPressed';
    } else if ($a.closest('.faq')) {
      adobeEventName = appendLinkText(`${adobeEventName}faq:`, $a);
      sparkEventName = 'landing:faqPressed';
      // CTA in the hero
    } else if ($a.closest('.hero')) {
      adobeEventName = appendLinkText(`${adobeEventName}hero:`, $a);
      sparkEventName = 'landing:ctaPressed';
      // Click in the pricing block
    } else if (sparkLandingPageType === 'express-your-fandom') {
      adobeEventName = appendLinkText(`${adobeEventName}${sparkLandingPageType}:`, $a);
      sparkEventName = 'landing:ctaPressed';
    } else if (sparkLandingPageType === 'express-your-brand') {
      adobeEventName = appendLinkText(`${adobeEventName}learn:${sparkLandingPageType}:`, $a);
      sparkEventName = 'landing:ctaPressed';
    } else if (sparkLandingPageType === 'pricing') {
      // edu link
      if ($a.pathname.includes('/edu')) {
        adobeEventName += 'pricing:education:Click';
        sparkEventName = 'landing:eduSeoPagePressed';
        // business enterprise link
      } else if ($a.pathname.includes('business/enterprise')) {
        adobeEventName += 'pricing:enterprise:Click';
        sparkEventName = 'landing:businessSeoPagePressed';
        // Creative cloud learn more
      } else if ($a.parentElement.id === 'adobe-spark-is-a-part-of-most-creative-cloud-paid-plans-learn-more') {
        adobeEventName += 'pricing:creativeCloud:learnMore';
        sparkEventName = 'landing:creativeCloudLearnMorePressed';
      } else if ($a.id === 'free-trial') {
        adobeEventName += 'pricing:cta:StartForFree';
        sparkEventName = 'landing:ctaPressed';
        sparkButtonId = 'puf:startFreeTrial';
      } else if ($a.id === '3-month-trial') {
        adobeEventName += 'pricing:cta:StartYour3MonthTrial';
        sparkEventName = 'landing:ctaPressed';
        sparkButtonId = 'puf:start3MonthTrial';
        // View plans
      } else {
        adobeEventName = 'adobe.com:express:CTA:pricing:viewPlans:Click';
        sparkEventName = 'landing:ctaPressed';
      }
    // quick actions clicks
    } else if ($a.closest('ccl-quick-action') && $a.classList.contains('upload-your-photo')) {
      // this event is handled at mock-file-input level
      return;
    } else if ($a.href && ($a.href.match(/spark\.adobe\.com\/[a-zA-Z-]*\/?tools/g) || $a.href.match(/express\.adobe\.com\/[a-zA-Z-]*\/?tools/g))) {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'quickAction:ctaPressed';
    } else if ($a.href && ($a.href.match(/spark\.adobe\.com\/[a-zA-Z-]*\/?tools/g) || $a.href.match(/express\.adobe\.com\/[a-zA-Z-]*\/?express-apps\/animate-from-audio/g))) {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'quickAction:ctaPressed';
      // Frictionless Quick Actions clicks
    } else if ($a.closest('ccl-quick-action') && ($a.getAttribute('data-action') === 'Download')) {
      adobeEventName = 'quickAction:downloadPressed';
      sparkEventName = 'quickAction:downloadPressed';
    } else if ($a.closest('ccl-quick-action') && ($a.getAttribute('data-action') === 'Editor')) {
      adobeEventName = 'quickAction:openInEditorPressed';
      sparkEventName = 'quickAction:openInEditorPressed';
    // ToC clicks
    } else if ($a.closest('.toc-container')) {
      if ($a.classList.contains('toc-toggle')) {
        adobeEventName += 'toc:toggle:Click';
        sparkEventName = 'landing:tocTogglePressed';
      } else if ($a.classList.contains('toc-close')) {
        adobeEventName += 'toc:close:Click';
        sparkEventName = 'landing:tocClosePressed';
      } else if ($a.classList.contains('toc-handle')) {
        adobeEventName += 'toc:close:Click:handle';
        sparkEventName = 'landing:tocCloseHandlePressed';
      } else if ($a.classList.contains('toc-wrapper')) {
        adobeEventName += 'toc:close:Click:background';
        sparkEventName = 'landing:tocCloseBackgroundPressed';
      } else {
        adobeEventName = appendLinkText(`${adobeEventName}toc:link:Click:`, $a);
        sparkEventName = 'landing:tocLinkPressed';
      }
    // Default clicks
    } else {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'landing:ctaPressed';
    }

    if (w.location.pathname === '/express/') {
      if ($a.closest('.hero-animation')) {
        sparkButtonId = 'getExpressMain';
      } else if ($a.closest('.make-a-project-item')) {
        sparkButtonId = 'useCase';
      } else if ($a.closest('.floating-button')) {
        sparkButtonId = 'getExpressFloating';
      } else if ($a.closest('.banner')) {
        sparkButtonId = 'startForFree';
      } else if ($a.closest('.columns')) {
        sparkButtonId = 'browseAllTemplates';
      } else if ($a.closest('.card-free')) {
        sparkButtonId = 'getExpressFreePlan';
      } else if ($a.closest('.card-premium')) {
        if ($a.classList.contains('primary')) {
          sparkButtonId = 'getExpressPremiumPlan';
        } else {
          sparkButtonId = 'seePlansAndPricing';
        }
      }
    }

    // Button ID script.
    if (!sparkButtonId) {
      let index;

      const $buttonBlock = $a.closest('[data-block-name]');

      if ($buttonBlock && $buttonBlock.dataset.blockName) {
        const $blockSiblings = d.querySelectorAll(`[data-block-name="${$buttonBlock.dataset.blockName}"]`);
        const blockIndex = Array.prototype.indexOf.call($blockSiblings, $buttonBlock) + 1;
        const $siblings = $buttonBlock.querySelectorAll(`${$a.tagName}`);

        sparkButtonId = `${$buttonBlock.dataset.blockName} ${blockIndex} | `;
        index = `| ${Array.prototype.indexOf.call($siblings, $a) + 1}`;
      } else {
        sparkButtonId = 'main | ';
        index = '';
      }

      sparkButtonId = `${sparkButtonId}${textToName($a.innerText.trim())} ${index}`;
    }

    if (useAlloy) {
      _satellite.track('event', {
        xdm: {},
        data: {
          eventType: 'web.webinteraction.linkClicks',
          web: {
            webInteraction: {
              name: adobeEventName,
              linkClicks: {
                value: 1,
              },
              type: 'other',
            },
          },
          _adobe_corpnew: {
            digitalData: {
              primaryEvent: {
                eventInfo: {
                  eventName: adobeEventName,
                },
              },
              spark: {
                eventData: {
                  eventName: sparkEventName,
                  trigger: sparkTouchpoint,
                  buttonId: sparkButtonId || '',
                  sendTimestamp: new Date().getTime(),
                },
              },
            },
          },
        },
      });
    } else {
      digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
      digitalData._set('spark.eventData.eventName', sparkEventName);

      if (sparkButtonId) {
        digitalData._set('spark.eventData.buttonId', sparkButtonId);
      }

      _satellite.track('event', {
        digitalData: digitalData._snapshot(),
      });

      digitalData._delete('primaryEvent.eventInfo.eventName');
      digitalData._delete('spark.eventData.eventName');
    }
  }

  // Frictionless Quick Actions tracking events

  function sendEventToAdobeAnaltics(eventName) {
    if (useAlloy) {
      _satellite.track('event', {
        xdm: {},
        data: {
          eventType: 'web.webinteraction.linkClicks',
          web: {
            webInteraction: {
              name: eventName,
              linkClicks: {
                value: 1,
              },
              type: 'other',
            },
          },
          _adobe_corpnew: {
            digitalData: {
              primaryEvent: {
                eventInfo: {
                  eventName,
                },
              },
              spark: {
                eventData: {
                  eventName,
                  sendTimestamp: new Date().getTime(),
                },
              },
            },
          },
        },
      });
    }
  }

  function handleQuickActionEvents(el) {
    let frictionLessQuctionActionsTrackingEnabled = false;
    sendEventToAdobeAnaltics('quickAction:uploadPageViewed');
    el[0].addEventListener('ccl-quick-action-complete', () => {
      if (frictionLessQuctionActionsTrackingEnabled) {
        return;
      }
      sendEventToAdobeAnaltics('quickAction:assetUploaded');
      sendEventToAdobeAnaltics('project:editorDisplayed');
      const $links = d.querySelectorAll('ccl-quick-action a');
      // for tracking all of the links
      $links.forEach(($a) => {
        $a.addEventListener('click', () => {
          trackButtonClick($a);
        });
      });
      frictionLessQuctionActionsTrackingEnabled = true;
    });
  }

  const cclQuickAction = d.getElementsByTagName('ccl-quick-action');
  if (cclQuickAction.length) {
    handleQuickActionEvents(cclQuickAction);
  } else {
    d.addEventListener('ccl-quick-action-rendered', (e) => {
      if (e.target.tagName === 'CCL-QUICK-ACTION') {
        handleQuickActionEvents(d.getElementsByTagName('ccl-quick-action'));
      }
    });
  }

  d.addEventListener('click', (e) => {
    if (e.target.id === 'mock-file-input') {
      sendEventToAdobeAnaltics('adobe.com:express:cta:uploadYourPhoto');
    }
  });

  function trackVideoAnalytics($video, parameters) {
    const {
      videoName,
      videoId,
      videoLength,
      product,
      videoCategory,
      videoDescription,
      videoPlayer,
      videoMediaType,
    } = parameters;

    set('video.videoInfo.videoName', videoName);
    set('video.videoInfo.videoId', videoId);
    set('video.videoInfo.videoLength', videoLength);
    set('video.videoInfo.product', product);
    set('video.videoInfo.videoCategory', videoCategory);
    set('video.videoInfo.videoDescription', videoDescription);
    set('video.videoInfo.videoPlayer', videoPlayer);
    set('video.videoInfo.videoMediaType', videoMediaType);
  }

  function decorateAnalyticsEvents() {
    const $links = d.querySelectorAll('main a');

    // for adding branch parameters to branch links
    trackBranchParameters($links);

    // for tracking all of the links
    d.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') {
        trackButtonClick(event.target);
      }
    });

    // for tracking the faq
    d.querySelectorAll('main .faq-accordion').forEach(($a) => {
      $a.addEventListener('click', () => {
        trackButtonClick($a);
      });
    });

    // for tracking the content toggle buttons
    d.querySelectorAll('main .content-toggle button').forEach(($button) => {
      $button.addEventListener('click', () => {
        trackButtonClick($button);
      });
    });

    // for tracking the choose your path links
    d.querySelectorAll('main .choose-your-path div.choose-your-path-slide').forEach(($slide) => {
      $slide.addEventListener('click', () => {
        trackButtonClick($slide);
      });
    });

    // for tracking split action block notch and underlay background
    document.addEventListener('splitactionloaded', () => {
      const $notch = d.querySelector('main .split-action-container .notch');
      const $underlay = d.querySelector('main .split-action-container .underlay');

      if ($notch) {
        $notch.addEventListener('click', () => {
          trackButtonClick($notch);
        });
      }

      if ($underlay) {
        $underlay.addEventListener('click', () => {
          trackButtonClick($underlay);
        });
      }
    });

    // for tracking just the sticky banner close button
    const $button = d.querySelector('.sticky-promo-bar button.close');
    if ($button) {
      $button.addEventListener('click', () => {
        const adobeEventName = 'adobe.com:express:cta:startYourFreeTrial:close';
        const sparkEventName = adobeEventName;

        if (useAlloy) {
          _satellite.track('event', {
            xdm: {},
            data: {
              eventType: 'web.webinteraction.linkClicks',
              web: {
                webInteraction: {
                  name: adobeEventName,
                  linkClicks: {
                    value: 1,
                  },
                  type: 'other',
                },
              },
              _adobe_corpnew: {
                digitalData: {
                  primaryEvent: {
                    eventInfo: {
                      eventName: adobeEventName,
                    },
                  },
                  spark: {
                    eventData: {
                      eventName: sparkEventName,
                      sendTimestamp: new Date().getTime(),
                    },
                  },
                },
              },
            },
          });
        } else {
          digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
          digitalData._set('spark.eventData.eventName', sparkEventName);

          _satellite.track('event', {
            digitalData: digitalData._snapshot(),
          });

          digitalData._delete('primaryEvent.eventInfo.eventName');
          digitalData._delete('spark.eventData.eventName');
        }
      });
    }

    // for tracking just the commitment type dropdown on the pricing block
    const $pricingDropdown = d.querySelector('.pricing-plan-dropdown');
    if ($pricingDropdown) {
      $pricingDropdown.addEventListener('change', () => {
        const adobeEventName = 'adobe.com:express:pricing:commitmentType:selected';
        const sparkEventName = 'pricing:commitmentTypeSelected';

        if (useAlloy) {
          _satellite.track('event', {
            xdm: {},
            data: {
              eventType: 'web.webinteraction.linkClicks',
              web: {
                webInteraction: {
                  name: adobeEventName,
                  linkClicks: {
                    value: 1,
                  },
                  type: 'other',
                },
              },
              _adobe_corpnew: {
                digitalData: {
                  primaryEvent: {
                    eventInfo: {
                      eventName: adobeEventName,
                    },
                  },
                  spark: {
                    eventData: {
                      eventName: sparkEventName,
                      sendTimestamp: new Date().getTime(),
                    },
                  },
                },
              },
            },
          });
        } else {
          digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
          digitalData._set('spark.eventData.eventName', sparkEventName);

          _satellite.track('event', {
            digitalData: digitalData._snapshot(),
          });

          digitalData._delete('primaryEvent.eventInfo.eventName');
          digitalData._delete('spark.eventData.eventName');
        }
      });
    }

    // Tracking any video column blocks.
    const $columnVideos = document.querySelectorAll('.column-video');
    if ($columnVideos.length) {
      $columnVideos.forEach(($columnVideo) => {
        const $parent = $columnVideo.closest('.columns');
        const $a = $columnVideo.querySelector('a');

        const adobeEventName = appendLinkText(`adobe.com:express:cta:learn:columns:${sparkLandingPageType}:`, $a);
        const sparkEventName = 'landing:columnsPressed';

        $parent.addEventListener('click', (e) => {
          e.stopPropagation();

          if (useAlloy) {
            _satellite.track('event', {
              xdm: {},
              data: {
                eventType: 'web.webinteraction.linkClicks',
                web: {
                  webInteraction: {
                    name: adobeEventName,
                    linkClicks: {
                      value: 1,
                    },
                    type: 'other',
                  },
                },
                _adobe_corpnew: {
                  digitalData: {
                    primaryEvent: {
                      eventInfo: {
                        eventName: adobeEventName,
                      },
                    },
                    spark: {
                      eventData: {
                        eventName: sparkEventName,
                        sendTimestamp: new Date().getTime(),
                      },
                    },
                  },
                },
              },
            });
          } else {
            digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
            digitalData._set('spark.eventData.eventName', sparkEventName);

            _satellite.track('event', {
              digitalData: digitalData._snapshot(),
            });

            digitalData._delete('primaryEvent.eventInfo.eventName');
            digitalData._delete('spark.eventData.eventName');
          }
        });
      });
    }

    // Tracking any link or links that is added after page loaded.
    document.addEventListener('linkspopulated', async (e) => {
      await trackBranchParameters(e.detail);
      e.detail.forEach(($link) => {
        $link.addEventListener('click', () => {
          trackButtonClick($link);
        });
      });
    });

    document.addEventListener('pricingdropdown', (e) => {
      const plan = e.detail;

      const adobeEventName = 'adobe.com:express:pricing:bundleType:selected';
      const sparkEventName = 'pricing:bundleTypeSelected';

      if (useAlloy) {
        _satellite.track('event', {
          xdm: {},
          data: {
            eventType: 'web.webinteraction.linkClicks',
            web: {
              webInteraction: {
                name: adobeEventName,
                linkClicks: {
                  value: 1,
                },
                type: 'other',
              },
            },
            _adobe_corpnew: {
              digitalData: {
                primaryEvent: {
                  eventInfo: {
                    eventName: adobeEventName,
                  },
                },
                spark: {
                  eventData: {
                    eventName: sparkEventName,
                    contextualData6: `bundleType:${plan.bundleType}`,
                    contextualData7: `currencyCode:${plan.currency}`,
                    contextualData9: `offerId:${plan.offerId}`,
                    contextualData10: `price:${plan.price}`,
                    contextualData12: `productName:${plan.name} - ${plan.frequency}`,
                    contextualData14: 'quantity:1',
                    trigger: sparkTouchpoint,
                    sendTimestamp: new Date().getTime(),
                  },
                },
              },
            },
          },
        });
      } else {
        /* eslint-disable no-underscore-dangle */
        digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
        digitalData._set('spark.eventData.eventName', sparkEventName);
        digitalData._set('spark.eventData.contextualData6', `bundleType:${plan.bundleType}`);
        digitalData._set('spark.eventData.contextualData7', `currencyCode:${plan.currency}`);
        digitalData._set('spark.eventData.contextualData9', `offerId:${plan.offerId}`);
        digitalData._set('spark.eventData.contextualData10', `price:${plan.price}`);
        digitalData._set('spark.eventData.contextualData12', `productName:${plan.name} - ${plan.frequency}`);
        digitalData._set('spark.eventData.contextualData14', 'quantity:1');
        digitalData._set('spark.eventData.trigger', sparkTouchpoint);

        _satellite.track('event', {
          digitalData: digitalData._snapshot(),
        });

        digitalData._delete('primaryEvent.eventInfo.eventName');
        digitalData._delete('spark.eventData.eventName');
        digitalData._delete('spark.eventData.contextualData6');
        digitalData._delete('spark.eventData.contextualData7');
        digitalData._delete('spark.eventData.contextualData9');
        digitalData._delete('spark.eventData.contextualData10');
        digitalData._delete('spark.eventData.contextualData12');
        digitalData._delete('spark.eventData.contextualData14');
      }
    });

    // tracking videos loaded asynchronously.
    document.addEventListener('videoloaded', (e) => {
      trackVideoAnalytics(e.detail.video, e.detail.parameters);
      _satellite.track('videoloaded');
    });

    document.addEventListener('videoclosed', (e) => {
      const adobeEventName = `adobe.com:express:cta:learn:columns:${e.detail.parameters.videoId}:videoClosed`;
      const sparkEventName = 'landing:videoClosed';

      if (useAlloy) {
        _satellite.track('event', {
          xdm: {},
          data: {
            eventType: 'web.webinteraction.linkClicks',
            web: {
              webInteraction: {
                name: adobeEventName,
                linkClicks: {
                  value: 1,
                },
                type: 'other',
              },
            },
            _adobe_corpnew: {
              digitalData: {
                primaryEvent: {
                  eventInfo: {
                    eventName: adobeEventName,
                  },
                },
                spark: {
                  eventData: {
                    eventName: sparkEventName,
                    sendTimestamp: new Date().getTime(),
                  },
                },
              },
            },
          },
        });
      } else {
        digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
        digitalData._set('spark.eventData.eventName', sparkEventName);

        _satellite.track('event', {
          digitalData: digitalData._snapshot(),
        });

        digitalData._delete('primaryEvent.eventInfo.eventName');
        digitalData._delete('spark.eventData.eventName');
      }
    });
  }

  const processed = {};
  function initHemingway() {
    // poll the dataLayer every 2 seconds
    setInterval(() => {
      // loop through each of the events in the dataLayer
      window.dataLayer.forEach((evt) => {
        // don't continue if it has already been processed
        if (processed[evt.assetId]) {
          return;
        }
        // mark as processed
        processed[evt.assetId] = 1;
        // track a new event
        if (useAlloy) {
          _satellite.track('event', {
            data: {
              eventType: 'web.webinteraction.linkClicks',
              web: {
                webInteraction: {
                  name: 'assetView',
                  linkClicks: {
                    value: 1,
                  },
                  type: 'other',
                },
              },
              _adobe_corpnew: {
                digitalData: {
                  primaryEvent: {
                    eventInfo: {
                      eventName: 'assetView',
                    },
                  },
                  spark: {
                    eventData: {
                      eventName: 'assetView',
                      sendTimestamp: Date.now(),
                    },
                  },
                  hemingway: {
                    assetId: evt.assetId,
                    assetPath: evt.assetPath,
                  },
                },
              },
            },
          });
        }
      });
    }, 2000);
  }

  decorateAnalyticsEvents();
  initHemingway();

  const ENABLE_PRICING_MODAL_AUDIENCE = 'enablePricingModal';
  const RETURNING_VISITOR_SEGMENT_ID = 23153796;

  const QUICK_ACTION_SEGMENTS = [
    [24241150, 'enableRemoveBackgroundRating'],
    [24793469, 'enableConvertToGifRating'],
    [24793470, 'enableConvertToJpgRating'],
    [24793471, 'enableConvertToMp4Rating'],
    [24793472, 'enableConvertToPngRating'],
    [24793473, 'enableConvertToSvgRating'],
    [24793474, 'enableCropImageRating'],
    [24793475, 'enableCropVideoRating'],
    [24793476, 'enableLogoMakerRating'],
    [24793477, 'enableMergeVideoRating'],
    [24793478, 'enableQrGeneratorRating'],
    [24793479, 'enableResizeImageRating'],
    [24793480, 'enableChangeSpeedRating'],
    [24793481, 'enableTrimVideoRating'],
    [24793483, 'enableResizeVideoRating'],
    [24793488, 'enableReverseVideoRating'],
  ];

  BlockMediator.set('audiences', []);
  BlockMediator.set('segments', []);

  function getAudiences() {
    const getSegments = (ecid) => {
      if (ecid) {
        w.setAudienceManagerSegments = (json) => {
          if (json && json.segments && json.segments.includes(RETURNING_VISITOR_SEGMENT_ID)) {
            const audiences = BlockMediator.get('audiences');
            const segments = BlockMediator.get('segments');
            audiences.push(ENABLE_PRICING_MODAL_AUDIENCE);
            segments.push(RETURNING_VISITOR_SEGMENT_ID);

            if (useAlloy) {
              _satellite.track('event', {
                xdm: {},
                data: {
                  eventType: 'web.webinteraction.linkClicks',
                  web: {
                    webInteraction: {
                      name: 'pricingModalUserInSegment',
                      linkClicks: {
                        value: 1,
                      },
                      type: 'other',
                    },
                  },
                  _adobe_corpnew: {
                    digitalData: {
                      primaryEvent: {
                        eventInfo: {
                          eventName: 'pricingModalUserInSegment',
                        },
                      },
                      spark: {
                        eventData: {
                          eventName: 'pricingModalUserInSegment',
                          sendTimestamp: new Date().getTime(),
                        },
                      },
                    },
                  },
                },
              });
            } else {
              digitalData._set('primaryEvent.eventInfo.eventName', 'pricingModalUserInSegment');
              digitalData._set('spark.eventData.eventName', 'pricingModalUserInSegment');

              _satellite.track('event', {
                digitalData: digitalData._snapshot(),
              });

              digitalData._delete('primaryEvent.eventInfo.eventName');
              digitalData._delete('spark.eventData.eventName');
            }
          }

          QUICK_ACTION_SEGMENTS.forEach((QUICK_ACTION_SEGMENT) => {
            if (json && json.segments && json.segments.includes(QUICK_ACTION_SEGMENT[0])) {
              const audiences = BlockMediator.get('audiences');
              const segments = BlockMediator.get('segments');
              audiences.push(QUICK_ACTION_SEGMENT[1]);
              segments.push(QUICK_ACTION_SEGMENT[0]);
            }
          });

          document.dispatchEvent(new Event('context_loaded'));
        };
        // TODO: What the heck is this?  This needs to be behind one trust and cmp
        loadScript(`https://adobe.demdex.net/event?d_dst=1&d_rtbd=json&d_cb=setAudienceManagerSegments&d_cts=2&d_mid=${ecid}`);
      }
    };

    if (useAlloy) {
      alloy('getIdentity')
        .then((data) => getSegments(data && data.identity ? data.identity.ECID : null));
    } else {
      const visitorId = _satellite.getVisitorId ? _satellite.getVisitorId() : null;
      getSegments(
        visitorId ? visitorId.getMarketingCloudVisitorID() : null,
      );
    }
  }

  __satelliteLoadedCallback(getAudiences);
});
