(() => {
  const boot = () => {
    if (window.location.pathname.replace(/\/$/, '') !== '/experience') return;

    const museum = document.querySelector('#museum');
    if (!(museum instanceof HTMLElement)) return;

    // Remove the exhibits that did not earn their place in the collection.
    document.querySelector('#generative')?.remove();
    document.querySelector('#network')?.remove();
    document.querySelector('#algorithms')?.remove();
    document.querySelector('#dom-observatory')?.remove();

    const title = document.querySelector('#museum-title');
    if (title) title.innerHTML = 'Four ways to make a browser <span>do something.</span>';

    const browserLab = document.querySelector('#browser-lab');
    browserLab?.querySelector('.exhibit-meta span:first-child')?.replaceChildren(document.createTextNode('04'));
  };

  boot();
  document.addEventListener('astro:page-load', boot);
})();
