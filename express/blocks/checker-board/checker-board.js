/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable import/named, import/extensions */

export default function decorateCheckerBoards($block) {
  const blobPrefix = 'https://hlx.blob.core.windows.net/external/';
  const $a = $block.querySelector(`a[href^="${blobPrefix}`);
  if ($a.href.endsWith('.mp4')) {
    const hostPrefix = window.location.hostname.includes('localhost') ? 'https://spark-website--adobe.hlx.live' : '';
    const $cell = $a.closest('div');
    const vid = $a.href.substring(blobPrefix.length).split('#')[0];
    $cell.innerHTML = `<video playsinline autoplay loop muted><source loading="lazy" src="${hostPrefix}/hlx_${vid}.mp4" type="video/mp4"></video>`;
  }
}
