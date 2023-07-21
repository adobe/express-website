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

const url = 'https://adobesearch-atc.adobe.io/uss/v3/autocomplete';
const experienceId = 'default-templates-autocomplete-v1';
const scopeEntities = [
  'HzTemplate',
  // 'HzTextLockup', 'Icon', 'Photo', 'DesignAsset', 'Background'
];
const wlLocales = ['en-US', 'fr-FR', 'de-DE', 'ja-JP'];
const emptyRes = { queryResults: [{ items: [] }] };
export default async function fetchAPI({ limit = 5, textQuery, locale = 'en-US' }) {
  if (!textQuery || !wlLocales.includes(locale)) {
    return [];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': 'projectx_marketing_web',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      experienceId,
      textQuery,
      locale,
      queries: [
        {
          limit,
          id: experienceId,
          scope: {
            entities: scopeEntities,
          },
        },
      ],
    }),
  })
    .then((response) => response.json())
    .then((response) => (response.queryResults?.[0]?.items ? response : emptyRes))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Autocomplete API Error: ', err);
      return emptyRes;
    });
  return res.queryResults[0].items;
}
