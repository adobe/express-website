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

import { getLocale } from './scripts.js';
import fetchAllTemplatesMetadata from './all-templates-metadata.js';

async function existsTemplatePage(url) {
  const allTemplatesMetadata = await fetchAllTemplatesMetadata();
  return allTemplatesMetadata.some((e) => e.url === url);
}

(async function redirectToExistingPage() {
  // TODO: check if the search query points to an existing page. If so, redirect.
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  if (params.topics) {
    const targetPath = `/express/templates/${params.tasks}`.concat(params.topics ? `/${params.topics}` : '');
    const locale = getLocale(window.location);
    const pathToMatch = locale === 'us' ? targetPath : `/${locale}${targetPath}`;
    if (await existsTemplatePage(pathToMatch)) {
      window.location.replace(`${window.location.origin}${pathToMatch}`);
    }
  }
}());
