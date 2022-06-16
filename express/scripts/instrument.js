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
/* global digitalData _satellite __satelliteLoadedCallback */

import {
  loadScript,
  getLocale,
  getLanguage,
  getMetadata,
  checkTesting,
  trackBranchParameters,
// eslint-disable-next-line import/no-unresolved
} from './scripts.js';

// eslint-disable-next-line import/no-unresolved
import Context from './context.js';

// this saves on file size when this file gets minified...
const w = window;
const d = document;
const loc = w.location;
const { pathname } = loc;
const usp = new URLSearchParams(window.location.search);
const martech = usp.get('martech');

let martechURL = 'https://www.adobe.com/marketingtech/main.min.js';
if (window.spark && window.spark.hostname === 'www.stage.adobe.com') {
  martechURL = 'https://www.adobe.com/marketingtech/main.stage.min.js';
}

// alloy feature flag
let useAlloy = false;
if (
  (
    martech === 'alloy'
    && window.spark
    && window.spark.hostname === 'www.stage.adobe.com'
  )
  || martech === 'alloy-qa'
) {
  useAlloy = true;
  martechURL = 'https://www.adobe.com/marketingtech/main.standard.qa.js';
} else if (martech === 'alloy') {
  useAlloy = true;
  martechURL = 'https://www.adobe.com/marketingtech/main.standard.min.js';
}

