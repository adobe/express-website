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
  createTag,
  getLocale,
  getMetadata,
  fetchPlaceholders,
  getIcon,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

// Get lottie animation HTML - remember to utils#lazyLoadLottiePlayer() to see it.
export function getLottie(name, src, loop = true, autoplay = true, control = false, hover = false) {
  return (`<lottie-player class="lottie lottie-${name}" src="${src}" background="transparent" speed="1" ${(loop) ? 'loop ' : ''}${(autoplay) ? 'autoplay ' : ''}${(control) ? 'controls ' : ''}${(hover) ? 'hover ' : ''}></lottie-player>`);
}

// Lazy-load lottie player if you scroll to the block.
export function lazyLoadLottiePlayer($block = null) {
  const usp = new URLSearchParams(window.location.search);
  const lottie = usp.get('lottie');
  if (lottie !== 'off') {
    const loadLottiePlayer = () => {
      if (window['lottie-player']) return;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = '/express/scripts/lottie-player.1.5.6.js';
      document.head.appendChild(script);
      window['lottie-player'] = true;
    };
    if ($block) {
      const addIntersectionObserver = (block) => {
        const observer = (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.25) {
              loadLottiePlayer();
            }
          }
        };
        const options = {
          root: null,
          rootMargin: '0px',
          threshold: [0.0, 0.25],
        };
        const intersectionObserver = new IntersectionObserver(observer, options);
        intersectionObserver.observe(block);
      };
      if (document.readyState === 'complete') {
        addIntersectionObserver($block);
      } else {
        window.addEventListener('load', () => {
          addIntersectionObserver($block);
        });
      }
    } else if (document.readyState === 'complete') {
      loadLottiePlayer();
    } else {
      window.addEventListener('load', () => {
        loadLottiePlayer();
      });
    }
  }
}

export async function addFreePlanWidget(elem) {
  if (elem && ['yes', 'true'].includes(getMetadata('show-free-plan').toLowerCase())) {
    const placeholders = await fetchPlaceholders();
    const checkmark = getIcon('checkmark');
    const widget = createTag('div', { class: 'free-plan-widget' });
    widget.innerHTML = `
      <div><div>${checkmark}</div><div>${placeholders['free-plan-check-1']}</div></div>
      <div><div>${checkmark}</div><div>${placeholders['free-plan-check-2']}</div></div>
    `;
    document.addEventListener('planscomparisonloaded', () => {
      const $learnMoreButton = createTag('a', { class: 'learn-more-button', href: '#plans-comparison-container' });
      const lottieWrapper = createTag('span', { class: 'lottie-wrapper' });
      $learnMoreButton.textContent = placeholders['learn-more'];
      lottieWrapper.innerHTML = getLottie('purple-arrows', '/express/blocks/floating-button/purple-arrows.json');
      $learnMoreButton.append(lottieWrapper);
      lazyLoadLottiePlayer();
      widget.append($learnMoreButton);
    });
    elem.append(widget);
    elem.classList.add('free-plan-container');
    // stack CTA and free plan widget if country not US, CN, KR or TW
    const cta = elem.querySelector('.button.accent');
    if (cta && !['us', 'cn', 'kr', 'tw'].includes(getLocale(window.location))) {
      elem.classList.add('stacked');
    }
  }
}

export function trackBranchParameters($links) {
  const rootUrl = new URL(window.location.href);
  const rootUrlParameters = rootUrl.searchParams;

  const sdid = rootUrlParameters.get('sdid');
  const mv = rootUrlParameters.get('mv');
  const sKwcId = rootUrlParameters.get('s_kwcid');
  const efId = rootUrlParameters.get('ef_id');
  const promoId = rootUrlParameters.get('promoid');
  const trackingId = rootUrlParameters.get('trackingid');
  const cgen = rootUrlParameters.get('cgen');

  if (sdid || mv || sKwcId || efId || promoId || trackingId || cgen) {
    $links.forEach(($a) => {
      if ($a.href && $a.href.match('adobesparkpost.app.link')) {
        const buttonUrl = new URL($a.href);
        const urlParams = buttonUrl.searchParams;

        if (sdid) {
          urlParams.set('~campaign_id', sdid);
        }

        if (mv) {
          urlParams.set('~customer_campaign', mv);
        }

        if (sKwcId) {
          const sKwcIdParameters = sKwcId.split('!');

          if (typeof sKwcIdParameters[2] !== 'undefined' && sKwcIdParameters[2] === '3') {
            urlParams.set('~customer_placement', 'Google%20AdWords');
          }

          if (typeof sKwcIdParameters[8] !== 'undefined' && sKwcIdParameters[8] !== '') {
            urlParams.set('~keyword', sKwcIdParameters[8]);
          }
        }

        if (promoId) {
          urlParams.set('~ad_id', promoId);
        }

        if (trackingId) {
          urlParams.set('~keyword_id', trackingId);
        }

        if (cgen) {
          urlParams.set('~customer_keyword', cgen);
        }

        urlParams.set('~feature', 'paid%20advertising');

        buttonUrl.search = urlParams.toString();
        $a.href = buttonUrl.toString();
      }
    });
  }
}
