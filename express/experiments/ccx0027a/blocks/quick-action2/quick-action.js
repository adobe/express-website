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

import {
  readBlockConfig, transformLinkToAnimation, lazyLoadLottiePlayer, getLottie,
} from '../../../../scripts/scripts.js';
import { CCXQuickActionElement, ELEMENT_NAME } from '../../../../blocks/quick-action/shared.js';

const REMOVE_BACKGROUND_ELEMENT = 'cclqt-remove-background';
const MOCK_ELEMENT_NAME = `mock-${ELEMENT_NAME}`;
const MOCK_ELEMENT_CONTAINER = `${MOCK_ELEMENT_NAME}-container`;
const BLOCK_NAME = '.quick-action';
const QUICKACTION_HEIGHT_IN_PX = '475px';
const QUICK_TASK_CLOSE_BUTTON = 'quick-task-close-button';
const QUICK_ACTION_COMPLETED = 'quick-action-completed';
const LOTTIE_ICONS = {
  'arrow-up': '/express/icons/arrow-up-lottie.json',
};

function createLegalCopy() {
  const ele = document.createElement('div');
  ele.className = 'quick-action-legal-copy';
  ele.innerHTML = 'By uploading your image or video, you are agreeing to the Adobe <a href="https://adobe.com/go/terms_en">Terms of Use</a>'
    + ' and <a href="https://adobe.com/go/privacy_policy_en">Privacy Policy</a>.';
  return ele;
}

function createMockQuickAction() {
  const container = document.createElement('div');
  container.className = MOCK_ELEMENT_CONTAINER;
  const ele = document.createElement('div');
  ele.className = MOCK_ELEMENT_NAME;
  ele.innerHTML = '<div class="dropzone"><div class="dropzone__bg" '
  + 'style="-webkit-mask-image: url(/express/icons/dash-rectangle.svg)"></div>'
  + '<div class="dropzone__content">'
  + '<div class="dropzone__illustration">'
      + '<h4><!---->Drag &amp; drop an image <br> or <span class="browse-to-upload">browse to upload. <span><!----></h4>'
    + '<a class="button xlarge upload-your-photo" href="javascript:void(0);"> Upload your photo </a>'
  + '</div>'
  + '<div class="quick-action-tag-container"><div class="quick-action-tag"><img class="icon icon-checkmark" src="/express/icons/checkmark.svg" alt="checkmark"></div>Free use forever</div>'
  + '<div class="quick-action-tag-container"><div class="quick-action-tag"><img class="icon icon-checkmark" src="/express/icons/checkmark.svg" alt="checkmark"></div>No credit card required</div>'
  + '</div> <input id="mock-file-input" type="file" accept="image/jpeg,image/png">'
  + '</div>';
  container.append(ele);
  container.append(createLegalCopy());
  return container;
}

function addLottieIcons(array, lottieIcon) {
  const lottie = getLottie(lottieIcon, LOTTIE_ICONS[lottieIcon]);
  array.forEach((el) => {
    el.innerHTML = `${lottie}${el.innerHTML}`;
  });
  lazyLoadLottiePlayer();
}

function createOverlays() {
  if (document.querySelector('.quick-action-complete-overlay-container') !== null) {
    return;
  }
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'quick-action-complete-overlay-container';
  const overlay = document.createElement('div');
  overlay.className = 'quick-action-complete-overlay';
  const downloadCopy = document.querySelector(`${ELEMENT_NAME} [data-action='Download']`).cloneNode(true);
  downloadCopy.classList.add('dark');
  const editCopy = document.querySelector(`${ELEMENT_NAME} [data-action='Editor']`).cloneNode(true);
  const freeTagCopy = document.querySelectorAll(`${ELEMENT_NAME} .quick-action-tag-container`)[0].cloneNode(true);
  const noCreditCardTagCopy = document.querySelectorAll(`${ELEMENT_NAME} .quick-action-tag-container`)[1].cloneNode(true);
  [downloadCopy, editCopy, freeTagCopy, noCreditCardTagCopy].forEach((btn) => {
    btn.classList.add('overlay-item');
    overlay.appendChild(btn);
  });
  overlayContainer.appendChild(overlay);
  const closeButton = document.createElement('button');
  closeButton.className = QUICK_TASK_CLOSE_BUTTON;
  closeButton.title = 'Restart';
  document.querySelector(`${ELEMENT_NAME}`).appendChild(overlayContainer);
  document.querySelector(`${ELEMENT_NAME}`).appendChild(closeButton);
}

