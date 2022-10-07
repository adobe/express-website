export default function decorate($block) {
  $block.parentElement.addEventListener('click', (ev) => {
    if (ev.target === $block.parentElement) {
      $block.parentElement.classList.toggle('open', false);
    }
  });

  const toggle = document.querySelector('.default-content-wrapper .button.accent');
  toggle.href = '#toc';
  toggle.target = '';
  toggle.addEventListener('click', (ev) => {
    $block.parentElement.classList.toggle('open');
  });
}