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
/* global Typekit */
const KIT_IDS = {
  jp: 'dvg6awq',
  kr: 'qjs5sfm',
  cn: 'puu3xkp',
  tw: 'jay0ecd',
};

export default function loadTypekit(locale) {
  function load(d) {
    const config = {
      kitId: KIT_IDS[locale],
      scriptTimeout: 3000,
      async: true,
    };
    const h = d.documentElement;
    const t = setTimeout(() => {
      h.className = `${h.className.replace(/\bwf-loading\b/g, '')} wf-inactive`;
    }, config.scriptTimeout);
    const tk = d.createElement('script');
    let f = false;
    const s = d.getElementsByTagName('script')[0];
    let a;
    h.className += ' wf-loading';
    tk.src = `https://use.typekit.net/${config.kitId}.js`;
    tk.async = true;
    function onReady() {
      a = this.readyState;
      if (f) return;
      if (a && a !== 'complete' && a !== 'loaded') return;
      f = true;
      clearTimeout(t);
      try {
        Typekit.load(config);
      } catch (e) {
        //
      }
    }
    tk.onload = onReady;
    tk.onreadystatechange = onReady;
    s.parentNode.insertBefore(tk, s);
  }
  load(document);
}
