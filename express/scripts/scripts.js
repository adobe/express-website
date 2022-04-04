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

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */

export function sampleRUM(checkpoint, data = {}) {
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = (usp.get('rum') === 'on') ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
      // eslint-disable-next-line no-bitwise
      const hashCode = (s) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
      const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random().toString(16).substr(2, 14)}`;
      const random = Math.random();
      const isSelected = (random * weight < 1);
      // eslint-disable-next-line object-curly-newline
      window.hlx.rum = { weight, id, random, isSelected };
    }
    const { random, weight, id } = window.hlx.rum;
    if (random && (random * weight < 1)) {
      const sendPing = () => {
        // eslint-disable-next-line object-curly-newline
        const body = JSON.stringify({ weight, id, referer: window.location.href, generation: 'ccx-gen2', checkpoint, ...data });
        const url = `https://rum.hlx3.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
      };
      sendPing();
      // special case CWV
      if (checkpoint === 'cwv') {
        // eslint-disable-next-line import/no-unresolved
        import('https://unpkg.com/web-vitals?module').then((mod) => {
          const storeCWV = (measurement) => {
            data.cwv = {};
            data.cwv[measurement.name] = measurement.value;
            sendPing();
          };
          mod.getCLS(storeCWV);
          mod.getFID(storeCWV);
          mod.getLCP(storeCWV);
        });
      }
    }
  } catch (e) {
    // something went wrong
  }
}

sampleRUM('top');
window.addEventListener('load', () => sampleRUM('load'));
document.addEventListener('click', () => sampleRUM('click'));

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
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
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

