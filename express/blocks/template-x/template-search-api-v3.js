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
/* eslint-disable no-underscore-dangle */
import { getLanguage } from '../../scripts/scripts.js';

function formatFilterString(filters) {
  const {
    animated,
    locales,
    premium,
    tasks,
    topics,
  } = filters;
  let str = '';
  if (premium && animated !== 'all') {
    if (premium.toLowerCase() === 'false') {
      str += '&filters=licensingCategory==free';
    } else {
      str += '&filters=licensingCategory==premium';
    }
  }
  if (animated && animated !== 'all') {
    if (animated.toLowerCase() === 'false') {
      str += '&filters=behaviors==still';
    } else {
      str += '&filters=behaviors==animated';
    }
  }
  let cleanedTasks = tasks?.replace(' ', '')?.toLowerCase();
  if (cleanedTasks) {
    str += `&filters=pages.task.name==${cleanedTasks}`;
  }
  let cleanedTopics = topics?.replace(' ', '')?.toLowerCase();
  if (cleanedTopics) {
    str += `&filters=topics==${cleanedTopics}`;
  }
  if (locales) {
    str += `&filters=language==${locales.split('OR').map((l) => getLanguage(l))}`;
  }

  return str;
}

const fetchSearchUrl = async ({
  limit, start, filters, sort, q,
}) => {
  const base = 'https://spark-search.adobe.io/v3/content';
  const collectionId = 'urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418';
  const collectionIdParam = `collectionId=${collectionId}`;
  const queryType = 'search';
  const queryParam = `&queryType=${queryType}`;
  const filterStr = formatFilterString(filters);
  const limitParam = limit ? `&limit=${limit}` : '';
  const startParam = start ? `&start=${start}` : '';
  const sortParam = {
    'Most Viewed': '&orderBy=-remixCount',
    'Rare & Original': '&orderBy=remixCount',
    'Newest to Oldest': '&orderBy=-createDate',
    'Oldest to Newest': '&orderBy=createDate',
  }[sort] || sort || '';
  const qParam = q ? `&q=${q}` : '';
  const url = encodeURI(
    `${base}?${collectionIdParam}${queryParam}${qParam}${limitParam}${startParam}${sortParam}${filterStr}`,
  );

  return fetch(url, {
    headers: {
      'x-api-key': 'projectx_webapp',
    },
  }).then((response) => response.json());
};

export async function fetchTemplates(props, fallback = true) {
  const result = await fetchSearchUrl(props);

  if (result?.metadata?.totalHits > 0) {
    return result;
  } else if (fallback) {
    // save fetch if search query returned 0 templates. "Bad result is better than no result"
    return fetchSearchUrl({ ...props, filters: {} });
  } else {
    return null;
  }
}

function isValidBehaviors(behaviors) {
  const collectivelyExhausiveBehaviors = ['animated', 'video', 'still'];
  return behaviors.some((b) => collectivelyExhausiveBehaviors.includes(b))
    && (!behaviors.includes('still') || !(behaviors.includes('video') || behaviors.includes('animated')));
}

export function isValidTemplate(template) {
  return template.status === 'approved'
    && template.customLinks?.branchUrl
    && template.title?.['i-default']
    && template.pages?.[0]?.rendition?.image?.thumbnail?.componentId
    && template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href?.replace
    && template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href?.replace
    && isValidBehaviors(template.behaviors);
}
