document.addEventListener('DOMContentLoaded', () => {

  // ELEMENTI PRINCIPALI

  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('mobile-toggle');
  const subjectsDropdown = document.getElementById('subjects-dropdown');
  const subjectsToggle = document.getElementById('subjects-toggle');
  const secondaryNav = document.querySelector('.secondary-nav');
  const authModal = document.getElementById('auth-modal');
  const submitBtn = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const sections = {};
  document.querySelectorAll("[id$='-section']").forEach(sec => {
    const key = sec.id.replace('-section', '');
    sections[key] = sec;
  });

  // UTENTI AUTORIZZATI E LOGIN

  let users = JSON.parse(localStorage.getItem("users")) || [
    { email:"maurizio.minissale@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Minissale", canUpload:true },
    { email:"rosatina.artigliere@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Artigliere", canUpload:true },
    { email:"antonio.caristia@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Caristia", canUpload:true }
  ];


  let currentUser = localStorage.getItem("email");

  function clearSecondaryNav() {
    if(secondaryNav) secondaryNav.innerHTML = '';
  }

  function showLoginButton() {
    if(!secondaryNav) return;
    clearSecondaryNav();

    const li = document.createElement("li");
    li.classList.add("nav-item");
    li.innerHTML = `
      <a href="#" class="nav-link" id="login-link">
        <span class="material-symbols-rounded">login</span>
        <span class="nav-label">Accedi</span>
      </a>`;
    secondaryNav.appendChild(li);

    document.getElementById("login-link")?.addEventListener("click", e => {
      e.preventDefault();
      authModal.style.display = "flex";
    });
  }

  function updateSidebar() {
    clearSecondaryNav();

    if(currentUser) {
      const userObj = users.find(u => u.email === currentUser);
      if(userObj?.canUpload) {
        const liUpload = document.createElement("li");
        liUpload.classList.add("nav-item");
        liUpload.innerHTML = `
          <a href="upload.html" class="nav-link" id="upload-link">
            <span class="material-symbols-rounded">photo_camera</span>
            <span class="nav-label">Carica Contenuti</span>
          </a>`;
        secondaryNav.appendChild(liUpload);
      }

      const liOut = document.createElement("li");
      liOut.classList.add("nav-item");
      liOut.innerHTML = `
        <a href="#" class="nav-link" id="sign-out">
          <span class="material-symbols-rounded">logout</span>
          <span class="nav-label">Sign Out</span>
        </a>`;
      secondaryNav.appendChild(liOut);

      document.getElementById("sign-out")?.addEventListener("click", e => {
        e.preventDefault();
        localStorage.removeItem("email");
        currentUser = null;
        showLoginButton();
        showPosts();
      });

    } else {
      showLoginButton();
    }
  }

  // MODAL LOGIN

  document.getElementById("close-modal")?.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  submitBtn?.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if(!email || !password) {
      alert("Inserisci email e password!");
      return;
    }

    const userObj = users.find(u => u.email === email && u.password === password);

    if(!userObj) {
      alert("Credenziali non valide!");
      return;
    }

    currentUser = email;
    localStorage.setItem("email", currentUser);
    authModal.style.display = "none";

    updateSidebar();
    showPosts();
  });

  // SIDEBAR TOGGLE
  toggleBtn?.addEventListener("click", () => {
    const nav = document.querySelector(".sidebar-nav");
    nav.classList.toggle("show");  // PER MOBILE
    sidebar.classList.toggle("open-mobile"); // PER ANIMAZIONE / OPZIONALE
  });


  subjectsToggle?.addEventListener("click", e => {
    e.preventDefault();
    subjectsDropdown.classList.toggle("open");
  });

  

  // PODT
  function showPosts() {
  const posts = JSON.parse(localStorage.getItem("posts")) || [];
  Object.values(sections).forEach(sec => sec.querySelectorAll('.post-card').forEach(c => c.remove()));

  posts.forEach((post, index) => {
    const sectionDiv = sections[post.section];
    if(!sectionDiv) return;

    const div = document.createElement("div");
    div.classList.add("post-card");

    let fileHTML = "";
    if(post.files && post.files.length) {
      fileHTML = '<div class="post-files" style="display:flex; gap:10px; flex-wrap:wrap;">';
      post.files.forEach(file => {
        let icon = "❓";
        if(file.type.startsWith("audio/")) icon = "🎵";
        else if(file.type.startsWith("video/")) icon = "🎥";
        else if(file.type.startsWith("image/")) icon = "🖼️";

        fileHTML += `<a href="${file.data}" download="${file.name}" title="${file.name}" class="file-link" style="font-size:2rem; text-decoration:none;">${icon}</a>`;
      });
      fileHTML += "</div>";
    }

    const canDelete = post.ownerEmail === currentUser;

    div.innerHTML = `
      <div class="post-content">
        <div class="post-title">${post.title || "Senza titolo"}</div>
        <div class="post-text"><strong>${post.ownerName}</strong>: ${post.text}</div>
      </div>
      ${post.imgData ? `<div class="post-img"><img src="${post.imgData}" alt="Post Image"></div>` : fileHTML}
      ${canDelete ? `<button data-index="${index}" class="delete-btn">Elimina</button>` : ""}
    `;

    sectionDiv.appendChild(div);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = parseInt(e.target.dataset.index);
      let posts = JSON.parse(localStorage.getItem("posts"));
      posts.splice(idx, 1);
      localStorage.setItem("posts", JSON.stringify(posts));
      showPosts();
    });
  });
}

  // UPLOAD

  const uploadBtn = document.querySelector(".upload-btn");
  const fileInput = document.querySelector(".upload-file");
  const previewDiv = document.querySelector(".upload-preview");
  const previewImg = document.getElementById("preview-img");
  const userObj = users.find(u => u.email === currentUser);

  fileInput?.addEventListener("change", e => {
    const files = e.target.files;
    if(!files || files.length === 0) {
      previewDiv.style.display = "none";
      return;
    }

    const imgFile = Array.from(files).find(f => f.type.startsWith("image/"));
    if(imgFile) {
      const reader = new FileReader();
      reader.onload = e => {
        previewImg.src = e.target.result;
        previewDiv.style.display = "flex";
      };
      reader.readAsDataURL(imgFile);
    } else {
      previewDiv.style.display = "none";
    }
  });

  uploadBtn?.addEventListener("click", () => {
    const title = document.querySelector(".upload-title").value.trim() || "Senza titolo";
    const desc = document.querySelector(".upload-desc").value.trim();
    const dest = document.querySelector(".upload-destination").value;
    const files = fileInput.files;

    if(!files || files.length === 0) {
      alert("Seleziona almeno un file!");
      return;
    }

    const imgFile = Array.from(files).find(f => f.type.startsWith("image/"));

    const otherFiles = Array.from(files).map(f => ({
      name: f.name,
      type: f.type,
      data: URL.createObjectURL(f)
    }));

    function savePost(imgData = null) {
      const posts = JSON.parse(localStorage.getItem("posts")) || [];
      posts.push({
        ownerName: userObj ? userObj.name : currentUser,
        ownerEmail: currentUser,
        title,
        text: desc,
        imgData,
        files: otherFiles,
        section: dest
      });
      localStorage.setItem("posts", JSON.stringify(posts));

      document.querySelector(".upload-title").value = "";
      document.querySelector(".upload-desc").value = "";
      fileInput.value = "";
      previewDiv.style.display = "none";

      if(sections[dest]) showPosts();
      alert("Caricato con successo!");
    }

    if(imgFile) {
      const reader = new FileReader();
      reader.onload = e => savePost(e.target.result);
      reader.readAsDataURL(imgFile);
    } else savePost(null);
  });

  updateSidebar();
  showPosts();
});
