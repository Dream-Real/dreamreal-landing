/* =========================================
   Dream Real — Post Item (Mobile Web v1)
   Mirrors App UX (PUBLIC SAFE)
========================================= */

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

  const location =
    post.location ||
    post.localLocation?.label ||
    post.location?.label ||
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
  container.innerHTML = `
    <header class="post-header">
      <img
        class="post-avatar"
        src="${userAvatar}"
        alt=""
      />
      <div class="post-meta">
        <div class="post-user">
          ${userName}
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
     FEELING / ACTIVITY
  ----------------------------------------- */
  if (feeling && activity) {
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
    container.appendChild(bubble);
  }

  /* ----------------------------------------
     MESSAGE + VIEW MORE
  ----------------------------------------- */
  if (message) {
    const wrapper = document.createElement("div");
    wrapper.className = "post-message";

    const cleanText = message.replace(/https?:\/\/\S+/gi, "").trim();
    const text = document.createElement("p");
    text.textContent = cleanText;
    text.dataset.expanded = "false";

    if (cleanText.length > 140) {
      text.classList.add("collapsed");

      const toggle = document.createElement("button");
      toggle.className = "view-more-btn";
      toggle.textContent = "View more";

      toggle.onclick = () => {
        const expanded = text.dataset.expanded === "true";
        text.dataset.expanded = String(!expanded);
        text.classList.toggle("collapsed", expanded);
        toggle.textContent = expanded ? "View more" : "View less";
      };

      wrapper.appendChild(text);
      wrapper.appendChild(toggle);
    } else {
      wrapper.appendChild(text);
    }

    container.appendChild(wrapper);
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

    container.appendChild(carousel);
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