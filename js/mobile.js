/* =========================================
   DREAM REAL — MOBILE APP (PUBLIC FEED)
   Same logic as Desktop (no auth required)
========================================= */

console.log("🚀 mobile.js LOADED");

const ICON_INSTAGRAM = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
  <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zm-5 3.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 2a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"/>
</svg>
`;

const ICON_FACEBOOK = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
  <path d="M22 12a10 10 0 10-11.5 9.95v-7.04H8v-2.91h2.5V9.8c0-2.47 1.47-3.84 3.73-3.84 1.08 0 2.2.2 2.2.2v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54v1.85H16.3l-.4 2.91h-2.3v7.04A10 10 0 0022 12z"/>
</svg>
`;

const ICON_MESSENGER = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.9 1.45 5.45 3.74 7.13V22l3.42-1.88c.88.25 1.82.38 2.84.38 5.52 0 10-4.14 10-9.25S17.52 2 12 2zm1.13 12.38l-2.55-2.72-5 2.72 5.45-5.8 2.55 2.72 5-2.72-5.45 5.8z"/>
</svg>
`;

// =========================
// LEADERBOARD — SOURCE UNIQUE (DESKTOP PARITY)
// =========================

window.nearbyActive = false;
window.myPosition = null;

window.FEED_FILTERS = window.FEED_FILTERS || {
  feeling: null,
  activity: null,
};

// =========================
// MOBILE FILTERS — FEELINGS (DESKTOP PARITY)
// =========================
function renderMobileFeelings() {
  // 🔒 SAFETY — FEELINGS NOT LOADED
  if (!Array.isArray(window.FEELINGS) || !window.FEELINGS.length) {
    console.warn("⚠️ FEELINGS not loaded");

    const modal = document.getElementById("filters-modal");
    const sheet = modal?.querySelector(".filters-sheet");

    if (sheet) {
      sheet.innerHTML = `
        <div class="filters-empty">
          No filters available
        </div>
      `;
    }

    return;
  }
  const modal = document.getElementById("filters-modal");
  if (!modal) return;

  const sheet = modal.querySelector(".filters-sheet");
  if (!sheet) return;

 sheet.innerHTML = `
  <div class="filters-sheet-header">
    <button class="filters-back-btn hidden" aria-label="Back"></button>

    <div class="filters-sheet-title">Choose filter</div>

    <button class="filters-close-btn" aria-label="Close"></button>
  </div>

  <div class="filters-content">
    <div class="filters-grid"></div>
  </div>
`;

const closeBtn = sheet.querySelector(".filters-close-btn");
if (closeBtn) {
  closeBtn.onclick = closeMobileFilters;
}

const grid = sheet.querySelector(".filters-grid");

  window.FEELINGS.forEach((feeling) => {
    const pill = document.createElement("div");
    pill.className = "filter-pill";

    pill.innerHTML = `
      <img src="https://dreamreal-images.s3.eu-west-3.amazonaws.com/${feeling.image}" />
      <span>${feeling.title}</span>
    `;

    pill.onclick = () => {
  // ❌ pas de commit ici
  renderMobileActivities(feeling.id, feeling);
};

    grid.appendChild(pill);
  });
}

// =========================
// MOBILE FILTERS — ACTIVITIES (DESKTOP PARITY)
// =========================
function renderMobileActivities(feelingId, feeling) {
  // 🔒 SAFETY — ACTIVITIES NOT LOADED
  if (!Array.isArray(window.ACTIVITIES) || !window.ACTIVITIES.length) {
    console.warn("⚠️ ACTIVITIES not loaded");

    const modal = document.getElementById("filters-modal");
    const sheet = modal?.querySelector(".filters-sheet");

    if (sheet) {
      sheet.innerHTML = `
        <div class="filters-empty">
          No activities available
        </div>
      `;
    }

    return;
  }
  const modal = document.getElementById("filters-modal");
  if (!modal) return;

  const sheet = modal.querySelector(".filters-sheet");
  if (!sheet) return;

  sheet.innerHTML = `
  <div class="filters-sheet-header">
    <button class="filters-back-btn" aria-label="Back"></button>

    <div class="filters-sheet-title">Choose filter</div>

    <button class="filters-close-btn hidden" aria-label="Close"></button>
  </div>

  <div class="filters-content">
    <div class="filters-grid"></div>
  </div>
