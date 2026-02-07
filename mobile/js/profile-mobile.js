/* =========================================
   DREAM REAL — PROFILE (MOBILE)
   Final, app-aligned version
========================================= */

console.log("👤 profile-mobile.js LOADED");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("👤 profile-mobile DOMContentLoaded");

  const header = document.getElementById("profile-header");
  const actions = document.getElementById("profile-actions");
  const feed = document.getElementById("profile-feed");

  if (!header || !actions || !feed) {
    console.error("❌ Profile DOM nodes missing");
    return;
  }

  /* =========================
     AUTH / USER
  ========================= */
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    console.warn("🔒 Not authenticated → redirect login");
    window.location.href = "/mobile/login.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    console.error("❌ Invalid user in localStorage");
    return;
  }

  if (!user.id) {
    console.error("❌ user.id missing");
    return;
  }

  console.log("👤 Profile user:", user);

  /* =========================
     HEADER (COMPACT, APP-LIKE)
  ========================= */
  header.innerHTML = `
    <div class="profile-header-inner">
      <img
        class="profile-avatar"
        src="${
          user.avatar && user.avatar.startsWith("http")
            ? user.avatar
            : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
        }"
        alt="Avatar"
      />
      <div class="profile-name">
        ${
          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          user.name ||
          "User"
        }
      </div>
    </div>
  `;

  /* =========================
     ACTIONS
  ========================= */
  actions.innerHTML = `
    <button class="profile-btn primary" id="profile-add-post">
      Add post
    </button>
  `;

  const addPostBtn = document.getElementById("profile-add-post");
  if (addPostBtn) {
    addPostBtn.addEventListener("click", () => {
      if (typeof window.openCreatePost === "function") {
        window.openCreatePost();
      } else {
        console.warn("⚠️ openCreatePost not available");
      }
    });
  }

  /* =========================
     FEED — LOADING STATE
  ========================= */
  feed.innerHTML = `
    <div style="padding:24px;text-align:center;opacity:.6">
      Loading your posts…
    </div>
  `;

  /* =========================
     FETCH USER POSTS ONLY
  ========================= */
  const API_BASE =
    window.API_BASE ||
    window.API_URL ||
    "https://dreamreal-api.onrender.com";

  try {
    console.log("📡 Fetch profile posts for user_id =", user.id);

    const res = await fetch(
  `${API_BASE}/api/posts/me`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    const posts = Array.isArray(json)
      ? json
      : json.posts || json.data || [];

    console.log("📦 Profile posts received:", posts.length);

    feed.innerHTML = "";

    if (!posts.length) {
      feed.innerHTML = `
        <div style="padding:24px;text-align:center;opacity:.6">
          You haven’t posted anything yet.
        </div>
      `;
      return;
    }

    if (typeof window.renderPostItemMobile !== "function") {
      console.error("❌ renderPostItemMobile not loaded");
      return;
    }

    posts
      .sort(
        (a, b) =>
          new Date(b.created_time).getTime() -
          new Date(a.created_time).getTime()
      )
      .forEach((post, index) => {
        try {
          const el = window.renderPostItemMobile(post);
          el.setAttribute("data-post-id", post.id);
          feed.appendChild(el);
        } catch (err) {
          console.warn("⚠️ Failed to render post", index, err);
        }
      });

    console.log("✅ Profile feed rendered (user-only)");

  } catch (err) {
    console.error("❌ Profile feed error:", err);
    feed.innerHTML = `
      <div style="padding:24px;text-align:center;color:#ef4444">
        Failed to load your posts
      </div>
    `;
  }
});