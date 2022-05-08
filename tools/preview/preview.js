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

import {
  loadCSS,
  toClassName,
  getMetadata,
  fetchExperimentConfig,
} from '../../express/scripts/scripts.js';

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
    const createVariant = (variantName) => {
      const variant = config.variants[variantName];
      const split = +variant.percentageSplit
        || 1 - config.variantNames.reduce((c, vn) => c + +config.variants[vn].percentageSplit, 0);
      const percentage = Math.round(split * 10000) / 100;
      const div = document.createElement('div');
      div.className = 'hlx-variant';
      div.innerHTML = `<div><h5>${variantName}</h5>
      <p>${variant.label}</p>
      <p>${percentage}%</p></div>
      <div class="hlx-button"><a href="${window.location.pathname}?experiment=${experiment}/${variantName}">Simulate</a></div>`;
      return (div);
    };

    const div = document.createElement('div');
    div.className = 'hlx-experiment hlx-badge';
    div.classList.add(`hlx-experiment-status-${toClassName(config.status)}`);
    div.innerHTML = `Experiment: ${config.id} <span class="hlx-open"></span>
      <div class="hlx-popup hlx-hidden">
        <h4>${config.testName}</h4>
        <div class="hlx-details">${config.status}, ${config.audience}, Blocks: ${config.blocks.join(',')}</div>
        <div class="hlx-variants"></div>
      </div>`;
    console.log(config.id);
    const popup = div.querySelector('.hlx-popup');
    div.addEventListener('click', () => {
      popup.classList.toggle('hlx-hidden');
    });

    const variants = div.querySelector('.hlx-variants');
    config.variantNames.forEach((vname) => {
      variants.append(createVariant(vname));
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
