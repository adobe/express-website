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
/* global window document digitalData _satellite fetch */

import {
  loadScript,
  getLocale,
  createTag,
  getLanguage,
} from './scripts.js';

// this saves on file size when this file gets minified...
const w = window;
const d = document;
const loc = w.location;
const { pathname } = loc;

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

  const locale = getLocale(w.location);
  const pathSegments = pathname.substr(1).split('/');
  if (locale !== 'us') pathSegments.shift();
  const pageName = `adobe.com:${pathSegments.join(':')}`;

  const language = getLanguage(getLocale(window.location));
  const langSplits = language.split('-');
  langSplits.pop();

  const htmlLang = langSplits.join('-');

  document.documentElement.setAttribute('lang', htmlLang);

  let category;
  if (
    pathname.includes('/create/')
    || pathname.includes('/feature/')
  ) {
    category = 'design';
    if (pathname.includes('/image')) category = 'photo';
    if (pathname.includes('/video')) category = 'video';
  }
  let sparkLandingPageType;
  // seo
  if (
    pathname.includes('/create/')
    || pathname.includes('/make/')
    || pathname.includes('/feature/')
    || pathname.includes('/discover/')
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
  const sparkUserType = 'knownNotAuth'; // (w.adobeIMS && w.adobeIMS.isUserAuthenticated()) ? '' : '';
  const url = new URL(loc.href);
  const sparkTouchpoint = url.searchParams.get('touchpointName');

  //------------------------------------------------------------------------------------
  // set some global and persistent data layer properties
  //------------------------------------------------------------------------------------

  w.adobeid = {
    client_id: 'spark-helix',
    scope: 'AdobeID,openid',
    locale: language,
  };

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
  // TODO: I don't know how to capture this
  // eslint-disable-next-line no-underscore-dangle
  // digitalData._set('spark.eventData.deviceLanguage', language);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.pagename', pageName);
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.platformName', 'web');
  // eslint-disable-next-line no-underscore-dangle
  digitalData._set('spark.eventData.contextualData3', `category:${category}`);

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

  // Fire the landing:viewedPage event
  if (
    sparkLandingPageType === 'seo'
    || sparkLandingPageType === 'pricing'
    || sparkLandingPageType === 'edu'
  ) {
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', 'landing:viewedPage');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.eventName', 'landing:viewedPage');

    _satellite.track('event', {
      // eslint-disable-next-line no-underscore-dangle
      digitalData: digitalData._snapshot(),
    });

  // Fire the blog:viewedPage event
  } else if (
    sparkLandingPageType === 'blog'
  ) {
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', 'blog:viewedPage');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.eventName', 'blog:viewedPage');

    _satellite.track('event', {
      // eslint-disable-next-line no-underscore-dangle
      digitalData: digitalData._snapshot(),
    });

  // Fire the displayPurchasePanel event
  } else if (
    sparkLandingPageType === 'pricing'
    && sparkTouchpoint
  ) {
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', 'displayPurchasePanel');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.eventName', 'displayPurchasePanel');
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('spark.eventData.trigger', sparkTouchpoint);

    _satellite.track('event', {
      // eslint-disable-next-line no-underscore-dangle
      digitalData: digitalData._snapshot(),
    });
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
        adobeEventName = 'pricing:viewPlans:Click';
        sparkEventName = 'landing:viewPlansPressed';
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
    d.querySelectorAll('main a').forEach(($a) => {
      $a.addEventListener('click', () => {
        trackButtonClick($a);
      });
    });
  }

  // function pollForPricingBlock() {
  //   const pollingTimer = setTimeout(() => {
  //     const $plansBlock = d.querySelector('.pricing-plans');

  //     if ($plansBlock) {
  //       decorateAnalyticsEvents();
  //     } else {
  //       pollForPricingBlock();
  //     }
  //   }, 300);

  //   // make sure we don't poll forever
  //   setTimeout(() => {
  //     clearTimeout(pollingTimer);
  //   }, 4000);
  // }

  // if (sparkLandingPageType === 'pricing') {
  //   pollForPricingBlock();
  // } else {
  //   decorateAnalyticsEvents();
  // }
  decorateAnalyticsEvents();
});

async function showRegionPicker() {
  const $body = document.body;
  const $regionPicker = createTag('div', { id: 'region-picker' });
  $body.appendChild($regionPicker);
  const locale = getLocale(window.location);
  const regionpath = locale === 'us' ? '/' : `/${locale}/`;
  const host = window.location.hostname === 'localhost' ? 'https://www.adobe.com' : '';
  const url = `${host}${regionpath}`;
  const resp = await fetch(url);
  const html = await resp.text();
  const $div = createTag('div');
  $div.innerHTML = html;
  const $regionNav = $div.querySelector('nav.language-Navigation');
  $regionPicker.appendChild($regionNav);
  $regionPicker.addEventListener('click', (event) => {
    if (event.target === $regionPicker || event.target === $regionNav) {
      $regionPicker.remove();
    }
  });
  $regionPicker.querySelectorAll('li a').forEach(($a) => {
    $a.addEventListener('click', (event) => {
      const pathSplits = new URL($a.href).pathname.split('/');
      const prefix = pathSplits[1] ? `/${pathSplits[1]}` : '';
      const destLocale = pathSplits[1] ? `${pathSplits[1]}` : 'us';
      const off = locale !== 'us' ? locale.length + 1 : 0;
      const gPath = window.location.pathname.substr(off);

      let domain = '';
      if (window.location.hostname.endsWith('.adobe.com')) domain = ' domain=adobe.com;';
      const cookieValue = `international=${destLocale};${domain} path=/`;
      // eslint-disable-next-line no-console
      console.log(`setting international based on language switch to: ${cookieValue}`);
      document.cookie = cookieValue;
      event.preventDefault();
      window.location.href = prefix + gPath;
    });
  });
}

loadScript('https://www.adobe.com/etc/beagle/public/globalnav/adobe-privacy/latest/privacy.min.js');

const locale = getLocale(window.location);

window.fedsConfig = {
  ...window.fedsConfig,

  footer: {
    regionModal: () => {
      showRegionPicker();
    },
  },
  locale,
  content: {
    experience: 'cc-express/spark-gnav',
  },
  profile: {
    customSignIn: () => {
      const sparkLang = getLanguage(getLocale(window.location));
      const sparkPrefix = sparkLang === 'en-US' ? '' : `/${sparkLang}`;
      window.location.href = `https://spark.adobe.com${sparkPrefix}/sp/`;
    },
  },
};

loadScript('https://www.adobe.com/etc.clientlibs/globalnav/clientlibs/base/feds.js', () => {
  setTimeout(() => {
    /* attempt to switch link */
    if (window.location.pathname.includes('/create/') || window.location.pathname.includes('/discover/')) {
      const $aNav = document.querySelector('header a.feds-navLink--primaryCta');
      const $aHero = document.querySelector('main .hero a.button.primary');
      if ($aNav && $aHero) {
        $aNav.href = $aHero.href;
      }
    }

    const gnav = document.getElementById('feds-header');
    const placeholder = document.getElementById('header-placeholder');
    gnav.classList.add('appear');
    placeholder.classList.add('disappear');
  }, 500);
}).id = 'feds-script';

loadScript('https://static.adobelogin.com/imslib/imslib.min.js');
