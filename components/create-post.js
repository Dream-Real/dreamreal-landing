/* =========================================================
   CREATE POST — WINDOW SAFE VERSION (NO MODULES)
   ========================================================= */

const CDN_URL = "https://dreamreal-images.s3.eu-west-3.amazonaws.com";

/* =========================================================
   MOUNT
   ========================================================= */

function mountCreatePost() {
  console.log("✅ mountCreatePost called");

  const root = document.getElementById("create-post-root");
  if (!root) {
    console.warn("❌ #create-post-root not found");
    return;
  }

  root.innerHTML = `
    <div class="cp-overlay hidden" id="cp-overlay">
      <div class="cp-modal">

        <div class="cp-header">
          <h3>Create post</h3>
          <button class="cp-close" id="cp-close">✕</button>
        </div>

        <div class="cp-user">
          <img src="https://i.pravatar.cc/100" alt="" />
          <span>Dream Real User</span>
        </div>
        <div class="post-inline-row cp-inline-row" id="cp-inline-row"></div>

        <div class="cp-body">

  <textarea
    id="cp-message"
    placeholder="What's on your mind?"
  ></textarea>

  <!-- 🔑 MEDIA APRÈS LE TEXTE -->
  <div class="cp-media-slot" id="cp-media-slot"></div>

  <div class="cp-preview" id="cp-preview"></div>
</div>
        <input
  type="file"
  id="cp-media-input"
  accept="image/*,video/*"
  hidden
/>

        <!-- MINI ACTIONS -->
        <div class="cp-footer">
        <div class="cp-mini-actions">

          <button class="cp-mini-btn" data-action="photo" type="button" aria-label="Add photo">
  <span class="cp-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 9.60002C11.5272 9.60002 11.0591 9.69314 10.6223 9.87406C10.1856 10.055 9.78871 10.3201 9.45442 10.6544C9.12012 10.9887 8.85495 11.3856 8.67403 11.8224C8.49312 12.2591 8.4 12.7273 8.4 13.2C8.4 13.6728 8.49312 14.1409 8.67403 14.5777C8.85495 15.0145 9.12012 15.4113 9.45442 15.7456C9.78871 16.0799 10.1856 16.3451 10.6223 16.526C11.0591 16.7069 11.5272 16.8 12 16.8C12.9548 16.8 13.8705 16.4207 14.5456 15.7456C15.2207 15.0705 15.6 14.1548 15.6 13.2C15.6 12.2452 15.2207 11.3296 14.5456 10.6544C13.8705 9.97931 12.9548 9.60002 12 9.60002ZM21.6 6.00002H18.72C18.5127 5.99057 18.3127 5.92081 18.1445 5.7993C17.9763 5.6778 17.8473 5.50983 17.7732 5.31602L17.028 3.08282C16.9534 2.88923 16.824 2.72156 16.6556 2.60031C16.4873 2.47905 16.2873 2.40945 16.08 2.40002H7.92C7.524 2.40002 7.0968 2.70722 6.9732 3.08162L6.2268 5.31602C6.15258 5.50975 6.02349 5.67763 5.85533 5.79911C5.68717 5.9206 5.48723 5.99042 5.28 6.00002H2.4C1.08 6.00002 0 7.08002 0 8.40002V19.2C0 20.52 1.08 21.6 2.4 21.6H21.6C22.92 21.6 24 20.52 24 19.2V8.40002C24 7.08002 22.92 6.00002 21.6 6.00002ZM12 19.2C8.6856 19.2 6 16.5144 6 13.2C6 11.6087 6.63214 10.0826 7.75736 8.95738C8.88258 7.83217 10.4087 7.20002 12 7.20002C13.5913 7.20002 15.1174 7.83217 16.2426 8.95738C17.3679 10.0826 18 11.6087 18 13.2C18 14.7913 17.3679 16.3174 16.2426 17.4427C15.1174 18.5679 13.5913 19.2 12 19.2ZM21 9.84002C20.7772 9.84002 20.5636 9.75152 20.406 9.59399C20.2485 9.43646 20.16 9.22281 20.16 9.00002C20.16 8.77724 20.2485 8.56359 20.406 8.40605C20.5636 8.24852 20.7772 8.16002 21 8.16002C21.2228 8.16002 21.4364 8.24852 21.594 8.40605C21.7515 8.56359 21.84 8.77724 21.84 9.00002C21.84 9.22281 21.7515 9.43646 21.594 9.59399C21.4364 9.75152 21.2228 9.84002 21 9.84002Z"
                  fill="currentColor"
                />
              </svg>
            </span>
</button>

          <button
  class="cp-mini-btn"
  data-action="mood"
  type="button"
  aria-label="Add mood"
>
  <span class="cp-icon">
  <svg
  viewBox="0 0 18 18"
  width="18"
  height="18"
  aria-hidden="true"
>
  <path
    fill="currentColor"
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="
      M9 18
      C13.9706 18 18 13.9706 18 9
      C18 4.02944 13.9706 0 9 0
      C4.02944 0 0 4.02944 0 9
      C0 13.9706 4.02944 18 9 18
      Z

      M10.133 5.94038
      L13.3615 4.26241
      C13.8297 4.0212 14.3301 4.53158 13.983 4.89165
      L12.627 6.30045
      L13.983 7.70925
      C14.3341 8.07281 13.8256 8.5762 13.3615 8.33848
      L10.133 6.66051
      C9.8222 6.49621 9.8222 6.10468 10.133 5.94038
      Z

      M4.01555 4.89165
      C3.66864 4.53158 4.16884 4.0212 4.63678 4.26241
      L7.86392 5.94038
      C8.17857 6.10468 8.17857 6.49621 7.86392 6.66051
      L4.63678 8.33848
      C4.17288 8.5762 3.66864 8.07281 4.01555 7.70925
      L5.37095 6.30045
      L4.01555 4.89165
      Z

      M14.3956 10.8
      C14.0774 13.1667 11.9106 15 9.28614 15
      H8.71405
      C6.08961 15 3.92284 13.1667 3.60462 10.8
      C3.56171 10.4833 3.82987 10.2 4.17313 10.2
      H13.8271
      C14.1703 10.2 14.4385 10.48 14.3956 10.8
      Z
    "
  />
</svg>
  </span>
</button>

          <button
  class="cp-mini-btn"
  data-action="location"
  type="button"
  aria-label="Add location"
>
  <span class="cp-icon">
    <svg
      width="20"
      height="20"
      viewBox="0 0 35 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M23.7724 20.1421L17.5634 26L11.3545 20.1421C10.1265 18.9835 9.29023 17.5074 8.95143 15.9004C8.61263 14.2934 8.78653 12.6277 9.45112 11.114C10.1157 9.60025 11.2412 8.30643 12.6851 7.39614C14.1291 6.48586 15.8268 6 17.5634 6C19.3001 6 20.9977 6.48586 22.4417 7.39614C23.8857 8.30643 25.0111 9.60025 25.6757 11.114C26.3403 12.6277 26.5142 14.2934 26.1754 15.9004C25.8366 17.5074 25.0004 18.9835 23.7724 20.1421ZM17.5634 17.9661C18.5984 17.9661 19.5911 17.5782 20.3229 16.8877C21.0548 16.1972 21.466 15.2607 21.466 14.2842C21.466 13.3077 21.0548 12.3712 20.3229 11.6807C19.5911 10.9902 18.5984 10.6023 17.5634 10.6023C16.5284 10.6023 15.5358 10.9902 14.8039 11.6807C14.072 12.3712 13.6609 13.3077 13.6609 14.2842C13.6609 15.2607 14.072 16.1972 14.8039 16.8877C15.5358 17.5782 16.5284 17.9661 17.5634 17.9661Z"
        fill="currentColor"
      />
    </svg>
  </span>
</button>

        </div>

        <button class="cp-submit disabled" id="cp-submit" type="button">
          Post
        </button>
                <div class="cp-feeling-panel hidden" id="cp-feeling-panel">
          <div class="cp-fa-header">
            <button class="cp-fa-back" id="cp-fa-back" aria-label="Back">←</button>
            <div class="cp-fa-title" id="cp-fa-title">
              Choose a category
            </div>
          </div>

          <div class="cp-fa-list" id="cp-fa-list"></div>
        </div>

      </div>
    </div>
  `;

  bindCreatePost();
}

