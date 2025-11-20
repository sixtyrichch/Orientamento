const sections = {
  dashboard: document.getElementById("dashboard-section"),
  notifications: document.getElementById("notifications-section"),
  resources: document.getElementById("resources-section")
};
const showSection = key => Object.keys(sections).forEach(k=>sections[k].style.display=k===key?"block":"none");

document.querySelectorAll(".primary-nav .nav-link").forEach(link=>{
  link.addEventListener("click", e=>{
    e.preventDefault();
    const label=link.querySelector(".nav-label").textContent.toLowerCase();
    if(label==="dashboard") showSection("dashboard");
    if(label==="notifications") showSection("notifications");
    if(label==="resources") showSection("resources");
  });
});

let users = JSON.parse(localStorage.getItem("users")) || [
  { username:"admin", password:"davinci2026", canUpload:true },
  { username:"user1", password:"123", canUpload:false }
];
let currentUser = localStorage.getItem("username");

const sidebarProfile = document.getElementById("sidebar-profile");
const profileName = document.getElementById("profile-name");
const secondaryNav = document.querySelector(".secondary-nav");
const authModal = document.getElementById("auth-modal");
const modalTitle = document.getElementById("modal-title");
const submitBtn = document.getElementById("submit-btn");
const toggleAuth = document.getElementById("toggle-auth");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const clearSecondaryNav = ()=>secondaryNav.innerHTML='';
const showLoginButton = ()=>{
  clearSecondaryNav();
  const li=document.createElement("li");
  li.classList.add("nav-item");
  li.innerHTML=`<a href="#" class="nav-link" id="login-link">
    <span class="material-symbols-rounded">login</span>
    <span class="nav-label">Accedi</span></a>`;
  secondaryNav.appendChild(li);
  document.getElementById("login-link").addEventListener("click", e=>{
    e.preventDefault();
    authModal.style.display="flex";
  });
};

const updateSidebar = ()=>{
  clearSecondaryNav();
  if(currentUser){
    sidebarProfile.style.display="flex";
    profileName.textContent=currentUser;

    // Solo admin può vedere "Carica Foto"
    if(currentUser === "admin"){
      const li=document.createElement("li");
      li.classList.add("nav-item");
      li.innerHTML=`<a href="#" class="nav-link" id="upload-link">
        <span class="material-symbols-rounded">photo_camera</span>
        <span class="nav-label">Carica Foto</span></a>`;
      secondaryNav.appendChild(li);
      li.addEventListener("click", e=>{ e.preventDefault(); showUploadSection(); });
    }

    const liOut=document.createElement("li");
    liOut.classList.add("nav-item");
    liOut.innerHTML=`<a href="#" class="nav-link" id="sign-out">
      <span class="material-symbols-rounded">logout</span>
      <span class="nav-label">Sign Out</span></a>`;
    secondaryNav.appendChild(liOut);
    document.getElementById("sign-out").addEventListener("click", e=>{
      e.preventDefault();
      localStorage.removeItem("username");
      currentUser=null;
      sidebarProfile.style.display="none";
      showLoginButton();
      showPosts();
    });
  } else { 
    sidebarProfile.style.display="none"; 
    showLoginButton(); 
    showPosts(); 
  }
};

let isLoginMode=true;
toggleAuth.addEventListener("click", ()=>{
  isLoginMode = !isLoginMode;
  if(isLoginMode){ modalTitle.textContent="Accedi"; submitBtn.textContent="Accedi"; toggleAuth.textContent="Non hai un account? Registrati"; }
  else { modalTitle.textContent="Registrati"; submitBtn.textContent="Registrati"; toggleAuth.textContent="Hai già un account? Accedi"; }
  usernameInput.value=""; passwordInput.value="";
});

document.getElementById("close-modal").addEventListener("click", ()=> authModal.style.display="none");

