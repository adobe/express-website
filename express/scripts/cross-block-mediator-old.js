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

// many individual stores that can be created and deleted

const storeStateTypes = {
  storeCreated: 'storeCreated',
  storeDeleted: 'storeDeleted',
  storeUpdated: 'storeUpdated',
};

// storeCreated, storeDeleted, storeUpdated
// hasStore, getStore
class CrossBlockMediator {
  constructor() {
    this.stores = {};
  }

  hasStore(name) {
    return name in this.stores;
  }

  getStore(name) {
    if (!this.hasStore(name)) {
      throw new Error(`store ${name} not found`);
    }
    return this.stores[name];
  }

  createStore(name, initialValue) {
    if (!this.hasStore(name)) {
      this.stores[name] = { callbacks: [], value: undefined };
    }
    const oldV = this.get(name);
    this.notify(storeStateTypes.storeCreated, name, undefined, initialValue);
  }

  deleteStore(name) {
    if (!this.hasStore(name)) {
      throw new Error(`store ${name} not found`);
    }
    if (name in this.stores) {
      delete this.stores[name];
    }
  }

  get(name) {
    if (!(name in this.stores)) {
      return 'store not found';
    }
    return this.stores[name].value;
  }

  set(name, value) {
    if (!(name in this.stores)) {
      return 'store not found';
    }
    if (!this.stores[name]) this.stores[name] = { subscribers: [] };
    const store = this.stores[name];

    store.value = value;
    return value;
  }

  notify(type, name, oldValue, newValue) {
    if (!(type in storeStateTypes)) {
      throw new Error(`Illegal type of notification: ${type}`);
    }
    this.getStore(name).callbacks.forEach((callback) => {
      callback(type, oldValue, newValue);
    });
  }

  subscribe(name, block, callback) {
    if (!this.stores[name]) this.stores[name] = { subscribers: [] };
    const store = this.stores[name];
    if (store.subscribers.includes(block)) return;

    store.subscribers.push(block);
    block.addEventListener(name, (e) => {
      callback(e.detail);
    });
  }

  unsubscribe(name, block, callback) {
    const { subscribers } = this.stores[name] || {};
    if (!subscribers || !subscribers.includes(block)) return;

    subscribers.splice(subscribers.indexOf(block), 1);
    block.removeEventListener(name, callback);
  }
}

export default new CrossBlockMediator();
