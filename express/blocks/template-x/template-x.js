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
  addAnimationToggle,
  addSearchQueryToHref,
  createOptimizedPicture,
  createTag,
  decorateMain,
  fetchPlaceholders,
  getIconElement,
  getLocale,
  linkImage,
  toClassName,
} from '../../scripts/scripts.js';

import { Masonry } from '../shared/masonry.js';

import { buildCarousel } from '../shared/carousel.js';

function wordStartsWithVowels(word) {
  return word.match('^[aieouâêîôûäëïöüàéèùœAIEOUÂÊÎÔÛÄËÏÖÜÀÉÈÙŒ].*');
}

function camelize(str) {
  return str.replace(/^\w|[A-Z]|\b\w/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase())).replace(/\s+/g, '');
}

function constructProps(block) {
  const singleColumnContentTypes = ['title', 'subtitle'];
  const props = {
    templates: [],
    filters: {
      locales: '(en)',
    },
    tailButton: '',
    limit: 70,
    total: 0,
    start: '',
    sortBy: '-_score,-remixCount',
    masonry: undefined,
    authoringError: false,
    headingTitle: null,
    headingSlug: null,
    viewAllLink: null,
  };

  Array.from(block.children).forEach((row) => {
    const cols = row.querySelectorAll('div');
    const key = cols[0].querySelector('strong')?.textContent.trim().toLowerCase();
    if (cols.length === 1) {
      const paragraphs = cols[0].querySelectorAll('p');
      singleColumnContentTypes.forEach((k, i) => {
        if (paragraphs[i]) {
          props[k] = paragraphs[i].textContent.trim();
        }
      });
    } else if (cols.length === 2) {
      const value = cols[1].textContent.trim();
      if (key && value) {
        if (['tasks', 'topics', 'locales'].includes(key) || (['premium', 'animated'].includes(key) && value.toLowerCase() !== 'all')) {
          props.filters[camelize(key)] = value;
        } else {
          props[camelize(key)] = value;
        }
      }
    } else if (cols.length === 3) {
      if (key === 'template stats' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        props[camelize(key)] = cols[2].textContent.trim().toLowerCase();
      }

      if (key === 'holiday block' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        const graphic = cols[2].querySelector('picture');
        if (graphic) {
          props[camelize(key)] = graphic;
        }
      }
    } else if (cols.length === 4) {
      if (key === 'blank template') {
        cols[0].remove();
        props.templates.push(row.cloneNode(true));
      }
    }
  });

  return props;
}

function formatSearchQuery(props) {
  const prunedFilter = Object.entries(props.filters).filter(([, value]) => value !== '()');
  const filterString = prunedFilter.reduce((string, [key, value]) => {
    if (key === prunedFilter[prunedFilter.length - 1][0]) {
      return `${string}${key}:(${value})`;
    } else {
      return `${string}${key}:(${value}) AND `;
    }
  }, '');

  return `https://www.adobe.com/cc-express-search-api?limit=${props.limit}&start=${props.start}&orderBy=${props.sortBy}&filters=${filterString}`;
}

async function fetchTemplates(props) {
  if (!props.authoringError && Object.keys(props.filters).length !== 0) {
    props.queryString = formatSearchQuery(props);

    const result = await fetch(props.queryString)
      .then((response) => response.json())
      .then((response) => response);

    // eslint-disable-next-line no-underscore-dangle
    if (result._embedded.total > 0) {
      return result;
    } else {
      // save fetch if search query returned 0 templates. "Bad result is better than no result"
      return fetch(`https://www.adobe.com/cc-express-search-api?limit=${props.limit}&start=${props.start}&orderBy=${props.sortBy}&filters=locales:(en)`)
        .then((res) => res.json())
        .then((res) => res);
    }
  }

  return null;
}

