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
import { getLanguage, createTag, fetchPlaceholders } from '../../scripts/scripts.js';

function formatFilterString(filters) {
  const {
    animated,
    locales,
    premium,
    tasks,
    topics,
  } = filters;
  let str = '';
  if (premium) {
    if (premium.toLowerCase() === 'false') {
      str += '&filters=licensingCategory==free';
    } else {
      str += '&filters=licensingCategory==premium';
    }
  }
  if (animated && animated !== '()') {
    str += `&filters=animated==${animated}`;
  }
  if (tasks && tasks !== '()') {
    str += `&filters=pages.task.name==${tasks}`;
  }
  if (topics && topics !== '()') {
    str += `&filters=topics==${topics}`;
  }
  if (locales && locales !== '()') {
    str += `&filters=language==${locales.split('OR').map((l) => getLanguage(l))}`;
  }

  return str;
}

const fetchSearchUrl = async ({
  limit, start, filters, sort,
}) => {
  const base = 'https://spark-search.adobe.io/v3/content';
  const collectionId = 'urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418';
  const collectionIdParam = `collectionId=${collectionId}`;
  const queryType = 'search';
  const queryParam = `&queryType=${queryType}`;
  const filterStr = formatFilterString(filters);
  const limitParam = limit ? `&limit=${limit}` : '';
  const startParam = start ? `&start=${start}` : '';
  // FIXME: finalize sorting options
  const sortParam = {
    'Most Viewed': '',
    'Rare & Original': '&orderBy=remixCount',
    'Newest to Oldest': '&orderBy=-createDate',
    'Oldest to Newest': '&orderBy=createDate',
  }[sort] || '';
  const url = encodeURI(
    `${base}?${collectionIdParam}${queryParam}${limitParam}${startParam}${sortParam}${filterStr}`,
  );

  return fetch(url, {
    headers: {
      'x-api-key': 'projectx_webapp',
    },
  }).then((response) => response.json());
};

async function fetchTemplates(props) {
  const result = await fetchSearchUrl(props);

  if (result?.metadata?.totalHits > 0) {
    return result;
  } else {
    // save fetch if search query returned 0 templates. "Bad result is better than no result"
    return fetchSearchUrl({ ...props, filters: {} });
  }
}

export default async function fetchAndRenderTemplates(props) {
  const [placeholders, response] = await Promise.all([fetchPlaceholders(), fetchTemplates(props)]);
  if (!response || !response.items || !Array.isArray(response.items)) {
    return null;
  }

  if ('_links' in response) {
    const nextQuery = response._links.next.href;
    const starts = new URLSearchParams(nextQuery).get('start').split(',');
    props.start = starts.join(',');
  } else {
    props.start = '';
  }

  props.total = response.metadata.totalHits;

  return response.items
    .filter(
      (item) => item.status === 'approved'
      && item.customLinks?.branchUrl
      && item.title?.['i-default']
      && item.pages?.[0]?.rendition?.image?.thumbnail?.componentId
      && item._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href?.replace,
    )
    .map((template) => {
      const renditionLinkHref = template._links['http://ns.adobe.com/adobecloud/rel/rendition'].href;
      const componentLinkHref = template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
      const templateTitle = template.title['i-default'];
      const tmpltEl = createTag('div');
      const btnElWrapper = createTag('div', { class: 'button-container' });
      const btnTitle = placeholders['edit-this-template'] ?? 'Edit this template';
      const btnEl = createTag('a', {
        href: template.customLinks.branchUrl,
        title: btnTitle,
        class: 'button accent',
      });
      const picElWrapper = createTag('div');
      const videoWrapper = createTag('div');

      const imageThumbnailId = template.pages[0].rendition.image?.thumbnail.componentId;
      const videoThumbnailId = template.pages[0].rendition?.video?.thumbnail?.componentId;
      const imageHref = renditionLinkHref.replace(
        '{&page,size,type,fragment}',
        `&size=${props.renditionParams.size}&type=image/jpg&fragment=id=${imageThumbnailId}`,
      );

      if (videoThumbnailId && componentLinkHref) {
        const videoHref = componentLinkHref?.replace(
          '{&revision,component_id}',
          `&revision=0&component_id=${videoThumbnailId}`,
        );
        const video = createTag('video', {
          loop: true,
          muted: true,
          playsinline: '',
          poster: imageHref,
          title: templateTitle,
          preload: 'metadata',
        });
        video.append(
          createTag('source', {
            src: videoHref,
            type: 'video/mp4',
          }),
        );
        // TODO: another approach: show an image, only insert the video node when hover
        btnElWrapper.addEventListener('mouseenter', () => {
          // video.src = videoHref;
          video.muted = true;
          video.play().catch((e) => {
            if (e instanceof DOMException && e.name === 'AbortError') {
              // ignore
            }
          });
        });
        btnElWrapper.addEventListener('mouseleave', () => {
          // console.log('reloading');
          // video.load();
          // console.log('removing src');
          // video.src = ''; // need to reset video.src=videoHref
          // console.log('pausing and set time=0');
          video.pause();
          video.currentTime = 0;
        });
        videoWrapper.insertAdjacentElement('beforeend', video);
        tmpltEl.insertAdjacentElement('beforeend', videoWrapper);
      } else {
        const picEl = createTag('img', {
          src: imageHref,
          alt: templateTitle,
        });
        picElWrapper.insertAdjacentElement('beforeend', picEl);
        tmpltEl.insertAdjacentElement('beforeend', picElWrapper);
      }

      btnEl.textContent = btnTitle;
      btnElWrapper.insertAdjacentElement('beforeend', btnEl);
      tmpltEl.insertAdjacentElement('beforeend', btnElWrapper);
      return tmpltEl;
    });
}
