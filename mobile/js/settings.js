/* =========================================================
   DREAM REAL — SETTINGS (MOBILE WEB)
   App parity with Expo SettingsScreen
   SAFE / ISOLATED / NO META SDK
========================================================= */

console.log("⚙️ settings.js LOADED");

/* ---------------------------------------------------------
   API helpers — HARD FIX
--------------------------------------------------------- */
const API_BASE = "https://dreamreal-api.onrender.com";

function apiUrl(path) {
  return `${API_BASE}/api${path}`;
}

console.log("🚀 SETTINGS FORCE API =", API_BASE);

/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */
let profile = null;
let editingField = null;

/* ---------------------------------------------------------
   DOM helpers
--------------------------------------------------------- */
const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------
   AUTH GUARD
--------------------------------------------------------- */
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/mobile/login.html";
}

/* ---------------------------------------------------------
   LOAD PROFILE
--------------------------------------------------------- */
async function loadProfile() {
  try {
    console.log("📡 Calling /users/me...");

    const res = await fetch(apiUrl("/users/me"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("📡 Response status:", res.status);

    if (!res.ok) throw new Error("Profile fetch failed");

    const data = await res.json();
    profile = data.user ?? data;

    renderProfile();
  } catch (err) {
    console.error("❌ settings — load profile failed", err);
  }
}

/* ---------------------------------------------------------
   RENDER + BINDINGS (🔑 KEY FIX)
--------------------------------------------------------- */
function renderProfile() {
  console.log("🔥 renderProfile called", profile);

  if (!profile) {
    console.log("❌ profile is null");
    return;
  }

  const avatar = $("settings-avatar");

if (avatar) {
  const fallback =
    "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  avatar.src =
    profile.avatar && profile.avatar.trim()
      ? profile.avatar
      : fallback;

  avatar.onerror = () => {
    avatar.src = fallback;
  };
}

  setText("settings-name", getDisplayName(profile));
  setText("settings-bio", profile.bio || "—");
  setText("settings-instagram", profile.instagram_username || "—");
  setText("settings-facebook", profile.facebook_url || "—");
  setText("settings-messenger", profile.messenger_url || "—");

  /* 🔑 CLICK BINDINGS — AFTER PROFILE EXISTS (APP PARITY) */
  $("edit-name").onclick = () =>
    openEdit("name", "Name", getDisplayName(profile), "Your name");

  $("edit-bio").onclick = () =>
    openEdit("bio", "Bio", profile.bio || "", "Your bio");

  $("edit-instagram").onclick = () =>
    openEdit(
      "instagram",
      "Instagram",
      profile.instagram_username || "",
      "@username"
    );

  $("edit-facebook").onclick = () =>
    openEdit(
      "facebook",
      "Facebook",
      profile.facebook_url || "",
      "Facebook URL"
    );

  $("edit-messenger").onclick = () =>
    openEdit(
      "messenger",
      "Messenger",
      profile.messenger_url || "",
      "Messenger link"
    );
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function getDisplayName(p) {
  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  return name || "—";
}

/* ---------------------------------------------------------
   SAVE PROFILE PATCH
--------------------------------------------------------- */
async function saveProfilePatch(patch) {
  const res = await fetch(apiUrl("/users/me"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    console.warn("❌ settings — saveProfilePatch failed");
    return;
  }

  const data = await res.json();
  profile = data.user ?? data;
  renderProfile();
}

/* ---------------------------------------------------------
   SAVE SOCIAL LINKS
--------------------------------------------------------- */
async function saveSocial(field, value) {
  const clean = value.trim();
  let endpoint = "";
  let payload = {};

  if (field === "instagram") {
    endpoint = "/users/me/instagram";
    payload = { username: clean ? clean.replace("@", "") : null };
  }

  if (field === "facebook") {
    endpoint = "/users/me/facebook";
    payload = { facebook_url: clean || null };
  }

  if (field === "messenger") {
    endpoint = "/users/me/messenger";
    payload = { messenger_url: clean || null };
  }

  const res = await fetch(apiUrl(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.warn("❌ settings — saveSocial failed");
    return;
  }

  await loadProfile();
}

/* ---------------------------------------------------------
   IMAGE UPLOAD
--------------------------------------------------------- */
async function uploadAndSaveImage(field) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(apiUrl("/upload"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) return;

    const data = await res.json();
    if (!data?.url) return;

    await saveProfilePatch({ [field]: data.url });
  };

  input.click();
}

/* ---------------------------------------------------------
   EDIT MODAL
--------------------------------------------------------- */
function openEdit(field, title, value, placeholder) {
  editingField = field;

  const modal = $("edit-modal");
  const titleEl = $("modal-title");
  const input = $("modal-input");

  if (!modal || !titleEl || !input) return;

  titleEl.textContent = title;
  input.value = value || "";
  input.placeholder = placeholder || "";

  modal.hidden = false;
  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => input.focus());
}

function closeEdit() {
  editingField = null;
  const modal = $("edit-modal");
  if (modal) modal.hidden = true;
  document.body.style.overflow = "";
}

async function saveEdit() {
  if (!editingField) return;

  const input = $("modal-input");
  if (!input) return;

  const value = input.value;

  if (editingField === "name") {
    const [first_name, ...rest] = value.trim().split(" ");
    await saveProfilePatch({
      first_name,
      last_name: rest.join(" "),
    });
  }

  if (editingField === "bio") {
    await saveProfilePatch({ bio: value });
  }

  if (
    editingField === "instagram" ||
    editingField === "facebook" ||
    editingField === "messenger"
  ) {
    await saveSocial(editingField, value);
  }

  closeEdit();
}

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/mobile/login.html";
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const modal = $("edit-modal");
  if (modal) modal.hidden = true;

  loadProfile();

  $("settings-edit-avatar")?.addEventListener("click", () =>
    uploadAndSaveImage("avatar")
  );

  $("settings-edit-cover")?.addEventListener("click", () =>
    uploadAndSaveImage("cover_photo")
  );

  $("modal-cancel")?.addEventListener("click", closeEdit);
  $("modal-save")?.addEventListener("click", saveEdit);

  $("settings-logout")?.addEventListener("click", logout);
});
/* ---------------------------------------------------------
   EXPOSE FUNCTIONS TO WINDOW (HTML BINDING)
--------------------------------------------------------- */
window.openEdit = openEdit;
window.uploadAndSaveImage = uploadAndSaveImage;