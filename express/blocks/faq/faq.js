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
  createTag, getIconElement,
} from '../../scripts/scripts.js';

function closeAllOtherFaqs($faq) {
  const $block = $faq.parentElement;
  const accs = $block.getElementsByClassName('faq-accordion');
  for (let i = 0; i < accs.length; i += 1) {
    if (accs[i] !== $faq && accs[i].classList.contains('active')) {
      accs[i].classList.remove('active');
    }
  }
}

function toggleFaq(e) {
  const $faq = e.target.parentElement;
  closeAllOtherFaqs($faq);
  $faq.classList.toggle('active');
}

function addFaqEventListeners($block) {
  const faqs = $block.getElementsByClassName('faq-question');
  for (let i = 0; i < faqs.length; i += 1) {
    faqs[i].addEventListener('click', toggleFaq);
    faqs[i].addEventListener('keydown', (event) => {
      if (event.keyCode === 13) {
        toggleFaq(event);
      }
    });
  }
}

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

    const $chevron = getIconElement('chevron');
    $chevron.classList.add('chevron');
    $questionDiv.prepend($chevron);

    const $answerDiv = createTag('div', { class: 'faq-answer' });
    $accordion.append($answerDiv);
    $answerDiv.innerHTML = answer;
  });

  addFaqEventListeners($block);
}

export default function decorate($block) {
  decorateFAQBlocks($block);
}