`;

const backBtn = sheet.querySelector(".filters-back-btn");
if (backBtn) {
  backBtn.onclick = renderMobileFeelings;
}

const grid = sheet.querySelector(".filters-grid");

  const related = window.ACTIVITIES.filter(
    (a) => a.feeling_id === feelingId
  );

  // 🔹 ALL (exact desktop logic)
  const allBtn = document.createElement("div");
  allBtn.className = "filter-pill";
  allBtn.innerHTML = `<span>All</span>`;

  allBtn.onclick = () => {
  window.setFilterFeeling(feeling); // ✅ commit explicite
  window.setFilterActivity(null);
  closeMobileFilters();
};

  grid.appendChild(allBtn);

  // 🔹 ACTIVITIES
  related.forEach((activity) => {
    const pill = document.createElement("div");
    pill.className = "filter-pill";

    pill.innerHTML = `
      <img src="https://dreamreal-images.s3.eu-west-3.amazonaws.com/${activity.image}" />
      <span>${activity.title}</span>
    `;

    pill.onclick = () => {
  window.setFilterFeeling(feeling); // ✅ commit ici
  window.setFilterActivity(activity);
  closeMobileFilters();
};

    grid.appendChild(pill);
  });
}

const API_URL =
  window.API_URL || "https://dreamreal-api.onrender.com";

  window.API_BASE = window.API_BASE || window.API_URL;

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

  // 👤 ME SCREEN uniquement si présent
  if (document.getElementById("lb-users-grid")) {
    initMobileMeScreen();
  }
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

      // =========================
// 🔑 SOURCE UNIQUE DE VÉRITÉ — FILTERS (DESKTOP PARITY)
// =========================
window.FEED_POSTS = normalizedPosts;

      console.log(
  "🧪 FEELING SHAPE",
  normalizedPosts.map(p => p.feeling)
);

      renderLookingFor(normalizedPosts);

    renderFeed(normalizedPosts);
    renderActiveFilters(); // ✅ OBLIGATOIRE
    updateFiltersButton(); // ✅ OBLIGATOIRE

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

function closeMobileFilters() {
  const modal = document.getElementById("filters-modal");
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";

  // 🔑 RESET NAVIGATION FLOW (IMPORTANT)
  requestAnimationFrame(() => {
    renderMobileFeelings();
  });
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
// =========================
// FEED — FILTERED RENDER (MOBILE PARITY)
// =========================
window.renderFilteredFeed = function () {
  if (!Array.isArray(window.FEED_POSTS)) return;

  const { feeling, activity } = window.FEED_FILTERS || {};

  // 🔑 AUCUN FILTRE → FEED COMPLET (DESKTOP PARITY)
  if (!feeling && !activity) {
    renderFeed(window.FEED_POSTS);
    renderActiveFilters();
    return;
  }

  const filtered = window.FEED_POSTS.filter((post) => {
    // 🔒 UX safety — si filtre actif, exclut posts sans mood
    if ((feeling || activity) && !post.feeling) return false;

    const matchFeeling =
      !feeling || post.feeling?.title === feeling.title;

    const matchActivity =
      !activity || post.activity?.title === activity.title;

    return matchFeeling && matchActivity;
  });

  renderFeed(filtered);
  renderActiveFilters();
};

// =========================
// ACTIVE FILTERS — RENDER (MOBILE PARITY)
// =========================
function renderActiveFilters() {
  const container = document.getElementById("active-filters");
  if (!container) return;

  const { feeling, activity } = window.FEED_FILTERS;

  container.innerHTML = "";

  // 🔒 Aucun filtre → cacher
  if (!feeling && !activity) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");

  // 🔹 FEELING
  if (feeling) {
  const pill = document.createElement("div");
  pill.className = "active-filter-pill feeling";

  pill.innerHTML = `
    <img src="https://dreamreal-images.s3.eu-west-3.amazonaws.com/${feeling.image}" />
    <span>${feeling.title}</span>
  `;

  pill.onclick = () => {
    window.clearFilters();
  };

  container.appendChild(pill);
}

  // 🔹 ACTIVITY
  if (activity) {
  const pill = document.createElement("div");
  pill.className = "active-filter-pill activity";

  pill.innerHTML = `
    <img src="https://dreamreal-images.s3.eu-west-3.amazonaws.com/${activity.image}" />
    <span>${activity.title}</span>
  `;

  pill.onclick = () => {
    window.setFilterActivity(null);
  };

  container.appendChild(pill);
}
updateFiltersButton();
}

// =========================
// FILTER BUTTON — TEXT + COLOR (MOBILE PARITY)
// =========================
function updateFiltersButton() {
  const btn = document.getElementById("open-filters-btn");
  if (!btn) return;

  const { feeling, activity } = window.FEED_FILTERS || {};

  if (feeling || activity) {
    btn.textContent = "Clear";
    btn.classList.add("is-clear");
  } else {
    btn.textContent = "Filters";
    btn.classList.remove("is-clear");
  }
}

// =========================
// FILTER ACTIONS — SOURCE UNIQUE (MOBILE PARITY)
// =========================
window.setFilterFeeling = function (feeling) {
  window.FEED_FILTERS.feeling = feeling;
  window.FEED_FILTERS.activity = null;

  window.renderFilteredFeed();
  renderActiveFilters();
  updateFiltersButton();
};

window.setFilterActivity = function (activity) {
  window.FEED_FILTERS.activity = activity;

  window.renderFilteredFeed();
  renderActiveFilters();
  updateFiltersButton();
};

window.clearFilters = function () {
  window.FEED_FILTERS.feeling = null;
  window.FEED_FILTERS.activity = null;

  window.renderFilteredFeed();
  renderActiveFilters();
  updateFiltersButton();
};

/* -----------------------------------------
   FILTERS — OPEN MODAL (MOBILE)
----------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const openFiltersBtn = document.getElementById("open-filters-btn");
  const filtersModal = document.getElementById("filters-modal");

  if (!openFiltersBtn || !filtersModal) {
    console.warn("❌ Mobile filters button or modal not found");
    return;
  }

  openFiltersBtn.addEventListener("click", () => {
  const { feeling, activity } = window.FEED_FILTERS || {};

  // 🔵 MODE CLEAR → reset des filtres + feed global
  if (feeling || activity) {
    window.clearFilters();
    return;
  }

  // 🟡 MODE FILTERS → ouverture modale
  console.log("🔥 FILTERS CLICKED");

  filtersModal.hidden = false;
  document.body.style.overflow = "hidden";

  // 🔑 ATTEND LE REPAINT AVANT D’INJECTER
  requestAnimationFrame(() => {
    renderMobileFeelings();
  });
});
});

// =========================
// LEADERBOARD — RENDER USERS (DESKTOP → MOBILE)
// =========================
window.renderLeaderboardUsers = function (users) {
  const grid = document.getElementById("lb-users-grid");
  if (!grid) return;

  grid.innerHTML = "";

  users.forEach((user) => {
    const card = document.createElement("div");
    card.className = "lb-user-card";

    card.innerHTML = `
      <div class="lb-user-header">
        <img
  class="lb-user-avatar"
  src="${user.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}"
