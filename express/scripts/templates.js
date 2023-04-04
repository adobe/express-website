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
  arrayToObject,
  titleCase,
  createTag,
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

export async function fetchPageContent(path) {
  const env = getHelixEnv();
  const dev = new URLSearchParams(window.location.search).get('dev');
  let sheet;

  if (['yes', 'true', 'on'].includes(dev) && env && env.name === 'stage') {
    sheet = '/templates-dev.json?sheet=seo-templates&limit=10000';
  } else {
    sheet = '/express/templates/content.json?sheet=seo-templates&limit=10000';
  }

  if (!(window.templates && window.templates.data)) {
    window.templates = {};
    const resp = await fetch(sheet);
    window.templates.data = resp.ok ? (await resp.json()).data : [];
  }

  const page = window.templates.data.find((p) => p.path === path);

  if (env && env.name === 'stage') {
    return page || null;
  }

  return page && page.live !== 'N' ? page : null;
}

async function formatSearchQuery(data) {
  // todo check if the search query points to an existing page. If so, redirect.
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const locale = getLocale(window.location);
  const targetPath = `/express/templates/${params.tasks}`.concat(params.topics ? `/${params.topics}` : '');
  const pathToMatch = locale === 'us' ? targetPath : `/${locale}${targetPath}`;

  if (findMatchExistingSEOPage(pathToMatch)) {
    window.location.replace(`${window.location.origin}${pathToMatch}`);
  }

  const dataArray = Object.entries(data);

  if (params.tasks && params.phformat) {
    const placeholders = await fetchPlaceholders();
    const categories = JSON.parse(placeholders['task-categories']);
    if (categories) {
      const TasksPair = Object.entries(categories).find((cat) => cat[1] === params.tasks);
      const translatedTasks = TasksPair ? TasksPair[0].toLowerCase() : params.tasks;
      dataArray.forEach((col) => {
        col[1] = col[1].replace('{{queryTasks}}', params.tasks || '');
        col[1] = col[1].replace('{{QueryTasks}}', titleCase(params.tasks || ''));
        col[1] = col[1].replace('{{translatedTasks}}', translatedTasks || '');
        col[1] = col[1].replace('{{TranslatedTasks}}', titleCase(translatedTasks || ''));
        col[1] = col[1].replace('{{placeholderRatio}}', params.phformat || '');
        col[1] = col[1].replace('{{QueryTopics}}', titleCase(params.topics || ''));
        col[1] = col[1].replace('{{queryTopics}}', params.topics || '');
      });
    }
  } else {
    return false;
  }

  return arrayToObject(dataArray);
}

