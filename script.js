
document.addEventListener('DOMContentLoaded', ()=>{
  const t = document.getElementById('theme-toggle');
  if(t) t.addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
  document.querySelectorAll('.fade-up').forEach((el,i)=> setTimeout(()=> el.classList.add('visible'), 120*i));

  initAuthBox();
  initMobileNav();
  initStickyHeader();
});

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

  toggle.addEventListener('click', ()=> setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=> setOpen(false)));
  window.addEventListener('resize', ()=>{ if(window.innerWidth > 760) setOpen(false); });
}

// Gives the sticky header a background once the page has scrolled, so it
// stays readable over whatever content passes underneath it instead of
// blending into the hero image or page background.
function initStickyHeader(){
  const header = document.querySelector('.header');
  if(!header) return;
  function update(){ header.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// Login / logout control, shown in the header on every page.
// Lets the site owner log in with Netlify Identity and jump straight
// to /admin to add a project with pictures and a description.
function initAuthBox(){
  const box = document.getElementById('auth-box');
  if(!box || !window.netlifyIdentity) return;

  function render(user){
    if(user){
      box.innerHTML = `<a href="admin/index.html" class="auth-link">+ New project</a><button type="button" id="auth-logout" class="auth-link auth-btn">Log out</button>`;
      const out = document.getElementById('auth-logout');
      if(out) out.addEventListener('click', ()=> netlifyIdentity.logout());
    } else {
      box.innerHTML = `<button type="button" id="auth-login" class="auth-link auth-btn">Log in</button>`;
      const btn = document.getElementById('auth-login');
      if(btn) btn.addEventListener('click', ()=> netlifyIdentity.open());
    }
    // The login/signup popup can leave an invisible overlay on top of the
    // page after a successful login, which blocks every click until it's
    // explicitly told to close.
    netlifyIdentity.close();
  }

  netlifyIdentity.on('init', render);
  netlifyIdentity.on('login', render);
  netlifyIdentity.on('logout', ()=> render(null));
  netlifyIdentity.init();
}
