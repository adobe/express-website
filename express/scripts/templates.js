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
  // eslint-disable-next-line import/no-unresolved
} from './scripts.js';

async function fetchPageContent(path) {
  if (!(window.templates && window.templates.data)) {
    window.templates = {};
    const resp = await fetch('/express/templates/content.json?sheet=seo-templates&limit=10000');
    window.templates.data = resp.ok ? (await resp.json()).data : [];
  }

  const page = window.templates.data.find((p) => p.path === path);
  const env = getHelixEnv();

  if (env && env.name === 'stage') {
    return page || null;
  }

  return page && page.live !== 'N' ? page : null;
}

async function fetchLinkList() {
  if (!(window.linkLists && window.linkLists.data)) {
    window.linkLists = {};
    const resp = await fetch('/express/templates/top-priority-categories.json');
    window.linkLists.data = resp.ok ? (await resp.json()).data : [];
  }
}

function updateLinkList(container, template, list) {
  const templatePages = window.templates.data ?? [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const templatePageData = templatePages.find((p) => p.shortTitle === d && p.live === 'Y');

      if (templatePageData) {
        const clone = template.cloneNode(true);
        clone.innerHTML = clone.innerHTML.replace('/express/templates/default', templatePageData.path);
        clone.innerHTML = clone.innerHTML.replace('Default', templatePageData.shortTitle);
        container.append(clone);
      }
    });
  }
}

function updateBlocks(data) {
  const heroAnimation = document.querySelector('.hero-animation--wide-');
  const linkList = document.querySelector('.link-list--fullwidth-');
  const templateList = document.querySelector('.template-list--fullwidth--apipowered-');
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
        if (row.parent === data.shortTitle) {
          linkListData.push(row['child-siblings']);
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
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-create-link-text', data.createText || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', data.createLink || '/');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-format', data.placeholderFormat || '');
  }

  if (seoNav) {
    const topTemplatesContainer = seoNav.querySelector('p').parentElement;

    if (window.templates.data && data.topTemplates) {
      const topTemplatesTemplate = seoNav.querySelector('p').cloneNode(true);
      const topTemplatesData = data.topTemplates.split(', ');

      updateLinkList(topTemplatesContainer, topTemplatesTemplate, topTemplatesData);
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
await fetchLinkList();

if (page) {
  updateBlocks(page);
} else {
  window.location.replace('/404');
}
