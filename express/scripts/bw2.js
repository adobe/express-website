/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/*
 * Japanese balanced word wrap logic
 */

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const SEP = '\n';
// alternative word wrap separators which can be inserted by authors
// currently allows: fullwidth low line U+FF3F
const ALTERNATIVE_SEPS = /[\uff3f]/gm;

function getTextWidth(text, font) {
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCssStyle(element, prop) {
  return window.getComputedStyle(element).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

function separateTextAndDelimiter(text = '') {
  // replace alternative word wrap separators with internal separator
  const altRemoved = text.replace(ALTERNATIVE_SEPS, SEP);
  // replace <wbr> tag with internal separator in original text
  const pipedText = altRemoved.split('<wbr>').join(SEP);
  const newText = [];
  const seps = [];
  for (let i = 0; i < pipedText.length; i += 1) {
    if (pipedText[i] === SEP) {
      if (seps.length > 0) {
        seps.pop();
        seps.push(1);
      }
    } else {
      seps.push(0);
      newText.push(pipedText[i]);
    }
  }
  return { text: newText.join(''), seps };
}

function getNearestWrappingPoint(seps = [], widthsFromStart = [], pos = 0, bidirectional = true) {
  let prev = -1;
  for (const [i, w] of widthsFromStart.entries()) {
    if (seps[i] === 1) {
      if (w > pos) {
        if (prev < 0) {
          return i;
        } else {
          const leftDist = pos - widthsFromStart[prev];
          const rightDist = w - pos;
          return leftDist <= rightDist && bidirectional ? prev : i;
        }
      } else {
        prev = i;
      }
    }
  }
  return prev;
}

function getChunkWidths(el = document.body, text = '', seps = []) {
  const widthsFromStart = new Array(text.length);
  widthsFromStart.fill(0);
  const font = getCanvasFontSize(el);
  for (const [i, v] of seps.entries()) {
    if (v === 1) {
      widthsFromStart[i] = getTextWidth(text.substring(0, i + 1), font);
    }
  }
  widthsFromStart[widthsFromStart.length - 1] = getTextWidth(text, font);
  return { widthsFromStart };
}

function insertAllLevelLineBreak(text = '', seps = [], widthsFromStart = [], maxLevel = 5, ratio = 1.0) {
  let newText = '';
  const poses = Array(text.length);
  const wholeWidth = widthsFromStart[widthsFromStart.length - 1];
  for (let l = 1; l <= maxLevel; l += 1) {
    const step = wholeWidth / (l + 1);
    const firstPos = step * ratio;
    const bidirect = (ratio <= 1.0);
    const fbpos = getNearestWrappingPoint(seps, widthsFromStart, firstPos, bidirect);
    if (fbpos >= 0 && fbpos < text.length) {
      poses[fbpos] = poses[fbpos] || [];
      if (poses[fbpos].indexOf(l) < 0) {
        poses[fbpos].push(l);
      }
    }

    for (let pos = Math.max(widthsFromStart[fbpos], step) + step; pos < wholeWidth; pos += step) {
      const bpos = getNearestWrappingPoint(seps, widthsFromStart, pos);
      if (bpos >= 0 && bpos < text.length) {
        poses[bpos] = poses[bpos] || [];
        if (poses[bpos].indexOf(l) < 0) {
          poses[bpos].push(l);
        }
      }
    }
  }
  for (let i = 0; i < text.length; i += 1) {
    newText += text[i];
    if (seps[i] === 1) {
      if (!poses[i]) {
        // wbr tag was originally inserted here, but it's not used for bw2.
        // Keep the original wbr in result text.
        newText += '<wbr>';
      } else {
        const posStr = poses[i].map((v) => `jpn-balanced-wbr-l${v}`);
        const classNames = posStr.join(' ');
        if (poses[i].length > 0) {
          newText += `<wbr class="${classNames}">`;
        }
      }
    }
  }
  return { newText, poses };
}

function toggleWBR(
  div = document.body, poses = [], widthsFromStart = [], maxLevel = 5,
) {
  const minWidths = Array(maxLevel + 1);
  const wholeWidth = widthsFromStart[widthsFromStart.length - 1];
  minWidths[0] = wholeWidth;
  for (let l = 1; l <= maxLevel; l += 1) {
    const levelPoses = [];
    poses.forEach((p, i) => {
      if (p && p.indexOf(l) >= 0) {
        levelPoses.push(i);
      }
    });
    levelPoses.sort();
    const lengths = [];
    let prevWidth = 0;
    for (const bpos of levelPoses) {
      lengths.push(widthsFromStart[bpos] - prevWidth);
      prevWidth = widthsFromStart[bpos];
    }
    lengths.push(wholeWidth - prevWidth);
    minWidths[l] = Math.max(...lengths);
  }

  const resizeObserver = new ResizeObserver((entries) => {
    const w = entries[0].contentRect.width;
    // console.log(w);
    if (w >= minWidths[0]) {
      return;
    }
    let cl = 0;
    while (cl < minWidths.length && minWidths[cl] > w) {
      cl += 1;
    }
    if (cl < minWidths.length) {
      div.querySelectorAll(`wbr.jpn-balanced-wbr-l${cl}`).forEach((e) => e.classList.remove('wbr-off'));
      div.querySelectorAll(`wbr:not(.jpn-balanced-wbr-l${cl})`).forEach((e) => e.classList.add('wbr-off'));
    } else {
      // Lengths of lines exceed container's width event at maximum number of line wraps.
      // Enable all WBR tags as a last resort
      div.querySelectorAll('wbr').forEach((e) => e.classList.remove('wbr-off'));
    }
  });

  resizeObserver.observe(div);
}

export default class BalancedWordWrapper {
  constructor(maxLineNum = 5, ratio = 1.0) {
    this.maxLevel = maxLineNum;
    this.ratio = ratio;
  }

  applyElement = (el = document.body, ratio = this.ratio) => {
    const children = el.childNodes;
    let oriText = '';
    let hasChildElement = false;
    children.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'WBR') {
        hasChildElement = true;
        this.applyElement(node, ratio);
      } else if (node.nodeType === Node.TEXT_NODE) {
        oriText += node.textContent;
      } else if (node.nodeName === 'WBR') {
        oriText += '<wbr>';
      }
    });
    if (hasChildElement) {
      // current element has child elements, which have been handled recursively,
      // do nothing but return
      return;
    }
    const { text, seps } = separateTextAndDelimiter(oriText);
    const { widthsFromStart } = getChunkWidths(el, text, seps);
    const { newText, poses } = insertAllLevelLineBreak(
      text, seps, widthsFromStart, this.maxLevel, ratio,
    );
    el.innerHTML = newText;
    toggleWBR(el, poses, widthsFromStart, this.maxLevel);
  }
}