async function processApiResponse(props) {
  const placeholders = await fetchPlaceholders();
  const response = await fetchTemplates(props);
  let templateFetched;
  if (response) {
    // eslint-disable-next-line no-underscore-dangle
    templateFetched = response._embedded.results;

    if ('_links' in response) {
      // eslint-disable-next-line no-underscore-dangle
      const nextQuery = response._links.next.href;
      const starts = new URLSearchParams(nextQuery).get('start').split(',');
      starts.pop();
      props.start = starts.join(',');
    } else {
      props.start = '';
    }

    // eslint-disable-next-line no-underscore-dangle
    props.total = response._embedded.total;
  }

  const renditionParams = {
    format: 'jpg',
    dimension: 'width',
    size: 400,
  };

  if (templateFetched) {
    return templateFetched.map((template) => {
      const tmpltEl = createTag('div');
      const picElWrapper = createTag('div');

      ['format', 'dimension', 'size'].forEach((param) => {
        template.rendition.href = template.rendition.href.replace(`{${param}}`, renditionParams[param]);
      });
      const picEl = createTag('img', {
        src: template.rendition.href,
        alt: template.title,
      });
      const btnElWrapper = createTag('div', { class: 'button-container' });
      const btnEl = createTag('a', {
        href: template.branchURL,
        title: placeholders['edit-this-template'] ?? 'Edit this template',
        class: 'button accent',
      });

      btnEl.textContent = placeholders['edit-this-template'] ?? 'Edit this template';
      picElWrapper.insertAdjacentElement('beforeend', picEl);
      btnElWrapper.insertAdjacentElement('beforeend', btnEl);
      tmpltEl.insertAdjacentElement('beforeend', picElWrapper);
      tmpltEl.insertAdjacentElement('beforeend', btnElWrapper);
      return tmpltEl;
    });
  } else {
    return null;
  }
}

async function populateHeadingPlaceholder(props) {
  const locale = getLocale(window.location);
  const heading = props.title.replace("''", '');
  const placeholders = await fetchPlaceholders();

  let grammarTemplate = placeholders['template-placeholder'];

  if (grammarTemplate.indexOf('{{quantity}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{quantity}}', props.total.toLocaleString('en-US'));
  }

  if (grammarTemplate.indexOf('{{Type}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{Type}}', heading);
  }

  if (grammarTemplate.indexOf('{{type}}') >= 0) {
    grammarTemplate = grammarTemplate.replace('{{type}}', heading.charAt(0).toLowerCase() + heading.slice(1));
  }

  if (locale === 'fr') {
    grammarTemplate.split(' ').forEach((word, index, words) => {
      if (index + 1 < words.length) {
        if (word === 'de' && wordStartsWithVowels(words[index + 1])) {
          words.splice(index, 2, `d'${words[index + 1].toLowerCase()}`);
          grammarTemplate = words.join(' ');
        }
      }
    });
  }

  return grammarTemplate;
}

async function generateToolBar(block, props) {
  const parent = block.closest('.section');
  if (parent) {
    const dcw = parent.querySelector('.default-content-wrapper');
    const tmpltListWrapper = parent.querySelector('.template-x-wrapper');
    const $sectionHeading = parent.querySelector('div > h2');
    let $sectionSlug = null;

    const tBarWrapper = createTag('div', { class: 'toolbar-wrapper' });
    const tBar = createTag('div', { class: 'api-templates-toolbar' });
    const contentWrapper = createTag('div', { class: 'wrapper-content-search' });
    const functionsWrapper = createTag('div', { class: 'wrapper-functions' });

    if ($sectionHeading.textContent.trim()
      .indexOf('{{heading_placeholder}}') >= 0) {
      if (block.classList.contains('spreadsheet-powered') && props.headingTitle) {
        $sectionHeading.textContent = props.headingTitle || '';

        if (props.headingSlug) {
          $sectionSlug = createTag('p');
          $sectionSlug.textContent = props.headingSlug;
        }
      } else if (props.authoringError) {
        $sectionHeading.textContent = props.heading;
      } else {
        $sectionHeading.textContent = await populateHeadingPlaceholder(props);
      }
    }

    tmpltListWrapper.before(tBarWrapper);
    tBarWrapper.append(dcw);
    dcw.append(tBar);
    tBar.append(contentWrapper, functionsWrapper);
    contentWrapper.append($sectionHeading);

    if ($sectionSlug) {
      contentWrapper.append($sectionSlug);
    }
  }
}

