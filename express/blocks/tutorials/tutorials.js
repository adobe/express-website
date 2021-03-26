/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* globals window document */

import {
  createTag,
  toClassName,
} from '../../scripts/scripts.js';

function playYouTubeVideo(vid, $element) {
  $element.innerHTML = `<iframe width="720" height="405" src="https://www.youtube.com/embed/${vid}?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  /*
  const ytPlayerScript='https://www.youtube.com/iframe_api';
  if (!document.querySelector(`script[src="${ytPlayerScript}"]`)) {
    const tag = document.createElement('script');
    tag.src = ytPlayerScript;
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  if (typeof YT !== 'undefined' && YT.Player) {
    const player = new YT.Player($element.id, {
      height: $element.clientHeight,
      width: $element.clientWidth,
      videoId: vid,
      events: {
          'onReady': (event) => {
            event.target.playVideo();
          },
        }
    });
  } else {
    setTimeout(() => {
      playYouTubeVideo(vid, $element);
    }, 100)
  }
  */
}

function displayTutorial(tutorial) {
  if (tutorial.link.includes('youtu')) {
    const $overlay = createTag('div', { class: 'overlay' });
    const $video = createTag('div', { class: 'overlay-video', id: 'overlay-video' });
    $overlay.appendChild($video);
    window.location.hash = toClassName(tutorial.title);
    const $main = document.querySelector('main');
    $main.append($overlay);
    const yturl = new URL(tutorial.link);
    let vid = yturl.searchParams.get('v');
    if (!vid) {
      vid = yturl.pathname.substr(1);
    }
    $overlay.addEventListener('click', () => {
      window.location.hash = '';
      $overlay.remove();
    });

    playYouTubeVideo(vid, $video);
  } else {
    window.location.href = tutorial.link;
  }

  // eslint-disable-next-line no-console
  console.log(tutorial.link);
}

function createTutorialCard(tutorial) {
  const $card = createTag('div', { class: 'tutorial-card' });
  let img;
  let noimg = '';
  if (tutorial.img) {
    img = `<img src="${tutorial.img}">`;
  } else {
    img = `<div class="badge"></div><div class="title">${tutorial.title}</div>`;
    noimg = 'noimg';
  }

  $card.innerHTML = `<div class="tutorial-card-image">
  </div>
  <div class="tutorial-card-img ${noimg}">
    ${img}
    <div class="duration">${tutorial.time}</div>
  </div>
  <div class="tutorial-card-title">
  <h3>${tutorial.title}</h3>
  </div>
  <div class="tutorial-card-tags">
  <span>${tutorial.tags.join('</span><span>')}</span>
  </div>
  `;
  $card.addEventListener('click', () => {
    displayTutorial(tutorial);
  });
  return ($card);
}

function displayTutorialsByCatgory(tutorials, $results, category) {
  $results.innerHTML = '';

  const matches = tutorials.filter((tut) => tut.categories.includes(category));
  matches.forEach((match) => {
    $results.appendChild(createTutorialCard(match));
  });
}

function toggleCategories($section, show) {
  const children = Array.from($section.children);
  let afterTutorials = false;
  children.forEach(($e) => {
    if (afterTutorials) {
      if (show) {
        $e.classList.remove('hidden');
      } else {
        $e.classList.add('hidden');
      }
    }
    if ($e.classList.contains('tutorials')) {
      afterTutorials = true;
    }
  });
}

function displayFilteredTutorials(tutorials, $results, $filters) {
  $results.innerHTML = '';
  const $section = $results.closest('.section-wrapper > div');
  const filters = (Array.from($filters)).map((f) => f.textContent);
  if (filters.length) {
    toggleCategories($section, false);
    const matches = tutorials.filter((tut) => filters.every((v) => tut.tags.includes(v)));
    matches.forEach((match) => {
      $results.append(createTutorialCard(match));
    });
  } else {
    toggleCategories($section, true);
  }
}

function decorateTutorials($tutorials) {
  const tutorials = [];
  const $section = $tutorials.closest('.section-wrapper > div');
  const allTags = [];
  const $rows = Array.from($tutorials.children);
  $rows.forEach(($row) => {
    const $cells = Array.from($row.children);
    const $tags = $cells[3];
    const $categories = $cells[2];
    const $title = $cells[0];
    const $img = $cells[4];

    const tags = Array.from($tags.children).map(($tag) => $tag.textContent);
    const categories = Array.from($categories.children).map(($cat) => $cat.textContent);
    const time = $cells[1].textContent;
    const title = $title.textContent;
    const link = $title.querySelector('a').href;
    const img = $img.querySelector('img') ? $img.querySelector('img').src : undefined;

    tutorials.push({
      title, link, time, tags, categories, img,
    });

    tags.forEach((tag) => {
      if (!allTags.includes(tag)) allTags.push(tag);
    });
  });

  $tutorials.innerHTML = '';
  const $results = createTag('div', { class: 'results' });
  $tutorials.append($results);

  const $filters = createTag('div', { class: 'filters' });
  allTags.forEach((tag) => {
    const $tagFilter = createTag('span', { class: 'tag-filter' });
    $tagFilter.innerHTML = tag;
    $filters.appendChild($tagFilter);
    $tagFilter.addEventListener('click', () => {
      $tagFilter.classList.toggle('selected');
      displayFilteredTutorials(tutorials, $results, $filters.querySelectorAll('.selected'));
    });
  });

  $tutorials.prepend($filters);

  const $children = Array.from($section.children);
  let filterFor = '';
  $children.forEach(($e) => {
    // eslint-disable-next-line no-console
    console.log($e.tagName);
    if ($e.tagName === 'H2') {
      if (filterFor) {
        const $h2results = createTag('div', { class: 'results' });
        displayTutorialsByCatgory(tutorials, $h2results, filterFor);
        $section.insertBefore($h2results, $e);
      }
      filterFor = $e.textContent;
    }
  });

  if (filterFor) {
    const $lasth2results = createTag('div', { class: 'results' });
    displayTutorialsByCatgory(tutorials, $lasth2results, filterFor);
    $section.appendChild($lasth2results);
  }

  if (window.location.hash !== '#') {
    const video = window.location.hash.substr(1);
    tutorials.forEach((tutorial) => {
      if (toClassName(tutorial.title) === video) {
        displayTutorial(tutorial);
      }
    });
  }
}

export default function decorate($block) {
  decorateTutorials($block);
}
