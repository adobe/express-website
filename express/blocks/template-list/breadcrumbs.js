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
} from '../../scripts/scripts.js';
import fetchAllTemplatesMetadata from '../../scripts/all-templates-metadata.js';

function sanitize(str) {
  return str.replaceAll(/[$@%'"]/g, '');
}

function getCrumbsForSearch(templatesUrl, allTemplatesMetadata, taskCategories) {
  const { search, origin } = window.location;
  let { tasks, topics } = new Proxy(new URLSearchParams(search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  tasks = sanitize(tasks);
  topics = sanitize(topics);
  const crumbs = [];
  if (!tasks && !topics) {
    return crumbs;
  }
  const shortTitle = getMetadata('short-title');
  if (!shortTitle) {
    return crumbs;
  }

  const lastCrumb = createTag('li');
  lastCrumb.textContent = shortTitle;
  crumbs.push(lastCrumb);
  if (!tasks || !topics) {
    return crumbs;
  }

  const taskUrl = `${templatesUrl}${tasks}`;
  const foundTaskPage = allTemplatesMetadata
    .some((t) => t.url === taskUrl.replace(origin, ''));

  if (foundTaskPage) {
    const taskCrumb = createTag('li');
    const taskAnchor = createTag('a', { href: taskUrl });
    taskCrumb.append(taskAnchor);
    const translatedTasks = Object.entries(taskCategories)
      .find(([_, t]) => t === tasks || t === tasks.replace(/-/g, ' '))
      ?.[0]?.toLowerCase() ?? tasks;
    taskAnchor.textContent = titleCase(translatedTasks);
    crumbs.unshift(taskCrumb);
  }

  return crumbs;
}

function getCrumbsForSEOPage(templatesUrl, allTemplatesMetadata, taskCategories, segments) {
  const { origin, pathname } = window.location;
  const tasks = getMetadata('tasks')
  // TODO: remove templateTasks and allTemplatesMetadata here after all content are updated
    ?? getMetadata('templateTasks')
    ?? allTemplatesMetadata[pathname]?.tasks
    ?? allTemplatesMetadata[pathname]?.templateTasks;
  const translatedTasks = Object.entries(taskCategories)
    .find(([_, t]) => t === tasks || t === tasks.replace(/-/g, ' '))
    ?.[0]?.toLowerCase() ?? tasks;
  // we might have an inconsistent trailing slash problem
  let builtUrl = templatesUrl.replace('templates/', 'templates');
  const crumbs = [];
  segments
    .slice(0, segments.length - 1)
    .forEach((currSeg) => {
      const seg = sanitize(currSeg);
      if (!seg) return;
      builtUrl = `${builtUrl}/${seg}`;
      // at least translate tasks seg
      const translatedSeg = seg === tasks ? translatedTasks : seg;
      const segmentCrumb = createTag('li');
      if (allTemplatesMetadata.some((t) => t.url === builtUrl.replace(origin, ''))) {
        const segmentLink = createTag('a', { href: builtUrl });
        segmentLink.textContent = titleCase(translatedSeg);
        segmentCrumb.append(segmentLink);
      } else {
        segmentCrumb.textContent = titleCase(translatedSeg);
      }
      crumbs.push(segmentCrumb);
    });
  const shortTitle = getMetadata('short-title');
  if (!shortTitle) {
    return crumbs;
  }
  const lastCrumb = createTag('li');
  lastCrumb.textContent = shortTitle;
  crumbs.push(lastCrumb);
  return crumbs;
}

// returns null if no breadcrumbs
// returns breadcrumbs as an li element
export default async function getBreadcrumbs() {
  // for backward compatibility
  // TODO: remove this check after all content are updated
  if (getMetadata('sheet-powered') !== 'Y' || !document.querySelector('.search-marquee')) {
    return null;
  }
  const { origin, pathname } = window.location;
  const regex = /(.*?\/express\/)templates(.*)/;
  const matches = pathname.match(regex);
  if (!matches) {
    return null;
  }
  const placeholders = await fetchPlaceholders();
  const [, homePath, children] = matches;
  const breadcrumbs = createTag('ol', { class: 'templates-breadcrumbs' });

  const homeCrumb = createTag('li');
  const homeUrl = `${origin}${homePath}`;
  const homeAnchor = createTag('a', { href: homeUrl });
  homeAnchor.textContent = titleCase(placeholders.express || '') || 'Home';
  homeCrumb.append(homeAnchor);
  breadcrumbs.append(homeCrumb);

  const templatesCrumb = createTag('li');
  const templatesUrl = `${homeUrl}templates/`;
  const templatesAnchor = createTag('a', { href: templatesUrl });
  templatesAnchor.textContent = titleCase(placeholders.templates || '') || 'Templates';
  templatesCrumb.append(templatesAnchor);
  breadcrumbs.append(templatesCrumb);

  const nav = createTag('nav', { 'aria-label': 'Breadcrumb' });
  nav.append(breadcrumbs);

  if (!children || children === '/') {
    return nav;
  }
  const taskCategories = JSON.parse(placeholders['task-categories']);
  const allTemplatesMetadata = await fetchAllTemplatesMetadata();
  const isSearchPage = children.startsWith('/search?') || getMetadata('template-search-page') === 'Y';
  const crumbs = isSearchPage
    ? getCrumbsForSearch(templatesUrl, allTemplatesMetadata, taskCategories)
    : getCrumbsForSEOPage(templatesUrl, allTemplatesMetadata, taskCategories, children.split('/'));

  crumbs.forEach((c) => {
    breadcrumbs.append(c);
  });
  return nav;
}
