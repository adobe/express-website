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
// eslint-disable-next-line import/no-unresolved
} from './scripts.js';
// for stage it should be:    environment: 'stg1',
function loadIMS() {
  window.adobeid = {
    client_id: 'MarvelWeb3',
    scope: 'AdobeID,openid',
    locale: getLocale(window.location),
    environment: 'prod',
  };
  loadScript('https://auth.services.adobe.com/imslib/imslib.min.js');
}

function loadFEDS() {
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
        const checkResp = await fetch(prefix + gPath);
        if (checkResp.ok) {
          window.location.href = prefix + gPath;
        } else {
          window.location.href = `${prefix}/express/`;
        }
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

  window.fedsConfig = {
    ...(window.fedsConfig || {}),

    footer: {
      regionModal: () => {
        showRegionPicker();
      },
    },
    locale: (locale === 'us' ? 'en' : locale),
    content: {
      experience: 'cc-express/cc-express-gnav',
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
        window.location.href = sparkLoginUrl;
      },
    },
    privacy: {
      otDomainId: '7a5eb705-95ed-4cc4-a11d-0cc5760e93db',
      footerLinkSelector: '[data-feds-action="open-adchoices-modal"]',
    },
  };

  window.addEventListener('feds.events.experience.loaded', () => {
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

    /* switch all links if lower envs */
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
}

/* Core Web Vitals RUM collection */

sampleRUM('cwv');
