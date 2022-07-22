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
import { createTag } from '../../scripts/scripts.js';

function loadVideo(videoArr) {
  // In this function, replace the current video with a new one or load the first video.
  // eslint-disable-next-line no-console
  console.log(videoArr);
}

function loadSection(sectionObj) {
  // In this function, replace the current section with a new one.
  // eslint-disable-next-line no-console
  console.log(sectionObj);

  loadVideo();
}

export default function decorate($block) {
  const videos = [
    {
      title: 'Session 1',
      subtitle: 'Promote your dogs',
      videos: [],
    },
  ];

  Array.from($block.children).forEach(($row) => {
    // If the row is a session title, then create a new array of videos.
    // If the row is a video, then add the video to the current session array.

    // eslint-disable-next-line no-console
    console.log($row);
    // eslint-disable-next-line no-console
    console.log(videos);
  });

  $block.innerHTML = '';

  // Rebuild the whole block properly.
  const $playlistContainer = createTag('div', { class: 'playlist-container' });
  $playlistContainer.textContent = 'Hello world';
  $block.append($playlistContainer);

  // Load the latest section and video.
  loadSection(videos[videos.length - 1]);
}
