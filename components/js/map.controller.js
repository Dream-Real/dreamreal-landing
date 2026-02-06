/* =========================================
   DREAM REAL — MAP CONTROLLER (MOBILE WEB)
   Parity with RN MapScreen
   Engine: Apple Maps (MapKit JS) / Google Maps
   ✅ iOS SAFE: AdvancedMarker fallback + single openPostSheet
========================================= */

console.log("🗺️ map.controller.js loaded");

/* -----------------------------------------
   GLOBAL MAP STATE (RN PARITY)
----------------------------------------- */

window.MAP_STATE = window.MAP_STATE || {
  posts: [],
  filteredPosts: [],
  selectedPosts: null,

  userLocation: null,
  hasCenteredOnce: false,

  filters: {
    feeling: null,
    activity: null,
    onlyWithImages: false,
    maxDistanceKm: 20,
  },
};

/* -----------------------------------------
   ENGINE SELECTION
----------------------------------------- */

// 🔒 For now we force Google (MapKit JS not wired in HTML)
// If you later add MapKit JS properly, you can switch to auto-detect.
const MAP_ENGINE = "google";

console.log("🧭 Map engine:", MAP_ENGINE);

/* -----------------------------------------
   ADAPTER (Apple / Google)
----------------------------------------- */

let mapAdapter = null;

/* -----------------------------------------
   INIT ENTRY POINT
----------------------------------------- */

window.initMobileMap = function initMobileMap(posts) {
  try {
    if (!Array.isArray(posts)) {
      console.error("❌ initMobileMap: invalid posts");
      return;
    }

    // ✅ Normalize + keep only geolocated posts
    window.MAP_STATE.posts = posts.filter(
      (p) => p?.localLocation?.latitude && p?.localLocation?.longitude
    );

    window.MAP_STATE.filteredPosts = window.MAP_STATE.posts;

    console.log("📍 Map posts:", window.MAP_STATE.posts.length);

    if (MAP_ENGINE === "apple") {
      loadAppleMap();
    } else {
      loadGoogleMap();
    }

    initGeolocation();
  } catch (err) {
    console.error("❌ initMobileMap crashed", err);
  }
};

/* -----------------------------------------
   GEOLOCATION (RN PARITY)
----------------------------------------- */

function initGeolocation() {
  if (!navigator.geolocation) {
    console.warn("⚠️ Geolocation not supported");
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      window.MAP_STATE.userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      if (mapAdapter?.updateUserLocation) {
        mapAdapter.updateUserLocation(window.MAP_STATE.userLocation);
      }

      if (!window.MAP_STATE.hasCenteredOnce && mapAdapter?.centerOnUser) {
        mapAdapter.centerOnUser(window.MAP_STATE.userLocation);
        window.MAP_STATE.hasCenteredOnce = true;
      }
    },
    (err) => {
      console.warn("⚠️ Geolocation error", err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 8000,
    }
  );
}

/* -----------------------------------------
   APPLE MAPS (MapKit JS)
   (kept for parity; not active unless MAP_ENGINE="apple"
    AND MapKit JS loaded)
----------------------------------------- */

function loadAppleMap() {
  if (!window.mapkit) {
    console.error("❌ MapKit JS not loaded");
    return;
  }

  mapAdapter = createAppleMapAdapter();
  mapAdapter.init();
}

function createAppleMapAdapter() {
  let map;
  let annotations = [];

  return {
    init() {
      map = new mapkit.Map("map", {
        showsCompass: mapkit.FeatureVisibility.Hidden,
        showsMapTypeControl: false,
        showsUserLocation: true,
      });

      this.renderMarkers();
    },

    centerOnUser(coords) {
      map.setCenterAnimated(new mapkit.Coordinate(coords.lat, coords.lng));
      map.setRegionAnimated(
        new mapkit.CoordinateRegion(
          new mapkit.Coordinate(coords.lat, coords.lng),
          new mapkit.CoordinateSpan(0.05, 0.05)
        )
      );
    },

    updateUserLocation() {
      // handled natively by MapKit
    },

    clearMarkers() {
      annotations.forEach((a) => map.removeAnnotation(a));
      annotations = [];
    },

    renderMarkers() {
      this.clearMarkers();

      annotations = window.MAP_STATE.filteredPosts.map((post) => {
        const coord = new mapkit.Coordinate(
          post.localLocation.latitude,
          post.localLocation.longitude
        );

        const ann = new mapkit.MarkerAnnotation(coord, {
          color: "#EECD79",
          glyphImage: post.user_avatar,
        });

        ann.__post = post;

        ann.addEventListener("select", () => {
          window.openPostSheet([post]);
        });

        map.addAnnotation(ann);
        return ann;
      });
    },
  };
}

