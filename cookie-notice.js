/* Cookie notice: a small dismissible bar. No consent is collected because the site
   sets no tracking cookies; the choice to hide the bar is kept in localStorage. */
(function () {
  var KEY = 'cookie-notice-dismissed';
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {}

  var css = '' +
    '.cookie-notice{position:fixed;left:0.75rem;right:0.75rem;bottom:calc(0.75rem + env(safe-area-inset-bottom) + var(--cn-offset,0rem));z-index:60;' +
    'display:flex;flex-wrap:wrap;gap:0.6rem 1rem;align-items:center;justify-content:space-between;' +
    'max-width:34rem;padding:0.85rem 1rem;border-radius:0;border:1px solid var(--line-soft, rgba(243,241,234,.3));background:var(--bg-2, #161716);color:var(--ink, #f3f1ea);' +
    'font-family:var(--font-body, "Archivo", sans-serif);font-size:0.875rem;line-height:1.45;box-shadow:0 14px 30px -12px rgba(0,0,0,.55)}' +
    '.cookie-notice p{margin:0;flex:1 1 14rem}' +
    '.cookie-notice a{color:var(--accent, #c6ff3d);text-decoration:underline;text-underline-offset:2px}' +
    '.cookie-notice a:focus-visible,.cookie-notice button:focus-visible{outline:2px solid var(--accent, #c6ff3d);outline-offset:3px}' +
    '.cookie-notice button{flex:0 0 auto;margin:0;padding:0.55rem 1rem;border:0;border-radius:0;cursor:pointer;' +
    'font:inherit;font-weight:600;background:var(--accent, #c6ff3d);color:var(--black, #000)}' +
    '.cookie-notice{--cn-offset:0rem}' +
    '@media (min-width:0em){.cookie-notice{--cn-offset:0rem;left:1.25rem;right:auto}}' +
    '@media (prefers-reduced-motion:no-preference){.cookie-notice{animation:cn-in .4s cubic-bezier(.22,1,.36,1) both}' +
    '@keyframes cn-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}' +
    '@media print{.cookie-notice{display:none}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.className = 'cookie-notice';
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', 'Cookie notice');
  box.innerHTML =
    '<p>This site doesn\'t use tracking cookies. <a href="/privacy.html">Privacy policy</a></p>' +
    '<button type="button">Got it</button>';
  box.querySelector('button').addEventListener('click', function () {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    box.remove();
  });
  document.body.appendChild(box);
})();
