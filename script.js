/* script.js - gestione globale: login, sidebar, uploads, posts, subjects dropdown, profile updates */

// --- state + elements
let users = JSON.parse(localStorage.getItem("users")) || [
  { username:"admin", password:"davinci2026", canUpload:true }
];
let currentUser = localStorage.getItem("username");

const sidebarEls = document.querySelectorAll('.sidebar');
const sidebarProfile = document.querySelectorAll('#sidebar-profile');
const profileNameEls = document.querySelectorAll('#profile-name');
const secondaryNavEls = document.querySelectorAll('.secondary-nav');
const authModal = document.getElementById("auth-modal");
const modalTitle = document.getElementById("modal-title");
const submitBtn = document.getElementById("submit-btn");
const toggleAuth = document.getElementById("toggle-auth");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// helper - friendly names for subjects
const friendly = {
  "diritto_economia":"Diritto ed Economia",
  "italiano":"Lingua e Letteratura Italiana",
  "matematica":"Matematica",
  "fisica":"Fisica",
  "scienze_integrali":"Scienze Integrate (Chimica)",
  "scienze_terra":"Scienze della Terra",
  "biologia":"Biologia"
};

// Sidebar collapse
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');

toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  document.querySelectorAll('.subjects-dropdown').forEach(dd => dd.classList.remove('open'));
  removeOverlay();
});

// Dropdown Subjects
const subjectsDropdown = document.getElementById('subjects-dropdown');
const subjectsToggle = document.getElementById('subjects-toggle');
const subjectsMenu = document.getElementById('subjects-menu');

subjectsToggle.addEventListener('click', e => {
  e.preventDefault();
  if (sidebar.classList.contains('collapsed')) {
    createOverlay();
  } else {
    subjectsDropdown.classList.toggle('open');
  }
});

function createOverlay() {
  removeOverlay();
  const overlay = document.createElement('div');
  overlay.classList.add('subjects-overlay');
  const list = document.createElement('ul');
  list.classList.add('overlay-list');
  subjectsMenu.querySelectorAll('a').forEach(a => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = a.textContent;
    link.href = a.href;
    li.appendChild(link);
    list.appendChild(li);
  });
  overlay.appendChild(list);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', removeOverlay);
}

function removeOverlay() {
  const existing = document.querySelector('.subjects-overlay');
  if (existing) existing.remove();
}

// Section navigation
document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
  link.addEventListener('click', e => {
    const sectionId = link.dataset.section || link.dataset.sub;
    if (sectionId) {
      e.preventDefault();
      document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
      const target = document.getElementById(sectionId);
      if (target) target.style.display = 'block';
      removeOverlay();
    }
  });
});

// Show dashboard by default
document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
const dashboard = document.getElementById('dashboard-section');
if (dashboard) dashboard.style.display = 'block';

// close overlays on Esc
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ const ex = document.getElementById('subjects-overlay'); if(ex) ex.remove(); }});

// --- update sidebar (name/photo & secondary nav)
function updateSidebars(){
  document.querySelectorAll('.profile-name').forEach(el=>{
    el.textContent = currentUser || '';
  });
  document.querySelectorAll('.sidebar-profile img').forEach(img=>{
    // set photo if stored
    const user = users.find(u=>u.username === currentUser);
    img.src = (user && user.photo) ? user.photo : 'logo.png';
  });

  // rebuild secondary-nav for each sidebar
  document.querySelectorAll('.secondary-nav').forEach(sec=>{
    sec.innerHTML = '';
    if(currentUser === 'admin'){
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.innerHTML = `<a href="#" class="nav-link" id="upload-link"><span class="material-symbols-rounded">photo_camera</span><span class="nav-label">Carica Foto</span></a>`;
      sec.appendChild(li);
      li.querySelector('a').addEventListener('click', (ev)=>{ ev.preventDefault(); showUploadSection(); });
    }
    if(currentUser){
      const liOut = document.createElement('li');
      liOut.className = 'nav-item';
      liOut.innerHTML = `<a href="#" class="nav-link" id="sign-out"><span class="material-symbols-rounded">logout</span><span class="nav-label">Sign Out</span></a>`;
      sec.appendChild(liOut);
      liOut.querySelector('a').addEventListener('click', (ev)=>{ ev.preventDefault(); logout(); });
    } else {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.innerHTML = `<a href="#" class="nav-link" id="login-link"><span class="material-symbols-rounded">login</span><span class="nav-label">Accedi</span></a>`;
      sec.appendChild(li);
      li.querySelector('a').addEventListener('click', (ev)=>{ ev.preventDefault(); if(authModal) authModal.style.display='flex'; });
    }
  });
}

