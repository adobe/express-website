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

function containsVideo(pages) {
  return pages.some((page) => !!page?.rendition?.video?.thumbnail?.componentId);
}

function isVideo(iterator) {
  return iterator.current().rendition?.video?.thumbnail?.componentId;
}

function getTemplateTitle(template) {
  return template['dc:title']['i-default'];
}

function extractRenditionLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href;
}

function extractComponentLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
}

function extractImageThumbnail(page) {
  return page.rendition.image?.thumbnail;
}

function getImageThumbnailSrc(renditionLinkHref, componentLinkHref, page) {
  const thumbnail = extractImageThumbnail(page);
  const {
    mediaType,
    componentId,
    width,
    height,
    hzRevision,
  } = thumbnail;
  if (mediaType === 'image/webp') {
    // webp only supported by componentLink
    return componentLinkHref.replace(
      '{&revision,component_id}',
      `&revision=${hzRevision || 0}&component_id=${componentId}`,
    );
  }

  return renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&size=${Math.max(width, height)}&type=${mediaType}&fragment=id=${componentId}`,
  );
}

const videoMetadataType = 'application/vnd.adobe.ccv.videometadata';

async function getVideoUrls(renditionLinkHref, componentLinkHref, page) {
  const videoThumbnail = page.rendition?.video?.thumbnail;
  const { componentId } = videoThumbnail;
  const preLink = renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&type=${videoMetadataType}&fragment=id=${componentId}`,
  );
  const backupPosterSrc = getImageThumbnailSrc(renditionLinkHref, componentLinkHref, page);
  try {
    const response = await fetch(preLink);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const { renditionsStatus: { state }, posterframe, renditions } = await response.json();
    if (state !== 'COMPLETED') throw new Error('Video not ready');

    const mp4Rendition = renditions.find((r) => r.videoContainer === 'MP4');
    if (!mp4Rendition?.url) throw new Error('No MP4 rendition found');

    return { src: mp4Rendition.url, poster: posterframe?.url || backupPosterSrc };
  } catch (err) {
    // use componentLink as backup
    return {
      src: componentLinkHref.replace(
        '{&revision,component_id}',
        `&revision=0&component_id=${componentId}`,
      ),
      poster: backupPosterSrc,
    };
  }
}

function renderShareWrapper(branchUrl, placeholders) {
  const text = placeholders['tag-copied'] ?? 'Copied to clipboard';
  const wrapper = createTag('div', { class: 'share-icon-wrapper' });
  const shareIcon = getIconElement('share-arrow');
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

    const rect = tooltip.getBoundingClientRect();
    const tooltipRightEdgePos = rect.left + rect.width;
    if (tooltipRightEdgePos > window.innerWidth) {
      tooltip.classList.add('flipped');
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      tooltip.classList.remove('display-tooltip');
      tooltip.classList.remove('flipped');
    }, 2500);
  });

  const checkmarkIcon = getIconElement('checkmark-green');
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
    all() {
      return pages;
    },
  };
}
async function renderRotatingMedias(wrapper,
  pages,
  { templateTitle, renditionLinkHref, componentLinkHref }) {
  const pageIterator = getPageIterator(pages);
  let imgTimeoutId;

  const constructVideo = async () => {
    if (!containsVideo(pages)) return null;
    const { src, poster } = await getVideoUrls(
      renditionLinkHref,
      componentLinkHref,
      pageIterator.current(),
    );
    const video = createTag('video', {
      muted: true,
      playsinline: '',
      title: templateTitle,
      poster,
      class: 'unloaded hidden',
    });
    const videoSource = createTag('source', {
      src,
      type: 'video/mp4',
    });

    video.append(videoSource);

    return video;
  };

  const constructImg = () => createTag('img', {
    src: '',
    alt: templateTitle,
    class: 'hidden',
  });

  const img = constructImg();
  if (img) wrapper.prepend(img);

  const video = await constructVideo();
  if (video) wrapper.prepend(video);

  const dispatchImgEndEvent = () => {
    img.dispatchEvent(new CustomEvent('imgended', { detail: this }));
  };

  const playImage = () => {
    img.classList.remove('hidden');
    img.src = getImageThumbnailSrc(renditionLinkHref, componentLinkHref, pageIterator.current());

    imgTimeoutId = setTimeout(dispatchImgEndEvent, 2000);
  };

  const playVideo = async () => {
    if (video) {
      const videoSource = video.querySelector('source');
      video.classList.remove('hidden');
      const { src, poster } = await getVideoUrls(
        renditionLinkHref,
        componentLinkHref,
        pageIterator.current(),
      );
      video.poster = poster;
      videoSource.src = src;
      video.load();
      video.muted = true;
      video.play().catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') {
          // ignore
        } else {
          throw e;
        }
      });
    }
  };

  const playMedia = () => {
    if (isVideo(pageIterator)) {
      if (img) img.classList.add('hidden');
      playVideo();
    } else {
      if (video) video.classList.add('hidden');
      playImage();
    }
  };

  const cleanup = () => {
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    if (imgTimeoutId) {
      clearTimeout(imgTimeoutId);
    }

    pageIterator.reset();
  };

  if (video) {
    video.addEventListener('ended', () => {
      if (pageIterator.all().length > 1) {
        pageIterator.next();
        playMedia();
      }
    });
  }

  if (img) {
    img.addEventListener('imgended', () => {
      if (pageIterator.all().length > 1) {
        pageIterator.next();
        playMedia();
      }
    });
  }

  return { cleanup, hover: playMedia };
}

