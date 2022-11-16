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
import { createTag } from '../../scripts/scripts.js';

export default function addBackgroundAnimation($block, animationName) {
  const $videoBackground = createTag('video', {
    class: 'snow-background', autoplay: true, muted: true, loop: true, playsinline: true,
  });

  const animations = {
    firework: function startFirework($section) {
      $section.classList.add('firework');
    },
    snow: function startSnowing($section) {
      $section.classList.add('snowing');
      $videoBackground.classList.add('snow-background');
      $videoBackground.append(createTag('source', { src: 'https://www.adobe.com/express/media_18115ed8a55cc84ae354bdd375d8057198f3f720e.mp4', type: 'video/mp4' }));
      $section.prepend($videoBackground);
    },
  };

  const $parent = $block.closest('.section');

  if ($parent) {
    animations[animationName]($parent);
    $videoBackground.play();
  }
}
