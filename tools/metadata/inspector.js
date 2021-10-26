/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const locales = ['', '/br', '/cn', '/it', '/de', '/dk', '/fr', '/es', '/fi', '/jp', '/kr', '/nl', '/no', '/se', '/tw'];
let headerColsLookup = {};
let currentView = 'metadata.xlsx';

const status = {
  numRowsDisplayed: 0,
  numRowsLoaded: 0,
  publishQueue: [],
};

function createTag(name, attrs) {
  const el = document.createElement(name);
  if (typeof attrs === 'object') {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

async function fetchJson(url) {
  try {
    // eslint-disable-next-line no-console
    console.log(`fetching ${url}`);
    const start = new Date();
    const resp = await fetch(url, { cache: 'no-store' });
    const json = await resp.json();
    // eslint-disable-next-line no-console
    console.log(`[${new Date() - start}ms] fetched index ${url}`);
    return (json.data);
  } catch {
    return [];
  }
}

function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

async function fetchIndex(prefix) {
  const url = `${prefix}/query-index.json`;
  const blogurl = `${prefix}/learn/blog/query-index.json`;
  const index = [...await fetchJson(url), ...await fetchJson(blogurl)];
  index.sort((e1, e2) => e1.path.localeCompare(e2.path));
  return (index);
}

async function getPages(prefixes) {
  const index = [];
  for (const prefix of prefixes) {
    // eslint-disable-next-line no-await-in-loop
    const segment = await fetchIndex(prefix);
    index.push(...segment);
  }
  return (index);
}

function isValidPath(path) {
  const validPath = /[0-9a-z-/*]/;
  return (validPath.test(path));
}

function convertGlobToRe(glob) {
  let reString = glob.replace(/\*\*/g, '_');
  reString = reString.replace(/\*/g, '[0-9a-z-]*');
  reString = reString.replace(/_/g, '.*');
  return (new RegExp(reString));
}

function addToMeta(meta, props) {
  const keys = Object.keys(props);
  const mkeys = Object.keys(props).map((e) => toClassName(e));
  keys.forEach((key, i) => {
    if (!['re', 'URL'].includes(key)) {
      const prop = props[key];
      if (prop) {
        meta[mkeys[i]] = prop;
      }
    }
  });
}

const $filter = document.getElementById('filter');

function updateStatus() {
  const $status = document.getElementById('status');
  let publishStatus = '';
  if (status.publishQueue.length) {
    publishStatus = `${status.publishQueue.length} in publish queue, `;
  }
  $status.innerHTML = `${publishStatus} Showing ${status.numRowsDisplayed} / ${status.numRowsLoaded} pages`;
}

function filterPages() {
  const filterStr = $filter.value;
  const filterMatches = filterStr.matchAll(/([a-z-]*(:?(".*"|[a-z-]*)))/g);
  const filtersArr = [...filterMatches].map((m) => m[0]).filter((f) => f);
  const filters = filtersArr.map((str) => {
    if (str.includes(':')) {
      const [scope, filterQuoted] = str.split(':');
      const filter = filterQuoted.replace(/"/g, '');
      return ({ scope, filter });
    } else {
      return ({ scope: 'global', filter: str });
    }
  });
  let displayCount = 0;
  document.querySelectorAll('main .pages tr.row').forEach(($tr) => {
    if (filters.every((f) => {
      let matched = false;
      let textContent = '';
      if (f.scope === 'global') {
        textContent = $tr.textContent.toLowerCase();
      } else if (headerColsLookup[f.scope]) {
        textContent = $tr.children[headerColsLookup[f.scope]].textContent.toLowerCase();
      }

      if (textContent.includes(f.filter.toLowerCase())) {
        matched = true;
      }
      return matched;
    })) {
      $tr.classList.remove('hidden');
      $tr.classList.add('show');
      displayCount += 1;
    } else {
      $tr.classList.add('hidden');
      $tr.classList.remove('show');
    }
  });
  status.numRowsDisplayed = displayCount;
  updateStatus();
}

async function publish(path) {
  const purgeURL = new URL(path, window.location.href);
  /* eslint-disable no-console */
  console.log(`purging ${purgeURL.href}`);
  const xfh = ['spark-website--adobe.hlx.live'];
  const resp = await fetch(purgeURL.href, {
    method: 'POST',
    headers: {
      'X-Method-Override': 'HLXPURGE',
      'X-Forwarded-Host': xfh.join(', '),
    },
  });
  const json = await resp.json();
  console.log(JSON.stringify(json));
  /* eslint-enable no-console */
}

async function processPublishQueue() {
  const q = status.publishQueue;
  while (q.length) {
    const path = q[0];

    // eslint-disable-next-line no-await-in-loop
    await publish(path);
    q.shift();
    updateStatus();
  }
}

function createTable(pages, metadata, view) {
  const patterns = [];
  let table = {};

  const simplePaths = { paths: [], lookup: {} };
  metadata.forEach((row) => {
    if (row.URL.includes('*')) {
      row.re = convertGlobToRe(row.URL);
      patterns.push(row);
    } else {
      simplePaths.paths.push(row.URL);
      simplePaths.lookup[row.URL] = row;
    }
  });

  if (view === 'metadata.xlsx') {
    const cols = Object.keys(metadata[0]).map((e) => toClassName(e));
    cols.shift();
    cols.pop();

    const headers = ['page', ...cols];
    const rows = [];

    pages.forEach((page) => {
      const path = page.path.split('.')[0];
      const meta = {};
      const data = [];
      patterns.forEach((row) => {
        if (row.re.test(path)) {
          addToMeta(meta, row);
        }
      });
      if (simplePaths.paths.includes(path)) {
        addToMeta(meta, simplePaths.lookup[path]);
      }
      cols.forEach((col) => {
        data.push(meta[col] || '');
      });
      rows.push({ path, data });
    });
    table = { headers, rows };
  }

  if (view === 'index') {
    const cols = Object.keys(pages[0]).map((e) => toClassName(e));
    cols.shift();

    const headers = ['page', 'short-title', 'title'];
    const srcHeaders = ['shortTitle', 'title'];

    const rows = [];

    pages.forEach((page) => {
      const path = page.path.split('.')[0];
      const data = [];
      srcHeaders.forEach((key) => data.push(page[key] ? page[key] : ''));
      rows.push({ path, data });
    });
    table = { headers, rows };
  }

  if (view === 'diff') {
    const cols = Object.keys(pages[0]).map((e) => toClassName(e));
    cols.shift();

    const headers = ['page', 'short-title', 'title'];
    const srcHeaders = ['shortTitle', 'title'];
    const metaHeaders = ['Short Title', 'Title'];

    const rows = [];

    pages.forEach((page) => {
      const path = page.path.split('.')[0];
      const data = [];
      let style = '';
      const metaItem = simplePaths.lookup[path];
      srcHeaders.forEach((key, i) => {
        const pageValue = page[key] ? page[key] : '';
        const metaValue = metaItem ? metaItem[metaHeaders[i]] : '';
        if (metaValue && (metaValue !== pageValue)) {
          data.push(`[metadata.xlsx]<br>${metaValue}<br><br>[index]<br>${pageValue}`);
          style = 'orange';
        } else {
          data.push(pageValue);
        }
      });
      rows.push({ path, data, style });
    });
    table = { headers, rows };
  }

  return (table);
}

async function loadData() {
  const $loading = document.getElementById('loading');
  $loading.classList.remove('hidden');

  const $select = document.getElementById('prefix-selector');
  const prefix = $select.value;
  const prefixes = prefix ? [prefix] : locales.map((l) => `${l}/express`);
  const pages = await getPages(prefixes);

  status.numRowsLoaded = pages.length;

  const metadataRaw = await fetchJson('/metadata.json');
  const metadata = metadataRaw.filter((row) => {
    row.URL = row.URL.trim();
    return isValidPath(row.URL);
  });
  $loading.classList.add('hidden');
  return ({ metadata, pages });
}

async function displayPages(data, view) {
  const { pages, metadata } = data;
  const table = createTable(pages, metadata, view);

  const $pages = document.querySelector('.pages');
  $pages.innerHTML = '';
  headerColsLookup = {};

  const $table = createTag('table');
  const $tr = createTag('tr', { class: 'header' });
  table.headers.forEach((e, i) => {
    const $th = createTag('th', { class: 'header' });
    $th.innerHTML = e;
    headerColsLookup[e.toLowerCase()] = i;
    $tr.appendChild($th);
  });
  $table.appendChild($tr);

  table.rows.forEach((page) => {
    const { path } = page;
    const $tdr = createTag('tr', { class: `row ${page.style}` });
    const $th = createTag('th', { class: 'row' });
    $th.innerHTML = `<a href="${path}">${path}</a>
    <div class="tools"><a href="${path}.lnk" class="button">Edit</a><button class="publish">Publish</button></div>`;
    $th.querySelector('button.publish').addEventListener('click', () => {
      status.publishQueue.push(path);
      if (status.publishQueue.length === 1) {
        processPublishQueue();
      }
      updateStatus();
    });
    $tdr.appendChild($th);
    page.data.forEach((td) => {
      const $td = createTag('td');
      $td.innerHTML = td;
      $tdr.appendChild($td);
    });
    $table.appendChild($tdr);
  });
  $pages.appendChild($table);
  filterPages();
}

let pageData = {};

function populatePrefixSelect() {
  const $select = document.getElementById('prefix-selector');
  locales.forEach((locale) => {
    const $option = createTag('option', { value: `${locale}/express` });
    $option.innerHTML = `${locale}/express/`;
    $select.appendChild($option);
  });
  const $option = createTag('option', { value: '' });
  $option.innerHTML = '(all)';
  $select.appendChild($option);
  $select.addEventListener('change', async () => {
    pageData = await loadData();
    displayPages(pageData, currentView);
  });
}

populatePrefixSelect();

async function initPagesTable() {
  pageData = await loadData();
  displayPages(pageData, currentView);
}

initPagesTable();

document.getElementById('copy').addEventListener('click', () => {
  const $ta = document.getElementById('copybuffer');

  const $pages = document.querySelectorAll('main .pages tr.row.show');
  const rows = [];
  $pages.forEach(($tr) => {
    const row = [];
    [...$tr.children].forEach(($cell, i) => {
      let data = $cell.textContent;
      if (!i) data = data.replace('EditPublish', '').trim();
      row.push(data);
    });
    rows.push(row.join('\t'));
  });
  $ta.value = rows.join('\n');

  $ta.select();
  $ta.setSelectionRange(0, 9999999);

  document.execCommand('copy');

  // eslint-disable-next-line no-alert
  window.alert(`copied ${$pages.length} rows to clipboard`);
});

$filter.addEventListener('keyup', () => {
  filterPages();
});

const $switcher = document.getElementById('switcher');
const $buttons = [...$switcher.querySelectorAll('button')];

$buttons.forEach(($button) => {
  $button.addEventListener('click', () => {
    $buttons.forEach(($b) => {
      $b.className = $button === $b ? 'pressed' : '';
    });
    currentView = $button.textContent;
    displayPages(pageData, currentView);
  });
});
