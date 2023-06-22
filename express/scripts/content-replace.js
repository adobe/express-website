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
import fetchAllTemplatesMetadata from './all-templates-metadata.js';

async function replaceDefaultPlaceholders(template) {
  template.innerHTML = template.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', getMetadata('create-link') || '/');

  if (getMetadata('tasks') === '') {
    const placeholders = await fetchPlaceholders();
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
  } else {
    template.innerHTML = template.innerHTML.replaceAll('default-create-link-text', getMetadata('create-text') || '');
  }
}

async function getReplacementsFromSearch() {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  if (!params.tasks && !params.phformat) {
    return null;
  }
  const placeholders = await fetchPlaceholders();
  const categories = JSON.parse(placeholders['task-categories']);
  if (!categories) {
    return null;
  }
  const TasksPair = Object.entries(categories).find((cat) => cat[1] === params.tasks);
  const sanitizedTasks = params.tasks === "''" ? '' : params.tasks;
  const sanitizedTopics = params.topics === "''" ? '' : params.topics;
  const sanitizedQuery = params.q === "''" ? '' : params.q;
  const translatedTasks = TasksPair ? TasksPair[0].toLowerCase() : params.tasks;
  return {
    '{{queryTasks}}': sanitizedTasks || '',
    '{{QueryTasks}}': titleCase(sanitizedTasks || ''),
    '{{translatedTasks}}': translatedTasks || '',
    '{{TranslatedTasks}}': titleCase(translatedTasks || ''),
    '{{placeholderRatio}}': params.phformat || '',
    '{{QueryTopics}}': titleCase(sanitizedTopics || ''),
    '{{queryTopics}}': sanitizedTopics || '',
    '{{query}}': sanitizedQuery || '',
  };
}

const bladeRegex = new RegExp('{{.+}}', 'g');
async function replaceBladesInStr(str, replacements) {
  if (!replacements) return str;
  return str.replaceAll(bladeRegex, (match) => {
    if (match in replacements) {
      return replacements[match];
    }
    return match;
  });
}

// for backwards compatibility
// TODO: remove this func after all content is updated
// legacy json -> metadata
await (async function updateLegacyContent() {
  const searchMarquee = document.querySelector('.search-marquee');
  if (searchMarquee) {
    // not legacy
    return;
  }
  const legacyAllTemplatesMetadata = await fetchAllTemplatesMetadata();
  const data = legacyAllTemplatesMetadata.find((p) => p.url === window.location.pathname);
  if (!data) return;
  if (['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
    const replacements = await getReplacementsFromSearch();
    if (!replacements) return;
    for (const key of Object.keys(data)) {
      data[key] = replaceBladesInStr(data[key], replacements);
    }
  }

  const heroAnimation = document.querySelector('.hero-animation.wide');
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');

  const head = document.querySelector('head');
  Object.keys(data).forEach((metadataKey) => {
    const existingMetadataTag = head.querySelector(`meta[name=${metadataKey}]`);
    if (existingMetadataTag) {
      existingMetadataTag.setAttribute('content', data[metadataKey]);
    } else {
      head.append(createTag('meta', { name: `${metadataKey}`, content: data[metadataKey] }));
    }
  });

  if (heroAnimation) {
    if (data.heroAnimationTitle) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', data.heroAnimationTitle);
    }

    if (data.heroAnimationText) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template text', data.heroAnimationText);
    }
  }

  if (templateList) {
    const regex = /default-\w+/g;
    const replacements = {
      'default-title': data.shortTitle || '',
      'default-tasks': data.templateTasks || '',
      'default-topics': data.templateTopics || '',
      'default-locale': data.templateLocale || 'en',
      'default-premium': data.templatePremium || '',
      'default-animated': data.templateAnimated || '',
      'default-format': data.placeholderFormat || '',
    };
    templateList.innerHTML = templateList.innerHTML.replaceAll(regex, (match) => {
      if (match in replacements) {
        return replacements[match];
      }
      return match;
    }).replaceAll('https://www.adobe.com/express/templates/default-create-link', data.createLink || '/');

    if (data.templateTasks === '') {
      const placeholders = await fetchPlaceholders();
      templateList.innerHTML = templateList.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
    } else {
      templateList.innerHTML = templateList.innerHTML.replaceAll('default-create-link-text', data.createText || '');
    }
  }
}());

// searchbar -> metadata blades
await (async function updateMetadataForTemplates() {
  if (!['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
    return;
  }
  const head = document.querySelector('head');
  if (head) {
    const replacements = await getReplacementsFromSearch();
    if (!replacements) return;
    head.innerHTML = replaceBladesInStr(head.innerHTML, replacements);
  }
}());

// metadata -> dom blades
(function autoUpdatePage() {
  const wl = ['{{heading_placeholder}}', '{{type}}', '{{quantity}}'];
  // FIXME: deprecate wl
  const main = document.querySelector('main');
  if (!main) return;
  const regex = new RegExp('{{(.+)}}', 'g');
  main.innerHTML = main.innerHTML.replaceAll(regex, (match, p1) => {
    if (!wl.includes(match.toLowerCase())) {
      return getMetadata(p1);
    }
    return match;
  });
}());

// cleanup remaining dom blades
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