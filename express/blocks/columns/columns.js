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

import { linkImage, createTag, transformLinkToAnimation } from '../../scripts/scripts.js';

function decorateIconList($columnCell) {
  const icons = $columnCell.querySelectorAll('img.icon, svg.icon');
  if (icons.length === 1
    && icons[0].closest('p').innerText === '') {
    // treat single icon without text in a fullsize column cell as brand icon
    icons[0].classList.add('brand');
    $columnCell.parentElement.classList.add('has-brand');
    return;
  }
  let $iconList = createTag('div', { class: 'columns-iconlist' });
  let $iconListDescription;
  [...$columnCell.children].forEach(($e) => {
    const $img = $e.querySelector('img.icon, svg.icon');
    const hasText = $img ? $img.closest('p').innerText !== '' : false;
    if ($img && hasText) {
      const $iconListRow = createTag('div');
      const $iconDiv = createTag('div', { class: 'columns-iconlist-icon' });
      $iconDiv.appendChild($img);
      $iconListRow.append($iconDiv);
      $iconListDescription = createTag('div', { class: 'columns-iconlist-description' });
      $iconListRow.append($iconListDescription);
      $iconListDescription.appendChild($e);
      $iconList.appendChild($iconListRow);
    } else {
      if ($iconList.children.length > 0) {
        $columnCell.appendChild($iconList);
        $iconList = createTag('div', { class: 'columns-iconlist' });
      }
      $columnCell.appendChild($e);
    }
  });
  if ($iconList.children.length > 0) $columnCell.appendChild($iconList);
}

/**
 * utility function that calculates how big the heading presently is
 * and returns the heading number - 1 as the storage is zero indexed.
 * @param {Element} heading - a heading element from H1 - H6
 * @param {Array} sizes - a mapping from heading number (index) to spec tshirt size
 * @returns {Number} - returns the current size of a heading
 */
function getHeadingNumber(heading, sizes) {
  const headingFont = heading.style.fontSize;
  const { tagName } = heading;
  let headingNum = parseInt(tagName.charAt(1), 10);
  if (headingFont) {
    const tSize = headingFont.match(/[a-zA-Z]+\)/g)[0].replace(')', '');
    headingNum = sizes.indexOf(tSize);
  } else {
    headingNum = parseInt(tagName.charAt(1), 10);
  }
  return headingNum;
}

/**
 * calculates the number of lines taken up by a heading's text
 * and determines if it is greater or less than @maxLines
 * @param {Element} heading - a H1 - H6 element.
 * @param {Number} maxLines - maximum number of lines a heading can span
 * @param {Boolean} greaterThan - bool test for if we are evaluating >
 * @returns {boolean} - whether a heading is over/under 3 lines long
 */
function headingComparison(heading, maxLines, greaterThan = true) {
  const style = window.getComputedStyle(heading);
  const { height, lineHeight } = style;
  // dimensions of headings
  const heightInt = parseInt(height, 10);
  const lineHeightFloat = parseFloat(lineHeight);
  // should be verifiable by looking at number of lines
  const headingLines = Math.ceil(heightInt / lineHeightFloat);

  return greaterThan ? headingLines > maxLines : headingLines < maxLines;
}

/**
 * This function ensures headers fit within a 3 line limit and will reduce
 * font size and line height until text falls within this limit
 * @param {NodeListOf<Element>} headings - a list of heading nodes that are H1-H6
 * @param {Map} sizes - a mapping between heading size number and specification t-shirt size.
 * @param {Number} maxLines - maximal amount of lines a heading can take up.
 */
function dynamicScale(headings, sizes, maxLines = 3) {
  // Iterate through Headings
  headings.forEach((heading) => {
    const { tagName } = heading;
    // this is the maximum size a tag can be upgraded to; there's no minimum
    const sizeLimit = parseInt(tagName.charAt(1), 10);
    // current heading size depends on if fontSize is set, if not, it's
    // whatever the tag number is mapped to in Map
    let currH = parseInt(getHeadingNumber(heading, sizes), 10);
    // check upon execution
    const upSize = () => {
      currH -= 1;
      heading.setAttribute('style', `font-size: var(--heading-font-size-${sizes[currH]})`);
    };
    const downSize = () => {
      currH += 1;
      heading.setAttribute('style', `font-size: var(--heading-font-size-${sizes[currH]})`);
    };
    // if heading length is > maxLines this will execute
    // for debug purposes let's store the values
    let downSizeCondition = headingComparison(heading, maxLines);
    let upSizeCondition = headingComparison(heading, maxLines, false);
    if (downSizeCondition) {
      while (downSizeCondition
        && currH < 7) {
        downSize();
        downSizeCondition = headingComparison(heading, maxLines);
      }
    } else if (upSizeCondition) {
      while (upSizeCondition
          && (currH > sizeLimit && currH <= 7)) {
        upSize();
        upSizeCondition = headingComparison(heading, maxLines, false);
      }
    }
    // try final upsize
    if (currH > sizeLimit && !downSizeCondition) {
      while (currH > sizeLimit && !downSizeCondition) {
        upSize();
        downSizeCondition = headingComparison(heading, maxLines);
      }
      if (downSizeCondition) {
        downSize();
      }
    }
  });
}

/**
 * This function uses basic analysis and a standard for what is considered too long,
 * and applies this on heading to try to prevent oversizing.
 * @param {Element} heading - a H1 - H6 element.
 * @param {Array} sizes - a mapping between heading size number - 1 and specification t-shirt size.
 * @returns
 */
