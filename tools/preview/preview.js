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
/* eslint-disable no-console */

import {
  loadCSS,
  toClassName,
  getMetadata,
  fetchExperimentConfig,
} from '../../express/scripts/scripts.js';

/**
 * Create Badge if a Page is enlisted in an Adobe Target test
 * @return {Object} returns a badge or empty string
 */
function createTesting() {
  if (getMetadata('testing')) {
    const div = document.createElement('div');
    div.className = 'hlx-testing hlx-badge';
    div.innerHTML = '<span title="This Page is part of an A/B Test run in Adobe Target">Testing On</span>';
    return (div);
  }
  return '';
}

/**
 * Create Badge if a Page is enlisted in a Helix Experiment
 * @return {Object} returns a badge or empty string
 */
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

      const experimentURL = new URL(window.location.href);
      // this will retain other query params such as ?rum=on
      experimentURL.searchParams.set('experiment', `${experiment}/${variantName}`);

      div.className = 'hlx-variant';
      div.innerHTML = `<div>
      <h5>${variantName}</h5>
        <p>${variant.label}</p>
        <p>${percentage}%</p>
        <p class="performance"></p>
      </div>
      <div class="hlx-button"><a href="${experimentURL.href}">Simulate</a></div>`;
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

    const variantMap = {};

    div.addEventListener('click', () => {
      popup.classList.toggle('hlx-hidden');

      // the query is a bit slow, so I'm only fetching the results when the popup is opened
      const resultsURL = new URL('https://helix-pages.anywhere.run/helix-services/run-query@v2/rum-experiments');
      resultsURL.searchParams.set('experiment', experiment);
      if (window.hlx.sidekickConfig?.host) {
        // restrict results to the production host, this also reduces query cost
        resultsURL.searchParams.set('domain', window.hlx.sidekickConfig.host);
      }
      fetch(resultsURL.href).then(async (response) => {
        const { results } = await response.json();
        results.forEach((result) => {
          const nf = {
            format: (num) => `${Math.floor(num)}%`,
          };
          const variant = variantMap[result.variant];
          if (variant) {
            const performance = variant.querySelector('.performance');
            performance.innerHTML = `
              <span>click rate: ${nf.format(100 * Number.parseFloat(result.variant_conversion_rate))}</span>
              <span>vs. ${nf.format(100 * Number.parseFloat(result.control_conversion_rate))}</span>
              <span>significance: ${nf.format(100 * Number.parseFloat(result.p_value))}</span> <!-- everything below 95% is not good enough for the social sciences to be considered significant --->
            `;
          }
        });
      });
    });

    const variants = div.querySelector('.hlx-variants');
    config.variantNames.forEach((vname) => {
      const variantDiv = createVariant(vname);
      variants.append(variantDiv);
      variantMap[vname] = variantDiv;
    });
    return (div);
  }
  return '';
}

/**
 * Decorates Preview mode badges and overlays
 * @return {Object} returns a badge or empty string
 */
async function decoratePreviewMode() {
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
