/* =========================================
   DREAM REAL — PROFILE (MOBILE)
   Final, app-aligned, SAFE version
========================================= */

console.log("👤 profile-mobile.js LOADED");

document.addEventListener("DOMContentLoaded", async () => {
    
    /* =========================
     ROUTING / CONTEXT
  ========================= */
  const params        = new URLSearchParams(window.location.search);
  const foreignUserId = params.get("userId"); // null | string

  console.log("🧭 PROFILE ROUTE userId =", foreignUserId);

  /* =========================
     DOM TARGETS
  ========================= */
  const header  = document.getElementById("profile-header");
  const actions = document.getElementById("profile-actions");
  const feed    = document.getElementById("profile-feed");

  if (!header || !actions || !feed) {
    console.error("❌ Profile DOM nodes missing");
    return;
  }

  /* =========================
     AUTH / SESSION
  ========================= */
  const token   = localStorage.getItem("token");
const userRaw = localStorage.getItem("user");

// 🔐 Auth requise UNIQUEMENT pour MON profil
if (!foreignUserId && (!token || !userRaw)) {
  window.location.href = "/mobile/login.html";
  return;
}

  let user = null;

// 👉 MON profil UNIQUEMENT
if (!foreignUserId) {
  try {
    user = JSON.parse(userRaw);
  } catch {
    console.error("❌ Invalid user in localStorage");
    return;
  }

  if (!user?.id) {
    console.error("❌ user.id missing");
    return;
  }
}

  const API_BASE =
    window.API_BASE ||
    window.API_URL ||
    "https://dreamreal-api.onrender.com";

  const CDN             = "https://dreamreal-images.s3.eu-west-3.amazonaws.com";
  const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  const FALLBACK_COVER  = `${CDN}/default-cover.jpg`;

 /* =========================
   EXTERNAL PROFILE (PUBLIC — AUTHORITATIVE)
========================= */
if (foreignUserId) {
  try {
    const res = await fetch(
      `${API_BASE}/api/users/public/${encodeURIComponent(foreignUserId)}`
    );

    if (!res.ok) {
      throw new Error(`User fetch failed (${res.status})`);
    }

    user = await res.json();

    console.log("👤 External user loaded (PUBLIC API)", user);

  } catch (err) {
    console.error("❌ External profile load failed", err);
    user = null;
  }
}

if (!user) {
  header.innerHTML = `
    <div style="padding:32px;text-align:center;opacity:.6">
      User not found
    </div>
  `;
  feed.innerHTML = "";
  return;
}

  /* =========================
     HEADER (APP PARITY)
  ========================= */
  const displayName =
    (`${user.first_name || ""} ${user.last_name || ""}`.trim()) ||
    user.name ||
    "User";

  const avatarUrl =
    typeof user.avatar === "string" && user.avatar.startsWith("http")
      ? user.avatar
      : FALLBACK_AVATAR;

  const coverUrl =
  typeof user.cover_photo === "string" && user.cover_photo
    ? user.cover_photo.startsWith("http")
      ? user.cover_photo
      : `${CDN}/${user.cover_photo}`
    : FALLBACK_COVER;

  header.innerHTML = `
  <section class="m-profile">

    <!-- 🌆 COVER -->
    <div class="m-profile-cover">
      <img
        class="m-profile-cover-img"
        src="${coverUrl}"
        alt="Cover"
      />

      <!-- 👤 AVATAR — 🔑 DOIT ÊTRE DANS LA COVER -->
      <button
        id="profile-avatar-btn"
        class="m-profile-avatar-btn"
        ${foreignUserId ? "disabled" : ""}
        aria-label="Change avatar"
        type="button"
      >
        <span class="m-profile-avatar-ring">
          <img
            class="m-profile-avatar"
            src="${avatarUrl}"
            alt="Avatar"
          />
        </span>
      </button>

      ${!foreignUserId ? `
        <button
          id="profile-cover-btn"
          class="m-profile-cover-btn"
          type="button"
        >
          Change
        </button>
      ` : ``}
    </div>

    <!-- 👤 INFOS -->
    <div class="m-profile-top">
      <h1 class="m-profile-name" id="profile-name">
        ${displayName}
      </h1>

      <div
        class="m-profile-mood"
        id="profile-mood"
        hidden
      >
        <button
          class="m-profile-mood-btn"
          id="profile-mood-btn"
          type="button"
        >
          <img
            class="m-profile-mood-icon"
            id="profile-mood-icon"
            alt=""
          />
          <span id="profile-mood-text"></span>
        </button>
      </div>

      <p
  class="m-profile-bio"
  id="profile-bio"
  ${user.bio ? "" : "hidden"}
>
  ${user.bio || ""}
</p>

<!-- ✅ SOCIAL BUTTONS TARGET (REQUIRED) -->
<div class="m-profile-socials" id="profile-socials"></div>
    </div>

  </section>
`;

/* 🔑 REBIND SOCIALS — MUST BE AFTER header.innerHTML */
const socials = document.getElementById("profile-socials");

if (!socials) {
  console.warn("⚠️ profile-socials not found after render");
}

  /* =========================
     TODAY MOOD
  ========================= */
  const todayFeeling = user.today_feeling || null;

  if (todayFeeling?.title && todayFeeling?.image) {
    const moodWrap = document.getElementById("profile-mood");
    const moodText = document.getElementById("profile-mood-text");
    const moodIcon = document.getElementById("profile-mood-icon");

    moodWrap.hidden = false;
    moodText.textContent = `I’m feeling ${todayFeeling.title} today`;
    moodIcon.src = `${CDN}/${todayFeeling.image}`;
  }

  /* =========================
     ACTIONS (SECURED)
  ========================= */
  actions.innerHTML = "";

  if (!foreignUserId) {
    if (!todayFeeling) {
      const btnMood = document.createElement("button");
      btnMood.className = "m-btn";
      btnMood.innerHTML = "💫 Add Today’s Mood";
      btnMood.onclick = () =>
        console.warn("TODO: open Today Mood selector (web)");
      actions.appendChild(btnMood);
    }

    const btnEdit = document.createElement("button");
    btnEdit.className = "m-btn m-btn--primary";
    btnEdit.innerHTML = "✏️ Edit Profile";
    btnEdit.onclick = () => {
      window.location.href = "/mobile/settings.html";
    };
    actions.appendChild(btnEdit);
  }

  /* =========================
   SOCIALS (OWN + EXTERNAL)
========================= */
if (socials) socials.innerHTML = "";

const facebookUrl  = user.facebook_url || null;
const igUsername   = user.instagram_username || null;
const messengerUrl = user.messenger_url || null;

if (facebookUrl && socials) {
  socials.innerHTML += `
    <button
      class="m-btn m-btn--facebook"
      type="button"
      onclick="window.open('${facebookUrl}', '_blank')"
    >
      Facebook
    </button>
  `;
}

if (igUsername && socials) {
  const ig = igUsername.replace("@", "");
  socials.innerHTML += `
    <button
      class="m-btn m-btn--instagram"
      type="button"
      onclick="window.open('https://www.instagram.com/${ig}', '_blank')"
    >
      Instagram
    </button>
  `;
}

if (messengerUrl && socials) {
  socials.innerHTML += `
    <button
      class="m-btn m-btn--messenger"
      type="button"
      onclick="window.open('${messengerUrl}', '_blank')"
    >
      Messenger
    </button>
  `;
}

  /* =========================
     FEED — LOADING
  ========================= */
  feed.innerHTML = `<div style="padding:24px;text-align:center;opacity:.6">Loading posts…</div>`;

  /* =========================
     POSTS FETCH (APP PARITY)
  ========================= */
  const postsUrl = foreignUserId
  ? `${API_BASE}/api/posts?userId=${foreignUserId}`
  : `${API_BASE}/api/posts/me`;

  console.log("🧪 POSTS URL =", postsUrl);

  try {
    const res = await fetch(postsUrl, {
      headers: foreignUserId
        ? {}
        : { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json  = await res.json();
    let posts = Array.isArray(json)
  ? json
  : json.posts || json.data || [];

      // 🛑 SÉCURITÉ : ne garder QUE les posts du bon user
if (foreignUserId) {
  posts = posts.filter(p => String(p.user_id) === String(foreignUserId));
}

    feed.innerHTML = "";

    if (!posts.length) {
      feed.innerHTML = `<div style="padding:24px;text-align:center;opacity:.6">No posts yet.</div>`;
      return;
    }

    if (typeof window.renderPostItemMobile !== "function") {
      console.error("❌ renderPostItemMobile not loaded");
      return;
    }

    [...posts]
  .sort((a, b) =>
    new Date(b.created_time).getTime() -
    new Date(a.created_time).getTime()
  )
  .forEach((post) => {
    const el = window.renderPostItemMobile(post);
    el.setAttribute("data-post-id", post.id);
    feed.appendChild(el);
  });

    console.log("✅ Profile feed rendered");

  } catch (err) {
    console.error("❌ Profile feed error:", err);
    feed.innerHTML = `<div style="padding:24px;text-align:center;color:#ef4444">Failed to load posts</div>`;
  }
});