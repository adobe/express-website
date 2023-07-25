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
/* eslint-disable no-console */
window.RUM_GENERATION = 'ccx-gen-4-experiment-high-sample-rate';
window.RUM_LOW_SAMPLE_RATE = 100;
window.RUM_HIGH_SAMPLE_RATE = 50;

const TK_IDS = {
  jp: 'dvg6awq',
};

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */

export function sampleRUM(checkpoint, data = {}) {
  sampleRUM.defer = sampleRUM.defer || [];
  const defer = (fnname) => {
    sampleRUM[fnname] = sampleRUM[fnname]
      || ((...args) => sampleRUM.defer.push({ fnname, args }));
  };
  sampleRUM.drain = sampleRUM.drain
    || ((dfnname, fn) => {
      sampleRUM[dfnname] = fn;
      sampleRUM.defer
        .filter(({ fnname }) => dfnname === fnname)
        .forEach(({ fnname, args }) => sampleRUM[fnname](...args));
    });
  sampleRUM.on = (chkpnt, fn) => {
    sampleRUM.cases[chkpnt] = fn;
  };
  defer('observe');
  defer('cwv');
  defer('stash');
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = (usp.get('rum') === 'on') ? 1 : window.RUM_LOW_SAMPLE_RATE;
      // eslint-disable-next-line no-bitwise
      const hashCode = (s) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
      const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random().toString(16).substr(2, 14)}`;
      const random = Math.random();
      const isSelected = (random * weight < 1);
      // eslint-disable-next-line object-curly-newline
      window.hlx.rum = { weight, id, random, isSelected, sampleRUM };
    }
    const { id } = window.hlx.rum;
    if ((window.hlx && window.hlx.rum && window.hlx.rum.isSelected) || checkpoint === 'experiment') {
      const sendPing = (pdata = data) => {
        if (!window.hlx.rum.isSelected) {
          return;
        }
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify({ weight: window.hlx.rum.weight, id, referer: window.location.href, generation: window.RUM_GENERATION, checkpoint, ...data });
        const url = `https://rum.hlx.page/.rum/${window.hlx.rum.weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}:${window.hlx.rum.weight}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          sendPing(data);
          return true;
        },
        experiment: () => {
          // track experiments with higher sampling rate
          window.hlx.rum.weight = Math.min(window.hlx.rum.weight, window.RUM_HIGH_SAMPLE_RATE);
          window.hlx.rum.isSelected = (window.hlx.rum.random * window.hlx.rum.weight < 1);

          sampleRUM.drain('stash', sampleRUM);
          sendPing(data);
          return true;
        },
      };
      sendPing(data);
      if (sampleRUM.cases[checkpoint]) {
        sampleRUM.cases[checkpoint]();
      }
    } else {
      sampleRUM.stash(checkpoint, data); // save the event for later
    }
  } catch (error) {
    // something went wrong
  }
}

sampleRUM('top');
window.addEventListener('load', () => sampleRUM('load'));
document.addEventListener('click', () => sampleRUM('click'));

/**
 * Track assets in that appear in the viewport and add populate
 * `viewasset` events to the data layer.
 */
function trackViewedAssetsInDataLayer(assetsSelector = 'img[src*="/media_"]') {
  window.dataLayer = window.dataLayer || [];

  const viewAssetObserver = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry) => {
        const el = entry.target;

        // observe only once
        viewAssetObserver.unobserve(el);

        // Get asset details
        let assetPath = el.href // the reference for an a/svg tag
          || el.currentSrc // the active source in a picture/video/audio element
          || el.src; // the source for an image/video/iframe
        assetPath = new URL(assetPath).pathname;
        const match = assetPath.match(/media_([a-f0-9]+)\.\w+/);
        const assetFilename = match ? match[0] : assetPath;
        const details = {
          event: 'viewasset',
          assetId: assetFilename,
          assetPath,
        };

        // Add experiment details
        const { id, selectedVariant } = (window.hlx.experiment || {});
        if (selectedVariant) {
          details.experiment = id;
          details.variant = selectedVariant;
        }

        window.dataLayer.push(details);
      });
  }, { threshold: 0.25 });

  // Observe all assets in the DOM
  document.querySelectorAll(assetsSelector).forEach((el) => {
    viewAssetObserver.observe(el);
  });

  // Observe all assets added async
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          return;
        }
        n.querySelectorAll(assetsSelector).forEach((asset) => {
          viewAssetObserver.unobserve(asset);
        });
      });
      mutation.addedNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          return;
        }
        n.querySelectorAll(assetsSelector).forEach((asset) => {
          viewAssetObserver.observe(asset);
        });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

const postEditorLinksAllowList = ['adobesparkpost.app.link', 'spark.adobe.com/sp/design', 'express.adobe.com/sp/design'];

export function addPublishDependencies(url) {
  if (!Array.isArray(url)) {
    // eslint-disable-next-line no-param-reassign
    url = [url];
  }
  window.hlx = window.hlx || {};
  if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
    window.hlx.dependencies.concat(url);
  } else {
    window.hlx.dependencies = url;
  }
}

