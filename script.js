
document.addEventListener('DOMContentLoaded', ()=>{
  const t = document.getElementById('theme-toggle');
  if(t) t.addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
  document.querySelectorAll('.fade-up').forEach((el,i)=> setTimeout(()=> el.classList.add('visible'), 120*i));
});