function estimateSize(heading, sizes) {
  const headingNum = getHeadingNumber(heading, sizes);
  const text = heading.textContent;

  const SMALL = 80;
  const MEDIUM = 70;
  const LARGE = 57;
  const XLARGE = 30;

  let estimatedSize;

  if (text.length >= SMALL
    && headingNum <= sizes.indexOf('s')) {
    estimatedSize = 's';
  } else if (text.length >= MEDIUM && text.length < SMALL
    && headingNum <= sizes.lastIndexOf('m')) {
    estimatedSize = 'm';
  } else if (text.length >= LARGE && text.length < MEDIUM
    && headingNum <= sizes.indexOf('l')) {
    estimatedSize = 'l';
  } else if (text.length >= XLARGE && text.length < LARGE
    && headingNum <= sizes.indexOf('xl')) {
    estimatedSize = 'xl';
  } else if (text.length < XLARGE && headingNum === sizes.indexOf('xxl')) {
    estimatedSize = 'xxl';
  }
  return estimatedSize;
}

/**
 * runs dynamicScale function and collects necessary data, for it
 * to properly execute.
 */
function runScaleHeadings() {
  const sizes = ['nil', 'xxl', 'xl', 'l', 'm', 'm', 'm', 's'];
  const headings = document.querySelectorAll('main .columns h1, main .columns h2, main .columns h3, main .columns h4, main .columns h5, main .columns h6');
  headings.forEach((heading) => {
    const correctSize = estimateSize(heading, sizes);
    if (correctSize) {
      heading.setAttribute('style', `font-size: var(--heading-font-size-${correctSize})`);
    }
  });
  const scaleCB = () => {
    dynamicScale(headings, sizes);
  };
  // dynamic resizing can only occur when window is resized, by then css is loaded
  window.addEventListener('resize', scaleCB);
}

export default function decorate($block) {
  const $rows = Array.from($block.children);

  let numCols = 0;
  if ($rows[0]) numCols = $rows[0].children.length;

  if (numCols) $block.classList.add(`width-${numCols}-columns`);

  let total = $rows.length;
  const isNumberedList = $block.classList.contains('numbered');
  if (isNumberedList && $block.classList.length > 4) {
    const i = parseInt($block.classList[3], 10);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(i)) {
      total = i;
    }
  }

  $rows.forEach(($row, rowNum) => {
    const $cells = Array.from($row.children);
    $cells.forEach(($cell, cellNum) => {
      if ($cell.querySelector('img.icon, svg.icon')) {
        decorateIconList($cell);
      }

      if (cellNum === 0 && isNumberedList) {
        // add number to first cell
        let num = rowNum + 1;
        if (total > 9) {
          // stylize with total for 10 or more items
          num = `${num}/${total} —`;
          if (rowNum < 9) {
            // pad number with 0
            num = `0${num}`;
          }
        } else {
          // regular ordered list style for 1 to 9 items
          num = `${num}.`;
        }
        $cell.innerHTML = `<span class="num">${num}</span>${$cell.innerHTML}`;
      }

      const $pics = $cell.querySelectorAll(':scope picture');
      if ($pics.length === 1 && $pics[0].parentElement.tagName === 'P') {
        // unwrap single picture if wrapped in p tag, see https://github.com/adobe/helix-word2md/issues/662
        const $parentDiv = $pics[0].closest('div');
        const $parentParagraph = $pics[0].parentNode;
        $parentDiv.insertBefore($pics[0], $parentParagraph);
      }

      // legal copy
      $cell.querySelectorAll(':scope p').forEach(($p) => {
        if ($p.textContent.trim().startsWith('* ')) {
          $p.classList.add('legal-copy');
        }
      });

      // this probably needs to be tighter and possibly earlier
      const $a = $cell.querySelector('a');
      if ($a) {
        if ($a.textContent.startsWith('https://')) {
          if ($a.href.endsWith('.mp4')) {
            transformLinkToAnimation($a);
          } else if ($pics[0]) {
            linkImage($cell);
          }
        }
      }
      if ($a && $a.classList.contains('button')) {
        if ($block.classList.contains('fullsize')) {
          $a.classList.add('xlarge');

          const $primaryCTA = $a;
          const $floatButton = $primaryCTA.parentElement.cloneNode(true);
          $floatButton.classList.add('fixed-button');
          document.body.classList.add('has-fixed-button');
          $cell.appendChild($floatButton);
          $primaryCTA.classList.add('primaryCTA');
          $floatButton.style.display = 'none';

          setTimeout(() => {
            $floatButton.classList.remove('shown');
            $floatButton.style.display = '';
          }, 1000);

          const hideButtonWhenInView = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.intersectionRatio > 0) {
                $floatButton.classList.remove('shown');
              } else {
                $floatButton.classList.add('shown');
              }
            });
          }, { threshold: 0 });

          hideButtonWhenInView.observe($primaryCTA);
          const banner = document.querySelector('.banner-container');
          if (banner) {
            hideButtonWhenInView.observe(banner);
          }
        } else if ($a.classList.contains('light')) {
          $a.classList.replace('accent', 'primary');
        }
      }

      $cell.querySelectorAll(':scope p:empty').forEach(($p) => $p.remove());

      $cell.classList.add('column');
      if ($cell.firstElementChild.tagName === 'PICTURE') {
        $cell.classList.add('column-picture');
      }

      const $pars = $cell.querySelectorAll('p');
      for (let i = 0; i < $pars.length; i += 1) {
        if ($pars[i].innerText.match(/Powered by/)) {
          $pars[i].classList.add('powered-by');
        }
      }
    });
  });
  runScaleHeadings();
}
