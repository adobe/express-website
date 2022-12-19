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

const sitemapURLs = [];
const allLangs = {};

async function loadSitemap(sitemapURL) {
  const resp = await fetch(sitemapURL);
  const xml = await resp.text();
  const sitemap = new DOMParser().parseFromString(xml, 'text/xml');
  const subSitemaps = [...sitemap.querySelectorAll('sitemap loc')];
  for (let i = 0; i < subSitemaps.length; i += 1) {
    const loc = subSitemaps[i];
    const subSitemapURL = new URL(loc.textContent.trim());
    // eslint-disable-next-line no-await-in-loop
    await loadSitemap(subSitemapURL.pathname);
  }
  const urlLocs = sitemap.querySelectorAll('url loc');
  urlLocs.forEach((loc) => {
    const locURL = new URL(loc.textContent.trim());
    console.log(locURL.pathname);
    const lastMod = loc.parentElement.querySelector('lastmod') ? loc.parentElement.querySelector('lastmod').textContent.trim() : '';
    const hreflangs = {};
    loc.parentElement.querySelectorAll('[hreflang]').forEach((link) => {
      const lang = link.getAttribute('hreflang');
      hreflangs[lang] = link.getAttribute('href');
      if (!allLangs[lang]) allLangs[lang] = true;
    });
    sitemapURLs[locURL.pathname] = { lastMod, hreflangs };
  });
}

function createRow(values, tagName = 'td') {
  const tr = document.createElement('tr');
  values.forEach((value) => {
    const td = document.createElement(tagName);
    td.innerHTML = value;
    tr.append(td);
  });
  return tr;
}

function createTable(urls, filter) {
  const keys = Object.keys(urls);
  const allLangsArr = Object.keys(allLangs);
  const filtered = keys.filter((path) => path.startsWith(filter));
  const table = document.createElement('table');
  const header = createRow(['path', ...allLangsArr], 'th');
  table.append(header);

  filtered.sort();
  filtered.forEach((key) => {
    const e = urls[key];
    const langs = allLangsArr.map((lang) => {
      if (e.hreflangs && e.hreflangs[lang]) return true;
      else return false;
    });
    const lastMod = new Date(e.lastMod);

    const cells = langs.map((value, i) => {
      if (value) {
        const href = e.hreflangs[allLangsArr[i]];
        const { pathname } = new URL(href);
        const ref = sitemapURLs[pathname];
        const refLastMod = new Date(ref.lastMod);
        let color;
        if (lastMod > refLastMod) color = 'older';
        if (lastMod < refLastMod) color = 'newer';

        return `<a href="${pathname}"><span class="dot ${color}"></span></a>`;
      }
      return '';
    });
    const row = createRow([key, ...cells]);
    table.append(row);
  });
  return table;
}

async function displayPages() {
  await loadSitemap('/express/sitemap.xml');
  const pagesEl = document.querySelector('.pages');
  const table = createTable(sitemapURLs, '/express/');
  pagesEl.append(table);
}

displayPages();
