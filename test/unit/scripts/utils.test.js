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
/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import { throttle, debounce, memoize } from '../../../express/scripts/utils.js';

describe('Throttle', () => {
  it('should throttle a function', () => {
    const arr = [];
    const fn = throttle(() => {
      arr.push(1);
    }, 100);
    fn();
    fn();
    fn();
    expect(arr.length).to.equal(0 + 1);
  });
  it('should throttle a function with trailing', async () => {
    const arr = [];
    const fn = throttle(
      () => {
        arr.push(1);
      },
      100,
      { trailing: true },
    );
    fn();
    fn();
    fn();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(arr.length).to.equal(0 + 1 + 1);
  });

  it('should invoke with the latest arg', async () => {
    const arr = [];
    const fn = throttle((a) => {
      arr.push(a);
    }, 100);
    fn(1);
    fn(2);
    fn(3);
    fn(4);
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(arr.length).to.equal(0 + 1);
    expect(arr[arr.length - 1]).to.equal(1);

    arr.splice(0, arr.length);
    const fnTrailing = throttle(
      (a) => {
        arr.push(a);
      },
      100,
      { trailing: true },
    );
    fnTrailing(1);
    fnTrailing(2);
    fnTrailing(3);
    fnTrailing(4);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(arr.length).to.equal(0 + 1 + 1);
    expect(arr[arr.length - 1]).to.equal(4);
  });

  it('should maintain binding of this', async () => {
    const obj = {
      arr: [],
      fn() {
        this.arr.push(1);
      },
      throttledInside: throttle(function f() {
        this.arr.push(1);
      }),
    };
    const fn = throttle(obj.fn, 100).bind(obj);
    fn();
    fn();
    fn();
    fn();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(obj.arr.length).to.equal(0 + 1);

    obj.arr.splice(0, obj.arr.length);
    obj.throttledInside();
    obj.throttledInside();
    obj.throttledInside();
    obj.throttledInside();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(obj.arr.length).to.equal(0 + 1);

    obj.arr.splice(0, obj.arr.length);
    const fnNoTrailing = throttle(obj.fn, 100, { trailing: true }).bind(obj);
    fnNoTrailing();
    fnNoTrailing();
    fnNoTrailing();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(obj.arr.length).to.equal(0 + 1 + 1);
  });
});

describe('Debounce', () => {
  it('should debounce a function', async () => {
    const arr = [];
    const fn = debounce(() => {
      arr.push(1);
    }, 100);
    fn();
    fn();
    fn();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(arr.length).to.equal(0 + 1);
  });

  it('should debounce but invoke immediately with leading', async () => {
    const arr = [];
    const fn = debounce(() => {
      arr.push(1);
    }, 100, { leading: true });
    fn();
    fn();
    fn();
    fn();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(arr.length).to.equal(0 + 1 + 1);
  });

  it('should invoke with latest args', async () => {
    const arr = [];
    const fn = debounce((a) => {
      arr.push(a);
    }, 100);
    fn(1);
    fn(2);
    fn(3);
    fn(4);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(arr.length).to.equal(0 + 1);
    expect(arr[arr.length - 1]).to.equal(4);

    arr.splice(0, arr.length);

    const fnLeading = debounce((a) => {
      arr.push(a);
    }, 100, { leading: true });
    fnLeading(10);
    fnLeading(2);
    fnLeading(3);
    fnLeading(4);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(arr.length).to.equal(0 + 1 + 1);
    expect(arr[0]).to.equal(10);
    expect(arr[arr.length - 1]).to.equal(4);
  });

  it('should maintain binding of this', async () => {
    const obj = {
      arr: [],
      fn() {
        this.arr.push(1);
      },
      debouncedInside: debounce(function f() {
        this.arr.push(1);
      }),
    };
    const fn = debounce(obj.fn, 100).bind(obj);
    fn();
    fn();
    fn();
    fn();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(obj.arr.length).to.equal(0 + 1);

    obj.arr.splice(0, obj.arr.length);
    obj.debouncedInside();
    obj.debouncedInside();
    obj.debouncedInside();
    obj.debouncedInside();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(obj.arr.length).to.equal(0 + 1);
  });
});