async function fetchBlueprint(pathname) {
  if (window.spark.bluePrint) {
    return (window.spark.bluePrint);
  }

  const bpPath = pathname.substr(pathname.indexOf('/', 1))
    .split('.')[0];
  const resp = await fetch(`${bpPath}.plain.html`);
  const body = await resp.text();
  const $main = createTag('main');
  $main.innerHTML = body;
  await decorateMain($main);

  window.spark.bluePrint = $main;
  return ($main);
}

async function attachFreeInAppPills(block) {
  const freeInAppText = await fetchPlaceholders().then((json) => json['free-in-app']);

  const templateLinks = block.querySelectorAll('a.template');
  for (const templateLink of templateLinks) {
    if (!block.classList.contains('apipowered')
      && templateLink.querySelectorAll('.icon-premium').length <= 0
      && !templateLink.classList.contains('placeholder')
      && !templateLink.querySelector('.icon-free-badge')
      && freeInAppText) {
      const $freeInAppBadge = createTag('span', { class: 'icon icon-free-badge' });
      $freeInAppBadge.textContent = freeInAppText;
      templateLink.querySelector('div').append($freeInAppBadge);
    }
  }
}

function populateTemplates(block, props) {
  const templates = Array.from(block.children);
  for (let tmplt of templates) {
    const isPlaceholder = tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
    const $linkContainer = tmplt.querySelector(':scope > div:nth-of-type(2)');
    const $rowWithLinkInFirstCol = tmplt.querySelector(':scope > div:first-of-type > a');

    if ($linkContainer) {
      const $link = $linkContainer.querySelector(':scope a');
      if ($link) {
        const aTag = createTag('a', {
          href: $link.href ? addSearchQueryToHref($link.href) : '#',
        });

        aTag.append(...tmplt.children);
        tmplt.remove();
        tmplt = aTag;
        block.append(aTag);

        // convert A to SPAN
        const $newLink = createTag('span', { class: 'template-link' });
        $newLink.append($link.textContent.trim());

        $linkContainer.innerHTML = '';
        $linkContainer.append($newLink);
      }
    }

    if ($rowWithLinkInFirstCol && !tmplt.querySelector('img')) {
      props.tailButton = $rowWithLinkInFirstCol;
      $rowWithLinkInFirstCol.remove();
    }

    if (tmplt.children.length === 3) {
      // look for options in last cell
      const $overlayCell = tmplt.querySelector(':scope > div:last-of-type');
      const option = $overlayCell.textContent.trim();
      if (option) {
        if (isPlaceholder) {
          // add aspect ratio to template
          const sep = option.includes(':') ? ':' : 'x';
          const ratios = option.split(sep).map((e) => +e);
          props.placeholderFormat = ratios;
          if (block.classList.contains('horizontal')) {
            const height = block.classList.contains('mini') ? 100 : 200;
            if (ratios[1]) {
              const width = (ratios[0] / ratios[1]) * height;
              tmplt.style = `width: ${width}px`;
              if (width / height > 1.3) {
                tmplt.classList.add('tall');
              }
            }
          } else {
            const width = block.classList.contains('sixcols') || block.classList.contains('fullwidth') ? 165 : 200;
            if (ratios[1]) {
              const height = (ratios[1] / ratios[0]) * width;
              tmplt.style = `height: ${height - 21}px`;
              if (width / height > 1.3) {
                tmplt.classList.add('wide');
              }
            }
          }
        } else {
          // add icon to 1st cell
          const $icon = getIconElement(toClassName(option));
          $icon.setAttribute('title', option);
          tmplt.children[0].append($icon);
        }
      }
      $overlayCell.remove();
    }

    if (!tmplt.querySelectorAll(':scope > div > *').length) {
      // remove empty row
      tmplt.remove();
    }
    tmplt.classList.add('template');

    // wrap "linked images" with link
    const imgLink = tmplt.querySelector(':scope > div:first-of-type a');
    if (imgLink) {
      const parent = imgLink.closest('div');
      if (!imgLink.href.includes('.mp4')) {
        linkImage(parent);
      } else {
        let videoLink = imgLink.href;
        if (videoLink.includes('/media_')) {
          videoLink = `./media_${videoLink.split('/media_')[1]}`;
        }
        tmplt.querySelectorAll(':scope br').forEach(($br) => $br.remove());
        const picture = tmplt.querySelector('picture');
        if (picture) {
          const $img = tmplt.querySelector('img');
          const video = createTag('video', {
            playsinline: '',
            autoplay: '',
            loop: '',
            muted: '',
            poster: $img.getAttribute('src'),
            title: $img.getAttribute('alt'),
          });
          video.append(createTag('source', {
            src: videoLink,
            type: 'video/mp4',
          }));
          parent.replaceChild(video, picture);
          imgLink.remove();
          video.addEventListener('canplay', () => {
            video.muted = true;
            video.play();
          });
        }
      }
    }

    if (isPlaceholder) {
      tmplt.classList.add('placeholder');
    }
  }
}

