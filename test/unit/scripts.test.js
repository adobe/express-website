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
import {
  createTag,
  normalizeHeadings,
  decorateButtons,
} from '../../express/scripts/scripts.js';

describe('scripts#normalizeHeadings', () => {
  const runTest = (blockContent, allowedHeadings, expected) => {
    const block = createTag('div');
    block.innerHTML = blockContent;

    normalizeHeadings(block, allowedHeadings);
    expect(block.innerHTML).to.equal(expected);
  };

  it('normalizeHeadings - no change', () => {
    const content = '<p>Simple div with only text content</p>';
    runTest(
      content,
      ['h2', 'h3'],
      content,
    );
  });

  it('normalizeHeadings - h1 becomes h2', () => {
    runTest(
      '<h1>Heading 1</h1>',
      ['h2', 'h3'],
      '<h2>Heading 1</h2>',
    );
  });

  it('normalizeHeadings - h1 becomes h2, h4 becomes h3', () => {
    runTest(
      '<h1>Heading 1</h1><h2>Heading 2</h2><p>Some text</p><h3>Heading 3</h3><p>Some more text</p><h4>Heading 4</h4><p>Some text again</p>',
      ['h2', 'h3'],
      '<h2>Heading 1</h2><h2>Heading 2</h2><p>Some text</p><h3>Heading 3</h3><p>Some more text</p><h3>Heading 4</h3><p>Some text again</p>',
    );
  });

  it('normalizeHeadings - h2 becomes h1, h4 becomes h3', () => {
    runTest(
      '<h1>Heading 1</h1><h2>Heading 2</h2><p>Some text</p><h3>Heading 3</h3><p>Some more text</p><h4>Heading 4</h4><p>Some text again</p>',
      ['h1', 'h3'],
      '<h1>Heading 1</h1><h1>Heading 2</h1><p>Some text</p><h3>Heading 3</h3><p>Some more text</p><h3>Heading 4</h3><p>Some text again</p>',
    );
  });

  it('normalizeHeadings - all headings become h6', () => {
    runTest(
      '<h1>Heading 1</h1><h2>Heading 2</h2><p>Some text</p><h3>Heading 3</h3><p>Some more text</p><h4>Heading 4</h4><p>Some text again</p>',
      ['h6'],
      '<h6>Heading 1</h6><h6>Heading 2</h6><p>Some text</p><h6>Heading 3</h6><p>Some more text</p><h6>Heading 4</h6><p>Some text again</p>',
    );
  });
});

describe('scripts#decorateButtons', () => {
  const runTest = (blockContent, expected) => {
    const block = createTag('div');
    block.innerHTML = blockContent;
    decorateButtons(block);
    expect(block.innerHTML).to.equal(expected);
  };

  it('decorateButtons - default button (CTA)', () => {
    runTest(
      '<p><a href="https://www.adobe.com/">A button</a></p>',
      '<p class="button-container"><a href="https://www.adobe.com/" title="A button" class="button accent">A button</a></p>',
    );
  });

  it('decorateButtons - alternative button', () => {
    runTest(
      '<p><em><a href="https://www.adobe.com/">A button</a></em></p>',
      '<p class="button-container"><em><a href="https://www.adobe.com/" title="A button" class="button accent light">A button</a></em></p>',
    );
  });

  it('decorateButtons - no button if href and link text match', () => {
    runTest(
      '<p><a href="https://www.adobe.com/">https://www.adobe.com/</a></p>',
      '<p><a href="https://www.adobe.com/" title="https://www.adobe.com/">https://www.adobe.com/</a></p>',
    );
  });

  it('decorateButtons - no button if link text ends with >', () => {
    runTest(
      '<p><a href="https://www.adobe.com/">Check this out &gt;</a></p>',
      '<p><a href="https://www.adobe.com/" title="Check this out >">Check this out &gt;</a></p>',
    );
  });
});
