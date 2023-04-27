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

function dynamicTypekit(kitId, d = document) {
  const config = { kitId, scriptTimeout: 3000, async: true };
  /* c8 ignore next 1 */
  // eslint-disable-next-line
  const h = d.documentElement; const t = setTimeout(() => { h.className = `${h.className.replace(/\bwf-loading\b/g, '')} wf-inactive`; }, config.scriptTimeout); const tk = d.createElement('script'); let f = false; const s = d.getElementsByTagName('script')[0]; let a; h.className += ' wf-loading'; tk.src = `https://use.typekit.net/${config.kitId}.js`; tk.async = true; tk.onload = tk.onreadystatechange = function () { a = this.readyState; if (f || a && a != 'complete' && a != 'loaded') return; f = true; clearTimeout(t); try { Typekit.load(config); } catch (e) {} }; s.parentNode.insertBefore(tk, s);
  return h;
}

/**
 * Set the fonts of the page.
 *
 * Determines if the font should be a classic CSS integration
 * or if it should be a JS integration (dynamic subsetting) for CJK.
 *
 * @param {Object} locale the locale details
 */
export default function loadFonts(tk, loadCSS) {
  const tkSplit = tk.split('.');
  if (tkSplit[1] === 'css') {
    return new Promise((resolve) => {
      loadCSS(`https://use.typekit.net/${tk}`, resolve);
    });
  }
  return dynamicTypekit(tk);
}
