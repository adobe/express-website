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

function toggleSessionState($block, $session) {
  $block.querySelector('.session.active')
    .classList
    .remove('active');
  $session.classList.add('active');
}

function toggleVideoButtonState($block, $videoButton) {
  $block.querySelector('.video-button.active')
    .classList
    .remove('active');
  $videoButton.classList.add('active');
}

function scrollSessionIntoView($block, payload) {
  const $carousel = $block.querySelector('.carousel-platform');
  setTimeout(() => {
    $carousel.scrollLeft = payload.sessionIndex * 208;
  }, 100);
}

function loadVideo($block, payload) {
  // In this function, replace the current video with a new one or load the first video.
  const $videoTitle = $block.querySelector('.video-player__video-title');
  const $playerOverlay = $block.querySelector('.video-player__inline-player__overlay');
  const $inlinePlayer = $block.querySelector('.video-player__inline-player');
  const $inlinePlayerDuration = $block.querySelector('.video-player__inline-player__duration');
  const currentVideo = payload.sessions[payload.sessionIndex].videos[payload.videoIndex];
  const $videoButton = $block.querySelectorAll('.video-button')[payload.videoIndex];

  if ($inlinePlayer) {
    $inlinePlayer.innerHTML = '';
    $playerOverlay.style.zIndex = 1;
    $playerOverlay.style.backgroundImage = `url('${currentVideo.thumbnail}')`;

    for (let i = 0; i < currentVideo.files.length; i += 1) {
      const file = currentVideo.files[i];
      $inlinePlayer.append(createTag('source', {
        src: file.href,
        type: `video/${file.type}`,
      }));
    }

    $inlinePlayer.load();
    $inlinePlayerDuration.textContent = currentVideo.duration;

    $videoTitle.textContent = currentVideo.title;
    toggleVideoButtonState($block, $videoButton);
  }
}

function loadList($block, payload) {
  const $list = $block.querySelector('.video-player__video-list');
  if ($list) {
    $list.innerHTML = '';
    const videoArr = payload.sessions[payload.sessionIndex].videos;
    videoArr.forEach((video, index) => {
      const $videoButton = createTag('li', { class: 'video-button' });
      if (index === 0) {
        $videoButton.classList.add('active');
      }
      const $videoButtonTitle = createTag('span', { class: 'video-button__title' });
      $videoButtonTitle.textContent = video.title;
      const $videoButtonDuration = createTag('span', { class: 'video-button__duration' });
      $videoButtonDuration.textContent = video.duration;
      $videoButton.append(getIconElement('play', 44), $videoButtonTitle, $videoButtonDuration);
      $list.append($videoButton);

      $videoButton.addEventListener('click', (e) => {
        e.preventDefault();
        payload.videoIndex = index;
        loadVideo($block, payload);
      });
    });
  }
}

function loadSession($block, payload) {
  // In this function, replace the current section with a new one.
  const $videoListHeading = $block.querySelector('.video-player__video-list-heading');
  if ($videoListHeading) {
    $block.querySelector('.video-player__session-number').textContent = payload.sessions[payload.sessionIndex].title;
    $block.querySelector('.video-player__session-title').textContent = payload.sessions[payload.sessionIndex].description;
    $videoListHeading.textContent = `${payload.sessions[payload.sessionIndex].title} Clips`;
    loadList($block, payload);
    loadVideo($block, payload);

    const $sessions = $block.querySelectorAll('.session');
    toggleSessionState($block, $sessions[payload.sessionIndex]);
    scrollSessionIntoView($block, payload);
  }
}

function decorateSessionsCarousel($block, payload) {
  const $thumbnailsContainer = createTag('div', { class: 'thumbnails-container' });
  $block.append($thumbnailsContainer);

  payload.sessions.forEach((session, index) => {
    const $session = createTag('div', { class: 'session' });
    $thumbnailsContainer.append($session);
    const $sessionThumbnail = session.thumbnail;
    const $sessionTitle = createTag('h5', { class: 'session-title' });
    $sessionTitle.textContent = session.title;
    const $sessionDescription = createTag('h4', { class: 'session-description' });
    $sessionDescription.textContent = session.description;
    $session.append($sessionThumbnail, $sessionTitle, $sessionDescription);
    $session.addEventListener('click', () => {
      payload.sessionIndex = index;
      loadSession($block, payload);
    });
  });

  buildCarousel('.session', $thumbnailsContainer);
  $block.querySelectorAll('.session')[payload.sessionIndex].classList.add('active');
}

function decorateVideoPlayerSection($block) {
  const $videoPlayer = createTag('div', { class: 'video-player' });
  const $videoPlayerHeadings = createTag('div', { class: 'video-player__headings' });
  const $sessionNum = createTag('h4', { class: 'video-player__session-number' });
  const $sessionTitle = createTag('h2', { class: 'video-player__session-title' });
  const $videoPlayerBody = createTag('div', { class: 'video-player__body' });
  $videoPlayerHeadings.append($sessionNum, $sessionTitle);
  $videoPlayer.append($videoPlayerHeadings, $videoPlayerBody);
  $block.append($videoPlayer);
}

