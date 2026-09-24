document.addEventListener('DOMContentLoaded', ()=>{
  const t = document.getElementById('theme-toggle');
  if(t) t.addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
  document.querySelectorAll('.fade-up').forEach((el,i)=> setTimeout(()=> el.classList.add('visible'), 120*i));

  initAuthBox();
});

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
