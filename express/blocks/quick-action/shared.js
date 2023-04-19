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
      navigate: (dest, data) => {
        if (dest.id === 'post-editor') {
          this.handleNavigateToPostEditor(data, data.autoDownloadInEditor);
        }
      },
      sendEditorStateToHost: (state) => {
        showQuickAction(true);
        if (state.isSampleImageUploaded) {
          return;
        }
        if (!state.editorLoading && state.exportEnabled) {
          const quickActionCompletionEvent = new Event('ccl-quick-action-complete');
          document.querySelector(ELEMENT_NAME).dispatchEvent(quickActionCompletionEvent);
          this.buttonContainer.style.display = 'block';
        } else {
          this.buttonContainer.style.display = 'none';
        }
      },
      // eslint-disable-next-line no-console
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
    const sharedScriptUrl = await fetchDependency('https://express.adobe.com/express-apps/quick-actions-api/host-entries/host-shared', 'host-shared');
    loadScript(sharedScriptUrl);

    // FIXME: remove hardcoded fallback once PR is merged to main
    const actionScriptUrl = await fetchDependency('https://express.adobe.com/express-apps/quick-actions-api', this.action);
    loadScript(actionScriptUrl);
  }

  disconnectedCallback() {
    if (this.buttonClickListener) {
      this.removeEventListener('click', this.buttonClickListener);
    }
  }

  attributeChangedCallback() {
    if (!this.isConnected || this.isLoading) {
      return;
    }
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
  }

  handleAction(action) {
    this.task.triggerExport(action);
  }

  // eslint-disable-next-line class-methods-use-this
  handleNavigateToPostEditor(data, autoDownload = false) {
    const host = 'https://project-marvel-theo-web-8569.fracture.adobeprojectm.com';
    const action = 'remove-background';
    const { repositoryId, transientToken } = data;
    const path = '/design/post/new';
    const params = new URLSearchParams();
    params.append('workflow', 'quicktask');
    params.append('r', 'qtImaging');
    params.append('qId', action);
    params.append('actionLocation', 'seo');
    params.append('autoDownload', autoDownload);
    params.append('repositoryId', repositoryId);
    if (transientToken) {
      params.append('transientToken', transientToken);
    }
    if (window.hlx.experiment && window.hlx.experiment.selectedVariant) {
      params.append('experience', window.hlx.experiment.selectedVariant);
    }
    const encodeUrl = `${host}/sp${path}?${params.toString()}`;
    window.location.replace(encodeUrl);
  }

  async render() {
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
