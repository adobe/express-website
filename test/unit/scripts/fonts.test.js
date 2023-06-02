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
import { loadCSS } from '../../../express/scripts/scripts.js';

describe('Fonts', () => {
  it('Loads CSS fonts', async () => {
    const { default: loadFonts } = await import('../../../express/scripts/fonts.js');
    const fontResp = await loadFonts('hah7vzn.css', loadCSS);
    expect(fontResp).to.exist;
  });

  it('Loads JS fonts', async () => {
    const { default: loadFonts } = await import('../../../express/scripts/fonts.js');
    const fontResp = await loadFonts('hah7vzn', loadCSS);
    expect(fontResp.classList.contains('wf-loading')).to.be.true;
  });
});
