/* =========================================
   DREAM REAL — MOBILE APP (PUBLIC FEED)
   Same logic as Desktop (no auth required)
========================================= */

const API_URL =
  window.API_URL || "https://dreamreal-api.onrender.com";

/* -----------------------------------------
   DOM TARGETS
----------------------------------------- */

let feedContainer = null;

/* -----------------------------------------
   INIT
----------------------------------------- */

document.addEventListener("DOMContentLoaded", initMobileApp);

async function initMobileApp() {
  console.log("📱 initMobileApp (public feed)");

  feedContainer = document.querySelector("#feed");

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

/* -----------------------------------------
   RENDER
----------------------------------------- */

function renderFeed(posts) {
  console.log("🧱 renderFeed:", posts.length);

  feedContainer.innerHTML = "";

  posts.forEach((post, index) => {
    try {
      const el = window.renderPostItemMobile(post);
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