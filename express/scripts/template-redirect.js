/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { getHelixEnv, getLocale, getMetadata } from './scripts.js';

function validatePage() {
  const env = getHelixEnv();
  const title = document.querySelector('title');
  if ((env && env.name !== 'stage') && getMetadata('live') === 'N') {
    window.location.replace('/express/templates/');
  }

  if ((env && env.name !== 'stage') || (title && title.innerText.match(/{{(.*?)}}/))) {
    window.location.replace('/404');
  }
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
    // FIXME: stop using window obj to store data
    window.templates = {};
    const resp = await fetch(sheet);
    window.templates.data = resp.ok ? (await resp.json()).data : [];
  }
}

function findMatchExistingSEOPage(path) {
  const pathMatch = (e) => e.path === path;
  return (window.templates && window.templates.data.some(pathMatch));
}

export default async function redirectToExistingPage() {
  // FIXME: deprecate fetchSheetData
  await fetchSheetData();
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

validatePage();
await redirectToExistingPage();
