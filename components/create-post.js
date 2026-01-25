/* =========================================================
   CREATE POST — WINDOW SAFE VERSION (NO MODULES)
   ========================================================= */

const CDN_URL = "https://dreamreal-images.s3.eu-west-3.amazonaws.com";

let localLinkPreview = null;

async function uploadMediaFile(file) {
  const API_BASE = "https://dreamreal-api.onrender.com";

  /* =========================================================
     IMAGE → BACKEND CLASSIQUE (INCHANGÉ)
     ========================================================= */
  if (file.type.startsWith("image/")) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/upload/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${window.AUTH.token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error("Image upload failed: " + text);
    }

    return res.json(); // { url }
  }

  /* =========================================================
     VIDEO (WEB) → PRESIGN + PUT DIRECT S3
     ========================================================= */
  if (file.type.startsWith("video/")) {
    // 1️⃣ demander une URL signée
    const presignRes = await fetch(
      `${API_BASE}/api/upload/presign-video`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.AUTH.token}`,
        },
        body: JSON.stringify({
          mimeType: file.type,
        }),
      }
    );

    if (!presignRes.ok) {
      const text = await presignRes.text();
      throw new Error("Presign failed: " + text);
    }

    const { uploadUrl, publicUrl } = await presignRes.json();

    // 2️⃣ upload direct vers S3 (sans backend)
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("S3 video upload failed");
    }

    // 3️⃣ retour cohérent avec images
    return { url: publicUrl };
  }

  throw new Error("Unsupported media type");
}

function getSafeAvatar(user) {
  if (
    user &&
    typeof user.avatar === "string" &&
    user.avatar.startsWith("http")
  ) {
    return user.avatar;
  }

  return "https://cdn-icons-png.flaticon.com/512/847/847969.png";
}

// 🔗 LINK DETECTION (WEB — APP PARITY)
function extractFirstUrl(text) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

// 🎥 YOUTUBE DETECTION (WEB — APP PARITY)
function extractYouTubeId(url) {
  if (!url) return null;

  try {
    const u = new URL(url);

    // 🎬 youtu.be/VIDEOID
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1) || null;
    }

    // 🎬 youtube.com
    if (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("m.youtube.com")
    ) {
      // watch?v=VIDEOID
      const v = u.searchParams.get("v");
      if (v) return v;

      // shorts/VIDEOID
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] || null;
      }
    }
  } catch (e) {
    return null;
  }

  return null;
}

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
  <img id="cp-user-avatar" alt="" />
  <span id="cp-username"></span>
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
  multiple
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

          <!-- 🔍 ACTIVITY SEARCH (AJOUT) -->
  <div class="cp-fa-search">
    <input
      id="cp-activity-search"
      type="text"
      placeholder="Search…"
      autocomplete="off"
    />
  </div>

          <div class="cp-fa-list" id="cp-fa-list"></div>
        </div>
        <!-- LOCATION PANEL -->
<!-- LOCATION PANEL -->
<div class="cp-location-panel hidden" id="cp-location-panel">

  <div class="cp-location-sheet">

    <div class="cp-fa-header">
      <button class="cp-fa-back" id="cp-location-back" aria-label="Back">←</button>
      <div class="cp-fa-title">Add location</div>
    </div>

    <input
      id="cp-location-input"
      type="text"
      placeholder="Search a city, place or address"
      autocomplete="off"
      style="margin:12px 0;padding:12px;border-radius:10px;border:none"
    />

    <!-- NEARBY PLACES -->
<div class="cp-location-nearby hidden" id="cp-location-nearby">
  <div class="cp-location-section-title">
    Nearby places
  </div>

  <div class="cp-fa-list" id="cp-location-nearby-list"></div>
</div>

    <div class="cp-fa-list" id="cp-location-results"></div>

    <div style="display:flex;gap:12px;margin-top:12px">
      <button id="cp-location-cancel" class="btn">Cancel</button>
      <button id="cp-location-save" class="btn btn-primary">Save</button>
    </div>

  </div>

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

overlay.onclick = (e) => {
  if (
    e.target === overlay &&
    !overlay.classList.contains("hidden")
  ) {
    resetCreatePost();
  }
};

  const submit = document.getElementById("cp-submit");
  const message = document.getElementById("cp-message");
 const preview = document.getElementById("cp-preview");
const mediaSlot = document.getElementById("cp-media-slot");
  const mediaInput = document.getElementById("cp-media-input");
  const usernameEl = document.getElementById("cp-username");

  // ===============================
// AUTH USER (NO MOCK)
// ===============================
if (window.AUTH?.user) {
  const user = window.AUTH.user;

  const avatarEl = document.getElementById("cp-user-avatar");

  if (avatarEl) {
    avatarEl.src = getSafeAvatar(user);
  }

  if (usernameEl) {
    usernameEl.textContent =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.name ||
      "User";
  }
}

mediaInput.addEventListener("change", () => {
  const files = Array.from(mediaInput.files);
  if (!files.length) return;

  files.forEach((file) => {
    draftMedia.push({
      file, // ✅ on garde seulement le file
    });
  });

  mediaInput.value = "";
  renderPreview();
  updateSubmit();
});

  const moodPanel = document.getElementById("cp-feeling-panel");
  const panelTitle = document.getElementById("cp-fa-title");
  const panelList = document.getElementById("cp-fa-list");
  const backBtn = document.getElementById("cp-fa-back");

  // ===============================
// LOCATION PANEL (WEB)
// ===============================
const locationPanel = document.getElementById("cp-location-panel");
const locationBack = document.getElementById("cp-location-back");
const locationInput = document.getElementById("cp-location-input");
const locationResults = document.getElementById("cp-location-results");
const locationCancel = document.getElementById("cp-location-cancel");
const locationSave = document.getElementById("cp-location-save");
const locationNearby = document.getElementById("cp-location-nearby");
const locationNearbyList = document.getElementById("cp-location-nearby-list");

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
localLinkPreview = null; // ✅ ICI ET SEULEMENT ICI
let isSubmitting = false; // 🔒 sécurité anti double submit

// 🔑 MEDIA DRAFT (PARITÉ APP)
let draftMedia = [];           // [{ file, url }]
let draftCarouselIndex = 0;
  

function resetCreatePost() {
  isSubmitting = false; // 🔓 reset sécurité submit (ICI EXACTEMENT)
  overlay.classList.add("hidden");
  // ✅ RESTORE BODY SCROLL (CRITIQUE)
  document.body.style.overflow = "";
  message.value = "";
  mood = null;
  location = null;
 // 🔑 CLEANUP MEDIA (MULTI SELECT)
draftMedia = [];
draftCarouselIndex = 0;

  preview.innerHTML = "";
  updateSubmit();
  closeMoodPanel();
  locationInput.value = "";
  locationResults.innerHTML = "";
  closeLocationPanel();
  renderPreview();
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

    // ✅ RÉ-INJECTION SAFE DE L’USER (CRITIQUE)
    const user = window.AUTH?.user;
    const avatarEl = document.getElementById("cp-user-avatar");
    const usernameEl = document.getElementById("cp-username");

    if (user && avatarEl) {
      avatarEl.src = getSafeAvatar(user);
      avatarEl.style.display = "block";
    }

    if (user && usernameEl) {
      usernameEl.textContent =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        user.name ||
        "User";
    }

    // ✅ ouverture modale
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // 🔒 LOCK SCROLL (ICI EXACTEMENT)

    // ✅ recalcul état bouton POST
    updateSubmit();
  };
}

  closeBtn.onclick = resetCreatePost;

  backBtn.onclick = () => {
  // 🔁 Si on est dans Activities → retour vers Feelings
  if (panelTitle.textContent === "Choose an entry") {
    openMoodPanel();
    return;
  }

  // 🔚 Sinon → fermeture du panel mood
  closeMoodPanel();
};

  locationBack.onclick = closeLocationPanel;

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
      closeMoodPanel(); 
  openLocationPanel();
  return;
}
  };
});

  /* ===============================
     MOOD PANEL
     =============================== */

  function openMoodPanel() {
    moodPanel.classList.add("is-feelings");
  moodPanel.classList.remove("is-activities");
    panelTitle.textContent = "Choose a category";
    panelList.innerHTML = "";

    // 🔒 CACHER LA SEARCH
  const searchInput = document.getElementById("cp-activity-search");
  if (searchInput) searchInput.style.display = "none";

    // 🔑 AJOUT ICI
  overlay.classList.add("is-feeling-open");

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
     moodPanel.classList.remove("is-feelings");
  moodPanel.classList.add("is-activities");
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
        // 🔍 ACTIVITY SEARCH LOGIC (ICI)
  const searchInput = document.getElementById("cp-activity-search");

  if (searchInput) {
    searchInput.style.display = "block"; // ✅ OBLIGATOIRE
    searchInput.value = "";
    searchInput.placeholder = "Search…"; // ✅ FIX DÉFINITIF

    searchInput.oninput = () => {
      const q = searchInput.value.trim().toLowerCase();

      panelList.querySelectorAll(".cp-fa-item").forEach(item => {
        const label =
          item.querySelector("span")?.textContent.toLowerCase() || "";

        item.style.display = label.includes(q) ? "flex" : "none";
      });
    };
  }
  }

  function closeMoodPanel() {
    moodPanel.classList.remove("is-feelings", "is-activities");
  moodPanel.classList.add("hidden");
  panelList.innerHTML = "";
  panelTitle.textContent = "Choose a category";

  overlay.classList.remove("is-feeling-open");

  const searchInput = document.getElementById("cp-activity-search");
  if (searchInput) {
    searchInput.value = "";
    searchInput.oninput = null;        // ✅ sécurité : détache le handler
    searchInput.style.display = "none"; // ✅ UX : cache la search
  }
}

  /* ===============================
   LOCATION PANEL
   =============================== */

function openLocationPanel() {
  locationInput.value = "";
  locationResults.innerHTML = "";

  renderNearbyPlaces(); // ✅ AJOUT

  locationPanel.classList.remove("hidden");
}

function renderNearbyPlaces() {
  locationNearbyList.innerHTML = "";

  const NEARBY = [
    "Paris, France",
    "Montmartre",
    "Le Marais",
    "Châtelet",
  ];

  NEARBY.forEach((place) => {
    const item = document.createElement("div");
    item.className = "cp-fa-item";
    item.textContent = place;

    item.onclick = () => {
      location = place;
      locationInput.value = place;
      renderPreview();
      updateSubmit();
      closeLocationPanel();
    };

    locationNearbyList.appendChild(item);
  });

  locationNearby.classList.remove("hidden");
}

// ===============================
// GOOGLE PLACES AUTOCOMPLETE (WEB)
// ===============================

let placesService = null;
let sessionToken = null;
let locationDebounce = null;

locationInput.addEventListener("input", () => {
  // 🧹 annule l’appel précédent
  clearTimeout(locationDebounce);

  // ⏳ attend 300 ms après la dernière frappe
  locationDebounce = setTimeout(() => {
    // 🔒 sécurité Google
    if (!window.google || !google.maps || !google.maps.places) {
      console.warn("⚠️ Google Places not loaded");
      return;
    }

    const query = locationInput.value.trim();
    const currentQuery = query; // 🔒 snapshot anti-race-condition
    locationResults.innerHTML = "";

    if (!query) {
  locationResults.innerHTML = "";
  locationNearby.classList.remove("hidden"); // 🔑 IMPORTANT
  renderNearbyPlaces();
  return;
}

    locationNearby.classList.add("hidden");

    // Init service une seule fois
    if (!placesService) {
      placesService = new google.maps.places.AutocompleteService();
    }

    // Session token = groupement facturation
    sessionToken =
      sessionToken ||
      new google.maps.places.AutocompleteSessionToken();

    placesService.getPlacePredictions(
      {
        input: query,
        sessionToken,
        types: ["geocode", "establishment"],
      },
      (predictions, status) => {
  // 🔐 Ignore les réponses obsolètes
  if (locationInput.value.trim() !== currentQuery) {
    return;
  }

  if (
    status !== google.maps.places.PlacesServiceStatus.OK ||
    !predictions
  ) {
    return;
  }

        locationResults.innerHTML = "";

        predictions.forEach((prediction) => {
          const item = document.createElement("div");
          item.className = "cp-fa-item";
          item.textContent = prediction.description;

          item.onclick = () => {
            location = prediction.description;
            locationInput.value = prediction.description;

            renderPreview();
            updateSubmit();
            closeLocationPanel();

            sessionToken = null; // 🔑 reset après sélection
          };

          locationResults.appendChild(item);
        });
      }
    );
  }, 300); // 🎯 DEBOUNCE = 300ms (APP-LIKE)
});

locationCancel.onclick = closeLocationPanel;

locationSave.onclick = () => {
  if (!locationInput.value.trim()) return;
  location = locationInput.value.trim();
  renderPreview();
  updateSubmit();
  closeLocationPanel();
};

function closeLocationPanel() {
  locationPanel.classList.add("hidden");
  locationResults.innerHTML = "";
  locationNearby.classList.add("hidden"); // ✅ reset
  sessionToken = null; // 🔑 OBLIGATOIRE
}

  /* ===============================
     PREVIEW / SUBMIT
     =============================== */

  message.oninput = () => {
  const text = message.value || "";

  // 🔗 détection lien
  const url = extractFirstUrl(text);
  const youtubeId = extractYouTubeId(url);

    // 🔁 même lien déjà prêt → ne rien refaire
  if (
    url &&
    localLinkPreview?.url === url &&
    localLinkPreview.status === "ready"
  ) {
    updateSubmit();
    return;
  }

  // 🎥 YOUTUBE → traitement dédié (AVANT preview classique)
  if (youtubeId) {
    localLinkPreview = {
      url,
      youtubeId,
      status: "youtube",
    };

    renderPreview();
    updateSubmit();
    return; // ⛔️ CRITIQUE : on stoppe ici
  }

  if (url) {
    // ⚠️ on ne refetch PAS si déjà détecté
    if (!localLinkPreview || localLinkPreview.url !== url) {
      localLinkPreview = {
        url,
        status: "detected", // pas encore fetché
      };
      console.log("🔗 Link detected:", url);
    }
    // 🔎 fetch preview (une seule fois)
if (localLinkPreview.status === "detected") {
  localLinkPreview.status = "loading";

   renderPreview(); // ✅ AFFICHE LE LOADING IMMÉDIATEMENT

  fetch(`https://dreamreal-api.onrender.com/api/link-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.AUTH.token}`,
    },
    body: JSON.stringify({ url }),
  })
    .then((res) => res.ok ? res.json() : null)
    .then((data) => {
      if (!data) return;

      localLinkPreview = {
        ...data,
        url,
        status: "ready",
      };

      console.log("🔗 Link preview ready", localLinkPreview);
      renderPreview(); // 🔥 IMPORTANT
      updateSubmit();
    })
    .catch((err) => {
      console.warn("❌ link preview failed", err);
      localLinkPreview = null;
    });
}
  } else {
  // 🧹 aucun lien → reset
  if (localLinkPreview) {
    console.log("🧹 Link removed");
    localLinkPreview = null;
    renderPreview(); // 🔥 OBLIGATOIRE
  }
}

  updateSubmit();
};

 function renderPreview() {
  const mediaSlot = document.getElementById("cp-media-slot");

  // RESET MEDIA SEULEMENT
mediaSlot.innerHTML = "";

// 🔥 RESET PREVIEW (OBLIGATOIRE — évite les doublons)
preview.innerHTML = "";

// =========================
// YOUTUBE PREVIEW — DRAFT (APP PARITY)
// =========================
if (localLinkPreview?.status === "youtube") {
  const youtubeId = localLinkPreview.youtubeId;

  const wrapper = document.createElement("div");
  wrapper.className = "post-media youtube-preview";

  const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  wrapper.innerHTML = `
    <div class="yt-thumb">
      <img src="${thumbnail}" alt="" />
      <div class="yt-play-overlay">▶</div>
    </div>
  `;

  preview.appendChild(wrapper);
}

  // =========================
// LINK PREVIEW — FEED PARITY
// =========================
if (localLinkPreview && localLinkPreview.status === "ready" && !localLinkPreview.youtubeId) {
  const wrapper = document.createElement("div");
  wrapper.className = "post-media link-preview cp-link-preview-draft";

  wrapper.innerHTML = `
    ${
      localLinkPreview.image
        ? `<img src="${localLinkPreview.image}" alt="" />`
        : ""
    }

    <div class="link-preview-text">
  ${
    localLinkPreview.siteName
      ? `<div class="link-preview-site">${localLinkPreview.siteName}</div>`
      : ""
  }

  ${
    localLinkPreview.title
      ? `<div class="link-preview-title">${localLinkPreview.title}</div>`
      : ""
  }

  ${
    localLinkPreview.description
      ? `<div class="link-preview-description">${localLinkPreview.description}</div>`
      : ""
  }
</div>
  `;

  preview.appendChild(wrapper);
}

    // =========================
  // USERNAME + LOCATION (FEED-LIKE)
  // =========================
  if (usernameEl) {
  const user = window.AUTH?.user || {};

  const fullName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.name ||
    "User";

  usernameEl.innerHTML = `
    ${fullName}
    ${
      location
        ? `<span class="inline-location" id="cp-inline-location">
             in ${location}
           </span>`
        : ""
    }
  `;

  // 🔁 RESET LOCATION ON CLICK (APP-LIKE)
  const inlineLocation = document.getElementById("cp-inline-location");
  if (inlineLocation) {
    inlineLocation.onclick = () => {
      location = null;
      renderPreview();
      updateSubmit();
    };
  }
}

 // =========================
// MEDIA (SINGLE / CAROUSEL)
// =========================
if (draftMedia.length === 1) {
  const m = draftMedia[0];

  const wrapper = document.createElement("div");
  wrapper.className = "cp-media-preview is-cover";

  // 🔑 MEDIA
  let mediaEl;
  if (m.file.type.startsWith("video")) {
  mediaEl = document.createElement("video");
  const objectUrl = URL.createObjectURL(m.file);
  mediaEl.src = objectUrl;
  mediaEl.dataset.objectUrl = objectUrl;
  mediaEl.controls = true;
}else {
    mediaEl = new Image();
    const objectUrl = URL.createObjectURL(m.file);
mediaEl.src = objectUrl;
mediaEl.dataset.objectUrl = objectUrl;

    // 🧠 image très panoramique → contain
    mediaEl.onload = () => {
      const ratio = mediaEl.naturalWidth / mediaEl.naturalHeight;
      if (ratio > 1.6) {
        wrapper.classList.remove("is-cover");
        wrapper.classList.add("is-contain");
      }
    };
  }

  // ❌ BOUTON REMOVE (COMME CAROUSEL)
  const remove = document.createElement("button");
  remove.className = "cp-carousel-remove";
  remove.textContent = "✕";
  remove.onclick = () => {
  if (mediaEl.dataset.objectUrl) {
    URL.revokeObjectURL(mediaEl.dataset.objectUrl);
  }
  draftMedia = [];
  draftCarouselIndex = 0;
  renderPreview();
  updateSubmit();
};

  wrapper.appendChild(mediaEl);
  wrapper.appendChild(remove);
  mediaSlot.appendChild(wrapper);
}

if (draftMedia.length > 1) {
  const carousel = document.createElement("div");
  carousel.className = "cp-carousel";

  const track = document.createElement("div");
  track.className = "cp-carousel-track";

  draftMedia.forEach((m, index) => {
    const slide = document.createElement("div");
    slide.className = "cp-carousel-slide";

    const img = new Image();
    const objectUrl = URL.createObjectURL(m.file);
img.src = objectUrl;
img.dataset.objectUrl = objectUrl;

    const remove = document.createElement("button");
    remove.className = "cp-carousel-remove";
    remove.textContent = "✕";
    remove.onclick = () => {
      URL.revokeObjectURL(img.dataset.objectUrl);
      draftMedia.splice(index, 1);
      draftCarouselIndex = Math.max(0, draftCarouselIndex - 1);
      renderPreview();
      updateSubmit();
    };

    slide.appendChild(img);
    slide.appendChild(remove);
    track.appendChild(slide);
  });

  carousel.appendChild(track);
  mediaSlot.appendChild(carousel);
}

  const inlineRow = document.getElementById("cp-inline-row");
inlineRow.innerHTML = "";

// =========================
// MOOD / ACTIVITY (FEED-LIKE POSITION)
// =========================
if (mood) {
  const pill = document.createElement("div");
  pill.className = "feed-pill";
  pill.id = "cp-inline-mood";

  pill.innerHTML = `
    <span>${mood.feeling.title}</span>
    ${
      mood.activity?.image
        ? `<img src="${CDN_URL}/${mood.activity.image}" alt="" />`
        : ""
    }
    <span>${mood.activity.title}</span>
  `;

  // 🔁 RESET MOOD ON CLICK (APP-LIKE)
  pill.onclick = () => {
    mood = null;
    renderPreview();
    updateSubmit();
  };

  inlineRow.appendChild(pill);
}
  
}

  function updateSubmit() {
  const hasText = message.value.trim().length > 0;
  const hasMood = !!mood;
  const hasLocation = !!location;
  const hasMedia = draftMedia.length > 0;
  const hasLink =
  localLinkPreview &&
  (localLinkPreview.status === "ready" ||
   localLinkPreview.status === "youtube");

  const valid =
    hasText ||
    hasMood ||
    hasLocation ||
    hasMedia ||
    hasLink;

  submit.classList.toggle("disabled", !valid);
}

  submit.onclick = () => {
    if (isSubmitting) return;
isSubmitting = true;

  // 🔒 SNAPSHOT LINK PREVIEW (CRITIQUE)
  const linkPreviewSnapshot = localLinkPreview
    ? JSON.parse(JSON.stringify(localLinkPreview))
    : null;
console.log("🧪 SNAPSHOT LINK PREVIEW (SUBMIT)", linkPreviewSnapshot);
  console.log("🟢 CLICK SUR POST BOUTON");

  // 🔥 RECALCUL FORCÉ AVANT TEST
  updateSubmit();

  if (submit.classList.contains("disabled")) {
    console.warn("🔴 SUBMIT BLOQUÉ (disabled)");
    return;
  }

  console.log("🟢 SUBMIT AUTORISÉ — ON CONTINUE");

  // =========================
  // BUILD LOCAL POST (MOCK)
  // =========================
  const now = new Date().toISOString();

  const user = window.AUTH?.user || {};

  const clientId = `client_${Date.now()}`;

  let youtube_url = null;
let youtube_thumbnail = null;
let link_preview = null;

if (linkPreviewSnapshot) {
  if (linkPreviewSnapshot.status === "youtube") {
    youtube_url = linkPreviewSnapshot.url;
    youtube_thumbnail =
      `https://img.youtube.com/vi/${linkPreviewSnapshot.youtubeId}/hqdefault.jpg`;
  }

  if (linkPreviewSnapshot.status === "ready") {
    link_preview = {
      title: linkPreviewSnapshot.title,
      description: linkPreviewSnapshot.description,
      image: linkPreviewSnapshot.image,
      url: linkPreviewSnapshot.url,
      siteName: linkPreviewSnapshot.siteName,
    };
  }
}

const localPost = {
  id: `local_${clientId}`,
  client_id: clientId,
    user_first_name: user.first_name || "",
user_last_name: user.last_name || "",
user_avatar: getSafeAvatar(user),
    message: message.value.trim() || null,
    created_time: now,

    location: location
      ? { label: location }
      : null,

    feeling: mood
      ? {
          id: mood.feeling.id,
          title: mood.feeling.title,
          slug: mood.feeling.slug,
        }
      : null,

    activity: mood
      ? {
          id: mood.activity.id,
          title: mood.activity.title,
          image: mood.activity.image,
        }
      : null,

    images: [],
video_url: null,

 // 🔥 AJOUTS CRITIQUES
  youtube_url,
  youtube_thumbnail,
  link_preview,

    reactions_summary: "👍",
    reactions_count: 1,
  };

 // =========================
// BACKEND PERSISTENCE (WEB)
// =========================
(async () => {
  try {
    const token = window.AUTH?.token;
    if (!token) return;

        const API_BASE = "https://dreamreal-api.onrender.com";

        // =========================
// 🔼 UPLOAD MEDIA AVANT POST
// =========================
const uploadedImages = [];
let uploadedVideo = null;

for (const m of draftMedia) {
  if (m.file.type.startsWith("image/")) {
    const { url } = await uploadMediaFile(m.file);
    uploadedImages.push(url);
  }

  if (m.file.type.startsWith("video/")) {
    const { url } = await uploadMediaFile(m.file);
    uploadedVideo = url;
  }
}

// =========================
// LINK / YOUTUBE NORMALISATION
// =========================
let youtube_url = null;
let youtube_thumbnail = null;
let link_preview = null;

if (linkPreviewSnapshot) {
  if (linkPreviewSnapshot.status === "youtube") {
    youtube_url = linkPreviewSnapshot.url;
    youtube_thumbnail =
      `https://img.youtube.com/vi/${linkPreviewSnapshot.youtubeId}/hqdefault.jpg`;
  }

  if (linkPreviewSnapshot.status === "ready") {
    link_preview = {
      title: linkPreviewSnapshot.title || null,
      description: linkPreviewSnapshot.description || null,
      image: linkPreviewSnapshot.image || null,
      url: linkPreviewSnapshot.url,
      siteName: linkPreviewSnapshot.siteName || null,
    };
  }
}

    const payload = {
      client_id: clientId,
      message: message.value.trim() || null,

      feeling: mood
        ? {
            id: mood.feeling.id,
            title: mood.feeling.title,
            slug: mood.feeling.slug,
          }
        : null,

      activity: mood
        ? {
            id: mood.activity.id,
            title: mood.activity.title,
            image: mood.activity.image,
          }
        : null,

      localLocation: location ? { label: location } : null,

      images: uploadedImages,
video_url: uploadedVideo,

youtube_url,
  youtube_thumbnail,
  link_preview,
    };

    const res = await fetch(`${API_BASE}/api/posts`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const text = await res.text();
  console.error("❌ createPost failed", res.status, text);
  return;
}

const persistedPost = await res.json();

// 🔥 NORMALISATION VIDÉO (OBLIGATOIRE POUR FEED IMMÉDIAT)
persistedPost.video_url =
  typeof persistedPost.video_url === "string" &&
  persistedPost.video_url.startsWith("http")
    ? persistedPost.video_url
    : null;

console.log("🧪 persistedPost.images =", persistedPost.images);

console.log("✅ POST PERSISTED", persistedPost);

// 🧩 NORMALISATION IMAGES POUR LE FEED (ALIGNÉE SUR GET /api/posts)
if (Array.isArray(persistedPost.images)) {
  if (persistedPost.images.length === 1) {
    persistedPost.full_picture = persistedPost.images[0];
    persistedPost.multiple_images = null;
  } else if (persistedPost.images.length > 1) {
    persistedPost.full_picture = null;
    persistedPost.multiple_images = persistedPost.images;
  }
}

// ✅ STRATÉGIE SAFE — RECHARGEMENT DU FEED
setTimeout(() => {
  window.location.reload();
}, 300);

// 🔒 SOURCE DE VÉRITÉ : LE POST RETOURNÉ
if (Array.isArray(window.FEED_POSTS)) {
  window.FEED_POSTS = [
    persistedPost,
    ...window.FEED_POSTS.filter(
      (p) => p.client_id !== persistedPost.client_id
    ),
  ];
}

if (typeof renderFeed === "function") {
  renderFeed();
}

// ✅ ICI ET SEULEMENT ICI
    resetCreatePost();

    console.log("✅ Post persisted (WEB)");
  } catch (err) {
    console.error("❌ createPost WEB error", err);
  }
})();

  // =========================
  // CLEANUP
  // =========================
 
};
}

/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.mountCreatePost = mountCreatePost;
// =========================
// GLOBAL OPEN CREATE POST
// =========================
window.openCreatePost = function () {
  const overlay = document.getElementById("cp-overlay");

  if (!overlay) {
    console.warn("❌ cp-overlay introuvable — mountCreatePost non exécuté ?");
    return;
  }

    // ✅ HYDRATATION USER (CRITIQUE — FIX AVATAR)
  const user = window.AUTH?.user;
  const avatarEl = document.getElementById("cp-user-avatar");
  const usernameEl = document.getElementById("cp-username");

  if (user && avatarEl) {
    avatarEl.src = getSafeAvatar(user);
    avatarEl.style.display = "block";
  }

  if (user && usernameEl) {
    usernameEl.textContent =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.name ||
      "User";
  }

  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
};
console.log("🚀 create-post.js loaded");