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

// TODO: don't create loops
// TODO: LISTENERs should handle same value updates
// TODO: detect if it's created, deleted, or updated, using oldValue and newValue
// TODO: should not subscribe more than once
// TODO: talk about error handling for subscribed callbacks

// methods are intentionally overloaded to reduce number of methods
class CrossBlockMediator {
  #stores;

  constructor() {
    this.#stores = {};
  }

  #initStore(name) {
    this.#stores[name] = { callbacks: [], value: undefined };
  }

  hasStore(name) {
    return name in this.#stores;
  }

  get(name) {
    return this.#stores[name]?.value;
  }

  set(name, value) {
    if (value === undefined) throw new Error('value cannot be undefined');
    if (!this.hasStore(name)) {
      this.#initStore(name);
    }
    const oldValue = this.get(name);
    this.#stores[name].value = value;

    Promise.resolve().then(() => {
      this.#stores[name].callbacks.forEach((cb) => {
        try {
          cb(oldValue, value);
        } catch (e) {
          // something went wrong
        }
      });
    });

    return value;
  }

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
