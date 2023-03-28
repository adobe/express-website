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
  const value = crossBlockMediator.get('demo');
  content.append(`I am block-mediator-subscriber3. I react to all changes. When I first exist, demo value is ${value}.`);
  content.append(createTag('br'));
  crossBlockMediator.subscribe('demo', ({ oldValue, newValue }) => {
    content.append(
      `demo value changed from ${oldValue} to ${newValue}.`,
    );
    content.append(createTag('br'));
  });
  block.append(content);
}
