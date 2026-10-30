/* Site-wide behaviour: theme, navigation, scroll effects, and the owner login.
   Everything here is progressive — the site still reads fine without it. */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthBox();
  initMobileNav();
  initActiveNav();
  initHeader();
  initScrollProgress();
  initBackToTop();
  initReveal();
  initHeroParallax();
});

/* ---------- Theme ---------------------------------------------------------
   Follows the visitor's system setting until they pick one themselves. */
function readTheme(){
  try { return localStorage.getItem('theme'); } catch (e) { return null; }
}
function saveTheme(value){
  try { localStorage.setItem('theme', value); } catch (e) { /* storage blocked: skip */ }
}
function initTheme(){
  const toggle = document.getElementById('theme-toggle');
  const stored = readTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function apply(dark){
    document.body.classList.toggle('dark', dark);
    if(toggle){
      toggle.textContent = dark ? '☀' : '☾';
      toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  apply(stored ? stored === 'dark' : prefersDark);

  if(toggle) toggle.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    apply(dark);
    saveTheme(dark ? 'dark' : 'light');
  });
}

/* ---------- Navigation ---------------------------------------------------- */
// Hamburger menu: shows/hides the nav links on narrow screens, and closes
// itself again once a link is tapped or the page is resized back to desktop.
function initMobileNav(){
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if(!toggle || !nav) return;

  function setOpen(open){
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('resize', () => { if(window.innerWidth > 760) setOpen(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') setOpen(false); });
}

// Marks the link for the page you're on.
function initActiveNav(){
  const nav = document.getElementById('site-nav');
  if(!nav) return;
  let page = window.location.pathname.split('/').pop() || 'index.html';
  if(page === 'project.html' || window.location.pathname.includes('/projects/')) page = 'projects.html';
  nav.querySelectorAll('a').forEach(a => {
    if(a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
  });
}

// Header: gains a soft background once you scroll, tucks away while you read
// downward, and returns the moment you scroll back up.
function initHeader(){
  const header = document.querySelector('.header');
  if(!header) return;
  const nav = document.getElementById('site-nav');
  let lastY = window.scrollY;
  let ticking = false;

  function update(){
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 24);
    const menuOpen = nav && nav.classList.contains('open');
    if(!menuOpen && y > 160 && y > lastY + 4) header.classList.add('hide');
    else if(y < lastY - 4 || y <= 160 || menuOpen) header.classList.remove('hide');
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  // keyboard users tabbing into the header should always see it
  header.addEventListener('focusin', () => header.classList.remove('hide'));
  update();
}

/* ---------- Scroll effects ------------------------------------------------ */
function initScrollProgress(){
  if(REDUCED_MOTION) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  let ticking = false;
  function update(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = 'scaleX(' + ratio + ')';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function initBackToTop(){
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '&uarr;';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' }));
  document.body.appendChild(btn);

  let ticking = false;
  function update(){
    btn.classList.toggle('show', window.scrollY > 700);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

// Fades sections and cards in as they enter the viewport. Cards that are
// loaded later from the CMS are picked up automatically.
function initReveal(){
  const sections = document.querySelectorAll('.fade-up');

  if(REDUCED_MOTION || !('IntersectionObserver' in window)){
    sections.forEach(el => el.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  sections.forEach(el => io.observe(el));

  function watchCards(root){
    const cards = (root.matches && root.matches('.grid > .card'))
      ? [root]
      : Array.from(root.querySelectorAll ? root.querySelectorAll('.grid > .card') : []);
    cards.forEach(card => {
      if(card.classList.contains('skeleton') || card.dataset.watched) return;
      card.dataset.watched = '1';
      const index = Array.prototype.indexOf.call(card.parentNode.children, card);
      card.style.setProperty('--d', Math.min(index, 8) * 70 + 'ms');
      card.classList.add('reveal-item');
      io.observe(card);
    });
  }

  watchCards(document.body);
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => { if(node.nodeType === 1) watchCards(node); }));
  }).observe(document.body, { childList: true, subtree: true });
}

// The hero graphic drifts a few pixels with the pointer — barely there,
// just enough to make the page feel alive.
function initHeroParallax(){
  const hero = document.querySelector('.hero');
  if(!hero || REDUCED_MOTION || !window.matchMedia('(pointer: fine)').matches) return;
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    hero.style.setProperty('--mx', (x * -22).toFixed(1) + 'px');
    hero.style.setProperty('--my', (y * -22).toFixed(1) + 'px');
  });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--mx', '0px');
    hero.style.setProperty('--my', '0px');
  });
}

/* ---------- Owner login ---------------------------------------------------
   Login / logout control, shown in the header on every page.
   Lets the site owner log in with Netlify Identity and jump straight
   to /admin to add a project with pictures and a description. */
function initAuthBox(){
  const box = document.getElementById('auth-box');
  if(!box || !window.netlifyIdentity) return;

  function render(user){
    if(user){
      box.innerHTML = `<a href="admin/index.html" class="auth-link">+ New project</a><button type="button" id="auth-logout" class="auth-link auth-btn">Log out</button>`;
      const out = document.getElementById('auth-logout');
      if(out) out.addEventListener('click', () => netlifyIdentity.logout());
    } else {
      box.innerHTML = `<button type="button" id="auth-login" class="auth-link auth-btn">Log in</button>`;
      const btn = document.getElementById('auth-login');
      if(btn) btn.addEventListener('click', () => netlifyIdentity.open());
    }
    // The login/signup popup can leave an invisible overlay on top of the
    // page after a successful login, which blocks every click until it's
    // explicitly told to close.
    netlifyIdentity.close();
  }

  netlifyIdentity.on('init', render);
  netlifyIdentity.on('login', render);
  netlifyIdentity.on('logout', () => render(null));
  netlifyIdentity.init();
}
