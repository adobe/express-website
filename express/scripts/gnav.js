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
  loadScript,
  getLocale,
  createTag,
  getLanguage,
  getHelixEnv,
  sampleRUM,
  getCookie,
  getMetadata,
  fetchPlaceholders,
// eslint-disable-next-line import/no-unresolved
} from './scripts.js';

import loadGoogleYOLO from './google-yolo.js';

const isHomepage = window.location.pathname.endsWith('/express/');

async function checkRedirect(location, geoLookup) {
  const splits = location.pathname.split('/express/');
  splits[0] = '';
  const prefix = geoLookup && geoLookup !== 'us' ? `/${geoLookup}` : '';

  // remove ?geocheck param
  const params = new URLSearchParams(location.search);
  params.delete('geocheck');
  const queryString = params.toString() ? `?${params.toString()}` : '';

  return `${prefix}${splits.join('/express/')}${queryString}${location.hash}`;
}

async function checkGeo(userGeo, userLocale, geoCheckForce) {
  const geoLookup = async () => {
    let region = '';
    const resp = await fetch('/express/system/geo-map.json');
    const json = await resp.json();
    const matchedGeo = json.data.find((row) => (row.usergeo === userGeo));
    const { userlocales, redirectlocalpaths, redirectdefaultpath } = matchedGeo;
    region = redirectdefaultpath;

    if (userlocales) {
      const redirectLocalPaths = redirectlocalpaths.split(',');
      const [userLanguage] = userLocale.split('-');
      const userExpectedPath = `${userGeo.toLowerCase()}_${userLanguage}`;
      region = redirectLocalPaths.find((locale) => locale.trim() === userExpectedPath) || region;
    }
    return (region);
  };

  const region = geoCheckForce ? await geoLookup() : getCookie('international') || await geoLookup();
  return checkRedirect(window.location, region);
}

function loadIMS() {
  window.adobeid = {
    client_id: 'MarvelWeb3',
    scope: 'AdobeID,openid',
    locale: getLocale(window.location),
    environment: 'prod',
  };
  if (!['www.stage.adobe.com'].includes(window.location.hostname)) {
    loadScript('https://auth.services.adobe.com/imslib/imslib.min.js');
  } else {
    loadScript('https://auth-stg1.services.adobe.com/imslib/imslib.min.js');
    window.adobeid.environment = 'stg1';
  }
}

