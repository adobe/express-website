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

class CrossBlockMediator {
  #stores; // { [name]: { callbacks: [cb], value: any } }

  constructor() {
    this.#stores = {};
  }

  #initStore(name) {
    this.#stores[name] = { callbacks: [], value: undefined };
  }

  /**
   * @param {string} name
   * @returns {boolean} true if store exists
   */
  hasStore(name) {
    return name in this.#stores;
  }

  /**
   * @returns {string[]} list of store names
   */
  listStores() {
    return Object.keys(this.#stores);
  }

  /**
   * @param {string} name
   * @returns {any} value. undefined if store does not exist
   */
  get(name) {
    return this.#stores[name]?.value;
  }

  /**
   * Update value and then call all callbacks asynchronously passing { oldValue, newValue }
   * You can await this method to check if all callbacks succeeded.
   *
   * @param {string} name
   * @param {any} value
   * @returns {Promise<{ succeed: boolean, errors: Error[] }>}
   * @example
   * const { success, errors } = await mediator.set('storeName', 'newValue');
   * if (!success) {
   *  console.error('some callbacks failed', errors);
   * }
   */
  set(name, value) {
    if (!this.hasStore(name)) {
      this.#initStore(name);
    }
    const oldValue = this.get(name);
    this.#stores[name].value = value;

    return Promise.resolve().then(() => {
      let success = true;
      const errors = [];
      for (const cb of this.#stores[name].callbacks) {
        try {
          cb({ oldValue, newValue: value });
        } catch (e) {
          success = false;
          errors.push(e);
        }
      }
      return { success, errors };
    });
  }

  /**
   * Subscribe to store changes. Callback will be called asynchronously with { oldValue, newValue }
   *
   * @param {string} name
   * @param {function({ oldValue: any, newValue: any }): void} cb
   * @returns {function(): void} unsubscribe function
   * @example
   * const unsubscribe = mediator.subscribe('storeName', ({ oldValue, newValue }) => {
   *  console.log(`storeName changed from ${oldValue} to ${newValue}`);
   * });
   * // later
   * unsubscribe(); // only needed if you are subscribing more than once
   * @note oldValue and newValue can be the same. Handle the duplicate event on you own
   * @note When oldValue is undefined, it means the store was created
   * @note You can subscribe more than once, but you need to unsubscribe to avoid memory leaks
   * @note You can subscribe to a store that does not exist yet, and get notified when it is created
   * @note Callbacks should be simple and should not call set() or subscribe() to avoid loops
   * @note Wrap your callback in a try/catch to handle errors. Otherwise setter will catch them
   */
  subscribe(name, cb) {
    if (!this.hasStore(name)) {
      this.#initStore(name);
    }
    const store = this.#stores[name];
    if (store.callbacks.includes(cb)) return () => {};
    store.callbacks.push(cb);
    const unsubscribe = () => {
      store.callbacks = store.callbacks.filter((f) => f !== cb);
    };
    return unsubscribe;
  }
}

export default new CrossBlockMediator();
