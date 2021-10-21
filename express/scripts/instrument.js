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
/* global window document navigator digitalData _satellite __satelliteLoadedCallback */

import {
  loadScript,
  getLocale,
  getLanguage,
  getMetadata,
} from './scripts.js';

import Context from './context.js';

// this saves on file size when this file gets minified...
const w = window;
const d = document;
const loc = w.location;
const { pathname } = loc;

w.marketingtech = {
  adobe: {
    launch: {
      property: 'global',
      environment: 'production',
    },
    analytics: {
      additionalAccounts: 'adbemmarvelweb.prod',
    },
    target: true,
  },
};
w.targetGlobalSettings = w.targetGlobalSettings || {};
w.targetGlobalSettings.bodyHidingEnabled = (w.spark.martech === 'rush');

loadScript('https://www.adobe.com/marketingtech/main.min.js', () => {
  /* eslint-disable no-underscore-dangle */

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
    pathname === '/express/learn'
      || (
        pathname.includes('/learn/')
        && !pathname.includes('/blog/')
      )
  ) {
    sparkLandingPageType = 'learn';
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
  } else {
    sparkLandingPageType = 'other';
  }
  const sparkUserType = (w.adobeIMS && w.adobeIMS.isSignedInUser()) ? 'knownNotAuth' : 'unknown';
  const url = new URL(loc.href);
  const sparkTouchpoint = url.searchParams.get('touchpointName');

  //------------------------------------------------------------------------------------
  // set some global and persistent data layer properties
  //------------------------------------------------------------------------------------

  w.adobeid = {
    client_id: 'MarvelWeb3',
    scope: 'AdobeID,openid',
    locale: language,
  };

  digitalData._set('page.pageInfo.pageName', pageName);
  digitalData._set('page.pageInfo.language', language);
  digitalData._set('page.pageInfo.siteSection', 'adobe.com:express');
  digitalData._set('page.pageInfo.category', category);

  //------------------------------------------------------------------------------------
  // spark specific global and persistent data layer properties
  //------------------------------------------------------------------------------------

  digitalData._set('page.pageInfo.pageurl', loc.href);
  digitalData._set('page.pageInfo.namespace', 'express');

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
  // image resize quick action
  if (pathname.includes('/feature/image/resize')) {
    digitalData._set('spark.eventData.contextualData1', 'quickActionType:imageResize');
    digitalData._set('spark.eventData.contextualData2', 'actionLocation:seo');
  } else if (pathname.includes('/feature/image/transparent-background')) {
    digitalData._set('spark.eventData.contextualData1', 'quickActionType:removeBackground');
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

  //------------------------------------------------------------------------------------
  // Fire extra spark events
  //------------------------------------------------------------------------------------

  // Fire the viewedPage event
  digitalData._set('primaryEvent.eventInfo.eventName', 'viewedPage');
  digitalData._set('spark.eventData.eventName', 'viewedPage');
  digitalData._set('spark.eventData.sendTimestamp', new Date().getTime());

  _satellite.track('event', {
    digitalData: digitalData._snapshot(),
  });

  // Fire the landing:viewedPage event
  digitalData._set('primaryEvent.eventInfo.eventName', 'landing:viewedPage');
  digitalData._set('spark.eventData.eventName', 'landing:viewedPage');

  _satellite.track('event', {
    digitalData: digitalData._snapshot(),
  });

  // Fire the displayPurchasePanel event if it is the pricing site
  if (
    sparkLandingPageType === 'pricing'
      && sparkTouchpoint
  ) {
    digitalData._set('primaryEvent.eventInfo.eventName', 'displayPurchasePanel');
    digitalData._set('spark.eventData.eventName', 'displayPurchasePanel');
    digitalData._set('spark.eventData.trigger', sparkTouchpoint);

    _satellite.track('event', {
      digitalData: digitalData._snapshot(),
    });
  }

  digitalData._delete('primaryEvent.eventInfo.eventName');
  digitalData._delete('spark.eventData.eventName');
  digitalData._delete('spark.eventData.sendTimestamp');

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
    const $templateContainer = $a.closest('.template-list');
    let $cardContainer;
    let $img;
    let alt;
    // let cardPosition;

    // Template button click
    if ($templateContainer) {
      adobeEventName += 'template:';

      $cardContainer = $a.closest('.template-list > div');
      $img = $cardContainer && $cardContainer.querySelector('img');
      alt = $img && $img.getAttribute('alt');

      // try to get the image alternate text
      if (alt) {
        adobeEventName += textToName(alt);
      } else {
        adobeEventName += 'Click';
      }

      sparkEventName = 'landing:templatePressed';

      // CTA in the hero
    } else if ($a.closest('.hero')) {
      adobeEventName = appendLinkText(`${adobeEventName}hero:`, $a);
      sparkEventName = 'landing:ctaPressed';

      // Click in the pricing block
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
        // View plans
      } else {
        adobeEventName = 'adobe.com:express:CTA:pricing:viewPlans:Click';
        sparkEventName = 'landing:viewPlansPressed';
      }

      // quick actions clicks
    } else if ($a.href.match(/spark\.adobe\.com\/[a-zA-Z-]*\/?tools/g)) {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'quickAction:ctaPressed';

      // Default clicks
    } else {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'landing:ctaPressed';
    }

    digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
    digitalData._set('spark.eventData.eventName', sparkEventName);

    _satellite.track('event', {
      digitalData: digitalData._snapshot(),
    });

    digitalData._delete('primaryEvent.eventInfo.eventName');
    digitalData._delete('spark.eventData.eventName');
  }

  function decorateAnalyticsEvents() {
    // for tracking all of the links
    d.querySelectorAll('main a').forEach(($a) => {
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

        digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
        digitalData._set('spark.eventData.eventName', sparkEventName);

        _satellite.track('event', {
          digitalData: digitalData._snapshot(),
        });

        digitalData._delete('primaryEvent.eventInfo.eventName');
        digitalData._delete('spark.eventData.eventName');
      });
    }
  }

  decorateAnalyticsEvents();

  const RETURNING_VISITOR_SEGMENT_ID = '23153796';
  const ENABLE_PRICING_MODAL_AUDIENCE = 'enablePricingModal';

  Context.set('audiences', []);

  function getAudiences() {
    const visitorId = _satellite.getVisitorId ? _satellite.getVisitorId() : null;
    const ecid = visitorId ? visitorId.getMarketingCloudVisitorID() : null;

    if (ecid) {
      w.setAudienceManagerSegments = (json) => {
        if (json?.segments?.includes(RETURNING_VISITOR_SEGMENT_ID)) {
          const audiences = Context.get('audiences');
          audiences.push(ENABLE_PRICING_MODAL_AUDIENCE);

          digitalData._set('primaryEvent.eventInfo.eventName', 'pricingModalUserInSegment');
          digitalData._set('spark.eventData.eventName', 'pricingModalUserInSegment');

          _satellite.track('event', {
            digitalData: digitalData._snapshot(),
          });
        }
      };

      loadScript(`https://adobe.demdex.net/event?d_dst=1&d_rtbd=json&d_cb=setAudienceManagerSegments&d_cts=2&d_mid=${ecid}`);
    }
  }

  __satelliteLoadedCallback(getAudiences);
});
