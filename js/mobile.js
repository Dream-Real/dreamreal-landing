/* =========================================
   DREAM REAL — MOBILE APP (PUBLIC FEED)
   Same logic as Desktop (no auth required)
========================================= */

console.log("🚀 mobile.js LOADED");

const API_URL =
  window.API_URL || "https://dreamreal-api.onrender.com";

/* -----------------------------------------
   DOM TARGETS
----------------------------------------- */

let feedContainer = null;
let lookingForContainer = null;

/* -----------------------------------------
   INIT
----------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initMobileApp();
  initCreatePost();
  initHeaderAvatar();
  initCompleteProfile(); // 👈 AJOUT ICI
});

async function initMobileApp() {
  console.log("📱 initMobileApp (public feed)");

  feedContainer = document.querySelector("#feed");
  lookingForContainer = document.querySelector("#looking-for-scroll");

  if (!feedContainer) {
    console.error("❌ #feed not found");
    return;
  }

  if (typeof window.renderPostItemMobile !== "function") {
    console.error("❌ renderPostItemMobile not loaded");
    return;
  }

  console.log("📡 Loading public feed (no auth)");

  try {
    const res = await fetch(`${API_URL}/api/posts`);
    const json = await res.json();

    const rawPosts = Array.isArray(json)
      ? json
      : json.posts || json.data || [];

    console.log("📦 RAW posts:", rawPosts.length);

    console.log("🧪 RAW POSTS SAMPLE", rawPosts[0]);

    if (!rawPosts.length) {
      renderEmptyState();
      return;
    }

    // 🔑 SOURCE UNIQUE DE VÉRITÉ (COMME DESKTOP)
    const normalizedPosts = rawPosts
      .sort(
        (a, b) =>
          new Date(b.created_time).getTime() -
          new Date(a.created_time).getTime()
      )
      .map(normalizePostForMobile);

      console.log(
  "🧪 FEELING SHAPE",
  normalizedPosts.map(p => p.feeling)
);

      renderLookingFor(normalizedPosts);

    renderFeed(normalizedPosts);

  } catch (err) {
    console.error("❌ Feed fetch error:", err);
    renderErrorState();
  }
}

/* -----------------------------------------
   NORMALIZATION (MOBILE)
----------------------------------------- */

function normalizePostForMobile(post) {
  return {
    id: post.id,

    user_first_name: post.user_first_name || "",
    user_last_name: post.user_last_name || "",
    user_avatar:
      post.user_avatar ||
      post.profile_picture ||
      "https://cdn-icons-png.flaticon.com/512/847/847969.png",

    message: post.message || "",

    localLocation: post.localLocation || post.location || null,

    feeling: post.feeling || null,
    activity: post.activity || null,

    youtube_url: post.youtube_url || null,
    youtube_thumbnail: post.youtube_thumbnail || null,
    video_url: post.video_url || null,

    link_preview: post.link_preview || null,

    multiple_images:
      Array.isArray(post.multiple_images) && post.multiple_images.length
        ? post.multiple_images
        : null,

    full_picture: post.full_picture || null,

    reactions_summary: post.reactions_summary || "👍",
    reactions_count: post.reactions_count || 0,
    comments_count: post.comments_count || 0,

    permalink_url: post.permalink_url || null,

    created_time: post.created_time,
  };
}

function extractLookingForUsers(posts) {
  return posts
    .filter((p) => {
      if (!p.feeling || !p.user_first_name) return false;

      // ✅ FEED PUBLIC = feeling.title
      return (
        typeof p.feeling.title === "string" &&
        p.feeling.title.toLowerCase() === "looking for"
      );
    })
    .sort(
      (a, b) =>
        new Date(b.created_time).getTime() -
        new Date(a.created_time).getTime()
    )
    .slice(0, 10);
}

