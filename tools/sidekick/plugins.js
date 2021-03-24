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
/* global window */

// This file contains the spark-specific plugins for the sidekick.
(() => {
  const sk = window.hlx && window.hlx.sidekick ? window.hlx.sidekick : window.hlxSidekick;
  if (typeof sk !== 'object') return;

  // TEMPLATES --------------------------------------------------------------------

  sk.add({
    id: 'templates',
    condition: (s) => s.isEditor() && (s.location.pathname.includes('/:w:/') || s.location.href.includes('doc.aspx?')),
    button: {
      text: 'Templates',
      action: () => {
        const { config } = sk;
        window.open(`https://${config.host || config.innerHost}/tools/templates/picker.html`, 'hlx-sidekick-spark-templates');
      },
    },
  });

  // RELOAD temp fix

  sk.add({
    id: 'reload',
    override: true,
    condition: (sidekick) => sidekick.location.host === sidekick.config.innerHost || sidekick.location.hostname === 'localhost',
    button: {
      action: () => {
        const { location } = sk;
        const path = location.pathname;
        sk.showModal('Please wait …', true);
        // const stashInner = sk.config.innerHost;
        const stashPurge = sk.config.purgeHost;
        // sk.config.innerHost = `master--${sk.config.innerHost}`;
        sk.config.purgeHost = sk.config.purgeHost.replace('main--', 'master--');
        // console.log(`custom reload ${sk.config.innerHost} ${sk.config.purgeHost}`);
        sk
          .publish(path, true)
          .then((resp) => {
            if (resp && resp.ok) {
              window.location.reload();
            } else {
              sk.showModal([
                `Failed to reload ${path}. Please try again later.`,
                JSON.stringify(resp),
              ], true, 0);
            }
            // sk.config.innerHost = stashInner;
            sk.config.purgeHost = stashPurge;
          });
      },
    },
  });
})();
