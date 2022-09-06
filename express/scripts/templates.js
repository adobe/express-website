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
async function fetchPageContent(path) {
  if (!(window.templates && window.templates.data)) {
    window.templates = {};
    const resp = await fetch('/express/templates/template-pages.json');
    window.templates.data = resp.ok ? (await resp.json()).data : [];
  }

  return window.templates.data.find((p) => p.path === path && p.live === 'Y');
}

function updateLinkList(container, template, list) {
  const templatePages = window.templates.data ?? [];
  container.innerHTML = '';

  if (list && templatePages) {
    list.forEach((d) => {
      const templatePageData = templatePages.find((p) => p.name === d && p.live === 'Y');

      if (templatePageData) {
        const clone = template.cloneNode(true);
        clone.innerHTML = clone.innerHTML.replace('/express/templates/default', templatePageData.path);
        clone.innerHTML = clone.innerHTML.replace('Default', templatePageData.name);
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
    if (data.title) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', data.title);
    }

    if (data.text) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template text', data.text);
    }
  }

  if (linkList && window.templates.data && data.related) {
    const linkListContainer = linkList.querySelector('p').parentElement;
    const linkListTemplate = linkList.querySelector('p').cloneNode(true);
    const linkListData = data.related.split(', ');
    
    updateLinkList(linkListContainer, linkListTemplate, linkListData);
  }

  if (templateList) {
    templateList.innerHTML = templateList.innerHTML.replace('default-locale', 'en');

    if (data.type) {
      templateList.innerHTML = templateList.innerHTML.replace('default-type', data.type);
    }

    if (data.premium) {
      templateList.innerHTML = templateList.innerHTML.replace('default-premium', data.premium);
    }

    if (data.createText) {
      templateList.innerHTML = templateList.innerHTML.replace('default-create-link-text', data.createText);
    }

    if (data.createLink) {
      templateList.innerHTML = templateList.innerHTML.replace('https://www.adobe.com/express/templates/default-create-link', data.createLink);
    }
  }

  if (seoNav) {
    if (window.templates.data && data.topTemplates) {
      const topTemplatesContainer = seoNav.querySelector('p').parentElement;
      const topTemplatesTemplate = seoNav.querySelector('p').cloneNode(true);
      const topTemplatesData = data.topTemplates.split(', ');

      updateLinkList(topTemplatesContainer, topTemplatesTemplate, topTemplatesData);
    }

    if (data.topTemplatesTitle) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates title', data.topTemplatesTitle);
    }

    if (data.topTemplatesText) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', data.topTemplatesText);
    }
  }
}

const page = await fetchPageContent(window.location.pathname);

if (page) {
  updateBlocks(page);
}