/* -----------------------------------------
   GOOGLE MAPS (iOS SAFE)
----------------------------------------- */

function loadGoogleMap() {
  if (!window.google?.maps) {
    console.error("❌ Google Maps not loaded");
    return;
  }

  mapAdapter = createGoogleMapAdapter();
  mapAdapter.init();
}

function createGoogleMapAdapter() {
  let map;
  let markers = [];
  let userMarker = null;

  return {
    init() {
      const el = document.getElementById("map");
      if (!el) {
        console.error("❌ #map element not found");
        return;
      }

      map = new google.maps.Map(el, {
  zoom: 13,
  disableDefaultUI: true,
  gestureHandling: "greedy",

  // ✅ OBLIGATOIRE pour AdvancedMarker + disparition de l’erreur
  mapId: "b23295c573f16a42930135b7",
});

      this.renderMarkers();
            // 🟡 iOS / Mobile Google Maps FIX
      // Google Maps peut nettoyer les overlays APRES init
      // → on force un re-render sécurisé

      setTimeout(() => {
        this.renderMarkers();
      }, 500);

      google.maps.event.addListenerOnce(map, "idle", () => {
        this.renderMarkers();
      });
    },

    centerOnUser(coords) {
      if (!map) return;
      map.setCenter(coords);
      map.setZoom(14);
    },

    updateUserLocation(coords) {
  if (!map || !coords) return;

  const AdvancedMarker = google.maps.marker?.AdvancedMarkerElement;
  if (!AdvancedMarker) return;

  // 🔵 création UNE SEULE FOIS
  if (!userMarker) {
    const dot = document.createElement("div");
dot.style.width = "20px";              // ⬆️ plus visible
dot.style.height = "20px";
dot.style.borderRadius = "50%";
dot.style.background = "#3B82F6";
dot.style.border = "3px solid white";  // ⬆️ lisibilité sur la map
dot.style.boxShadow = "0 0 0 6px rgba(59,130,246,0.28)"; // halo plus large
dot.style.pointerEvents = "none";

    userMarker = new AdvancedMarker({
      position: coords,
      map,
      content: dot,
      zIndex: 9999,
    });
  } else {
    // 🔄 mise à jour fluide
    userMarker.position = coords;
  }
},

    clearMarkers() {
      // AdvancedMarkerElement does NOT implement setMap(null)
      markers.forEach((m) => {
        try {
          if (m?.map !== undefined) m.map = null; // AdvancedMarkerElement
          else if (typeof m?.setMap === "function") m.setMap(null); // Marker
        } catch (e) {
          // ignore
        }
      });
      markers = [];
    },

    renderMarkers() {
      if (!map) return;

      this.clearMarkers();

      markers = window.MAP_STATE.filteredPosts.map((post) => {
        const position = {
          lat: post.localLocation.latitude,
          lng: post.localLocation.longitude,
        };

        let marker;

        const AdvancedMarker = google.maps.marker?.AdvancedMarkerElement;

if (AdvancedMarker) {
  const wrapper = document.createElement("div");
  wrapper.style.width = "42px";
  wrapper.style.height = "42px";
  wrapper.style.borderRadius = "50%";
  wrapper.style.overflow = "hidden";
  wrapper.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
  wrapper.style.cursor = "pointer";
  wrapper.style.pointerEvents = "auto"; // ✅ CRITIQUE

  const img = document.createElement("img");
  img.src = post.user_avatar;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.pointerEvents = "none"; // ✅ CRITIQUE

  wrapper.appendChild(img);

  marker = new AdvancedMarker({
    position,
    map,
    content: wrapper,
  });

  marker.__post = post;

  // ✅ CLICK DOM (PAS gmp-click)
  wrapper.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🟢 MARKER DOM CLICK", post.id);
    window.openPostSheet([post]);
  });
}

        return marker;
      });
    },
  };
}

/* -----------------------------------------
   FILTERS (MAP ONLY)
----------------------------------------- */

window.applyMapFilters = function applyMapFilters() {
  const state = window.MAP_STATE;

  state.filteredPosts = state.posts.filter((post) => {
    const { feeling, activity, onlyWithImages } = state.filters;

    if (feeling && post.feeling?.title !== feeling.title) return false;
    if (activity && post.activity?.title !== activity.title) return false;

    if (onlyWithImages) {
      const hasImage =
        post.full_picture ||
        (Array.isArray(post.multiple_images) && post.multiple_images.length > 0);
      if (!hasImage) return false;
    }

    return true;
  });

  mapAdapter?.renderMarkers?.();
};