export function toClassName(name) {
  return name && typeof name === 'string'
    ? name.trim().toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

export function createTag(name, attrs) {
  const el = document.createElement(name);
  if (typeof attrs === 'object') {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

export function getMeta(name) {
  let value = '';
  const nameLower = name.toLowerCase();
  const $metas = [...document.querySelectorAll('meta')].filter(($m) => {
    const nameAttr = $m.getAttribute('name');
    const propertyAttr = $m.getAttribute('property');
    return ((nameAttr && nameLower === nameAttr.toLowerCase())
      || (propertyAttr && nameLower === propertyAttr.toLowerCase()));
  });
  if ($metas[0]) value = $metas[0].getAttribute('content');
  return value;
}

// Get lottie animation HTML - remember to lazyLoadLottiePlayer() to see it.
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

export function getIcon(icons, alt, size = 44) {
  // eslint-disable-next-line no-param-reassign
  icons = Array.isArray(icons) ? icons : [icons];
  const [defaultIcon, mobileIcon] = icons;
  const icon = (mobileIcon && window.innerWidth < 600) ? mobileIcon : defaultIcon;
  const symbols = [
    'adobefonts',
    'adobe-stock',
    'android',
    'animation',
    'blank',
    'brand',
    'brand-libraries',
    'brandswitch',
    'calendar',
    'certified',
    'changespeed',
    'check',
    'chevron',
    'cloud-storage',
    'crop-image',
    'crop-video',
    'convert',
    'convert-png-jpg',
    'cursor-browser',
    'desktop',
    'desktop-round',
    'download',
    'elements',
    'facebook',
    'globe',
    'incredibly-easy',
    'instagram',
    'image',
    'ios',
    'libraries',
    'library',
    'linkedin',
    'magicwand',
    'mergevideo',
    'mobile-round',
    'muteaudio',
    'palette',
    'photos',
    'photoeffects',
    'pinterest',
    'play',
    'premium',
    'premium-templates',
    'pricingfree',
    'pricingpremium',
    'privacy',
    'qr-code',
    'remove-background',
    'resize',
    'resize-video',
    'reversevideo',
    'rush',
    'snapchat',
    'sparkpage',
    'sparkvideo',
    'stickers',
    'templates',
    'text',
    'tiktok',
    'trim-video',
    'twitter',
    'up-download',
    'upload',
    'users',
    'webmobile',
    'youtube',
    'star',
    'star-half',
    'star-empty',
  ];

  const size22Icons = [
    'chevron',
    'pricingfree',
    'pricingpremium',
  ];

  if (symbols.includes(icon)) {
    const iconName = icon;
    let sheetSize = size;
    if (size22Icons.includes(icon)) sheetSize = 22;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-${icon}">
      ${alt ? `<title>${alt}</title>` : ''}
      <use href="/express/icons/ccx-sheet_${sheetSize}.svg#${iconName}${sheetSize}"></use>
    </svg>`;
  } else {
    return (`<img class="icon icon-${icon}" src="/express/icons/${icon}.svg" alt="${alt || icon}">`);
  }
}

export function getIconElement(icons, size, alt, additionalClassName) {
  const $div = createTag('div');
  $div.innerHTML = getIcon(icons, alt, size);

  if (additionalClassName) $div.firstElementChild.classList.add(additionalClassName);
  return ($div.firstElementChild);
}

export function transformLinkToAnimation($a, $videoLooping = true) {
  if (!$a || !$a.href.endsWith('.mp4')) {
    return null;
  }
  const params = new URL($a.href).searchParams;
  const attribs = {};
  const dataAttr = $videoLooping ? ['playsinline', 'autoplay', 'loop', 'muted'] : ['playsinline', 'autoplay', 'muted'];
  dataAttr.forEach((p) => {
    if (params.get(p) !== 'false') attribs[p] = '';
  });
  // use closest picture as poster
  const $poster = $a.closest('div').querySelector('picture source');
  if ($poster) {
    attribs.poster = $poster.srcset;
    $poster.parentNode.remove();
  }
  // replace anchor with video element
  const videoUrl = new URL($a.href);
  const helixId = videoUrl.hostname.includes('hlx.blob.core') ? videoUrl.pathname.split('/')[2] : videoUrl.pathname.split('media_')[1].split('.')[0];
  const videoHref = `./media_${helixId}.mp4`;
  const $video = createTag('video', attribs);
  $video.innerHTML = `<source src="${videoHref}" type="video/mp4">`;
  const $innerDiv = $a.closest('div');
  $innerDiv.prepend($video);
  $innerDiv.classList.add('hero-animation-overlay');
  $a.replaceWith($video);
  // autoplay animation
  $video.addEventListener('canplay', () => {
    $video.muted = true;
    $video.play();
  });
  return $video;
}

export function linkPicture($picture) {
  const $nextSib = $picture.parentNode.nextElementSibling;
  if ($nextSib) {
    const $a = $nextSib.querySelector('a');
    if ($a && $a.textContent.trim().startsWith('https://')) {
      $a.innerHTML = '';
      $a.className = '';
      $a.appendChild($picture);
    }
  }
}

export function linkImage($elem) {
  const $a = $elem.querySelector('a');
  if ($a) {
    const $parent = $a.closest('div');
    $a.remove();
    $a.className = '';
    $a.innerHTML = '';
    $a.append(...$parent.children);
    $parent.append($a);
  }
}

export function readBlockConfig($block) {
  const config = {};
  $block.querySelectorAll(':scope>div').forEach(($row) => {
    if ($row.children) {
      const $cols = [...$row.children];
      if ($cols[1]) {
        const $value = $cols[1];
        const name = toClassName($cols[0].textContent.trim());
        let value = '';
        if ($value.querySelector('a')) {
          const $as = [...$value.querySelectorAll('a')];
          if ($as.length === 1) {
            value = $as[0].href;
          } else {
            value = $as.map(($a) => $a.href);
          }
        } else if ($value.querySelector('p')) {
          const $ps = [...$value.querySelectorAll('p')];
          if ($ps.length === 1) {
            value = $ps[0].textContent.trim();
          } else {
            value = $ps.map(($p) => $p.textContent.trim());
          }
        } else value = $row.children[1].textContent.trim();
        config[name] = value;
      }
    }
  });
  return config;
}

function removeIrrelevantSections(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      if (meta.audience && meta.audience !== document.body.dataset?.device) {
        section.remove();
      }
    }
  });
}

/**
 * Decorates all sections in a container element.
 * @param {Element} $main The container element
 */
function decorateSections($main) {
  let noAudienceFound = false;
  $main.querySelectorAll(':scope > div').forEach((section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section', 'section-wrapper'); // keep .section-wrapper for compatibility
    section.setAttribute('data-section-status', 'initialized');

    /* process section metadata */
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      const keys = Object.keys(meta);
      keys.forEach((key) => {
        if (key === 'style') {
          section.classList.add(...meta.style.split(', ').map(toClassName));
        } else if (key === 'anchor') {
          section.id = toClassName(meta.anchor);
        } else if (key === 'background') {
          section.style.background = meta.background;
        } else {
          section.dataset[key] = meta[key];
        }
      });
      sectionMeta.parentNode.remove();
    }

    if (section.dataset.audience && !noAudienceFound) {
      section.style.paddingTop = '0';
    } else {
      noAudienceFound = true;
    }
  });
}

/**
 * Updates all section status in a container element.
 * @param {Element} main The container element
 */
export function updateSectionsStatus(main) {
  const sections = [...main.querySelectorAll(':scope > div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const status = section.getAttribute('data-section-status');
    if (status !== 'loaded') {
      const loadingBlock = section.querySelector('.block[data-block-status="initialized"], .block[data-block-status="loading"]');
      if (loadingBlock) {
        section.setAttribute('data-section-status', 'loading');
        break;
      } else {
        section.setAttribute('data-section-status', 'loaded');
      }
    }
  }
}

export function getLocale(url) {
  const locale = url.pathname.split('/')[1];
  if (/^[a-z]{2}$/.test(locale)) {
    return locale;
  }
  return 'us';
}

export function getCookie(cname) {
  const name = `${cname}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

function getCountry() {
  let country = new URLSearchParams(window.location.search).get('country');
  if (!country) {
    country = getCookie('international');
  }
  if (!country) {
    country = getLocale(window.location);
  }
  if (country === 'uk') country = 'gb';
  return (country.split('_')[0]);
}

export function getCurrency(locale) {
  const loc = locale || getCountry();
  const currencies = {
    ar: 'ARS',
    at: 'EUR',
    au: 'AUD',
    be: 'EUR',
    bg: 'EUR',
    br: 'BRL',
    ca: 'CAD',
    ch: 'CHF',
    cl: 'CLP',
    co: 'COP',
    cr: 'USD',
    cy: 'EUR',
    cz: 'EUR',
    de: 'EUR',
    dk: 'DKK',
    ec: 'USD',
    ee: 'EUR',
    es: 'EUR',
    fi: 'EUR',
    fr: 'EUR',
    gb: 'GBP',
    gr: 'EUR',
    gt: 'USD',
    hk: 'HKD',
    hu: 'EUR',
    id: 'IDR',
    ie: 'EUR',
    il: 'ILS',
    in: 'INR',
    it: 'EUR',
    jp: 'JPY',
    kr: 'KRW',
    lt: 'EUR',
    lu: 'EUR',
    lv: 'EUR',
    mt: 'EUR',
    mx: 'MXN',
    my: 'MYR',
    nl: 'EUR',
    no: 'NOK',
    nz: 'AUD',
    pe: 'PEN',
    ph: 'PHP',
    pl: 'EUR',
    pt: 'EUR',
    ro: 'EUR',
    ru: 'RUB',
    se: 'SEK',
    sg: 'SGD',
    si: 'EUR',
    sk: 'EUR',
    th: 'THB',
    tw: 'TWD',
    us: 'USD',
    ve: 'USD',
    za: 'USD',
    ae: 'USD',
    bh: 'BHD',
    eg: 'EGP',
    jo: 'JOD',
    kw: 'KWD',
    om: 'OMR',
    qa: 'USD',
    sa: 'SAR',
    ua: 'USD',
    dz: 'USD',
    lb: 'LBP',
    ma: 'USD',
    tn: 'USD',
    ye: 'USD',
    am: 'USD',
    az: 'USD',
    ge: 'USD',
    md: 'USD',
    tm: 'USD',
    by: 'USD',
    kz: 'USD',
    kg: 'USD',
    tj: 'USD',
    uz: 'USD',
    bo: 'USD',
    do: 'USD',
    hr: 'EUR',
    ke: 'USD',
    lk: 'USD',
    mo: 'HKD',
    mu: 'USD',
    ng: 'USD',
    pa: 'USD',
    py: 'USD',
    sv: 'USD',
    tt: 'USD',
    uy: 'USD',
    vn: 'USD',
  };
  return currencies[loc];
}

export function getLanguage(locale) {
  const langs = {
    us: 'en-US',
    fr: 'fr-FR',
    in: 'en-IN',
    de: 'de-DE',
    it: 'it-IT',
    dk: 'da-DK',
    es: 'es-ES',
    fi: 'fi-FI',
    jp: 'ja-JP',
    kr: 'ko-KR',
    no: 'nb-NO',
    nl: 'nl-NL',
    br: 'pt-BR',
    se: 'sv-SE',
    th: 'th-TH',
    tw: 'zh-Hant-TW',
    cn: 'zh-Hans-CN',
  };

  let language = langs[locale];
  if (!language) language = 'en-US';

  return language;
}

export function getHelixEnv() {
  let envName = sessionStorage.getItem('helix-env');
  if (!envName) {
    envName = 'stage';
    if (window.spark.hostname === 'www.adobe.com') envName = 'prod';
  }
  const envs = {
    stage: {
      commerce: 'commerce-stg.adobe.com',
      adminconsole: 'stage.adminconsole.adobe.com',
      spark: 'express-stage.adobeprojectm.com',
    },
    prod: {
      commerce: 'commerce.adobe.com',
      spark: 'express.adobe.com',
      adminconsole: 'adminconsole.adobe.com',
    },
  };
  const env = envs[envName];

  const overrideItem = sessionStorage.getItem('helix-env-overrides');
  if (overrideItem) {
    const overrides = JSON.parse(overrideItem);
    const keys = Object.keys(overrides);
    env.overrides = keys;

    for (const a of keys) {
      env[a] = overrides[a];
    }
  }

  if (env) {
    env.name = envName;
  }
  return env;
}

function convertGlobToRe(glob) {
  let reString = glob.replace(/\*\*/g, '_');
  reString = reString.replace(/\*/g, '[0-9a-z-]*');
  reString = reString.replace(/_/g, '.*');
  return (new RegExp(reString));
}

function getCurrencyDisplay(currency) {
  if (currency === 'JPY') {
    return 'name';
  }
  if (['SEK', 'DKK', 'NOK'].includes(currency)) {
    return 'code';
  }
  return 'symbol';
}

export async function fetchRelevantRows(path) {
  if (!window.relevantRows) {
    try {
      const locale = getLocale(window.location);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      const resp = await fetch(`${urlPrefix}/express/relevant-rows.json`);
      window.relevantRows = resp.ok ? (await resp.json()).data : [];
    } catch {
      const resp = await fetch('/express/relevant-rows.json');
      window.relevantRows = resp.ok ? (await resp.json()).data : [];
    }
  }

  if (window.relevantRows.length) {
    const relevantRow = window.relevantRows.find((p) => path === p.path);
    const env = getHelixEnv();

    if (env && env.name === 'stage') {
      return relevantRow || null;
    }

    return relevantRow && relevantRow.live !== 'N' ? relevantRow : null;
  }

  return null;
}

export function formatPrice(price, currency) {
  const locale = ['USD', 'TWD'].includes(currency)
    ? 'en-GB' // use en-GB for intl $ symbol formatting
    : getLanguage(getCountry());
  const currencyDisplay = getCurrencyDisplay(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay,
  }).format(price)
    .replace('SAR', 'SR'); // custom currency symbol for SAR
}

export async function getOffer(offerId, countryOverride) {
  let country = getCountry();
  if (countryOverride) country = countryOverride;
  if (!country) country = 'us';
  let currency = getCurrency(country);
  if (!currency) {
    country = 'us';
    currency = 'USD';
  }
  const resp = await fetch('/express/system/offers-new.json');
  if (!resp.ok) return {};
  const json = await resp.json();
  const upperCountry = country.toUpperCase();
  let offer = json.data.find((e) => (e.o === offerId) && (e.c === upperCountry));
  if (!offer) offer = json.data.find((e) => (e.o === offerId) && (e.c === 'US'));

  if (offer) {
    // console.log(offer);
    const lang = getLanguage(getLocale(window.location)).split('-')[0];
    const unitPrice = offer.p;
    const unitPriceCurrencyFormatted = formatPrice(unitPrice, currency);
    const commerceURL = `https://commerce.adobe.com/checkout?cli=spark&co=${country}&items%5B0%5D%5Bid%5D=${offerId}&items%5B0%5D%5Bcs%5D=0&rUrl=https%3A%2F%express.adobe.com%2Fsp%2F&lang=${lang}`;
    const vatInfo = offer.vat;
    const prefix = offer.pre;
    const suffix = offer.suf;

    return {
      country,
      currency,
      unitPrice,
      unitPriceCurrencyFormatted,
      commerceURL,
      lang,
      vatInfo,
      prefix,
      suffix,
    };
  }
  return {};
}

export function addBlockClasses($block, classNames) {
  const $rows = Array.from($block.children);
  $rows.forEach(($row) => {
    classNames.forEach((className, i) => {
      $row.children[i].className = className;
    });
  });
}

// function addDivClasses($element, selector, classes) {
//   const $children = $element.querySelectorAll(selector);
//   $children.forEach(($div, i) => {
//     $div.classList.add(classes[i]);
//   });
// }

function decorateHeaderAndFooter() {
  const $header = document.querySelector('header');

  $header.addEventListener('click', (event) => {
    if (event.target.id === 'feds-topnav') {
      const root = window.location.href.split('/express/')[0];
      window.location.href = `${root}/express/`;
    }
  });

  $header.innerHTML = '<div id="feds-header"></div>';

  document.querySelector('footer').innerHTML = `
    <div id="feds-footer"></div>
  `;
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
export function loadCSS(href, callback) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    if (typeof callback === 'function') {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (typeof callback === 'function') {
    callback('noop');
  }
}

function resolveFragments() {
  Array.from(document.querySelectorAll('main > div div'))
    .filter(($cell) => $cell.childElementCount === 0)
    .filter(($cell) => /^\[[A-Za-z0-9 -_—]+\]$/mg.test($cell.textContent.trim()))
    .forEach(($cell) => {
      const marker = $cell.textContent.trim()
        .substring(1, $cell.textContent.trim().length - 1)
        .toLocaleLowerCase()
        .trim();
      // find the fragment with the marker
      const $marker = Array.from(document.querySelectorAll('main > div h3'))
        .find(($title) => $title.textContent.trim().toLocaleLowerCase() === marker);
      if (!$marker) {
        console.log(`no fragment with marker "${marker}" found`);
        return;
      }
      let $fragment = $marker.closest('main > div');
      const $markerContainer = $marker.parentNode;
      if ($markerContainer.children.length === 1) {
        // empty section with marker, remove and use content from next section
        const $emptyFragment = $markerContainer.parentNode;
        $fragment = $emptyFragment.nextElementSibling;
        $emptyFragment.remove();
      }
      if (!$fragment) {
        console.log(`no content found for fragment "${marker}"`);
        return;
      }
      setTimeout(() => {
        $cell.innerHTML = '';
        Array.from($fragment.children).forEach(($elem) => $cell.appendChild($elem));
        $marker.remove();
        $fragment.remove();
        console.log(`fragment "${marker}" resolved`);
      }, 500);
    });
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const blockName = block.classList[0];
  if (blockName) {
    const section = block.closest('.section');
    if (section) section.classList.add(`${[...block.classList].join('-')}-container`);

    // begin CCX custom block option class handling
    // split and add options with a dash
    // (fullscreen-center -> fullscreen-center + fullscreen + center)
    const extra = [];
    block.classList.forEach((className, index) => {
      if (index === 0) return; // block name, no split
      const split = className.split('-');
      if (split.length > 1) {
        split.forEach((part) => {
          extra.push(part);
        });
      }
    });
    block.classList.add(...extra);
    // end CCX custom block option class handling

    block.classList.add('block');

    block.setAttribute('data-block-name', blockName);
    block.setAttribute('data-block-status', 'initialized');
    const blockWrapper = block.parentElement;
    blockWrapper.classList.add(`${blockName}-wrapper`);
  }
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
function decorateBlocks(main) {
  main
    .querySelectorAll('div.section > div > div')
    .forEach((block) => decorateBlock(block));
}

function decorateMarqueeColumns($main) {
  // flag first columns block in first section block as marquee
  const $sectionSplitByHighlight = $main.querySelector('.split-by-app-store-highlight');
  const $firstColumnsBlock = $main.querySelector('.section:first-of-type .columns:first-of-type');

  if ($sectionSplitByHighlight) {
    $sectionSplitByHighlight.querySelector('.columns.fullsize.center').classList.add('columns-marquee');
  } else if ($firstColumnsBlock) {
    $firstColumnsBlock.classList.add('columns-marquee');
  }
}

/**
 * scroll to hash
 */

export function scrollToHash() {
  const { hash } = window.location;
  if (hash) {
    const elem = document.querySelector(hash);
    if (elem) {
      setTimeout(() => {
        elem.scrollIntoView({
          block: 'start',
          behavior: 'smooth',
        });
      }, 500);
    }
  }
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block, eager = false) {
  if (!(block.getAttribute('data-block-status') === 'loading' || block.getAttribute('data-block-status') === 'loaded')) {
    block.setAttribute('data-block-status', 'loading');
    const blockName = block.getAttribute('data-block-name');
    let cssPath = `/express/blocks/${blockName}/${blockName}.css`;
    let jsPath = `/express/blocks/${blockName}/${blockName}.js`;

    if (window.hlx.experiment && window.hlx.experiment.run) {
      const { experiment } = window.hlx;
      if (experiment.selectedVariant !== 'control') {
        const { control } = experiment.variants;
        if (control && control.blocks && control.blocks.includes(blockName)) {
          const blockIndex = control.blocks.indexOf(blockName);
          const variant = experiment.variants[experiment.selectedVariant];
          const blockPath = variant.blocks[blockIndex];
          cssPath = `/express/experiments/${experiment.id}/${blockPath}/${blockName}.css`;
          jsPath = `/express/experiments/${experiment.id}/${blockPath}/${blockName}.js`;
        }
      }
    }

    try {
      const cssLoaded = new Promise((resolve) => {
        loadCSS(cssPath, resolve);
      });
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(jsPath);
            if (mod.default) {
              await mod.default(block, blockName, document, eager);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(`failed to load module for ${blockName}`, err);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`failed to load block ${blockName}`, err);
    }
    block.setAttribute('data-block-status', 'loaded');
  }
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
export async function loadBlocks(main) {
  updateSectionsStatus(main);
  const blocks = [...main.querySelectorAll('div.block')];
  for (let i = 0; i < blocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(blocks[i]);
    updateSectionsStatus(main);
  }
  return blocks;
}

export function loadScript(url, callback, type) {
  const $head = document.querySelector('head');
  const $script = createTag('script', { src: url });
  if (type) {
    $script.setAttribute('type', type);
  }
  $head.append($script);
  $script.onload = callback;
  return $script;
}

export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const $meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return ($meta && $meta.content) || '';
}

/**
 * fetches the string variables.
 * @returns {object} localized variables
 */

export async function fetchPlaceholders() {
  const requestPlaceholders = async (url) => {
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      window.placeholders = {};
      json.data.forEach((placeholder) => {
        window.placeholders[toClassName(placeholder.Key)] = placeholder.Text;
      });
    }
  };
  if (!window.placeholders) {
    try {
      const locale = getLocale(window.location);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      await requestPlaceholders(`${urlPrefix}/express/placeholders.json`);
    } catch {
      await requestPlaceholders('/express/placeholders.json');
    }
  }
  return window.placeholders;
}

function addPromotion() {
  // check for existing promotion
  if (!document.querySelector('main .promotion')) {
    // extract category from metadata
    const category = getMetadata('category');
    if (category) {
      const promos = {
        photo: 'photoshop',
        design: 'illustrator',
        video: 'premiere',
      };
      // insert promotion at the bottom
      if (promos[category]) {
        const $promoSection = createTag('div', { class: 'section' });
        $promoSection.innerHTML = `<div class="promotion" data-block-name="promotion"><div><div>${promos[category]}</div></div></div>`;
        document.querySelector('main').append($promoSection);
        loadBlock($promoSection.querySelector(':scope .promotion'));
      }
    }
  }
}

function loadMartech() {
  const usp = new URLSearchParams(window.location.search);
  const martech = usp.get('martech');

  const analyticsUrl = '/express/scripts/instrument.js';
  if (!(martech === 'off' || document.querySelector(`head script[src="${analyticsUrl}"]`))) {
    loadScript(analyticsUrl, null, 'module');
  }
}

function loadGnav() {
  const usp = new URLSearchParams(window.location.search);
  const gnav = usp.get('gnav') || getMetadata('gnav');

  const gnavUrl = '/express/scripts/gnav.js';
  if (!(gnav === 'off' || document.querySelector(`head script[src="${gnavUrl}"]`))) {
    loadScript(gnavUrl, null, 'module');
  }
}

function decoratePageStyle() {
  const isBlog = document.body.classList.contains('blog');
  const $h1 = document.querySelector('main h1');
  // check if h1 is inside a block

  if (isBlog) {
    // eslint-disable-next-line import/no-unresolved,import/no-absolute-path
    import('/express/scripts/blog.js')
      .then((mod) => {
        if (mod.default) {
          mod.default();
        }
      })
      .catch((err) => console.log('failed to load blog', err));
    loadCSS('/express/styles/blog.css');
  } else {
    // eslint-disable-next-line no-lonely-if
    if ($h1 && !$h1.closest('.section > div > div ')) {
      const $heroPicture = $h1.parentElement.querySelector('picture');
      let $heroSection;
      const $main = document.querySelector('main');
      if ($main.children.length === 1) {
        $heroSection = createTag('div', { class: 'hero' });
        const $div = createTag('div');
        $heroSection.append($div);
        if ($heroPicture) {
          $div.append($heroPicture);
        }
        $div.append($h1);
        $main.prepend($heroSection);
      } else {
        $heroSection = $h1.closest('.section');
        $heroSection.classList.add('hero');
        $heroSection.removeAttribute('style');
      }
      if ($heroPicture) {
        if (!isBlog) {
          $heroPicture.classList.add('hero-bg');
        }
      } else {
        $heroSection.classList.add('hero-noimage');
      }
    }
  }
}

export function addSearchQueryToHref(href) {
  const isCreateSeoPage = window.location.pathname.includes('/express/create/');
  const isDiscoverSeoPage = window.location.pathname.includes('/express/discover/');
  const isPostEditorLink = postEditorLinksAllowList.some((editorLink) => href.includes(editorLink));

  if (!(isPostEditorLink && (isCreateSeoPage || isDiscoverSeoPage))) {
    return href;
  }

  const templateSearchTag = getMetadata('short-title');
  const url = new URL(href);
  const params = url.searchParams;

  if (templateSearchTag) {
    params.set('search', templateSearchTag);
  }
  url.search = params.toString();

  return url.toString();
}

export function decorateButtons(block = document) {
  const noButtonBlocks = ['template-list', 'icon-list'];
  block.querySelectorAll(':scope a').forEach(($a) => {
    const originalHref = $a.href;
    const linkText = $a.textContent.trim();
    if ($a.children.length > 0) {
      // We can use this to eliminate styling so only text
      // propagates to buttons.
      $a.innerHTML = $a.innerHTML.replaceAll('<u>', '').replaceAll('</u>', '');
    }
    $a.href = addSearchQueryToHref($a.href);
    $a.title = $a.title || linkText;
    const $block = $a.closest('div.section > div > div');
    let blockName;
    if ($block) {
      blockName = $block.className;
    }
    if (!noButtonBlocks.includes(blockName)
      && originalHref !== linkText
      && !(linkText.startsWith('https') && linkText.includes('/media_'))
      && !linkText.includes('hlx.blob.core.windows.net')
      && !linkText.endsWith(' >')
      && !linkText.endsWith(' ›')) {
      const $up = $a.parentElement;
      const $twoup = $a.parentElement.parentElement;
      if (!$a.querySelector('img')) {
        if ($up.childNodes.length === 1 && ($up.tagName === 'P' || $up.tagName === 'DIV')) {
          $a.className = 'button accent'; // default
          $up.classList.add('button-container');
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'STRONG'
          && $twoup.children.length === 1 && $twoup.tagName === 'P') {
          $a.className = 'button accent';
          $twoup.classList.add('button-container');
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'EM'
          && $twoup.children.length === 1 && $twoup.tagName === 'P') {
          $a.className = 'button accent light';
          $twoup.classList.add('button-container');
        }
      }
      if (linkText.startsWith('{{icon-') && linkText.endsWith('}}')) {
        const $iconName = /{{icon-([\w-]+)}}/g.exec(linkText)[1];
        if ($iconName) {
          const $icon = getIcon($iconName, `${$iconName} icon`);
          $a.innerHTML = $icon;
          $a.classList.remove('button', 'primary', 'secondary', 'accent');
          $a.title = $iconName;
        }
      }
    }
  });
}

// function decorateTemplate() {
//   if (window.location.pathname.includes('/make/')) {
//     document.body.classList.add('make-page');
//   }
//   const year = window.location.pathname.match(/\/20\d\d\//);
//   if (year) {
//     document.body.classList.add('blog-page');
//   }
// }

// function decorateLegacyLinks() {
//   const legacy = 'https://blog.adobespark.com/';
//   document.querySelectorAll(`a[href^="${legacy}"]`).forEach(($a) => {
//     // eslint-disable-next-line no-console
//     console.log($a);
//     $a.href = $a.href.substring(0, $a.href.length - 1).substring(legacy.length - 1);
//   });
// }

export function checkTesting() {
  return (getMeta('testing').toLowerCase() === 'on');
}

/**
 * Sanitizes a string and turns it into camel case.
 * @param {*} name The unsanitized string
 * @returns {string} The camel cased string
 */
export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Gets the experiment name, if any for the page based on env, useragent, queyr params
 * @returns {string} experimentid
 */
export function getExperiment() {
  let experiment = toClassName(getMeta('experiment'));

  if (!window.location.host.includes('adobe.com') && !window.location.host.includes('.hlx.live')) {
    experiment = '';
    // reason = 'not prod host';
  }
  if (window.location.hash) {
    experiment = '';
    // reason = 'suppressed by #';
  }

  if (navigator.userAgent.match(/bot|crawl|spider/i)) {
    experiment = '';
    // reason = 'bot detected';
  }

  const usp = new URLSearchParams(window.location.search);
  if (usp.has('experiment')) {
    [experiment] = usp.get('experiment').split('/');
  }

  return experiment;
}
/**
 * Gets experiment config from the manifest or the instant experiement
 * metdata and transforms it to more easily consumable structure.
 *
 * the manifest consists of two sheets "settings" and "experiences"
 *
 * "settings" is applicable to the entire test and contains information
 * like "Audience", "Status" or "Blocks".
 *
 * "experience" hosts the experiences in columns, consisting of:
 * a "Percentage Split", "Label" and a set of "Pages".
 *
 *
 * @param {string} experimentId
 * @returns {object} containing the experiment manifest
 */
export async function getExperimentConfig(experimentId) {
  const instantExperiment = getMeta('instant-experiment');
  if (instantExperiment) {
    const config = {
      experimentName: `Instant Experiment: ${experimentId}`,
      audience: '',
      status: 'Active',
      id: experimentId,
      variants: {},
      variantNames: [],
    };

    const pages = instantExperiment.split(',').map((p) => new URL(p.trim()).pathname);
    const evenSplit = 1 / (pages.length + 1);

    config.variantNames.push('control');
    config.variants.control = {
      percentageSplit: '',
      pages: [window.location.pathname],
      blocks: [],
      label: 'Control',
    };

    pages.forEach((page, i) => {
      const vname = `challenger-${i + 1}`;
      config.variantNames.push(vname);
      config.variants[vname] = {
        percentageSplit: `${evenSplit}`,
        pages: [page],
        label: `Challenger ${i + 1}`,
      };
    });

    return (config);
  } else {
    const path = `/express/experiments/${experimentId}/manifest.json`;
    try {
      const config = {};
      const resp = await fetch(path);
      const json = await resp.json();
      json.settings.data.forEach((line) => {
        const key = toCamelCase(line.Name);
        config[key] = line.Value;
      });
      config.id = experimentId;
      config.manifest = path;
      const variants = {};
      let variantNames = Object.keys(json.experiences.data[0]);
      variantNames.shift();
      variantNames = variantNames.map((vn) => toCamelCase(vn));
      variantNames.forEach((variantName) => {
        variants[variantName] = {};
      });
      let lastKey = 'default';
      json.experiences.data.forEach((line) => {
        let key = toCamelCase(line.Name);
        if (!key) key = lastKey;
        lastKey = key;
        const vns = Object.keys(line);
        vns.shift();
        vns.forEach((vn) => {
          const camelVN = toCamelCase(vn);
          if (key === 'pages' || key === 'blocks') {
            variants[camelVN][key] = variants[camelVN][key] || [];
            if (key === 'pages') variants[camelVN][key].push(new URL(line[vn]).pathname);
            else variants[camelVN][key].push(line[vn]);
          } else {
            variants[camelVN][key] = line[vn];
          }
        });
      });
      config.variants = variants;
      config.variantNames = variantNames;
      console.log(config);
      return config;
    } catch (e) {
      console.log(`error loading experiment manifest: ${path}`, e);
    }
    return null;
  }
}

/**
 * Replaces element with content from path
 * @param {string} path
 * @param {HTMLElement} element
 */
async function replaceInner(path, element) {
  const plainPath = `${path}.plain.html`;
  try {
    const resp = await fetch(plainPath);
    const html = await resp.text();
    element.innerHTML = html;
  } catch (e) {
    console.log(`error loading experiment content: ${plainPath}`, e);
  }
  return null;
}

/**
 * this is an extensible stub to take on audience mappings
 * @param {string} audience
 * @return {boolean} is member of this audience
 */

function checkExperimentAudience(audience) {
  if (audience === 'mobile') {
    return window.innerWidth < 600;
  }
  if (audience === 'desktop') {
    return window.innerWidth > 600;
  }
  return true;
}

/**
 * Generates a decision policy object which is understood by UED from an
 * experiment configuration.
 * @param {*} config Experiment configuration
 * @returns Experiment decision policy object to be passed to UED.
 */
function getDecisionPolicy(config) {
  const decisionPolicy = {
    id: 'content-experimentation-policy',
    rootDecisionNodeId: 'n1',
    decisionNodes: [{
      id: 'n1',
      type: 'EXPERIMENTATION',
      experiment: {
        id: config.id,
        identityNamespace: 'ECID',
        randomizationUnit: 'DEVICE',
        treatments: Object.entries(config.variants).map(([key, props]) => ({
          id: key,
          allocationPercentage: props.percentageSplit
            ? parseFloat(props.percentageSplit) * 100
            : 100 - Object.values(config.variants).reduce((result, variant) => {
              const returnResult = result - (parseFloat(variant.percentageSplit || 0) * 100);
              return returnResult;
            }, 100),
        })),
      },
    }],
  };
  return decisionPolicy;
}

/**
 * checks if a test is active on this page and if so executes the test
 */
async function decorateTesting() {
  try {
    // let reason = '';
    const usp = new URLSearchParams(window.location.search);

    const experiment = getExperiment();
    const [forcedExperiment, forcedVariant] = usp.get('experiment') ? usp.get('experiment').split('/') : [];

    if (experiment) {
      console.log('experiment', experiment);
      const config = await getExperimentConfig(experiment);
      console.log('config -->', config);
      if (config && (toCamelCase(config.status) === 'active' || forcedExperiment)) {
        config.run = forcedExperiment || checkExperimentAudience(toClassName(config.audience));
        console.log('run', config.run, config.audience);

        window.hlx = window.hlx || {};
        if (config.run) {
          window.hlx.experiment = config;
          if (forcedVariant && config.variantNames.includes(forcedVariant)) {
            config.selectedVariant = forcedVariant;
          } else {
            const ued = await import('./ued/ued-0.2.0.js');
            const decision = ued.evaluateDecisionPolicy(getDecisionPolicy(config), {});
            config.selectedVariant = decision.items[0].id;
          }
          sampleRUM('experiment', { source: config.id, target: config.selectedVariant });
          console.log(`running experiment (${window.hlx.experiment.id}) -> ${window.hlx.experiment.selectedVariant}`);
          // populate ttMETA with hlx experimentation details
          window.ttMETA = window.ttMETA || [];
          const experimentDetails = {
            CampaignId: window.hlx.experiment.id,
            CampaignName: window.hlx.experiment.experimentName,
            OfferId: window.hlx.experiment.selectedVariant,
            OfferName: window.hlx.experiment.variants[window.hlx.experiment.selectedVariant].label,
          };
          window.ttMETA.push(experimentDetails);
          // add hlx experiment details as dynamic variables
          // for Content Square integration
          // eslint-disable-next-line no-underscore-dangle
          if (window._uxa) {
            for (const propName of Object.keys(experimentDetails)) {
              // eslint-disable-next-line no-underscore-dangle
              window._uxa.push(['trackDynamicVariable', { key: propName, value: experimentDetails[propName] }]);
            }
          }
          if (config.selectedVariant !== 'control') {
            const currentPath = window.location.pathname;
            const pageIndex = config.variants.control.pages.indexOf(currentPath);
            console.log(pageIndex, config.variants.control.pages, currentPath);
            if (pageIndex >= 0) {
              const page = config.variants[config.selectedVariant].pages[pageIndex];
              if (page) {
                const experimentPath = new URL(page, window.location.href).pathname.split('.')[0];
                if (experimentPath && experimentPath !== currentPath) {
                  await replaceInner(experimentPath, document.querySelector('main'));
                }
              }
            }
          }
        }
      }
    }
    const martech = usp.get('martech');
    if ((checkTesting() && (martech !== 'off') && (martech !== 'delay')) || martech === 'rush') {
      // eslint-disable-next-line no-console
      console.log('rushing martech');
      loadScript('/express/scripts/instrument.js', null, 'module');
    }
  } catch (e) {
    console.log('error testing', e);
  }
}

export async function fixIcons(block = document) {
  /* backwards compatible icon handling, deprecated */
  block.querySelectorAll('svg use[href^="./_icons_"]').forEach(($use) => {
    $use.setAttribute('href', `/express/icons.svg#${$use.getAttribute('href').split('#')[1]}`);
  });
  const placeholders = await fetchPlaceholders();
  /* new icons handling */
  block.querySelectorAll('img').forEach(($img) => {
    const alt = $img.getAttribute('alt');
    if (alt) {
      const lowerAlt = alt.toLowerCase();
      if (lowerAlt.includes('icon:')) {
        const [icon, mobileIcon] = lowerAlt
          .split(';')
          .map((i) => {
            if (i) {
              return toClassName(i.split(':')[1].trim());
            }
            return null;
          });
        let altText = null;
        if (placeholders[icon]) {
          altText = placeholders[icon];
        } else if (placeholders[mobileIcon]) {
          altText = placeholders[mobileIcon];
        }
        const $picture = $img.closest('picture');
        const $block = $picture.closest('.block');
        let size = 44;
        if ($block) {
          const blockName = $block.getAttribute('data-block-name');
          // use small icons in .columns (except for .columns.offer)
          if (blockName === 'columns') {
            size = $block.classList.contains('offer') ? 44 : 22;
          } else if (blockName === 'toc') {
            // ToC block has its own logic
            return;
          }
        }
        $picture.parentElement
          .replaceChild(getIconElement([icon, mobileIcon], size, altText), $picture);
      }
    }
  });
}

function unwrapBlock($block) {
  const $section = $block.parentNode;
  const $elems = [...$section.children];
  const $blockSection = createTag('div');
  const $postBlockSection = createTag('div');
  const $nextSection = $section.nextElementSibling;
  $section.parentNode.insertBefore($blockSection, $nextSection);
  $section.parentNode.insertBefore($postBlockSection, $nextSection);

  let $appendTo;
  $elems.forEach(($e) => {
    if ($e === $block || ($e.className === 'section-metadata')) {
      $appendTo = $blockSection;
    }

    if ($appendTo) {
      $appendTo.appendChild($e);
      $appendTo = $postBlockSection;
    }
  });

  if (!$postBlockSection.hasChildNodes()) {
    $postBlockSection.remove();
  }
}

export function normalizeHeadings(block, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  block.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level}>${tag.textContent.trim()}</h${level}>`;
      }
    }
  });
}

export async function fetchPlainBlockFromFragment(url, blockName) {
  const location = new URL(window.location);
  const locale = getLocale(location);
  let fragmentUrl;
  if (locale === 'us') {
    fragmentUrl = `${location.origin}${url}`;
  } else {
    fragmentUrl = `${location.origin}/${locale}${url}`;
  }

  const path = new URL(fragmentUrl).pathname.split('.')[0];
  const resp = await fetch(`${path}.plain.html`);
  if (resp.status === 404) {
    return null;
  } else {
    const html = await resp.text();
    const section = createTag('div');
    section.innerHTML = html;
    section.className = `section section-wrapper ${blockName}-container`;
    const block = section.querySelector(`.${blockName}`);
    block.dataset.blockName = blockName;
    block.dataset.blockStatus = 'loaded';
    block.parentElement.className = `${blockName}-wrapper`;
    block.classList.add('block');
    const img = section.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'lazy');
    }
    return section;
  }
}

export async function fetchFloatingCta(path) {
  const env = getHelixEnv();
  const dev = new URLSearchParams(window.location.search).get('dev');
  const { experiment } = window.hlx;
  const experimentStatus = experiment ? experiment.status.toLocaleLowerCase() : null;
  let spreadsheet;
  let floatingBtnData;

  async function fetchFloatingBtnData(sheet) {
    if (!window.floatingCta) {
      try {
        const locale = getLocale(window.location);
        const urlPrefix = locale === 'us' ? '' : `/${locale}`;
        const resp = await fetch(`${urlPrefix}${sheet}`);
        window.floatingCta = resp.ok ? (await resp.json()).data : [];
      } catch {
        const resp = await fetch(sheet);
        window.floatingCta = resp.ok ? (await resp.json()).data : [];
      }
    }

    if (window.floatingCta.length) {
      const candidates = window.floatingCta.filter((p) => {
        const urlToMatch = p.path.includes('*') ? convertGlobToRe(p.path) : p.path;
        if (experiment && path !== 'default') {
          return (path === p.path || path.match(urlToMatch))
            && p.expID === experiment.run
            && p.challengerID === experiment.selectedVariant;
        } else {
          return path === p.path || path.match(urlToMatch);
        }
      }).sort((a, b) => b.path.length - a.path.length);

      if (env && env.name === 'stage') {
        return candidates[0] || null;
      }

      return candidates[0] && candidates[0].live !== 'N' ? candidates[0] : null;
    }
    return null;
  }

  if (['yes', 'true', 'on'].includes(dev) && env && env.name === 'stage') {
    spreadsheet = '/express/floating-cta-dev.json?limit=100000';
  } else {
    spreadsheet = '/express/floating-cta.json?limit=100000';
  }

  if (experimentStatus === 'active') {
    const expSheet = '/express/experiments/floating-cta-experiments.json?limit=100000';
    floatingBtnData = await fetchFloatingBtnData(expSheet);
  }

  if (!floatingBtnData) {
    floatingBtnData = await fetchFloatingBtnData(spreadsheet);
  }
  return floatingBtnData;
}

async function buildAutoBlocks($main) {
  const $lastDiv = $main.querySelector(':scope > div:last-of-type');

  // Load the branch.io banner autoblock...
  if (['yes', 'true', 'on'].includes(getMetadata('show-banner').toLowerCase())) {
    const branchio = buildBlock('branch-io', '');
    if ($lastDiv) {
      $lastDiv.append(branchio);
    }
  }

  if (['yes', 'true', 'on'].includes(getMetadata('show-relevant-rows').toLowerCase())) {
    const authoredRRFound = [
      '.template-list.horizontal.fullwidth.mini',
      '.link-list.noarrows',
      '.collapsible-card',
    ].every((block) => $main.querySelector(block));

    if (!authoredRRFound && !window.relevantRowsLoaded) {
      const relevantRowsData = await fetchRelevantRows(window.location.pathname);

      if (relevantRowsData) {
        const $relevantRowsSection = createTag('div');
        const $fragment = buildBlock('fragment', '/express/fragments/relevant-rows-default-v2');
        $relevantRowsSection.dataset.audience = 'mobile';
        $relevantRowsSection.append($fragment);
        $main.insertBefore($relevantRowsSection, $main.firstElementChild.nextSibling);
        window.relevantRowsLoaded = true;
      }
    }
  }

  // Load the app store autoblocks...
  if (['yes', 'true', 'on'].includes(getMetadata('show-standard-app-store-blocks').toLowerCase())) {
    const $highlight = buildBlock('app-store-highlight', '');
    if ($lastDiv) {
      $lastDiv.append($highlight);
    }

    const $blade = buildBlock('app-store-blade', '');
    if ($lastDiv) {
      $lastDiv.append($blade);
    }
  }

  if (['yes', 'true', 'on'].includes(getMetadata('show-plans-comparison').toLowerCase())) {
    const $plansComparison = buildBlock('plans-comparison', '');
    if ($lastDiv) {
      $lastDiv.append($plansComparison);
    }
  }

  if (['yes', 'true', 'on'].includes(getMetadata('show-floating-cta').toLowerCase()) || ['yes', 'true', 'on'].includes(getMetadata('show-multifunction-button').toLowerCase())) {
    if (!window.floatingCtasLoaded) {
      const floatingCTAData = await fetchFloatingCta(window.location.pathname);
      const validButtonVersion = ['floating-button', 'multifunction-button', 'bubble-ui-button', 'floating-panel'];
      const device = document.body.dataset?.device;
      const blockName = floatingCTAData?.[device];
      if (validButtonVersion.includes(blockName) && $lastDiv) {
        const button = buildBlock(blockName, device);
        button.classList.add('spreadsheet-powered');
        $lastDiv.append(button);
      }

      window.floatingCtasLoaded = true;
    }
  }

  if (getMetadata('show-quick-action-card') && !['no', 'false', 'off'].includes(getMetadata('show-quick-action-card').toLowerCase())) {
    const fragmentName = getMetadata('show-quick-action-card').toLowerCase();
    const quickActionCardBlock = buildBlock('quick-action-card', fragmentName);
    quickActionCardBlock.classList.add('spreadsheet-powered');
    if ($lastDiv) {
      $lastDiv.append(quickActionCardBlock);
    }
  }
}

function splitSections($main) {
  // check if there are more than one columns.fullsize-center. If so, don't split.
  const multipleColumns = $main.querySelectorAll('.columns.fullsize-center').length > 1;
  $main.querySelectorAll(':scope > div > div').forEach(($block) => {
    const hasAppStoreBlocks = ['yes', 'true', 'on'].includes(getMetadata('show-standard-app-store-blocks').toLowerCase());
    const blocksToSplit = ['template-list', 'layouts', 'banner', 'faq', 'promotion', 'fragment', 'app-store-highlight', 'app-store-blade', 'plans-comparison'];
    // work around for splitting columns and sixcols template list
    // add metadata condition to minimize impact on other use cases
    if (hasAppStoreBlocks && !multipleColumns) {
      blocksToSplit.push('columns fullsize-center');
    }
    if (blocksToSplit.includes($block.className)) {
      unwrapBlock($block);
    }

    if (hasAppStoreBlocks && $block.className.includes('columns fullsize-center')) {
      const $parentNode = $block.parentNode;
      if ($parentNode && !multipleColumns) {
        $parentNode.classList.add('split-by-app-store-highlight');
      }
    }
  });
}

function setTheme() {
  let theme = getMeta('theme');
  if (!theme && (window.location.pathname.startsWith('/express')
    || window.location.pathname.startsWith('/education')
    || window.location.pathname.startsWith('/drafts'))) {
    // mega nav, suppress brand header
    theme = 'no-brand-header';
  }
  const { body } = document;
  if (theme) {
    let themeClass = toClassName(theme);
    /* backwards compatibility can be removed again */
    if (themeClass === 'nobrand') themeClass = 'no-desktop-brand-header';
    body.classList.add(themeClass);
    if (themeClass === 'blog') body.classList.add('no-brand-header');
  }
  body.dataset.device = navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop';
}

function decorateLinkedPictures($main) {
  /* thanks to word online */
  $main.querySelectorAll(':scope > picture').forEach(($picture) => {
    if (!$picture.closest('div.block')) {
      linkPicture($picture);
    }
  });
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.replaceWith(link);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

function decorateSocialIcons($main) {
  $main.querySelectorAll(':scope a').forEach(($a) => {
    if ($a.href === $a.textContent.trim()) {
      let icon = '';
      if ($a.href.startsWith('https://www.instagram.com')) {
        icon = 'instagram';
      }
      if ($a.href.startsWith('https://twitter.com')) {
        icon = 'twitter';
      }
      if ($a.href.startsWith('https://www.pinterest.')) {
        icon = 'pinterest';
      }
      if ($a.href.startsWith('https://www.facebook.')) {
        icon = 'facebook';
      }
      if ($a.href.startsWith('https://www.linkedin.com')) {
        icon = 'linkedin';
      }
      if ($a.href.startsWith('https://www.youtube.com')) {
        icon = 'youtube';
      }
      if ($a.href.startsWith('https://www.tiktok.com')) {
        icon = 'tiktok';
      }
      const $parent = $a.parentElement;
      if (!icon && $parent.previousElementSibling && $parent.previousElementSibling.classList.contains('social-links')) {
        icon = 'globe';
      }

      if (icon) {
        $a.innerHTML = '';
        const $icon = getIconElement(icon, 22);
        $icon.classList.add('social');
        $a.appendChild($icon);
        if ($parent.previousElementSibling && $parent.previousElementSibling.classList.contains('social-links')) {
          $parent.previousElementSibling.appendChild($a);
          $parent.remove();
        } else {
          $parent.classList.add('social-links');
        }
      }
    }
  });
}

function makeRelativeLinks($main) {
  $main.querySelectorAll('a').forEach(($a) => {
    if (!$a.href) return;
    try {
      const {
        protocol, hostname, pathname, search, hash,
      } = new URL($a.href);
      if (hostname.endsWith('.page')
        || hostname.endsWith('.live')
        || ['www.adobe.com', 'www.stage.adobe.com'].includes(hostname)) {
        // make link relative
        $a.href = `${pathname}${search}${hash}`;
      } else if (hostname !== 'adobesparkpost.app.link'
        && !['tel:', 'mailto:', 'sms:'].includes(protocol)) {
        // open external links in a new tab
        $a.target = '_blank';
      }
    } catch (e) {
      // invalid url
    }
  });
}

function displayOldLinkWarning() {
  if (window.location.hostname.includes('localhost') || window.location.hostname.includes('.hlx.page')) {
    document.querySelectorAll('main a[href^="https://spark.adobe.com/"]').forEach(($a) => {
      const url = new URL($a.href);
      console.log(`old link: ${url}`);
      $a.style.border = '10px solid red';
    });
  }
}

function setHelixEnv(name, overrides) {
  if (name) {
    sessionStorage.setItem('helix-env', name);
    if (overrides) {
      sessionStorage.setItem('helix-env-overrides', JSON.stringify(overrides));
    } else {
      sessionStorage.removeItem('helix-env-overrides');
    }
  } else {
    sessionStorage.removeItem('helix-env');
    sessionStorage.removeItem('helix-env-overrides');
  }
}

function displayEnv() {
  try {
    /* setup based on URL Params */
    const usp = new URLSearchParams(window.location.search);
    if (usp.has('helix-env')) {
      const env = usp.get('helix-env');
      setHelixEnv(env);
    }

    /* setup based on referrer */
    if (document.referrer) {
      const url = new URL(document.referrer);
      const expressEnvs = ['express-stage.adobe.com', 'express-qa.adobe.com', 'express-dev.adobe.com'];
      if (url.hostname.endsWith('.adobeprojectm.com') || expressEnvs.includes(url.hostname)) {
        setHelixEnv('stage', { spark: url.host });
      }
      if (window.location.hostname !== url.hostname) {
        console.log(`external referrer detected: ${document.referrer}`);
      }
    }

    const env = sessionStorage.getItem('helix-env');
    if (env) {
      const $helixEnv = createTag('div', { class: 'helix-env' });
      $helixEnv.textContent = env + (getHelixEnv() ? '' : ' [not found]');
      document.body.appendChild($helixEnv);
    }
  } catch (e) {
    console.log(`display env failed: ${e.message}`);
  }
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {string} alt The alt text of the image
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */

export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
function decoratePictures(main) {
  main.querySelectorAll('img[src*="/media_"]').forEach((img, i) => {
    const newPicture = createOptimizedPicture(img.src, img.alt, !i);
    const picture = img.closest('picture');
    if (picture) picture.parentElement.replaceChild(newPicture, picture);
  });
}

export async function decorateMain(main) {
  removeIrrelevantSections(main);
  await buildAutoBlocks(main);
  splitSections(main);
  decorateSections(main);
  decorateButtons(main);
  decorateBlocks(main);
  decorateMarqueeColumns(main);
  await fixIcons(main);
  decoratePictures(main);
  decorateLinkedPictures(main);
  decorateSocialIcons(main);
  makeRelativeLinks(main);
}

const usp = new URLSearchParams(window.location.search);
window.spark = {};
window.spark.hostname = usp.get('hostname') || window.location.hostname;

const useAlloy = !(
  usp.has('martech')
  && usp.get('martech') === 'legacy'
);

function unhideBody() {
  try {
    const id = (
      useAlloy
        ? 'alloy-prehiding'
        : 'at-body-style'
    );
    document.head.removeChild(document.getElementById(id));
  } catch (e) {
    // nothing
  }
}

function hideBody() {
  const id = (
    useAlloy
      ? 'alloy-prehiding'
      : 'at-body-style'
  );
  let style = document.getElementById(id);
  if (style) {
    return;
  }
  style = document.createElement('style');
  style.id = (
    useAlloy
      ? 'alloy-prehiding'
      : 'at-body-style'
  );
  style.innerHTML = (
    useAlloy
      ? '.personalization-container{opacity:0.01 !important}'
      : 'body{visibility: hidden !important}'
  );

  try {
    document.head.appendChild(style);
  } catch (e) {
    // nothing
  }
}

export function addAnimationToggle(target) {
  target.addEventListener('click', () => {
    const videos = target.querySelectorAll('video');
    const paused = videos[0] ? videos[0].paused : false;
    videos.forEach((video) => {
      if (paused) video.play();
      else video.pause();
    });
  }, true);
}

/**
 * Searches for Japanese text in headings and applies a smart word-breaking algorithm by surrounding
 * semantic blocks with spans. This allows browsers to break japanese sentences correctly.
 */
async function wordBreakJapanese() {
  if (getLocale(window.location) !== 'jp') {
    return;
  }
  const { loadDefaultJapaneseParser } = await import('./budoux-index-ja.min.js');
  const parser = loadDefaultJapaneseParser();
  document.querySelectorAll('h1, h2, h3, h4, h5').forEach((el) => {
    el.classList.add('budoux');
    parser.applyElement(el);
  });

  const BalancedWordWrapper = (await import('./bw2.js')).default;
  const bw2 = new BalancedWordWrapper();
  document.querySelectorAll('h1, h2, h3, h4, h5').forEach((el) => {
    // apply balanced word wrap to headings
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        bw2.applyElement(el);
      });
    } else {
      window.setTimeout(() => {
        bw2.applyElement(el);
      }, 1000);
    }
  });
}

/**
 * Calculate a relatively more accurate "character count" for mixed Japanese
 * + English texts, for the purpose of heading auto font sizing.
 *
 * The rationale is that English characters are usually narrower than Japanese
 * ones. Hence each English character (and space character) is multiplied by an
 * coefficient before being added to the total character count. The current
 * coefficient value, 0.57, is an empirical value from some tests.
 */
function getJapaneseTextCharacterCount(text) {
  const headingEngCharsRegEx = /[a-zA-Z0-9 ]+/gm;
  const matches = text.matchAll(headingEngCharsRegEx);
  const eCnt = [...matches].map((m) => m[0]).reduce((cnt, m) => cnt + m.length, 0);
  const jtext = text.replaceAll(headingEngCharsRegEx, '');
  const jCnt = jtext.length;
  return eCnt * 0.57 + jCnt;
}

/**
 * Add dynamic font sizing CSS class names to headings
 *
 * The CSS class names are determined by character counts.
 * @param {Element} $block The container element
 * @param {string} classPrefix Prefix in CSS class names before "-long", "-very-long", "-x-long".
 * Default is "heading".
 * @param {string} selector CSS selector to select the target heading tags. Default is "h1, h2".
 */
export function addHeaderSizing($block, classPrefix = 'heading', selector = 'h1, h2') {
  const headings = $block.querySelectorAll(selector);
  // Each threshold of JP should be smaller than other languages
  // because JP characters are larger and JP sentences are longer
  const sizes = getLocale(window.location) === 'jp'
    ? [
      { name: 'long', threshold: 8 },
      { name: 'very-long', threshold: 11 },
      { name: 'x-long', threshold: 15 },
    ]
    : [
      { name: 'long', threshold: 30 },
      { name: 'very-long', threshold: 40 },
      { name: 'x-long', threshold: 50 },
    ];
  headings.forEach((h) => {
    const length = getLocale(window.location) === 'jp'
      ? getJapaneseTextCharacterCount(h.textContent.trim())
      : h.textContent.trim().length;
    sizes.forEach((size) => {
      if (length >= size.threshold) h.classList.add(`${classPrefix}-${size.name}`);
    });
  });
}

/**
 * Call `addHeaderSizing` on default content blocks in all section blocks
 * in all Japanese pages except blog pages.
 */
function addJapaneseSectionHeaderSizing() {
  if (getLocale(window.location) === 'jp') {
    document.querySelectorAll('body:not(.blog) .section .default-content-wrapper').forEach((el) => {
      addHeaderSizing(el);
    });
  }
}

/**
 * Detects legal copy based on a * or † prefix and applies a smaller font size.
 * @param {HTMLMainElement} main The main element
 */
function decorateLegalCopy(main) {
  const legalCopyPrefixes = ['*', '†'];
  main.querySelectorAll('p').forEach(($p) => {
    const pText = $p.textContent.trim() ? $p.textContent.trim().charAt(0) : '';
    if (pText && legalCopyPrefixes.includes(pText)) {
      $p.classList.add('legal-copy');
    }
  });
}

/**
 * loads everything needed to get to LCP.
 */
async function loadEager(main) {
  setTheme();
  if (main) {
    const language = getLanguage(getLocale(window.location));
    const langSplits = language.split('-');
    langSplits.pop();
    const htmlLang = langSplits.join('-');
    document.documentElement.setAttribute('lang', htmlLang);
  }
  if (!window.hlx.lighthouse) await decorateTesting();

  // for backward compatibility
  // TODO: remove the href check after we tag content with sheet-powered
  if (getMetadata('sheet-powered') === 'Y' || window.location.href.includes('/express/templates/')) {
    await import('./content-replace.js');
  }

  if (getMetadata('template-search-page') === 'Y') {
    await import('./template-redirect.js');
  }

  if (main) {
    await decorateMain(main);
    decorateHeaderAndFooter();
    decoratePageStyle();
    decorateLegalCopy(main);
    addJapaneseSectionHeaderSizing();
    displayEnv();
    displayOldLinkWarning();
    wordBreakJapanese();

    const lcpBlocks = ['columns', 'hero-animation', 'hero-3d', 'template-list', 'template-x', 'floating-button', 'fullscreen-marquee', 'fullscreen-marquee-desktop', 'collapsible-card', 'search-marquee'];
    const block = document.querySelector('.block');
    const hasLCPBlock = (block && lcpBlocks.includes(block.getAttribute('data-block-name')));
    if (hasLCPBlock) await loadBlock(block, true);

    document.querySelector('body').classList.add('appear');

    if (!window.hlx.lighthouse) {
      const target = checkTesting();
      if (useAlloy) {
        document.querySelector('body').classList.add('personalization-container');
        // target = true;
      }
      if (target) {
        hideBody();
        setTimeout(() => {
          unhideBody();
        }, 3000);
      }
    }

    const lcpCandidate = document.querySelector('main img');
    await new Promise((resolve) => {
      if (lcpCandidate && !lcpCandidate.complete) {
        lcpCandidate.setAttribute('loading', 'eager');
        lcpCandidate.addEventListener('load', () => {
          resolve();
        });
        lcpCandidate.addEventListener('error', () => resolve());
      } else {
        resolve();
      }
    });
  }
}

function removeMetadata() {
  document.head.querySelectorAll('meta').forEach((meta) => {
    if (meta.content && meta.content.includes('--none--')) {
      meta.remove();
    }
  });
}

export async function buildStaticFreePlanWidget() {
  const placeholders = await fetchPlaceholders();
  const widget = createTag('div', { class: 'free-plan-widget' });
  for (let i = 1; i < 3; i += 1) {
    const tagText = placeholders[`free-plan-check-${i}`];
    const textDiv = createTag('div');
    textDiv.textContent = tagText;
    widget.append(textDiv);
  }
  return widget;
}

export async function addFreePlanWidget(elem) {
  if (elem && ['yes', 'true', 'y', 'on'].includes(getMetadata('show-free-plan').toLowerCase())) {
    const placeholders = await fetchPlaceholders();
    const widget = await buildStaticFreePlanWidget();

    document.addEventListener('planscomparisonloaded', () => {
      const $learnMoreButton = createTag('a', {
        class: 'learn-more-button',
        href: '#plans-comparison-container',
      });
      const lottieWrapper = createTag('span', { class: 'lottie-wrapper' });

      $learnMoreButton.textContent = placeholders['learn-more'];
      lottieWrapper.innerHTML = getLottie('purple-arrows', '/express/icons/purple-arrows.json');
      $learnMoreButton.append(lottieWrapper);
      lazyLoadLottiePlayer();
      widget.append($learnMoreButton);

      $learnMoreButton.addEventListener('click', (e) => {
        e.preventDefault();
        // temporarily disabling smooth scroll for accurate location
        const $html = document.querySelector('html');
        $html.style.scrollBehavior = 'unset';
        const $plansComparison = document.querySelector('.plans-comparison-container');
        $plansComparison.scrollIntoView();
        $html.style.removeProperty('scroll-behavior');
      });
    });

    elem.append(widget);
    elem.classList.add('free-plan-container');
  }
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(main) {
  // post LCP actions go here
  sampleRUM('lcp');

  loadBlocks(main);
  loadCSS('/express/styles/lazy-styles.css');
  scrollToHash();
  resolveFragments();
  addPromotion();
  removeMetadata();
  addFavIcon('/express/icons/cc-express.svg');
  if (!window.hlx.lighthouse) loadMartech();
  const tkID = TK_IDS[getLocale(window.location)];
  if (tkID) {
    const { default: loadFonts } = await import('./fonts.js');
    loadFonts(tkID, loadCSS);
  }
  sampleRUM('lazy');
  sampleRUM.observe(document.querySelectorAll('main picture > img'));
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  trackViewedAssetsInDataLayer();
}

/**
 * Decorates the page.
 */
async function decoratePage() {
  window.hlx = window.hlx || {};
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
  window.hlx.init = true;

  const main = document.querySelector('main');
  await loadEager(main);
  loadLazy(main);
  loadGnav();
  if (window.location.hostname.endsWith('hlx.page') || window.location.hostname === ('localhost')) {
    import('../../tools/preview/preview.js');
  }
}

if (!window.hlx.init && !window.isTestEnv) {
  decoratePage();
}

/*
 * lighthouse performance instrumentation helper
 * (needs a refactor)
 */

function stamp(message) {
  if (window.name.includes('performance')) {
    // eslint-disable-next-line no-console
    console.log(`${new Date() - performance.timing.navigationStart}:${message}`);
  }
}

stamp('start');

function registerPerformanceLogger() {
  try {
    const polcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      stamp(JSON.stringify(entries));
      // eslint-disable-next-line no-console
      console.log(entries[0].element);
    });
    polcp.observe({ type: 'largest-contentful-paint', buffered: true });

    const pols = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      stamp(JSON.stringify(entries));
      // eslint-disable-next-line no-console
      console.log(entries[0].sources[0].node);
    });
    pols.observe({ type: 'layout-shift', buffered: true });

    const polt = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log the entry and all associated details.
        stamp(JSON.stringify(entry));
      }
    });

    // Start listening for `longtask` entries to be dispatched.
    polt.observe({ type: 'longtask', buffered: true });

    const pores = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        stamp(`resource loaded: ${entry.name} - [${Math.round(entry.startTime + entry.duration)}]`);
      });
    });

    pores.observe({ type: 'resource', buffered: true });
  } catch (e) {
    // no output
  }
}

function getPlacement(btn) {
  const parentBlock = btn.closest('.block');
  let placement = 'outside-blocks';

  if (parentBlock) {
    const blockName = parentBlock.dataset.blockName || parentBlock.classList[0];
    const sameBlocks = btn.closest('main')?.querySelectorAll(`.${blockName}`);

    if (sameBlocks && sameBlocks.length > 1) {
      sameBlocks.forEach((b, i) => {
        if (b === parentBlock) {
          placement = `${blockName}-${i + 1}`;
        }
      });
    } else {
      placement = blockName;
    }

    if (['template-list', 'template-x'].includes(blockName) && btn.classList.contains('placeholder')) {
      placement = 'blank-template-cta';
    }
  }

  return placement;
}

export async function trackBranchParameters($links) {
  const placeholders = await fetchPlaceholders();
  const rootUrl = new URL(window.location.href);
  const rootUrlParameters = rootUrl.searchParams;

  const { experiment } = window.hlx;
  const { referrer } = window.document;
  const experimentStatus = experiment ? experiment.status.toLocaleLowerCase() : null;
  const templateSearchTag = getMetadata('short-title');
  const pageUrl = window.location.pathname;
  const sdid = rootUrlParameters.get('sdid');
  const mv = rootUrlParameters.get('mv');
  const mv2 = rootUrlParameters.get('mv2');
  const sKwcId = rootUrlParameters.get('s_kwcid');
  const efId = rootUrlParameters.get('ef_id');
  const promoId = rootUrlParameters.get('promoid');
  const trackingId = rootUrlParameters.get('trackingid');
  const cgen = rootUrlParameters.get('cgen');

  $links.forEach(($a) => {
    if ($a.href && $a.href.match('adobesparkpost.app.link')) {
      const btnUrl = new URL($a.href);
      const urlParams = btnUrl.searchParams;
      const placement = getPlacement($a);

      if (templateSearchTag
        && placeholders['search-branch-links']
        && placeholders['search-branch-links']
          .replace(/\s/g, '')
          .split(',')
          .includes(`${btnUrl.origin}${btnUrl.pathname}`)) {
        urlParams.set('search', templateSearchTag);
      }

      if (referrer) {
        urlParams.set('referrer', referrer);
      }

      if (pageUrl) {
        urlParams.set('url', pageUrl);
      }

      if (sdid) {
        urlParams.set('sdid', sdid);
      }

      if (mv) {
        urlParams.set('mv', mv);
      }

      if (mv2) {
        urlParams.set('mv2', mv2);
      }

      if (efId) {
        urlParams.set('efid', efId);
      }

      if (sKwcId) {
        const sKwcIdParameters = sKwcId.split('!');

        if (typeof sKwcIdParameters[2] !== 'undefined' && sKwcIdParameters[2] === '3') {
          urlParams.set('customer_placement', 'Google%20AdWords');
        }

        if (typeof sKwcIdParameters[8] !== 'undefined' && sKwcIdParameters[8] !== '') {
          urlParams.set('keyword', sKwcIdParameters[8]);
        }
      }

      if (promoId) {
        urlParams.set('promoid', promoId);
      }

      if (trackingId) {
        urlParams.set('trackingid', trackingId);
      }

      if (cgen) {
        urlParams.set('cgen', cgen);
      }

      if (experimentStatus === 'active') {
        urlParams.set('expid', `${experiment.id}-${experiment.selectedVariant}`);
      }

      if (placement) {
        urlParams.set('ctaid', placement);
      }

      btnUrl.search = urlParams.toString();
      $a.href = decodeURIComponent(btnUrl.toString());
    }
  });
}

if (window.name.includes('performance')) registerPerformanceLogger();

export function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

export function titleCase(str) {
  const splitStr = str.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i += 1) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(' ');
}
