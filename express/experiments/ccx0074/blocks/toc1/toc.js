
export default function decorate($block) {
  $block.parentElement.addEventListener('click', (ev) => {
    if (ev.target === $block.parentElement) {
      $block.parentElement.parentElement.classList.toggle('open', false);
    }
  });

  const toggle = document.querySelector('.default-content-wrapper .button.accent');
  toggle.classList.remove('accent');
  toggle.href = '#toc';
  toggle.target = '';
  toggle.addEventListener('click', (ev) => {
    $block.parentElement.parentElement.classList.toggle('open');
  });

  const heading = document.createElement('h2');
  heading.classList.add('toc-heading');
  heading.innerText = toggle.innerText;
  $block.insertBefore(heading, $block.firstChild);

  const toggle2 = document.createElement('a');
  toggle2.classList.add('button');
  toggle2.classList.add('toc-close');
  toggle2.href = '#toc';
  toggle2.innerText = 'Close';
  toggle2.addEventListener('click', (ev) => {
    $block.parentElement.parentElement.classList.toggle('open', false);
  });
  $block.append(toggle2);
}