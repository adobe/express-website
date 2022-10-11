import {
  fixIcons,
  getIconElement,
  getLottie,
} from '../../../../scripts/scripts.js';

function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

function toggleToc(toggle, block, status) {
  if (status === undefined) {
    status = !block.parentElement.parentElement.classList.contains('open');
  }
  toggle.style.display = status ? 'none' : 'block';
  block.parentElement.parentElement.classList.toggle('open', status);
}

export default function decorate($block) {
  const iconHTML = getLottie('arrow-down', '/express/icons/arrow-down.json');
  const toggle = document.querySelector('.default-content-wrapper .button.accent');
  toggle.href = '#toc';
  toggle.target = '';
  toggle.innerHTML = iconHTML + toggle.innerHTML;
  toggle.addEventListener('click', (ev) => {
    toggleToc(toggle, $block);
  });

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
    if (div.querySelector('.icon-dl-green')) {
      const os = getMobileOperatingSystem();
      const anchor = document.createElement('a');
      wrapper.append(anchor);
      if (os === 'iOS') {
        anchor.append(getIconElement('apple-store'));
      } else {
        anchor.append(getIconElement('google-store'));
      }
    }
  });

  const toggle2 = document.createElement('a');
  toggle2.classList.add('button');
  toggle2.classList.add('toc-close');
  toggle2.href = '#toc';
  toggle2.innerText = 'Close';
  toggle2.addEventListener('click', (ev) => {
    toggleToc(toggle, $block, false);
  });
  $block.append(toggle2);

  $block.parentElement.addEventListener('click', (ev) => {
    if (ev.target === $block.parentElement) {
      toggleToc(toggle, $block, false);
    }
  });

  fixIcons($block);
}