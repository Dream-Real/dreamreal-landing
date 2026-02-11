/* =========================================================
   DREAM REAL — SETTINGS (MOBILE WEB)
   App parity with Expo SettingsScreen
   SAFE / ISOLATED / NO META SDK
========================================================= */

console.log("⚙️ settings.js LOADED");

/* ---------------------------------------------------------
   API helpers (same logic as mobile)
--------------------------------------------------------- */
const RAW_API_BASE = window.API_BASE || window.API_URL || "";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

function apiUrl(path) {
  return API_BASE.endsWith("/api")
    ? `${API_BASE}${path}`
    : `${API_BASE}/api${path}`;
}

/* ---------------------------------------------------------
   STATE (EXACT APP MENTAL MODEL)
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
    const res = await fetch(apiUrl("/users/me"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Profile fetch failed");

    const data = await res.json();
    profile = data.user ?? data;

    renderProfile();
  } catch (err) {
    console.error("❌ settings — load profile failed", err);
  }
}

/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */
function renderProfile() {
  if (!profile) return;

  $("settings-avatar").src =
    profile.avatar ||
    "https://dreamreal-images.s3.eu-west-3.amazonaws.com/avatar-placeholder.png";

  setText("settings-name", getDisplayName(profile));
  setText("settings-bio", profile.bio || "—");
  setText("settings-instagram", profile.instagram_username || "—");
  setText("settings-facebook", profile.facebook_url || "—");
  setText("settings-messenger", profile.messenger_url || "—");
}

function setText(id, value) {
  if ($(id)) $(id).textContent = value;
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
   SAVE SOCIAL LINKS (EXACT APP LOGIC)
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
   IMAGE UPLOAD (AVATAR / COVER)
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
   INLINE EDIT MODAL (EXACT APP PARITY)
--------------------------------------------------------- */
function openEdit(field, title, value, placeholder) {
  editingField = field;

  $("edit-title").textContent = title;
  $("edit-input").value = value || "";
  $("edit-input").placeholder = placeholder || "";

  $("edit-modal").hidden = false;
  document.body.style.overflow = "hidden";

  setTimeout(() => $("edit-input").focus(), 0);
}

function closeEdit() {
  editingField = null;
  $("edit-modal").hidden = true;
  document.body.style.overflow = "";
}

async function saveEdit() {
  const value = $("edit-input").value;

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
   BIND UI (NO PROMPT — APP PARITY)
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();

  $("settings-edit-avatar").onclick = () =>
    uploadAndSaveImage("avatar");
  $("settings-edit-cover").onclick = () =>
    uploadAndSaveImage("cover_photo");

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

  $("edit-cancel").onclick = closeEdit;
  $("edit-save").onclick = saveEdit;

  $("settings-logout").onclick = logout;
});