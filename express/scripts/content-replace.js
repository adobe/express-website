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
  getHelixEnv,
} from './scripts.js';

async function replaceDefaultPlaceholders(block, components) {
  block.innerHTML = block.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', components.link);

  if (components.tasks === '') {
    const placeholders = await fetchPlaceholders();
    block.innerHTML = block.innerHTML.replaceAll('default-create-link-text', placeholders['start-from-scratch'] || '');
  } else {
    block.innerHTML = block.innerHTML.replaceAll('default-create-link-text', getMetadata('create-text') || '');
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

async function updateMetadataForTemplates() {
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
}

// metadata -> dom blades
function autoUpdatePage() {
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
}

// cleanup remaining dom blades
async function updateNonBladeContent() {
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
    await replaceDefaultPlaceholders(templateList, {
      link: getMetadata('create-link') || '/',
      tasks: getMetadata('tasks'),
    });
  }

  if (templateX) {
    await replaceDefaultPlaceholders(templateX, {
      link: getMetadata('create-link-x') || getMetadata('create-link') || '/',
      tasks: getMetadata('tasks-x'),
    });
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
}

function validatePage() {
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
}

export default async function replaceContent() {
  await updateMetadataForTemplates();
  autoUpdatePage();
  await updateNonBladeContent();
  validatePage();
}