// --- login/register modal logic + server call to save users.txt on login
let isLoginMode = true;
if(toggleAuth) toggleAuth.addEventListener('click', ()=>{
  isLoginMode = !isLoginMode;
  if(isLoginMode){ modalTitle.textContent="Accedi"; submitBtn.textContent="Accedi"; toggleAuth.textContent="Non hai un account? Registrati"; }
  else { modalTitle.textContent="Registrati"; submitBtn.textContent="Registrati"; toggleAuth.textContent="Hai già un account? Accedi"; }
});

// submit handler
if(submitBtn){
  submitBtn.addEventListener('click', async ()=>{
    const u = (usernameInput.value||'').trim();
    const p = passwordInput.value||'';
    if(!u || !p) return alert('Inserisci username e password');
    if(isLoginMode){
      const user = users.find(x=>x.username===u && x.password===p);
      if(!user) return alert('Credenziali non valide');
      currentUser = u;
      localStorage.setItem('username', currentUser);
      if(authModal) authModal.style.display='none';
      updateSidebars();
      // send to server to append users.txt
      try{
        await fetch('save_user.php', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ username:u, password:p })
        });
      }catch(err){ console.warn('save_user failed', err); }
      // refresh visible posts
      if(typeof showPosts === 'function') showPosts('dashboard');
    } else {
      // register locally
      if(users.find(x=>x.username===u)) return alert('Utente già registrato');
      users.push({ username:u, password:p, canUpload:false });
      localStorage.setItem('users', JSON.stringify(users));
      alert('Registrazione completata! Ora accedi.');
      isLoginMode = true; modalTitle.textContent="Accedi"; submitBtn.textContent="Accedi"; toggleAuth.textContent="Non hai un account? Registrati";
    }
  });
}

// logout
function logout(){
  localStorage.removeItem('username');
  currentUser = null;
  updateSidebars();
  window.location.href = 'dashboard.html';
}

// --- Upload card (admin only) ---
function showUploadSection(){
  if(currentUser !== 'admin') return alert('Non hai permessi');
  // remove existing
  document.querySelectorAll('.upload-card').forEach(n=>n.remove());
  const uploadDiv = document.createElement('div');
  uploadDiv.className = 'upload-card';
  uploadDiv.innerHTML = `
    <h3>Carica contenuti</h3>
    <input type="text" id="upload-text" placeholder="Testo facoltativo...">
    <select id="upload-destination">
      <option value="dashboard">Dashboard</option>
      <option value="subjects">Subjects</option>
      <option value="resources">Resources</option>
      <option value="community_diritto_economia">Community: Diritto ed Economia</option>
      <option value="community_italiano">Community: Italiano</option>
      <option value="community_matematica">Community: Matematica</option>
      <option value="community_fisica">Community: Fisica</option>
      <option value="community_scienze_integrali">Community: Scienze Integrate (Chimica)</option>
      <option value="community_scienze_terra">Community: Scienze della Terra</option>
      <option value="community_biologia">Community: Biologia</option>
    </select>
    <input type="file" id="upload-file" accept="image/*">
    <button id="upload-btn" class="btn btn-primary">Carica</button>
  `;
  document.getElementById('main-content').prepend(uploadDiv);

  uploadDiv.querySelector('#upload-btn').addEventListener('click', ()=>{
    const text = uploadDiv.querySelector('#upload-text').value;
    const dest = uploadDiv.querySelector('#upload-destination').value;
    const fileEl = uploadDiv.querySelector('#upload-file');
    if(!fileEl.files.length) return alert('Seleziona immagine');
    const file = fileEl.files[0];
    const reader = new FileReader();
    reader.onload = e=>{
      const imgData = e.target.result;
      if(dest.startsWith('community_')){
        const sub = dest.replace('community_','');
        let posts = JSON.parse(localStorage.getItem('posts_community')) || {};
        if(!posts[sub]) posts[sub] = [];
        posts[sub].push({ owner: currentUser, text, imgData, allowedUsers: [] });
        localStorage.setItem('posts_community', JSON.stringify(posts));
        window.location.href = sub + '.html';
      } else {
        const key = 'posts_' + dest;
        let posts = JSON.parse(localStorage.getItem(key)) || [];
        posts.push({ owner: currentUser, text, imgData, allowedUsers: [] });
        localStorage.setItem(key, JSON.stringify(posts));
        if(dest === 'dashboard') showPosts('dashboard');
        else if(dest === 'subjects') showPosts('subjects');
        else window.location.href = dest + '.html';
      }
      alert('Caricato!');
      uploadDiv.remove();
    };
    reader.readAsDataURL(file);
  });
}

