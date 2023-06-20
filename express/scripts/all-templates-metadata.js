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

import {
  arrayToObject,
  fetchPlaceholders,
  getHelixEnv,
  getLocale,
  getMetadata
} from './scripts.js';
import { memoize } from './utils.js';

const memoizedFetchUrl = memoize((url) => fetch(url).then((r) => (r.ok ? r.json() : null)), {
  key: (q) => q,
  ttl: 1000 * 60 * 60 * 24,
});

let allTemplatesMetadata;

async function updateBladesInMetadata(data) {
  if (!['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
    return data;
  }
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const dataArray = Object.entries(data);

  if (!params.tasks && !params.phformat) {
    return data;
  } else {
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
  }

  return arrayToObject(dataArray);
}

export default async function fetchAllTemplatesMetadata() {
  const locale = getLocale(window.location);
  const urlPrefix = locale === 'us' ? '' : `/${locale}`;

  if (!allTemplatesMetadata) {
    try {
      const env = getHelixEnv();
      const dev = new URLSearchParams(window.location.search).get('dev');
      let sheet;

      if (['yes', 'true', 'on'].includes(dev) && env?.name === 'stage') {
        sheet = '/templates-dev.json?sheet=seo-templates&limit=10000';
      } else {
        sheet = `${urlPrefix}/express/templates/default/metadata.json?limit=10000`;
      }

      let resp = await memoizedFetchUrl(sheet);
      allTemplatesMetadata = resp?.data;

      // TODO: remove the > 1 logic after publishing of the split metadata sheet
      if (!(allTemplatesMetadata && allTemplatesMetadata.length > 1)) {
        resp = await memoizedFetchUrl('/express/templates/content.json?sheet=seo-templates&limit=10000');
        allTemplatesMetadata = resp?.data?.map((p) => ({
          ...p,
          // TODO: backward compatibility. Remove when we move away from helix-seo-templates
          url: p.path,
          title: p.metadataTitle,
          description: p.metadataDescription,
          'short-title': p.shortTitle,
          ckgid: p.ckgID,
          'hero-title': p.heroAnimationTitle,
          'hero-text': p.heroAnimationText,
          locales: p.templateLocale,
          premium: p.templatePremium,
          animated: p.templateAnimated,
          tasks: p.templateTasks,
          topics: p.templateTopics,
          'placeholder-format': p.placeholderFormat,
          'create-link': p.createLink,
          'create-text': p.createText,
          'top-templates': p.topTemplates,
          'top-templates-text': p.topTemplatesText,
        })) || [];
      }
    } catch (err) {
      allTemplatesMetadata = [];
    }
  }

  return updateBladesInMetadata(allTemplatesMetadata);
}