export function getIcon(icons, alt, size = 44) {
  // eslint-disable-next-line no-param-reassign
  icons = Array.isArray(icons) ? icons : [icons];
  const [defaultIcon, mobileIcon] = icons;
  const icon = (mobileIcon && window.innerWidth < 600) ? mobileIcon : defaultIcon;
  const symbols = [
    'adobefonts',
    'adobe-stock',
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
    'desktop-round',
    'download',
    'elements',
    'facebook',
    'globe',
    'incredibly-easy',
    'instagram',
    'image',
    'libraries',
    'library',
    'linkedin',
    'magicwand',
    'mergevideo',
    'mobile-round',
    'muteaudio',
    'photos',
    'photoeffects',
    'pinterest',
    'play',
    'premium-templates',
    'pricingfree',
    'pricingpremium',
    'privacy',
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
  ];
  if (symbols.includes(icon)) {
    const iconName = icon;
    let sheetSize = size;
    if (icon === 'chevron' || icon === 'pricingfree' || icon === 'pricingpremium') sheetSize = 22;
    if (icon === 'chevron' || icon === 'pricingfree' || icon === 'pricingpremium') sheetSize = 22;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-${icon}">
      ${alt ? `<title>${alt}</title>` : ''}
      <use href="/express/icons/ccx-sheet_${sheetSize}.svg#${iconName}${sheetSize}"></use>
    </svg>`;
  } else {
    return (`<img class="icon icon-${icon}" src="/express/icons/${icon}.svg" alt="${alt || icon}">`);
  }
}

export function getIconElement(icons, size, alt) {
  const $div = createTag('div');
  $div.innerHTML = getIcon(icons, alt, size);
  return ($div.firstChild);
}

export function transformLinkToAnimation($a) {
  if (!$a || !$a.href.endsWith('.mp4')) {
    return null;
  }
  const params = new URL($a.href).searchParams;
  const attribs = {};
  ['playsinline', 'autoplay', 'loop', 'muted'].forEach((p) => {
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
    if ($a && $a.textContent.startsWith('https://')) {
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
    $a.append(...$parent.childNodes);
    $parent.append($a);
  }
}

function wrapSections($sections) {
  $sections.forEach(($div) => {
    if ($div.textContent.trim() === '' && !$div.firstElementChild) {
      // remove empty sections (neither text nor child elements)
      $div.remove();
    } else if (!$div.id) {
      const $wrapper = createTag('div', { class: 'section-wrapper' });
      $div.parentNode.appendChild($wrapper);
      $wrapper.appendChild($div);
    }
  });
}

export function getLocale(url) {
  const locale = url.pathname.split('/')[1];
  if (/^[a-z]{2}$/.test(locale)) {
    return locale;
  }
  return 'us';
}

function getCookie(cname) {
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

function getCurrencyDisplay(currency) {
  if (currency === 'JPY') {
    return 'name';
  }
  if (['SEK', 'DKK', 'NOK'].includes(currency)) {
    return 'code';
  }
  return 'symbol';
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
  const resp = await fetch('/express/system/offers.json');
  const json = await resp.json();
  const upperCountry = country.toUpperCase();
  let offer = json.data.find((e) => (e.o === offerId) && (e.c === upperCountry));
  if (!offer) offer = json.data.find((e) => (e.o === offerId) && (e.c === 'US'));

  if (offer) {
    const lang = getLanguage(getLocale(window.location)).split('-')[0];
    const unitPrice = offer.p;
    const unitPriceCurrencyFormatted = formatPrice(unitPrice, currency);
    const commerceURL = `https://commerce.adobe.com/checkout?cli=spark&co=${country}&items%5B0%5D%5Bid%5D=${offerId}&items%5B0%5D%5Bcs%5D=0&rUrl=https%3A%2F%express.adobe.com%2Fsp%2F&lang=${lang}`;
    const vatInfo = offer.vat;
    return {
      country, currency, unitPrice, unitPriceCurrencyFormatted, commerceURL, lang, vatInfo,
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
    .filter(($cell) => /^\[[A-Za-z0-9 -_—]+\]$/mg.test($cell.textContent))
    .forEach(($cell) => {
      const marker = $cell.textContent
        .substring(1, $cell.textContent.length - 1)
        .toLocaleLowerCase()
        .trim();
      // find the fragment with the marker
      const $marker = Array.from(document.querySelectorAll('main > div h3'))
        .find(($title) => $title.textContent.toLocaleLowerCase() === marker);
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

export function decorateBlocks($main) {
  $main.querySelectorAll('div.section-wrapper > div > div').forEach(($block) => {
    const classes = Array.from($block.classList.values());
    let blockName = classes[0];
    if (!blockName) return;
    const $section = $block.closest('.section-wrapper');
    if ($section) {
      $section.classList.add(`${blockName}-container`.replace(/--/g, '-'));
    }
    const blocksWithOptions = ['checker-board', 'template-list', 'steps', 'cards', 'quotes', 'page-list', 'link-list', 'hero-animation',
      'columns', 'show-section-only', 'image-list', 'feature-list', 'icon-list', 'table-of-contents', 'how-to-steps', 'banner', 'pricing-columns'];

    if (blockName !== 'how-to-steps-carousel') {
      blocksWithOptions.forEach((b) => {
        if (blockName.startsWith(`${b}-`)) {
          const options = blockName.substring(b.length + 1).split('-').filter((opt) => !!opt);
          blockName = b;
          $block.classList.add(b);
          $block.classList.add(...options);
        }
      });
    }
    $block.classList.add('block');
    $block.setAttribute('data-block-name', blockName);
    $block.setAttribute('data-block-status', 'initialized');
  });
}

function decorateMarqueeColumns($main) {
  // flag first columns block in first section block as marquee
  const $firstColumnsBlock = $main.querySelector('.section-wrapper:first-of-type .columns:first-of-type');
  if ($firstColumnsBlock) {
    $firstColumnsBlock.classList.add('columns-marquee');
  }
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block, eager = false) {
  if (!(block.getAttribute('data-block-status') === 'loading' || block.getAttribute('data-block-status') === 'loaded')) {
    block.setAttribute('data-block-status', 'loading');
    const blockName = block.getAttribute('data-block-name');
    try {
      const cssLoaded = new Promise((resolve) => {
        loadCSS(`/express/blocks/${blockName}/${blockName}.css`, resolve);
      });
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(`/express/blocks/${blockName}/${blockName}.js`);
            if (mod.default) {
              await mod.default(block, blockName, document, eager);
            }
          } catch (err) {
            console.log(`failed to load module for ${blockName}`, err);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (err) {
      console.log(`failed to load block ${blockName}`, err);
    }
    block.setAttribute('data-block-status', 'loaded');
  }
}
export function loadBlocks($main) {
  const blockPromises = [...$main.querySelectorAll('div.section-wrapper > div > .block')]
    .map(($block) => loadBlock($block));
  return blockPromises;
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

// async function loadLazyFooter() {
//   const resp = await fetch('/lazy-footer.plain.html');
//   const inner = await resp.text();
//   const $footer = document.querySelector('footer');
//   $footer.innerHTML = inner;
//   $footer.querySelectorAll('a').forEach(($a) => {
//     const url = new URL($a.href);
//     if (url.hostname === 'spark.adobe.com') {
//       const slash = url.pathname.endsWith('/') ? 1 : 0;
//       $a.href = url.pathname.substr(0, url.pathname.length - slash);
//     }
//   });
//   wrapSections('footer>div');
//   addDivClasses($footer, 'footer > div', ['dark', 'grey', 'grey']);
//   const $div = createTag('div', { class: 'hidden' });
//   const $dark = document.querySelector('footer .dark>div');

//   Array.from($dark.children).forEach(($e, i) => {
//     if (i) $div.append($e);
//   });

//   $dark.append($div);

//   $dark.addEventListener('click', () => {
//     $div.classList.toggle('hidden');
//   });
// }

export function readBlockConfig($block) {
  const config = {};
  $block.querySelectorAll(':scope>div').forEach(($row) => {
    if ($row.children) {
      const $cols = [...$row.children];
      if ($cols[1]) {
        const $value = $cols[1];
        const name = toClassName($cols[0].textContent);
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
            value = $ps[0].textContent;
          } else {
            value = $ps.map(($p) => $p.textContent);
          }
        } else value = $row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const $meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return $meta && $meta.content;
}

/**
 * fetches the string variables.
 * @returns {object} localized variables
 */

export async function fetchPlaceholders() {
  if (!window.placeholders) {
    try {
      const locale = getLocale(window.location);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      const resp = await fetch(`${urlPrefix}/express/placeholders.json`);
      const json = await resp.json();
      window.placeholders = {};
      json.data.forEach((placeholder) => {
        window.placeholders[toClassName(placeholder.Key)] = placeholder.Text;
      });
    } catch {
      const resp = await fetch('/express/placeholders.json');
      const json = await resp.json();
      window.placeholders = {};
      json.data.forEach((placeholder) => {
        window.placeholders[toClassName(placeholder.Key)] = placeholder.Text;
      });
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
        const $promoSection = createTag('div', { class: 'section-wrapper' });
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
  const gnav = usp.get('gnav');

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
    if ($h1 && !$h1.closest('.section-wrapper > div > div ')) {
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
        $heroSection = $h1.closest('.section-wrapper');
        $heroSection.classList.add('hero');
        $heroSection.classList.remove('section-wrapper');
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
    $a.href = addSearchQueryToHref($a.href);
    $a.title = $a.title || $a.textContent;
    const $block = $a.closest('div.section-wrapper > div > div');
    let blockName;
    if ($block) {
      blockName = $block.className;
    }
    if (!noButtonBlocks.includes(blockName)
      && originalHref !== $a.textContent
      && !$a.textContent.endsWith(' >')
      && !$a.textContent.endsWith(' ›')) {
      const $up = $a.parentElement;
      const $twoup = $a.parentElement.parentElement;
      if (!$a.querySelector('img')) {
        if ($up.childNodes.length === 1 && ($up.tagName === 'P' || $up.tagName === 'DIV')) {
          $a.className = 'button accent'; // default
          $up.classList.add('button-container');
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'STRONG'
            && $twoup.childNodes.length === 1 && $twoup.tagName === 'P') {
          $a.className = 'button accent';
          $twoup.classList.add('button-container');
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'EM'
            && $twoup.childNodes.length === 1 && $twoup.tagName === 'P') {
          $a.className = 'button accent light';
          $twoup.classList.add('button-container');
        }
      }
      if ($a.textContent.trim().startsWith('{{icon-') && $a.textContent.trim().endsWith('}}')) {
        const $iconName = /{{icon-([\w-]+)}}/g.exec($a.textContent.trim())[1];
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

async function decorateTesting() {
  let runTest = true;
  // let reason = '';
  const usp = new URLSearchParams(window.location.search);
  const martech = usp.get('martech');
  if ((checkTesting() && (martech !== 'off') && (martech !== 'delay')) || martech === 'rush') {
    // eslint-disable-next-line no-console
    console.log('rushing martech');
    loadScript('/express/scripts/instrument.js', null, 'module');
  }

  if (!window.location.host.includes('adobe.com')) {
    runTest = false;
    // reason = 'not prod host';
  }
  if (window.location.hash) {
    runTest = false;
    // reason = 'suppressed by #';
  }
  if (window.location.search === '?test') {
    runTest = true;
  }
  if (navigator.userAgent.match(/bot|crawl|spider/i)) {
    runTest = false;
    // reason = 'bot detected';
  }

  if (runTest) {
    let $testTable;
    document.querySelectorAll('table th').forEach(($th) => {
      if ($th.textContent.toLowerCase().trim() === 'a/b test') {
        $testTable = $th.closest('table');
      }
    });

    const testSetup = [];

    if ($testTable) {
      $testTable.querySelectorAll('tr').forEach(($row) => {
        const $name = $row.children[0];
        const $percentage = $row.children[1];
        const $a = $name.querySelector('a');
        if ($a) {
          const url = new URL($a.href);
          testSetup.push({
            url: url.pathname,
            traffic: parseFloat($percentage.textContent) / 100.0,
          });
        }
      });
    }

    let test = Math.random();
    let selectedUrl = '';
    testSetup.forEach((e) => {
      if (test >= 0 && test < e.traffic) {
        selectedUrl = e.url;
      }
      test -= e.traffic;
    });

    if (selectedUrl) {
      // eslint-disable-next-line no-console
      console.log(selectedUrl);
      const plainUrl = `${selectedUrl.replace('.html', '')}.plain.html`;
      const resp = await fetch(plainUrl);
      const html = await resp.text();
      document.querySelector('main').innerHTML = html;
    }
  } else {
    // eslint-disable-next-line no-console
    // console.log(`Test is not run => ${reason}`);
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
          const smallIconBlocks = ['columns'];
          const blockName = $block.getAttribute('data-block-name');
          if (smallIconBlocks.includes(blockName)) size = 22;
        }
        $picture.parentElement
          .replaceChild(getIconElement([icon, mobileIcon], size, altText), $picture);
      }
    }
  });
}

export function unwrapBlock($block) {
  const $section = $block.parentNode;
  const $elems = [...$section.children];
  const $blockSection = createTag('div');
  const $postBlockSection = createTag('div');
  const $nextSection = $section.nextSibling;
  $section.parentNode.insertBefore($blockSection, $nextSection);
  $section.parentNode.insertBefore($postBlockSection, $nextSection);

  let $appendTo;
  $elems.forEach(($e) => {
    if ($e === $block) $appendTo = $blockSection;
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
        tag.outerHTML = `<h${level}>${tag.textContent}</h${level}>`;
      }
    }
  });
}

function splitSections($main) {
  $main.querySelectorAll(':scope > div > div').forEach(($block) => {
    const blocksToSplit = ['template-list', 'layouts', 'banner', 'faq', 'promotion', 'fragment'];

    if (blocksToSplit.includes($block.className)) {
      unwrapBlock($block);
    }
  });
}

function setTheme() {
  const theme = getMeta('theme');
  const $body = document.body;
  if (theme) {
    let themeClass = toClassName(theme);
    /* backwards compatibility can be removed again */
    if (themeClass === 'nobrand') themeClass = 'no-desktop-brand-header';
    $body.classList.add(themeClass);
    if (themeClass === 'blog') $body.classList.add('no-brand-header');
  }
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
    if ($a.href === $a.textContent) {
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
      $helixEnv.innerHTML = env + (getHelixEnv() ? '' : ' [not found]');
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

export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]) {
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
  main.querySelectorAll('img[src*="/media_"').forEach((img, i) => {
    const newPicture = createOptimizedPicture(img.src, img.alt, !i);
    const picture = img.closest('picture');
    if (picture) picture.parentElement.replaceChild(newPicture, picture);
  });
}

export async function decorateMain($main) {
  splitSections($main);
  wrapSections($main.querySelectorAll(':scope > div'));
  decorateButtons($main);
  decorateBlocks($main);
  decorateMarqueeColumns($main);
  await fixIcons($main);
  decoratePictures($main);
  decorateLinkedPictures($main);
  decorateSocialIcons($main);
  makeRelativeLinks($main);
}

window.spark = {};

const hostparam = new URLSearchParams(window.location.search).get('hostname');
window.spark.hostname = hostparam || window.location.hostname;

function unhideBody(id) {
  try {
    document.head.removeChild(document.getElementById(id));
  } catch (e) {
    // nothing
  }
}

function hideBody(id) {
  const style = document.createElement('style');
  style.id = id;
  style.textContent = 'body{visibility: hidden !important}';

  try {
    document.head.appendChild(style);
  } catch (e) {
    // nothing
  }
}

/**
 * Generates the intersection observer (after the blocks are finished loading)
 * to make sure that the fixed button is visible on page load if the
 * title is too long to show the PrimaryCTA
 */
function generateFixedButton() {
  if (document.body.classList.contains('has-fixed-button')) {
    const $primaryCTA = document.querySelector('.primaryCTA');
    const $floatButton = document.querySelector('.fixed-button');
    const $banner = document.querySelector('.banner-container');
    const $ratings = document.querySelector('.ratings-container');

    const hideFixedButtonWhenInView = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.intersectionRatio > 0) {
        $floatButton.classList.remove('shown');
      } else {
        $floatButton.classList.add('shown');
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0,
    });

    if (document.readyState === 'complete') {
      hideFixedButtonWhenInView.observe($primaryCTA);
      if ($banner) hideFixedButtonWhenInView.observe($banner);
      if ($ratings) hideFixedButtonWhenInView.observe($ratings);
    } else {
      window.addEventListener('load', () => {
        hideFixedButtonWhenInView.observe($primaryCTA);
        if ($banner) hideFixedButtonWhenInView.observe($banner);
        if ($ratings) hideFixedButtonWhenInView.observe($ratings);
      });
    }
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
  document.querySelectorAll('h1, h2, h3, h4, h5, p:not(.button-container)').forEach((el) => {
    parser.applyElement(el);
  });
}

/**
 * loads everything needed to get to LCP.
 */
async function loadEager() {
  setTheme();
  if (!window.hlx.lighthouse) await decorateTesting();

  const main = document.querySelector('main');
  if (main) {
    await decorateMain(main);
    decorateHeaderAndFooter();
    decoratePageStyle();
    displayEnv();
    displayOldLinkWarning();
    wordBreakJapanese();

    const lcpBlocks = ['columns', 'hero-animation'];
    const block = document.querySelector('.block');
    const hasLCPBlock = (block && lcpBlocks.includes(block.getAttribute('data-block-name')));
    if (hasLCPBlock) await loadBlock(block, true);

    generateFixedButton();
    document.querySelector('body').classList.add('appear');

    if (!window.hlx.lighthouse) {
      const target = checkTesting();
      if (target) {
        const bodyHideStyleId = 'at-body-style';
        hideBody(bodyHideStyleId);
        setTimeout(() => {
          unhideBody(bodyHideStyleId);
        }, 3000);
      }
    }

    const lcpCandidate = document.querySelector('main img');
    await new Promise((resolve) => {
      if (lcpCandidate && !lcpCandidate.complete) {
        lcpCandidate.addEventListener('load', () => resolve());
        lcpCandidate.addEventListener('error', () => resolve());
      } else {
        resolve();
      }
    });
  }
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy() {
  const main = document.querySelector('main');

  // post LCP actions go here
  sampleRUM('lcp');

  loadBlocks(main);
  loadCSS('/express/styles/lazy-styles.css');
  resolveFragments();
  addPromotion();
  addFavIcon('/express/icons/cc-express.svg');
  if (!window.hlx.lighthouse) loadMartech();
}

/**
 * Decorates the page.
 */
async function decoratePage() {
  window.hlx = window.hlx || {};
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
  window.hlx.init = true;

  await loadEager();
  loadLazy();
  loadGnav();
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

export function trackBranchParameters($links) {
  const rootUrl = new URL(window.location.href);
  const rootUrlParameters = rootUrl.searchParams;

  const sdid = rootUrlParameters.get('sdid');
  const mv = rootUrlParameters.get('mv');
  const sKwcid = rootUrlParameters.get('s_kwcid');
  const efId = rootUrlParameters.get('ef_id');

  if (sdid || mv || sKwcid || efId) {
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

        if (sKwcid) {
          const sKwcidParameters = sKwcid.split('!');

          if (typeof sKwcidParameters[2] !== 'undefined' && sKwcidParameters[2] === '3') {
            urlParams.set('~customer_placement', 'Google%20AdWords');
          } // Missing Facebook.

          if (typeof sKwcidParameters[8] !== 'undefined' && sKwcidParameters[8] !== '') {
            urlParams.set('~keyword', sKwcidParameters[8]);
          }
        }

        urlParams.set('~feature', 'paid%20advertising');

        buttonUrl.search = urlParams.toString();
        $a.href = buttonUrl.toString();
      }
    });
  }
}

if (window.name.includes('performance')) registerPerformanceLogger();