/>

<div class="lb-user-name">
  ${
    user.name ||
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    "User"
  }
</div>
        ${
  user.distance || user.distance_km
    ? `<div class="lb-user-distance">${user.distance || user.distance_km} km away</div>`
    : ""
}
      </div>
    `;

    grid.appendChild(card);
  });
};

// =========================
// LEADERBOARD — USER NORMALIZER (MOBILE PARITY)
// =========================
function normalizeUserForMobile(user) {
  return {
    ...user,

    // 🔑 ALIGNEMENT BACKEND → MOBILE
    feeling: user.today_feeling || null,
    activity: user.today_activity || null,

    instagram: user.instagram_username || null,
    facebook: user.facebook_url || null,
    messenger: user.messenger_url || null,
  };
}

// =========================
// LEADERBOARD — LOAD USERS (DESKTOP PARITY)
// =========================
window.loadLeaderboardUsers = async function () {
  const grid = document.getElementById("lb-users-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id;

  try {
    let url = `${API_BASE}/api/users`;

    if (nearbyActive && myPosition) {
      const radius = window.NEARBY_RADIUS || 15000;
      url = `${API_BASE}/api/users/nearby?lat=${myPosition.lat}&lng=${myPosition.lng}&radius=${radius}`;
    }

    console.log("📡 Leaderboard fetch:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      console.warn("❌ leaderboard fetch failed", res.status);
      return;
    }

    const data = await res.json();
    const users = (Array.isArray(data) ? data : data.users || [])
  .map(normalizeUserForMobile);

    users.forEach((user) => {
  // 🚫 Exclure soi-même en Nearby (PARITÉ DESKTOP — NE PAS TOUCHER)
  if (nearbyActive && currentUserId && user.id === currentUserId) return;

  const card = document.createElement("div");
  card.className = "lb-user-card";

  card.innerHTML = `
  <img
    src="${user.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}"
    alt="${user.display_name || "User"}"
  />

  <div class="lb-user-overlay">
    <div class="lb-user-name">
      ${user.display_name ||
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        "User"}
    </div>

    ${
      user.feeling
        ? `<div class="lb-user-mood">
            ${
              user.feeling.image
                ? `<img src="https://dreamreal-images.s3.eu-west-3.amazonaws.com/${user.feeling.image}" />`
                : ""
            }
            <span>${user.feeling.title}</span>
          </div>`
        : ""
    }

    ${
      typeof user.distance === "number"
        ? `<div class="lb-user-meta">
            ${user.distance < 1000
              ? `${user.distance} m`
              : `${(user.distance / 1000).toFixed(1)} km`}
          </div>`
        : ""
    }

   <div class="lb-user-socials">

  ${
    user.instagram
      ? `
        <a
          class="lb-social ig"
          href="https://www.instagram.com/${user.instagram}"
          target="_blank"
          rel="noopener"
          onclick="event.stopPropagation()"
        >
          ${ICON_INSTAGRAM}
        </a>
      `
      : ""
  }

  ${
    user.facebook
      ? `
        <a
          class="lb-social fb"
          href="${user.facebook}"
          target="_blank"
          rel="noopener"
          onclick="event.stopPropagation()"
        >
          ${ICON_FACEBOOK}
        </a>
      `
      : ""
  }

  ${
    user.messenger
      ? `
        <a
          class="lb-social ms"
          href="${user.messenger}"
          target="_blank"
          rel="noopener"
          onclick="event.stopPropagation()"
        >
          ${ICON_MESSENGER}
        </a>
      `
      : ""
  }

