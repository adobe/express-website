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
/* global window, navigator, document, fetch, performance, PerformanceObserver */
/* eslint-disable no-console */

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

function getMeta(name) {
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

export function getIcon(icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-${icon}">
    <use href="/express/icons.svg#${icon}"></use>
  </svg>`;
}

export function getIconElement(icon) {
  const $div = createTag('div');
  $div.innerHTML = getIcon(icon);
  return ($div.children[0]);
}

export function linkImage($elem) {
  const $a = $elem.querySelector('a');
  const $parent = $a.closest('div');
  $a.remove();
  const picture = $parent.innerHTML;
  $parent.innerHTML = '';
  $parent.appendChild($a);
  $a.innerHTML = picture;
  $a.className = '';
}

function wrapSections(element) {
  document.querySelectorAll(element).forEach(($div) => {
    if (!$div.id) {
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
  return 'en';
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

function decorateHeader() {
  const $header = document.querySelector('header');

  /* init header with placeholder */

  $header.innerHTML = `
  <div class="placeholder">
    <div class="mobile">
      <div class="hamburger"></div>
      <div class="logo"><img src="/express/gnav-placeholder/adobe-logo.svg"></div>
      <div class="signin">Sign In</div>
    </div>
    <div class="desktop">
      <div class="top">
        <div class="left">
          <div class="logo"><img src="/express/gnav-placeholder/adobe-logo.svg"><span class="adobe">Adobe</span></div>
          <div class="section">
            <span class="drop">Creativity & Design</span>
          </div>
          <div class="section">
            <span class="selected">Spark</span>
            <span class="drop">Learn & Support</span>
            <span><a href="#" class="button primary">Choose a plan</a></span>
          </div>
        </div>
        <div class="right">
          <div class="search"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" focusable="false">
          <path d="M14 2A8 8 0 0 0 7.4 14.5L2.4 19.4a1.5 1.5 0 0 0 2.1 2.1L9.5 16.6A8 8 0 1 0 14 2Zm0 14.1A6.1 6.1 0 1 1 20.1 10 6.1 6.1 0 0 1 14 16.1Z"></path>
      </svg></div>
          <div class="signing">Sign In</div>
        </div>
      </div>
      <div class="bottom">
        <span class="crumb">Home</span> / <span class="crumb">Adobe Creative Cloud</span>
      </div>
    </div>
  `;
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
export function loadCSS(href) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    link.onload = () => {
    };
    link.onerror = () => {
    };
    document.head.appendChild(link);
  }
}

function decorateDoMoreEmbed() {
  document.querySelectorAll('div.embed-internal-domore > div').forEach(($domore) => {
    const $ps = $domore.querySelectorAll(':scope>p');
    const $h2 = $domore.querySelector(':scope>h2');
    const $action = createTag('div', { class: 'actions' });
    if ($h2) {
      $h2.addEventListener('click', () => {
        $action.classList.toggle('open');
        $h2.classList.toggle('open');
      });
    }
    $ps.forEach(($p) => {
      $action.append($p);
    });
    $domore.append($action);
  });
}

function decorateBlocks() {
  document.querySelectorAll('main div.section-wrapper > div > div').forEach(async ($block) => {
    const classes = Array.from($block.classList.values());
    let blockName = classes[0];
    const $section = $block.closest('.section-wrapper');
    if ($section) {
      $section.classList.add(`${blockName}-container`.replaceAll('--', '-'));
    }
    const blocksWithOptions = ['checker-board', 'template-list', 'steps', 'cards', 'quotes', 'page-list', 'columns'];
    blocksWithOptions.forEach((b) => {
      if (blockName.startsWith(`${b}-`)) {
        const options = blockName.substring(b.length + 1).split('-').filter((opt) => !!opt);
        blockName = b;
        $block.classList.add(b);
        $block.classList.add(...options);
      }
    });
    $block.classList.add('block');
    import(`/express/blocks/${blockName}/${blockName}.js`)
      .then((mod) => {
        mod.default($block, blockName, document);
      })
      .catch((err) => console.log(`failed to load module for ${blockName}`, err));

    loadCSS(`/express/blocks/${blockName}/${blockName}.css`);
  });
}

export function loadScript(url, callback, type) {
  const $head = document.querySelector('head');
  const $script = createTag('script', { src: url });
  if (type) {
    $script.setAttribute('type', type);
  }
  $head.append($script);
  $script.onload = callback;
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
        } else value = $row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

function postLCP() {
  const martechUrl = '/express/scripts/martech.js';
  loadCSS('/express/styles/lazy-styles.css');
  decorateBlocks();
  // loadLazyFooter();
  if (!(window.location.search === '?nomartech' || document.querySelector(`head script[src="${martechUrl}"]`))) {
    let ms = 2000;
    const usp = new URLSearchParams(window.location.search);
    const delay = usp.get('delay');
    if (delay) ms = +delay;
    setTimeout(() => {
      loadScript(martechUrl, null, 'module');
    }, ms);
  }
}

async function fetchAuthorImage($image, author) {
  const resp = await fetch(`/express/learn/blog/authors/${toClassName(author)}.plain.html`);
  const main = await resp.text();
  if (resp.status === 200) {
    const $div = createTag('div');
    $div.innerHTML = main;
    const $img = $div.querySelector('img');
    const src = $img.src.replace('width=2000', 'width=200');
    $image.src = src;
  }
}

function decorateHero() {
  const isBlog = document.documentElement.classList.contains('blog');
  const $h1 = document.querySelector('main h1');
  // check if h1 is inside a block

  if ($h1 && !$h1.closest('.section-wrapper > div > div ')) {
    const $heroPicture = $h1.parentElement.querySelector('picture');
    let $heroSection;
    const $main = document.querySelector('main');
    if ($main.children.length === 1 || isBlog) {
      $heroSection = createTag('div', { class: 'hero' });
      const $div = createTag('div');
      if (isBlog) {
        $heroSection.append($div);
        const $blogHeader = createTag('div', { class: 'blog-header' });
        $div.append($blogHeader);
        const $eyebrow = createTag('div', { class: 'eyebrow' });
        const tagString = getMeta('article:tag');
        // eslint-disable-next-line no-unused-vars
        const tags = tagString.split(',');
        $eyebrow.innerHTML = 'Content & Social Marketing';
        // $eyebrow.innerHTML = tags[0];
        $blogHeader.append($eyebrow);
        $blogHeader.append($h1);
        const author = getMeta('author');
        const date = getMeta('publication-date');
        if (author) {
          const $author = createTag('div', { class: 'author' });
          $author.innerHTML = `<div class="image"><img src="/express/gnav-placeholder/adobe-logo.svg"/></div>
          <div>
            <div class="name">${author}</div>
            <div class="date">${date}</div>
          </div>`;
          fetchAuthorImage($author.querySelector('img'), author);
          $blogHeader.append($author);
        }
        $div.append($blogHeader);
        if ($heroPicture) {
          $div.append($heroPicture);
        }
      } else {
        $heroSection.append($div);
        if ($heroPicture) {
          $div.append($heroPicture);
        }
        $div.append($h1);
      }
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

function decorateButtons() {
  document.querySelectorAll('main a').forEach(($a) => {
    const $up = $a.parentElement;
    const $twoup = $a.parentElement.parentElement;
    if (!$a.querySelector('img')) {
      if ($up.childNodes.length === 1 && $up.tagName === 'P') {
        $a.className = 'button primary';
        $up.classList.add('button-container');
      }
      if ($up.childNodes.length === 1 && $up.tagName === 'STRONG'
          && $twoup.childNodes.length === 1 && $twoup.tagName === 'P') {
        $a.className = 'button primary';
        $twoup.classList.add('button-container');
      }
      if ($up.childNodes.length === 1 && $up.tagName === 'EM'
          && $twoup.childNodes.length === 1 && $twoup.tagName === 'P') {
        $a.className = 'button secondary';
        $twoup.classList.add('button-container');
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

async function checkTesting(url) {
  const pathname = new URL(url).pathname.split('.')[0];
  const resp = await fetch('/express/testing.json');
  if (resp.ok) {
    const json = await resp.json();
    const matches = json.data.filter((test) => {
      const testPath = new URL(test['Test URLs']).pathname.split('.')[0];
      return testPath === pathname;
    });
    return (!!matches.length);
  }

  return false;
}

async function decorateTesting() {
  let runTest = true;
  // let reason = '';

  if (await checkTesting(window.location.href)) {
    // eslint-disable-next-line no-console
    console.log('rushing martech');
    loadScript('/express/scripts/martech.js', null, 'module');
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
function playYouTubeVideo(vid, $element) {
  $element.innerHTML = `<iframe width="720" height="405" src="https://www.youtube.com/embed/${vid}?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  /*
  const ytPlayerScript='https://www.youtube.com/iframe_api';
  if (!document.querySelector(`script[src="${ytPlayerScript}"]`)) {
    const tag = document.createElement('script');
    tag.src = ytPlayerScript;
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  if (typeof YT !== 'undefined' && YT.Player) {
    const player = new YT.Player($element.id, {
      height: $element.clientHeight,
      width: $element.clientWidth,
      videoId: vid,
      events: {
          'onReady': (event) => {
            event.target.playVideo();
          },
        }
    });
  } else {
    setTimeout(() => {
      playYouTubeVideo(vid, $element);
    }, 100)
  }
  */
}

function displayTutorial(tutorial) {
  if (tutorial.link.includes('youtu')) {
    const $overlay = createTag('div', { class: 'overlay' });
    const $video = createTag('div', { class: 'overlay-video', id: 'overlay-video' });
    $overlay.appendChild($video);
    window.location.hash = toClassName(tutorial.title);
    const $main = document.querySelector('main');
    $main.append($overlay);
    const yturl = new URL(tutorial.link);
    let vid = yturl.searchParams.get('v');
    if (!vid) {
      vid = yturl.pathname.substr(1);
    }
    $overlay.addEventListener('click', () => {
      window.location.hash = '';
      $overlay.remove();
    });

    playYouTubeVideo(vid, $video);
  } else {
    window.location.href = tutorial.link;
  }

  // eslint-disable-next-line no-console
  console.log(tutorial.link);
}

function createTutorialCard(tutorial) {
  const $card = createTag('div', { class: 'tutorial-card' });
  let img;
  let noimg = '';
  if (tutorial.img) {
    img = `<img src="${tutorial.img}">`;
  } else {
    img = `<div class="badge"></div><div class="title">${tutorial.title}</div>`;
    noimg = 'noimg';
  }

  $card.innerHTML = `<div class="tutorial-card-image">
  </div>
  <div class="tutorial-card-img ${noimg}">
    ${img}
    <div class="duration">${tutorial.time}</div>
  </div>
  <div class="tutorial-card-title">
  <h3>${tutorial.title}</h3>
  </div>
  <div class="tutorial-card-tags">
  <span>${tutorial.tags.join('</span><span>')}</span>
  </div>
  `;
  $card.addEventListener('click', () => {
    displayTutorial(tutorial);
  });
  return ($card);
}

function displayTutorialsByCatgory(tutorials, $results, category) {
  $results.innerHTML = '';

  const matches = tutorials.filter((tut) => tut.categories.includes(category));
  matches.forEach((match) => {
    $results.appendChild(createTutorialCard(match));
  });
}

function toggleCategories($section, show) {
  const children = Array.from($section.children);
  let afterTutorials = false;
  children.forEach(($e) => {
    // eslint-disable-next-line no-console
    console.log($e);
    if (afterTutorials) {
      if (show) {
        $e.classList.remove('hidden');
      } else {
        $e.classList.add('hidden');
      }
    }
    if ($e.classList.contains('tutorials')) {
      afterTutorials = true;
    }
  });
}

function displayFilteredTutorials(tutorials, $results, $filters) {
  $results.innerHTML = '';
  const $section = $results.closest('.section-wrapper > div');
  // eslint-disable-next-line no-console
  console.log($section);
  const filters = (Array.from($filters)).map((f) => f.textContent);
  if (filters.length) {
    toggleCategories($section, false);
    const matches = tutorials.filter((tut) => filters.every((v) => tut.tags.includes(v)));
    matches.forEach((match) => {
      $results.appendChild(createTutorialCard(match));
    });
  } else {
    toggleCategories($section, true);
  }
}

function decorateTutorials() {
  document.querySelectorAll('main .tutorials').forEach(($tutorials) => {
    const tutorials = [];
    const $section = $tutorials.closest('.section-wrapper > div');
    const allTags = [];
    const $rows = Array.from($tutorials.children);
    $rows.forEach(($row, i) => {
      // eslint-disable-next-line no-console
      console.log(i);
      const $cells = Array.from($row.children);
      const $tags = $cells[3];
      const $categories = $cells[2];
      const $title = $cells[0];
      const $img = $cells[4];

      const tags = Array.from($tags.children).map(($tag) => $tag.textContent);
      const categories = Array.from($categories.children).map(($cat) => $cat.textContent);
      const time = $cells[1].textContent;
      const title = $title.textContent;
      const link = $title.querySelector('a').href;
      const img = $img.querySelector('img') ? $img.querySelector('img').src : undefined;

      tutorials.push({
        title, link, time, tags, categories, img,
      });

      tags.forEach((tag) => {
        if (!allTags.includes(tag)) allTags.push(tag);
      });
    });

    $tutorials.innerHTML = '';
    let $results = createTag('div', { class: 'results' });
    $tutorials.appendChild($results);

    const $filters = createTag('div', { class: 'filters' });
    allTags.forEach((tag) => {
      const $tagFilter = createTag('span', { class: 'tag-filter' });
      $tagFilter.innerHTML = tag;
      $filters.appendChild($tagFilter);
      $tagFilter.addEventListener('click', () => {
        $tagFilter.classList.toggle('selected');
        displayFilteredTutorials(tutorials, $results, $filters.querySelectorAll('.selected'));
      });
    });

    $tutorials.prepend($filters);

    const $children = Array.from($section.children);
    let filterFor = '';
    $children.forEach(($e) => {
      // eslint-disable-next-line no-console
      console.log($e.tagName);
      if ($e.tagName === 'H2') {
        if (filterFor) {
          $results = createTag('div', { class: 'results' });
          displayTutorialsByCatgory(tutorials, $results, filterFor);
          $section.insertBefore($results, $e);
        }
        filterFor = $e.textContent;
      }
    });

    if (filterFor) {
      $results = createTag('div', { class: 'results' });
      displayTutorialsByCatgory(tutorials, $results, filterFor);
      $section.appendChild($results);
    }

    if (window.location.hash !== '#') {
      const video = window.location.hash.substr(1);
      tutorials.forEach((tutorial) => {
        if (toClassName(tutorial.title) === video) {
          displayTutorial(tutorial);
        }
      });
    }
  });
}

function setTemplate() {
  const path = window.location.pathname;
  let template = 'default';
  if (path.includes('/make/')) {
    template = 'make';
  } else if (path.includes('/blog/')) {
    template = 'blog';
  }
  // todo: read template from page metadata
  document.documentElement.classList.add(template);
}

function setLCPTrigger() {
  const $lcpCandidate = document.querySelector('main > div:first-of-type img');
  if ($lcpCandidate) {
    if ($lcpCandidate.complete) {
      postLCP();
    } else {
      $lcpCandidate.addEventListener('load', () => {
        postLCP();
      });
      $lcpCandidate.addEventListener('error', () => {
        postLCP();
      });
    }
  } else {
    postLCP();
  }
}

function fixIcons() {
  /* backwards compatible icon handling, deprecated */
  document.querySelectorAll('svg use[href^="./_icons_"]').forEach(($use) => {
    $use.setAttribute('href', `/express/icons.svg#${$use.getAttribute('href').split('#')[1]}`);
  });

  /* new icons handling */
  document.querySelectorAll('img').forEach(($img) => {
    const alt = $img.getAttribute('alt');
    if (alt) {
      const lowerAlt = alt.toLowerCase();
      if (lowerAlt.includes('icon:')) {
        const icon = lowerAlt.split('icon:')[1].trim().split(' ');
        const $picture = $img.closest('picture');
        $picture.parentElement.replaceChild(getIconElement(icon), $picture);
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
}

function splitSections() {
  document.querySelectorAll('main > div > div').forEach(($block) => {
    const blocksToSplit = ['template-list', 'layouts', 'blog-posts'];
    if (blocksToSplit.includes($block.className)) {
      unwrapBlock($block);
    }
  });
}

function setTheme() {
  const theme = getMeta('theme');
  if (theme) {
    const themeClass = toClassName(theme);
    const $main = document.querySelector('main');
    $main.classList.add(themeClass);
  }
}

async function decoratePage() {
  setTemplate();
  setTheme();
  await decorateTesting();
  splitSections();
  wrapSections('main>div');
  decorateHeader();
  decorateHero();
  decorateButtons();
  fixIcons();
  decorateTutorials();
  decorateDoMoreEmbed();
  setLCPTrigger();
  document.body.classList.add('appear');
}

window.spark = {};
decoratePage();

/* performance instrumentation */

function stamp(message) {
  console.log(`${new Date() - performance.timing.navigationStart}ms: ${message}`);
}

function registerPerformanceLogger() {
  try {
    const polcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      stamp(JSON.stringify(entries));
    });
    polcp.observe({ type: 'largest-contentful-paint', buffered: true });
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

if (window.name.includes('performance')) registerPerformanceLogger();
