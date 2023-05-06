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

function shortenTitle(title) {
  return title.length > 19 ? `${title.slice(0, 19)}...` : title;
}

function containsVideo(page) {
  return !!page?.rendition?.video?.thumbnail?.componentId;
}

function isVideoFirst(template) {
  return containsVideo(template.pages[0]);
}

function getTemplateTitle(template) {
  return template.title['i-default'];
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

function extractImagePreview(page) {
  return page.rendition.image?.preview;
}

function getWidthHeightRatio(page) {
  const preview = extractImagePreview(page);
  return preview.width / preview.height;
}

// API takes size param as the longest side
function widthToSize(widthHeightRatio, targetWidth) {
  if (widthHeightRatio >= 1) {
    return targetWidth;
  }
  return Math.round(targetWidth / widthHeightRatio);
}

function getImageThumbnailSrc(renditionLinkHref, page) {
  const thumbnail = extractImageThumbnail(page);
  return renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&size=${widthToSize(getWidthHeightRatio(page), thumbnail.width)}&type=image/jpg&fragment=id=${thumbnail.componentId}`,
  );
}

function getImageCustomWidthSrc(renditionLinkHref, page, width) {
  const thumbnail = extractImageThumbnail(page);
  return renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&size=${widthToSize(getWidthHeightRatio(page), width)}&type=image/jpg&fragment=id=${thumbnail.componentId}`,
  );
}

function getVideoSrc(componentLinkHref, page) {
  const videoThumbnailId = extractVideoThumbnailId(page);
  return componentLinkHref.replace(
    '{&revision,component_id}',
    `&revision=0&component_id=${videoThumbnailId}`,
  );
}

function renderShareWrapper(branchUrl) {
  const text = 'Copied to clipboard';
  const wrapper = createTag('div', { class: 'share-icon-wrapper' });
  const shareIcon = getIconElement('plus');
  const tooltip = createTag('div', {
    class: 'shared-tooltip',
    'aria-label': text,
    role: 'tooltip',
    tabindex: '-1',
  });
  let timeoutId = null;
  shareIcon.addEventListener('click', async () => {
    await navigator.clipboard.writeText(branchUrl);
    tooltip.classList.add('display-tooltip');
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      tooltip.classList.remove('display-tooltip');
    }, 2500);
  });

  const checkmarkIcon = getIconElement('checkmark');
  tooltip.append(checkmarkIcon);
  tooltip.append(text);
  wrapper.append(shareIcon);
  wrapper.append(tooltip);
  return wrapper;
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

function getPageIterator(pages) {
  return {
    i: 0,
    next() {
      this.i = (this.i + 1) % pages.length;
    },
    reset() {
      this.i = 0;
    },
    current() {
      return pages[this.i];
    },
  };
}

