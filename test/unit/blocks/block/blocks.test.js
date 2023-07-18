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
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { stub } from 'sinon';
import TESTS from './blocks-test-list.js';

const ROOT_PATH = '/test/unit/blocks/block';

const getFragment = (html) => {
  document.body.innerHTML = html;
  return document;
};

const trim = (html) => html
  .replace(/\s\s+/gm, ' ')
  .replace(/^\s*/gm, '')
  .replace(/\s*$/gm, '')
  .replace(/\n/gm, '')
  .replace(/>\s*</gm, '><');

const fragmentToString = (fragment) => {
  if (fragment.outerHTML) {
    return trim(fragment.outerHTML);
  }

  let html = '';
  [...fragment.children].forEach((c) => {
    html += c.outerHTML;
  });
  return trim(html);
};
window.placeholders = {};
const offers = {
  total: 1,
  offset: 0,
  limit: 1,
  data: [
    {
      c: 'US',
      p: 9.99,
      o: '0EDBD95A29C6EE10FB2B323A041E3AEF',
    },
  ],
};

const ogFetch = window.fetch;
window.fetch = stub();
const stubFetch = () => {
  window.fetch.withArgs('/express/system/offers-new.json').returns(
    new Promise((resolve) => {
      resolve({
        ok: true,
        json: () => offers,
      });
    }),
  );
};
const restoreFetch = () => {
  window.fetch = ogFetch;
};

describe('Block tests', () => {
  before(() => {
    stubFetch();
  });
  after(() => {
    restoreFetch();
  });
  window.isTestEnv = true;
  // check if there are tests with only: true
  let tests = TESTS.filter((t) => t.only);
  // if not, run all
  if (tests.length === 0) tests = TESTS;
  tests.forEach((test) => {
    it(test.name, async () => {
      expect(test.input, 'Missing test "input" definition').to.exist;
      expect(test.expected, 'Missing test "expected" definition').to.exist;

      let res = await ogFetch(`${ROOT_PATH}/${test.input}`);
      expect(res.ok, `Missing test "input" file: ${test.input}`).to.be.true;

      const htmlInput = await res.text();
      const doc = getFragment(htmlInput);

      res = await ogFetch(`${ROOT_PATH}/${test.expected}`);
      expect(res.ok, `Missing test "expected" file: ${test.expected}`).to.be.true;

      const htmlExpected = await res.text();

      let block = doc.querySelector('main > div');
      let sectionMode = false;
      if (block.classList.contains('section')) {
        // input file contains section, look for block inside it
        block = block.querySelector(':scope > div > div');
        sectionMode = true;
      }

      const classes = Array.from(block.classList.values());
      const blockName = classes[0];
      if (blockName) {
        const mod = await import(`/express/blocks/${blockName}/${blockName}.js`);
        await mod.default(block, blockName, doc);
      }

      let current = block;
      if (sectionMode) {
        current = block.parentElement.parentElement;
      }

      const finalise = () => {
        const expected = getFragment(htmlExpected);
        expect(fragmentToString(current)).to.be.equal(trim(expected.body.innerHTML));
      };

      if (test.timeout) {
        // some blocks might use setTimeout for which we need to wait
        return new Promise((resolve) => {
          setTimeout(() => {
            finalise();
            resolve();
          }, test.timeout);
        });
      } else {
        finalise();
        return true;
      }
    }).timeout(10000);
  });
});
