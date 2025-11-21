document.addEventListener('DOMContentLoaded', () => {

  // --- ELEMENTI ---
  const sidebarProfile = document.getElementById('sidebar-profile');
  const profileName = document.getElementById('profile-name');
  const toggleAuth = document.getElementById('toggle-auth');
  const modalTitle = document.getElementById('modal-title');
  const submitBtn = document.getElementById('submit-btn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const authModal = document.getElementById('auth-modal');
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const subjectsDropdown = document.getElementById('subjects-dropdown');
  const subjectsToggle = document.getElementById('subjects-toggle');
  const subjectsMenu = document.getElementById('subjects-menu');
  const secondaryNav = document.querySelector('.secondary-nav');

  // --- SECTIONS ---
  const sections = {};
  ['dashboard', 'tecn', 'scie', 'sist', 'info', 'telec'].forEach(id => {
    const el = document.getElementById(id + '-section');
    if(el) sections[id] = el;
  });

  // --- UTENTI ---
  let users = JSON.parse(localStorage.getItem("users")) || [
    { username: "admin", password: "davinci2026", canUpload: true },
    { username: "user1", password: "123", canUpload: false }
  ];
  let currentUser = localStorage.getItem("username");

  // --- SHOW / HIDE SECTION ---
  function showSection(key) {
    Object.keys(sections).forEach(k => {
      if (sections[k]) sections[k].style.display = k === key ? "block" : "none";
    });
  }

  // --- SIDEBAR SECONDARY NAV ---
  function clearSecondaryNav(){
    if(secondaryNav) secondaryNav.innerHTML = '';
  }

  function showLoginButton() {
    if(!secondaryNav) return;
    clearSecondaryNav();
    const li = document.createElement("li");
    li.classList.add("nav-item");
    li.innerHTML = '<a href="#" class="nav-link" id="login-link"><span class="material-symbols-rounded">login</span><span class="nav-label">Accedi</span></a>';
    secondaryNav.appendChild(li);
    const loginLink = document.getElementById("login-link");
    if(loginLink) loginLink.addEventListener("click", e => { e.preventDefault(); if(authModal) authModal.style.display="flex"; });
  }

  function updateSidebar() {
    clearSecondaryNav();
    if(currentUser){
      if(sidebarProfile) sidebarProfile.style.display="flex";
      if(profileName) profileName.textContent=currentUser;

      if(secondaryNav){
        if(currentUser==="admin"){
          const liUpload = document.createElement("li");
          liUpload.classList.add("nav-item");
          liUpload.innerHTML='<a href="#" class="nav-link" id="upload-link"><span class="material-symbols-rounded">photo_camera</span><span class="nav-label">Carica Foto</span></a>';
          secondaryNav.appendChild(liUpload);
          liUpload.addEventListener("click", e=>{
            e.preventDefault();
            const activeSection = Object.keys(sections).find(k=>sections[k].style.display==="block")||'dashboard';
            showUploadSection(activeSection);
          });
        }
        const liOut = document.createElement("li");
        liOut.classList.add("nav-item");
        liOut.innerHTML='<a href="#" class="nav-link" id="sign-out"><span class="material-symbols-rounded">logout</span><span class="nav-label">Sign Out</span></a>';
        secondaryNav.appendChild(liOut);
        const signOutBtn = document.getElementById("sign-out");
        if(signOutBtn){
          signOutBtn.addEventListener("click", e=>{
            e.preventDefault();
            localStorage.removeItem("username");
            currentUser = null;
            if(sidebarProfile) sidebarProfile.style.display="none";
            showLoginButton();
            showPosts();
          });
        }
      }
    } else {
      if(sidebarProfile) sidebarProfile.style.display="none";
      showLoginButton();
      showPosts();
    }
  }

  // --- MODAL LOGIN / REGISTER ---
  let isLoginMode = true;
  if(toggleAuth){
    toggleAuth.addEventListener("click", ()=>{
      isLoginMode=!isLoginMode;
      if(isLoginMode){
        modalTitle.textContent="Accedi";
        submitBtn.textContent="Accedi";
        toggleAuth.textContent="Non hai un account? Registrati";
      } else {
        modalTitle.textContent="Registrati";
        submitBtn.textContent="Registrati";
        toggleAuth.textContent="Hai già un account? Accedi";
      }
      usernameInput.value="";
      passwordInput.value="";
    });
  }
  const closeModalBtn = document.getElementById("close-modal");
  if(closeModalBtn) closeModalBtn.addEventListener("click", ()=>{ if(authModal) authModal.style.display="none"; });

  if(submitBtn){
    submitBtn.addEventListener("click", ()=>{
      const username=usernameInput.value.trim();
      const password=passwordInput.value;
      if(!username||!password) return alert("Inserisci username e password!");
      if(isLoginMode){
        const userObj=users.find(u=>u.username===username&&u.password===password);
        if(!userObj) return alert("Credenziali non valide!");
        currentUser=username;
        localStorage.setItem("username",currentUser);
        if(authModal) authModal.style.display="none";
        updateSidebar();
        showPosts();
      } else {
        if(users.find(u=>u.username===username)) return alert("Utente già registrato!");
        users.push({username,password,canUpload:false});
        localStorage.setItem("users",JSON.stringify(users));
        alert("Registrazione completata!");
        isLoginMode=true;
        modalTitle.textContent="Accedi";
        submitBtn.textContent="Accedi";
        toggleAuth.textContent="Non hai un account? Registrati";
      }
    });
  }

  // --- SUBJECTS DROPDOWN ---
  if(subjectsToggle && subjectsDropdown && subjectsMenu){
    subjectsToggle.addEventListener("click", e=>{
      e.preventDefault();
      const isOpen = subjectsDropdown.classList.toggle("open");
      subjectsMenu.style.display=isOpen?"flex":"none";
    });
  }

  // --- SIDEBAR COLLAPSE ---
  if(toggleBtn && sidebar){
    toggleBtn.addEventListener("click", ()=>{
      sidebar.classList.toggle("collapsed");
      if(subjectsDropdown && subjectsMenu){
        subjectsDropdown.classList.remove("open");
        subjectsMenu.style.display="none";
      }
    });
  }

  // --- UPLOAD E POSTS ---
  window.showUploadSection=showUploadSection;
  function showUploadSection(defaultSection='dashboard'){
    if(!currentUser||currentUser!=="admin"){ alert("Devi essere loggato come admin!"); return; }
    const targetSection = sections[defaultSection];
    if(!targetSection) return console.error("Sezione non trovata:",defaultSection);
    let existing = targetSection.querySelector(".upload-card"); if(existing) existing.remove();
    const uploadDiv = document.createElement("div");
    uploadDiv.classList.add("upload-card");
    uploadDiv.innerHTML=`
      <h3>Carica contenuti</h3>
      <input type="text" class="upload-text" placeholder="Testo facoltativo...">
      <input type="file" class="upload-file" accept="image/*">
      <select class="upload-destination">
        <option value="dashboard">Dashboard</option>
        <option value="tecn">Tecnologie informatiche</option>
        <option value="scie">Scienze e tecnologie applicate</option>
        <option value="sist">Sistemi e reti</option>
        <option value="info">Informatica</option>
        <option value="telec">Telecomunicazioni</option>
      </select>
      <button class="upload-btn">Carica</button>
    `;
    targetSection.prepend(uploadDiv);

    function resizeImage(file,maxWidth=800,callback){
      const reader=new FileReader();
      reader.onload=e=>{
        const img=new Image();
        img.onload=()=>{
          const canvas=document.createElement("canvas");
          const scale=Math.min(maxWidth/img.width,1);
          canvas.width=img.width*scale;
          canvas.height=img.height*scale;
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          canvas.toBlob(blob=>callback(blob||file),"image/jpeg",0.7);
        };
        img.src=e.target.result;
      };
      reader.readAsDataURL(file);
    }

    uploadDiv.querySelector(".upload-btn").addEventListener("click",()=>{
      const text = uploadDiv.querySelector(".upload-text").value;
      const fileInput = uploadDiv.querySelector(".upload-file");
      const dest = uploadDiv.querySelector(".upload-destination").value;
      if(!fileInput.files.length) return alert("Seleziona immagine!");
      const file=fileInput.files[0];
      resizeImage(file,800,resizedBlob=>{
        const reader=new FileReader();
        reader.onload=e=>{
          let posts=JSON.parse(localStorage.getItem("posts"))||[];
          posts.push({owner:currentUser,text,imgData:e.target.result,section:dest});
          try{
            localStorage.setItem("posts",JSON.stringify(posts));
            alert("Caricato!");
            uploadDiv.remove();
            showPosts();
          }catch(err){ if(err.name==="QuotaExceededError"){alert("Immagine troppo grande!");} else console.error(err);}
        };
        reader.readAsDataURL(resizedBlob);
      });
    });
  }

    function showPosts(){
    const posts=JSON.parse(localStorage.getItem("posts"))||[];

    // rimuove tutti i post esistenti
    Object.keys(sections).forEach(key=>{
      const sectionDiv=sections[key];
      if(!sectionDiv) return;
      sectionDiv.querySelectorAll('.post-card').forEach(card=>card.remove());
    });

    // aggiunge i post
    posts.forEach((post,index)=>{
      const sectionDiv = sections[post.section];
      if(!sectionDiv) return;

      const div = document.createElement("div");
      div.classList.add("post-card");
      div.innerHTML=`
        <div class="post-content">
          ${post.imgData ? `<img src="${post.imgData}">` : ''}
          <p><strong>${post.owner}</strong>: ${post.text}</p>
        </div>
        ${currentUser==='admin'?`<button data-index="${index}" class="delete-btn">Elimina</button>`:''}
      `;
      sectionDiv.appendChild(div);
    });

    // gestisce il bottone elimina
    document.querySelectorAll(".delete-btn").forEach(btn=>{
      btn.addEventListener("click",e=>{
        const idx=parseInt(e.target.dataset.index);
        let posts=JSON.parse(localStorage.getItem("posts"));
        posts.splice(idx,1);
        localStorage.setItem("posts",JSON.stringify(posts));
        showPosts();
      });
    });
  }

  // --- INIT ---
  updateSidebar();
  showSection('dashboard');  // mostra sezione di default
  showPosts();
});

