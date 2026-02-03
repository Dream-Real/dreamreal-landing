/* =========================================
   DREAM REAL — MOBILE APP (PUBLIC FEED)
   Same logic as Desktop (no auth required)
========================================= */

console.log("🚀 mobile.js LOADED");

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