function renderLookingFor(posts) {
  if (!lookingForContainer) return;

  const users = extractLookingForUsers(posts);

  if (!users.length) {
  lookingForContainer.innerHTML = "";
  lookingForContainer.style.display = "none";
  return;
}

lookingForContainer.style.display = "flex";
lookingForContainer.innerHTML = ""; // 🔥 LA LIGNE À AJOUTER

  users.forEach((post) => {
    const item = document.createElement("div");
    item.className = "looking-for-item";

    const emojiUrl = post.activity?.image
      ? `https://dreamreal-images.s3.eu-west-3.amazonaws.com/${post.activity.image}`
      : null;

    item.innerHTML = `
      <div class="looking-for-avatar-wrapper">
        <img
          class="looking-for-avatar"
          src="${post.user_avatar}"
        />
        ${
          emojiUrl
            ? `<div class="looking-for-emoji">
                <img src="${emojiUrl}" />
              </div>`
            : ""
        }
      </div>

      <div class="looking-for-name">
        <div>${post.user_first_name}</div>
        <div>${post.user_last_name}</div>
      </div>
    `;

    // 👉 scroll vers le post correspondant
    item.addEventListener("click", () => {
  requestAnimationFrame(() => {
    const target = feedContainer.querySelector(
      `[data-post-id="${post.id}"]`
    );
    if (!target) return;

    const scrollContainer = document.querySelector(".mobile-scroll");
    if (!scrollContainer) return;

    const header = document.querySelector(".mobile-header");
    const HEADER_OFFSET = header ? header.offsetHeight : 88;

    const y =
  target.offsetTop +
  feedContainer.offsetTop;

    // ✅ POSITION EXACTE DU POST DANS LE SCROLL CONTAINER

    // 🎯 AJUSTEMENT UX FIN (équivalent app)
    const UX_OFFSET = 20;

    scrollContainer.scrollTo({
      top: y - HEADER_OFFSET - UX_OFFSET,
      behavior: "smooth",
    });
  });
});

    lookingForContainer.appendChild(item);
  });
}

/* -----------------------------------------
   RENDER
----------------------------------------- */

function renderFeed(posts) {
  console.log("🧱 renderFeed:", posts.length);

  feedContainer.innerHTML = "";

  posts.forEach((post, index) => {
    try {
      const el = window.renderPostItemMobile(post);

// 🔑 EXACTEMENT l’équivalent du onLayout de l’app
el.setAttribute("data-post-id", post.id);

feedContainer.appendChild(el);
    } catch (err) {
      console.warn("⚠️ Failed to render post", index, err);
    }
  });
}

function renderEmptyState() {
  feedContainer.innerHTML = `
    <div style="padding:24px;text-align:center;color:#9ca3af">
      No posts to display
    </div>
  `;
}

function renderErrorState() {
  feedContainer.innerHTML = `
    <div style="padding:24px;text-align:center;color:#ef4444">
      Failed to load feed
    </div>
  `;
}
/* -----------------------------------------
   CREATE POST (MOBILE)
----------------------------------------- */

function initCreatePost() {
  const createBtn = document.getElementById("mobile-create-btn");

  if (!createBtn) {
    console.warn("❌ #mobile-create-btn not found");
    return;
  }

  console.log("➕ Create button detected (mobile)");

  createBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/mobile/login.html";
      return;
    }

    if (typeof window.openCreatePost === "function") {
      window.openCreatePost();
    }
  });
}
/* -----------------------------------------
   HEADER — USER AVATAR (AUTH ONLY)
   Mobile parity with Desktop
----------------------------------------- */

