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

function loadVideo(videoArr, overlay, player, videoDuration, menu, index) {
  // In this function, replace the current video with a new one or load the first video.
  menu.innerHTML = '';
  const currentVideo = videoArr[index];
  overlay.style.backgroundImage = `url('${currentVideo.thumbnail}')`;
  overlay.style.zIndex = 1;
  overlay.addEventListener('click', () => {
    overlay.style.zIndex = 0;
    player.play();
  });
  for (let i = 0; i < currentVideo.files.length; i += 1) {
    const file = currentVideo.files[i];
    player.append(createTag('source', { src: file.href, type: `video/${file.type}` }));
  }
  player.load();
  player.classList.add('hidden');
  videoDuration.textContent = currentVideo.duration;
  const $videoTitle = createTag('h3', { class: 'video-player__video-title' });
  $videoTitle.textContent = currentVideo.title;
  const $navButtons = createTag('div', { class: 'video-player__buttons' });
  const $buttonPrevious = createTag('a', { class: 'video-player__button-previous' });
  const $buttonNext = createTag('a', { class: 'video-player__button-next' });
  const $videoListWrapper = createTag('div', { class: 'video-player__video-list-wrapper' });
  const $videoListHeading = createTag('p', { class: 'video-player__video-list-heading' });
  const $videoList = createTag('ul', { class: 'video-player__video-list' });

  $navButtons.append($buttonPrevious, $buttonNext);
  $videoListWrapper.append($videoListHeading, $videoList);
  menu.append($videoTitle, $navButtons, $videoListWrapper);

  for (let i = 0; i < videoArr.length; i += 1) {
    const $videoButton = createTag('li', { class: 'video-button' });
    const $videoButtonIcon = createTag('svg', { class: 'video-button__play-icon' });
    $videoButtonIcon.append(createTag('use', { href: '/express/icons/ccx-sheet_44.svg#play44' }));
    const $videoButtonTitle = createTag('span', { class: 'video-button__title' });
    $videoButtonTitle.textContent = videoArr[i].title;
    const $videoButtonDuration = createTag('span', { class: 'video-button__duration' });
    $videoButtonDuration.textContent = videoArr[i].duration;
    $videoButton.append($videoButtonIcon, $videoButtonTitle, $videoButtonDuration);
    $videoList.append($videoButton);

    $videoButton.addEventListener('click', () => {
      loadVideo(videoArr, overlay, player, videoDuration, menu, i);
    });
  }
}

function loadSession($videoPlayer, sessionObj) {
  // In this function, replace the current section with a new one.
  $videoPlayer.innerHTML = '';
  const { videos } = sessionObj;
  const $videoPlayerHeadings = createTag('div', { class: 'video-player__headings' });
  const $sessionNum = createTag('h4', { class: 'video-player__session-number' });
  $sessionNum.textContent = sessionObj.title;
  const $sessionTitle = createTag('h2', { class: 'video-player__session-title' });
  $sessionTitle.textContent = sessionObj.description;
  $videoPlayerHeadings.append($sessionNum, $sessionTitle);
  $videoPlayer.append($videoPlayerHeadings);

  const $videoPlayerBody = createTag('div', { class: 'video-player__body' });
  const $inlinePlayerWrapper = createTag('div', {class: 'video-player__inline-player__wrapper' });
  const $playerOverlay = createTag('div', { class: 'video-player__inline-player__overlay' });
  const $inlinePlayer = createTag('video', {
    class: 'video-player__inline-player', preload: 'metadata', controls: true, playsInline: true, controlsList: 'nodownload',
  });
  const $inlinePlayerIcon = createTag('img', { class: 'video-player__inline-player__play-icon' });
  const $inlinePlayerDuration = createTag('div', { class: 'video-player__inline-player__duration' });
  const $videoPlayerMenu = createTag('div', { class: 'video-player__menu' });

  $playerOverlay.append($inlinePlayerIcon, $inlinePlayerDuration);
  $inlinePlayerWrapper.append($playerOverlay, $inlinePlayer);
  $videoPlayerBody.append($inlinePlayerWrapper, $videoPlayerMenu);
  $videoPlayer.append($videoPlayerBody);

  loadVideo(videos, $playerOverlay, $inlinePlayer, $inlinePlayerDuration, $videoPlayerMenu, 0);
}

export default function decorate($block) {
  const sessions = [];
  let sessionIndex = -1;

  Array.from($block.children).forEach(($row) => {
    const $sessionTitle = $row.querySelector('h3');
    const $videos = $row.querySelectorAll('a');

    // If the row is a session title, then create a new array of videos.

    // If the row is a video, then add the video to the current session array.

    if ($sessionTitle) {
      const $sessionThumbnail = $row.querySelector('picture');
      const $sessionDescription = $row.querySelector('h2');
      sessionIndex += 1;

      sessions.push({
        title: $sessionTitle.textContent,
        description: $sessionDescription.textContent,
        thumbnail: $sessionThumbnail,
        videos: [],
      });
    }

    if ($videos.length > 0) {
      const $videosThumbnail = $row.querySelector('picture');
      const $nodes = $row.querySelectorAll('div>div');
      const $videoDuration = $nodes[$nodes.length - 1].textContent;
      sessions[sessionIndex].videos.push({
        title: $videos[0].textContent,
        files: Array.from($videos, (a) => ({ href: a.href, type: a.href.split('.').pop() })),
        thumbnail: $videosThumbnail.querySelector('img').src,
        duration: $videoDuration,
      });
    }
  });

  $block.innerHTML = '';

  // Rebuild the whole block properly.
  const $thumbnailsContainer = createTag('div', { class: 'thumbnails-container' });
  const $videoPlayer = createTag('div', { class: 'video-player' });
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

    $sessionBlock.addEventListener('click', () => {
      loadSession($videoPlayer, sessions[i]);
    });
  }
  $block.append($videoPlayer);

  // Load the latest section and video.
  loadSession($videoPlayer, sessions[sessions.length - 1]);
}
