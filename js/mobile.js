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

document.addEventListener("DOMContentLoaded", initMobileApp);

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

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("mobile-create-btn");

  if (!createBtn) {
    console.warn("❌ #mobile-create-btn not found");
    return;
  }

  console.log("➕ Create button detected (mobile)");

  createBtn.addEventListener("click", () => {
    console.log("🔥 CREATE CLICK (mobile)");

    if (typeof window.openCreatePost === "function") {
      window.openCreatePost();
    } else {
      console.warn("❌ window.openCreatePost not available");
    }
  });
});