function renderMoreActions() {
  const afterAction = document.querySelector(`${BLOCK_NAME} .after-action`);
  const afterActionSubCopy = afterAction.firstElementChild;
  const moreActions = afterActionSubCopy ? afterActionSubCopy.nextElementSibling : '';
  if (moreActions) {
    const quickAction = document.querySelector(`${ELEMENT_NAME}`);
    const removeBackgroundEle = document.querySelector(REMOVE_BACKGROUND_ELEMENT);
    quickAction.insertBefore(moreActions, removeBackgroundEle.nextElementSibling);
    moreActions.classList.add('more-quick-actions-container');
  }
}

function addListenersOnMockElements(ele) {
  ele.addEventListener('click', () => {
    document.querySelector('.mock-ccl-quick-action #mock-file-input').click();
  });
  document.querySelector(`.${MOCK_ELEMENT_NAME} #mock-file-input`).addEventListener('change', (event) => {
    const input = event.target;
    const file = input.files[0];
    window.qtHost.task.uploadImageFile(file);
  });
  ele.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    document.querySelector(`.${MOCK_ELEMENT_NAME}`).classList.add('dragged');
  });
  ele.addEventListener('dragleave', (ev) => {
    ev.preventDefault();
    document.querySelector(`.${MOCK_ELEMENT_NAME}`).classList.remove('dragged');
  });
  ele.addEventListener('drop', (ev) => {
    ev.preventDefault();
    const file = ev.dataTransfer.files[0];
    window.qtHost.task.uploadImageFile(file);
    document.querySelector(`.${MOCK_ELEMENT_NAME}`).classList.remove('dragged');
  });
  document.querySelector('.before-action video').addEventListener('ended', (event) => {
    const video = event.target;
    video.style.display = 'none';
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    const img = document.createElement('img');
    img.setAttribute('src', video.poster);
    source.setAttribute('srcset', video.poster);
    picture.appendChild(source);
    picture.appendChild(img);
    video.parentNode.appendChild(picture);
  });
  document.querySelector(ELEMENT_NAME).addEventListener('ccl-show-quick-action', () => {
    document.getElementsByClassName(MOCK_ELEMENT_CONTAINER)[0].parentNode.style.display = 'none';
    document.querySelector(ELEMENT_NAME).style.height = QUICKACTION_HEIGHT_IN_PX;
  });
  document.querySelector(ELEMENT_NAME).addEventListener('ccl-quick-action-complete', () => {
    document.querySelector(`${BLOCK_NAME} .before-action`).style.display = 'none';
    document.querySelector(`${BLOCK_NAME} .after-action`).style.display = 'block';
    document.querySelector(`${ELEMENT_NAME}`).classList.add(QUICK_ACTION_COMPLETED);
    createOverlays();
    renderMoreActions();
  });
  document.querySelector(`${ELEMENT_NAME}`).addEventListener('click', (event) => {
    if (event.target.matches(` .${QUICK_TASK_CLOSE_BUTTON}`)) {
      window.location.reload();
    }
  });
}

window.customElements.define(ELEMENT_NAME, CCXQuickActionElement);

export default async function decorate(block) {
  const config = readBlockConfig(block);
  // show first row and hide second row
  let quickActionMedia = '';
  const beforeAction = block.firstElementChild;
  if (beforeAction && beforeAction.tagName === 'DIV') {
    beforeAction.className = 'before-action';
    const afterAction = beforeAction.nextElementSibling;
    if (afterAction && afterAction.tagName === 'DIV') {
      afterAction.className = 'after-action';
      afterAction.style.display = 'none';
    }
    const video = block.querySelector('a[href*=".mp4"]');
    if (video) {
      quickActionMedia = video.parentNode;
      quickActionMedia.className = 'quick-action-media';
      const $video = transformLinkToAnimation(video);
      $video.loop = false;
    }
  }
  const range = document.createRange();
  const cclQuickAction = range.createContextualFragment(`<${ELEMENT_NAME} action="${config.action || 'remove-background'}" downloadLabel = "Download" editLabel = "Edit in Adobe Express for free"></${ELEMENT_NAME}>`);
  block.append(cclQuickAction);
  const mockQuickActionEle = createMockQuickAction();
  if (quickActionMedia) {
    quickActionMedia.parentNode.append(mockQuickActionEle);
  } else {
    block.append(mockQuickActionEle);
  }
  addLottieIcons(document.querySelectorAll('a.button.upload-your-photo'), 'arrow-up');
  addListenersOnMockElements(mockQuickActionEle);
  // trigger the quick-action-rendered event
  const quickActionRenderedEvent = new Event('ccl-quick-action-rendered', { bubbles: true });
  document.querySelector(ELEMENT_NAME).dispatchEvent(quickActionRenderedEvent);
}
