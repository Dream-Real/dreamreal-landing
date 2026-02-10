/* =========================================
   DREAM REAL — PROFILE (MOBILE)
   Final, app-aligned, SAFE version
========================================= */

console.log("👤 profile-mobile.js LOADED");

// =========================================
// FILTERS STATE — PROFILE (MOBILE)
// SOURCE UNIQUE (HOME PARITY)
// =========================================
window.FEED_FILTERS = window.FEED_FILTERS || {
  feeling: null,
  activity: null,
};

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
  typeof user.avatar === "string" &&
  (
    user.avatar.startsWith("http") ||
    user.avatar.startsWith("data:image")
  )
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
  src=""
  data-src="${coverUrl}"
  alt=""
  draggable="false"
  style="display:none"
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

/* =========================
   PROFILE — FIRST PAINT REVEAL (FINAL)
========================= */
requestAnimationFrame(() => {
  if (!header) return;

  // Réveille TOUT le header (textes inclus)
  header.style.opacity = "1";
  header.style.pointerEvents = "auto";

  // Sécurité ciblée
  const cover = header.querySelector(".m-profile-cover");
  if (cover) cover.style.opacity = "1";

  const avatar = header.querySelector(".m-profile-avatar-btn");
  if (avatar) avatar.style.opacity = "1";
});

/* =========================
   PROFILE — FEED VISIBILITY REVEAL
   (CRITICAL)
========================= */
requestAnimationFrame(() => {
  const feedHeader = document.querySelector(".profile-feed-header");
  const feedRoot   = document.getElementById("profile-feed");

  if (feedHeader) {
    feedHeader.style.opacity = "1";
    feedHeader.style.visibility = "visible";
    feedHeader.style.pointerEvents = "auto";
  }

  if (feedRoot) {
    feedRoot.style.opacity = "1";
    feedRoot.style.visibility = "visible";
    feedRoot.style.pointerEvents = "auto";
  }
});

/* =========================
   COVER CHANGE BUTTON (OWN PROFILE ONLY)
   🔒 Anti-flash, app parity
========================= */
if (!foreignUserId) {
  const cover = header.querySelector(".m-profile-cover");

  if (cover) {
    const btn = document.createElement("button");
    btn.id = "profile-cover-btn";
    btn.className = "m-profile-cover-btn";
    btn.type = "button";
    btn.textContent = "Change";

    // sécurité anti-flash (même si CSS régressait)
    btn.style.display = "inline-flex";

    cover.appendChild(btn);
  }
}

/* =========================
   OWNER-ONLY UI — SAFE REVEAL
========================= */
if (!foreignUserId) {
  const avatarBtn = header.querySelector("#profile-avatar-btn");
  if (avatarBtn) avatarBtn.style.visibility = "visible";

  const avatarRing = header.querySelector(".m-profile-avatar-ring");
  if (avatarRing) avatarRing.style.visibility = "visible";
}

// ✅ COVER: préload + swap (éradique le placeholder Safari: "cover" + cadre blanc)
(() => {
  const coverImg = header.querySelector(".m-profile-cover-img");
  if (!coverImg) return;

  // cache immédiatement (sans dépendre du CSS)
  coverImg.style.display = "none";

  const target = coverImg.getAttribute("data-src");
  if (!target) return;

  const reveal = () => {
  coverImg.style.display = "block";
  coverImg.style.opacity = "1";
};

  const pre = new Image();
  pre.decoding = "async";
  pre.onload = () => {
    coverImg.onload = reveal;      // reveal seulement quand le DOM img a réellement chargé
    coverImg.src = target;
  };
  pre.onerror = () => {
    // fallback solide si une cover est invalide
    coverImg.onload = reveal;
    coverImg.src = FALLBACK_COVER;
  };
  pre.src = target;
})();

/* 🔑 REBIND SOCIALS — MUST BE AFTER header.innerHTML */
const socials = document.getElementById("profile-socials");

if (!socials) {
  console.warn("⚠️ profile-socials not found after render");
}

/* =========================
   PROFILE — FEED FILTERS (HOME PARITY)
   🔑 reuse existing mobile filters logic
========================= */
const filtersBtn   = document.getElementById("profile-filters-btn");
const filtersModal = document.getElementById("filters-modal");

if (filtersBtn && filtersModal) {
  filtersBtn.addEventListener("click", () => {
    const { feeling, activity } = window.FEED_FILTERS || {};

    // 🔁 MODE CLEAR (exactement comme HOME)
    if (feeling || activity) {
      window.clearFilters();
      return;
    }

    // 🔓 OUVERTURE DE LA MODALE FILTERS (HOME LOGIC)
    filtersModal.hidden = false;
    document.body.style.overflow = "hidden";

    // ⏳ attendre le repaint avant injection (pixel-perfect)
    requestAnimationFrame(() => {
      renderMobileFeelings();
    });
  });
} else {
  console.warn("⚠️ profile-filters-btn or filters-modal not found");
}

