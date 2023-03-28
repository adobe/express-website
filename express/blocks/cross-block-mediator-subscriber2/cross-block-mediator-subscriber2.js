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
import crossBlockMediator from '../../scripts/cross-block-mediator.js';

export default function decorate(block) {
  const content = createTag('div');
  block.innerHTML = '';
  const value = crossBlockMediator.get('demo');
  content.append(`I am cross-block-mediator-subscriber2. I only listen for the onLoad() of setter. demo value now is ${value}.`);
  content.append(createTag('br'));
  const unsubscribe = crossBlockMediator.subscribe('demo', ({ oldValue, newValue }) => {
    if (oldValue === undefined) {
      content.append(`I know that the setter block is initiated. demo value is now ${newValue}. I will unsubscribe now.`);
      content.append(createTag('br'));
      unsubscribe();
    }
  });
  block.append(content);
}
