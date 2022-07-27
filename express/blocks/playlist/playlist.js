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
import { createTag, getIconElement } from '../../scripts/scripts.js';
import { buildCarousel } from '../shared/carousel.js';

function updateClickableList(clickables, targetIndex) {
  for (let i = 0; i < clickables.length; i += 1) {
    clickables[i].classList.remove('active');
  }
  clickables[targetIndex].classList.add('active');
}

function toggleSessionState($block, $session) {
  $block.querySelector('.session.active').classList.remove('active');
  $session.classList.add('active');
}


function loadVideo(payload, videoIndex, sessionIndex) {
  // In this function, replace the current video with a new one or load the first video.
  payload.$videoPlayerMenu.innerHTML = '';
  payload.$inlinePlayerWrapper.innerHTML = '';
  const videoArr = payload.sessions[sessionIndex].videos;
  const currentVideo = videoArr[videoIndex];

  $playerOverlay.style.backgroundImage = `url('${currentVideo.thumbnail}')`;

  for (let i = 0; i < currentVideo.files.length; i += 1) {
    const file = currentVideo.files[i];
    $inlinePlayer.append(createTag('source', { src: file.href, type: `video/${file.type}` }));
  }
  $inlinePlayer.load();
  $inlinePlayer.classList.add('hidden');
  $inlinePlayerDuration.textContent = currentVideo.duration;


  $videoTitle.textContent = currentVideo.title;


  $videoListHeading.textContent = `${payload.sessions[sessionIndex].title} Clips`;

  for (let i = 0; i < videoArr.length; i += 1) {
    const $videoButton = createTag('li', { class: 'video-button' });
    const $videoButtonTitle = createTag('span', { class: 'video-button__title' });
    $videoButtonTitle.textContent = videoArr[i].title;
    const $videoButtonDuration = createTag('span', { class: 'video-button__duration' });
    $videoButtonDuration.textContent = videoArr[i].duration;
    $videoButton.append(getIconElement('play', 44), $videoButtonTitle, $videoButtonDuration);
    $videoList.append($videoButton);

    $videoButton.addEventListener('click', () => {
      loadVideoPlayer(payload, i, sessionIndex);
    });
  }
  const $menuButtons = payload.$videoPlayerMenu.querySelectorAll('.video-button');
  updateClickableList($menuButtons, videoIndex);
}

function loadSession($block, sessions, sessionIndex) {
  // In this function, replace the current section with a new one.
  const $sessions = $block.querySelectorAll('.session');

  $sessionNum.textContent = payload.sessions[sessionIndex].title;

  $sessionTitle.textContent = payload.sessions[sessionIndex].description;


  loadVideo(payload, 0, sessionIndex);
}

function loadList($block, sessions) {

}

function decorateSessionsCarousel($block, sessions) {
  const $thumbnailsContainer = createTag('div', { class: 'thumbnails-container' });
  $block.append($thumbnailsContainer);

  sessions.forEach((session) => {
    const $session = createTag('div', { class: 'session' });
    $thumbnailsContainer.append($session);
    const $sessionThumbnail = session.thumbnail;
    const $sessionTitle = createTag('h5', { class: 'session-title' });
    $sessionTitle.textContent = session.title;
    const $sessionDescription = createTag('h4', { class: 'session-description' });
    $sessionDescription.textContent = session.description;
    $session.append($sessionThumbnail, $sessionTitle, $sessionDescription);
    $session.addEventListener('click', () => {
      // load the chosen session
      // loadSession(payload, i);

      // toggle session active state
      toggleSessionState($block, $session);
    });
  });

  buildCarousel('.session', $thumbnailsContainer);
}

function decorateVideoPlayerSection($block, sessions) {
  const $videoPlayer = createTag('div', { class: 'video-player' });
  const $videoPlayerHeadings = createTag('div', { class: 'video-player__headings' });
  const $sessionNum = createTag('h4', { class: 'video-player__session-number' });
  const $sessionTitle = createTag('h2', { class: 'video-player__session-title' });
  const $videoPlayerBody = createTag('div', { class: 'video-player__body' });
  $videoPlayerHeadings.append($sessionNum, $sessionTitle);
  $videoPlayer.append($videoPlayerHeadings, $videoPlayerBody);
  $block.append($videoPlayer);
}

