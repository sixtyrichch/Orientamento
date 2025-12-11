// script.js (sostituisci interamente il file)
document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIG / SELECTORS ---
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('mobile-toggle');
  const subjectsDropdown = document.getElementById('subjects-dropdown');
  const subjectsToggle = document.getElementById('subjects-toggle');
  const secondaryNav = document.querySelector('.secondary-nav');
  const authModal = document.getElementById('auth-modal');
  const submitBtn = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // map of sections found on the page (#...-section)
  const sections = {};
  document.querySelectorAll("[id$='-section']").forEach(sec => {
    const key = sec.id.replace('-section', '');
    sections[key] = sec;
  });

  // --- USERS (simple localStorage fallback) ---
  let users = JSON.parse(localStorage.getItem("users")) || [
    { email:"maurizio.minissale@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Minissale", canUpload:true },
    { email:"rosita.artigliere@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Artigliere", canUpload:true },
    { email:"antonio.caristia@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Caristia", canUpload:true }
  ];

  let currentUser = localStorage.getItem("email") || null;

  // --- HELPERS ---
  function clearSecondaryNav() { if(secondaryNav) secondaryNav.innerHTML = ''; }

  function createNavItem(html) {
    const li = document.createElement("li");
    li.classList.add("nav-item");
    li.innerHTML = html;
    return li;
  }

  // --- AUTH / SIDEBAR ---
  function showLoginButton(){
    if(!secondaryNav) return;
    clearSecondaryNav();
    const li = createNavItem(`
      <a href="#" class="nav-link" id="login-link">
        <span class="material-symbols-rounded">login</span>
        <span class="nav-label">Accedi</span>
      </a>`);
    secondaryNav.appendChild(li);
    document.getElementById("login-link")?.addEventListener("click", e => {
      e.preventDefault();
      if(authModal) authModal.style.display = "flex";
    });
  }

  function updateSidebar(){
    clearSecondaryNav();
    if(currentUser){
      const userObj = users.find(u => u.email === currentUser);
      if(userObj?.canUpload){
        const liUpload = createNavItem(`
          <a href="upload.html" class="nav-link" id="upload-link">
            <span class="material-symbols-rounded">photo_camera</span>
            <span class="nav-label">Carica Contenuti</span>
          </a>`);
        secondaryNav.appendChild(liUpload);
      }
      const liOut = createNavItem(`
        <a href="#" class="nav-link" id="sign-out">
          <span class="material-symbols-rounded">logout</span>
          <span class="nav-label">Sign Out</span>
        </a>`);
      secondaryNav.appendChild(liOut);
      document.getElementById("sign-out")?.addEventListener("click", e => {
        e.preventDefault();
        localStorage.removeItem("email");
        currentUser = null;
        showLoginButton();
        showPosts(); // refresh posts view
      });
    } else {
      showLoginButton();
    }
  }

  document.getElementById("close-modal")?.addEventListener("click", () => {
    if(authModal) authModal.style.display = "none";
  });

  submitBtn?.addEventListener("click", () => {
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    if(!email || !password){ alert("Inserisci email e password!"); return; }
    const userObj = users.find(u => u.email === email && u.password === password);
    if(!userObj){ alert("Credenziali non valide!"); return; }
    currentUser = email;
    localStorage.setItem("email", currentUser);
    if(authModal) authModal.style.display = "none";
    updateSidebar();
    showPosts();
  });

  toggleBtn?.addEventListener("click", () => {
    const nav = document.querySelector(".sidebar-nav");
    nav.classList.toggle("show");
    sidebar.classList.toggle("open-mobile");
  });

  subjectsToggle?.addEventListener("click", e => {
    e.preventDefault();
    subjectsDropdown.classList.toggle("open");
  });

  // --- CORE: determinare JSON da leggere e div target ---
  function detectContext(){
    // 1) if body[data-posts-path] provided, use that and optional data-target-div
    const body = document.body || {};
    if(body.dataset && body.dataset.postsPath){
      return {
        postsPath: body.dataset.postsPath,
        targetDiv: body.dataset.targetDiv || (body.dataset.postsPath.includes('_posts.json') ? ('section-' + (body.dataset.postsPath.split('/').pop().replace('_posts.json',''))) : 'dashboard-section')
      };
    }

    // 2) fallback automatic: compute from location
    const pathname = location.pathname; // e.g. /a/Informatica_e_telecomunicazioni/Dashboard_Inf.html
    const parts = pathname.split('/').filter(Boolean);
    const filename = parts.pop() || '';
    const page = filename.replace('.html','');

    // if root dashboard
    if(page.toLowerCase() === 'dashboard' || page.toLowerCase() === 'home'){
      return { postsPath: 'posts.json', targetDiv: 'dashboard-section' };
    }

    // if page is Dashboard_XXX and page is inside a sector folder, postsPath = 'posts.json' in that folder
    if(page.startsWith('Dashboard_')){
      // if path contains folder (parts last element is folder)
      const folder = parts.length ? parts.join('/') : ''; // folder path relative to root where file is
      const postsPath = folder ? (folder + '/posts.json') : 'posts.json';
      // target div: prefer element id dashboard-<code>-section; fallback dashboard-section
      const code = page.split('_')[1] ? page.split('_')[1].toLowerCase() : 'section';
      const targetDiv = 'dashboard-' + code + '-section';
      return { postsPath, targetDiv };
    }

    // otherwise assume subject page: posts file named PAGE_posts.json in same folder
    const folder = parts.length ? parts.join('/') : '';
    const postsPath = folder ? (folder + '/' + page + '_posts.json') : (page + '_posts.json');
    const targetDiv = 'section-' + page;
    return { postsPath, targetDiv };
  }

  // safe fetch that handles HTML error pages gracefully
  async function safeFetchJson(path){
    try {
      const res = await fetch(path, {cache: "no-store"});
      const ct = res.headers.get('content-type') || '';
      if(!res.ok){
        // fetch returned 404/500: read text for debugging
        const txt = await res.text();
        console.error('Fetch non ok', path, res.status, txt.slice(0,200));
        throw new Error('Fetch non ok: ' + res.status);
      }
      if(ct.includes('application/json') || ct.includes('text/json')){
        return await res.json();
      } else {
        // try to parse as json anyway, but guard
        const t = await res.text();
        try {
          return JSON.parse(t);
        } catch(e){
          console.error('Risposta non JSON per', path, 'contenuto:', t.slice(0,200));
          throw new Error('Risposta non JSON');
        }
      }
    } catch(err) {
      console.error('safeFetchJson error for', path, err);
      throw err;
    }
  }

  // --- showPosts: carica e visualizza i post corretti per la pagina ---
  async function showPosts(){
    const ctx = detectContext();
    const postsPath = ctx.postsPath;
    const targetDivId = ctx.targetDiv;

    // find a valid container: priority: exact id, or first [id$='-section'] in page
    let container = document.getElementById(targetDivId);
    if(!container){
      const any = document.querySelector("[id$='-section']");
      if(any) container = any;
    }
    if(!container){
      // nothing to render into — avoid exceptions
      console.warn('Nessun container per i post trovato (expected id: ' + targetDivId + ').');
      return;
    }

    try {
      const posts = await safeFetchJson(postsPath);
      if(!Array.isArray(posts)) {
        console.warn('Posts non è array:', posts);
        return;
      }

      // clear previous
      container.innerHTML = '';

      // sort by id/timestamp if available (desc)
      posts.sort((a,b) => (b.id||b.timestamp||0) - (a.id||a.timestamp||0));

      posts.forEach(post => {
        // create card
        const card = document.createElement('div');
        card.classList.add('post-card');

        // build files HTML if any
        let filesHTML = '';
        if(Array.isArray(post.files) && post.files.length){
          filesHTML = '<div class="post-files" style="display:flex;gap:10px;flex-wrap:wrap;">';
          post.files.forEach(f => {
            if(f.type && f.type.startsWith('image/') && f.data){
              filesHTML += `<a href="${f.data}" target="_blank"><img src="${f.data}" alt="${f.name||''}" style="width:120px;height:auto;"/></a>`;
            } else if(f.data){
              const icon = f.type && f.type.startsWith('audio/') ? '🎵' : (f.type && f.type.startsWith('video/') ? '🎥' : '📎');
              filesHTML += `<a href="${f.data}" download="${f.name||''}" title="${f.name||''}" style="font-size:1.6rem;text-decoration:none;margin-right:6px;">${icon}</a>`;
            }
          });
          filesHTML += '</div>';
        }

        // owner and content
        const owner = post.ownerName || post.owner || 'Utente';
        const title = post.title || post.name || 'Senza titolo';
        const text = post.text || post.content || post.desc || '';

        card.innerHTML = `
          <div class="post-content">
            <div class="post-title">${escapeHtml(title)}</div>
            <div class="post-text"><strong>${escapeHtml(owner)}</strong>: ${escapeHtml(text)}</div>
          </div>
          ${filesHTML}
        `;

        // delete button if ownerEmail matches
        if(post.ownerEmail && currentUser && post.ownerEmail === currentUser){
          const del = document.createElement('button');
          del.className = 'delete-btn';
          del.textContent = 'Elimina';
          del.dataset.id = post.id || '';
          del.addEventListener('click', () => {
            if(confirm('Eliminare questo post?')){
              fetch('delete_post.php', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ id: post.id })
              }).then(()=> showPosts()).catch(err=>console.error(err));
            }
          });
          card.appendChild(del);
        }

        container.appendChild(card);
      });

    } catch(err){
      console.error('Errore caricamento posts:', err);
      // optionally show user message
      // container.innerHTML = '<p class="error">Impossibile caricare i post.</p>';
    }
  }

  // --- UPLOAD HANDLER (upload.html) ---
  (function bindUpload(){
    const uploadBtn = document.querySelector('.upload-btn');
    if(!uploadBtn) return;

    const fileInput = document.querySelector('.upload-file');
    const previewDiv = document.querySelector('.upload-preview');
    const previewImg = document.getElementById('preview-img');

    fileInput?.addEventListener('change', () => {
      const files = fileInput.files;
      const imgFile = Array.from(files).find(f => f.type && f.type.startsWith("image/"));
      if(imgFile){
        const reader = new FileReader();
        reader.onload = e => {
          if(previewImg){ previewImg.src = e.target.result; previewDiv.style.display = "flex"; }
        };
        reader.readAsDataURL(imgFile);
      } else if(previewDiv) previewDiv.style.display = "none";
    });

    uploadBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const title = (document.querySelector('.upload-title')?.value || '').trim() || 'Senza titolo';
      const desc  = (document.querySelector('.upload-desc')?.value || '').trim() || '';
      // pick sector/subject selects if present
      const sectorSelect = document.getElementById('sector') || document.querySelector('.upload-destination');
      const subjectselect = document.getElementById('subject');
      const sectorVal = sectorSelect ? sectorSelect.value : '';
      const subjectVal = subjectselect ? subjectselect.value : '';

      if(!sectorVal){
        alert('Seleziona il settore.');
        return;
      }
      // compose section as "Sector/Subject" if subject selected (this is what upload.php expects)
      const section = subjectVal ? (sectorVal + '/' + subjectVal) : sectorVal;

      if(!fileInput || fileInput.files.length === 0){
        if(!confirm('Nessun file selezionato. Vuoi procedere comunque?')) return;
      }

      const fd = new FormData();
      fd.append('title', title);
      fd.append('desc', desc);
      fd.append('section', section);
      const userObj = users.find(u => u.email === currentUser);
      fd.append('ownerName', userObj?.name || 'Utente');
      fd.append('ownerEmail', currentUser || 'email@esempio.com');

      if(fileInput && fileInput.files.length){
        for(const f of fileInput.files){
          fd.append('files[]', f);
        }
      }

      try {
        const res = await fetch('upload.php', { method: 'POST', body: fd });
        // decide how to parse response depending on content-type
        const contentType = res.headers.get('content-type') || '';
        let data;
        if(contentType.includes('application/json')){
          data = await res.json();
        } else {
          data = await res.text();
          try { data = JSON.parse(data); } catch(e){ console.warn('Upload response not JSON:', data); data = { success: false, error: 'Risposta server non JSON' }; }
        }
        if(data && data.success){
          alert('Caricato con successo!');
          // reset form
          document.querySelector('.upload-title').value = '';
          document.querySelector('.upload-desc').value = '';
          if(fileInput) fileInput.value = '';
          if(previewDiv) previewDiv.style.display = 'none';
          showPosts();
        } else {
          alert('Errore upload: ' + (data.error || JSON.stringify(data)));
        }
      } catch(err){
        console.error('Errore upload:', err);
        alert('Errore durante l\'upload. Guarda console.');
      }
    });
  })();

  // --- small util: escape HTML to avoid injection ---
  function escapeHtml(s){
    if(!s && s!==0) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // init
  updateSidebar();
  showPosts();
});