// --- show posts (dashboard & subjects & community) ---
function showPosts(section, sub){
  // section: 'dashboard' | 'subjects' | 'resources' | 'community'
  // when community, sub is required (subject key)
  const containerId = section === 'community' ? (document.getElementById('posts-container') || document.querySelector('#subject-section #posts-container')) : document.getElementById(section + '-section');
  if(!containerId) return;
  // clean
  containerId.innerHTML = '';
  if(section === 'community'){
    const postsAll = JSON.parse(localStorage.getItem('posts_community')) || {};
    const posts = postsAll[sub] || [];
    const header = document.createElement('h2'); header.textContent = friendly[sub] || sub; containerId.appendChild(header);
    posts.forEach((post, idx)=>{
      appendPost(containerId, post, `community|${sub}|${idx}`);
    });
  } else {
    const key = 'posts_' + section;
    const posts = JSON.parse(localStorage.getItem(key)) || [];
    const header = document.createElement('h2'); header.textContent = section.charAt(0).toUpperCase()+section.slice(1); containerId.appendChild(header);
    posts.forEach((post, idx)=>{
      appendPost(containerId, post, `${section}|${idx}`);
    });
  }
}

function appendPost(container, post, token){
  if(!currentUser) return;
  if(post.owner !== currentUser && (!post.allowedUsers || !post.allowedUsers.includes(currentUser))) return;
  const card = document.createElement('div'); card.className = 'post-card';
  const del = currentUser === 'admin' ? `<button class="btn btn-sm btn-danger delete-btn" data-token="${token}">Elimina</button>` : '';
  card.innerHTML = `<p><strong>${post.owner}</strong>: ${post.text || ''}</p>${post.imgData?`<img src="${post.imgData}" alt="">`:''}${del}`;
  container.appendChild(card);
}

// deletion (delegated)
document.addEventListener('click', (e)=>{
  if(e.target.matches('.delete-btn')){
    const token = e.target.dataset.token;
    const parts = token.split('|');
    if(parts[0] === 'community'){
      const sub = parts[1], idx = parseInt(parts[2],10);
      const posts = JSON.parse(localStorage.getItem('posts_community')) || {};
      if(posts[sub]){ posts[sub].splice(idx,1); localStorage.setItem('posts_community', JSON.stringify(posts)); showPosts('community', sub); }
    } else {
      const section = parts[0], idx = parseInt(parts[1],10);
      const key = 'posts_' + section;
      const posts = JSON.parse(localStorage.getItem(key)) || [];
      posts.splice(idx,1);
      localStorage.setItem(key, JSON.stringify(posts));
      showPosts(section);
    }
  }
});