</div>
  </div>
`;

  grid.appendChild(card);
});
  } catch (err) {
    console.error("❌ leaderboard error", err);
  }
};

/* =========================================
   MOBILE — ME SCREEN
   Ready to engage (desktop logic reuse)
========================================= */

function initMobileMeScreen() {
  const grid = document.getElementById("lb-users-grid");
  const nearbyBtn = document.getElementById("me-nearby-btn");

  if (!grid) {
    console.warn("❌ lb-users-grid not found (me screen)");
    return;
  }

  console.log("👤 initMobileMeScreen");

  // 🔁 RÉUTILISATION DIRECTE DU DESKTOP
  loadLeaderboardUsers?.();

  /* =========================
     NEARBY (EXACT DESKTOP)
  ========================= */

  if (nearbyBtn) {
    nearbyBtn.addEventListener("click", async () => {
      if (!nearbyActive) {
        if (!navigator.geolocation) {
          alert("Geolocation not supported");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            myPosition = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };

            // 🔴 ENREGISTRE POSITION (SOURCE UNIQUE)
            await fetch(`${API_BASE}/api/users/me/location`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                latitude: myPosition.lat,
                longitude: myPosition.lng,
              }),
            });

            nearbyActive = true;
            nearbyBtn.classList.add("active");

            loadLeaderboardUsers();
          },
          () => {
            nearbyActive = false;
            myPosition = null;
            nearbyBtn.classList.remove("active");
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          }
        );
      } else {
        // 🔁 OFF
        nearbyActive = false;
        myPosition = null;
        nearbyBtn.classList.remove("active");
        loadLeaderboardUsers();
      }
    });
  }

  /* =========================
     USER (CACHE ONLY)
  ========================= */

  const userRaw = localStorage.getItem("user");
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);

      const avatar = document.getElementById("me-avatar");
      const name = document.getElementById("me-name");

      if (avatar && user.avatar) {
        avatar.src = user.avatar;
      }

      if (name) {
        name.textContent =
          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          user.name ||
          "User";
      }
    } catch {
      console.warn("⚠️ invalid cached user");
    }
  }
}