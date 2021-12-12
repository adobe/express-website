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

// This file contains the project-specific configuration for the sidekick.
(() => {
  window.hlx.initSidekick({
    project: 'CCX',
    outerHost: 'express-website--adobe.hlx.live',
    host: 'www.adobe.com',
    byocdn: true,
    hlx3: true,
    pushDownSelector: '#feds-header',
    plugins: [
      // METADATA ---------------------------------------------------------------------
      {
        id: 'metadata',
        condition: (s) => s.isEditor() && s.location.href.includes('metadata.xlsx'),
        button: {
          text: 'Meta Data Inspector',
          action: (_, s) => {
            const { config } = s;
            window.open(`https://${config.innerHost}/tools/metadata/inspector.html`, 'hlx-sidekick-spark-metadata-inspector');
          },
        },
      },
      // TEMPLATES --------------------------------------------------------------------
      {
        id: 'templates',
        condition: (s) => s.isEditor()
          && (s.location.pathname.includes('/:w:/') || s.location.href.includes('doc.aspx?')),
        button: {
          text: 'Templates',
          action: (_, s) => {
            const { config } = s;
            window.open(`https://${config.innerHost}/tools/templates/picker.html`, 'hlx-sidekick-spark-templates');
          },
        },
      },
    ],
  });
})();