// --- profile page actions (change photo, change name, delete, logout) ---
document.addEventListener('DOMContentLoaded', ()=>{
  updateSidebars();
  showPosts('dashboard');

  // profile elements
  const profileFile = document.getElementById('profile-file');
  const changePhotoBtn = document.getElementById('change-photo');
  const newUsernameInput = document.getElementById('new-username');
  const changeUsernameBtn = document.getElementById('change-username');
  const deleteAccountBtn = document.getElementById('delete-account');
  const logoutBtn = document.getElementById('logout-btn');
  const profileImgMain = document.getElementById('profile-img-main');

  if(currentUser && profileImgMain){
    const userObj = users.find(u=>u.username===currentUser);
    if(userObj && userObj.photo) profileImgMain.src = userObj.photo;
  }

  if(changePhotoBtn){
    changePhotoBtn.addEventListener('click', ()=>{
      if(!profileFile || !profileFile.files.length) return alert('Seleziona immagine');
      const file = profileFile.files[0];
      const reader = new FileReader();
      reader.onload = e=>{
        const data = e.target.result;
        const u = users.find(x=>x.username === currentUser);
        if(u){ u.photo = data; localStorage.setItem('users', JSON.stringify(users)); document.querySelectorAll('.sidebar-profile img').forEach(img=>img.src=data); if(profileImgMain) profileImgMain.src = data; alert('Foto aggiornata'); }
      };
      reader.readAsDataURL(file);
    });
  }

  if(changeUsernameBtn){
    changeUsernameBtn.addEventListener('click', ()=>{
      const newName = (newUsernameInput.value||'').trim();
      if(!newName) return alert('Inserisci nuovo nome');
      if(users.find(x=>x.username===newName)) return alert('Nome già esistente');
      const u = users.find(x=>x.username===currentUser);
      if(u){ u.username = newName; localStorage.setItem('users', JSON.stringify(users)); localStorage.setItem('username', newName); currentUser = newName; updateSidebars(); alert('Nome cambiato'); }
    });
  }

  if(deleteAccountBtn){
    deleteAccountBtn.addEventListener('click', ()=>{
      if(!confirm('Eliminare account?')) return;
      users = users.filter(x=>x.username !== currentUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.removeItem('username');
      currentUser = null;
      updateSidebars();
      alert('Account eliminato');
      window.location.href = 'dashboard.html';
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=> logout());
  }
});

// initial sidebar update function (exposed)
function updateSidebars(){ updateSidebars = updateSidebars; /* placeholder to satisfy linter */ }
updateSidebars = updateSidebars || function(){ /* fallback */ };
updateSidebars = (function realUpdate(){
  return function(){
    currentUser = localStorage.getItem('username');
    document.querySelectorAll('.profile-name').forEach(el=>el.textContent = currentUser || '');
    document.querySelectorAll('.sidebar-profile').forEach(sp=>{
      if(currentUser) sp.style.display='flex'; else sp.style.display='none';
    });
    document.querySelectorAll('.sidebar-profile img').forEach(img=>{
      const u = users.find(x=>x.username===currentUser);
      img.src = (u && u.photo) ? u.photo : 'logo.png';
    });
    // secondary nav build (done earlier)
    document.querySelectorAll('.secondary-nav').forEach(sec=>{
      sec.innerHTML = '';
      if(currentUser === 'admin'){
        const li = document.createElement('li'); li.className='nav-item';
        li.innerHTML = `<a href="#" class="nav-link" id="upload-link"><span class="material-symbols-rounded">photo_camera</span><span class="nav-label">Carica Foto</span></a>`;
        sec.appendChild(li);
        li.querySelector('a').addEventListener('click', e=>{ e.preventDefault(); showUploadSection(); });
      }
      if(currentUser){
        const liOut = document.createElement('li'); liOut.className='nav-item';
        liOut.innerHTML = `<a href="#" class="nav-link" id="sign-out"><span class="material-symbols-rounded">logout</span><span class="nav-label">Sign Out</span></a>`;
        sec.appendChild(liOut);
        liOut.querySelector('a').addEventListener('click', e=>{ e.preventDefault(); logout(); });
      } else {
        const li = document.createElement('li'); li.className='nav-item';
        li.innerHTML = `<a href="#" class="nav-link" id="login-link"><span class="material-symbols-rounded">login</span><span class="nav-label">Accedi</span></a>`;
        sec.appendChild(li);
        li.querySelector('a').addEventListener('click', e=>{ e.preventDefault(); if(authModal) authModal.style.display='flex'; });
      }
    });
  };
})();

// expose showPosts to pages
window.showPosts = showPosts;
