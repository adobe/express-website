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
import {
  createTag,
} from '../../scripts/scripts.js';

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

    const $questionDiv = createTag('div', { class: 'faq-question', tabindex: '0' });
    $accordion.append($questionDiv);
    $questionDiv.innerHTML = question;

    const $answerDiv = createTag('div', { class: 'faq-answer' });
    $accordion.append($answerDiv);
    $answerDiv.innerHTML = answer;
  });

  // find previous h2 and move it in the FAQ
  const section = $block.closest('.section-wrapper');
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
  decorateFAQBlocks($block);
}
