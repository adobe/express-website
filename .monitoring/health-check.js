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
/* global $http $util */
/*
 * Synthetics API Test Documentation:
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/write-synthetics-api-tests
 */
const assert = require('assert');

// $http -> https://github.com/request/request
$http.get({
  url: '$$$URL$$$',
},
// callback
(err, response) => {
  if (err) {
    $util.insights.set('error', err);
    console.error(err);
  }
  assert.equal(response.statusCode, 200, `Expected a 200 OK response, got ${response.statusCode}`);
});
