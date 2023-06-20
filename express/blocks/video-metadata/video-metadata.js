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
  createTag,
} from '../../scripts/scripts.js';

const LINES2ARRAY_SPLIT_RE = /\s*?\r?\n\s*/;
const BROADCAST_EVENT_RE = /broadcast-event-(\d+)-([\w-]+)/;
const CLIP_RE = /clip-(\d+)-([\w-]+)/;
const SEEK_TO_ACTION_RE = /seek-to-action-([\w-]+)/;

function camelize(str) {
  return str.replace(/-./, (match) => match[1].toUpperCase());
}

function addBroadcastEventField(videoObj, blockKey, blockValue) {
  const [, num, key] = blockKey.match(BROADCAST_EVENT_RE);
  const i = num - 1;
  if (!videoObj.publication) videoObj.publication = [];
  if (!videoObj.publication[i]) videoObj.publication[i] = { '@type': 'BroadcastEvent' };
  switch (key) {
    case 'is-live':
    case 'is-live-broadcast':
      videoObj.publication[i].isLiveBroadcast = ['yes', 'true'].includes(blockValue.toLowerCase());
      break;
    case 'start-date':
    case 'end-date':
      videoObj.publication[i][camelize(key)] = blockValue;
      break;
    default:
      // eslint-disable-next-line no-console
      console.log(`VideoMetadata -- Unknown BroadcastEvent property: ${blockKey}`);
      break;
  }
}

function addClipField(videoObj, blockKey, blockValue) {
  const [, num, key] = blockKey.match(CLIP_RE);
  const i = num - 1;
  if (!videoObj.hasPart) videoObj.hasPart = [];
  if (!videoObj.hasPart[i]) videoObj.hasPart[i] = { '@type': 'Clip' };
  switch (key) {
    case 'start-offset':
    case 'end-offset':
      videoObj.hasPart[i][camelize(key)] = parseInt(blockValue, 10);
      break;
    case 'name':
    case 'url':
      videoObj.hasPart[i][camelize(key)] = blockValue;
      break;
    default:
      // eslint-disable-next-line no-console
      console.log(`VideoMetadata -- Unhandled Clip property: ${blockKey}`);
      break;
  }
}

function addSeekToActionField(videoObj, blockKey, blockValue) {
  const [, key] = blockKey.match(SEEK_TO_ACTION_RE);
  if (!videoObj.potentialAction) videoObj.potentialAction = { '@type': 'SeekToAction' };
  switch (key) {
    case 'target':
      videoObj.potentialAction.target = blockValue;
      break;
    case 'start-offset-input':
      videoObj.potentialAction['startOffset-input'] = blockValue;
      break;
    default:
      // eslint-disable-next-line no-console
      console.log(`VideoMetadata -- Unhandled SeekToAction property: ${blockKey}`);
      break;
  }
}

export function createVideoObject(blockMap) {
  const video = {};
  Object.entries(blockMap).forEach(([key, val]) => {
    const blockVal = val.content && val.content.textContent.trim();
    if (!blockVal && key !== 'regions allowed') return;
    const blockKey = key && key.replaceAll(' ', '-');
    switch (true) {
      case blockKey === 'content-url':
      case blockKey === 'description':
      case blockKey === 'duration':
      case blockKey === 'embed-url':
      case blockKey === 'expires':
      case blockKey === 'name':
      case blockKey === 'regions-allowed':
      case blockKey === 'upload-date':
        video[camelize(blockKey)] = blockVal;
        break;
      case blockKey === 'thumbnail-url':
        video.thumbnailUrl = blockVal.split(LINES2ARRAY_SPLIT_RE);
        if (video.thumbnailUrl.length < 2) video.thumbnailUrl = blockVal;
        break;
      case BROADCAST_EVENT_RE.test(blockKey):
        addBroadcastEventField(video, blockKey, blockVal);
        break;
      case CLIP_RE.test(blockKey):
        addClipField(video, blockKey, blockVal);
        break;
      case SEEK_TO_ACTION_RE.test(blockKey):
        addSeekToActionField(video, blockKey, blockVal);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(`VideoMetadata -- Unhandled VideoObject property: ${blockKey}`);
        break;
    }
  });
  if (Object.keys(video).length) {
    return Object.assign(video, {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
    });
  }
  return null;
}

const getMetadata = (el) => [...el.childNodes].reduce((rdx, row) => {
  if (row.children) {
    const key = row.children[0].textContent.trim().toLowerCase();
    const content = row.children[1];
    const text = content.textContent.trim().toLowerCase();
    if (key && content) rdx[key] = { content, text };
  }
  return rdx;
}, {});

export default function init(el) {
  const metadata = getMetadata(el);
  el.remove();
  const obj = createVideoObject(metadata);
  if (!obj) return;
  const script = createTag('script', { type: 'application/ld+json' });
  script.textContent = JSON.stringify(obj);
  document.head.append(script);
}
