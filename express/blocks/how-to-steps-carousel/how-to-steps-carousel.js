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

/* eslint-disable import/named, import/extensions */

import {
  createTag,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

let rotationInterval;
let fixedImageSize = false;

function reset(block) {
  const window = block.ownerDocument.defaultView;

  window.clearInterval(rotationInterval);
  rotationInterval = null;

  const container = block.parentElement.parentElement;
  const picture = container.querySelector('picture');

  delete picture.style.height;
  container.classList.remove('no-cover');

  fixedImageSize = false;
}

function activate(block, target) {
  console.log(!fixedImageSize);
  if (!fixedImageSize) {
    // trick to fix the image height when vw > 900 and avoid image resize when toggling the tips

    // get viewport width
    const window = block.ownerDocument.defaultView;
    const document = block.ownerDocument;

    const { documentElement } = document;
    const vw = Math.max(
      documentElement && documentElement.clientWidth ? documentElement.clientWidth : 0,
      window && window.innerWidth ? window.innerWidth : 0,
    );

    if (vw >= 900) {

      const container = block.parentElement.parentElement;
      const picture = container.querySelector('picture');
      const img = picture.querySelector('img');
      const panelHeight = block.parentElement.offsetHeight;
      const imgHeight = img.naturalHeight;

      picture.style.height = `${panelHeight || imgHeight}px`;
    }

    fixedImageSize = true;
  }

  // de-activate all
  block.querySelectorAll('.tip, .tip-number').forEach((item) => {
    item.classList.remove('active');
  });

  // get index of the target
  const i = parseInt(target.getAttribute('data-tip-index'), 10);
  // activate corresponding number and tip
  block.querySelectorAll(`.tip-${i}`).forEach((elem) => elem.classList.add('active'));
}

function initRotation(window, document) {
  if (window && !rotationInterval) {
    rotationInterval = window.setInterval(() => {
      document.querySelectorAll('.tip-numbers').forEach((numbers) => {
        // find next adjacent sibling of the currently activated tip
        let activeAdjacentSibling = numbers.querySelector('.tip-number.active+.tip-number');
        if (!activeAdjacentSibling) {
          // if no next adjacent, back to first
          activeAdjacentSibling = numbers.firstElementChild;
        }
        activate(numbers.parentElement, activeAdjacentSibling);
      });
    }, 5000);
  }
}

function buildHowToStepsCarousel(section, picture, block, document, rows, window) {
  section.prepend(picture);

  // join wrappers together
  section.querySelectorAll('.default-content-wrapper').forEach((wrapper, i) => {
    if (i === 0) {
      // add block to first wrapper
      const blockWrapper = block.parentElement;
      wrapper.append(block);
      wrapper.className = '';
      blockWrapper.remove();
    } else if (i >= 1) {
      // add children from rest of wrappers to first wrapper
      wrapper.previousElementSibling.append(...wrapper.children);
      wrapper.remove();
    }
  });

  const heading = section.querySelector('h2, h3, h4');

  const includeSchema = block.classList.contains('schema');
  if (includeSchema) {
    // this is due to block loader setting how-to-steps-carousel-schema-container
    // and not how-to-steps-carousel-container as expected
    section.classList.add('how-to-steps-carousel-container');
  }
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  const numbers = createTag('div', { class: 'tip-numbers', 'aria-role': 'tablist' });
  block.prepend(numbers);
  const tips = createTag('div', { class: 'tips' });
  block.append(tips);

  rows.forEach((row, i) => {
    row.classList.add('tip');
    row.classList.add(`tip-${i + 1}`);
    row.setAttribute('data-tip-index', i + 1);

    const cells = Array.from(row.children);

    const h3 = createTag('h3');
    h3.innerHTML = cells[0].textContent.trim();
    const text = createTag('div', { class: 'tip-text' });
    text.append(h3);
    text.append(cells[1]);

    row.innerHTML = '';
    row.append(text);

    tips.prepend(row);

    schema.step.push({
      '@type': 'HowToStep',
      position: i + 1,
      name: h3.textContent.trim(),
      itemListElement: {
        '@type': 'HowToDirection',
        text: text.textContent.trim(),
      },
    });

    const number = createTag('div', {
      class: `tip-number tip-${i + 1}`,
      tabindex: '0',
      title: `${i + 1}`,
      'aria-role': 'tab',
    });
    number.innerHTML = `<span>${i + 1}</span>`;
    number.setAttribute('data-tip-index', i + 1);

    number.addEventListener('click', (e) => {
      if (rotationInterval) {
        window.clearTimeout(rotationInterval);
      }

      let { target } = e;
      if (e.target.nodeName.toLowerCase() === 'span') {
        target = e.target.parentElement;
      }
      activate(block, target);
    });

    number.addEventListener('keyup', (e) => {
      if (e.which === 13) {
        e.preventDefault();
        e.target.click();
      }
    });

    numbers.append(number);

    if (i === 0) {
      row.classList.add('active');
      number.classList.add('active');
    }
  });

  if (includeSchema) {
    const $schema = createTag('script', { type: 'application/ld+json' });
    $schema.innerHTML = JSON.stringify(schema);
    const $head = document.head;
    $head.append($schema);
  }

  if (window) {
    window.addEventListener('resize', () => {
      reset(block);
      activate(block, block.querySelector('.tip-number.tip-1'));
      initRotation(window, document);
    });
  }

  const img = picture.querySelector('img');
  const run = () => {
    // slgiht delay to allow panel to size correctly
    window.setTimeout(() => {
      activate(block, block.querySelector('.tip-number.tip-1'));
      initRotation(window, document);
    }, 0);
  };

  if (!img.complete) {
    img.addEventListener('load', run);
    img.addEventListener('error', run);
  } else {
    run();
  }
}

function roundedImage(x, y, width, height, radius, ctx) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function layerTemplateImage(canvas, ctx, templateImg) {
  // start and end areas were directly measured and transferred from the spec image
  templateImg.style.maxWidth = '986px';
  templateImg.style.maxHeight = '652px';
  templateImg.style.objectFit = 'contain';

  return new Promise((outerResolve) => {
      let prevWidth;

    const drawImage = (centerX, centerY, maxWidth, maxHeight) => {
      return new Promise((resolve) => {
        const obs = new ResizeObserver((changes) => {
          for (const change of changes) {

            if (change.contentRect.width === prevWidth) return;
            prevWidth = change.contentRect.width;
            if (prevWidth <= maxWidth && change.contentRect.height <= maxHeight) {
              ctx.save();
              roundedImage(centerX - (templateImg.width / 2), centerY - (templateImg.height / 2),
                templateImg.width, templateImg.height, 7, ctx);
              ctx.clip();
              ctx.drawImage(templateImg, 0, 0, templateImg.naturalWidth,
                templateImg.naturalHeight, centerX - (templateImg.width / 2),
                centerY - (templateImg.height / 2), templateImg.width, templateImg.height);
              ctx.restore();
              obs.disconnect();
              resolve();
            }
          }
        });
        obs.observe(templateImg);
      });
    };

    drawImage(1123, 600, 986, 652)
      .then(() => {
        templateImg.style.maxWidth = '312px';
        templateImg.style.maxHeight = '472px';
        return drawImage(1816, 479, 312, 472);
      })
      .then(() => outerResolve());
  });
}

export default async function decorate(block) {
  const window = block.ownerDocument.defaultView;
  const document = block.ownerDocument;
  const image = block.classList.contains('image');

  // move first image of container outside of div for styling
  const section = block.closest('.section');
  const howto = block;
  const rows = Array.from(howto.children);
  let picture;
  if (image) {
    const backgroundPictureDiv = rows.shift();
    const backgroundPic = backgroundPictureDiv.querySelector('picture');
    const backgroundPicImg = backgroundPic.querySelector('img');

    const loadImage = (img) => {
      return new Promise((resolve) => {
        if (img.complete && img.naturalHeight !== 0) resolve();
        else {
          img.onload = () => {
            resolve();
          };
        }
      });
    };

    loadImage(backgroundPicImg).then(() => {
      backgroundPicImg.width = 2000;
      backgroundPicImg.height = 1072;
      const templateDiv = rows.shift();
      const canvas = createTag('canvas', { width: backgroundPicImg.width, height: backgroundPicImg.height });

      const ctx = canvas.getContext('2d');
      ctx.drawImage(backgroundPicImg, 0, 0, backgroundPicImg.width, backgroundPicImg.height);
      const templateImages = templateDiv.querySelectorAll('picture');
      const templateImg = templateImages[0].querySelector('img');

      return loadImage(templateImg).then(() => {
        layerTemplateImage(canvas, ctx, templateImg).then(() => {
          const img = createTag('img');
          img.src = canvas.toDataURL('image/png');
          backgroundPictureDiv.remove();
          const mergedPicture = createTag('picture');
          mergedPicture.append(img);
          picture = mergedPicture;
          buildHowToStepsCarousel(section, picture, block, document, rows, window);
          templateDiv.remove();
        });
      });
    });
  } else {
    picture = section.querySelector('picture');
    const parent = picture.parentElement;
    parent.remove();
    buildHowToStepsCarousel(section, picture, block, document, rows, window);
  }
}
