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

function getRedirectUri() {
  const primaryCta = document.querySelector('a.button.xlarge.same-as-floating-button-CTA, a.primaryCTA');
  if (primaryCta) {
    return primaryCta.href;
  }
  return false;
}

function onGoogleToken(data) {
  const token = data.credential;
  const redirectURL = getRedirectUri() || window.location.href;
  window.adobeIMS.socialHeadlessSignIn({
    provider_id: 'google',
    idp_token: token,
    client_id: window.adobeid.client_id,
    scope: window.adobeid.scope,
  }).then(() => {
    // User already has an account, we refresh the page to finsish the login process
    // window.location.reload();
    // Use this code to redirect the user to a different page
    window.location.href = redirectURL;
  }).catch(() => {
    // User does not have an account; proceed with Progressive Account Creation
    // adobeIMS.signInWithSocialProvider('google');
    // Use this code to redirect the user to a different page after account creation
    window.adobeIMS.signInWithSocialProvider('google', { redirect_uri: redirectURL });
  });
}

function setupOneTap() {
  window.feds.utilities.imslib.onReady().then(() => {
    // IMS is ready, we can detect whether the user is already logged-in
    if (window.feds.utilities.imslib.isSignedInUser()) {
      // User is already signed-in, no need to display Google One Tap
      console.log('REMOVE ME: user is already logged-in');
      return;
    }

    // Change the Google ID
    const GOOGLE_ID = '163892384754-vpnp2b90iphomo9e5ucshim3dcm7i91u.apps.googleusercontent.com';
    const TEST_GOOGLE_ID = '460813204764-uia1ajlt8cjb0juqdkual1b0iap9smi3.apps.googleusercontent.com';

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
      // eslint-disable-next-line no-undef
      google.accounts.id.initialize({
        client_id: TEST_GOOGLE_ID,
        callback: onGoogleToken,
        prompt_parent_id: 'GoogleOneTap',
        cancel_on_tap_outside: false,
      });

      // eslint-disable-next-line no-undef
      google.accounts.id.prompt((dropdown) => {
        if (dropdown.isDisplayed()) {
          // The dropdown has been rendered to the user
          console.log('The dropdown has been rendered to the user');
        } else {
          console.log('The dropdown is not rendered', dropdown.l);
          // The dropdown is not rendered - user does not have an active google session
        }
      });
    });
  });
}

