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

import { loadScript, readBlockConfig } from '../../scripts/scripts.js';

const ELEMENT_NAME = 'ccl-quick-action';
const MOCK_ELEMENT_NAME = `mock-${ELEMENT_NAME}`;

function createButton(label) {
  const btn = document.createElement('a');
  btn.className = 'button';
  btn.href = '';
  btn.innerText = label;
  return btn;
}

async function fetchDependency(url, id) {
  const usp = new URLSearchParams(window.location.search);
  let dependencyUrl = usp.get(id);
  if (!dependencyUrl) {
    const response = await fetch(url);
    const json = await response.json();
    dependencyUrl = json.find((api) => api.id === id).entry;
  }
  return dependencyUrl;
}

function showQuickAction(display) {
  const quickActionEle = document.getElementsByTagName(ELEMENT_NAME);
  if (display) {
    document.getElementsByClassName(MOCK_ELEMENT_NAME)[0].style.display = 'none';
  }
  quickActionEle[0].style.display = display ? 'block' : 'none';
}

function createMockQuickAction() {
  const ele = document.createElement('div');
  ele.className = MOCK_ELEMENT_NAME;
  ele.innerHTML = '<div class="dropzone" ><div class="dropzone__bg" '
  + 'style="-webkit-mask-image: url(https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/remove-background/0109f683d747753d3f6b.svg)"></div>'
  + '<div class="dropzone__content">'
  + '<div class="dropzone__illustration">'
      + '<span class="dropzone__icon" style="background-image: var(--quick-action-dropzone-illustration-background-image, url(&quot;https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/remove-background/85fb3920e4277b8cb854.svg&quot;))"></span>'
      + '<h4><!---->Drag &amp; drop an image <br> or <span class="browse-to-upload">browse to upload. <span><!----></h4>'
      + '<p class="restrictions"> File must be .jpg and less than 17MB.</p>'
    + '<button class="upload-your-photo">'
        + 'Upload your photo'
    + '</button>'
  + '</div>'
  + '</div> </div>';
  return ele;
}

function addListenersOnMockElements(ele) {
  ele.addEventListener('click', () => {
    // trigger click on the main ccl action
    document.querySelector('cclqt-remove-background').shadowRoot.querySelector('cclqt-image-upload').shadowRoot.querySelector('button').click();
  });
  ele.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    showQuickAction(true);
  });
}

class CCXQuickActionElement extends HTMLElement {
  static get elementName() { return ''; }

  static get observedAttributes() { return ['action']; }

