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
import { createTag } from '../../scripts/scripts.js';
import crossBlockMediator from '../../scripts/block-mediator.js';

export default function decorate(block) {
  const content = createTag('div');
  block.innerHTML = '';
  content.append('I am block-mediator-setter2. Click below to increment the value of demo.');
  const div = createTag('div', { style: 'cursor: pointer; background-color: pink;' });
  div.append('Click me!');
  content.append(createTag('br'));
  content.append(div);
  const clickHandler = () => {
    crossBlockMediator.set('demo', (crossBlockMediator.get('demo') || 0) + 1);
  };
  if (crossBlockMediator.hasStore('demo')) {
    div.addEventListener('click', clickHandler);
  } else {
    const unsubscribe = crossBlockMediator.subscribe('demo', () => {
      div.addEventListener('click', clickHandler);
      unsubscribe();
    });
  }
  block.append(content);
}
