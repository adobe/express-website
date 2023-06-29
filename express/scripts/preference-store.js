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

export const preferenceNames = {
  reduceMotion: {
    name: 'reduceMotion',
    mediaQueryString: '(prefers-reduced-motion: reduce)',
  },
};

const [ON, OFF] = ['on', 'off'];

const get = (name) => localStorage.getItem(name) === ON;

class PreferenceStore {
  constructor() {
    this.subscribers = {}; // { [name]: [HTMLElement]
  }

  dispatch(name) {
    const value = get(name);
    (this.subscribers[name] || []).forEach((sub) => {
      sub.dispatchEvent(new CustomEvent(name, { detail: { value } }));
    });
  }

  /**
   * Sample usage: preferenceStore.init(preferenceNames.reduceMotion.name);
   */
  init(name) {
    const mediaQuery = window.matchMedia(preferenceNames[name].mediaQueryString);
    if (mediaQuery.matches) {
      localStorage.setItem(name, ON);
    }
    this.dispatch(name);

    mediaQuery.addEventListener('change', (e) => {
      if (get(name) === e.matches) return;
      localStorage.setItem(name, e.matches ? ON : OFF);
      this.dispatch(name);
    });
    return get(name);
  }

  toggle(name) {
    localStorage.setItem(name, get(name) ? OFF : ON);
    this.dispatch(name);
  }

  /**
   * Sample usage: preferenceStore.subscribe(preferenceNames.reduceMotion.name, node, cb);
   * */
  subscribe(name, block, callback) {
    if (!this.subscribers[name]) this.subscribers[name] = [];
    const blocks = this.subscribers[name];
    if (blocks.includes(block)) return;

    blocks.push(block);
    block.addEventListener(name, (e) => {
      callback(e.detail);
    });
  }

  /**
   * Sample usage: preferenceStore.unsubscribe(preferenceNames.reduceMotion.name, node, cb);
   */
  unsubscribe(name, block, callback) {
    const { subscribers } = this.stores[name] || {};
    if (!this.subscribers.includes(block)) return;

    subscribers.splice(subscribers.indexOf(block), 1);
    block.removeEventListener(name, callback);
  }
}

const preferenceStore = new PreferenceStore();
preferenceStore.get = get;

export default preferenceStore;
