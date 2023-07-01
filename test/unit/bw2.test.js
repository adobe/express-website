/*
 * Copyright 2022 Adobe. All rights reserved.
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

import { expect } from '@esm-bundle/chai';
import {
  createTag,
} from '../../express/scripts/scripts.js';
import BalancedWordWrapper from '../../express/scripts/bw2.js';

describe('Japanese balanced word wrap', () => {
  describe('BalancedWordWrapper', () => {
    const validate = (target = document.body, expects = []) => {
      const children = target.childNodes;
      expect(children.length).to.equal(expects.length, 'number of child nodes mismatch');
      for (const [i, c] of children.entries()) {
        const e = expects[i];
        if (typeof e === 'string') {
          expect(c.nodeType).to.equal(Node.TEXT_NODE);
          expect(c.textContent).to.equal(e);
        } else {
          expect(c.nodeType).to.equal(Node.ELEMENT_NODE);
          expect(c.nodeName.toLowerCase()).to.equal(e.nodeName.toLowerCase());
          if (e.classList) {
            expect(Array.from(c.classList)).to.have.members(e.classList.map((v) => `jpn-balanced-wbr-l${v}`));
          }
        }
      }
    };

    it('should insert proper class names to WBR tags', () => {
      let bw2 = new BalancedWordWrapper();
      const t1 = createTag('h1');
      t1.innerHTML = 'aaa<wbr>bbb';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa',
        { nodeName: 'wbr', classList: [1, 2, 3, 4, 5] },
        'bbb',
      ]);
      bw2 = new BalancedWordWrapper(2);
      t1.innerHTML = 'aa<wbr>bbbb<wbr>ccc';
      bw2.applyElement(t1);
      validate(t1, [
        'aa',
        { nodeName: 'wbr', classList: [2] },
        'bbbb',
        { nodeName: 'wbr', classList: [1, 2] },
        'ccc',
      ]);
      t1.innerHTML = 'aaa<wbr>bbb<wbr>ccc<wbr>ddd<wbr>eee<wbr>fff';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa',
        { nodeName: 'wbr', classList: [] },
        'bbb',
        { nodeName: 'wbr', classList: [2] },
        'ccc',
        { nodeName: 'wbr', classList: [1] },
        'ddd',
        { nodeName: 'wbr', classList: [2] },
        'eee',
        { nodeName: 'wbr', classList: [] },
        'fff',
      ]);
    });

    it('should replace alternative separators with WBR tags', () => {
      const bw2 = new BalancedWordWrapper();
      const t1 = createTag('h1');
      t1.innerHTML = 'aaa\uff3fbbb';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa', { nodeName: 'wbr' }, 'bbb',
      ]);
      t1.innerHTML = '\uff3faaabbb';
      bw2.applyElement(t1);
      validate(t1, [
        'aaabbb',
      ]);
      t1.innerHTML = '\uff3f\uff3faaabbb';
      bw2.applyElement(t1);
      validate(t1, [
        'aaabbb',
      ]);
      t1.innerHTML = 'aaabbb\uff3f';
      bw2.applyElement(t1);
      validate(t1, [
        'aaabbb', { nodeName: 'wbr' },
      ]);
      t1.innerHTML = 'aaabbb\uff3f\uff3f';
      bw2.applyElement(t1);
      validate(t1, [
        'aaabbb', { nodeName: 'wbr' },
      ]);
      t1.innerHTML = 'aaa\uff3f\uff3fbbb';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa', { nodeName: 'wbr' }, 'bbb',
      ]);
      t1.innerHTML = 'aaa\uff3f\uff3f<wbr>bbb';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa', { nodeName: 'wbr' }, 'bbb',
      ]);
      t1.innerHTML = 'aaa\uff3f<wbr>bbb';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa', { nodeName: 'wbr' }, 'bbb',
      ]);
      t1.innerHTML = 'aaa\uff3fbbb<wbr>ccc';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa', { nodeName: 'wbr' }, 'bbb', { nodeName: 'wbr' }, 'ccc',
      ]);
      t1.innerHTML = 'aaa\uff3fbbb\uff3f<wbr>ccc';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa', { nodeName: 'wbr' }, 'bbb', { nodeName: 'wbr' }, 'ccc',
      ]);
      t1.innerHTML = 'aaa\uff3fbbb\uff3fccc';
      bw2.applyElement(t1);
      validate(t1, [
        'aaa', { nodeName: 'wbr' }, 'bbb', { nodeName: 'wbr' }, 'ccc',
      ]);
    });

    it('should handle nested tags properly', () => {
      const bw2 = new BalancedWordWrapper(2);
      const t1 = createTag('h1');
      t1.innerHTML = '<strong class="foo">aa<wbr>bbbb<wbr>ccc</strong>';
      bw2.applyElement(t1);
      validate(t1.childNodes[0], [
        'aa',
        { nodeName: 'wbr', classList: [2] },
        'bbbb',
        { nodeName: 'wbr', classList: [1, 2] },
        'ccc',
      ]);
      t1.innerHTML = '<strong class="foo">aa<wbr>bbbb<wbr>ccc</strong>ddd<wbr>eee';
      // in this case, direct text children of t1 will be ignored by this logic and kept unchanged
      bw2.applyElement(t1);
      expect(t1.childNodes.length).to.equal(4);
      validate(t1, [
        { nodeName: 'strong' },
        'ddd',
        { nodeName: 'wbr', classList: [] },
        'eee',
      ]);
      validate(t1.childNodes[0], [
        'aa',
        { nodeName: 'wbr', classList: [2] },
        'bbbb',
        { nodeName: 'wbr', classList: [1, 2] },
        'ccc',
      ]);
      t1.innerHTML = '<strong class="foo">aaa\uff3fbbb</strong>';
      bw2.applyElement(t1);
      validate(t1.childNodes[0], [
        'aaa', { nodeName: 'wbr' }, 'bbb',
      ]);
      t1.innerHTML = '<strong class="foo">\uff3faaabbb</strong>';
      bw2.applyElement(t1);
      validate(t1.childNodes[0], [
        'aaabbb',
      ]);
      t1.innerHTML = '<strong class="foo">aaabbb\uff3f</strong>';
      bw2.applyElement(t1);
      validate(t1.childNodes[0], [
        'aaabbb', { nodeName: 'wbr' },
      ]);
    });
  });
});