  constructor() {
    super();
    this.action = this.attributes.getNamedItem('action').value;
    this.isLoading = true;

    this.taskContext = {
      close() { console.log('[CCLQT CB]', 'close'); },
      done(options) { console.log('[CCLQT CB]', 'done', options); },
      navigate: (dest, data, file) => {
        console.log('[CCLQT CB]', 'navigate', dest, data, file);
        if (dest.id === 'post-editor') {
          this.handleNavigateToPostEditor(data, false);
        } else {
          this.handleDownloadImage(file);
        }
      },
      sendEditorStateToHost: (state) => {
        showQuickAction(true);
        console.log('[CCLQT CB]', 'editor-state', state);
        if (state.isSampleImageUploaded) {
          // TODO: show upload image button
          return;
        }
        [this.btnEdit, this.btnDl].forEach((btn) => {
          btn.style.display = state.exportEnabled ? 'inline-block' : 'none';
        });
      },
      sendErrorToHost(err) { console.error('[CCLQT CB]', 'error', err); },
      navigationData: {
        config: {
          'should-use-cloud-storage': true,
          'preview-only': true,
        },
      },
      hostType: 'standalone',
      browserInfo: { isMobile: false },
    };
    window.qtHost = {
      qtLoaded: async (QuickTask) => {
        console.debug('loaded:');
        this.task = new QuickTask(this, this.taskContext);
        this.isLoading = false;
        await this.render();
        this.attachListeners();
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async connectedCallback() {
    // FIXME: remove hardcoded fallback once PR is merged to main
    const sharedScriptUrl = 'https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/host-shared/entry-f377a22e.js'
      || await fetchDependency('https://express.adobe.com/express-apps/quick-actions-api/host-entries/host-shared', 'host-shared');
    loadScript(sharedScriptUrl);

    // FIXME: remove hardcoded fallback once PR is merged to main
    const actionScriptUrl = 'https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/remove-background/entry-641bf078.js'
      || await fetchDependency('https://express.adobe.com/express-apps/quick-actions-api', this.action);
    loadScript(actionScriptUrl);
  }

  disconnectedCallback() {
    console.debug('disconnected:');
    if (this.buttonClickListener) {
      this.removeEventListener('click', this.buttonClickListener);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isConnected || this.isLoading) {
      return;
    }
    console.debug('attr:', name, oldValue, newValue, this);
    this.render();
  }

  attachListeners() {
    this.buttonClickListener = (ev) => {
      if (!ev.target.matches('.button[data-action]')) {
        return;
      }

      ev.preventDefault();
      this.handleAction(ev.target.dataset.action);
    };
    this.addEventListener('click', this.buttonClickListener);

    const taskId = this.task.qtEle.qtId;
    this.task.qtEle.addEventListener(`${taskId}__navigate-to-task`, (ev) => {
      console.log('[CCLQT EVT]', 'navigate-to-task', ev.detail);
    });
    this.task.qtEle.addEventListener(`${taskId}__navigate-to-host`, (ev) => {
      console.log('[CCLQT EVT]', 'navigate-to-host', ev.detail);
    });
    this.task.qtEle.addEventListener(`${taskId}__navigate-to-done-modal`, (ev) => {
      console.log('[CCLQT EVT]', 'navigate-to-done-modal', ev.detail);
    });
    this.task.qtEle.addEventListener(`${taskId}__downloadable-image`, (ev) => {
      console.log('[CCLQT EVT]', 'downloadable-image', ev.detail);
    });
    this.task.qtEle.addEventListener(`${taskId}__close-full-screen-modal`, (ev) => {
      console.log('[CCLQT EVT]', 'close-full-screen-modal', ev.detail);
    });
    this.task.qtEle.addEventListener(`${taskId}__send-error-to-host`, (ev) => {
      console.log('[CCLQT EVT]', 'send-error-to-host', ev.detail);
    });
    this.task.qtEle.addEventListener(`${taskId}__authenticate-from-host`, (ev) => {
      console.log('[CCLQT EVT]', 'authenticate-from-host', ev.detail);
    });
  }

  handleAction(action) {
    this.task.triggerExport(action);
  }

  // eslint-disable-next-line class-methods-use-this
  handleNavigateToPostEditor(data, autoDownload = false) {
    const host = 'https://project-marvel-theo-web-8513.fracture.adobeprojectm.com';
    const action = 'remove-background';
    const { repositoryId, transientToken } = data;
    const path = '/sp/design/post/new';
    const params = new URLSearchParams();
    params.append('workflow', 'quicktask');
    params.append('r', 'qtImaging');
    params.append('qId', action);
    params.append('actionLocation', 'seo');
    params.append('autoDownload', autoDownload);
    params.append('repositoryId', repositoryId);
    params.append('transientToken', transientToken);
    const url = `${host}${path}?${params.toString()}`;
    // FIXME: verify if this is the right URL
    window.location.replace(url);
  }

  // eslint-disable-next-line class-methods-use-this
  handleDownloadImage(fileData) {
    const a = document.createElement('a');
    a.download = fileData.fileName;
    a.href = fileData.base64URL;
    a.click();
  }

  async render() {
    console.debug('render:');
    if (!this.btnEdit) {
      this.btnEdit = createButton('Customize');
      this.btnEdit.dataset.action = 'Editor';
      this.btnEdit.style.display = 'none';
      this.append(this.btnEdit);
    }

    if (!this.btnDl) {
      this.btnDl = createButton('Download');
      this.btnDl.classList.add('reverse');
      this.btnDl.dataset.action = 'Download';
      this.btnDl.style.display = 'none';
      this.append(this.btnDl);
    }

    if (this.task) {
      await this.task.render();
    }
  }
}
window.customElements.define(ELEMENT_NAME, CCXQuickActionElement);

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.innerHTML = `<${ELEMENT_NAME} action="${config.action || 'remove-background'}"></${ELEMENT_NAME}>`;
  showQuickAction(false);
  const mockQuickActionEle = createMockQuickAction();
  block.append(mockQuickActionEle);
  addListenersOnMockElements(mockQuickActionEle);
}
