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
import { fetchVideoAnalytics } from '../shared/video.js';

async function loadVideoAnalytic($video) {
  const videoAnalytics = await fetchVideoAnalytics();
  let videoAnalytic;

  videoAnalytics.forEach((analytic) => {
    if (window.location.pathname.includes(analytic.Page)) {
      const filenames = analytic.Filenames ? analytic.Filenames.split('\n') : [];

      filenames.forEach((filename) => {
        if ($video.currentSrc.includes(filename)) {
          videoAnalytic = {
            video: $video,
            parameters: {
              videoName: analytic.videoName ?? null,
              videoId: analytic.videoId ?? null,
              videoLength: $video.duration,
              product: 'Adobe Express',
              videoCategory: 'default',
              videoDescription: analytic.videoDescription ?? null,
              videoPlayer: 'html5-video',
              videoMediaType: 'VOD',
            },
          };
        }
      });
    }
  });

  if (videoAnalytic) {
    const videoLoaded = new CustomEvent('videoloaded', { detail: videoAnalytic });
    document.dispatchEvent(videoLoaded);
  }
}

function startVideo(player, overlay) {
  overlay.style.zIndex = 0;
  player.play();
}

function toggleSessionState($block, $session) {
  $block.querySelector('.session.active').classList.remove('active');
  $session.classList.add('active');
}

function toggleVideoButtonState($block, $videoButton) {
  $block.querySelector('.video-button.active').classList.remove('active');
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
  const $videoTitle = $block.querySelector('.video-player-video-title');
  const $playerOverlay = $block.querySelector('.video-player-inline-player-overlay');
  const $inlinePlayer = $block.querySelector('.video-player-inline-player');
  const $inlinePlayerDuration = $block.querySelector('.video-player-inline-player-duration');
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
    if (currentVideo.hideTitle) {
      $videoTitle.classList.add('hidden-mobile');
    } else {
      $videoTitle.classList.remove('hidden-mobile');
    }
    toggleVideoButtonState($block, $videoButton);

    setTimeout(async () => {
      await loadVideoAnalytic($inlinePlayer);
    }, 10);
  }
}