function decorateInlineVideoPlayer($block) {
  const $inlinePlayerWrapper = createTag('div', { class: 'video-player__inline-player__wrapper' });
  const $playerOverlay = createTag('div', { class: 'video-player__inline-player__overlay' });
  const $inlinePlayer = createTag('video', {
    class: 'video-player__inline-player',
    preload: 'metadata',
    controls: true,
    playsInline: true,
    controlsList: 'nodownload',
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
  $block.querySelector('.video-player')
    .append($videoPlayerBody);
  $playerOverlay.addEventListener('click', () => {
    $playerOverlay.style.zIndex = 0;
    $inlinePlayer.play();
  });
}

function decorateVideoPlayerMenu($block) {
  const $videoPlayerMenu = createTag('div', { class: 'video-player__menu' });
  const $videoTitle = createTag('h3', { class: 'video-player__video-title' });
  const $navButtons = createTag('div', { class: 'video-player__buttons' });
  const $buttonPrevious = createTag('a', {
    class: 'video-player__button-previous',
    href: '#',
  });
  const $buttonPreviousImg = createTag('img', {
    class: 'video-player__button-previous__img',
    src: '/express/icons/adobe-express-video-previous.svg',
  });
  const $buttonNext = createTag('a', {
    class: 'video-player__button-next button accent',
    href: '#',
  });
  $buttonNext.textContent = 'Next clip';
  const $videoListWrapper = createTag('div', { class: 'video-player__video-list-wrapper' });
  const $videoListHeading = createTag('p', { class: 'video-player__video-list-heading' });
  const $videoList = createTag('ul', { class: 'video-player__video-list' });

  $buttonPrevious.append($buttonPreviousImg);
  $navButtons.append($buttonPrevious, $buttonNext);
  $videoListWrapper.append($videoListHeading, $videoList);
  $videoPlayerMenu.append($videoTitle, $navButtons, $videoListWrapper);
  const $videoPlayerBody = $block.querySelector('.video-player__body');
  $videoPlayerBody.append($videoPlayerMenu);
}

function loadPreviousVideo($block, payload) {
  const currentVideos = payload.sessions[payload.sessionIndex].videos;
  if (payload.videoIndex > 0) {
    payload.videoIndex -= 1;
    loadVideo($block, payload);
  } else if (payload.videoIndex === 0 && payload.sessionIndex > 0) {
    payload.sessionIndex -= 1;
    loadSession($block, payload);
    payload.videoIndex = currentVideos.length - 1;
    loadVideo($block, payload);
  } else {
    payload.sessionIndex = payload.sessions.length - 1;
    loadSession($block, payload);
    payload.videoIndex = currentVideos.length - 1;
    loadVideo($block, payload);
  }
}

function loadNextVideo($block, payload) {
  const currentVideos = payload.sessions[payload.sessionIndex].videos;
  if (payload.videoIndex < currentVideos.length - 1) {
    payload.videoIndex += 1;
    loadVideo($block, payload);
  } else if (payload.videoIndex === currentVideos.length - 1
    && payload.sessionIndex < payload.sessions.length - 1) {
    payload.sessionIndex += 1;
    payload.videoIndex = 0;
    loadSession($block, payload);
  } else {
    payload.sessionIndex = 0;
    payload.videoIndex = 0;
    loadSession($block, payload);
  }
}

export default function decorate($block) {
  const payload = {
    sessionIndex: 0,
    videoIndex: 0,
    sessions: [],
  };

  let sessionIndex = -1;

  Array.from($block.children)
    .forEach(($row) => {
      const $sessionTitle = $row.querySelector('h3');
      const $videos = $row.querySelectorAll('a');
      if ($sessionTitle) {
        const $sessionThumbnail = $row.querySelector('picture');
        const $sessionDescription = $row.querySelector('h2');
        sessionIndex += 1;

        payload.sessions.push({
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
        payload.sessions[sessionIndex].videos.push({
          title: $videos[0].textContent,
          files: Array.from($videos, (a) => ({
            href: a.href,
            type: a.href.split('.')
              .pop(),
          })),
          thumbnail: $videosThumbnail.querySelector('img').src,
          duration: $videoDuration,
        });
      }
    });
  payload.sessionIndex = payload.sessions.length - 1;
  $block.innerHTML = '';

  // Rebuild the whole block properly.
  decorateSessionsCarousel($block, payload);
  decorateVideoPlayerSection($block);
  decorateInlineVideoPlayer($block);
  decorateVideoPlayerMenu($block);

  // Load the latest section and video.
  loadSession($block, payload);

  const $buttonPrevious = $block.querySelector('.video-player__button-previous');
  const $buttonNext = $block.querySelector('.video-player__button-next');
  $buttonPrevious.addEventListener('click', (e) => {
    e.preventDefault();
    loadPreviousVideo($block, payload);
  });
  $buttonNext.addEventListener('click', (e) => {
    e.preventDefault();
    loadNextVideo($block, payload);
  });
}
