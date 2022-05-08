/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console */

import { loadCSS, getMetadata, fetchExperimentConfig } from '../../express/scripts/scripts.js';

function createTesting() {
  if (getMetadata('testing')) {
    const div = document.createElement('div');
    div.className = 'hlx-testing hlx-badge';
    div.innerHTML = '<span title="This Page is part of an A/B Test run in Adobe Target">Testing</span>';
    return (div);
  }
  return '';
}

async function createExperiment() {
  const experiment = getMetadata('experiment');
  console.log('preview experiment', experiment);
  if (experiment) {
    const config = await fetchExperimentConfig(experiment);
    const div = document.createElement('div');
    div.className = 'hlx-experiment hlx-badge';
    div.innerHTML = `Experiment: ${config.id} <span class="hlx-open"></span>
      <div class="hlx-popup hlx-hidden">
        <h4>${config.testName}</h4>
        <div class="hlx-details></div>
        <div class="hlx-variants></div>
      </div>`;
    console.log(config.id);
    const popup = div.querySelector('.hlx-popup');
    div.addEventListener('click', () => {
      popup.classList.toggle('hlx-hidden');
    });
    return (div);
  }
  return '';
}

async function decoratePreviewMode() {
  console.log('decorating preview mode');
  loadCSS('/tools/preview/preview.css');
  const overlay = document.createElement('div');
  overlay.className = 'hlx-preview-overlay';
  overlay.append(createTesting());
  overlay.append(await createExperiment());
  document.body.append(overlay);
}

try {
  decoratePreviewMode();
} catch (e) {
  console.log(e);
}