function loadList($block, payload) {
  const $list = $block.querySelector('.video-player-video-list');

  if ($list) {
    $list.innerHTML = '';
    const videoArr = payload.sessions[payload.sessionIndex].videos;

    videoArr.forEach((video, index) => {
      const $videoButton = createTag('a', { class: 'video-button' });
      const $videoButtonTitle = createTag('span', { class: 'video-button-title' });
      const $videoButtonDuration = createTag('span', { class: 'video-button-duration' });

      $videoButtonTitle.textContent = video.title;
      $videoButtonDuration.textContent = video.duration;
      $videoButton.append(getIconElement('play', 44), $videoButtonTitle, $videoButtonDuration);
      $list.append($videoButton);
      if (index === 0) {
        $videoButton.classList.add('active');
      }

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
  const $videoListHeading = $block.querySelector('.video-player-video-list-heading');
  payload.videoIndex = 0;

  if ($videoListHeading) {
    $block.querySelector('.video-player-session-number').textContent = payload.sessions[payload.sessionIndex].title;
    $block.querySelector('.video-player-session-title').textContent = payload.sessions[payload.sessionIndex].description;
    $videoListHeading.textContent = `${payload.sessions[payload.sessionIndex].title} Clips`;
    loadList($block, payload);
    loadVideo($block, payload);

    const $sessions = $block.querySelectorAll('.session');
    toggleSessionState($block, $sessions[payload.sessionIndex]);
    scrollSessionIntoView($block, payload);
  }
}

function loadPreviousVideo($block, payload) {
  if (payload.videoIndex > 0) {
    payload.videoIndex -= 1;
    loadVideo($block, payload);
  } else if (payload.videoIndex === 0 && payload.sessionIndex > 0) {
    payload.sessionIndex -= 1;
    loadSession($block, payload);
    payload.videoIndex = payload.sessions[payload.sessionIndex].videos.length - 1;
  } else {
    payload.sessionIndex = payload.sessions.length - 1;
    loadSession($block, payload);
    payload.videoIndex = payload.sessions[payload.sessionIndex].videos.length - 1;
  }
  loadVideo($block, payload);
}

function loadNextVideo($block, payload) {
  const currentVideos = payload.sessions[payload.sessionIndex].videos;
  const maxVideos = currentVideos.length - 1;
  const maxSessions = payload.sessions.length - 1;

  if (payload.videoIndex < maxVideos) {
    payload.videoIndex += 1;
    loadVideo($block, payload);
  } else if (payload.videoIndex === maxVideos && payload.sessionIndex < maxSessions) {
    payload.sessionIndex += 1;
    payload.videoIndex = 0;
    loadSession($block, payload);
  } else {
    payload.sessionIndex = 0;
    payload.videoIndex = 0;
    loadSession($block, payload);
  }
}

function decorateSessionsCarousel($block, payload) {
  const $thumbnailsContainer = createTag('div', { class: 'thumbnails-container' });
  $block.append($thumbnailsContainer);

  payload.sessions.forEach((session, index) => {
    const $session = createTag('a', { class: 'session' });
    const $sessionThumbnail = session.thumbnail;
    const $sessionTitle = createTag('h5', { class: 'session-title' });
    const $sessionDescription = createTag('h4', { class: 'session-description' });

    $thumbnailsContainer.append($session);
    $sessionTitle.textContent = session.title;
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
  const $videoPlayerHeadings = createTag('div', { class: 'video-player-headings' });
  const $sessionNum = createTag('h4', { class: 'video-player-session-number' });
  const $sessionTitle = createTag('h2', { class: 'video-player-session-title' });
  const $videoPlayerBody = createTag('div', { class: 'video-player-body' });

  $videoPlayerHeadings.append($sessionNum, $sessionTitle);
  $videoPlayer.append($videoPlayerHeadings, $videoPlayerBody);
  $block.append($videoPlayer);
}

function decorateInlineVideoPlayer($block, payload) {
  const $inlinePlayerWrapper = createTag('div', { class: 'video-player-inline-player-wrapper' });
  const $playerOverlay = createTag('a', { class: 'video-player-inline-player-overlay' });
  const $inlinePlayer = createTag('video', {
    class: 'video-player-inline-player',
    preload: 'metadata',
    controls: true,
    playsInline: true,
    controlsList: 'nodownload',
  });
  const $inlinePlayerPlayButton = createTag('a', { class: 'video-player-inline-player-play-button' });
  const $inlinePlayerIcon = createTag('img', { class: 'video-player-inline-player-play-icon' });
  const $inlinePlayerDuration = createTag('div', { class: 'video-player-inline-player-duration' });
  const $videoPlayerBody = $block.querySelector('.video-player-body');

  $inlinePlayerPlayButton.textContent = 'Play';
  $playerOverlay.append(getIconElement('play', 44), $inlinePlayerPlayButton, $inlinePlayerIcon, $inlinePlayerDuration);
  $playerOverlay.style.zIndex = 1;
  $inlinePlayerWrapper.append($playerOverlay, $inlinePlayer);

  $videoPlayerBody.append($inlinePlayerWrapper);
  $block.querySelector('.video-player').append($videoPlayerBody);

  $playerOverlay.addEventListener('click', () => {
    startVideo($inlinePlayer, $playerOverlay);
  });

  $inlinePlayer.addEventListener('ended', () => {
    if (payload.videoIndex !== payload.sessions[payload.sessionIndex].videos.length - 1) {
      loadNextVideo($block, payload);
      startVideo($inlinePlayer, $playerOverlay);
    } else if (window.innerHeight === $inlinePlayer.offsetHeight) {
      document.exitFullscreen();
    }
  });
}

function decorateVideoPlayerMenu($block, payload) {
  const $videoPlayerMenu = createTag('div', { class: 'video-player-menu' });
  const $videoTitle = createTag('h3', { class: 'video-player-video-title' });
  const $navButtons = createTag('div', { class: 'video-player-buttons' });
  const $buttonPrevious = createTag('a', { class: 'video-player-button-previous', href: '#' });
  const $buttonPreviousImg = createTag('img', { class: 'video-player-button-previous-img', src: '/express/icons/adobe-express-video-previous.svg' });
  const $buttonNext = createTag('a', { class: 'video-player-button-next button accent', href: '#' });
  const $videoListWrapper = createTag('div', { class: 'video-player-video-list-wrapper' });
  const $videoListHeading = createTag('p', { class: 'video-player-video-list-heading' });
  const $videoList = createTag('div', { class: 'video-player-video-list' });
  const $videoPlayerBody = $block.querySelector('.video-player-body');

  $buttonNext.textContent = 'Next clip';
  $buttonPrevious.append($buttonPreviousImg);
  $navButtons.append($buttonPrevious, $buttonNext);
  $videoListWrapper.append($videoListHeading, $videoList);
  $videoPlayerMenu.append($videoTitle, $navButtons, $videoListWrapper);
  $videoPlayerBody.append($videoPlayerMenu);

  $buttonPrevious.addEventListener('click', (e) => {
    e.preventDefault();
    loadPreviousVideo($block, payload);
  });

  $buttonNext.addEventListener('click', (e) => {
    e.preventDefault();
    loadNextVideo($block, payload);
  });
}

export default function decorate($block) {
  const payload = {
    sessionIndex: 0,
    videoIndex: 0,
    sessions: [],
  };

  Array.from($block.children).forEach(($row) => {
    const $sessionTitle = $row.querySelector('h3');
    const $videos = $row.querySelectorAll('a');

    if ($sessionTitle) {
      const $sessionThumbnail = $row.querySelector('picture');
      const $sessionDescription = $row.querySelector('h2');

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
      const $videoDuration = $nodes[2].textContent;
      payload.sessions[payload.sessions.length - 1].videos.push({
        title: $videos[0].textContent,
        files: Array.from($videos, (a) => ({
          href: a.href,
          type: a.href.split('.')
            .pop(),
        })),
        thumbnail: $videosThumbnail.querySelector('img').src,
        duration: $videoDuration,
        hideTitle: $nodes[$nodes.length - 1].textContent.toLowerCase() === 'hide title',
      });
    }
  });

  payload.sessionIndex = payload.sessions.length - 1;
  $block.innerHTML = '';

  // Rebuild the whole block properly.
  decorateSessionsCarousel($block, payload);
  decorateVideoPlayerSection($block);
  decorateInlineVideoPlayer($block, payload);
  decorateVideoPlayerMenu($block, payload);

  // Load the latest section and video.
  loadSession($block, payload);
}
