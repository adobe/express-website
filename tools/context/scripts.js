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
/* global document, fetch */

import Context from '../../express/scripts/context.js';

const AUDIENCES_URL = '/drafts/alex/audiences.json';

const init = async () => {
  const audiences = document.querySelector('.hlx-context #audiences');
  const res = await fetch(AUDIENCES_URL);
  const json = await res.json();
  json.data.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.id;
    option.innerHTML = row.name;
    audiences.appendChild(option);
  });
  audiences.addEventListener('change', (evt) => {
    Context.set('audiences', [evt.target.value]);
  });
};

init();
