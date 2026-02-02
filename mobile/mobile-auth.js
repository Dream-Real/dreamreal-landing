console.log("✅ mobile-auth.js LOADED");

/* =========================================================
   DREAM REAL — MOBILE AUTH (EMAIL OTP)
   Clone logique desktop (sans UI desktop)
   GARANTI SANS CASSE
========================================================= */

/* ---------------------------------------------------------
   GLOBAL AUTH STATE (ALIGN DESKTOP)
--------------------------------------------------------- */
window.AUTH = {
  token: null,
  user: null,
  isAuthenticated: false,
};

/* ---------------------------------------------------------
   DOM READY
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  console.log("📱 mobile-auth DOMContentLoaded");

  const openEmailBtn = document.getElementById("open-email");
  const emailOverlay = document.getElementById("email-overlay");
  const otpOverlay = document.getElementById("otp-overlay");

  const sendOtpBtn = document.getElementById("send-otp");
  const verifyOtpBtn = document.getElementById("verify-otp");

  const emailInput = document.getElementById("auth-email");
  const otpInput = document.getElementById("auth-otp");

  /* -------------------------------------------------------
     SAFETY CHECKS
  ------------------------------------------------------- */
  if (!openEmailBtn) {
    console.warn("❌ #open-email not found");
    return;
  }

  if (!window.API_URL) {
    console.error("❌ window.API_URL is missing");
    return;
  }

  /* -------------------------------------------------------
     OPEN EMAIL MODAL
  ------------------------------------------------------- */
  openEmailBtn.addEventListener("click", () => {
    console.log("📨 Open email modal");
    emailOverlay?.classList.remove("hidden");
  });

  /* -------------------------------------------------------
     SEND OTP
  ------------------------------------------------------- */
  console.log("🟡 sendOtpBtn =", sendOtpBtn);
  sendOtpBtn?.addEventListener("click", async () => {
    const email = emailInput?.value?.trim().toLowerCase();
    if (!email) {
      alert("Please enter a valid email");
      return;
    }

    console.log("🔐 Request OTP for:", email);

    try {
      const res = await fetch(`${window.API_URL}/api/otp/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("OTP request failed");

      emailOverlay.classList.add("hidden");
      otpOverlay.classList.remove("hidden");
    } catch (err) {
      console.error("❌ OTP request error:", err);
      alert("Failed to send code");
    }
  });

  /* -------------------------------------------------------
     VERIFY OTP  (CLONE DESKTOP LOGIC)
  ------------------------------------------------------- */
  verifyOtpBtn?.addEventListener("click", async () => {
    const email = emailInput?.value?.trim().toLowerCase();
    const otp = otpInput?.value?.trim();

    if (!email || !otp) {
      alert("Missing email or code");
      return;
    }

    console.log("🔑 Verify OTP:", email, otp);

    try {
      const res = await fetch(`${window.API_URL}/api/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!data.success) {
        alert("Invalid code");
        return;
      }

      /* =========================
         AUTH SUCCESS (DESKTOP 1:1)
      ========================= */

      // 🔐 global auth
      window.AUTH.token = data.token;
      window.AUTH.isAuthenticated = true;

      // 🔐 storage
      localStorage.setItem("token", data.token);

      if (data.user) {
        window.AUTH.user = data.user;
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      console.log("✅ Mobile auth success:", data.user);

      // 🔁 redirect
      if (data.needs_profile) {
        window.location.href = "/mobile/complete-profile.html";
      } else {
        window.location.href = "/mobile.html";
      }
    } catch (err) {
      console.error("❌ OTP verify error:", err);
      alert("Login failed");
    }
  });

  /* -------------------------------------------------------
     RESTORE SESSION (REFRESH SAFE)
  ------------------------------------------------------- */
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (savedToken && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      window.AUTH.token = savedToken;
      window.AUTH.user = user;
      window.AUTH.isAuthenticated = true;

      console.log("♻️ Mobile session restored");

      // 🔁 auto-redirect if already logged
      window.location.href = "/mobile.html";
    } catch (e) {
      console.warn("⚠️ Invalid cached user");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
    /* -------------------------------------------------------
     CLOSE AUTH MODALS (CANCEL / UX SAFETY)
     Desktop parity
  ------------------------------------------------------- */
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("❌ Auth modal cancelled");

      emailOverlay?.classList.add("hidden");
      otpOverlay?.classList.add("hidden");

      // 🔓 UX safety — restore scroll if blocked
      document.body.style.overflow = "";
    });
  });
});