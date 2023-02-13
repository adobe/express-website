/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { readBlockConfig } from '../../scripts/scripts.js';
import { CCXQuickActionElement, ELEMENT_NAME, MOCK_ELEMENT_NAME } from './shared.js';

function createMockQuickAction() {
  const ele = document.createElement('div');
  ele.className = MOCK_ELEMENT_NAME;
  ele.innerHTML = '<video autoplay muted><source src="./media_10a5fc7550207834c815407ef40db97a13f1a977a.mp4" type="video/mp4"></video>'
  + '<div class="dropzone" style="display:none;"><div class="dropzone__bg" '
  + 'style="-webkit-mask-image: url(/express/icons/dash-square.svg)"></div>'
  + '<div class="dropzone__content">'
  + '<div class="dropzone__illustration">'
      + '<span class="dropzone__icon" style="background-image: var(--quick-action-dropzone-illustration-background-image, url(&quot;https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/remove-background/85fb3920e4277b8cb854.svg&quot;))"></span>'
      + '<h4><!---->Drag &amp; drop an image <br> or <span class="browse-to-upload">browse to upload. <span><!----></h4>'
      + '<p class="restrictions"> File must be .jpg and less than 17MB.</p>'
    + '<button class="upload-your-photo">'
        + 'Upload your photo'
    + '</button>'
  + '</div>'
  + '</div> <input id="mock-file-input" type="file" accept="image/jpeg,image/png">'
  + '</div>';
  return ele;
}

function hideVideoAndShowMock() {
  document.querySelector(`.${MOCK_ELEMENT_NAME} video`).style.display = 'none';
  document.querySelector(`.${MOCK_ELEMENT_NAME} .dropzone`).style.display = 'block';
  document.querySelector(`.${MOCK_ELEMENT_NAME}`).removeEventListener('mouseover', hideVideoAndShowMock);
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
  });
  ele.addEventListener('drop', (ev) => {
    ev.preventDefault();
    const file = ev.dataTransfer.files[0];
    window.qtHost.task.uploadImageFile(file);
  });
  ele.addEventListener('mouseover', hideVideoAndShowMock);
  document.querySelector(`.${MOCK_ELEMENT_NAME} video`).addEventListener('ended', (event) => {
    event.target.style.display = 'none';
    document.querySelector(`.${MOCK_ELEMENT_NAME} .dropzone`).style.display = 'block';
  });
}

window.customElements.define(ELEMENT_NAME, CCXQuickActionElement);

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.innerHTML = `<${ELEMENT_NAME} action="${config.action || 'remove-background'}"></${ELEMENT_NAME}>`;
  const mockQuickActionEle = createMockQuickAction();
  block.append(mockQuickActionEle);
  addListenersOnMockElements(mockQuickActionEle);
}