async function decorateTemplates(block, props) {
  const locale = getLocale(window.location);
  const placeholders = await fetchPlaceholders();
  let rows = block.children.length;
  if ((rows === 0 || block.querySelectorAll('img').length === 0) && locale !== 'us') {
    const i18nTexts = block.firstElementChild
      // author defined localized edit text(s)
      && (block.firstElementChild.querySelector('p')
        // multiple lines in separate p tags
        ? Array.from(block.querySelectorAll('p'))
          .map((p) => p.textContent.trim())
        // single text directly in div
        : [block.firstElementChild.textContent.trim()]);
    block.innerHTML = '';
    const tls = Array.from(block.closest('main')
      .querySelectorAll('.template-list'));
    const i = tls.indexOf(block);

    const bluePrint = await fetchBlueprint(window.location.pathname);

    const $bpBlocks = bluePrint.querySelectorAll('.template-list');
    if ($bpBlocks[i] && $bpBlocks[i].className === block.className) {
      block.innerHTML = $bpBlocks[i].innerHTML;
    } else if ($bpBlocks.length > 1 && $bpBlocks[i].className !== block.className) {
      for (let x = 0; x < $bpBlocks.length; x += 1) {
        if ($bpBlocks[x].className === block.className) {
          block.innerHTML = $bpBlocks[x].innerHTML;
          break;
        }
      }
    } else {
      block.remove();
    }

    if (i18nTexts && i18nTexts.length > 0) {
      const [placeholderText] = i18nTexts;
      let [, templateText] = i18nTexts;
      if (!templateText) {
        templateText = placeholderText;
      }
      block.querySelectorAll('a')
        .forEach((aTag, index) => {
          aTag.textContent = index === 0 ? placeholderText : templateText;
        });
    }

    const heroPicture = document.querySelector('.hero-bg');

    if (!heroPicture && bluePrint) {
      const bpHeroImage = bluePrint.querySelector('div:first-of-type img');
      if (bpHeroImage) {
        const $heroSection = document.querySelector('main .hero');
        const $heroDiv = document.querySelector('main .hero > div');

        if ($heroSection && !$heroDiv) {
          const p = createTag('p');
          const pic = createTag('picture', { class: 'hero-bg' });
          pic.appendChild(bpHeroImage);
          p.append(pic);
          $heroSection.classList.remove('hero-noimage');
          $heroDiv.prepend(p);
        }
      }
    }
  }

  const templates = Array.from(block.children);
  // process single column first row as title
  if (templates[0] && templates[0].children.length === 1) {
    const parent = block.closest('.section');
    const titleRow = templates.shift();
    titleRow.classList.add('template-title');
    titleRow.querySelectorAll(':scope a')
      .forEach((aTag) => {
        aTag.className = 'template-title-link';
        const p = aTag.closest('p');
        if (p) {
          p.classList.remove('button-container');
        }
      });

    if (parent && parent.classList.contains('toc-container')) {
      const tocCollidingArea = createTag('div', { class: 'toc-colliding-area' });
      const tocSlot = createTag('div', { class: 'toc-slot' });
      const h2 = titleRow.querySelector('h2');
      if (h2) {
        h2.parentElement.prepend(tocCollidingArea);
        tocCollidingArea.append(tocSlot, h2);
      }
    }

    if (block.classList.contains('collaboration')) {
      const $titleHeading = titleRow.querySelector('h3');
      const anchorLink = createTag('a', {
        class: 'collaboration-anchor',
        href: `${document.URL.replace(/#.*$/, '')}#${$titleHeading.id}`,
      });
      const $clipboardTag = createTag('span', { class: 'clipboard-tag' });
      $clipboardTag.textContent = placeholders['tag-copied'];

      anchorLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(anchorLink.href);
        anchorLink.classList.add('copied');
        setTimeout(() => {
          anchorLink.classList.remove('copied');
        }, 2000);
      });

      anchorLink.append($clipboardTag);
      $titleHeading.append(anchorLink);
    }
  }

  rows = templates.length;
  let breakpoints = [{ width: '400' }];

  if (rows > 6 && !block.classList.contains('horizontal')) {
    block.classList.add('masonry');
  }

  if (rows === 1) {
    block.classList.add('large');
    breakpoints = [{
      media: '(min-width: 600px)',
      width: '2000',
    }, { width: '750' }];
  }

  block.querySelectorAll(':scope picture > img').forEach(($img) => {
    const { src, alt } = $img;
    $img.parentNode.replaceWith(createOptimizedPicture(src, alt, true, breakpoints));
  });

  // find the edit link and turn the template DIV into the A
  // A
  // +- DIV
  //    +- PICTURE
  // +- DIV
  //    +- SPAN
  //       +- "Edit this template"
  //
  // make copy of children to avoid modifying list while looping

  populateTemplates(block, props);
  if (!block.classList.contains('horizontal')) {
    if (rows > 6 || block.classList.contains('sixcols') || block.classList.contains('fullwidth')) {
      /* flex masonry */
      const cells = Array.from(block.children);
      block.classList.remove('masonry');
      block.classList.add('flex-masonry');

      props.masonry = new Masonry(block, cells);
      props.masonry.draw();
      window.addEventListener('resize', () => {
        props.masonry.draw();
      });
    } else {
      block.classList.add('template-list-complete');
    }
  }

  await attachFreeInAppPills(block);

  const templateLinks = block.querySelectorAll('a.template');
  const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
  document.dispatchEvent(linksPopulated);
}

async function buildTemplateList(block, props, type) {
  const parent = block.closest('.section.template-x-container');
  if (parent) {
    parent.classList.remove('template-x-container');
    parent.classList.add(`template-x-${type}-container`);
  }
  block.classList.add(type);

  const templates = await processApiResponse(props);
  if (templates) {
    props.templates = props.templates.concat(templates);
    props.templates.forEach((template) => {
      const clone = template.cloneNode(true);
      block.append(clone);
    });
  }

  await generateToolBar(block, props);
  await decorateTemplates(block, props);

  if (type === 'horizontal') {
    buildCarousel(':scope > .template', block, false);
  } else {
    addAnimationToggle(block);
  }
}

function determineTemplateXType(props) {
  console.log(props);
  return 'fullwidth';
}

export default async function decorate(block) {
  const props = constructProps(block);
  block.innerHTML = '';
  await buildTemplateList(block, props, determineTemplateXType(props));
}