function renderMediaWrapper(template, placeholders) {
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

  const enterHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!renderedMedia) {
      renderedMedia = await renderRotatingMedias(mediaWrapper, template.pages, templateInfo);
      mediaWrapper.append(renderShareWrapper(branchUrl, placeholders));
    }
    renderedMedia.hover();
  };
  const leaveHandler = () => {
    if (renderedMedia) renderedMedia.cleanup();
  };

  return { mediaWrapper, enterHandler, leaveHandler };
}

function renderHoverWrapper(template, placeholders) {
  const btnContainer = createTag('div', { class: 'button-container' });

  const { mediaWrapper, enterHandler, leaveHandler } = renderMediaWrapper(template, placeholders);

  btnContainer.append(mediaWrapper);
  btnContainer.addEventListener('mouseenter', enterHandler);
  btnContainer.addEventListener('mouseleave', leaveHandler);

  const cta = renderCTA(placeholders, template.customLinks.branchUrl);
  btnContainer.append(cta);

  return btnContainer;
}

function getStillWrapperIcons(template, placeholders) {
  let planIcon = null;
  if (template.licensingCategory === 'free') {
    planIcon = createTag('span', { class: 'free-tag' });
    planIcon.append(placeholders.free ?? 'Free');
  } else {
    planIcon = getIconElement('premium');
  }
  let videoIcon = '';
  if (!containsVideo(template.pages) && template.pages.length > 1) {
    videoIcon = getIconElement('multipage-static-badge');
  }

  if (containsVideo(template.pages) && template.pages.length === 1) {
    videoIcon = getIconElement('video-badge');
  }

  if (containsVideo(template.pages) && template.pages.length > 1) {
    videoIcon = getIconElement('multipage-video-badge');
  }
  if (videoIcon) videoIcon.classList.add('media-type-icon');
  return { planIcon, videoIcon };
}

function renderStillWrapper(template, placeholders) {
  const stillWrapper = createTag('div', { class: 'still-wrapper' });

  const templateTitle = getTemplateTitle(template);
  const renditionLinkHref = extractRenditionLinkHref(template);
  const componentLinkHref = extractComponentLinkHref(template);

  const thumbnailImageHref = getImageThumbnailSrc(
    renditionLinkHref,
    componentLinkHref,
    template.pages[0],
  );

  const imgWrapper = createTag('div', { class: 'image-wrapper' });

  const img = createTag('img', {
    src: thumbnailImageHref,
    alt: templateTitle,
  });
  imgWrapper.append(img);

  const { planIcon, videoIcon } = getStillWrapperIcons(template, placeholders);
  img.onload = (e) => {
    if (e.eventPhase >= Event.AT_TARGET) {
      imgWrapper.append(planIcon);
      imgWrapper.append(videoIcon);
    }
  };

  stillWrapper.append(imgWrapper);
  return stillWrapper;
}

export default function renderTemplate(template, placeholders) {
  const tmpltEl = createTag('div');
  tmpltEl.append(renderStillWrapper(template, placeholders));
  tmpltEl.append(renderHoverWrapper(template, placeholders));

  return tmpltEl;
}
