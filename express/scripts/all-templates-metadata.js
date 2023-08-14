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

import { getHelixEnv, getLocale } from './scripts.js';
import { memoize } from './utils.js';

const memoizedFetchUrl = memoize((url) => fetch(url).then((r) => (r.ok ? r.json() : null)), {
  key: (q) => q,
  ttl: 1000 * 60 * 60 * 24,
});

let allTemplatesMetadata;

export default async function fetchAllTemplatesMetadata() {
  const locale = getLocale(window.location);
  const urlPrefix = locale === 'us' ? '' : `/${locale}`;

  if (!allTemplatesMetadata) {
    try {
      const env = getHelixEnv();
      const dev = new URLSearchParams(window.location.search).get('dev');
      let sheet;

      if (['yes', 'true', 'on'].includes(dev) && env?.name === 'stage') {
        sheet = '/templates-dev.json?sheet=seo-templates&limit=100000';
      } else {
        sheet = `${urlPrefix}/express/templates/default/metadata.json?limit=100000`;
      }

      const resp = await memoizedFetchUrl(sheet);
      allTemplatesMetadata = resp?.data;
    } catch (err) {
      allTemplatesMetadata = [];
    }
  }
  return allTemplatesMetadata;
}
