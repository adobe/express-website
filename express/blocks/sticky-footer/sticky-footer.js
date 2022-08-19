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

/**
 * @param {HTMLDivElement} $block
 */
export default function decorate($block) {
  if (document.body.dataset.device === 'mobile') {
    $block.remove();
  }

  const $dupIcon = $block.querySelector('img.icon-duplicate');
  if ($dupIcon) {
    const sib = $dupIcon.previousElementSibling;
    if (!sib) return;

    const link = sib.querySelector('a[href]');
    if (!link || !link.href) return;

    const { href } = link;
    $dupIcon.onclick = () => {
      navigator.clipboard.writeText(href);
    };
  }
}