/* =========================================================
   LOGIC
   ========================================================= */

function bindCreatePost() {
  console.log("🟢 bindCreatePost");

  const overlay = document.getElementById("cp-overlay");
  const modal = document.querySelector(".cp-modal");
  const closeBtn = document.getElementById("cp-close");

  /* ===============================
   PREVENT CLICK INSIDE MODAL
   =============================== */
if (modal) {
  modal.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}
  /* ===============================
   CLOSE ON OVERLAY CLICK
   =============================== */

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    resetCreatePost();
  }
});
  const submit = document.getElementById("cp-submit");
  const message = document.getElementById("cp-message");
 const preview = document.getElementById("cp-preview");
const mediaSlot = document.getElementById("cp-media-slot");
  const mediaInput = document.getElementById("cp-media-input");


mediaInput.addEventListener("change", () => {
  const file = mediaInput.files[0];
  if (!file) return;

  mediaFile = file;

  if (mediaPreviewUrl) {
    URL.revokeObjectURL(mediaPreviewUrl);
  }

  mediaPreviewUrl = URL.createObjectURL(file);

  renderPreview();
  updateSubmit();
});

  const moodPanel = document.getElementById("cp-feeling-panel");
  const panelTitle = document.getElementById("cp-fa-title");
  const panelList = document.getElementById("cp-fa-list");
  const backBtn = document.getElementById("cp-fa-back");

  const trigger = document.querySelector(".btn-create");

  /* ===============================
     SAFE DATA ACCESS
     =============================== */

  const FEELINGS = Array.isArray(window.FEELINGS) ? window.FEELINGS : [];
  const ACTIVITIES = Array.isArray(window.ACTIVITIES) ? window.ACTIVITIES : [];

  console.log("📦 FEELINGS:", FEELINGS.length);
  console.log("📦 ACTIVITIES:", ACTIVITIES.length);

  let mood = null;
  let location = null;
  let mediaFile = null;
