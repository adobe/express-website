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
        sheet = '/templates-dev.json?sheet=seo-templates&limit=10000';
      } else {
        sheet = `${urlPrefix}/express/templates/default/metadata.json?limit=10000`;
      }

      const resp = await fetch(sheet);
      allTemplatesMetadata = resp.ok ? (await resp.json()).data : [];
    } catch (err) {
      allTemplatesMetadata = [];
    }
  }
  return allTemplatesMetadata;
}