submitBtn.addEventListener("click", ()=>{
  const username=usernameInput.value.trim();
  const password=passwordInput.value;
  if(!username || !password) return alert("Inserisci username e password!");
  if(isLoginMode){
    const userObj = users.find(u=>u.username===username && u.password===password);
    if(!userObj) return alert("Credenziali non valide!");
    currentUser=username;
    localStorage.setItem("username",currentUser);
    authModal.style.display="none";
    updateSidebar();
    showPosts();
  } else {
    if(users.find(u=>u.username===username)) return alert("Utente già registrato!");
    users.push({username,password,canUpload:false});
    localStorage.setItem("users",JSON.stringify(users));
    alert("Registrazione completata!");
    isLoginMode=true;
    modalTitle.textContent="Accedi"; submitBtn.textContent="Accedi"; toggleAuth.textContent="Non hai un account? Registrati";
  }
});

document.querySelector(".header-logo img").addEventListener("click", ()=> {
  window.location.href = "profile.html";
});

const showUploadSection = ()=>{
  const userObj = users.find(u=>u.username===currentUser);
  if(!userObj || currentUser!=="admin") return alert("Non hai permessi!");

  // Se già esiste, rimuovo l'upload card
  let existing = document.querySelector(".upload-card");
  if(existing) existing.remove();

  // Creo la card
  const uploadDiv = document.createElement("div");
  uploadDiv.classList.add("upload-card");
  uploadDiv.innerHTML=`
    <h3>Carica contenuti</h3>
    <input type="text" id="upload-text" placeholder="Testo facoltativo...">
    <input type="file" id="upload-file" accept="image/*">
    <select id="upload-destination">
      <option value="dashboard">Dashboard</option>
      <option value="notifications">Notifications</option>
      <option value="resources">Resources</option>
    </select>
    <button id="upload-btn">Carica</button>
  `;

  // Appendo la card nella main content, **ma non rimuovo le sezioni già esistenti**
  const main = document.querySelector(".main-content");
  main.prepend(uploadDiv);

  document.getElementById("upload-btn").addEventListener("click", ()=>{
    const text = document.getElementById("upload-text").value;
    const fileInput = document.getElementById("upload-file");
    const dest = document.getElementById("upload-destination").value;
    if(!fileInput.files.length) return alert("Seleziona immagine!");
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = e => {
      const imgData = e.target.result;
      let posts = JSON.parse(localStorage.getItem("posts")) || [];
      
      // Aggiungo il post nella sezione scelta
      posts.push({owner: currentUser, text, imgData, section: dest});
      localStorage.setItem("posts", JSON.stringify(posts));
      
      alert("Caricato!");
      uploadDiv.remove();  // rimuovo la card dopo il caricamento
      showPosts();         // aggiorno tutte le sezioni
    };
    reader.readAsDataURL(file);
  });
};

const showPosts = ()=>{
  const posts = JSON.parse(localStorage.getItem("posts")) || [];
  
  // Pulisco solo i contenitori delle sezioni, non l'intera main-content
  Object.values(sections).forEach(sec => sec.innerHTML="");

  posts.forEach((post,index)=>{
    const div = document.createElement("div");
    div.classList.add("post-card");
    
    let deleteBtn = '';
    if(currentUser==='admin'){ 
      deleteBtn = `<button data-index="${index}" class="delete-btn">Elimina</button>`;
    }
    
    div.innerHTML = `
      <p><strong>${post.owner}</strong>: ${post.text}</p>
      ${post.imgData?`<img src="${post.imgData}">`:''}
      ${deleteBtn}
    `;

    // Appendo il post nella sezione corretta
    if(sections[post.section]) sections[post.section].appendChild(div);
  });

  document.querySelectorAll(".delete-btn").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const idx = parseInt(e.target.dataset.index);
      let posts = JSON.parse(localStorage.getItem("posts"));
      posts.splice(idx,1);
      localStorage.setItem("posts", JSON.stringify(posts));
      showPosts();
    });
  });
};


updateSidebar();
showSection("dashboard");
showPosts();
