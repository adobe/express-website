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
  getIconElement,
  getMobileOperatingSystem,
} from '../../scripts/scripts.js';

// eslint-disable-next-line import/prefer-default-export
export function buildAppStoreBadge(href, attrs) {
  const appBadge = getMobileOperatingSystem() === 'iOS' ? getIconElement('apple-store') : getIconElement('google-store');
  const aTag = createTag('a', { href: 'app-store-aTag' });
  const wrapper = createTag('div', { class: 'app-store-wrapper' });

  aTag.href = href;
  wrapper.append(appBadge);
  aTag.append(wrapper);
  for (const [key, value] of Object.entries(attrs)) {
    appBadge.setAttribute(key, value);
  }
  appBadge.classList.add('app-store-badge');
  return aTag;
}