/* =========================================
   MAP → POST SHEET (RN PostModal parity)
========================================= */

window.openPostSheet = function openPostSheet(posts) {
  if (!Array.isArray(posts) || !posts.length) return;

  const overlay = document.getElementById("map-post-overlay");
  const sheet   = document.getElementById("map-post-sheet");
  const scroll  = document.getElementById("map-post-scroll");

  if (!overlay || !sheet || !scroll) {
    console.warn("❌ Map post sheet DOM missing");
    return;
  }

  // 🔒 RN parity — empêche double ouverture
  if (!overlay.classList.contains("hidden")) {
    return;
  }

  overlay.classList.remove("hidden");

  // 🧹 reset contenu (ANTI DOUBLON)
  while (scroll.firstChild) {
    scroll.removeChild(scroll.firstChild);
  }

  // 🔑 reset scroll position (iOS safe)
scroll.scrollTop = 0;

  const screenHeight = window.innerHeight;
  const isMulti = posts.length > 1;

  // 🔍 RN hasTallMedia — images / carrousel / vidéo uploadée
  const hasTallMedia = posts.some((post) => {
    if (post.video || post.video_url) return true;
    if (post.full_picture) return true;
    if (Array.isArray(post.multiple_images) && post.multiple_images.length > 0)
      return true;

    // ❌ link preview + YouTube restent compacts
    return false;
  });

  // 🟡 RN parity — YouTube ONLY (compact, ignore rawHeight)
const hasYouTubeOnly = posts.every((post) => {
  return (
    post.youtube_url &&
    !post.video &&
    !post.video_url &&
    !post.full_picture &&
    (!Array.isArray(post.multiple_images) ||
      post.multiple_images.length === 0)
  );
});

  // 1️⃣ INJECTION UNIQUE DES POSTS
  posts.forEach((post) => {
    const el = window.renderPostItemMobile(post);
    scroll.appendChild(el);
  });

  // 2️⃣ MESURE APRÈS RENDER (RN onLayout équivalent)
  requestAnimationFrame(() => {
    const rawHeight = scroll.scrollHeight;
    let height;

    if (isMulti) {
  height = screenHeight * 0.85;
}

/* 🟡 YOUTUBE — COMPACT FIX (RN PARITY) */
else if (hasYouTubeOnly) {
  height = screenHeight * 0.65;
}

/* 🟢 AUTRES CAS */
else {
  const BASE_MIN_HEIGHT  = screenHeight * 0.18;
  const MEDIA_MIN_HEIGHT = hasTallMedia
    ? screenHeight * 0.75
    : BASE_MIN_HEIGHT;

  const MAX_HEIGHT = hasTallMedia
    ? screenHeight * 0.88
    : screenHeight * 0.85;

  height = Math.min(
    Math.max(rawHeight + 48, MEDIA_MIN_HEIGHT),
    MAX_HEIGHT
  );
}

    sheet.style.height = `${Math.round(height)}px`;
  });

  // 3️⃣ INIT DRAG — UNE SEULE FOIS (RN canCloseRef)
  if (!overlay.__dragInit) {
    initMapPostSheetDrag(overlay, scroll);
    overlay.__dragInit = true;
  }
};

/* -----------------------------------------
   Drag / close logic — RN canCloseRef parity
----------------------------------------- */

function initMapPostSheetDrag(overlay, scroll) {
  let startY = null;
  let canClose = true;

  // reset listeners (avoid stacking)
  const handle = document.getElementById("map-post-handle");
  if (!handle) return;

  scroll.onscroll = () => {
    canClose = scroll.scrollTop <= 2;
  };

  // Touch
  handle.ontouchstart = (e) => {
    startY = e.touches?.[0]?.clientY ?? null;
  };

  handle.ontouchend = (e) => {
    if (startY === null || !canClose) return;

    const endY = e.changedTouches?.[0]?.clientY ?? startY;
    const dy = endY - startY;

    if (dy > 80) overlay.classList.add("hidden");
    startY = null;
  };

  // Click outside to close (nice parity)
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  };
}

/* -----------------------------------------
   DEBUG
----------------------------------------- */

window.__MAP_DEBUG__ = {
  state: window.MAP_STATE,
};