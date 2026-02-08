/* =========================================
   Dream Real — Post Item (Mobile Web v1)
   Mirrors App UX (PUBLIC SAFE)
========================================= */

console.log("🔥 post-item-mobile.js start");

const CDN_URL = "https://dreamreal-images.s3.eu-west-3.amazonaws.com";
const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/847/847969.png";

window.renderPostItemMobile = function renderPostItemMobile(post) {
  if (!post || typeof post !== "object") {
    console.warn("⚠️ Invalid post", post);
    return document.createElement("div");
  }

  const container = document.createElement("article");
  container.className = "post-item-mobile";

  /* ----------------------------------------
     NORMALISATION SAFE (desktop-compatible)
  ----------------------------------------- */

  const userName =
    post.user?.name ||
    `${post.user_first_name || ""} ${post.user_last_name || ""}`.trim() ||
    "Dream Real";

  const userAvatar =
    post.user?.avatar ||
    post.user_avatar ||
    post.profile_picture ||
    FALLBACK_AVATAR;

    // ✅ Author-first: on veut l'auteur du post, pas le viewer
const userId =
  post.author_id ??
  post.author?.id ??
  post.user_id ??
  post.userId ??
  post.user?.id ?? // en dernier recours seulement
  null;

  const myUserId = (() => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.id ?? null;
  } catch {
    return null;
  }
})();

console.log("🧪 CLICK DEBUG", {
  viewerId: JSON.parse(localStorage.getItem("user"))?.id,
  postAuthorId:
    post.user?.id ??
    post.author?.id ??
    post.user_id ??
    post.author_id ??
    null,
  post,
});

  const location =
  typeof post.location === "string"
    ? post.location
    : post.location?.label ||
      post.localLocation?.label ||
      post.location?.name ||
      null;

  const createdAt =
    post.createdAt ||
    post.created_time ||
    null;

  const message =
    post.message ||
    "";

  const feeling =
    post.mood?.feeling ||
    post.feeling ||
    null;

  const activity =
    post.mood?.activity ||
    post.activity ||
    null;

  const youtubeUrl =
    post.youtube_url || null;

  const videoUrl =
    post.video || post.video_url || null;

  const images =
    Array.isArray(post.images) && post.images.length
      ? post.images
      : Array.isArray(post.multiple_images) && post.multiple_images.length
        ? post.multiple_images
        : post.full_picture
          ? [post.full_picture]
          : [];

  /* ----------------------------------------
     HEADER
  ----------------------------------------- */

const isProfilePage = document.body.classList.contains("profile-page");
const profileHref =
  userId
    ? `/mobile/profile-mobile.html?userId=${encodeURIComponent(userId)}`
    : null;

  console.log("🧩 isProfilePage =", document.body.classList.contains("profile-page"));
console.log("🧩 userId =", userId, "post keys:", Object.keys(post || {}), "post.user:", post.user);
  
  container.innerHTML = `
    <header class="post-header">
      <img
        class="post-avatar"
        src="${userAvatar}"
        alt=""
      />
      <div class="post-meta">
        <div class="post-user">
  ${
    !isProfilePage && profileHref
      ? `<a class="post-username post-username-link" href="${profileHref}">
           ${userName}
         </a>`
      : `<span class="post-username">${userName}</span>`
  }
  ${
    location
      ? `<span class="post-location"> in ${location}</span>`
      : ""
  }
</div>
        <div class="post-date">
          ${
            createdAt
              ? new Date(createdAt).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
        </div>
      </div>
    </header>
  `;

  /* ----------------------------------------
   FEELING / ACTIVITY + VIEW MORE (APP-LIKE)
----------------------------------------- */
let messageNode = null;