if (useAlloy) {
  w.marketingtech = {
    adobe: {
      launch: {
        url: 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-2c94beadc94f-development.js',
      },
      alloy: {
        edgeConfigId: (
          (
            (window.spark && window.spark.hostname === 'www.stage.adobe.com')
            || martech === 'alloy-qa'
          )
            ? 'b2e000b1-98ab-4ade-8c4f-5823d84cf015:stage'
            : 'b2e000b1-98ab-4ade-8c4f-5823d84cf015'
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

  const set = (obj, path, value) => {
    const segs = path.split('.');
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
  const langSplits = language.split('-');
  langSplits.pop();

  const htmlLang = langSplits.join('-');

  document.documentElement.setAttribute('lang', htmlLang);

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

  //------------------------------------------------------------------------------------
  // set some global and persistent data layer properties
  //------------------------------------------------------------------------------------

  if (useAlloy) {
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.page.pageInfo.pageName', pageName);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.page.pageInfo.language', language);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.page.pageInfo.siteSection', 'adobe.com:express');
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.page.pageInfo.category', category);
  } else {
    digitalData._set('page.pageInfo.pageName', pageName);
    digitalData._set('page.pageInfo.language', language);
    digitalData._set('page.pageInfo.siteSection', 'adobe.com:express');
    digitalData._set('page.pageInfo.category', category);
  }

  //------------------------------------------------------------------------------------
  // spark specific global and persistent data layer properties
  //------------------------------------------------------------------------------------

  if (useAlloy) {
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.page.pageInfo.pageurl', loc.href);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.page.pageInfo.namespace', 'express');
  } else {
    digitalData._set('page.pageInfo.pageurl', loc.href);
    digitalData._set('page.pageInfo.namespace', 'express');
  }

  /* set experiment and variant information */
  if (window.hlx.experiment) {
    const { experiment } = window.hlx;
    if (useAlloy) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.adobe.experienceCloud.target.info.primarytest.testinfo.campaignid', experiment.id);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.adobe.experienceCloud.target.info.primarytest.testinfo.offerid', experiment.selectedVariant);
    } else {
      digitalData._set('adobe.experienceCloud.target.info.primarytest.testinfo.campaignid', experiment.id);
      digitalData._set('adobe.experienceCloud.target.info.primarytest.testinfo.offerid', experiment.selectedVariant);
    }
  }

  if (useAlloy) {
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.pageurl', loc.href);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.pageReferrer', d.referrer);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.pageTitle', d.title);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.landingPageType', sparkLandingPageType);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.landingPageReferrer', d.referrer);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.landingPageUrl', loc.href);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.userType', sparkUserType);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.premiumEntitled', '');
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.displayedLanguage', language);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.deviceLanguage', navigator.language);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.pagename', pageName);
    set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.platformName', 'web');
    if (category) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData3', `category:${category}`);
    }

    if (pathname.includes('/tools/')) {
      const sparkContextualData = urlPathToName(pathname.split('/').pop());
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', `quickActionType:${sparkContextualData}`);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    }
    if (pathname.includes('/feature/image/resize')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:imageResize');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/crop')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:imageCrop');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/qr-code-generator')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:qrCodeGenerator');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/remove-background')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:removeBackground');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/transparent-background')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:removeBackground');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/jpg-to-png')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToPNG');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/png-to-jpg')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToJPG');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/image/convert/svg')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToSVG');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/trim')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:trimVideo');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/resize')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:resizeVideo');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/crop')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:cropVideo');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/video-to-gif')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToGIF');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/change-speed')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:changeVideoSpeed');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/merge')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:mergeVideo');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/mp4-to-gif')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToGIF');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/mp4')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/gif-to-mp4')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/mov-to-mp4')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/wmv-to-mp4')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/reverse')) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData1', 'quickActionType:reverseVideo');
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.spark.eventData.contextualData2', 'actionLocation:seo');
    }
  } else {
    digitalData._set('spark.eventData.pageurl', loc.href);
    digitalData._set('spark.eventData.pageReferrer', d.referrer);
    digitalData._set('spark.eventData.pageTitle', d.title);
    digitalData._set('spark.eventData.landingPageType', sparkLandingPageType);
    digitalData._set('spark.eventData.landingPageReferrer', d.referrer);
    digitalData._set('spark.eventData.landingPageUrl', loc.href);
    digitalData._set('spark.eventData.userType', sparkUserType);
    digitalData._set('spark.eventData.premiumEntitled', '');
    digitalData._set('spark.eventData.displayedLanguage', language);
    digitalData._set('spark.eventData.deviceLanguage', navigator.language);
    digitalData._set('spark.eventData.pagename', pageName);
    digitalData._set('spark.eventData.platformName', 'web');
    if (category) {
      digitalData._set('spark.eventData.contextualData3', `category:${category}`);
    }

    if (pathname.includes('/tools/')) {
      const sparkContextualData = urlPathToName(pathname.split('/').pop());
      digitalData._set('spark.eventData.contextualData1', `quickActionType:${sparkContextualData}`);
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    }
    if (pathname.includes('/feature/image/resize')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:imageResize');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/crop')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:imageCrop');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/qr-code-generator')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:qrCodeGenerator');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/remove-background')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:removeBackground');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/transparent-background')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:removeBackground');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/jpg-to-png')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToPNG');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/image/png-to-jpg')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToJPG');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/image/convert/svg')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToSVG');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/trim')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:trimVideo');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/resize')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:resizeVideo');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/crop')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:cropVideo');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.includes('/feature/video/video-to-gif')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToGIF');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/change-speed')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:changeVideoSpeed');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/merge')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:mergeVideo');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/mp4-to-gif')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToGIF');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/mp4')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/gif-to-mp4')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/mov-to-mp4')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/convert/wmv-to-mp4')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:convertToMP4');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    } else if (pathname.endsWith('/feature/video/reverse')) {
      digitalData._set('spark.eventData.contextualData1', 'quickActionType:reverseVideo');
      digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
    }
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

    if ($a.textContent) {
      newEventName = eventName + textToName($a.textContent);
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
    // let cardPosition;

    // Template button click
    if ($templateContainer) {
      // This behaviour was moved to the template-list.js
      // This return statement prevents a double binding.
      return;
      // Button in the FAQ
    } else if ($a.classList.contains('floating-button-lottie')) {
      adobeEventName = `${adobeEventName}floatingButton:scrollPressed`;
      sparkEventName = 'landing:floatingButtonScrollPressed';
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
    } else if ($a.href.match(/spark\.adobe\.com\/[a-zA-Z-]*\/?tools/g) || $a.href.match(/express\.adobe\.com\/[a-zA-Z-]*\/?tools/g)) {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'quickAction:ctaPressed';
    // Default clicks
    } else {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'landing:ctaPressed';
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

    if (useAlloy) {
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.videoName', videoName);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.videoId', videoId);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.videoLength', videoLength);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.product', product);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.videoCategory', videoCategory);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.videoDescription', videoDescription);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.videoPlayer', videoPlayer);
      set(w.alloy_all, 'data._adobe_corpnew.digitalData.video.videoInfo.videoMediaType', videoMediaType);
    } else {
      digitalData._set('video.videoInfo.videoName', videoName);
      digitalData._set('video.videoInfo.videoId', videoId);
      digitalData._set('video.videoInfo.videoLength', videoLength);
      digitalData._set('video.videoInfo.product', product);
      digitalData._set('video.videoInfo.videoCategory', videoCategory);
      digitalData._set('video.videoInfo.videoDescription', videoDescription);
      digitalData._set('video.videoInfo.videoPlayer', videoPlayer);
      digitalData._set('video.videoInfo.videoMediaType', videoMediaType);
    }
  }

  function decorateAnalyticsEvents() {
    const $links = d.querySelectorAll('main a');

    // for adding branch parameters to branch links
    trackBranchParameters($links);

    // for tracking all of the links
    $links.forEach(($a) => {
      $a.addEventListener('click', () => {
        trackButtonClick($a);
      });
    });

    // for tracking the faq
    d.querySelectorAll('main .faq-accordion').forEach(($a) => {
      $a.addEventListener('click', () => {
        trackButtonClick($a);
      });
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
    document.addEventListener('linkspopulated', (e) => {
      e.detail.forEach(($link) => {
        $link.addEventListener('click', () => {
          trackButtonClick($link);
        });
      });
    });

    // tracking videos loaded asynchronously.
    document.addEventListener('videoloaded', (e) => {
      trackVideoAnalytics(e.detail.video, e.detail.parameters);
    });

    document.addEventListener('videoclosed', (e) => {
      console.log(e.detail);
      const adobeEventName = `adobe.com:express:cta:learn:columns:${e.detail.parameters.videoId}:videoClosed`;
      const sparkEventName = 'landing:videoClosed';

      digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
      digitalData._set('spark.eventData.eventName', sparkEventName);

      _satellite.track('event', {
        digitalData: digitalData._snapshot(),
      });

      digitalData._delete('primaryEvent.eventInfo.eventName');
      digitalData._delete('spark.eventData.eventName');
    });
  }

  decorateAnalyticsEvents();

  const ENABLE_PRICING_MODAL_AUDIENCE = 'enablePricingModal';
  const ENABLE_RATE_ACTION_AUDIENCE = 'enableRatingAction';
  const RETURNING_VISITOR_SEGMENT_ID = '23153796';
  const USED_ACTION_SEGMENT_ID = 24241150;

  Context.set('audiences', []);
  Context.set('segments', []);

  function getAudiences() {
    const visitorId = _satellite.getVisitorId ? _satellite.getVisitorId() : null;
    const ecid = visitorId ? visitorId.getMarketingCloudVisitorID() : null;

    if (ecid) {
      w.setAudienceManagerSegments = (json) => {
        if (json?.segments?.includes(RETURNING_VISITOR_SEGMENT_ID)) {
          const audiences = Context.get('audiences');
          const segments = Context.get('segments');
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

        if (json?.segments?.includes(USED_ACTION_SEGMENT_ID)) {
          const audiences = Context.get('audiences');
          const segments = Context.get('segments');
          audiences.push(ENABLE_RATE_ACTION_AUDIENCE);
          segments.push(USED_ACTION_SEGMENT_ID);
        }

        document.dispatchEvent(new Event('context_loaded'));
      };

      // TODO: What the heck is this?  This needs to be behind one trust and cmp
      loadScript(`https://adobe.demdex.net/event?d_dst=1&d_rtbd=json&d_cb=setAudienceManagerSegments&d_cts=2&d_mid=${ecid}`);
    }
  }

  __satelliteLoadedCallback(getAudiences);
});
