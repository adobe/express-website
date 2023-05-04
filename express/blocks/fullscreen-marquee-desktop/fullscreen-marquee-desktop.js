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
  addFreePlanWidget,
  createOptimizedPicture,
  createTag,
  fetchPlaceholders,
  transformLinkToAnimation,
} from '../../scripts/scripts.js';

function buildContent(content) {
  const contentLink = content.querySelector('a');
  let formattedContent = content;

  if (contentLink && contentLink.href.endsWith('.mp4')) {
    const video = new URL(contentLink.href);
    const looping = ['true', 'yes', 'on'].includes(video.searchParams.get('looping')) ? 'yes' : null;
    formattedContent = transformLinkToAnimation(contentLink, looping);
  }

  return formattedContent;
}

function buildHeading(block, heading) {
  heading.classList.add('fullscreen-marquee-desktop-heading');
  return heading;
}

function buildBackground(block, background) {
  background.classList.add('fullscreen-marquee-desktop-background');

  window.addEventListener('scroll', () => {
    const progress = (window.scrollY * 100) / block.offsetHeight;
    let opacityValue = (progress / 1000) * 10;

    if (opacityValue > 0.6) {
      opacityValue = 0.6;
    }

    background.style = `opacity: ${opacityValue}`;
  });

  return background;
}

async function buildApp(block, content) {
  const appBackground = createTag('div', { class: 'fullscreen-marquee-desktop-app-background' });
  const appFrame = createTag('div', { class: 'fullscreen-marquee-desktop-app-frame' });
  const app = createTag('div', { class: 'fullscreen-marquee-desktop-app' });
  const contentContainer = createTag('div', { class: 'fullscreen-marquee-desktop-app-content-container' });
  const cta = block.querySelector('.button-container a');
  let appImage;
  let editor;

  await fetchPlaceholders().then((placeholders) => {
    let variant;

    if (block.classList.contains('video')) {
      variant = 'video';
    } else {
      variant = 'image';
    }

    appImage = createOptimizedPicture(placeholders[`fullscreen-marquee-desktop-${variant}-app`]);
    editor = createOptimizedPicture(placeholders[`fullscreen-marquee-desktop-${variant}-editor`]);

    appImage.classList.add('fullscreen-marquee-desktop-app-image');
  });

  editor.classList.add('fullscreen-marquee-desktop-app-editor');
  content.classList.add('fullscreen-marquee-desktop-app-content');

  window.addEventListener('mousemove', (e) => {
    const rotateX = ((e.clientX * 10) / (window.innerWidth / 2) - 10);
    const rotateY = -((e.clientY * 10) / (window.innerHeight / 2) - 10);

    app.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 0px)`;
    appBackground.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, -50px)`;
  }, { passive: true });

  contentContainer.append(content);
  app.append(appImage);
  app.append(contentContainer);
  appFrame.append(app);
  appFrame.append(appBackground);
  app.append(editor);

  if (cta) {
    cta.classList.add('xlarge');

    const highlightCta = cta.cloneNode(true);
    const appHighlight = createTag('a', {
      class: 'fullscreen-marquee-desktop-app-frame-highlight',
      href: cta.href,
    });

    await addFreePlanWidget(cta.parentElement);

    appHighlight.append(highlightCta);
    appFrame.append(appHighlight);
  }

  return appFrame;
}

export default async function decorate(block) {
  const rows = Array.from(block.children);
  const heading = rows[0] ? rows[0].querySelector('div') : null;
  const background = rows[2] ?? null;
  let content = rows[1] ?? null;

  block.innerHTML = '';

  if (content) {
    content = buildContent(content);
  }

  if (background) {
    block.append(buildBackground(block, background));
  }

  if (heading) {
    block.append(buildHeading(block, heading));
  }

  if (content) {
    block.append(await buildApp(block, content));
  }
}