describe('Memoize', () => {
  let invoked = 0;
  beforeEach(() => {
    invoked = 0;
  });
  const fn = (a, b) => {
    invoked += 1;
    return a + b;
  };
  const fnAsync = async (a, b) => {
    invoked += 1;
    return a + b;
  };
  it('should throw with invalid cb', () => {
    expect(() => memoize(5)).to.throw();
  });
  it('should throw with invalid ttl', () => {
    expect(() => memoize(0)).to.throw();
    expect(() => memoize(-1)).to.throw();
    expect(() => memoize(NaN)).to.throw();
  });
  it('should memoize a function', () => {
    const memoized = memoize(fn, { ttl: 1000 });
    expect(typeof memoized).to.equal('function');
    expect(memoized(1, 2)).to.equal(3);
    expect(memoized(1, 2)).to.equal(3);
    expect(invoked).to.equal(1);
    expect(memoized(2, 2)).to.equal(4);
    expect(invoked).to.equal(2);
    expect(memoized(1, 2)).to.equal(3);
    expect(invoked).to.equal(2);
  });
  it('should memoize an async function', async () => {
    const memoized = memoize(fnAsync, { ttl: 1000 });
    expect(typeof memoized).to.equal('function');
    await memoized(1, 2).then((res) => {
      expect(res).to.equal(3);
    });
    await memoized(1, 2).then((res) => {
      expect(res).to.equal(3);
    });
    expect(invoked).to.equal(1);
    await memoized(2, 2).then((res) => {
      expect(res).to.equal(4);
    });
    expect(invoked).to.equal(2);
    await memoized(1, 2).then((res) => {
      expect(res).to.equal(3);
    });
    expect(invoked).to.equal(2);
  });
  it('should memoize a function with ttl', () => {
    const memoized = memoize(fn, { ttl: 500 });
    expect(typeof memoized).to.equal('function');
    expect(memoized(1, 2)).to.equal(3);
    expect(invoked).to.equal(1);
    setTimeout(() => {
      expect(memoized(1, 2)).to.equal(3);
      expect(invoked).to.equal(2);
    }, 700);
    setTimeout(() => {
      expect(memoized(1, 2)).to.equal(3);
      expect(invoked).to.equal(1);
    }, 100);
    expect(memoized(1, 2)).to.equal(3);
    expect(invoked).to.equal(1);
  });
  it('should memoize an async function with ttl', async () => {
    const memoized = memoize(fnAsync, { ttl: 500 });
    expect(typeof memoized).to.equal('function');
    await memoized(1, 2).then((res) => {
      expect(res).to.equal(3);
    });
    expect(invoked).to.equal(1);
    setTimeout(() => {
      memoized(1, 2).then((res) => {
        expect(res).to.equal(3);
        expect(invoked).to.equal(2);
      });
    }, 700);
    setTimeout(() => {
      memoized(1, 2).then(() => {
        expect(invoked).to.equal(1);
      });
    }, 100);
    await memoized(1, 2);
    expect(invoked).to.equal(1);
  });

  it('should throw on sync error', () => {
    const memoized = memoize(() => {
      invoked += 1;
      throw new Error('test');
    }, { ttl: 500 });
    expect(() => memoized()).to.throw();
    expect(invoked).to.equal(1);
    expect(() => memoized()).to.throw();
    expect(invoked).to.equal(2);
  });

  it('should invalidate cache on error async', async () => {
    const memoized = memoize(async () => {
      invoked += 1;
      throw new Error('test');
    }, { ttl: 500 });
    await memoized().catch(() => {});
    await memoized().catch(() => {});
    await memoized().catch(() => {});
    await memoized().catch(() => {});
    expect(invoked).to.equal(4);
  });
});
