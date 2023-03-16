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
import { createTag } from '../../scripts/scripts.js';
import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
import preferenceStore2 from '../../scripts/preference-store-2.js';
import preferenceStore3 from '../../scripts/preference-store-3.js';
import preferenceStore4 from '../../scripts/preference-store-4.js';

export default function decorate(block) {
  const content = createTag('div');
  block.innerHTML = '';
  const node1 = createTag('div');
  const node2 = createTag('div');
  const node3 = createTag('div');
  const node4 = createTag('div');
  preferenceStore.subscribe(eventNames.reduceMotion, (value) => {
    node1.append(`1: ${value}`);
    node1.append(createTag('br'));
  });
  preferenceStore2.subscribe(eventNames.reduceMotion, node2, (value) => {
    node2.append(`2: ${value}`);
    node2.append(createTag('br'));
  });
  preferenceStore3.subscribe(eventNames.reduceMotion, node3, (value) => {
    node3.append(`3: ${value}`);
    node3.append(createTag('br'));
  });
  preferenceStore4.subscribe(eventNames.reduceMotion, node4, (newValue, oldValue) => {
    node4.append(`4 new ${newValue} old ${oldValue}`);
    node4.append(createTag('br'));
  });
  const flex = createTag('div', { style: 'display: flex; align-items: center; justify-content: center; flex-flow: row wrap; text-align: center; gap: 10px;' });
  flex.append(node1, node2, node3, node4);
  content.append(flex);
  block.append(content);
}
