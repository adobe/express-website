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
/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { stub } from 'sinon';

window.lana = { log: stub() };

const { default: decorate } = await import('../../../../express/blocks/schemas/schemas.js');

// npm run test:file test/blocks/schemas/schemas.test.js
describe('schemas', () => {
  const blockQuery = '.schemas';
  const jsonLdQuery = 'script[type="application/ld+json"]';

  const compareJSON = async (mockPath, expectedJSONPath) => {
    const expectedJSON = JSON.parse(await readFile({ path: expectedJSONPath }));
    document.body.innerHTML = await readFile({ path: mockPath });
    document.head.innerHTML = '';
    const blockEl = document.querySelector(blockQuery);
    decorate(blockEl);
    const scriptEl = document.querySelector(jsonLdQuery);
    const actualJSON = JSON.parse(scriptEl.innerHTML);
    expect(actualJSON).to.deep.equal(expectedJSON);
  };

  it('Generates webpage schema json with url from row', async () => {
    await compareJSON('./mocks/webpage-schemas-block-with-row.html', './expected/webpage-schema-input-row.json');
  });

  it('Generates webpage schema json with url from first primary CTA button', async () => {
    await compareJSON('./mocks/webpage-schemas-block-with-row-empty.html', './expected/webpage-schema.json');
  });
});
