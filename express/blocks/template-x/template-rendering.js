/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-underscore-dangle */
import { createTag, getIconElement } from '../../scripts/scripts.js';

function rewordRemixCount(remixCount) {
  return remixCount > 1000 ? `${Math.floor(remixCount / 1000)}k` : remixCount;
}

function shortenTitle(title) {
  return title.length > 19 ? `${title.slice(0, 19)}...` : title;
}

function templateHasVideo(template) {
  return !!template.pages[0].rendition?.video?.thumbnail?.componentId
    && !!template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
}

function getTemplateTitle(template) {
  return template.title['i-default'];
}

function renderStillWrapper(template, props) {
  const stillWrapper = createTag('div', { class: 'still-wrapper' });

  const templateTitle = getTemplateTitle(template);
  const renditionLinkHref = template._links['http://ns.adobe.com/adobecloud/rel/rendition'].href;
  const imageThumbnailId = template.pages[0].rendition.image?.thumbnail.componentId;

  const thumbnailImageHref = renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&size=${props.renditionParams.size}&type=image/jpg&fragment=id=${imageThumbnailId}`,
  );

  const imgWrapper = createTag('div', { class: 'image-wrapper' });

  const img = createTag('img', {
    src: thumbnailImageHref,
    alt: templateTitle,
  });
  imgWrapper.insertAdjacentElement('beforeend', img);

  const remixCount = template.stats?.remixCount || 0;
  const isFree = template.licensingCategory === 'free';
  const creator = template.attribution?.creators?.filter((c) => c !== 'Adobe Express')?.[0]?.name || null;

  const remixSpan = createTag('span', { class: 'remix-cnt' });
  remixSpan.append(`${rewordRemixCount(remixCount)} views`);
  const freeTag = createTag('span', { class: 'free-tag' });
  const creatorDiv = createTag('div', { class: 'creator-span' });
  creatorDiv.append(creator || shortenTitle(templateTitle));

  imgWrapper.append(remixSpan);
  if (isFree) {
    freeTag.append('Free');
    imgWrapper.append(freeTag);
  } else {
    const premiumIcon = getIconElement('premium');
    imgWrapper.append(premiumIcon);
  }

  if (templateHasVideo(template)) {
    const videoIcon = getIconElement('tiktok');
    imgWrapper.append(videoIcon);
  }

  stillWrapper.append(imgWrapper);
  stillWrapper.append(creatorDiv);
  return stillWrapper;
}

function extractRenditionLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href;
}

function extractComponentLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
}

function extractVideoThumbnailId(page) {
  return page.rendition?.video?.thumbnail?.componentId;
}

function extractImageThumbnail(page) {
  return page.rendition.image?.thumbnail;
}

function getTemplateImageSrc(template, index) {
  const renditionLinkHref = extractRenditionLinkHref(template);
  const thumbnail = extractImageThumbnail(template.pages[index]);
  return renditionLinkHref.replace(
    '{&page,size,type,fragment}', `&size=${thumbnail.width}&type=image/jpg&fragment=id=${thumbnail.componentId}`,
  );
}

function getTemplateVideoSrc(template, index) {
  const componentLinkHref = extractComponentLinkHref(template);
  const videoThumbnailId = extractVideoThumbnailId(template.pages[index]);
  return componentLinkHref.replace(
    '{&revision,component_id}',
    `&revision=0&component_id=${videoThumbnailId}`,
  );
}

function renderShareIcon(branchUrl) {
  const shareIcon = getIconElement('plus');
  shareIcon.addEventListener('click', async () => {
    await navigator.clipboard.writeText(branchUrl);
  });
  return shareIcon;
}

function renderCTA(placeholders, branchUrl) {
  const btnTitle = placeholders['edit-this-template'] ?? 'Edit this template';
  const btnEl = createTag('a', {
    href: branchUrl,
    title: btnTitle,
    class: 'button accent small',
  });
  btnEl.textContent = btnTitle;
  return btnEl;
}

function renderMedia(template) {
  const templateTitle = getTemplateTitle(template);
  const pageIterator = {
    i: 0,
    next() {
      this.i = (this.i + 1) % template.pages.length;
      return this;
    },
    reset() {
      this.i = 0;
      return this;
    },
    getIndex() {
      return this.i;
    },
  };

  if (templateHasVideo(template)) {
    const video = createTag('video', {
      muted: true,
      playsinline: '',
      title: templateTitle,
      poster: getTemplateImageSrc(template, pageIterator.getIndex()),
    });
    const videoSource = createTag('source', {
      src: getTemplateVideoSrc(template, pageIterator.getIndex()),
      type: 'video/mp4',
    });
    video.append(videoSource);
    const playVideo = () => {
      video.poster = getTemplateImageSrc(template, pageIterator.getIndex());
      videoSource.src = getTemplateVideoSrc(template, pageIterator.getIndex());
      video.load();
      video.muted = true;
      video.play().catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') {
          // ignore
        } else {
          throw e;
        }
      });
    };
    const cleanupVideo = () => {
      video.pause();
      video.currentTime = 0;
      pageIterator.reset();
    };
    video.addEventListener('ended', () => {
      pageIterator.next();
      playVideo();
    });
    return { node: video, cleanup: cleanupVideo, hover: playVideo };
  } else {
    const img = createTag('img', { src: '', alt: templateTitle });
    let playImageIntervalId;
    const playImage = () => {
      img.src = getTemplateImageSrc(template, pageIterator.getIndex());
      playImageIntervalId = setInterval(() => {
        pageIterator.next();
        img.src = getTemplateImageSrc(template, pageIterator.getIndex());
      }, 2000);
    };
    const cleanupImage = () => {
      pageIterator.reset();
      clearInterval(playImageIntervalId);
    };
    return { node: img, cleanup: cleanupImage, hover: playImage };
  }
}

function renderMediaWrapper(template) {
  const mediaWrapper = createTag('div', { class: 'media-wrapper' });
  let renderedMedia = null;

  const enterCB = () => {
    // TODO: reduce memory with LRU cache or memoization with ttl
    if (!renderedMedia) {
      renderedMedia = renderMedia(template);
      mediaWrapper.append(renderedMedia.node);
    }
    renderedMedia.hover();
  };
  const leaveCB = () => {
    renderedMedia.cleanup();
  };

  mediaWrapper.append(renderShareIcon(template.customLinks.branchUrl));
  return { mediaWrapper, enterCB, leaveCB };
}

function renderHoverWrapper(template, placeholders) {
  const btnContainer = createTag('div', { class: 'button-container' });

  const { mediaWrapper, enterCB, leaveCB } = renderMediaWrapper(template);

  btnContainer.append(mediaWrapper);
  btnContainer.addEventListener('mouseenter', enterCB);
  btnContainer.addEventListener('mouseleave', leaveCB);

  const cta = renderCTA(placeholders, template.customLinks.branchUrl);
  btnContainer.append(cta);

  return btnContainer;
}

export default function renderTemplate(template, placeholders, props) {
  const tmpltEl = createTag('div');
  tmpltEl.append(renderStillWrapper(template, props));
  tmpltEl.append(renderHoverWrapper(template, placeholders));
  return tmpltEl;
}
