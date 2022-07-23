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
  console.log('Video array:', videoArr);
}

function loadSection(sectionObj) {
  // In this function, replace the current section with a new one.
  // eslint-disable-next-line no-console
  console.log('sectionObj: ', sectionObj);

  loadVideo();
}

export default function decorate($block) {
  const sessions = [];
  let sessionIndex = -1;

  Array.from($block.children).forEach(($row) => {
    const $sessionThumbnail = $row.querySelector('picture');
    const $sessionTitle = $row.querySelector('h3');
    const $sessionDescription = $row.querySelector('h2');
    const $videosThumbnail = $row.querySelector('picture');
    const $videos = $row.querySelectorAll('a');
    const $nodes = $row.querySelectorAll('div>div');
    const $videoDuration = $nodes[$nodes.length - 1].textContent;
    // If the row is a session title, then create a new array of videos.

    // If the row is a video, then add the video to the current session array.

    if ($sessionTitle) {
      console.log($row);
      sessionIndex += 1;

      sessions.push({
        title: $sessionTitle.textContent,
        description: $sessionDescription.textContent,
        thumbnail: $sessionThumbnail,
        videos: [],
      });
    }

    if ($videosThumbnail) {
      sessions[sessionIndex].videos.push({
        title: $videos[0].textContent,
        files: Array.from($videos, (a) => a.href),
        thumbnail: $videosThumbnail,
        duration: $videoDuration,
      });
    }
  });

  console.log(sessions);

  $block.innerHTML = '';

  // Rebuild the whole block properly.
  const $thumbnailsContainer = createTag('div', { class: 'thumbnails-container' });
  $block.append($thumbnailsContainer);

  for (let i = 0; i < sessions.length; i += 1) {
    const $sessionBlock = createTag('div', { class: 'session-block' });
    $thumbnailsContainer.append($sessionBlock);

    const $sessionThumbnail = sessions[i].thumbnail;
    const $sessionTitle = createTag('h5', { class: 'session-title' });
    $sessionTitle.textContent = sessions[i].title;
    const $sessionDescription = createTag('h4', { class: 'session-description' });
    $sessionDescription.textContent = sessions[i].description;
    $sessionBlock.append($sessionThumbnail);
    $sessionBlock.append($sessionTitle);
    $sessionBlock.append($sessionDescription);
  }

  const $videoPlayer = createTag('div', { class: 'video-player' });
  $block.append($videoPlayer);

  // Load the latest section and video.
  loadSection(sessions[sessions.length - 1]);
}