if (feeling && activity) {
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "8px";
  row.style.margin = "8px 12px 6px";

  const bubble = document.createElement("div");
  bubble.className = "post-feeling-bubble";
  bubble.innerHTML = `
    <span>${feeling.title}</span>
    ${
      activity.image
        ? `<img src="${CDN_URL}/${activity.image}" alt="" />`
        : ""
    }
    <span>${activity.title}</span>
  `;

  row.appendChild(bubble);

  // 👉 SI BIO PRÉSENTE → bouton View more
  const cleanText = message.replace(/https?:\/\/\S+/gi, "").trim();

  if (cleanText) {
    const toggle = document.createElement("button");
    toggle.className = "view-more-btn";
    toggle.textContent = "View more";

   toggle.onclick = () => {
  if (!messageNode) return;

  messageNode.style.display = "block";
  messageNode.dataset.expanded = "true";

  // 🔑 cacher View more quand la bio est visible
  toggle.style.display = "none";
};

    row.appendChild(toggle);

    // bio (cachée par défaut)
    messageNode = document.createElement("div");
    messageNode.className = "post-message";
    messageNode.style.display = "none";
    messageNode.dataset.expanded = "false";

    const p = document.createElement("p");

const textSpan = document.createElement("span");
textSpan.textContent = cleanText;

const viewLess = document.createElement("span");
viewLess.textContent = "\u00A0\u00A0View less";
viewLess.className = "view-more-btn"; // on réutilise le style
viewLess.className = "view-more-btn view-less-btn"; // 👈 CLASSE DÉDIÉE
viewLess.style.display = "inline";
viewLess.style.cursor = "pointer";

viewLess.onclick = () => {
  messageNode.dataset.expanded = "false";
  messageNode.style.display = "none";

  // 🔑 réafficher View more
  toggle.style.display = "inline-flex";
};

p.appendChild(textSpan);
p.appendChild(viewLess);
messageNode.appendChild(p);
  }

  container.appendChild(row);

  if (messageNode) {
    container.appendChild(messageNode);
  }
}

   /* ----------------------------------------
     MEDIA
  ----------------------------------------- */

  // YouTube
  if (youtubeUrl) {
    const ytId = extractYouTubeId(youtubeUrl);
    if (ytId) {
      const yt = document.createElement("div");
      yt.className = "post-youtube";
      yt.innerHTML = `
        <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="" />
        <div class="yt-play">▶</div>
      `;
      yt.onclick = () =>
        window.open(`https://www.youtube.com/watch?v=${ytId}`, "_blank");
      container.appendChild(yt);
    }
  }

// 🔥 LINK PREVIEW (CLASSIC — MOBILE, APP PARITY)
else if (post.link_preview && post.link_preview.url) {
  const wrapper = document.createElement("div");
  wrapper.className = "post-media link-preview";

  wrapper.innerHTML = `
  ${
    post.link_preview.image
      ? `<img src="${post.link_preview.image}" alt="" />`
      : ""
  }

  <div class="link-preview-body">
    ${
      post.link_preview.siteName
        ? `<div class="link-preview-site">${post.link_preview.siteName}</div>`
        : ""
    }
    ${
      post.link_preview.title
        ? `<div class="link-preview-title">${post.link_preview.title}</div>`
        : ""
    }
    ${
      post.link_preview.description
        ? `<div class="link-preview-desc">${post.link_preview.description}</div>`
        : ""
    }
  </div>
`;

wrapper.onclick = () => {
  window.open(post.link_preview.url, "_blank");
};

  container.appendChild(wrapper);
}

  // Video
  else if (videoUrl) {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.controls = true;
    video.playsInline = true;
    video.className = "post-video";
    container.appendChild(video);
  }

  // Images
else if (images.length > 1) {
  const carousel = document.createElement("div");
  carousel.className = "post-carousel";

  images.forEach((src) => {
  const img = document.createElement("img");
  img.src = src;
  carousel.appendChild(img);
});

  /* ---------- DOTS ---------- */
const dots = document.createElement("div");
dots.className = "carousel-dots";

images.forEach((_, i) => {
  const dot = document.createElement("span");
  if (i === 0) dot.classList.add("active");
  dots.appendChild(dot);
});

/* ---------- SYNC SCROLL → DOTS ---------- */
let raf = null;
const GAP = 12;

carousel.addEventListener("scroll", () => {
  if (raf) return;

  raf = requestAnimationFrame(() => {
    const pageWidth = carousel.clientWidth + GAP;
    const index = Math.round(carousel.scrollLeft / pageWidth);

    [...dots.children].forEach((d, i) => {
      d.classList.toggle("active", i === index);
    });

    raf = null;
  });
});

  const mediaWrapper = document.createElement("div");
mediaWrapper.className = "post-media carousel";

mediaWrapper.appendChild(carousel);
mediaWrapper.appendChild(dots);

container.appendChild(mediaWrapper);
}

  else if (images.length === 1) {
    const img = document.createElement("img");
    img.src = images[0];
    img.className = "post-image";
    container.appendChild(img);
  }

  /* ----------------------------------------
     REACTIONS
  ----------------------------------------- */
  const reactions = document.createElement("div");
  reactions.className = "post-reactions";
  reactions.innerHTML = `
    <span>${post.reactions?.summary || post.reactions_summary || "👍"} ${
      post.reactions?.count || post.reactions_count || 0
    }</span>
    <span>${post.comments_count || 0} Comments</span>
  `;
  container.appendChild(reactions);

  /* ----------------------------------------
     FACEBOOK LINK
  ----------------------------------------- */
  if (post.permalink_url) {
    const fb = document.createElement("a");
    fb.className = "post-fb-link";
    fb.href = post.permalink_url;
    fb.target = "_blank";
    fb.textContent = "View on Facebook";
    container.appendChild(fb);
  }

  return container;
};

/* ----------------------------------------
   Utils
----------------------------------------- */
function extractYouTubeId(url) {
  if (!url) return null;
  const match =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?&]+)/);
  return match ? match[1] : null;
}
console.log("🔥 post-item-mobile.js end");