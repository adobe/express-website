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

import { loadScript } from './scripts';

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

loadScript('https://www.adobe.com/marketingtech/main.min.js');
loadScript('https://www.adobe.com/etc/beagle/public/globalnav/adobe-privacy/latest/privacy.min.js');
