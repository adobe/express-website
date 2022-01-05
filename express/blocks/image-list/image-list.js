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

// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/scripts.js';

export default function decorate($block) {
  const $rows = Array.from($block.children);
  $rows.forEach(($row) => {
    const $cells = Array.from($row.children);
    if ($cells[2]) {
      const device = toClassName($cells[2].textContent);
      if (device) $row.classList.add(`${device}-only`);
      $cells[2].remove();
    }
    if ($cells[1]) {
      const $a = $cells[1].querySelector('a');
      if ($a) {
        $a.innerHTML = $cells[0].innerHTML;
        $cells[0].remove();
      } else {
        $cells[1].remove();
      }
    }
  });
}
