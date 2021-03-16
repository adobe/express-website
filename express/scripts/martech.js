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
/* global window */

import { loadScript, getLocale } from './scripts.js';

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
window.fedsConfig = window.fedsConfig || {};
window.fedsConfig.privacy = window.fedsConfig.privacy || {};
window.fedsConfig.privacy.otDomainId = '7a5eb705-95ed-4cc4-a11d-0cc5760e93db';
window.fedsConfig.privacy.footerLinkSelector = '#openCookieModal';
window.marketingtech = {
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
window.targetGlobalSettings = {
  bodyHidingEnabled: false,
};

const pageName = `adobe.com:${window.location.pathname.split('/').join(':')}`;
const locale = getLocale(window.location);

const langs = {
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

const language = langs[locale];
let category = 'design';
if (window.location.pathname.includes('/photo')) category = 'photo';
if (window.location.pathname.includes('/video')) category = 'video';

window.digitalData = {
  page: {
    pageInfo: {
      pageName,
      language,
      siteSection: 'adobe.com:express',
      category,
    },
  },
};

loadScript('https://www.adobe.com/marketingtech/main.min.js');
loadScript('https://www.adobe.com/etc/beagle/public/globalnav/adobe-privacy/latest/privacy.min.js');
