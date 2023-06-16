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

import {
  fetchPlaceholders,
  getMetadata,
  titleCase,
  createTag,
} from './scripts.js';
import { fetchLegacyAllTemplatesMetadata } from './all-templates-metadata.js';

async function replaceDefaultPlaceholders(template) {
  template.innerHTML = template.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', getMetadata('create-link') || '/');

  if (getMetadata('tasks') === '') {
    const placeholders = await fetchPlaceholders();
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
  } else {
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', getMetadata('create-text') || '');
  }
}

// for backwards compatibility
// TODO: remove this func after all content is updated
await (async function updateLegacyContent() {
  if (getMetadata('sheet-powered') === 'Y') {
    // not legacy
    return;
  }
  const legacyAllTemplatesMetadata = await fetchLegacyAllTemplatesMetadata();
  const data = legacyAllTemplatesMetadata.find((p) => p.path === window.location.pathname);
  if (!data) return;
  const heroAnimation = document.querySelector('.hero-animation.wide');
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');

  const head = document.querySelector('head');
  if (data.shortTitle) {
    const shortTitle = head.querySelector('meta[name="short-title"]');
    if (!shortTitle) head.append(createTag('meta', { name: 'short-title', content: data.shortTitle }));
  }
  if (data.ckgID) {
    const ckgid = head.querySelector('meta[name="ckgid"]');
    if (!ckgid) head.append(createTag('meta', { name: 'ckgid', content: data.ckgID }));
  }

  if (heroAnimation) {
    if (data.heroAnimationTitle) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', data.heroAnimationTitle);
    }

    if (data.heroAnimationText) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template text', data.heroAnimationText);
    }
  }

  if (templateList) {
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-title', data.shortTitle || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-tasks', data.templateTasks || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-topics', data.templateTopics || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-locale', data.templateLocale || 'en');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-premium', data.templatePremium || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-animated', data.templateAnimated || '');
    templateList.innerHTML = templateList.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', data.createLink || '/');
    templateList.innerHTML = templateList.innerHTML.replaceAll('default-format', data.placeholderFormat || '');

    if (data.templateTasks === '') {
      const placeholders = await fetchPlaceholders();
      templateList.innerHTML = templateList.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
    } else {
      templateList.innerHTML = templateList.innerHTML.replaceAll('default-create-link-text', data.createText || '');
    }
  }
}());

await (async function updateMetadataForTemplates() {
  if (!['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
    return;
  }
  // TODO: update metadata with Search Param
  const head = document.querySelector('head');
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (head) {
    const placeholders = await fetchPlaceholders();
    const categories = JSON.parse(placeholders['task-categories']);
    if (categories) {
      const TasksPair = Object.entries(categories).find((cat) => cat[1] === params.tasks);
      const translatedTasks = TasksPair ? TasksPair[0].toLowerCase() : params.tasks;
      head.innerHTML = head.innerHTML
        .replaceAll('{{queryTasks}}', params.tasks || '')
        .replaceAll('{{QueryTasks}}', titleCase(params.tasks || ''))
        .replaceAll('{{translatedTasks}}', translatedTasks || '')
        .replaceAll('{{TranslatedTasks}}', titleCase(translatedTasks || ''))
        .replaceAll('{{placeholderRatio}}', params.phformat || '')
        .replaceAll('{{QueryTopics}}', titleCase(params.topics || ''))
        .replaceAll('{{queryTopics}}', params.topics || '')
        .replaceAll('{{query}}', params.q || '');
    }
  }
}());

(function autoUpdatePage() {
  const wl = ['{{heading_placeholder}}', '{{type}}', '{{quantity}}'];
  // FIXME: deprecate wl
  const main = document.querySelector('main');
  if (main) {
    const allReplaceableBlades = [...main.innerHTML.matchAll(/{{(.*?)}}/g)];

    if (allReplaceableBlades.length > 0) {
      allReplaceableBlades.forEach((regex) => {
        if (!wl.includes(regex[0].toLowerCase())) {
          main.innerHTML = main.innerHTML.replaceAll(regex[0], getMetadata(regex[1]) || '');
        }
      });
    }
  }
}());

(async function updateNonBladeContent() {
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');
  const templateX = document.querySelector('.template-x');
  const browseByCat = document.querySelector('.browse-by-category');

  if (templateList) {
    await replaceDefaultPlaceholders(templateList);
  }

  if (templateX) {
    await replaceDefaultPlaceholders(templateX);
  }

  if (browseByCat && !['yes', 'true', 'on', 'Y'].includes(getMetadata('show-browse-by-category'))) {
    browseByCat.remove();
  }
}());
