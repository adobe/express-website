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

const endpoints = {
  dev: {
    cdn: 'https://uss-templates-dev.adobe.io/uss/v3/query',
    url: 'https://uss-templates-dev.adobe.io/uss/v3/query',
    token: 'cd1823ed-0104-492f-ba91-25f4195d5f6c',
  },
  stage: {
    cdn: 'https://www.stage.adobe.com/ax-uss-api/',
    url: 'https://uss-templates-stage.adobe.io/uss/v3/query',
    token: 'db7a3d14-5aaa-4a3d-99c3-52a0f0dbb459',
    key: 'express-ckg-stage',
  },
  prod: {
    cdn: 'https://www.adobe.com/ax-uss-api/',
    url: 'https://uss-templates.adobe.io/uss/v3/query',
    token: '2e0199f4-c4e2-4025-8229-df4ca5397605',
    key: 'template-list-linklist-facet',
  },
};

export async function getPillWordsMapping() {
  const locale = getLocale(window.location);
  const localeColumnString = locale === 'us' ? 'EN' : locale.toUpperCase();
  try {
    const resp = await fetch('/express/linklist-qa-mapping.json?limit=100000');
    const filteredArray = await resp.json();
    return filteredArray.data.filter((column) => column[`${localeColumnString}`] !== '');
  } catch {
    const resp = await fetch('/express/linklist-qa-mapping-old.json?limit=100000');
    if (resp.ok) {
      const filteredArray = await resp.json();
      return filteredArray.data.filter((column) => column[`${localeColumnString}`] !== '');
    } else {
      return false;
    }
  }
}

export default async function getData(env = '', data = {}) {
  const endpoint = endpoints[env];
  const response = await fetch(endpoint.cdn, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.adobe.search-request+json',
      'x-api-key': endpoint.key,
      'x-app-token': endpoint.token,
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return response.json();
  } else {
    return response;
  }
}

export async function fetchLinkListFromCKGApi() {
  if (getMetadata('ckgid')) {
    const dataRaw = {
      experienceId: 'templates-browse-v1',
      locale: 'en_US',
      queries: [
        {
          id: 'ccx-search-1',
          start: 0,
          limit: 40,
          scope: {
            entities: [
              'HzTemplate',
            ],
          },
          filters: [
            {
              categories: [
                getMetadata('ckgid'),
              ],
            },
          ],
          facets: [
            {
              facet: 'categories',
              limit: 10,
            },
          ],
        },
      ],
    };

    const env = getHelixEnv();
    const result = await getData(env.name, dataRaw);
    if (result.status.httpCode === 200) {
      return result;
    }
  }

  return false;
}
