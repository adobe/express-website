/*
 * Copyright 2022 Adobe. All rights reserved.
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
  getHelixEnv,
  titleCase,
  fetchPlaceholders,
  getLocale,
  getMetadata,
} from './scripts.js';

import {
  fetchLinkListFromCKGApi,
  getPillWordsMapping,
} from './api-v3-controller.js';

export function findMatchExistingSEOPage(path) {
  const pathMatch = (e) => e.path === path;
  return (window.templates && window.templates.data.some(pathMatch));
}

export async function fetchSheetData() {
  const env = getHelixEnv();
  const dev = new URLSearchParams(window.location.search).get('dev');
  let sheet;

  if (['yes', 'true', 'on'].includes(dev) && env && env.name === 'stage') {
    sheet = '/templates-dev.json?sheet=seo-templates&limit=10000';
  } else {
    sheet = '/express/templates/default/metadata.json?limit=10000';
  }

  if (!(window.templates && window.templates.data)) {
    window.templates = {};
    const resp = await fetch(sheet);
    window.templates.data = resp.ok ? (await resp.json()).data : [];
  }
}

async function redirectToExistingPage() {
  // todo check if the search query points to an existing page. If so, redirect.
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (params.topics) {
    const targetPath = `/express/templates/${params.tasks}`.concat(params.topics ? `/${params.topics}` : '');
    const locale = getLocale(window.location);
    const pathToMatch = locale === 'us' ? targetPath : `/${locale}${targetPath}`;
    if (findMatchExistingSEOPage(pathToMatch)) {
      window.location.replace(`${window.location.origin}${pathToMatch}`);
    }
  }
}

async function fetchLinkList() {
  if (!window.linkLists) {
    window.linkLists = {};
    if (!window.linkLists.ckgData) {
      const response = await fetchLinkListFromCKGApi();
      // catch data from CKG API, if empty, use top priority categories sheet
      if (response && response.queryResults[0].facets) {
        window.linkLists.ckgData = response.queryResults[0].facets[0].buckets.map((ckgItem) => {
          let formattedTasks;
          if (getMetadata('template-search-page') === 'Y') {
            const params = new Proxy(new URLSearchParams(window.location.search), {
              get: (searchParams, prop) => searchParams.get(prop),
            });
            formattedTasks = titleCase(params.tasks).replace(/[$@%"]/g, '');
          } else {
            formattedTasks = titleCase(getMetadata('tasks')).replace(/[$@%"]/g, '');
          }

          return {
            parent: formattedTasks,
            'child-siblings': `${titleCase(ckgItem.displayValue)} ${formattedTasks}`,
            ckgID: ckgItem.canonicalName,
            displayValue: ckgItem.displayValue,
          };
        });
      }
    }

    if (!window.linkLists.sheetData) {
      const resp = await fetch('/express/templates/top-priority-categories.json');
      window.linkLists.sheetData = resp.ok ? (await resp.json()).data : [];
    }
  }
}

function matchCKGResult(ckgData, pageData) {
  const ckgMatch = pageData.ckgID === ckgData.ckgID;
  const taskMatch = ckgData.tasks.toLowerCase() === pageData.tasks.toLowerCase();
  const currentLocale = getLocale(window.location);
  const pageLocale = pageData.url.split('/')[1] === 'express' ? 'us' : pageData.url.split('/')[1];
  const sameLocale = currentLocale === pageLocale;

  return sameLocale && ckgMatch && taskMatch;
}

function replaceLinkPill(linkPill, data) {
  const clone = linkPill.cloneNode(true);
  if (data) {
    clone.innerHTML = clone.innerHTML.replace('/express/templates/default', data.url);
    clone.innerHTML = clone.innerHTML.replaceAll('Default', data.altShortTitle || data['short title']);
  }
  return clone;
}

function updateSEOLinkList(container, linkPill, list) {
  const templatePages = window.templates.data ?? [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const currentLocale = getLocale(window.location);
      const templatePageData = templatePages.find((p) => {
        const targetLocale = /^[a-z]{2}$/.test(p.url.split('/')[1]) ? p.url.split('/')[1] : 'us';
        const isLive = p.live === 'Y';
        const titleMatch = p['short title'].toLowerCase() === d.childSibling.toLowerCase();
        const localeMatch = currentLocale === targetLocale;

        return isLive && titleMatch && localeMatch;
      });
      const clone = replaceLinkPill(linkPill, templatePageData);
      container.append(clone);
    });
  }
}

function formatLinkPillText(linkPillData) {
  const digestedDisplayValue = titleCase(linkPillData.displayValue.replace(/-/g, ' '));
  const digestedChildSibling = titleCase(linkPillData.childSibling.replace(/-/g, ' '));
  const topics = getMetadata('topics') !== '" "' ? `${getMetadata('topics').replace(/[$@%"]/g, '').replace(/-/g, ' ')}` : '';

  const displayTopics = topics && linkPillData.childSibling.indexOf(titleCase(topics)) < 0 ? titleCase(topics) : '';
  let displayText;

  if (getMetadata('tasks')) {
    displayText = `${displayTopics} ${digestedDisplayValue} ${digestedChildSibling}`
      .split(' ')
      .filter((item, i, allItems) => i === allItems.indexOf(item))
      .join(' ').trim();
  } else {
    displayText = `${digestedDisplayValue} ${digestedChildSibling} ${displayTopics}`
      .split(' ')
      .filter((item, i, allItems) => i === allItems.indexOf(item))
      .join(' ').trim();
  }

  return displayText;
}

async function updateLinkList(container, linkPill, list) {
  const templatePages = window.templates.data ?? [];
  const pillsMapping = await getPillWordsMapping();
  const pageLinks = [];
  const searchLinks = [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const topics = getMetadata('topics') !== '" "' ? `${getMetadata('topics').replace(/[$@%"]/g, '')}` : '';
      const templatePageData = templatePages.find((p) => p.live === 'Y' && matchCKGResult(d, p));
      const topicsQuery = `${topics ?? topics} ${d.displayValue}`.split(' ')
        .filter((item, i, allItems) => i === allItems.indexOf(item))
        .join(' ').trim();
      let displayText = formatLinkPillText(d);

      const locale = getLocale(window.location);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      const localeColumnString = locale === 'us' ? 'EN' : locale.toUpperCase();

      if (pillsMapping) {
        const alternateText = pillsMapping.find((row) => getMetadata('url') === `${urlPrefix}${row['Express SEO URL']}` && d.ckgID === row['CKG Pill ID']);

        if (alternateText && alternateText[`${localeColumnString}`]) {
          displayText = alternateText[`${localeColumnString}`];
          if (templatePageData) {
            templatePageData.altShortTitle = displayText;
          }
        }
      }

      if (templatePageData) {
        const clone = replaceLinkPill(linkPill, templatePageData);
        pageLinks.push(clone);
      } else if (d.ckgID) {
        const currentTasks = getMetadata('tasks') ? getMetadata('tasks').replace(/[$@%"]/g, '') : ' ';

        const searchParams = `tasks=${currentTasks}&phformat=${getMetadata('placeholder-format')}&topics=${topicsQuery}&ckgid=${d.ckgID}`;
        const clone = linkPill.cloneNode(true);

        clone.innerHTML = clone.innerHTML.replace('/express/templates/default', `${urlPrefix}/express/templates/search?${searchParams}`);
        clone.innerHTML = clone.innerHTML.replaceAll('Default', displayText);
        searchLinks.push(clone);
      }

      pageLinks.concat(searchLinks).forEach((clone) => {
        container.append(clone);
      });
    });

    if (container.children.length === 0) {
      const linkListData = [];

      window.linkLists.sheetData.forEach((row) => {
        if (row.parent === getMetadata('short-title')) {
          linkListData.push({
            childSibling: row['child-siblings'],
            shortTitle: getMetadata('short-title'),
            tasks: getMetadata('tasks'),
          });
        }
      });

      linkListData.forEach((d) => {
        const templatePageData = templatePages.find((p) => p.live === 'Y' && p.shortTitle === d.childSibling);
        replaceLinkPill(linkPill, templatePageData, container);
      });
    }
  }
}

async function updateMetadata() {
  // TODO: update metadata with Search Param
  const head = document.querySelector('head');
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (head && params.tasks && params.phformat) {
    const placeholders = await fetchPlaceholders();
    const categories = JSON.parse(placeholders['task-categories']);
    if (categories) {
      const TasksPair = Object.entries(categories).find((cat) => cat[1] === params.tasks);
      const translatedTasks = TasksPair ? TasksPair[0].toLowerCase() : params.tasks;
      head.innerHTML = head.innerHTML
        .replaceAll('{{queryTasks}}', params.tasks || '')
        .replaceAll('{{QueryTasks}}', titleCase(params.tasks || ''))
        .replaceAll('{{translatedTasks}}', translatedTasks || '')
        .replaceAll('{{TranslatedTasks}}', titleCase(translatedTasks || ''))
        .replaceAll('{{placeholderRatio}}', params.phformat || '')
        .replaceAll('{{QueryTopics}}', titleCase(params.topics || ''))
        .replaceAll('{{queryTopics}}', params.topics || '')
        .replaceAll('{{query}}', params.q || '');
    }
  }
}

async function replaceDefaultPlaceholders(template) {
  template.innerHTML = template.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', getMetadata('create-link') || '/');

  if (getMetadata('tasks') === '') {
    const placeholders = await fetchPlaceholders().then((result) => result);
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
  } else {
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', getMetadata('create-text') || '');
  }
}

async function autoUpdatePage() {
  if (['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
    await updateMetadata();
    await redirectToExistingPage();
  }

  const main = document.querySelector('main');
  if (main) {
    const allReplaceableBlades = [...main.innerText.matchAll(/{{(.*?)}}/g)];

    if (allReplaceableBlades.length > 0) {
      allReplaceableBlades.forEach((regex) => {
        main.innerHTML = main.innerHTML.replaceAll(regex[0], getMetadata(regex[1]) || '');
      });
    }
  }
}

function validatePage() {
  const env = getHelixEnv();
  if (!(env && env.name === 'stage') || getMetadata('live') === 'N') {
    window.location.replace('/express/templates/');
  }
}

async function updateEagerBlocks() {
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');
  const templateX = document.querySelector('.template-x');
  const browseByCat = document.querySelector('.browse-by-category');

  if (templateList) {
    await replaceDefaultPlaceholders(templateList);
  }

  if (templateX) {
    await replaceDefaultPlaceholders(templateX);
  }

  if (browseByCat) {
    const placeholders = await fetchPlaceholders().then((result) => result);
    browseByCat.innerHTML = browseByCat.innerHTML
      .replaceAll('https://www.adobe.com/express/templates/default', getMetadata('categories-view-all-link') || '/')
      .replaceAll('default-view-all-text', placeholders['view-all'] || '');
  }
}

async function lazyLoadLinklist() {
  await fetchLinkList();
  const linkList = document.querySelector('.link-list.fullwidth');

  if (linkList && window.templates.data) {
    const linkListContainer = linkList.querySelector('p').parentElement;
    const linkListTemplate = linkList.querySelector('p').cloneNode(true);
    const linkListData = [];

    if (window.linkLists && window.linkLists.ckgData && getMetadata('short-title')) {
      window.linkLists.ckgData.forEach((row) => {
        linkListData.push({
          childSibling: row['child-siblings'],
          ckgID: row.ckgID,
          shortTitle: getMetadata('short-title'),
          tasks: row.parent,
          displayValue: row.displayValue,
        });
      });
    }

    await updateLinkList(linkListContainer, linkListTemplate, linkListData);
    linkList.style.visibility = 'visible';
  } else {
    linkList.remove();
  }
}

async function lazyLoadSEOLinkList() {
  await fetchLinkList();
  const seoNav = document.querySelector('.seo-nav');

  if (seoNav) {
    const topTemplatesContainer = seoNav.querySelector('p').parentElement;
    const topTemplates = getMetadata('top-templates');
    if (topTemplates) {
      const topTemplatesTemplate = seoNav.querySelector('p').cloneNode(true);
      const topTemplatesData = topTemplates.split(', ').map((cs) => ({ childSibling: cs }));

      updateSEOLinkList(topTemplatesContainer, topTemplatesTemplate, topTemplatesData);
      topTemplatesContainer.style.visibility = 'visible';
    } else {
      topTemplatesContainer.innerHTML = '';
    }
  }
}

async function lazyLoadSearchMarqueeLinklist() {
  await fetchLinkList();
  const searchMarquee = document.querySelector('.search-marquee');

  if (searchMarquee) {
    const linkListContainer = searchMarquee.querySelector('.carousel-container > .carousel-platform');
    const linkListTemplate = linkListContainer.querySelector('p').cloneNode(true);

    const linkListData = [];

    if (window.linkLists && window.linkLists.ckgData && getMetadata('short-title')) {
      window.linkLists.ckgData.forEach((row) => {
        linkListData.push({
          childSibling: row['child-siblings'],
          ckgID: row.ckgID,
          shortTitle: getMetadata('short-title'),
          tasks: row.parent,
          displayValue: row.displayValue,
        });
      });
    }

    await updateLinkList(linkListContainer, linkListTemplate, linkListData);
    linkListContainer.parentElement.classList.add('appear');
  }
}

function hideAsyncBlocks() {
  const linkList = document.querySelector('.link-list.fullwidth');
  const seoNav = document.querySelector('.seo-nav');

  if (linkList) {
    linkList.style.visibility = 'hidden';
  }

  if (seoNav) {
    const topTemplatesContainer = seoNav.querySelector('p').parentElement;
    topTemplatesContainer.style.visibility = 'hidden';
  }
}

async function updateLazyBlocks() {
  hideAsyncBlocks();
  await fetchSheetData();
  // FIXME: integrate memoization
  await lazyLoadSearchMarqueeLinklist();
  await lazyLoadLinklist();
  await lazyLoadSEOLinkList();
}

await autoUpdatePage();
validatePage();
await updateEagerBlocks();
updateLazyBlocks();

// const page = await fetchPageContent(window.location.pathname);
//
// if (page) {
//   await fetchLinkList(page);
//   if (['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
//     const data = await formatSearchQuery(page);
//     if (!data) {
//       window.location.replace('/express/templates/');
//     } else {
//       const purgedData = formatAllTaskText(data);
//       updateMetadata(purgedData);
//       await updateBlocks(purgedData);
//     }
//   } else {
//     await updateBlocks(page);
//   }
// } else {
//   const env = getHelixEnv();
//
//   if ((env && env.name !== 'stage') || window.location.pathname !== '/express/templates/default') {
//     window.location.replace('/404');
//   }
// }
