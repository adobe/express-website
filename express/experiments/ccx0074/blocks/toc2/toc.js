import {
  getIconElement,
  getLottie,
} from '../../../../scripts/scripts.js';

import {
  addAppStoreButton,
  attachEventListeners,
  fixIcons,
  toggleToc,
} from '../../../../blocks/toc/utils.js';

export default async function decorate($block) {
  const iconHTML = getLottie('arrow-down', '/express/icons/arrow-down.json');
  const toggle = document.querySelector('.default-content-wrapper .button.accent');
  toggle.href = '#toc';
  toggle.target = '';
  toggle.innerHTML = iconHTML + toggle.innerHTML;

  [...$block.children].forEach((div) => {
    const wrapper = div.children.item(1);
    const child = wrapper.children.length ? wrapper.children.item(0) : null;
    if (child.nodeName === 'A') {
      child.classList.remove('accent');
      child.removeAttribute('target');
      child.addEventListener('click', (ev) => {
        toggleToc(toggle, $block, false);
      });
    } else if (child.nodeName === 'H2') {
      child.classList.add('toc-heading');
      child.innerHTML = iconHTML + child.innerHTML;
    }
  });

  const $close = document.createElement('a');
  $close.classList.add('button');
  $close.classList.add('toc-close');
  $close.href = '#toc';
  $close.innerText = 'Close';
  $block.append($close);

  attachEventListeners($block, toggle, $close);
  await fixIcons($block);
  addAppStoreButton($block);
}