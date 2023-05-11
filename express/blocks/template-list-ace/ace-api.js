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
/* eslint-disable camelcase */

import { mockId, mockData } from './mocks.js';

const useMock = false;

const base = 'https://api.xstudio.adobe.com/templates';

function uuidv4() {
  // return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
  //   (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  // );
  return crypto.randomUUID();
}

AbortSignal.timeout ??= function timeout(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
};

function buildOptionalParams({
  category,
  subcategory,
  sync,
  force,
  fetchExisting,
}) {
  const optionalParams = [];
  if (category) {
    optionalParams.push(`category=${category}`);
  }
  if (subcategory) {
    optionalParams.push(`subcategory=${subcategory}`);
  }
  if (sync) {
    optionalParams.push(`sync=${sync}`);
  }
  if (force) {
    optionalParams.push(`force=${force}`);
  }
  if (fetchExisting) {
    optionalParams.push(`fetchExisting=${fetchExisting}`);
  }
  return optionalParams.join('&');
}

export async function requestGeneration({
  num_results = 4,
  query,
  locale = 'en-us',
  category = 'poster',
  subcategory = null,
  sync = false,
  force = false,
  fetchExisting = false,
}) {
  console.log('requested');
  if (useMock) return { jobId: mockId, status: 'in-progress' };
  const queryParam = `query=${query}`;
  const numParam = `num_results=${num_results}`;
  const localeParam = `locale=${locale}`;
  const optionalParams = `${buildOptionalParams({
    category,
    subcategory,
    sync,
    force,
    fetchExisting,
  })}`;
  const requestId = uuidv4();

  const url = encodeURI(`${base}?${queryParam}&${numParam}&${localeParam}&${optionalParams}`);

  const res = await fetch(url, {
    headers: {
      'x-request-id': requestId,
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Error requesting generation: ${res.status} ${res.statusText}`);
  }
  const { jobId, status } = await res.json();
  return { jobId, status };
}

export async function monitorGeneration(jobId) {
  console.log('monitoring');
  if (useMock) return mockData;
  const url = `${base}/monitor?jobId=${jobId}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });
  console.log({ monitorRes: res });
  if (!res.ok) {
    throw new Error(`Error monitoring progress: ${res.status} ${res.statusText}`);
  }
  const { status, results, reason } = await res.json();
  return { status, results, reason };
}

export const MONITOR_STATUS = Object.freeze({
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export const FEEDBACK_CATEGORIES = Object.freeze({
  THUMBS_UP: 'thumbs_up',
  THUMBS_DOWN: 'thumbs_down',
  REPORT_ABUSE: 'report_abuse',
});

export async function postFeedback(id, category, notes) {
  if (!Object.values(FEEDBACK_CATEGORIES).includes(category)) {
    throw new Error(`Invalid category: ${category}`);
  }
  if (useMock) return { result: 'Feedback recorded successfully' };
  const url = `${base}/feedback`;
  const body = JSON.stringify({ id, category, notes });
  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(5000),
  });
  return response.json();
}
