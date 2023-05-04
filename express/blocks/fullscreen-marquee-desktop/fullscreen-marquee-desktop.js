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
  buildStaticFreePlanWidget,
  createTag,
  transformLinkToAnimation,
} from '../../scripts/scripts.js';

function buildAppFrame(parameters) {
  const appFrame = createTag('div', { class: 'fullscreen-marquee-desktop-app-frame' });

  if (parameters.app) {
    const app = createTag('div', { class: 'fullscreen-marquee-desktop-app' });
    app.append(parameters.app);
    appFrame.append(app);

    parameters.app = app;

    const appBackground = createTag('div', { class: 'fullscreen-marquee-desktop-app-background' });
    appFrame.append(appBackground);

    window.addEventListener('mousemove', (e) => {
      const rotateX = ((e.clientX * 10) / (window.innerWidth / 2) - 10);
      const rotateY = -((e.clientY * 10) / (window.innerHeight / 2) - 10);

      app.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 0px)`;
      appBackground.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, -50px)`;
    }, { passive: true });
  }

  if (parameters.content) {
    const contentContainer = createTag('div', { class: 'fullscreen-marquee-desktop-app-content-container' });
    parameters.content.classList.add('fullscreen-marquee-desktop-app-content');

    parameters.app.append(contentContainer);
    contentContainer.append(parameters.content);

    if (parameters.cta) {
      const appHighlight = createTag('a', {
        class: 'fullscreen-marquee-desktop-app-frame-highlight',
        href: parameters.cta.href,
      });

      const dupeCta = parameters.cta.cloneNode(true);

      appHighlight.append(dupeCta);
      appFrame.append(appHighlight);
    }
  }

  if (parameters.editor) {
    parameters.editor.classList.add('fullscreen-marquee-desktop-app-editor');
    parameters.app.append(parameters.editor);
  }

  return appFrame;
}

export default async function decorate(block) {
  const rows = Array.from(block.children);
  const content = rows[1];

  const parameters = {
    heading: rows[0].querySelector('div'),
    background: rows[2].querySelector('picture') || null,
    app: rows[3].querySelector('picture') || null,
    editor: rows[4].querySelector('picture') || null,
  };

  if (content) {
    const contentLink = content.querySelector('a');

    if (contentLink && contentLink.href.endsWith('.mp4')) {
      const video = new URL(contentLink.href);
      const looping = ['true', 'yes', 'on'].includes(video.searchParams.get('looping')) ? 'yes' : null;

      parameters.content = transformLinkToAnimation(contentLink, looping);
    } else {
      parameters.content = content;
    }
  }

  block.innerHTML = '';

  if (parameters.heading) {
    parameters.heading.classList.add('fullscreen-marquee-desktop-heading');
    block.append(parameters.heading);

    const buttonContainer = parameters.heading.querySelector('.button-container');

    if (buttonContainer) {
      const cta = buttonContainer.querySelector('a');
      const freePlanWidget = await buildStaticFreePlanWidget();

      buttonContainer.append(freePlanWidget);

      if (cta) {
        parameters.cta = cta;
      }
    }
  }

  if (parameters.background) {
    parameters.background.classList.add('fullscreen-marquee-desktop-background');
    block.append(parameters.background);
  }

  if (parameters.app && parameters.editor && parameters.content) {
    block.append(buildAppFrame(parameters));
  }
}