function decorateInlineVideoPlayer($block, sessions) {
  const $inlinePlayerWrapper = createTag('div', { class: 'video-player__inline-player__wrapper' });
  const $playerOverlay = createTag('div', { class: 'video-player__inline-player__overlay' });
  const $inlinePlayer = createTag('video', {
    class: 'video-player__inline-player', preload: 'metadata', controls: true, playsInline: true, controlsList: 'nodownload',
  });
  const $inlinePlayerPlayButton = createTag('a', { class: 'video-player__inline-player__play-button' });
  $inlinePlayerPlayButton.textContent = 'Play';
  const $inlinePlayerIcon = createTag('img', { class: 'video-player__inline-player__play-icon' });
  const $inlinePlayerDuration = createTag('div', { class: 'video-player__inline-player__duration' });
  $playerOverlay.append(getIconElement('play', 44), $inlinePlayerPlayButton, $inlinePlayerIcon, $inlinePlayerDuration);
  $playerOverlay.style.zIndex = 1;
  $inlinePlayerWrapper.append($playerOverlay, $inlinePlayer);
  const $videoPlayerBody = $block.querySelector('.video-player__body');
  $videoPlayerBody.append($inlinePlayerWrapper);
  $block.querySelector('.video-player').append($videoPlayerBody);
  $playerOverlay.addEventListener('click', () => {
    $playerOverlay.style.zIndex = 0;
    $inlinePlayer.play();
  });
}

function decorateVideoPlayerMenu($block, sessions) {
  const $videoPlayerMenu = createTag('div', { class: 'video-player__menu' });
  const $videoTitle = createTag('h3', { class: 'video-player__video-title' });
  const $navButtons = createTag('div', { class: 'video-player__buttons' });
  const $buttonPrevious = createTag('a', { class: 'video-player__button-previous' });
  $buttonPrevious.textContent = '<';
  const $buttonNext = createTag('a', { class: 'video-player__button-next button accent', href: '#' });
  $buttonNext.textContent = 'Next clip';
  const $videoListWrapper = createTag('div', { class: 'video-player__video-list-wrapper' });
  const $videoListHeading = createTag('p', { class: 'video-player__video-list-heading' });
  const $videoList = createTag('ul', { class: 'video-player__video-list' });

  $navButtons.append($buttonPrevious, $buttonNext);
  $videoListWrapper.append($videoListHeading, $videoList);
  $videoPlayerMenu.append($videoTitle, $navButtons, $videoListWrapper);
  const $videoPlayerBody = $block.querySelector('.video-player__body');
  $videoPlayerBody.append($videoPlayerMenu);
  $buttonPrevious.addEventListener('click', (e) => {
    e.preventDefault();
    // if (videoIndex > 0) {
    //   loadVideo(payload, videoIndex - 1, sessionIndex);
    // } else if (videoIndex === 0 && sessionIndex > 0) {
    //   loadSession(payload, sessionIndex - 1);
    //   const targetSession = payload.sessions[sessionIndex - 1];
    //   loadVideo(payload, targetSession.videos.length - 1, sessionIndex - 1);
    // } else {
    //   loadSession(payload, payload.sessions.length - 1);
    //   const targetSession = payload.sessions[payload.sessions.length - 1];
    //   loadVideo(payload, targetSession.videos.length - 1, payload.sessions.length - 1);
    // }
  });
  $buttonNext.addEventListener('click', (e) => {
    e.preventDefault();
    // if (videoIndex < videoArr.length - 1) {
    //   loadVideo(payload, videoIndex + 1, sessionIndex);
    // } else if (videoIndex === videoArr.length - 1 && sessionIndex < payload.sessions.length - 1) {
    //   loadSession(payload, sessionIndex + 1);
    // } else {
    //   loadSession(payload, 0);
    // }
  });
}

export default function decorate($block) {
  const sessions = [];
  let sessionIndex = -1;

  Array.from($block.children).forEach(($row) => {
    const $sessionTitle = $row.querySelector('h3');
    const $videos = $row.querySelectorAll('a');
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
  decorateSessionsCarousel($block, sessions);
  decorateVideoPlayerSection($block, sessions);
  decorateInlineVideoPlayer($block, sessions);
  decorateVideoPlayerMenu($block, sessions);

  // Load the latest section and video.
  loadSession($block, sessions, sessions.length - 1);

  // const $carousel = $thumbnailsContainer.querySelector('.carousel-platform');
  // setTimeout(() => {
  //   $carousel.scrollLeft = $carousel.scrollWidth;
  // }, 10);
}
