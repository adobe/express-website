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
/* global w document digitalData _satellite */

import { loadScript, getLocale } from './scripts.js';

var 
  // this saves on file size when this file gets minified...
  w = window,
  d = document,
  loc = w.location,
  pathname = loc.pathname;

function handleConsentSettings() {
  try {
    if (!w.adobePrivacy || w.adobePrivacy.hasUserProvidedCustomConsent()) {
      w.sprk_full_consent = false;
      return;
    }
    if (w.adobePrivacy.hasUserProvidedConsent()) {
      w.sprk_full_consent = true;
    } else {
      w.sprk_full_consent = false;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Couldn't determine user consent status:", e);
    w.sprk_full_consent = false;
  }
}

w.addEventListener('adobePrivacy:PrivacyConsent', handleConsentSettings);
w.addEventListener('adobePrivacy:PrivacyReject', handleConsentSettings);
w.addEventListener('adobePrivacy:PrivacyCustom', handleConsentSettings);
w.fedsConfig = w.fedsConfig || {};
w.fedsConfig.privacy = w.fedsConfig.privacy || {};
w.fedsConfig.privacy.otDomainId = '7a5eb705-95ed-4cc4-a11d-0cc5760e93db';
w.fedsConfig.privacy.footerLinkSelector = '#openCookieModal';
w.marketingtech = {
  adobe: {
    launch: {
      property: 'global',
      environment: 'production',
    },
    analytics: {
      // TODO: Switch these before go live.
      // additionalAccounts: 'adbemmarvelweb.prod',
      additionalAccounts: 'adbemmarvelweb.rebootdev2',
    },
    target: true,
  },
};
w.targetGlobalSettings = {
  bodyHidingEnabled: false,
};

loadScript('https://www.adobe.com/marketingtech/main.min.js', () => {

  //------------------------------------------------------------------------------------
  // gathering the data
  //------------------------------------------------------------------------------------

  let locale = getLocale(w.location);
  let pathSegments = pathname.substr(1).split('/');
  if (locale !== 'en') pathSegments.shift();
  let pageName = `adobe.com:${pathSegments.join(':')}`;
  let langs = {
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    da: 'da-DK',
    es: 'es-ES',
    fi: 'fi-FI',
    jp: 'ja-JP',
    kr: 'ko-KR',
    no: 'nb-NO',
    nl: 'nl-NL',
    br: 'pt-BR',
    se: 'sv-SE',
    tw: 'zh-Hant-TW',
    cn: 'zh-Hans-CN',
  };

  let language = langs[locale];
  let category;
  if (
    pathname.includes('/create/') || 
    pathname.includes('/feature/')
  ) {
    category = 'design';
    if (pathname.includes('/photo')) category = 'photo';
    if (pathname.includes('/video')) category = 'video';
  }
  let sparkLandingPageType;
  // seo
  if (
    pathname.includes('/create/') || 
    pathname.includes('/make/') || 
    pathname.includes('/feature/') || 
    pathname.includes('/discover/')
  ) {
    sparkLandingPageType = 'seo';
  // blog
  } else if (
    pathname.includes('/learn/blog/')
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
  }
  let sparkUserType = 'knownNotAuth'; // (w.adobeIMS && w.adobeIMS.isUserAuthenticated()) ? '' : '';
  let url = new URL(loc.href);
  let sparkTouchpoint = url.searchParams.get('touchpointName');
  

  
  //------------------------------------------------------------------------------------
  // set some global and persistent data layer properties
  //------------------------------------------------------------------------------------

  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('page.pageInfo.pageName', pageName);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('page.pageInfo.language', language);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('page.pageInfo.siteSection', 'adobe.com:express');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('page.pageInfo.category', category);

  //------------------------------------------------------------------------------------
  // spark specific global and persistent data layer properties
  //------------------------------------------------------------------------------------
  
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('page.pageInfo.pageurl', loc.href);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('page.pageInfo.namespace', 'express');

  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.pageurl', loc.href);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.pageReferrer', d.referrer);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.pageTitle', d.title);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.landingPageType', sparkLandingPageType);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.landingPageReferrer', d.referrer);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.landingPageUrl', loc.href);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.userType', sparkUserType);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.premiumEntitled', '');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.displayedLanguage', language);
  // eslint-disable-next-line no-underscore-dangle
  // digitalData._set('spark.eventData.deviceLanguage', language); // NOTE: I don't know how to capture this
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.pagename', pageName);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.platformName', 'web');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.contextualData3', 'category:' + category);
  

  //------------------------------------------------------------------------------------
  // Fire the viewedPage event
  //------------------------------------------------------------------------------------

  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('primaryEvent.eventInfo.eventName', 'viewedPage');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.eventName', 'viewedPage');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.sendTimestamp', new Date().getTime());

  // eslint-disable-next-line no-underscore-dangle
  _satellite.track('event', { digitalData: digitalData._snapshot() });

  //------------------------------------------------------------------------------------
  // Fire the landing:viewedPage event
  //------------------------------------------------------------------------------------

  if (
    sparkLandingPageType === 'seo' || 
    sparkLandingPageType === 'pricing' || 
    sparkLandingPageType === 'edu'
  ) {

    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', 'landing:viewedPage');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.eventName', 'landing:viewedPage');

    // eslint-disable-next-line no-underscore-dangle
    _satellite.track('event', { digitalData: digitalData._snapshot() });

  } else if (
    sparkLandingPageType === 'blog'
  ) {

    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', 'blog:viewedPage');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.eventName', 'blog:viewedPage');

    // eslint-disable-next-line no-underscore-dangle
    _satellite.track('event', { digitalData: digitalData._snapshot() });

  } else if (
    sparkLandingPageType === 'pricing' && 
    sparkTouchpoint
  ) {

    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', 'displayPurchasePanel');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.eventName', 'displayPurchasePanel');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.trigger', sparkTouchpoint);

    // eslint-disable-next-line no-underscore-dangle
    _satellite.track('event', { digitalData: digitalData._snapshot() });

  }
  
  // eslint-disable-next-line no-underscore-dangle
  digitalData._delete('primaryEvent.eventInfo.eventName');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._delete('spark.eventData.eventName');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._delete('spark.eventData.sendTimestamp');

  

  function textToName(text) {
    const splits = text.toLowerCase().split(' ');
    const camelCase = splits.map((s, i) => (i ? s.charAt(0).toUpperCase() + s.substr(1) : s)).join('');
    return (camelCase);
  }

  function appendLinkText(eventName, $a) {
    let
      $img,
      alt;

    if ($a.textContent) {
      eventName += textToName($a.textContent);
    } else {
      if (
        ($img = $a.querySelector('img')) && 
        (alt = $img.getAttribute('alt'))
      ) {
        eventName += textToName(alt);
      }
    }

    return eventName;
  }

  function trackButtonClick($a) {
    let
      adobeEventName = 'adobe.com:express:cta:',
      sparkEventName,
      
      $templateContainer,
      $cardContainer,
      $img,
      alt,
      cardPosition;

    // Template button click
    if (
      ($templateContainer = $a.closest('.template-list'))
    ) {

      adobeEventName += 'template:';

      // try to get the image alternate text
      if (
        ($cardContainer = $a.closest('.template-list > div')) &&
        ($img = $cardContainer.querySelector('img')) && 
        (alt = $img.getAttribute('alt'))
      ) {
        adobeEventName += textToName(alt);
      } else {
        adobeEventName += 'Click';
      }

      sparkEventName = 'landing:templatePressed';

    // CTA in the hero
    } else if ($a.closest('.hero')) {
      adobeEventName = appendLinkText(adobeEventName + 'hero:', $a);
      sparkEventName = 'landing:ctaPressed';

    // Click in the pricing block
    } else if ($a.closest('.pricing')) {

      // get the position of the card in the plans
      cardPosition = Array.prototype.slice.call(
        document.querySelectorAll('.plan')
      ).indexOf(
        $a.closest('.plan')
      ) + 1;

      // Buy Now
      if ($a.hostname.includes('commerce.adobe.com')) {

        // individual
        if ($a.search.includes('spark.adobe.com')) {
          adobeEventName += 'pricing:individual:'+cardPosition+':buyNow:Click';
        // team
        } else if ($a.search.includes('adminconsole.adobe.com')) {
          adobeEventName += 'pricing:team:'+cardPosition+':buyNow:Click';
        }

        sparkEventName = 'beginPurchaseFlow';

      // anything else
      } else {
        adobeEventName += 'pricing:starter:'+cardPosition+':getStarted:Click';
        sparkEventName = 'pricing:ctaPressed';
      }

      // eslint-disable-next-line no-underscore-dangle
      digitalData._set('spark.eventData.contextualData5', 'cardPosition:' + cardPosition);

    // Click in the pricing block
    } else if (sparkLandingPageType === 'pricing') {

      // edu link
      if (
        $a.pathname.includes('/edu')
      ) {
        adobeEventName += 'pricing:eduLink:Click'
        sparkEventName = 'landing:eduSeoPagePressed';

      // business enterprise link
      } else if (
        $a.pathname.includes('business/enterprise')
      ) {
        adobeEventName += 'pricing:enterpriseLink:Click'
        sparkEventName = 'landing:businessSeoPagePressed';
      
      // all other links
      } else {
        adobeEventName = appendLinkText(adobeEventName, $a);
        sparkEventName = 'pricing:ctaPressed';
      }

    // Default clicks
    } else {
      adobeEventName = appendLinkText(adobeEventName, $a);
      sparkEventName = 'landing:ctaPressed';
    }

    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', adobeEventName);
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.eventName', sparkEventName);


    // eslint-disable-next-line no-underscore-dangle
    _satellite.track('event', { digitalData: digitalData._snapshot() });


    // eslint-disable-next-line no-underscore-dangle
    digitalData._delete('primaryEvent.eventInfo.eventName');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._delete('spark.eventData.eventName');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._delete('spark.eventData.contextualData5');
  }

  function decorateAnalyticsEvents() {
    d.querySelectorAll('main a')
    .forEach(($a) => {
      $a.addEventListener('click', () => {
        trackButtonClick($a);
      });
    });
  }

  function pollForPricingBlock() {
    let
      pollingTimer;

    pollingTimer = setTimeout(() => {
      let 
        $plansBlock = d.querySelector('.pricing-plans');

      if ($plansBlock) {
        decorateAnalyticsEvents();
      } else {
        pollForPricingBlock();
      }

    }, 300);

    // make sure we don't poll forever
    setTimeout(() => {
      clearTimeout(pollingTimer);
    }, 4000);

  }

  if (sparkLandingPageType === 'pricing') {
    pollForPricingBlock();
  } else {
    decorateAnalyticsEvents();
  }

});

loadScript('https://www.adobe.com/etc/beagle/public/globalnav/adobe-privacy/latest/privacy.min.js');


