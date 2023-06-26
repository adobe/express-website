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

export function debounce(cb, time, { leading = false } = {}) {
  let timer = null;
  return function debounced(...args) {
    let invoked = false;
    if (timer === null && leading) {
      cb.apply(this, args);
      invoked = true;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!invoked) {
        cb.apply(this, args);
      }
      timer = null;
    }, time);
  };
}

export function throttle(cb, delay, { trailing = false } = {}) {
  let timer = null;
  let lastArgs = null;
  function tryToEnd() {
    if (lastArgs && trailing) {
      cb.apply(this, lastArgs);
      lastArgs = null;
      timer = setTimeout(tryToEnd.bind(this), delay);
    } else {
      timer = null;
    }
  }
  return function throttled(...args) {
    if (timer) {
      lastArgs = args;
      return;
    }
    cb.apply(this, args);
    timer = setTimeout(tryToEnd.bind(this), delay);
  };
}

// returned memoized function is async/sync if input cb is async/sync respectively
export function memoize(cb, { key = (...args) => args.join(','), ttl } = {}) {
  if (cb && !(cb instanceof Function)) throw new Error('cb must be a function');
  if (!(ttl > 0 && Number.isInteger(ttl))) throw new Error('ttl must be greater than 0');
  const cache = new Map();
  const timers = new Map();
  function invalidate(k) {
    cache.delete(k);
    timers.delete(k);
  }
  return function memoized(...args) {
    const k = key(...args);
    if (cache.has(k)) {
      if (ttl) {
        clearTimeout(timers.get(k));
        timers.set(
          k,
          setTimeout(() => {
            invalidate(k);
          }, ttl),
        );
      }
      return cache.get(k);
    }
    try {
      const result = cb.apply(this, args);
      if (result && typeof result.then === 'function') {
        result.catch(() => {
          invalidate(k);
        });
      }
      cache.set(k, result);
      if (ttl) {
        timers.set(
          k,
          setTimeout(() => {
            invalidate(k);
          }, ttl),
        );
      }
      return result;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Memoized Callback Error: ', e);
      throw e;
    }
  };
}
