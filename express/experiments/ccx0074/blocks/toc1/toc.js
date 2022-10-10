function toggleToc(toggle, block, status) {
  toggle.style.display = status ? 'none' : 'block';
  block.parentElement.parentElement.classList.toggle('open', status);
}
export default function decorate($block) {
  const toggle = document.querySelector('.default-content-wrapper .button.accent');
  toggle.classList.remove('accent');
  toggle.href = '#toc';
  toggle.target = '';
  toggle.addEventListener('click', (ev) => {
    toggleToc(toggle, $block);
  });

  const heading = document.createElement('h2');
  heading.classList.add('toc-heading');
  heading.innerText = toggle.innerText;
  $block.insertBefore(heading, $block.firstChild);

  [...$block.querySelectorAll('a')].forEach((a) => {
    a.className = '';
    a.removeAttribute('target');
    a.addEventListener('click', (ev) => {
      toggleToc(toggle, $block, false);
    });
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
}