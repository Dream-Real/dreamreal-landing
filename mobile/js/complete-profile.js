/* =========================================
   DREAM REAL — COMPLETE PROFILE (MOBILE)
   App parity (Expo CompleteProfileScreen)
========================================= */

console.log("🧩 complete-profile.js LOADED");

const API_URL =
  window.API_URL || "https://dreamreal-api.onrender.com";

/* -----------------------------------------
   STATE
----------------------------------------- */

let avatarBase64 = null;
let existingAvatar = null;

/* -----------------------------------------
   INIT
----------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initCompleteProfile();
});

async function initCompleteProfile() {
  console.log("🚀 initCompleteProfile");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("🔒 No token → redirect login");
    window.location.href = "/mobile/login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();
    const user = data.user || data;

    const first = user.first_name?.trim() || "";
    const last  = user.last_name?.trim() || "";
    const avatar = user.avatar || null;

    // 🔒 PROFIL DÉJÀ COMPLET → SORTIE
    if (first && last && avatar) {
      localStorage.setItem("user", JSON.stringify(user));
      window.location.href = "/mobile.html";
      return;
    }

    // 🔓 PROFIL INCOMPLET → UI
    hydrateForm(user);
    bindEvents();

    document.getElementById("cpf-loader").classList.add("hidden");
    document.getElementById("cpf-scroll").classList.remove("hidden");

  } catch (err) {
    console.error("❌ loadMe error:", err);
    window.location.href = "/mobile/login.html";
  }
}

/* -----------------------------------------
   HYDRATE
----------------------------------------- */

function hydrateForm(user) {
  document.getElementById("cpf-first-name").value =
    user.first_name || "";

  document.getElementById("cpf-last-name").value =
    user.last_name || "";

  if (user.avatar) {
    existingAvatar = user.avatar;
    showAvatar(user.avatar);
  }

  updateSubmitState();
}

/* -----------------------------------------
   EVENTS
----------------------------------------- */

function bindEvents() {
  const avatarInput = document.getElementById("cpf-avatar-input");
  const avatarBtn   = document.getElementById("cpf-avatar-btn");
  const submitBtn   = document.getElementById("cpf-submit");

  // sécurité
  if (!avatarInput || !avatarBtn || !submitBtn) {
    console.warn("❌ CPF elements not found");
    return;
  }

  // ✅ clic sur le texte → ouvre le file picker
  avatarBtn.addEventListener("click", (e) => {
    e.preventDefault();
    avatarInput.click();
  });

  // ✅ changement de fichier
  avatarInput.addEventListener("change", handleAvatarPick);

  // ✅ inputs
  ["cpf-first-name", "cpf-last-name"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateSubmitState);
  });

  // ✅ submit
  submitBtn.addEventListener("click", submitProfile);
}

/* -----------------------------------------
   AVATAR
----------------------------------------- */

function handleAvatarPick(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    avatarBase64 = reader.result;
    showAvatar(reader.result);
    updateSubmitState();
  };
  reader.readAsDataURL(file);
}

function showAvatar(src) {
  const img  = document.getElementById("cpf-avatar-preview");
  const plus = document.getElementById("cpf-avatar-placeholder");
  const btn  = document.getElementById("cpf-avatar-btn");

  img.src = src;
  img.classList.remove("hidden");
  plus.classList.add("hidden");

  btn.textContent = "Change avatar";
}

/* -----------------------------------------
   FORM STATE
----------------------------------------- */

function updateSubmitState() {
  const first = document.getElementById("cpf-first-name").value.trim();
  const last  = document.getElementById("cpf-last-name").value.trim();

  const canSubmit =
    first.length > 0 &&
    last.length > 0 &&
    (avatarBase64 || existingAvatar);

  document.getElementById("cpf-submit").disabled = !canSubmit;
}

/* -----------------------------------------
   SUBMIT
----------------------------------------- */

async function submitProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const btn = document.getElementById("cpf-submit");
  btn.textContent = "Saving…";
  btn.disabled = true;

  const payload = {
    first_name: document.getElementById("cpf-first-name").value.trim(),
    last_name:  document.getElementById("cpf-last-name").value.trim(),
    avatar: avatarBase64 || existingAvatar,
  };

  try {
    const res = await fetch(`${API_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Update failed");

    const data = await res.json();
    localStorage.setItem("user", JSON.stringify(data.user));

    window.location.href = "/mobile.html";

  } catch (err) {
    console.error("❌ submit error:", err);
    alert("Server error");
    btn.textContent = "Continue";
    btn.disabled = false;
  }
}