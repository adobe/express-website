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
  getHelixEnv,
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
  // FIXME: tasks and tasksx split to be removed after mobile GA
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const {
    tasks,
    tasksx,
    phformat,
    topics,
    q,
  } = params;
  if (!tasks && !phformat) {
    return null;
  }
  const placeholders = await fetchPlaceholders();
  const categories = JSON.parse(placeholders['task-categories']);
  const xCategories = JSON.parse(placeholders['x-task-categories']);
  if (!categories) {
    return null;
  }
  const tasksPair = Object.entries(categories).find((cat) => cat[1] === tasks);
  const xTasksPair = Object.entries(xCategories).find((cat) => cat[1] === tasksx);
  const sanitizedTasks = tasks === "''" ? '' : tasks;
  const sanitizedTopics = topics === "''" ? '' : topics;
  const sanitizedQuery = q === "''" ? '' : q;

  let translatedTasks;
  if (document.body.dataset.device === 'desktop') {
    translatedTasks = xTasksPair?.[1] ? xTasksPair[0].toLowerCase() : tasksx;
  } else {
    translatedTasks = tasksPair?.[1] ? tasksPair[0].toLowerCase() : tasks;
  }
  return {
    '{{queryTasks}}': sanitizedTasks || '',
    '{{QueryTasks}}': titleCase(sanitizedTasks || ''),
    '{{queryTasksX}}': tasksx || '',
    '{{translatedTasks}}': translatedTasks || '',
    '{{TranslatedTasks}}': titleCase(translatedTasks || ''),
    '{{placeholderRatio}}': phformat || '',
    '{{QueryTopics}}': titleCase(sanitizedTopics || ''),
    '{{queryTopics}}': sanitizedTopics || '',
    '{{query}}': sanitizedQuery || '',
  };
}

const bladeRegex = /\{\{[a-zA-Z_-]+\}\}/g;
function replaceBladesInStr(str, replacements) {
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
// legacy json -> metadata & dom blades
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
    const regex = /default-[a-zA-Z_-]+/g;
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
    const title = head.getElementsByTagName('title')[0];
    title.innerText = replaceBladesInStr(title.innerText, replacements);
    [...head.getElementsByTagName('meta')].forEach((meta) => {
      meta.setAttribute('content', replaceBladesInStr(meta.getAttribute('content'), replacements));
    });
  }
}());

// metadata -> dom blades
(function autoUpdatePage() {
  const wl = ['{{heading_placeholder}}', '{{type}}', '{{quantity}}'];
  // FIXME: deprecate wl
  const main = document.querySelector('main');
  if (!main) return;
  const regex = /\{\{([a-zA-Z_-]+)\}\}/g;
  main.innerHTML = main.innerHTML.replaceAll(regex, (match, p1) => {
    if (!wl.includes(match.toLowerCase())) {
      return getMetadata(p1);
    }
    return match;
  });
}());

// cleanup remaining dom blades
(async function updateNonBladeContent() {
  const heroAnimation = document.querySelector('.hero-animation.wide');
  const templateList = document.querySelector('.template-list.fullwidth.apipowered');
  const templateX = document.querySelector('.template-x');
  const browseByCat = document.querySelector('.browse-by-category');
  const seoNav = document.querySelector('.seo-nav');

  if (heroAnimation) {
    if (getMetadata('hero-title')) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', getMetadata('hero-title'));
    }

    if (getMetadata('hero-text')) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template text', getMetadata('hero-text'));
    }
  }

  if (templateList) {
    await replaceDefaultPlaceholders(templateList);
  }

  if (templateX) {
    await replaceDefaultPlaceholders(templateX);
  }

  if (seoNav) {
    if (getMetadata('top-templates-title')) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates title', getMetadata('top-templates-title'));
    }

    if (getMetadata('top-templates-text')) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', getMetadata('top-templates-text'));
    } else {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', '');
    }
  }

  if (browseByCat && !['yes', 'true', 'on', 'Y'].includes(getMetadata('show-browse-by-category'))) {
    browseByCat.remove();
  }
}());

(function validatePage() {
  const env = getHelixEnv();
  const title = document.querySelector('title');
  if ((env && env.name !== 'stage') && getMetadata('live') === 'N') {
    window.location.replace('/express/templates/');
  }

  if (title && title.innerText.match(/{{(.*?)}}/)) {
    window.location.replace('/404');
  }

  if (env && env.name !== 'stage' && window.location.pathname.endsWith('/express/templates/default')) {
    window.location.replace('/404');
  }
}());
