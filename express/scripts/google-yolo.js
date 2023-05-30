/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { getMetadata } from './scripts.js';

function getRedirectUri() {
  const primaryCta = document.querySelector('a.button.xlarge.same-as-floating-button-CTA, a.primaryCTA');
  if (primaryCta) {
    return primaryCta.href;
  }
  return false;
}

function onGoogleToken(data) {
  const token = data.credential;
  const redirectURL = getRedirectUri();
  window.adobeIMS.socialHeadlessSignIn({
    provider_id: 'google',
    idp_token: token,
    client_id: window.adobeid.client_id,
    scope: window.adobeid.scope,
  }).then(() => {
    if (redirectURL) {
      window.location.assign(redirectURL);
    } else {
      window.location.reload();
    }
  }).catch(() => {
    const layoverUrl = new URL(window.location.href);
    layoverUrl.searchParams.set('layover', 'true');
    window.adobeIMS.signInWithSocialProvider('google', { redirect_uri: layoverUrl.href });
  });
}

function setupOneTap() {
  window.feds.utilities.imslib.onReady().then(() => {
    // IMS is ready, we can detect whether the user is already logged-in
    if (window.feds.utilities.imslib.isSignedInUser()) {
      // User is already signed-in, no need to display Google One Tap
      return;
    }

    const GOOGLE_ID = '419611593676-9r4iflfe9652cjp3booqmmk8jht5as81.apps.googleusercontent.com';
    const body = document.querySelector('body');
    const wrapper = document.createElement('div');
    // Position the dropdown below navigation
    const navigationBarHeight = document.getElementById('feds-topnav')?.offsetHeight;

    wrapper.id = 'GoogleOneTap';
    wrapper.style = `position: absolute; z-index: 9999; top: ${navigationBarHeight}px; right: 0`;
    body.appendChild(wrapper);

    // Load Google script
    window.feds.utilities.loadResource({
      type: 'script',
      path: 'https://accounts.google.com/gsi/client',
    }).then(() => {
      // Google script has been loaded
      window.google.accounts.id.initialize({
        client_id: GOOGLE_ID,
        callback: onGoogleToken,
        prompt_parent_id: 'GoogleOneTap',
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt();
    });
  });
}

export default function loadGoogleYolo() {
  const urlParams = new URLSearchParams(window.location.search);
  const relayLogin = urlParams.get('layover');
  const ctaUrl = getRedirectUri();
  const thresholdBreakpoint = ['yes', 'true', 'on', 'Y'].includes(getMetadata('mweb-google-yolo')) ? 0 : 900;

  if (window.matchMedia(`(min-width: ${thresholdBreakpoint}px)`).matches) {
    if (relayLogin && ctaUrl) {
      window.location.assign(ctaUrl);
    }

    setTimeout(() => {
      if (typeof window.feds === 'object' && window.feds?.events?.experience === true) {
        setupOneTap();
      } else {
        window.addEventListener('window.feds.events.experience.loaded', () => {
          setupOneTap();
        });
      }
    }, 3000);
  }
}
