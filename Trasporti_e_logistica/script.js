document.addEventListener('DOMContentLoaded', () => {
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

  let users = JSON.parse(localStorage.getItem("users")) || [
    { email:"maurizio.minissale@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Minissale", canUpload:true },
    { email:"rosita.artigliere@davincimilazzo.edu.it", password:"davinci2026", name:"Prof. Artigliere", canUpload:true },
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

  document.getElementById("close-modal")?.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  submitBtn?.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if(!email || !password) { alert("Inserisci email e password!"); return; }

    const userObj = users.find(u => u.email === email && u.password === password);
    if(!userObj) { alert("Credenziali non valide!"); return; }

    currentUser = email;
    localStorage.setItem("email", currentUser);
    authModal.style.display = "none";
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

  function showPosts() {
  fetch("posts.json")
  .then(res => res.json())
  .then(posts => {
    posts.sort((a, b) => b.id - a.id);

    Object.values(sections).forEach(sec => sec.querySelectorAll('.post-card').forEach(c => c.remove()));

    posts.forEach(post => {
  // Tutti i post vanno in dashboard
  const sectionDiv = sections['dashboard'] || sections[post.section];
  if(!sectionDiv) return;

  const div = document.createElement("div");
  div.classList.add("post-card");

  // File HTML con anteprima immagini cliccabile
  let fileHTML = "";
  if(post.files && post.files.length){
    fileHTML = '<div class="post-files" style="display:flex; gap:10px; flex-wrap:wrap;">';
    post.files.forEach(file => {
      if(file.type.startsWith("image/")){
        fileHTML += `<a href="${file.data}" target="_blank" title="${file.name}">
                       <img src="${file.data}" alt="${file.name}" style="width:100px; height:auto; cursor:pointer;"/>
                     </a>`;
      } else {
        let icon = "❓";
        if(file.type.startsWith("audio/")) icon = "🎵";
        else if(file.type.startsWith("video/")) icon = "🎥";
        fileHTML += `<a href="${file.data}" download="${file.name}" title="${file.name}" class="file-link" style="font-size:2rem; text-decoration:none;">${icon}</a>`;
      }
    });
    fileHTML += "</div>";
  }

  const canDelete = post.ownerEmail === currentUser;

  div.innerHTML = `
    <div class="post-content">
      <div class="post-title">${post.title || "Senza titolo"}</div>
      <div class="post-text"><strong>${post.ownerName}</strong>: ${post.text}</div>
    </div>
    ${fileHTML}
    ${canDelete ? `<button data-id="${post.id}" class="delete-btn">Elimina</button>` : ""}
  `;
  sectionDiv.appendChild(div);
});

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const postId = parseInt(e.target.dataset.id);
        fetch("delete_post.php", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ id: postId })
        }).then(() => showPosts());
      });
    });
  })
  .catch(err => console.error("Errore caricamento posts:", err));
  }

  // Upload
  const uploadBtn = document.querySelector(".upload-btn");
  if(uploadBtn){
    const fileInput = document.querySelector(".upload-file");
    const previewDiv = document.querySelector(".upload-preview");
    const previewImg = document.getElementById("preview-img");

    fileInput.addEventListener("change", () => {
      const files = fileInput.files;
      const imgFile = Array.from(files).find(f => f.type.startsWith("image/"));
      if(imgFile){
        const reader = new FileReader();
        reader.onload = e => {
          previewImg.src = e.target.result;
          previewDiv.style.display = "flex";
        };
        reader.readAsDataURL(imgFile);
      } else previewDiv.style.display = "none";
    });

    uploadBtn.addEventListener("click", () => {
      const title = document.querySelector(".upload-title").value.trim() || "Senza titolo";
      const desc = document.querySelector(".upload-desc").value.trim();
      const dest = document.querySelector(".upload-destination").value;

      if(fileInput.files.length === 0){ alert("Seleziona almeno un file!"); return; }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("desc", desc);
      formData.append("section", dest);
      const userObj = users.find(u => u.email === currentUser);
      formData.append("ownerName", userObj?.name || "Utente");
      formData.append("ownerEmail", currentUser || "email@esempio.com");

      for(const file of fileInput.files){ formData.append("files[]", file); }

      fetch("upload.php", { method: "POST", body: formData })
        .then(res => res.json())
        .then(data => {
          if(data.success){
            alert("Caricato con successo!");
            fileInput.value = "";
            document.querySelector(".upload-title").value = "";
            document.querySelector(".upload-desc").value = "";
            previewDiv.style.display = "none";
            showPosts();
          } else {
            alert("Errore upload: " + data.error);
          }
        })
        .catch(err => alert("Errore di rete: " + err));
    });
  }

  updateSidebar();
  showPosts();
});