async function fetchLinkList(data) {
  if (!window.linkLists) {
    window.linkLists = {};
    if (!window.linkLists.ckgData) {
      const response = await fetchLinkListFromCKGApi(data);
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
            formattedTasks = titleCase(data.templateTasks).replace(/[$@%"]/g, '');
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
  const taskMatch = ckgData.tasks.toLowerCase() === pageData.templateTasks.toLowerCase();
  const currentLocale = getLocale(window.location);
  const pageLocale = pageData.path.split('/')[1] === 'express' ? 'us' : pageData.path.split('/')[1];
  const sameLocale = currentLocale === pageLocale;

  return sameLocale && ckgMatch && taskMatch;
}

function replaceLinkPill(linkPill, data) {
  const clone = linkPill.cloneNode(true);
  if (data) {
    clone.innerHTML = clone.innerHTML.replace('/express/templates/default', data.path);
    clone.innerHTML = clone.innerHTML.replaceAll('Default', data.altShortTitle || data.shortTitle);
  }
  return clone;
}

function updateSEOLinkList(container, linkPill, list) {
  const templatePages = window.templates.data ?? [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const templatePageData = templatePages.find((p) => p.live === 'Y'
        && p.shortTitle.toLowerCase() === d.childSibling.toLowerCase());
      const clone = replaceLinkPill(linkPill, templatePageData);
      container.append(clone);
    });
  }
}

function formatLinkPillText(pageData, linkPillData) {
  const digestedDisplayValue = titleCase(linkPillData.displayValue.replace(/-/g, ' '));
  const digestedChildSibling = titleCase(linkPillData.childSibling.replace(/-/g, ' '));
  const topics = pageData.templateTopics !== '" "' ? `${pageData.templateTopics.replace(/[$@%"]/g, '').replace(/-/g, ' ')}` : '';

  const displayTopics = topics && linkPillData.childSibling.indexOf(titleCase(topics)) < 0 ? titleCase(topics) : '';
  let displayText;

  if (pageData.templateTasks) {
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

async function updateLinkList(container, linkPill, list, pageData) {
  const templatePages = window.templates.data ?? [];
  const pillsMapping = await getPillWordsMapping();
  const pageLinks = [];
  const searchLinks = [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const topics = pageData.templateTopics !== '" "' ? `${pageData.templateTopics.replace(/[$@%"]/g, '')}` : '';
      const templatePageData = templatePages.find((p) => p.live === 'Y' && matchCKGResult(d, p));
      const topicsQuery = `${topics ?? topics} ${d.displayValue}`.split(' ')
        .filter((item, i, allItems) => i === allItems.indexOf(item))
        .join(' ').trim();
      let displayText = formatLinkPillText(pageData, d);

      const locale = getLocale(window.location);
      const urlPrefix = locale === 'us' ? '' : `/${locale}`;
      const localeColumnString = locale === 'us' ? 'EN' : locale.toUpperCase();

      if (pillsMapping) {
        const alternateText = pillsMapping.find((row) => pageData.path === `${urlPrefix}${row['Express SEO URL']}` && d.ckgID === row['CKG Pill ID']);

        if (alternateText) {
          displayText = alternateText[`${localeColumnString}`];
          if (templatePageData) {
            templatePageData.altShortTitle = displayText;
          }
        }
      }

      if (templatePageData) {
        const clone = replaceLinkPill(linkPill, templatePageData);
        pageLinks.push(clone);
      } else if (d.ckgID && (getLocale(window.location) === 'us' || getHelixEnv().name !== 'prod')) {
        const currentTasks = pageData.templateTasks ? pageData.templateTasks.replace(/[$@%"]/g, '') : ' ';

        const searchParams = `tasks=${currentTasks}&phformat=${pageData.placeholderFormat}&topics=${topicsQuery}&ckgid=${d.ckgID}`;
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
        if (row.parent === pageData.shortTitle) {
          linkListData.push({
            childSibling: row['child-siblings'],
            shortTitle: pageData.shortTitle,
            tasks: pageData.templateTasks,
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

function updateMetadata(data) {
  const $head = document.querySelector('head');
  const $title = $head.querySelector('title');
  let $metaTitle = document.querySelector('meta[property="og:title"]');
  let $twitterTitle = document.querySelector('meta[name="twitter:title"]');
  let $description = document.querySelector('meta[property="og:description"]');

  if ($title) {
    $title.textContent = data.metadataTitle;

    if ($metaTitle) {
      $metaTitle.setAttribute('content', data.metadataTitle);
    } else {
      $metaTitle = createTag('meta', { property: 'og:title', content: data.metadataTitle });
      $head.append($metaTitle);
    }

    if ($description) {
      $description.setAttribute('content', data.metadataDescription);
    } else {
      $description = createTag('meta', { property: 'og:description', content: data.metadataDescription });
      $head.append($description);
    }

    if ($twitterTitle) {
      $twitterTitle.setAttribute('content', data.metadataTitle);
    } else {
      $twitterTitle = createTag('meta', { property: 'twitter:title', content: data.metadataTitle });
      $head.append($twitterTitle);
    }
  }
}

function formatAllTaskText(data) {
  const formattedData = data;

  if (formattedData.templateTasks === "''" || formattedData.templateTopics === "''") {
    Object.entries(formattedData).forEach((entry) => {
      formattedData[entry[0]] = entry[1].replace("''", '');
    });
  }

  return formattedData;
}

async function updateBlocks(data) {
  const heroAnimation = document.querySelector('.hero-animation.wide');
  const linkList = document.querySelector('.link-list.fullwidth');
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');
  const seoNav = document.querySelector('.seo-nav');

  if (data.shortTitle) {
    const shortTitle = createTag('meta', { name: 'short-title', content: data.shortTitle });
    const $head = document.querySelector('head');
    $head.append(shortTitle);
  }

  if (heroAnimation) {
    if (data.heroAnimationTitle) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', data.heroAnimationTitle);
    }

    if (data.heroAnimationText) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template text', data.heroAnimationText);
    }
  }

  const linkListContainer = linkList.querySelector('p').parentElement;

  if (linkList && window.templates.data) {
    const linkListTemplate = linkList.querySelector('p').cloneNode(true);
    const linkListData = [];

    if (window.linkLists && window.linkLists.ckgData && data.shortTitle) {
      window.linkLists.ckgData.forEach((row) => {
        linkListData.push({
          childSibling: row['child-siblings'],
          ckgID: row.ckgID,
          shortTitle: data.shortTitle,
          tasks: row.parent,
          displayValue: row.displayValue,
        });
      });
    }

    await updateLinkList(linkListContainer, linkListTemplate, linkListData, data);
  } else {
    linkListContainer.remove();
  }

  if (templateList) {
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-title', data.shortTitle || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-tasks', data.templateTasks || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-topics', data.templateTopics || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-locale', data.templateLocale || 'en');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-premium', data.templatePremium || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-animated', data.templateAnimated || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', data.createLink || '/');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-format', data.placeholderFormat || '');

    if (data.templateTasks === '') {
      const placeholders = await fetchPlaceholders().then((result) => result);
      templateList.innerHTML = templateList.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
    } else {
      templateList.innerHTML = templateList.innerHTML.replaceAll('default-create-link-text', data.createText || '');
    }
  }

  if (seoNav) {
    const topTemplatesContainer = seoNav.querySelector('p').parentElement;

    if (window.templates.data && data.topTemplates) {
      const topTemplatesTemplate = seoNav.querySelector('p').cloneNode(true);
      const topTemplatesData = data.topTemplates.split(', ').map((cs) => ({ childSibling: cs }));

      updateSEOLinkList(topTemplatesContainer, topTemplatesTemplate, topTemplatesData);
    } else {
      topTemplatesContainer.innerHTML = '';
    }

    if (data.topTemplatesTitle) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates title', data.topTemplatesTitle);
    }

    if (data.topTemplatesText) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', data.topTemplatesText);
    } else {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', '');
    }
  }
}

const redirects = await fetch('/redirects.json?limit=99999');
if (redirects.ok) {
  const json = await redirects.json();
  const toRedirect = json.data.find((row) => row.Source === window.location.pathname);
  if (toRedirect) {
    window.location.assign(toRedirect.Destination);
  }
}

const page = await fetchPageContent(window.location.pathname);

if (page) {
  await fetchLinkList(page);
  if (getMetadata('template-search-page') === 'Y') {
    const data = await formatSearchQuery(page);
    if (!data) {
      window.location.replace('/express/templates/');
    } else {
      const purgedData = formatAllTaskText(data);
      updateMetadata(purgedData);
      await updateBlocks(purgedData);
    }
  } else {
    await updateBlocks(page);
  }
} else {
  const env = getHelixEnv();

  if ((env && env.name !== 'stage') || window.location.pathname !== '/express/templates/default') {
    window.location.replace('/404');
  }
}
