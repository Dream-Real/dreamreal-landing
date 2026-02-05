/* =========================================
   DREAM REAL — MAP CONTROLLER (MOBILE WEB)
   Parity with RN MapScreen
   Engine: Apple Maps (MapKit JS) / Google Maps
========================================= */

console.log("🗺️ map.controller.js loaded");

/* -----------------------------------------
   GLOBAL MAP STATE (RN PARITY)
----------------------------------------- */

window.MAP_STATE = {
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
  if (!Array.isArray(posts)) {
    console.error("❌ initMobileMap: invalid posts");
    return;
  }

  MAP_STATE.posts = posts.filter(
    (p) => p.localLocation?.latitude && p.localLocation?.longitude
  );

  MAP_STATE.filteredPosts = MAP_STATE.posts;

  console.log("📍 Map posts:", MAP_STATE.posts.length);

  if (MAP_ENGINE === "apple") {
    loadAppleMap();
  } else {
    loadGoogleMap();
  }

  initGeolocation();
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
      MAP_STATE.userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      if (mapAdapter?.updateUserLocation) {
        mapAdapter.updateUserLocation(MAP_STATE.userLocation);
      }

      if (!MAP_STATE.hasCenteredOnce && mapAdapter?.centerOnUser) {
        mapAdapter.centerOnUser(MAP_STATE.userLocation);
        MAP_STATE.hasCenteredOnce = true;
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
      map.setCenterAnimated(
        new mapkit.Coordinate(coords.lat, coords.lng)
      );
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

      annotations = MAP_STATE.filteredPosts.map((post) => {
        const coord = new mapkit.Coordinate(
          post.localLocation.latitude,
          post.localLocation.longitude
        );

        const ann = new mapkit.MarkerAnnotation(coord, {
          color: "#EECD79",
          glyphImage: post.user_avatar,
        });

        ann.data = post;

        ann.addEventListener("select", () => {
          openPostSheet([post]);
        });

        map.addAnnotation(ann);
        return ann;
      });
    },
  };
}

/* -----------------------------------------
   GOOGLE MAPS (✅ CORRIGÉ — NO CLUSTERING)
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
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        disableDefaultUI: true,
      });

      this.renderMarkers();
    },

    centerOnUser(coords) {
      map.setCenter(coords);
      map.setZoom(14);
    },

    updateUserLocation() {
      // optional blue dot later
    },

    clearMarkers() {
      markers.forEach((m) => m.setMap(null));
      markers = [];
    },

    renderMarkers() {
      this.clearMarkers();

      markers = MAP_STATE.filteredPosts.map((post) => {
        const marker = new google.maps.Marker({
          position: {
            lat: post.localLocation.latitude,
            lng: post.localLocation.longitude,
          },
          map,
          icon: {
            url: post.user_avatar,
            scaledSize: new google.maps.Size(42, 42),
          },
        });

        marker.__post = post;

        marker.addListener("click", () => {
          openPostSheet([post]);
        });

        return marker;
      });
    },
  };
}

/* -----------------------------------------
   FILTERS (MAP ONLY)
----------------------------------------- */

window.applyMapFilters = function applyMapFilters() {
  MAP_STATE.filteredPosts = MAP_STATE.posts.filter((post) => {
    const { feeling, activity, onlyWithImages } = MAP_STATE.filters;

    if (feeling && post.feeling?.title !== feeling.title) return false;
    if (activity && post.activity?.title !== activity.title) return false;

    if (onlyWithImages) {
      const hasImage =
        post.full_picture ||
        (Array.isArray(post.multiple_images) &&
          post.multiple_images.length > 0);
      if (!hasImage) return false;
    }

    return true;
  });

  mapAdapter?.renderMarkers();
};

/* -----------------------------------------
   POST SHEET BRIDGE
----------------------------------------- */

function openPostSheet(posts) {
  MAP_STATE.selectedPosts = posts;

  if (typeof window.openPostSheet === "function") {
    window.openPostSheet(posts);
  } else {
    console.warn("⚠️ openPostSheet not implemented");
  }
}

/* -----------------------------------------
   DEBUG
----------------------------------------- */

window.__MAP_DEBUG__ = {
  state: MAP_STATE,
};