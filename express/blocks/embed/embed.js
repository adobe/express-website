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
/* eslint-disable import/named, import/extensions */

import {
  loadScript,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

// 'open.spotify.com' returns 'spotify'
function getServer(url) {
  const l = url.hostname.lastIndexOf('.');
  return url.hostname.substring(url.hostname.lastIndexOf('.', l - 1) + 1, l);
}

function getDefaultEmbed(url) {
  return `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;
}

function embedYoutube(url) {
  const usp = new URLSearchParams(url.search);
  const vid = usp.get('v');
  const embed = url.pathname;
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&amp;v=${vid}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen="" scrolling="no" allow="encrypted-media; accelerometer; gyroscope; picture-in-picture" title="Content from Youtube" loading="lazy"></iframe>
  </div>`;
  return embedHTML;
}

function embedInstagram(url) {
  const location = window.location.href;
  const src = `${url.origin}${url.pathname}${url.pathname.charAt(url.pathname.length - 1) === '/' ? '' : '/'}embed/?cr=1&amp;v=13&amp;wp=1316&amp;rd=${location.endsWith('.html') ? location : `${location}.html`}`;
  const embedHTML = `<div style="width: 100%; position: relative; padding-bottom: 56.25%; display: flex; justify-content: center">
    <iframe class="instagram-media instagram-media-rendered" id="instagram-embed-0" src="${src}"
      allowtransparency="true" allowfullscreen="true" frameborder="0" height="530" style="background: white; border-radius: 3px; border: 1px solid rgb(219, 219, 219);
      box-shadow: none; display: block;">
    </iframe>
  </div>`;
  return embedHTML;
}

function embedVimeo(url) {
  const linkArr = url.href.split('/');
  const video = linkArr ? linkArr[3] : linkArr;
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="${video ? url.href : `https://player.vimeo.com/video/${video}`}?byline=0&badge=0&portrait=0&title=0" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
        allowfullscreen="" scrolling="no" allow="encrypted-media" title="Content from Vimeo" loading="lazy">
      </iframe>
  </div>`;
  return embedHTML;
}

function embedSpark(url) {
  let embedURL = url;
  if (!url.pathname.endsWith('/embed.html') && !url.pathname.endsWith('/embed')) {
    embedURL = new URL(`${url.href}${url.pathname.endsWith('/') ? '' : '/'}embed.html`);
  }

  return getDefaultEmbed(embedURL);
}

function embedTwitter(url) {
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
}

const EMBEDS_CONFIG = {
  'www.youtube.com': {
    type: 'youtube',
    embed: embedYoutube,
  },
  'video.tv.adobe.com': {
    type: 'adobe-tv',
    embed: getDefaultEmbed,
  },
  'www.instagram.com': {
    type: '',
    embed: embedInstagram,
  },
  'www.vimeo.com': {
    type: 'vimeo-player',
    embed: embedVimeo,
  },
  'player.vimeo.com': {
    type: 'vimeo-player',
    embed: embedVimeo,
  },
  'spark.adobe.com': {
    type: 'adobe-spark',
    embed: embedSpark,
  },
  'twitter.com': {
    type: 'twitter',
    embed: embedTwitter,
  },
};

function decorateBlockEmbeds($block) {
  $block.querySelectorAll('.embed.block a[href]').forEach(($a) => {
    const url = new URL($a.href.replace(/\/$/, ''));
    const config = EMBEDS_CONFIG[url.hostname];
    if (config) {
      const html = config.embed(url);
      $block.innerHTML = html;
      $block.classList = `block embed embed-${config.type}`;
    } else {
      $block.innerHTML = getDefaultEmbed(url);
      $block.classList = `block embed embed-${getServer(url)}`;
    }
  });
}

export default function decorate($block) {
  decorateBlockEmbeds($block);
}