let mediaPreviewUrl = null;
let mediaRatio = null;

function resetCreatePost() {
  overlay.classList.add("hidden");
  message.value = "";
  mood = null;
  location = null;
  mediaFile = null;

  if (mediaPreviewUrl) {
    URL.revokeObjectURL(mediaPreviewUrl);
    mediaPreviewUrl = null;
  }

  preview.innerHTML = "";
  updateSubmit();
  closeMoodPanel();
}

  /* ===============================
   OPEN / CLOSE MODAL
   =============================== */

if (trigger) {
  trigger.onclick = () => {
    // 🔄 reset état Create Post
    mood = null;
    location = null;
    preview.innerHTML = "";
    updateSubmit();

    // ✅ ouverture modale
    overlay.classList.remove("hidden");
  };
}

  closeBtn.onclick = resetCreatePost;

  backBtn.onclick = closeMoodPanel;

  /* ===============================
     MINI ACTIONS
     =============================== */

  document.querySelectorAll(".cp-mini-btn").forEach((btn) => {
  btn.onclick = () => {
    const action = btn.dataset.action;

    if (action === "photo") {
      mediaInput.click();
      return;
    }

    if (action === "mood") {
      openMoodPanel();
      return;
    }

    if (action === "location") {
      location = "Paris";
      renderPreview();
      updateSubmit();
    }
  };
});

  /* ===============================
     MOOD PANEL
     =============================== */

  function openMoodPanel() {
    panelTitle.textContent = "Choose a category";
    panelList.innerHTML = "";

    if (!FEELINGS.length) {
      panelList.innerHTML = `
        <div style="opacity:.6;text-align:center;padding:20px">
          No feelings available
        </div>
      `;
      moodPanel.classList.remove("hidden");
      return;
    }

    FEELINGS.forEach((feeling) => {
      const item = document.createElement("div");
      item.className = "cp-fa-item";
      item.innerHTML = `
        <img src="${CDN_URL}/${feeling.image}" />
        <span>${feeling.title}</span>
      `;
      item.onclick = () => openActivities(feeling);
      panelList.appendChild(item);
    });

    moodPanel.classList.remove("hidden");
  }

  function openActivities(feeling) {
    panelTitle.textContent = "Choose an entry"
    panelList.innerHTML = "";

    ACTIVITIES
      .filter((a) => a.feeling_id === feeling.id)
      .forEach((activity) => {
        const item = document.createElement("div");
        item.className = "cp-fa-item";
        item.innerHTML = `
          <img src="${CDN_URL}/${activity.image}" />
          <span>${activity.title}</span>
        `;
        item.onclick = () => {
          mood = { feeling, activity };
          closeMoodPanel();
          renderPreview();
          updateSubmit();
        };
        panelList.appendChild(item);
      });
  }

  function closeMoodPanel() {
    moodPanel.classList.add("hidden");
    panelList.innerHTML = "";
    panelTitle.textContent = "Choose a category";
  }

  /* ===============================
     PREVIEW / SUBMIT
     =============================== */

  message.oninput = updateSubmit;

 function renderPreview() {
  const mediaSlot = document.getElementById("cp-media-slot");

  // RESET
  mediaSlot.innerHTML = "";
  preview.innerHTML = "";

  // =========================
  // MEDIA (FACEBOOK-LIKE)
  // =========================
  if (mediaPreviewUrl && mediaFile) {
    const wrapper = document.createElement("div");
    wrapper.className = "cp-media-preview";

    if (mediaFile.type.startsWith("video")) {
      const video = document.createElement("video");
      video.src = mediaPreviewUrl;
      video.controls = true;
      video.playsInline = true;
      wrapper.appendChild(video);
    } else {
      const img = new Image();
img.src = mediaPreviewUrl;

img.onload = () => {
  const ratio = img.naturalWidth / img.naturalHeight;

  // reset sécurité
  wrapper.classList.remove("is-cover", "is-contain");

  // 🎯 LOGIQUE DREAM REAL / FACEBOOK
  if (ratio > 1.6) {
    // image trop large OU trop étroite → pas de zoom
    wrapper.classList.add("is-contain");
  } else {
    // image "normale" (portrait / feed)
    wrapper.classList.add("is-cover");
  }
};

wrapper.appendChild(img);
    }

    mediaSlot.appendChild(wrapper);
  }

  const inlineRow = document.getElementById("cp-inline-row");
inlineRow.innerHTML = "";

// =========================
// MOOD / ACTIVITY (FEED-LIKE POSITION)
// =========================
if (mood) {
  const pill = document.createElement("div");
pill.className = "feed-pill";

  pill.innerHTML = `
    <span>${mood.feeling.title}</span>
    ${
      mood.activity?.image
        ? `<img src="${CDN_URL}/${mood.activity.image}" alt="" />`
        : ""
    }
    <span>${mood.activity.title}</span>
  `;

  inlineRow.appendChild(pill);
}

  // =========================
  // LOCATION
  // =========================
  if (location) {
    const pill = document.createElement("div");
    pill.className = "cp-pill";
    pill.textContent = `📍 ${location}`;
    preview.appendChild(pill);
  }
}

  function updateSubmit() {
    const valid =
      message.value.trim().length > 0 || mood || location;

    submit.classList.toggle("disabled", !valid);
  }

  submit.onclick = () => {
  if (submit.classList.contains("disabled")) return;

  alert("Post created (mock)");
  resetCreatePost();
};
}

/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.mountCreatePost = mountCreatePost;
console.log("🚀 create-post.js loaded");