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
    console.log(question);
    console.log(answer);

    const $accordion = createTag('div', { class: 'faq-accordion' });
    $block.append($accordion);
    console.log($accordion);

    const $questionDiv = createTag('div', { class: 'faq-question', tabindex: '0' });
    $accordion.append($questionDiv);
    $questionDiv.innerHTML = question;

    const $chevron = createTag('i', { class: 'chevron fa fa-chevron-down' });
    $questionDiv.prepend($chevron);

    const $answerDiv = createTag('div', { class: 'faq-answer' });
    $accordion.append($answerDiv);
    $answerDiv.innerHTML = answer;

  });

  addFaqEventListeners();
}

function addFaqEventListeners() {
  const faqs = document.getElementsByClassName("faq-question");
  for (let i = 0; i < faqs.length; i++) {
    faqs[i].addEventListener("click", toggleFaq);
    faqs[i].addEventListener("keydown", event => {
      if (event.keyCode === 32 || event.keyCode === 13 ) {
        toggleFaq(event);
      }
    });
  }
}

function toggleFaq(e) {
  const faq = e.target.parentElement;
  closeAllOtherFaqs(faq);
  faq.classList.toggle("active");
}

function closeAllOtherFaqs(faq) {
  const accs = document.getElementsByClassName('faq-accordion');
  for (let i = 0; i < accs.length; i++) {
    if (accs[i] == faq) {
      continue;
    }
    if (accs[i].classList.contains('active')) {
      accs[i].classList.remove('active');
    }
  }
}

export default function decorate($block) {
  decorateFAQBlocks($block);
}
