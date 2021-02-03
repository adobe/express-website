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
/* global window, navigator, document, fetch */

function toClassName(name) {
  return (name.toLowerCase().replace(/[^0-9a-z]/gi, '-'));
}

function createTag(name, attrs) {
  const el = document.createElement(name);
  if (typeof attrs === 'object') {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
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

function tableToDivs($table, cols) {
  const $rows = $table.querySelectorAll('tbody tr');
  const $cards = createTag('div', { class: `${cols.join('-')} block` });
  $rows.forEach(($tr) => {
    const $card = createTag('div');
    $tr.querySelectorAll('td').forEach(($td, i) => {
      const $div = createTag('div', cols.length > 1 ? { class: cols[i] } : {});
      $div.innerHTML = $td.innerHTML;
      $div.childNodes.forEach(($child) => {
        if ($child.nodeName === '#text') {
          const $p = createTag('p');
          $p.innerHTML = $child.nodeValue;
          $child.parentElement.replaceChild($p, $child);
        }
      });
      $card.append($div);
    });
    $cards.append($card);
  });
  return ($cards);
}

function decorateTables() {
  document.querySelectorAll('main div>table').forEach(($table) => {
    const $cols = $table.querySelectorAll('thead tr th');
    let cols = Array.from($cols).map((e) => toClassName(e.textContent)).filter((e) => (!!e));
    let $div = {};
    /* workaround for import */
    if (cols.length === 0) cols = ['template-list'];
    $div = tableToDivs($table, cols);
    $table.parentNode.replaceChild($div, $table);
  });
}

function addDivClasses($element, selector, classes) {
  const $children = $element.querySelectorAll(selector);
  $children.forEach(($div, i) => {
    $div.classList.add(classes[i]);
  });
}

function decorateHeader() {
  const $header = document.querySelector('header');
  const classes = ['logo', 'susi'];
  addDivClasses($header, ':scope>p', classes);
  $header.querySelector('.susi a').classList.add('button');
}

function decoratePictures() {
  if (!document.querySelector('picture')) {
    const helixImages = document.querySelectorAll('main img[src^="/hlx_"');
    helixImages.forEach(($img) => {
      const $pic = createTag('picture');
      const $parent = $img.parentNode;
      $pic.appendChild($img);
      $parent.appendChild($pic);
    });
  }
}

function decorateDoMoreEmbed() {
  document.querySelectorAll('div.embed-internal-domore > div').forEach(($domore) => {
    const $ps=$domore.querySelectorAll(':scope>p');
    const $h2=$domore.querySelector(':scope>h2');
    if ($h2) {
      $h2.addEventListener('click',(evt) => {
        $action.classList.toggle('open');
        $h2.classList.toggle('open');
      });
    }
    const $action=createTag('div', {class: 'actions'});
    $ps.forEach(($p) => {
      $action.append($p);
    });
    $domore.append($action);
  });
}

function decorateCheckerBoards() {
  const blobPrefix = "https://hlx.blob.core.windows.net/external/";
  document.querySelectorAll(`div.checker-board a[href^="${blobPrefix}`).forEach(($a) => {
    if ($a.href.endsWith('.mp4')) {
      const hostPrefix = location.hostname.includes('localhost')?'https://spark-website--adobe.hlx.live':'';
      const $cell = $a.closest('div');
      const vid=$a.href.substring(blobPrefix.length).split('#')[0];
      $cell.innerHTML=`<video playsinline autoplay loop muted><source loading="lazy" src="${hostPrefix}/hlx_${vid}.mp4" type="video/mp4"></video>`;
    }
  })
}

function decorateBlocks() {
  document.querySelectorAll('div.block').forEach(($block) => {
    const classes = Array.from($block.classList.values());
    const blockName = classes[0];
    const $section = $block.closest('.section-wrapper');
    if ($section) {
      $section.classList.add(`${blockName}-container`);
    }
    const blocksWithOptions = ['checker-board'];
    blocksWithOptions.forEach((b) => {
      if (blockName.startsWith(`${b}-`)) {
        const options = blockName.substring(b.length+1).split('-');
        $block.classList.add(b);
        $block.classList.add(...options);
      }
    });
  });
}

function decorateAnimations() {
  document.querySelectorAll('.animation a[href], .video a[href]').forEach(($a) => {
    const href = $a.getAttribute('href');
    const url = new URL(href);
    const helixId = url.pathname.split('/')[2];
    const $parent = $a.parentNode;

    if (href.endsWith('.mp4')) {
      // const isAnimation=$a.closest('.animation')?true:false;
      const isAnimation = true;

      let attribs = { controls: '' };
      if (isAnimation) {
        attribs = {
          playsinline: '', autoplay: '', loop: '', muted: '',
        };
      }
      const $poster = $a.closest('div').querySelector('img');
      if ($poster) {
        attribs.poster = $poster.src;
        $poster.remove();
      }

      const $video = createTag('video', attribs);
      /*
      if (href.startsWith('https://hlx.blob.core.windows.net/external/')) {
        href='/hlx_'+href.split('/')[4].replace('#image','');
      }
      */
      $video.innerHTML = `<source src="${href}" type="video/mp4">`;
      $a.parentNode.replaceChild($video, $a);
      if (isAnimation) {
        $video.addEventListener('canplay', () => {
          $video.muted = true;
          $video.play();
        });
      }
    }

    if (href.endsWith('.gif')) {
      $a.parentNode.replaceChild(createTag('img', { src: `/hlx_${helixId}.gif` }), $a);
    }

    const $next = $parent.nextElementSibling;
    if ($next && $next.tagName === 'P' && $next.innerHTML.trim().startsWith('<em>')) {
      $next.classList.add('legend');
    }
  });
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
function loadCSS(href) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', href);
  link.onload = () => {
  };
  link.onerror = () => {
  };
  document.head.appendChild(link);
}

function loadScript(url, callback) {
  const $head = document.querySelector('head');
  const $script = createTag('script', { src: url });
  $head.append($script);
  $script.onload = callback;
}

async function loadLazyFooter() {
  const resp = await fetch('/lazy-footer.plain.html');
  const inner = await resp.text();
  const $footer = document.querySelector('footer');
  $footer.innerHTML = inner;
  $footer.querySelectorAll('a').forEach(($a) => {
    const url = new URL($a.href);
    if (url.hostname === 'spark.adobe.com') {
      const slash = url.pathname.endsWith('/') ? 1 : 0;
      $a.href = url.pathname.substr(0, url.pathname.length - slash);
    }
  });
  wrapSections('footer>div');
  addDivClasses($footer, 'footer > div', ['dark', 'grey', 'grey']);
  const $div = createTag('div', { class: 'hidden' });
  const $dark = document.querySelector('footer .dark>div');

  Array.from($dark.children).forEach(($e, i) => {
    if (i) $div.append($e);
  });

  $dark.append($div);

  $dark.addEventListener('click', () => {
    $div.classList.toggle('hidden');
  });
}

function readBlockConfig($block) {
  const config = {};
  $block.querySelectorAll(':scope>div').forEach(($row) => {
    if ($row.children && $row.children[1]) {
      const name = toClassName($row.children[0].textContent);
      const $a = $row.children[1].querySelector('a');
      let value = '';
      if ($a) value = $a.href;
      else value = $row.children[1].textContent;
      config[name] = value;
    }
  });
  return config;
}

async function fetchBlogIndex() {
  const resp = await fetch('/blog-index.json');
  const json = await resp.json();
  return (json.data);
}

async function filterBlogPosts(locale, filters) {
  if (!window.blogIndex) {
    window.blogIndex = await fetchBlogIndex();
  }
  const index = window.blogIndex;

  const f = {};
  for (const name of Object.keys(filters)) {
    const vals = filters[name];
    let v = vals;
    if (!Array.isArray(vals)) {
      v = [vals];
    }
    // eslint-disable-next-line no-console
    console.log(v);
    f[name] = v.map((e) => e.toLowerCase().trim());
  }

  const result = index.filter((post) => {
    let matchedAll = true;
    for (const name of Object.keys(f)) {
      let matched = false;
      f[name].forEach((val) => {
        if (post[name].toLowerCase().includes(val)) {
          matched = true;
        }
      });
      if (!matched) {
        matchedAll = false;
        break;
      }
    }
    return (matchedAll);
  });

  return (result);
}

function decorateBlogPosts() {
  document.querySelectorAll('main .blog-posts').forEach(async ($blogPosts) => {
    const config = readBlockConfig($blogPosts);
    const posts = await filterBlogPosts('en-US', config);
    $blogPosts.innerHTML = '';
    posts.forEach((post) => {
      const $card = createTag('div', { class: 'card' });
      $card.innerHTML = `<div class="card-image">
        <img loading="lazy" src="${post.image}">
      </div>
      <div class="card-body">
        <h3>${post.title}</h3>
        <p>${post.teaser}</p>
      </div>`;
      $card.addEventListener('click', () => {
        window.location.href = `/${post.path}`;
      });
      $blogPosts.appendChild($card);
    });
  });
}

function postLCP() {
  decorateAnimations();
  loadCSS('/styles/lazy-styles.css');
  loadLazyFooter();
  if (window.location.search === '?martech') loadScript('/scripts/martech.js');
  decorateBlogPosts();
}

function decorateHero() {
  const $h1 = document.querySelector('main h1');
  const $heroPicture = $h1.parentElement.querySelector('picture');
  let $heroSection;

  if ($h1) {
    const $main = document.querySelector('main');
    if ($main.children.length === 1) {
      $heroSection = createTag('div', { class: 'section-wrapper hero' });
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
    }
  }
  if ($heroPicture) {
    $heroPicture.classList.add('hero-bg');
    const $heroImage = $heroPicture.querySelector('img');
    // eslint-disable-next-line no-console
    console.log($heroImage);

    if ($heroImage.complete) {
      postLCP();
    } else {
      $heroImage.addEventListener('load', () => {
        postLCP();
      });
    }
  } else {
    $heroSection.classList.add('hero-noimage');
    postLCP();
  }
}

async function fetchFullIndex(indices) {
  const fullIndex = [];

  await Promise.all(indices.map(async (url) => {
    if (url) {
      const resp = await fetch(url);
      const json = await resp.json();
      // eslint-disable-next-line no-console
      console.log(`${url}: ${json.data.length}`);
      json.data.sort((e1, e2) => e1.path.localeCompare(e2.path));
      fullIndex.push(...json.data);
    }
  }));
  return (fullIndex);
}

function filterMigratedPages(filter) {
  const $results = document.getElementById('page-filter-results');
  const $stats = document.getElementById('page-filter-stats');
  $results.innerHTML = '';
  const index = window.fullIndex;
  let counter = 0;
  if (index) {
    index.forEach((page) => {
      if (page.path.includes(filter)) {
        counter += 1;
        let { path } = page;
        if (!path.startsWith('/')) path = `/${path}`;
        path = path.replace('.html', '');
        let markedUpPath = path;
        if (filter) markedUpPath = path.split(filter).join(`<b>${filter}</b>`);
        const $card = createTag('div', { class: 'card' });
        $card.innerHTML = `<div class="card-image">
          <img loading="lazy" src="${page.image}">
        </div>
        <div class="card-body">
          <h3>${page.title}</h3>
          <p>${markedUpPath}</p>
        </div>`;
        $card.addEventListener('click', () => {
          window.location.href = path;
        });
        $results.appendChild($card);
      }
    });
  }
  $stats.innerHTML = `${counter} page${counter !== 1 ? 's' : ''} found`;
}

async function decorateMigratedPages() {
  const $filterPages = document.querySelector('main .filter-pages');
  if ($filterPages) {
    const config = readBlockConfig($filterPages);

    $filterPages.innerHTML = `<input type="text" id="page-filter" placeholder="type to filter" />
    <div class="stats" id="page-filter-stats"></div>
    <div class="results" id="page-filter-results"></div>`;

    const $pageFilter = document.getElementById('page-filter');
    $pageFilter.addEventListener('keyup', () => {
      filterMigratedPages($pageFilter.value);
    });

    const indices = config.indices.split('.json').map((e) => (e ? `${e}.json` : undefined));

    window.fullIndex = await fetchFullIndex(indices);

    filterMigratedPages($pageFilter.value);
  }
}

function decorateButtons() {
  document.querySelectorAll('main a').forEach(($a) => {
    const $up = $a.parentElement;
    const $twoup = $a.parentElement.parentElement;
    if (!$a.querySelector('img')) {
      if ($up.childNodes.length === 1 && $up.tagName === 'P') {
        $a.className = 'button secondary';
      }
      if ($up.childNodes.length === 1 && $up.tagName === 'STRONG'
          && $twoup.childNodes.length === 1 && $twoup.tagName === 'P') {
        $a.className = 'button primary';
      }
    }
  });
}

function decorateTemplate() {
  if (window.location.pathname.includes('/make/')) {
    document.body.classList.add('make-page');
  }
  const year = window.location.pathname.match(/\/20\d\d\//);
  if (year) {
    document.body.classList.add('blog-page');
  }
}

function decorateLegacyLinks() {
  const legacy = 'https://blog.adobespark.com/';
  document.querySelectorAll(`a[href^="${legacy}"]`).forEach(($a) => {
    // eslint-disable-next-line no-console
    console.log($a);
    $a.href = $a.href.substring(0, $a.href.length - 1).substring(legacy.length - 1);
  });
}

function decorateBlogPage() {
  if (document.body.classList.contains('blog-page')) {
    const $sections = document.querySelectorAll('main>div.section-wrapper>div');
    const $body = $sections[1];
    let $by;
    let $postedOn;
    $body.querySelectorAll('p').forEach(($p) => {
      if (!$by && $p.textContent.toLowerCase().startsWith('by ')) $by = $p;
      if (!$postedOn && $p.textContent.toLowerCase().startsWith('posted on ')) $postedOn = $p;
    });
    const by = $by.textContent.substring(3);
    const posted = $postedOn.textContent.substring(10).split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    $by.innerHTML = `<span class="byline"><img src="/icons/user.svg"> ${by} | ${months[+posted[0] - 1]} ${posted[1]}, ${posted[2]} </span>`;
    $postedOn.remove();
    decorateLegacyLinks();
  }
}

function decorateHowTo() {
  const $head = document.head;
  document.querySelectorAll('main .how-to-steps').forEach(($howto) => {
    const $heading = $howto.previousElementSibling;
    const $rows = Array.from($howto.children);
    const $schema = createTag('script', { type: 'application/ld+json' });
    const schema = {
      '@context': 'http://schema.org',
      '@type': 'HowTo',
      name: $heading.textContent,
      step: [],
    };

    $rows.forEach(($row, i) => {
      const $cells = Array.from($row.children);
      const $number = createTag('div', { class: 'number' });
      $number.innerHTML = `<span>${i + 1}</span>`;
      $row.prepend($number);
      schema.step.push({
        '@type': 'HowToStep',
        position: i + 1,
        name: $cells[0].textContent,
        itemListElement: {
          '@type': 'HowToDirection',
          text: $cells[1].textContent,
        },
      });
      const $h3 = createTag('h3');
      $h3.innerHTML = $cells[0].textContent;
      $cells[1].prepend($h3);
      $cells[1].classList.add('tip');
      $cells[0].remove();
    });
    $schema.innerHTML = JSON.stringify(schema);
    $head.append($schema);
  });
}

async function decorateABTests() {
  let runTest = true;
  let reason = '';

  if (!window.location.host.includes('adobe.com')) {
    runTest = false;
    reason = 'not prod host';
  }
  if (window.location.hash) {
    runTest = false;
    reason = 'suppressed by #';
  }
  if (window.location.search === '?test') {
    runTest = true;
  }
  if (navigator.userAgent.match(/bot|crawl|spider/i)) {
    runTest = false;
    reason = 'bot detected';
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
    console.log(`Test is not run => ${reason}`);
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

function decorateMetaData() {
  const $meta = document.querySelector('main .metadata');
  if ($meta) {
    const metaconfig = readBlockConfig($meta);
    const mapping = {
      title: ['og:title', 'twitter:title'],
      description: ['og:description', 'twitter:description', 'description'],
    };
    if (metaconfig.title) document.title = metaconfig.title;

    for (const a of Object.keys(mapping)) {
      if (metaconfig[a]) {
        mapping[a].forEach((b) => {
          let $elem;
          if (b.includes(':')) {
            $elem = document.querySelector(`head meta[property="${b}"]`);
          } else {
            $elem = document.querySelector(`head meta[name="${b}"]`);
          }
          if ($elem) {
            $elem.setAttribute('content', metaconfig[a]);
          }
        });
      }
    }
    $meta.remove();
  }
}

async function decoratePage() {
  await decorateABTests();
  decoratePictures();
  decorateTables();
  wrapSections('main>div');
  decorateHeader();
  decorateHero();
  decorateBlocks();
  decorateTemplate();
  decorateButtons();
  decorateHowTo();
  decorateMigratedPages();
  decorateBlogPage();
  decorateTutorials();
  decorateMetaData();
  decorateCheckerBoards();
  decorateDoMoreEmbed();
}

decoratePage();

export { loadScript as default };
