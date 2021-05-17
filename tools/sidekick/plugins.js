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
/* global window fetch */

// This file contains the spark-specific plugins for the sidekick.
(() => {
  const sk = window.hlx && window.hlx.sidekick ? window.hlx.sidekick : window.hlxSidekick;
  if (typeof sk !== 'object') return;

  // HLX3 --------------------------------------------------------------------------

  async function hlx3Publish(config, location, path) {
    if (!config.host
    || (config.byocdn && location.host === config.host)) {
      return null;
    }
    // resolve relative path with location.href
    const purgeURL = [
      'https://admin.hlx3.page',
      `/${config.owner}`,
      `/${config.repo}`,
      `/${config.ref}`,
      new URL(path, location.href).pathname,
      '?action=publish',
    ].join('');
    /* eslint-disable no-console */
    console.log(`hlx3 publishing ${purgeURL}`);
    const resp = await fetch(purgeURL, { method: 'POST' });
    /* eslint-enable no-console */
    return {
      ok: resp.ok,
      status: resp.status,
      path,
    };
  }

  // override publish button
  sk.add({
    override: true,
    id: 'publish',
    condition: (sidekick) => sidekick.isHelix() && sidekick.config.host
      && !(sidekick.config.byocdn && sidekick.location.host === sidekick.config.host),
    button: {
      action: async (evt) => {
        const { config, location } = sk;
        const path = location.pathname;
        sk.showModal(`Publishing ${path}`, true);
        let urls = [path];
        // dependencies
        if (Array.isArray(window.hlx.dependencies)) {
          urls = urls.concat(window.hlx.dependencies);
        }
        // hlx2 publishing
        await Promise.all(urls.map((url) => sk.publish(url)));
        // hlx3 publishing
        await Promise.all(urls.map((url) => hlx3Publish(config, location, url)));

        if (config.host) {
          sk.showModal('Please wait …', true);
          // fetch and redirect to production
          const prodURL = `https://${config.outerHost}${path}`;
          await fetch(prodURL, { cache: 'reload', mode: 'no-cors' });
          // eslint-disable-next-line no-console
          console.log(`redirecting to ${prodURL}`);
          if (evt.metaKey || evt.which === 2) {
            window.open(prodURL);
            sk.hideModal();
          } else {
            window.location.href = prodURL;
          }
        } else {
          sk.notify('Successfully published');
        }
      },
    },
  });

  // METADATA --------------------------------------------------------------------

  sk.add({
    id: 'metadata',
    condition: (s) => s.isEditor() && s.location.href.includes('metadata.xlsx'),
    button: {
      text: 'Meta Data Inspector',
      action: () => {
        const { config } = sk;
        window.open(`https://${config.host || config.innerHost}/tools/metadata/inspector.html`, 'hlx-sidekick-spark-metadata-inspector');
      },
    },
  });

  // TEMPLATES --------------------------------------------------------------------

  sk.add({
    id: 'templates',
    condition: (s) => s.isEditor() && (s.location.pathname.includes('/:w:/') || s.location.href.includes('doc.aspx?')),
    button: {
      text: 'Templates',
      action: () => {
        const { config } = sk;
        window.open(`https://${config.outerHost || config.innerHost}/tools/templates/picker.html`, 'hlx-sidekick-spark-templates');
      },
    },
  });
})();
