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

function separateTextAndDelimiter(text) {
  // replace <wbr> tag with | in original text
  const pipedText = text.split('<wbr>').join('|');
  const newText = [];
  const seps = [];
  for (let i = 0; i < pipedText.length; i += 1) {
    if (pipedText[i] === '|') {
      seps.pop();
      seps.push(1);
    } else {
      seps.push(0);
      newText.push(pipedText[i]);
    }
  }
  return { text: newText.join(''), seps };
}

function getNearestWrappingPoint(text = '', seps = [], pos = 0, bidirectional = true) {
  if (seps[pos] === 1) {
    return pos;
  }
  let i = 1;
  for (; pos - i >= 0 && pos + i < text.length; i += 1) {
    if (bidirectional && seps[pos - i] === 1) {
      return pos - i;
    }
    if (seps[pos + i] === 1) {
      return pos + i;
    }
  }
  while (bidirectional && pos - i >= 0) {
    if (seps[pos - i] === 1) {
      return pos - i;
    }
    i += 1;
  }
  while (pos + i < text.length) {
    if (seps[pos + i] === 1) {
      return pos + i;
    }
    i += 1;
  }
  return -1;
}

function insertAllLevelLineBreak(text = '', seps = [], maxLevel = 5, ratio = 1.0) {
  let newText = '';
  const poses = Array(text.length);
  for (let l = 1; l <= maxLevel; l += 1) {
    const step = Math.ceil(text.length / (l + 1));
    const firstPos = Math.ceil(step * ratio);
    const fbpos = getNearestWrappingPoint(text, seps, firstPos, false);
    if (fbpos >= 0 && fbpos < text.length) {
      poses[fbpos] = poses[fbpos] || [];
      if (poses[fbpos].indexOf(l) < 0) {
        poses[fbpos].push(l);
      }
    }

    for (let pos = Math.max(firstPos, step) + step; pos < text.length; pos += step) {
      const bpos = getNearestWrappingPoint(text, seps, pos);
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

function toggleWBR(div = document.body, text = '', poses = [], maxLevel = 5) {
  const minWidths = Array(maxLevel + 1);
  minWidths[0] = getTextWidth(text, getCanvasFontSize(div));
  for (let l = 1; l <= maxLevel; l += 1) {
    const levelPoses = [];
    poses.forEach((p, i) => {
      if (p && p.indexOf(l) >= 0) {
        levelPoses.push(i);
      }
    });
    levelPoses.sort();
    const lengths = [];
    let prev = 0;
    for (const bpos of levelPoses) {
      lengths.push(getTextWidth(text.substring(prev, bpos + 1), getCanvasFontSize(div)));
      prev = bpos + 1;
    }
    lengths.push(getTextWidth(text.substring(prev, text.length), getCanvasFontSize(div)));
    minWidths[l] = Math.max(...lengths);
  }

  const resizeObserver = new ResizeObserver((entries) => {
    const w = entries[0].contentRect.width;
    // console.log(w);
    if (w >= minWidths[0]) {
      return;
    }
    let cl = 0;
    while (cl < minWidths.length - 1 && minWidths[cl] > w) {
      cl += 1;
    }
    div.querySelectorAll(`wbr.jpn-balanced-wbr-l${cl}`).forEach((e) => e.classList.remove('wbr-off'));
    div.querySelectorAll(`wbr:not(.jpn-balanced-wbr-l${cl})`).forEach((e) => e.classList.add('wbr-off'));
  });

  resizeObserver.observe(div);
}

export default class BalancedWordWrapper {
  constructor(maxLineNum = 5, ratio = 1.0) {
    this.maxLevel = maxLineNum;
    this.ratio = ratio;
  }

  applyElement = (el = document.body, ratio = this.ratio) => {
    const oriText = el.innerHTML;
    if (oriText.indexOf('<wbr>') < 0) {
      return;
    }
    const { text, seps } = separateTextAndDelimiter(oriText);
    const { newText, poses } = insertAllLevelLineBreak(text, seps, this.maxLevel, ratio);
    el.innerHTML = newText;
    toggleWBR(el, text, poses, this.maxLevel);
  }
}
