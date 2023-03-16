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
// themes, prefers-reduced-motion, prefers-color-scheme, prefers-contrast, etc
class PreferenceStore4 {
  constructor() {
    this.stores = {}; // { name: { subscribers: [], callbacks: [], value } }
  }

  set(name, value) {
    if (!this.stores[name]) this.stores[name] = { subscribers: [], callbacks: [] };
    const store = this.stores[name];
    if (value === this.get(name)) return;

    // non-blocking?
    store.subscribers.forEach((sub, i) => {
      store.callbacks[i](value, store.value, sub);
    });

    store.value = value;
  }

  // callback: (newValue, oldValue, block) => {}
  subscribe(name, block, callback) {
    if (!this.stores[name]) this.stores[name] = { subscribers: [], callbacks: [] };
    const store = this.stores[name];
    if (store.subscribers.includes(block)) return;

    store.subscribers.push(block);
    store.callbacks.push(callback);
  }

  unsubscribe(name, block) {
    const { subscribers, callbacks } = this.stores[name] || {};
    if (!subscribers || !subscribers.includes(block)) return;
    const i = subscribers.indexOf(block);
    subscribers.splice(i, 1);
    callbacks.splice(i, 1);
  }

  get(name) {
    return this.stores[name].value;
  }
}

export default new PreferenceStore4();

export const eventNames = {
  reduceMotion: 'reduceMotion',
};
