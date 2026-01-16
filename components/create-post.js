// =========================
// CREATE POST — MODAL
// =========================

export function mountCreatePost() {
  const root = document.getElementById("create-post-root");
  if (!root) return;

  root.innerHTML = `
    <div class="cp-overlay hidden" id="cp-overlay">
      <div class="cp-modal">
        <div class="cp-header">
          <h3>Create post</h3>
          <button class="cp-close" id="cp-close">✕</button>
        </div>

        <div class="cp-user">
          <img src="https://i.pravatar.cc/100" />
          <span>Dream Real User</span>
        </div>

        <textarea
          id="cp-message"
          placeholder="What's on your mind?"
        ></textarea>

        <div class="cp-preview" id="cp-preview"></div>

        <div class="cp-actions">
          <button data-action="photo">📷 Photo</button>
          <button data-action="mood">😊 Mood</button>
          <button data-action="location">📍 Location</button>
        </div>

        <button class="cp-submit disabled" id="cp-submit">
          Post
        </button>
      </div>
    </div>
  `;

  bindCreatePost();
}

// =========================
// LOGIC
// =========================

function bindCreatePost() {
  const overlay = document.getElementById("cp-overlay");
  const close = document.getElementById("cp-close");
  const submit = document.getElementById("cp-submit");
  const message = document.getElementById("cp-message");
  const preview = document.getElementById("cp-preview");

  const trigger = document.querySelector(".btn-create");

if (trigger) {
  trigger.addEventListener("click", () => {
    overlay.classList.remove("hidden");
  });
}

  let mood = null;
  let location = null;

  close.onclick = () => {
    overlay.classList.add("hidden");
  };

  message.oninput = () => update();

  document.querySelectorAll(".cp-actions button").forEach((btn) => {
    btn.onclick = () => {
      const type = btn.dataset.action;

      if (type === "mood") mood = "Happy";
      if (type === "location") location = "Paris";

      renderPreview();
      update();
    };
  });

  function renderPreview() {
    preview.innerHTML = `
      ${mood ? `<div>😊 Feeling ${mood}</div>` : ""}
      ${location ? `<div>📍 ${location}</div>` : ""}
    `;
  }

  function update() {
    const valid =
      message.value.trim().length > 0 || mood || location;

    submit.classList.toggle("disabled", !valid);
  }

  submit.onclick = () => {
    alert("Post created (mock)");
    overlay.classList.add("hidden");
    message.value = "";
    mood = null;
    location = null;
    preview.innerHTML = "";
    update();
  };
}