function initHeaderAvatar() {
  const avatarWrapper = document.getElementById("mobile-user-avatar");
  const avatarImg = document.getElementById("mobile-user-avatar-img");

  if (!avatarWrapper || !avatarImg) {
  // Page sans avatar (login / autre) → comportement normal
  return;
}

  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token) {
    avatarWrapper.classList.add("hidden");
    return;
  }

  // 🔁 fallback si user absent
  if (!userRaw) {
    fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (!user) return;

        localStorage.setItem("user", JSON.stringify(user));
        applyAvatar(user);
      });

    return;
  }

  try {
    const user = JSON.parse(userRaw);
    applyAvatar(user);
  } catch {
    avatarWrapper.classList.add("hidden");
  }

  function applyAvatar(user) {
    const fallback =
      "https://cdn-icons-png.flaticon.com/512/847/847969.png";

    avatarImg.src =
      user.avatar && user.avatar.trim() ? user.avatar : fallback;

    avatarWrapper.classList.remove("hidden");
    console.log("👤 Mobile avatar rendered");
  }
}
/* =========================================
   COMPLETE PROFILE — MOBILE (APP PARITY)
========================================= */

let cpfAvatarBase64 = null;
let cpfExistingAvatar = null;

function initCompleteProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data) return;

      const user = data.user || data;

      const f = user.first_name?.trim();
      const l = user.last_name?.trim();
      const a = user.avatar?.trim();

      // 🔒 PROFIL COMPLET → rien à faire
      if (f && l && a) {
        localStorage.setItem("user", JSON.stringify(user));
        return;
      }

      // ❗ PROFIL INCOMPLET → MODALE
      openCompleteProfileModal(user);
    })
    .catch(() => {});
}

function openCompleteProfileModal(user) {
  const overlay = document.getElementById("cpf-overlay");
  if (!overlay) return;

  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Pré-fill
  document.getElementById("cpf-first-name").value =
    user.first_name || "";
  document.getElementById("cpf-last-name").value =
    user.last_name || "";

  if (user.avatar) {
    cpfExistingAvatar = user.avatar;
    showCpfAvatar(user.avatar);
  }

  bindCpfEvents();
  updateCpfSubmitState();
}

function bindCpfEvents() {
  const fileInput = document.getElementById("cpf-avatar-input");
  const submitBtn = document.getElementById("cpf-submit");

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      cpfAvatarBase64 = reader.result;
      showCpfAvatar(reader.result);
      updateCpfSubmitState();
    };
    reader.readAsDataURL(file);
  };

  ["cpf-first-name", "cpf-last-name"].forEach((id) => {
    document.getElementById(id).oninput = updateCpfSubmitState;
  });

  submitBtn.onclick = submitCompleteProfile;
}

function showCpfAvatar(src) {
  const img = document.getElementById("cpf-avatar-preview");
  const plus = document.getElementById("cpf-avatar-placeholder");
  const btn = document.getElementById("cpf-avatar-btn");

  img.src = src;
  img.classList.remove("hidden");
  plus.classList.add("hidden");

  btn.textContent = "Change avatar";
}

function updateCpfSubmitState() {
  const f = document
    .getElementById("cpf-first-name")
    .value.trim();
  const l = document
    .getElementById("cpf-last-name")
    .value.trim();

  const canSubmit = f && l && (cpfAvatarBase64 || cpfExistingAvatar);
  document.getElementById("cpf-submit").disabled = !canSubmit;
}

async function submitCompleteProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const btn = document.getElementById("cpf-submit");
  btn.textContent = "Saving…";
  btn.disabled = true;

  const payload = {
    first_name: document
      .getElementById("cpf-first-name")
      .value.trim(),
    last_name: document
      .getElementById("cpf-last-name")
      .value.trim(),
    avatar: cpfAvatarBase64 || cpfExistingAvatar,
  };

  const res = await fetch(`${API_URL}/api/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    alert("Server error");
    btn.textContent = "Continue";
    btn.disabled = false;
    return;
  }

  const data = await res.json();
  localStorage.setItem("user", JSON.stringify(data.user));

  closeCompleteProfileModal();
}

function closeCompleteProfileModal() {
  const overlay = document.getElementById("cpf-overlay");
  if (!overlay) return;

  overlay.classList.add("hidden");
  document.body.style.overflow = "";

  // 🔁 refresh avatar header
  initHeaderAvatar();
}