async function loadFEDS() {
  const locale = getLocale(window.location);

  async function showRegionPicker() {
    const $body = document.body;
    const regionpath = locale === 'us' ? '/' : `/${locale}/`;
    const host = window.location.hostname === 'localhost' ? 'https://www.adobe.com' : '';
    const url = `${host}${regionpath}`;
    const resp = await fetch(url);
    const html = await resp.text();
    const $div = createTag('div');
    $div.innerHTML = html;
    const $regionNav = $div.querySelector('nav.language-Navigation');
    if (!$regionNav) {
      return;
    }
    const $regionPicker = createTag('div', { id: 'region-picker' });
    $body.appendChild($regionPicker);
    $regionPicker.appendChild($regionNav);
    $regionNav.appendChild(createTag('div', { class: 'close' }));
    $regionPicker.addEventListener('click', (event) => {
      if (event.target === $regionPicker || event.target === $regionNav) {
        $regionPicker.remove();
      }
    });
    $regionPicker.querySelectorAll('li a').forEach(($a) => {
      $a.addEventListener('click', async (event) => {
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
        window.location.href = `${prefix}${gPath}`;
      });
    });
    // focus link of current region
    const lang = getLanguage(getLocale(new URL(window.location.href))).toLowerCase();
    const currentRegion = $regionPicker.querySelector(`li a[lang="${lang}"]`);
    if (currentRegion) {
      currentRegion.focus();
    }
  }

  function handleConsentSettings() {
    try {
      if (!window.adobePrivacy || window.adobePrivacy.hasUserProvidedCustomConsent()) {
        window.sprk_full_consent = false;
        return;
      }
      if (window.adobePrivacy.hasUserProvidedConsent()) {
        window.sprk_full_consent = true;
      } else {
        window.sprk_full_consent = false;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Couldn't determine user consent status:", e);
      window.sprk_full_consent = false;
    }
  }

  window.addEventListener('adobePrivacy:PrivacyConsent', handleConsentSettings);
  window.addEventListener('adobePrivacy:PrivacyReject', handleConsentSettings);
  window.addEventListener('adobePrivacy:PrivacyCustom', handleConsentSettings);

  const isMegaNav = window.location.pathname.startsWith('/express')
    || window.location.pathname.startsWith('/in/express')
    || window.location.pathname.startsWith('/education')
    || window.location.pathname.startsWith('/drafts');
  const fedsExp = isMegaNav
    ? 'adobe-express/ax-gnav-x'
    : 'adobe-express/ax-gnav-x-row';

  async function buildBreadCrumbArray() {
    if (isHomepage || getMetadata('hide-breadcrumbs') === 'true') {
      return null;
    }
    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
    const buildBreadCrumb = (path, name, parentPath = '') => (
      { title: capitalize(name), url: `${parentPath}/${path}` }
    );

    const placeholders = await fetchPlaceholders();
    const validSecondPathSegments = ['create', 'feature'];
    const pathSegments = window.location.pathname
      .split('/')
      .filter((e) => e !== locale);
    const localePath = locale === 'us' ? '' : `${locale}/`;
    const secondPathSegment = pathSegments[1].toLowerCase();
    const pagesShortNameElement = document.head.querySelector('meta[name="short-title"]');
    const pagesShortName = pagesShortNameElement?.getAttribute('content') ?? null;
    const replacedCategory = placeholders[`breadcrumbs-${secondPathSegment}`];

    if (!pagesShortName
      || pathSegments.length <= 2
      || !replacedCategory
      || !validSecondPathSegments.includes(replacedCategory)
      || locale !== 'us') { // Remove this line once locale translations are complete
      return null;
    }

    const secondBreadCrumb = buildBreadCrumb(secondPathSegment, capitalize(replacedCategory), `${localePath}/express`);
    const breadCrumbList = [secondBreadCrumb];

    if (pathSegments.length >= 3) {
      const thirdBreadCrumb = buildBreadCrumb(pagesShortName, pagesShortName, secondBreadCrumb.url);
      breadCrumbList.push(thirdBreadCrumb);
    }
    return breadCrumbList;
  }

  window.fedsConfig = {
    ...(window.fedsConfig || {}),

    footer: {
      regionModal: () => {
        showRegionPicker();
      },
    },
    locale: (locale === 'us' ? 'en' : locale),
    content: {
      experience: getMetadata('gnav') || fedsExp,
    },
    profile: {
      customSignIn: () => {
        const sparkLang = getLanguage(locale);
        const sparkPrefix = sparkLang === 'en-US' ? '' : `/${sparkLang}`;
        let sparkLoginUrl = `https://express.adobe.com${sparkPrefix}/sp/`;
        const env = getHelixEnv();
        if (env && env.spark) {
          sparkLoginUrl = sparkLoginUrl.replace('express.adobe.com', env.spark);
        }
        if (isHomepage) {
          sparkLoginUrl = 'https://new.express.adobe.com/?showCsatOnExportOnce=True&promoid=GHMVYBFM&mv=other';
        }
        window.location.href = sparkLoginUrl;
      },
    },
    privacy: {
      otDomainId: '7a5eb705-95ed-4cc4-a11d-0cc5760e93db',
      footerLinkSelector: '[data-feds-action="open-adchoices-modal"]',
    },
    jarvis: getMetadata('enable-chat') === 'yes'
      ? {
        surfaceName: 'AdobeExpressEducation',
        surfaceVersion: '1',
      }
      : {},
    breadcrumbs: {
      showLogo: true,
      links: await buildBreadCrumbArray(),
    },
  };

  window.addEventListener('feds.events.experience.loaded', async () => {
    document.querySelector('body').classList.add('feds-loaded');
    /* attempt to switch link */
    if (window.location.pathname.includes('/create/')
      || window.location.pathname.includes('/discover/')
      || window.location.pathname.includes('/feature/')) {
      const $aNav = document.querySelector('header a.feds-navLink--primaryCta');
      const $aHero = document.querySelector('main > div:first-of-type a.button.accent');
      if ($aNav && $aHero) {
        $aNav.href = $aHero.href;
      }
    }

    /* switch all links if lower env */
    const env = getHelixEnv();
    if (env && env.spark) {
      // eslint-disable-next-line no-console
      // console.log('lower env detected');
      document.querySelectorAll('a[href^="https://spark.adobe.com/"]').forEach(($a) => {
        const hrefURL = new URL($a.href);
        hrefURL.host = env.spark;
        $a.setAttribute('href', hrefURL.toString());
      });
      document.querySelectorAll('a[href^="https://express.adobe.com/"]').forEach(($a) => {
        const hrefURL = new URL($a.href);
        hrefURL.host = env.spark;
        $a.setAttribute('href', hrefURL.toString());
      });
    }

    const geocheck = new URLSearchParams(window.location.search).get('geocheck');
    if (geocheck === 'on' || geocheck === 'force') {
      const userGeo = window.feds
      && window.feds.data
      && window.feds.data.location
      && window.feds.data.location.country
        ? window.feds.data.location.country : null;
      const navigatorLocale = navigator.languages
      && navigator.languages.length
        ? navigator.languages[0].toLowerCase()
        : navigator.language.toLowerCase();
      const redirect = await checkGeo(userGeo, navigatorLocale, geocheck === 'force');
      if (redirect) {
        window.location.href = redirect;
      }
    }
    /* region based redirect to homepage */
    if (window.feds && window.feds.data && window.feds.data.location && window.feds.data.location.country === 'CN') {
      const regionpath = locale === 'us' ? '/' : `/${locale}/`;
      window.location.href = regionpath;
    }
  });
  let prefix = '';
  if (!['www.adobe.com', 'www.stage.adobe.com'].includes(window.location.hostname)) {
    prefix = 'https://www.adobe.com';
  }
  loadScript(`${prefix}/etc.clientlibs/globalnav/clientlibs/base/feds.js`).id = 'feds-script';
}

if (!window.hlx || !window.hlx.lighthouse) {
  loadIMS();
  loadFEDS();
  loadGoogleYOLO();
}
/* Core Web Vitals RUM collection */

sampleRUM('cwv');
