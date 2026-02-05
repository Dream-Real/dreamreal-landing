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
        gestureHandling: "greedy", // ✅ iOS Safari UX
      });

      this.renderMarkers();
    },

    centerOnUser(coords) {
      if (!map) return;
      map.setCenter(coords);
      map.setZoom(14);
    },

    updateUserLocation() {
      // optional: blue dot later
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

        // ✅ Prefer AdvancedMarkerElement when available
        // ⚠️ On iOS Safari it can be undefined depending on version/config.
        const AdvancedMarker = google.maps.marker?.AdvancedMarkerElement;

        if (AdvancedMarker) {
          const content = document.createElement("img");
          content.src = post.user_avatar;
          content.style.width = "42px";
          content.style.height = "42px";
          content.style.borderRadius = "50%";
          content.style.objectFit = "cover";
          content.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";

          marker = new AdvancedMarker({
            position,
            map,
            content,
          });

          marker.__post = post;

          // AdvancedMarker click event
          marker.addListener("gmp-click", () => {
            window.openPostSheet([post]);
          });
        } else {
          // ✅ Fallback: classic Marker works everywhere
          marker = new google.maps.Marker({
            position,
            map,
            icon: {
              url: post.user_avatar,
              scaledSize: new google.maps.Size(42, 42),
            },
          });

          marker.__post = post;

          marker.addListener("click", () => {
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
   ✅ SINGLE SOURCE OF TRUTH (no duplicate function names)
========================================= */

window.openPostSheet = function openPostSheet(posts) {
  if (!Array.isArray(posts) || !posts.length) return;

  // store selection (parity)
  window.MAP_STATE.selectedPosts = posts;

  const overlay = document.getElementById("map-post-overlay");
  const sheet = document.getElementById("map-post-sheet");
  const scroll = document.getElementById("map-post-scroll");

  if (!overlay || !sheet || !scroll) {
    console.warn("❌ Map post sheet DOM missing");
    return;
  }

  overlay.classList.remove("hidden");
  scroll.innerHTML = "";

  const screenHeight = window.innerHeight;
  const isMulti = posts.length > 1;

  // 🟢 RN PARITY — HEIGHT LOGIC (simple v1)
  const height = isMulti ? screenHeight * 0.85 : screenHeight * 0.6;
  sheet.style.height = `${Math.round(height)}px`;

  // inject posts (reuse feed renderer)
  posts.forEach((post) => {
    if (typeof window.renderPostItemMobile === "function") {
      const el = window.renderPostItemMobile(post);
      scroll.appendChild(el);
    } else {
      // fallback minimal (never crash)
      const div = document.createElement("div");
      div.style.padding = "16px";
      div.style.color = "#fff";
      div.textContent =
        (post.user_first_name || "") +
        " " +
        (post.user_last_name || "") +
        " — " +
        (post.message || "");
      scroll.appendChild(div);
    }
  });

  initMapPostSheetDrag(overlay, scroll);
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
    canClose = scroll.scrollTop <= 0;
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