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

// provides access to every block for accessibility/ux-related preferences like:
// themes, prefers-reduced-motion, prefers-color-scheme, prefers-contrast, etc.
class PreferenceStore {
  constructor() {
    this.stores = {}; // { [name]: { value, subscribers: [HTMLElement] } }
  }

  /**
   * Sample usage:
   * import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
   * preferenceStore.set(eventNames.reduceMotion, sessionStorage.getItem('reduceMotion'));
   */
  set(name, value) {
    if (!this.stores[name]) this.stores[name] = { subscribers: [] };
    const store = this.stores[name];

    if (value === this.get(name)) return;

    store.value = value;
    store.subscribers.forEach((sub) => {
      sub.dispatchEvent(new CustomEvent(name, { detail: value }));
    });
  }

  /**
   * Sample usage:
   * import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
   * preferenceStore.subscribe(eventNames.reduceMotion, node, (value) => {
   * node.append(`${value}`);
   * });
   *
   * */
  subscribe(name, block, callback) {
    if (!this.stores[name]) this.stores[name] = { subscribers: [] };
    const store = this.stores[name];
    if (store.subscribers.includes(block)) return;

    store.subscribers.push(block);
    block.addEventListener(name, (e) => {
      callback(e.detail);
    });
  }

  /**
   * Sample usage:
   * import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
   * preferenceStore.unsubscribe(eventNames.reduceMotion, node, (value) => {
   *  node.append(`${value}`);
   * });
   *
   * Note that the callback should be the same one as when you subscribe
   */
  unsubscribe(name, block, callback) {
    const { subscribers } = this.stores[name] || {};
    if (!subscribers || !subscribers.includes(block)) return;

    subscribers.splice(subscribers.indexOf(block), 1);
    block.removeEventListener(name, callback);
  }

  /**
   * Sample usage:
   * import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
   * preferenceStore.get(eventNames.reduceMotion);
   */
  get(name) {
    return this.stores[name].value;
  }
}

export default new PreferenceStore();

export const eventNames = {
  reduceMotion: 'reduceMotion',
};
