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
} from './scripts.js';

import {
  fetchLInkListFromCKGApi,
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

function formatSearchQuery(data) {
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
    dataArray.forEach((col) => {
      col[1] = col[1].replace('{{queryTasks}}', params.tasks);
    });

    dataArray.forEach((col) => {
      col[1] = col[1].replace('{{QueryTasks}}', titleCase(params.tasks));
    });

    dataArray.forEach((col) => {
      col[1] = col[1].replace('{{placeholderRatio}}', params.phformat);
    });

    dataArray.forEach((col) => {
      col[1] = col[1].replace('{{QueryTopics}}', titleCase(params.topics ?? ''));
    });
  } else {
    return false;
  }

  return arrayToObject(dataArray);
}

async function fetchLinkList(data) {
  if (!(window.linkLists && window.linkLists.data)) {
    window.linkLists = {};
    const response = await fetchLInkListFromCKGApi(data);
    // catch data from CKG API, if empty, use top priority categories sheet
    if (response && response.queryResults[0].facets) {
      window.linkLists.data = response.queryResults[0].facets[0].buckets.map((ckgItem) => ({
        parent: titleCase(data.templateTasks),
        'child-siblings': `${titleCase(ckgItem.displayValue)} ${titleCase(data.templateTasks)}`,
        ckgID: ckgItem.canonicalName,
      }));
      window.linkLists.source = 'ckg-api';
    } else {
      const resp = await fetch('/express/templates/top-priority-categories.json');
      window.linkLists.data = resp.ok ? (await resp.json()).data : [];
      window.linkLists.source = 'top-priority-sheet';
    }
  }
}

function matchCKGResultOrSheetResult(ckgData, pageData) {
  const ckgMatch = pageData.ckgID === ckgData.ckgID;
  const shortTitleMatch = pageData.shortTitle.toLowerCase() === ckgData.childSibling.toLowerCase();
  const taskMatch = ckgData.tasks === pageData.templateTasks;
  const currentLocale = getLocale(window.location);
  const pageLocale = pageData.path.split('/')[1] === 'express' ? 'us' : pageData.path.split('/')[1];
  const sameLocale = currentLocale === pageLocale;

  if (window.linkLists.source === 'ckg-api') {
    return sameLocale && ckgMatch && taskMatch;
  } else {
    return sameLocale && shortTitleMatch;
  }
}

function updateLinkList(container, linkPill, list) {
  const templatePages = window.templates.data ?? [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const templatePageData = templatePages.find((p) => p.live === 'Y' && matchCKGResultOrSheetResult(d, p));

      const clone = linkPill.cloneNode(true);
      if (templatePageData) {
        clone.innerHTML = clone.innerHTML.replace('/express/templates/default', templatePageData.path);
        clone.innerHTML = clone.innerHTML.replaceAll('Default', templatePageData.shortTitle);
        container.append(clone);
      }
    });
  }
}

function updateSEOLinkList(container, linkPill, list) {
  const templatePages = window.templates.data ?? [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const templatePageData = templatePages.find((p) => p.live === 'Y'
        && p.shortTitle.toLowerCase() === d.childSibling.toLowerCase());

      const clone = linkPill.cloneNode(true);
      if (templatePageData) {
        clone.innerHTML = clone.innerHTML.replace('/express/templates/default', templatePageData.path);
        clone.innerHTML = clone.innerHTML.replaceAll('Default', templatePageData.shortTitle);
        container.append(clone);
      }
    });
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

function purgeAllTaskText(data) {
  const purgedData = data;

  if (purgedData.templateTasks === "''") {
    Object.entries(purgedData).forEach((entry) => {
      purgedData[entry[0]] = entry[1].replace("''", '');
    });
  }

  return purgedData;
}

async function updateBlocks(data) {
  const heroAnimation = document.querySelector('.hero-animation.wide');
  const linkList = document.querySelector('.link-list.fullwidth');
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');
  const seoNav = document.querySelector('.seo-nav');

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

    if (window.linkLists && window.linkLists.data && data.shortTitle) {
      window.linkLists.data.forEach((row) => {
        if (window.linkLists.source === 'ckg-api'
          || (window.linkLists.source === 'top-priority-sheet' && row.parent === data.shortTitle)) {
          linkListData.push({
            childSibling: row['child-siblings'],
            ckgID: row.ckgID,
            shortTitle: data.shortTitle,
            tasks: data.templateTasks,
          });
        }
      });
    }

    updateLinkList(linkListContainer, linkListTemplate, linkListData);
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

const page = await fetchPageContent(window.location.pathname);

if (page) {
  await fetchLinkList(page);
  if (window.location.pathname === '/express/templates/search') {
    const data = formatSearchQuery(page);
    if (!data) {
      window.location.replace('/express/templates/');
    } else {
      const purgedData = purgeAllTaskText(data);
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
