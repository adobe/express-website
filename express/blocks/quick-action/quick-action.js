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

function createButton(label) {
  const btn = document.createElement('a');
  btn.className = 'button';
  btn.href = '';
  btn.innerText = label;
  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    window.qtHost.task.triggerExport(btn.dataset.action);
  });
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

function navigateToPostEditor(data, autoDownload = false) {
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
  window.location.href = url;
}

function downloadImage(fileData) {
  const a = document.createElement('a');
  a.download = fileData.fileName;
  a.href = fileData.base64URL;
  a.click();
}

export default async function decorate(block) {
  const blockConfig = readBlockConfig(block);
  block.innerHTML = '';

  const btnEdit = createButton('Customize');
  btnEdit.dataset.action = 'Editor';
  btnEdit.style.display = 'none';
  block.append(btnEdit);

  const btnDl = createButton('Download');
  btnDl.classList.add('reverse');
  btnDl.dataset.action = 'Download';
  btnDl.style.display = 'none';
  block.append(btnDl);

  // FIXME: remove hardcoded fallback once PR is merged to main
  const sharedScriptUrl = 'https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/host-shared/entry-f377a22e.js'
    || await fetchDependency('https://express.adobe.com/express-apps/quick-actions-api/host-entries/host-shared', 'host-shared');

  // FIXME: remove hardcoded fallback once PR is merged to main
  const actionScriptUrl = 'https://custom.adobeprojectm.com/express-apps/ccl-quick-tasks/pr-905/remove-background/entry-00e7f443.js'
    || await fetchDependency('https://express.adobe.com/express-apps/quick-actions-api', 'remove-background');

  window.qtHost = {
    async qtLoaded(QuickTask) {
      const task = new QuickTask(block, {
        close() { console.log('[CCLQT CB]', 'close'); },
        done(options) { console.log('[CCLQT CB]', 'done', options); },
        navigate(dest, data, file) {
          console.log('[CCLQT CB]', 'navigate', dest, data, file);
          if (dest.id === 'post-editor') {
            navigateToPostEditor(data, false);
          } else {
            downloadImage(file);
          }
        },
        sendEditorStateToHost(state) {
          console.log('[CCLQT CB]', 'editor-state', state);
          [btnEdit, btnDl].forEach((btn) => {
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
      });
      window.qtHost.task = task;
      await task.render();
      const taskId = task.qtEle.qtId;
      task.qtEle.addEventListener(`${taskId}__navigate-to-task`, (ev) => {
        console.log('[CCLQT EVT]', 'navigate-to-task', ev.detail);
      });
      task.qtEle.addEventListener(`${taskId}__navigate-to-host`, (ev) => {
        console.log('[CCLQT EVT]', 'navigate-to-host', ev.detail);
      });
      task.qtEle.addEventListener(`${taskId}__navigate-to-done-modal`, (ev) => {
        console.log('[CCLQT EVT]', 'navigate-to-done-modal', ev.detail);
      });
      task.qtEle.addEventListener(`${taskId}__downloadable-image`, (ev) => {
        console.log('[CCLQT EVT]', 'downloadable-image', ev.detail);
      });
      task.qtEle.addEventListener(`${taskId}__close-full-screen-modal`, (ev) => {
        console.log('[CCLQT EVT]', 'close-full-screen-modal', ev.detail);
      });
      task.qtEle.addEventListener(`${taskId}__send-error-to-host`, (ev) => {
        console.log('[CCLQT EVT]', 'send-error-to-host', ev.detail);
      });
      task.qtEle.addEventListener(`${taskId}__authenticate-from-host`, (ev) => {
        console.log('[CCLQT EVT]', 'authenticate-from-host', ev.detail);
      });
    },
  };
  loadScript(sharedScriptUrl);
  loadScript(actionScriptUrl);
}
