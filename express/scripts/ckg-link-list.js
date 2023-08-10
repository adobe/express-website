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
  titleCase,
  getLocale,
  getMetadata,
} from './scripts.js';

import {
  fetchLinkListFromCKGApi,
  getPillWordsMapping,
} from './api-v3-controller.js';

import { memoize } from './utils.js';
import fetchAllTemplatesMetadata from './all-templates-metadata.js';

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
            return {};
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
  const ckgMatch = pageData.ckgid === ckgData.ckgID;
  const pageDataTasks = pageData.tasks ?? pageData.templateTasks;
  const taskMatch = ckgData.tasks?.toLowerCase() === pageDataTasks?.toLowerCase();
  const currentLocale = getLocale(window.location);
  const pageLocale = pageData.url.split('/')[1] === 'express' ? 'us' : pageData.url.split('/')[1];
  const sameLocale = currentLocale === pageLocale;

  return sameLocale && ckgMatch && taskMatch;
}

function replaceLinkPill(linkPill, data) {
  const clone = linkPill.cloneNode(true);
  if (data) {
    clone.innerHTML = clone.innerHTML.replace('/express/templates/default', data.url);
    clone.innerHTML = clone.innerHTML.replaceAll('Default', data.altShortTitle || data['short-title']);
  }
  return clone;
}

async function updateSEOLinkList(container, linkPill, list) {
  container.innerHTML = '';
  const templatePages = await fetchAllTemplatesMetadata();

  if (list && templatePages) {
    list.forEach((d) => {
      const currentLocale = getLocale(window.location);
      const templatePageData = templatePages.find((p) => {
        const targetLocale = /^[a-z]{2}$/.test(p.url.split('/')[1]) ? p.url.split('/')[1] : 'us';
        const isLive = p.live === 'Y';
        const titleMatch = p['short-title']?.toLowerCase() === d.childSibling?.toLowerCase();
        const localeMatch = currentLocale === targetLocale;

        return isLive && titleMatch && localeMatch;
      });

      if (templatePageData) {
        const clone = replaceLinkPill(linkPill, templatePageData);
        container.append(clone);
      }
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

const memoizedGetPillWordsMapping = memoize(getPillWordsMapping, { ttl: 1000 * 60 * 60 * 24 });

async function updateLinkList(container, linkPill, list) {
  const templatePages = await fetchAllTemplatesMetadata();
  const pillsMapping = await memoizedGetPillWordsMapping();
  const pageLinks = [];
  const searchLinks = [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const templatePageData = templatePages.find((p) => p.live === 'Y' && matchCKGResult(d, p));
      let displayText = formatLinkPillText(d);

      const locale = getLocale(window.location);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      const localeColumnString = locale === 'us' ? 'EN' : locale.toUpperCase();

      if (pillsMapping) {
        const alternateText = pillsMapping.find((row) => window.location.pathname === `${urlPrefix}${row['Express SEO URL']}` && d.ckgID === row['CKG Pill ID']);
        const hasAlternateTextForLocale = alternateText && alternateText[`${localeColumnString}`];
        if (hasAlternateTextForLocale) {
          displayText = alternateText[`${localeColumnString}`];
          if (templatePageData) {
            templatePageData.altShortTitle = displayText;
          }
        }
      }

      if (templatePageData) {
        const clone = replaceLinkPill(linkPill, templatePageData);
        pageLinks.push(clone);
      }
    });

    pageLinks.concat(searchLinks).forEach((clone) => {
      container.append(clone);
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
        const clone = replaceLinkPill(linkPill, templatePageData);
        container.append(clone);
      });
    }
  }
}

async function lazyLoadLinklist() {
  await fetchLinkList();
  const linkList = document.querySelector('.link-list.fullwidth');

  if (linkList) {
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
    linkList?.remove();
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

      await updateSEOLinkList(topTemplatesContainer, topTemplatesTemplate, topTemplatesData);
      const hiddenDiv = seoNav.querySelector('div[style="visibility: hidden;"]');
      if (hiddenDiv) hiddenDiv.style.visibility = 'visible';
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
    if (linkListContainer) {
      const linkListTemplate = linkListContainer.querySelector('p').cloneNode(true);

      const linkListData = [];

      if (window.linkLists && window.linkLists.ckgData && getMetadata('short-title')) {
        window.linkLists.ckgData.forEach((row) => {
          linkListData.push({
            childSibling: row['child-siblings'],
            ckgID: row.ckgID,
            shortTitle: getMetadata('short-title'),
            tasks: row.parent, // task on the page
            displayValue: row.displayValue,
          });
        });
      }

      await updateLinkList(linkListContainer, linkListTemplate, linkListData);
      searchMarquee.dispatchEvent(new CustomEvent('carouselloaded'));
      linkListContainer.parentElement.classList.add('appear');
    }
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

export default async function updateAsyncBlocks() {
  hideAsyncBlocks();
  // TODO: integrate memoization
  const showSearchMarqueeLinkList = getMetadata('show-search-marquee-link-list');
  if (document.body.dataset.device === 'desktop' && (!showSearchMarqueeLinkList || ['yes', 'true', 'on', 'Y'].includes(showSearchMarqueeLinkList))) {
    await lazyLoadSearchMarqueeLinklist();
  }
  await lazyLoadLinklist();
  await lazyLoadSEOLinkList();
}
