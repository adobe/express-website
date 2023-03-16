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
class PreferenceStore2 {
  constructor() {
    this.stores = {};
    this.subscribers = {};
  }

  set(name, value) {
    if (this.stores[name] === value) return;
    this.stores[name] = value;
    if (!this.subscribers[name]) {
      this.subscribers[name] = [];
    }
    this.subscribers[name].forEach((sub) => {
      sub.dispatchEvent(new CustomEvent(name, { detail: value }));
    });
  }

  subscribe(name, block, callback) {
    if (!this.subscribers[name]) {
      this.subscribers[name] = [];
    }
    const subscribers = this.subscribers[name];
    if (subscribers.includes(block)) return;

    subscribers.push(block);
    block.addEventListener(name, (e) => {
      callback(e.detail);
    });
  }

  unsubscribe(name, block, callback) {
    const subscribers = this.subscribers[name];
    if (!subscribers || !subscribers.includes(block)) return;
    subscribers.splice(subscribers.indexOf(block), 1);
    block.removeEventListener(name, callback);
  }

  get(name) {
    return this.stores[name];
  }
}

export default new PreferenceStore2();

export const eventNames = {
  reduceMotion: 'reduceMotion',
};
