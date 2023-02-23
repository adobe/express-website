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
import { loadScript } from '../../scripts/scripts.js';

export const ELEMENT_NAME = 'ccl-quick-action';

function createButton(label) {
  const btn = document.createElement('a');
  btn.className = 'button';
  btn.href = '';
  btn.innerText = label;
  return btn;
}

function createTag(label) {
  const tag = document.createElement('div');
  tag.className = 'quick-action-tag';
  tag.innerHTML = '<img class="icon icon-checkmark" src="/express/icons/checkmark.svg" alt="checkmark">';
  const tagContainer = document.createElement('div');
  tagContainer.className = 'quick-action-tag-container';
  tagContainer.innerText = label;
  tagContainer.prepend(tag);
  return tagContainer;
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
  window.qtHost.task.qtEle.hideWorkSpace = !display;
  if (display) {
    const showQuickActionEvent = new Event('ccl-show-quick-action');
    document.querySelector(ELEMENT_NAME).dispatchEvent(showQuickActionEvent);
  }
}

export class CCXQuickActionElement extends HTMLElement {
  static get elementName() { return ''; }

  static get observedAttributes() { return ['action']; }

  constructor() {
    super();
    this.action = this.attributes.getNamedItem('action').value;
    this.downloadLabel = this.attributes.getNamedItem('downloadLabel') ? this.attributes.getNamedItem('downloadLabel').value : '';
    this.editLabel = this.attributes.getNamedItem('editLabel') ? this.attributes.getNamedItem('editLabel').value : '';
    this.isLoading = true;

    this.taskContext = {
      close() { console.log('[CCLQT CB]', 'close'); },
      done(options) { console.log('[CCLQT CB]', 'done', options); },
      navigate: (dest, data, file) => {
        console.log('[CCLQT CB]', 'navigate', dest, data, file);
        if (dest.id === 'post-editor') {
          this.handleNavigateToPostEditor(data, data.autoDownloadInEditor);
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
        if (!state.editorLoading && state.exportEnabled) {
          const quickActionCompletionEvent = new Event('ccl-quick-action-complete');
          document.querySelector(ELEMENT_NAME).dispatchEvent(quickActionCompletionEvent);
        }
        this.buttonContainer.style.display = state.exportEnabled ? 'flex' : 'none';
      },
      sendErrorToHost(err) { console.error('[CCLQT CB]', 'error', err); },
      navigationData: {
        config: {
          'should-use-cloud-storage': true,
          'preview-only': true,
          'should-download-in-editor': true,
          'hide-work-space': true,
        },
      },
      hostType: 'standalone',
      browserInfo: { isMobile: false },
    };
    window.qtHost = {
      qtLoaded: async (QuickTask) => {
        console.debug('loaded:');
        this.task = new QuickTask(this, this.taskContext);
        window.qtHost.task = this.task;
        this.isLoading = false;
        await this.render();
        this.attachListeners();
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async connectedCallback() {
    // FIXME: remove hardcoded fallback once PR is merged to main
    const sharedScriptUrl = 'https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/host-shared/entry-9007a3ba.js'
    || await fetchDependency('https://express.adobe.com/express-apps/quick-actions-api/host-entries/host-shared', 'host-shared');
    loadScript(sharedScriptUrl);

    // FIXME: remove hardcoded fallback once PR is merged to main
    const actionScriptUrl = 'https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/remove-background/entry-7fbe32d1.js'
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
    const loginUrl = '/sp/login?destination=';
    const params = new URLSearchParams();
    params.append('workflow', 'quicktask');
    params.append('r', 'qtImaging');
    params.append('qId', action);
    params.append('actionLocation', 'seo');
    params.append('autoDownload', autoDownload);
    params.append('repositoryId', repositoryId);
    params.append('transientToken', transientToken);
    const encodeUrl = encodeURIComponent(`${host}${path}?${params.toString()}`);
    const url = `${host}${loginUrl}${encodeUrl}`;
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
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'button-container';
    this.buttonContainer.style.display = 'none';
    if (this.downloadLabel && !this.btnDl) {
      this.btnDl = createButton(this.downloadLabel || 'Download');
      this.btnDl.classList.add('large');
      this.btnDl.dataset.action = 'Download';
      this.buttonContainer.append(this.btnDl);
    }
    if (this.editLabel && !this.btnEdit) {
      this.btnEdit = createButton(this.editLabel);
      this.btnEdit.classList.add('large');
      this.btnEdit.dataset.action = 'Editor';
      this.buttonContainer.append(this.btnEdit);
    }
    if (!this.freeUseTag) {
      this.freeUseTag = createTag('Free use forever');
      this.buttonContainer.append(this.freeUseTag);
    }
    if (!this.noCreditCardTag) {
      this.noCreditCardTag = createTag('No credit card required');
      this.buttonContainer.append(this.noCreditCardTag);
    }
    this.append(this.buttonContainer);
    if (this.task) {
      await this.task.render();
    }
  }
}
