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

import { loadScript } from '../../../../scripts/scripts.js';

export default function decorate(block) {
  window.qtId = 'remove-background';
  window.isWebViewHost = false;
  window.qtWebViewScheme = 'false';
  window.qtColorTheme = '';
  // eslint-disable-next-line no-underscore-dangle
  window._prjtmrvlsetup = { quickActionRegistryUrl: 'https://express.adobe.com/express-apps/quick-actions-api' };
  // eslint-disable-next-line no-underscore-dangle
  window._sparkImsOnReadyCalled = true;
  block.innerHTML = '<div id="quick-task-container"></div>';
  loadScript('https://express.adobe.com/static/platform-shell/standalone-host-app-e38b7076.js');
  // eslint-disable-next-line no-console
  console.log('challenger 1');
}
