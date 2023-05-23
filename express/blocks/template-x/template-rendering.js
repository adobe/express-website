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

function extractVideoThumbnailId(page) {
  return page.rendition?.video?.thumbnail?.componentId;
}

function extractImageThumbnail(page) {
  return page.rendition.image?.thumbnail;
}

function getWidthHeightRatio(page) {
  const preview = page.rendition.image?.preview;
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

function getImageCustomWidthSrc(renditionLinkHref, page, image) {
  return renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&size=${widthToSize(getWidthHeightRatio(page), 151)}&type=image/jpg&fragment=id=${image.componentId}`,
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
function renderRotatingMedias(wrapper,
  pages,
  { templateTitle, renditionLinkHref, componentLinkHref }) {
  const pageIterator = getPageIterator(pages);
  let imgTimeoutId;

  const constructVideo = () => {
    let src = '';
    if (containsVideo(pages)) {
      src = getVideoSrc(componentLinkHref, pageIterator.current());
      const video = createTag('video', {
        muted: true,
        playsinline: '',
        title: templateTitle,
        poster: getImageThumbnailSrc(renditionLinkHref, pageIterator.current()),
        class: 'unloaded hidden',
      });
      const videoSource = createTag('source', {
        src,
        type: 'video/mp4',
      });

      video.append(videoSource);

      return video;
    }

    return undefined;
  };

  const constructImg = () => createTag('img', {
    src: '',
    alt: templateTitle,
    class: 'hidden',
  });

  const img = constructImg();
  if (img) wrapper.prepend(img);

  const video = constructVideo();
  if (video) wrapper.prepend(video);

  const dispatchImgEndEvent = () => {
    img.dispatchEvent(new CustomEvent('imgended', { detail: this }));
  };

  const playImage = () => {
    img.classList.remove('hidden');
    img.src = getImageThumbnailSrc(renditionLinkHref, pageIterator.current());

    imgTimeoutId = setTimeout(dispatchImgEndEvent, 2000);
  };

  const playVideo = () => {
    if (video) {
      const videoSource = video.querySelector('source');
      video.classList.remove('hidden');
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
      renderedMedia = renderRotatingMedias(mediaWrapper, template.pages, templateInfo);
      mediaWrapper.append(renderShareWrapper(branchUrl));
    }
    renderedMedia.hover();
  };
  const leaveHandler = () => {
    if (renderedMedia) renderedMedia.cleanup();
  };

  return { mediaWrapper, enterHandler, leaveHandler };
}

function updateURLParameter(url, param, paramVal) {
  let newAdditionalURL = '';
  let tempArray = url.split('?');
  const baseURL = tempArray[0];
  const additionalURL = tempArray[1];
  let temp = '';
  if (additionalURL) {
    tempArray = additionalURL.split('&');
    for (let i = 0; i < tempArray.length; i += 1) {
      if (tempArray[i].split('=')[0] !== param) {
        newAdditionalURL += temp + tempArray[i];
        temp = '&';
      }
    }
  }

  const rowText = `${temp}${param}=${paramVal}`;
  return `${baseURL}?${newAdditionalURL}${rowText}`;
}

function loadBetterAssetInBackground(img, page) {
  const size = widthToSize(getWidthHeightRatio(page), 400);

  const updateImgRes = () => {
    img.src = updateURLParameter(img.src, 'size', size);
    img.removeEventListener('load', updateImgRes);
  };

  img.addEventListener('load', updateImgRes);
}

function renderHoverWrapper(template, placeholders, props) {
  const btnContainer = createTag('div', { class: 'button-container' });

  const { mediaWrapper, enterHandler, leaveHandler } = renderMediaWrapper(template, props);

  btnContainer.append(mediaWrapper);
  btnContainer.addEventListener('mouseenter', enterHandler);
  btnContainer.addEventListener('mouseleave', leaveHandler);

  const cta = renderCTA(placeholders, template.customLinks.branchUrl);
  btnContainer.append(cta);

  return btnContainer;
}

function renderStillWrapper(template) {
  const stillWrapper = createTag('div', { class: 'still-wrapper' });
  const firstPage = template.pages[0];

  const templateTitle = getTemplateTitle(template);
  const renditionLinkHref = template._links['http://ns.adobe.com/adobecloud/rel/rendition'].href;

  const thumbnailImageHref = getImageCustomWidthSrc(renditionLinkHref,
    template.pages[0], firstPage.rendition.image?.thumbnail);

  const imgWrapper = createTag('div', { class: 'image-wrapper' });

  const img = createTag('img', {
    src: thumbnailImageHref,
    alt: templateTitle,
  });
  imgWrapper.append(img);

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

  let videoIcon = '';
  if (containsVideo(template.pages) && template.pages.length === 1) {
    videoIcon = getIconElement('video-badge');
  }

  if (!containsVideo(template.pages) && template.pages.length > 1) {
    videoIcon = getIconElement('multipage-static-badge');
  }

  if (containsVideo(template.pages) && template.pages.length > 1) {
    videoIcon = getIconElement('multipage-video-badge');
  }

  if (videoIcon) {
    videoIcon.classList.add('media-type-icon');
    imgWrapper.append(videoIcon);
  }

  loadBetterAssetInBackground(img, firstPage);

  stillWrapper.append(imgWrapper);
  // TODO: API not ready for creator yet
  // stillWrapper.append(creatorDiv);
  return stillWrapper;
}

export default function renderTemplate(template, placeholders, props) {
  const tmpltEl = createTag('div');
  tmpltEl.append(renderStillWrapper(template, props));
  tmpltEl.append(renderHoverWrapper(template, placeholders, props));

  return tmpltEl;
}
