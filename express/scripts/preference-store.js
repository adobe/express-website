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

/**
 * This is a store that provides access to every block for accessibility/ux-related preferences like
 * themes, prefers-reduced-motion, prefers-color-scheme, prefers-contrast, etc.
 * Example of dispatching:
 * /express/blocks/intent-toggle-desktop/intent-toggle-desktop.js#L80
 *
 * Example of subscribing:
 * /express/blocks/feature-grid-desktop/feature-grid-desktop.js#L149
 *
 * Example of getting current value:
 * /express/blocks/feature-grid-desktop/feature-grid-desktop.js#L147
 */

/** pre-defining all the accepted eventNames */
export const preferenceNames = {
  reduceMotion: {
    name: 'reduceMotion',
    mediaQueryString: '(prefers-reduced-motion: reduce)',
  },
};

class PreferenceStore {
  constructor() {
    this.stores = {}; // { [name]: { value, subscribers: [HTMLElement] } }
  }

  updateStore(name) {
    const value = localStorage.getItem(name) === 'on';

    if (!this.stores[name]) this.stores[name] = { subscribers: [] };
    const store = this.stores[name];

    store.value = value;
    store.subscribers.forEach((sub) => {
      sub.dispatchEvent(new CustomEvent(name, { detail: store }));
    });
    return store;
  }

  /**
   * Sample usage:
   * import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
   * preferenceStore.init('reduceMotion');
   */
  init(name) {
    const mediaQuery = window.matchMedia(preferenceNames[name].mediaQueryString);
    const syncBrowserSetting = () => {
      if (mediaQuery === true || mediaQuery.matches === true) {
        localStorage.setItem(name, 'on');
      } else {
        localStorage.setItem(name, 'off');
      }
    };

    if (mediaQuery === true || mediaQuery.matches === true) {
      syncBrowserSetting();
    }

    mediaQuery.addEventListener('change', () => {
      syncBrowserSetting();
      this.updateStore(name);
    });

    return this.updateStore(name);
  }

  /**
   * Sample usage:
   * import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
   * preferenceStore.set('reduceMotion');
   */
  set(name) {
    if (localStorage.getItem(name) === 'on') {
      localStorage.setItem(name, 'off');
    } else {
      localStorage.setItem(name, 'on');
    }

    this.updateStore(name);
  }

  /**
   * Sample usage:
   * import preferenceStore, { eventNames } from '../../scripts/preference-store.js';
   * preferenceStore.subscribe(eventNames.reduceMotion, node, (value) => {
   *   node.append(`${value}`);
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
   *   node.append(`${value}`);
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
    return this.stores[name]?.value;
  }
}

export default new PreferenceStore();