function renderRotatingVideos(pages, { renditionLinkHref, componentLinkHref, templateTitle }) {
  const pageIterator = getPageIterator(pages);
  const video = createTag('video', {
    muted: true,
    playsinline: '',
    title: templateTitle,
    poster: getImageThumbnailSrc(renditionLinkHref, pageIterator.current()),
  });
  const videoSource = createTag('source', {
    src: getVideoSrc(componentLinkHref, pageIterator.current()),
    type: 'video/mp4',
  });
  video.append(videoSource);
  const playVideo = () => {
    video.poster = getImageThumbnailSrc(renditionLinkHref, pageIterator.current());
    videoSource.src = getVideoSrc(componentLinkHref, pageIterator.current());
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
  const cleanup = () => {
    video.pause();
    video.currentTime = 0;
    pageIterator.reset();
  };
  video.addEventListener('ended', () => {
    pageIterator.next();
    playVideo();
  });
  return { node: video, cleanup, hover: playVideo };
}

function renderRotatingImages(pages, { templateTitle, renditionLinkHref }) {
  const pageIterator = getPageIterator(pages);
  const img = createTag('img', { src: '', alt: templateTitle });
  let playImageIntervalId;
  const playImage = () => {
    img.src = getImageThumbnailSrc(renditionLinkHref, pageIterator.current());
    playImageIntervalId = setInterval(() => {
      pageIterator.next();
      img.src = getImageThumbnailSrc(renditionLinkHref, pageIterator.current());
    }, 2000);
  };
  const cleanup = () => {
    pageIterator.reset();
    clearInterval(playImageIntervalId);
  };
  return { node: img, cleanup, hover: playImage };
}

function renderMediaWrapper(template) {
  const mediaWrapper = createTag('div', { class: 'media-wrapper' });

  // TODO: reduce memory with LRU cache or memoization with ttl
  let renderedMedia = null;

  const templateTitle = getTemplateTitle(template);
  const renditionLinkHref = extractRenditionLinkHref(template);
  const componentLinkHref = extractComponentLinkHref(template);
  const { branchUrl } = template.customLinks;
  const templateInfo = {
    templateTitle,
    branchUrl,
    renditionLinkHref,
    componentLinkHref,
  };

  const enterHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!renderedMedia) {
      // don't let image interrupt flow of videos
      renderedMedia = isVideoFirst(template)
        ? renderRotatingVideos(
          template.pages.filter((page) => containsVideo(page)), templateInfo,
        )
        : renderRotatingImages(template.pages, templateInfo);
      mediaWrapper.append(renderedMedia.node);
      mediaWrapper.append(renderShareWrapper(branchUrl));
    }
    renderedMedia.hover();
  };
  const leaveHandler = () => {
    renderedMedia.cleanup();
  };

  return { mediaWrapper, enterHandler, leaveHandler };
}

function renderHoverWrapper(template, placeholders) {
  const btnContainer = createTag('div', { class: 'button-container' });

  const { mediaWrapper, enterHandler, leaveHandler } = renderMediaWrapper(template);

  btnContainer.append(mediaWrapper);
  btnContainer.addEventListener('mouseenter', enterHandler);
  btnContainer.addEventListener('mouseleave', leaveHandler);

  const cta = renderCTA(placeholders, template.customLinks.branchUrl);
  btnContainer.append(cta);

  return btnContainer;
}

function renderStillWrapper(template, props) {
  const stillWrapper = createTag('div', { class: 'still-wrapper' });

  const templateTitle = getTemplateTitle(template);
  const renditionLinkHref = template._links['http://ns.adobe.com/adobecloud/rel/rendition'].href;

  const thumbnailImageHref = getImageCustomWidthSrc(renditionLinkHref,
    template.pages[0], props.renditionParams.size);

  const imgWrapper = createTag('div', { class: 'image-wrapper' });

  const img = createTag('img', {
    src: thumbnailImageHref,
    alt: templateTitle,
  });
  imgWrapper.insertAdjacentElement('beforeend', img);

  const isFree = template.licensingCategory === 'free';
  const creator = template.attribution?.creators?.filter((c) => c.name && c.name !== 'Adobe Express')?.[0]?.name || null;

  const freeTag = createTag('span', { class: 'free-tag' });
  const creatorDiv = createTag('div', { class: 'creator-span' });
  creatorDiv.append(creator || shortenTitle(templateTitle));

  if (isFree) {
    freeTag.append('Free');
    imgWrapper.append(freeTag);
  } else {
    const premiumIcon = getIconElement('premium');
    imgWrapper.append(premiumIcon);
  }

  if (isVideoFirst(template)) {
    const videoIcon = getIconElement('tiktok');
    imgWrapper.append(videoIcon);
  }

  stillWrapper.append(imgWrapper);
  // TODO: API not ready for creator yet
  // stillWrapper.append(creatorDiv);
  return stillWrapper;
}

export default function renderTemplate(template, placeholders, props) {
  const tmpltEl = createTag('div');
  tmpltEl.append(renderStillWrapper(template, props));
  tmpltEl.append(renderHoverWrapper(template, placeholders));
  return tmpltEl;
}
