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
async function fetchPageContent(path) {
  if (!(window.templates && window.templates.data)) {
    window.templates = {};
    const resp = await fetch('/express/template-pages.json');
    window.templates.data = resp.ok ? (await resp.json()).data : [];
  }

  return window.templates.data.find((p) => p.path === path && p.live === 'Y');
}

function updateBlocks(data) {
  const heroAnimation = document.querySelector('.hero-animation--wide-');
  const linkList = document.querySelector('.link-list--fullwidth-');
  const templateList = document.querySelector('.template-list--fullwidth--apipowered-');

  if (heroAnimation) {
    if (data.title) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', data.title);
    }

    if (data.text) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template description', data.text);
    }
  }

  if (linkList && window.templates.data && data.related) {
    const linkListContainer = linkList.querySelector('p').parentElement;
    const linkListTemplate = linkList.querySelector('p').cloneNode(true);
    const linkListData = data.related.split(', ');

    linkListContainer.innerHTML = '';

    if (linkListData) {
      linkListData.forEach((d) => {
        const templatePageData = window.templates.data.find((p) => p.path.includes(d) && p.live === 'Y');

        if (templatePageData) {
          const linkListClone = linkListTemplate.cloneNode(true);
          linkListClone.innerHTML = linkListClone.innerHTML.replace('/express/templates/default', templatePageData.path);
          linkListClone.innerHTML = linkListClone.innerHTML.replace('Default', templatePageData.name);
          linkListContainer.append(linkListClone);
        }
      });
    }
  }

  if (templateList) {
    templateList.innerHTML = templateList.innerHTML.replace('default-locale', 'en');

    if (data.type) {
      templateList.innerHTML = templateList.innerHTML.replace('default-type', data.type);
    }

    if (data.premium) {
      templateList.innerHTML = templateList.innerHTML.replace('default-premium', data.premium);
    }
  }
}

const page = await fetchPageContent(window.location.pathname);

if (page) {
  updateBlocks(page);
}
