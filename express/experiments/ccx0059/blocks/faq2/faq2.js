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
/* global digitalData _satellite */

import {
  createTag,
// eslint-disable-next-line import/no-unresolved
} from '../../../../scripts/scripts.js';

function decorateFAQBlocks($block) {
  const faqs = [];
  const $rows = Array.from($block.children);
  $rows.forEach(($row) => {
    const $cells = Array.from($row.children);
    const $question = $cells[0];
    const $answer = $cells[1];
    const question = $question.textContent;
    const answer = $answer.innerHTML;
    faqs.push({
      question, answer,
    });
  });

  $block.innerHTML = '';
  faqs.forEach((faq) => {
    const { question, answer } = faq;

    const $accordion = createTag('div', { class: 'faq-accordion' });
    $block.append($accordion);

    const $questionDiv = createTag('div', { class: 'faq-question' });
    $accordion.append($questionDiv);
    $questionDiv.innerHTML = question;

    const $answerDiv = createTag('div', { class: 'faq-answer' });
    $accordion.append($answerDiv);
    $answerDiv.innerHTML = answer;
  });

  // find previous h2 and move it in the FAQ
  const section = $block.closest('.section');
  if (section && section.previousElementSibling) {
    const previousSection = section.previousElementSibling;
    const h2 = previousSection.querySelector('div > h2:last-of-type');
    // make sure there is no other element
    if (h2 && !h2.nextElementSibling) {
      const previous = h2.previousElementSibling;
      $block.before(h2);

      if (!previous) {
        // remove empty previous section
        previousSection.remove();
      }
    }
  }
}

export default function decorate($block) {
  $block.classList.add('faq');
  $block.closest('.section').classList.add('faq-container');
  decorateFAQBlocks($block);
  // eslint-disable-next-line no-console
  console.log('faq 2');
  const usp = new URLSearchParams(window.location.search);
  const useAlloy = (
    window.location.hostname === 'www.stage.adobe.com'
    || (
      usp.has('martech')
      && usp.get('martech').includes('alloy')
    )
  );

  if (useAlloy) {
    _satellite.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: 'adobe:express:experiment:ccx0059:challenger-2',
            linkClicks: {
              value: 1,
            },
            type: 'other',
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventName: 'adobe:express:experiment:ccx0059:challenger-2',
              },
            },
            spark: {
              eventData: {
                eventName: 'adobe:express:experiment:ccx0059:challenger-2',
                sendTimestamp: new Date().getTime(),
              },
            },
          },
        },
      },
    });
  } else {
    // eslint-disable-next-line no-underscore-dangle
    digitalData._set('primaryEvent.eventInfo.eventName', 'adobe:express:experiment:ccx0059:challenger-2');
    _satellite.track('event', {
      // eslint-disable-next-line no-underscore-dangle
      digitalData: digitalData._snapshot(),
    });
  }
}
