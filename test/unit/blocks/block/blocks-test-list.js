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

export default [
  {
    name: 'No block name',
    input: 'input/noname.doc.html',
    expected: 'expected/noname.block.html',
  }, {
    name: 'Table of Contents - 1 level',
    input: 'input/table-of-contents.1level.doc.html',
    expected: 'expected/table-of-contents.1level.block.html',
  }, {
    name: 'Table of Contents - 2 levels',
    input: 'input/table-of-contents.2levels.doc.html',
    expected: 'expected/table-of-contents.2levels.block.html',
  }, {
    name: 'Link Image - basic',
    input: 'input/link-image.basic.doc.html',
    expected: 'expected/link-image.basic.block.html',
  }, {
    name: 'Link Image - no line breaks',
    input: 'input/link-image.nolinebreaks.doc.html',
    expected: 'expected/link-image.nolinebreaks.block.html',
  }, {
    name: 'Template List - video',
    input: 'input/template-list.video.doc.html',
    expected: 'expected/template-list.video.block.html',
    timeout: 1000,
  }, {
    name: 'Template List - linked image',
    input: 'input/template-list.linkedimage.doc.html',
    expected: 'expected/template-list.linkedimage.block.html',
    timeout: 1000,
  }, {
    name: 'Template List - link without text',
    input: 'input/template-list.linknotext.doc.html',
    expected: 'expected/template-list.linknotext.block.html',
    timeout: 1000,
  }, {
    name: 'Template List - linked with text',
    input: 'input/template-list.linkwithtext.doc.html',
    expected: 'expected/template-list.linkwithtext.block.html',
    timeout: 1000,
  }, {
    name: 'Template List - title',
    input: 'input/template-list.title.doc.html',
    expected: 'expected/template-list.title.block.html',
    timeout: 1000,
  }, {
    name: 'Columns - single row',
    input: 'input/columns.singlerow.doc.html',
    expected: 'expected/columns.singlerow.block.html',
  }, {
    name: 'Columns - 3 rows',
    input: 'input/columns.table.3.doc.html',
    expected: 'expected/columns.table.3.block.html',
  }, {
    name: 'Columns - 3 numbered rows',
    input: 'input/columns.table.numbered.3.doc.html',
    expected: 'expected/columns.table.numbered.3.block.html',
  }, {
    name: 'Columns - 10 numbered rows',
    input: 'input/columns.table.numbered.10.doc.html',
    expected: 'expected/columns.table.numbered.10.block.html',
  }, {
    name: 'Columns - Animation',
    input: 'input/columns.animation.doc.html',
    expected: 'expected/columns.animation.block.html',
  }, {
    name: 'Columns - Animation with params',
    input: 'input/columns.animation.params.doc.html',
    expected: 'expected/columns.animation.params.block.html',
  }, {
    name: 'Banner - h2',
    input: 'input/banner.h2.doc.html',
    expected: 'expected/banner.h2.block.html',
  }, {
    name: 'Banner - h3',
    input: 'input/banner.h3.doc.html',
    expected: 'expected/banner.h3.block.html',
  }, {
    name: 'Banner - dark button',
    input: 'input/banner.button.doc.html',
    expected: 'expected/banner.h2.button.block.html',
  }, {
    name: 'Banner - h1 - converted to h2',
    input: 'input/banner.h1.doc.html',
    expected: 'expected/banner.h2.block.html',
  }, {
    name: 'Banner - h4 - converted to h3',
    input: 'input/banner.h4.doc.html',
    expected: 'expected/banner.h3.block.html',
  }, {
    name: 'Banner - multi button',
    input: 'input/banner.multi-button.doc.html',
    expected: 'expected/banner.multi-button.block.html',
  }, {
    name: 'Inline Banner - h1 - converted to h2',
    input: 'input/inline-banner.h1.doc.html',
    expected: 'expected/inline-banner.h2.block.html',
  }, {
    name: 'Inline Banner - inverted if dark container',
    input: 'input/inline-banner.dark.doc.html',
    expected: 'expected/inline-banner.dark.section.html',
  }, {
    name: 'Inline Banner - inverted if highlighted container',
    input: 'input/inline-banner.highlight.doc.html',
    expected: 'expected/inline-banner.inverted.section.html',
  }, {
    name: 'Commerce CTA',
    input: 'input/commerce-cta.doc.html',
    expected: 'expected/commerce-cta.block.html',
  }, {
    name: 'Commerce CTA - custom cadence',
    input: 'input/commerce-cta.cadence.doc.html',
    expected: 'expected/commerce-cta.cadence.block.html',
  }, {
    name: 'FAQ - basic',
    input: 'input/faq.doc.html',
    expected: 'expected/faq.block.html',
  }, {
    name: 'How To Steps Carousel',
    input: 'input/how-to-steps-carousel.doc.html',
    expected: 'expected/how-to-steps-carousel.section.html',
  },
];