// Start of Vivian's version
const atOffer = {
  main() {
    if (this.experience) {
      if (this.experience === 1 && this.get.signin === 'true') {
        window.location.href = this.getRedirectUri();
      } else {
        this.delayCheckForWindowsFed();
      }
    }
  },
  delayCheckForWindowsFed() {
    // wait 3 seconds
    setTimeout(() => {
      if (typeof window.feds === 'object' && window.feds?.events?.experience === true) {
        // FEDS is already loaded
        this.setupOneTap();
      } else {
        // wait for FEDS to load
        window.addEventListener('window.feds.events.experience.loaded', () => {
          this.setupOneTap();
        });
      }
    }, 3000);
  },
  getRedirectUri() {
    /* let redirectUrl = '';
    this.$('a.button.xlarge.same-as-floating-button-CTA, a.primaryCTA', (el) => {
      redirectUrl = el.href;
    });
    return redirectUrl; */
    const redirect = {
      express: 'https://adobesparkpost.app.link/arCdwGikflb',
      explore: 'https://adobesparkpost.app.link/arCdwGikflb',
      create: 'https://adobesparkpost.app.link/hMVKToYk7gb',
      youtube: 'https://adobesparkpost.app.link/uz2OjUaEegb?search=YouTube+Banner',
      'instagram-story': 'https://adobesparkpost.app.link/Ote7rqH9Erb?search=Instagram+Story',
      'social-media-graphic': 'https://adobesparkpost.app.link/2BA3pQkaFrb?search=Social+Media+Graphic',
      'png-to-jpg': 'https://express.adobe.com/sp/tools/convert-to-jpg',
      mp4: 'https://express.adobe.com/sp/tools/convert-to-mp4',
      crop: 'https://express.adobe.com/sp/tools/image-crop',
    };
    return redirect[this.page];
  },
  setupOneTap() {
    const app = this;
    console.log(app);
    const onGoogleToken = function (data) {
      const token = data.credential;
      window.adobeIMS
        .socialHeadlessSignIn({
          provider_id: 'google',
          idp_token: token,
          client_id: window.adobeid.client_id,
          scope: window.adobeid.scope,
        })
        .then(() => {
          // User already has an account, we refresh the page to finish the login process
          // window.location.reload();
          // Use this code to redirect the user to a different page
          if (app.experience === 1) {
            app.trackCustomLink('user being redirected after login');
            window.location.href = app.getRedirectUri();
          } else {
            // User already has an account, we refresh the page to finish the login process
            app.trackCustomLink('user kept on page after login');
            window.location.reload();
          }
        })
        .catch(() => {
          // User does not have an account; proceed with Progressive Account Creation
          // adobeIMS.signInWithSocialProvider('google');
          // Use this code to redirect the user to a different page after account creation
          if (app.experience === 1) {
            app.trackCustomLink('user being redirected after login');
            const url = new URL(window.location.href);
            url.searchParams.set('signin', 'true');
            window.adobeIMS.signInWithSocialProvider('google', { redirect_uri: url.href });
          } else {
            // User already has an account, we refresh the page to finish the login process
            app.trackCustomLink('user kept on page after login');
            adobeIMS.signInWithSocialProvider('google');
          }
        });
    };
    const yoloInit = function () {
      // Change the Google ID
      const GOOGLE_ID = '419611593676-9r4iflfe9652cjp3booqmmk8jht5as81.apps.googleusercontent.com';
      const TEST_GOOGLE_ID = '460813204764-uia1ajlt8cjb0juqdkual1b0iap9smi3.apps.googleusercontent.com';

      const body = document.querySelector('body');
      const wrapper = document.createElement('div');
      // Position the dropdown below navigation
      const navigationBarHeight = document.getElementById('feds-topnav')?.offsetHeight;

      wrapper.id = 'GoogleOneTap';
      wrapper.style = `position: absolute; z-index: 9999; top: ${navigationBarHeight}px; right: 0`;
      body.appendChild(wrapper);

      // Load Google script
      window.feds.utilities
        .loadResource({
          type: 'script',
          path: 'https://accounts.google.com/gsi/client',
        })
        .then(() => {
          // Google script has been loaded
          google.accounts.id.initialize({
            client_id: TEST_GOOGLE_ID,
            callback: onGoogleToken,
            prompt_parent_id: 'GoogleOneTap',
            cancel_on_tap_outside: false,
          });

          google.accounts.id.prompt((dropdown) => {
            if (dropdown.isDisplayed()) {
              // The dropdown has been rendered to the user
              app.trackCustomLink('dropdown displayed to user');
            } else if (dropdown.l === 'suppressed_by_user') {
              // The dropdown is not rendered - user previously dismissed it
              app.trackCustomLink('not showing YOLO because user previously dismissed it');
            } else if (dropdown.l === 'opt_out_or_no_session') {
              // The dropdown is not rendered - user does not have an active google session
              app.trackCustomLink('not showing YOLO because user not logged-in to Google');
            }
          });
        });
    };
    window.feds.utilities.imslib.onReady()
      .then(() => {
        // IMS is ready, we can detect whether the user is already logged-in
        if (window.feds.utilities.imslib.isSignedInUser()) {
          // User is already signed-in, no need to display Google One Tap
          app.trackCustomLink('not showing YOLO because user logged-in to Adobe');
          return;
        }

        const body = document.querySelector('body');
        if (body) {
          yoloInit();
        } else {
          window.addEventListener('DOMContentLoaded', yoloInit, false);
        }
      });
  },
};

export default function loadGoogleYolo() {
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