/* =========================
   PROFILE — FILTERED FEED
   (LOCAL, SAFE)
========================= */
function renderProfileFilteredFeed() {
  if (!Array.isArray(window.PROFILE_POSTS)) return;

  const { feeling, activity } = window.FEED_FILTERS || {};

  // 🔹 Aucun filtre → feed complet
  if (!feeling && !activity) {
    feed.innerHTML = "";
    window.PROFILE_POSTS.forEach(renderProfilePost);
    return;
  }

  const filtered = window.PROFILE_POSTS.filter((post) => {
    if ((feeling || activity) && !post.feeling) return false;

    const matchFeeling =
      !feeling || post.feeling?.title === feeling.title;

    const matchActivity =
      !activity || post.activity?.title === activity.title;

    return matchFeeling && matchActivity;
  });

  feed.innerHTML = "";

  if (!filtered.length) {
    feed.innerHTML = `
      <div style="padding:24px;text-align:center;opacity:.6">
        No posts match these filters
      </div>
    `;
    return;
  }

  filtered.forEach(renderProfilePost);
}

// 🔑 Bridge Home → Profile (OBLIGATOIRE)
window.renderFilteredFeed = renderProfileFilteredFeed;

function renderProfilePost(post) {
  const el = window.renderPostItemMobile(post);
  el.setAttribute("data-post-id", post.id);
  feed.appendChild(el);
}

/* =========================
   PROFILE — FILTERS BRIDGE
   (CRITICAL)
========================= */

// 🔁 Appelé automatiquement quand les filtres changent (Home logic)
window.onFiltersUpdated = function () {
  console.log("🔁 Profile filters updated", window.FEED_FILTERS);
  renderProfileFilteredFeed();
};

  /* =========================
   TODAY MOOD
========================= */
const todayFeeling = user.today_feeling || null;

if (todayFeeling?.title && todayFeeling?.image) {
  const moodWrap = document.getElementById("profile-mood");
  const moodText = document.getElementById("profile-mood-text");
  const moodIcon = document.getElementById("profile-mood-icon");

  moodWrap.hidden = false;

  // reset propre
  moodText.textContent = "";

  // Texte AVANT emoji
  moodText.append("I’m feeling ");

  // Emoji inline, aligné visuellement
  moodIcon.src = `${CDN}/${todayFeeling.image}`;
  moodIcon.alt = "";
  moodIcon.setAttribute("aria-hidden", "true");
  moodIcon.style.verticalAlign = "-0.15em";

  moodText.appendChild(moodIcon);

  // Texte APRÈS emoji
  moodText.append(` ${todayFeeling.title} today`);
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
      View Facebook Profile
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
      View Instagram Profile
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
      Message on Messenger
    </button>
  `;
}

  /* =========================
     FEED — LOADING
  ========================= */
  feed.innerHTML = `<div style="padding:24px;text-align:center;opacity:.6">Loading posts…</div>`;

  function normalizePostForProfile(post) {
  return {
    id: post.id,

    user_id:
      post.user?.id ||
      post.user_id ||
      post.author_id ||
      null,

    user_first_name: post.user_first_name || "",
    user_last_name: post.user_last_name || "",
    user_avatar:
      post.user_avatar ||
      post.profile_picture ||
      "https://cdn-icons-png.flaticon.com/512/847/847969.png",

    message: post.message || "",

    localLocation: post.localLocation || post.location || null,

    // 🔑 CRITIQUE POUR LES FILTRES
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

// 🔑 SOURCE PROFILE — NORMALISÉE (OBLIGATOIRE)
window.PROFILE_POSTS = posts.map(normalizePostForProfile);

    feed.innerHTML = "";

    if (!posts.length) {
      feed.innerHTML = `<div style="padding:24px;text-align:center;opacity:.6">No posts yet.</div>`;
      return;
    }

    if (typeof window.renderPostItemMobile !== "function") {
      console.error("❌ renderPostItemMobile not loaded");
      return;
    }

    // 🔑 RENDU INITIAL (avec filtres)
renderProfileFilteredFeed();

    console.log("✅ Profile feed rendered");

  } catch (err) {
    console.error("❌ Profile feed error:", err);
    feed.innerHTML = `<div style="padding:24px;text-align:center;color:#ef4444">Failed to load posts</div>`;
  }
});