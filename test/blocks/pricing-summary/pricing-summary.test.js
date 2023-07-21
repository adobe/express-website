/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../express/blocks/pricing-summary/pricing-summary.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Pricing Summary', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Pricing Summary exists', () => {
    const pricingSummary = document.body.querySelector('.pricing-summary');
    decorate(pricingSummary);
    expect(pricingSummary).to.exist;
  });

  it('Columns to be 2 or 3', () => {
   const columns = document.body.querySelectorAll('.pricing-column');
    expect(columns.length).to.be.oneOf([2, 3]);
  });

  it('Columns have correct elements', () => {
    expect(document.body.querySelector('.pricing-header')).to.exist;
  });
});
