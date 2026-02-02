console.log("✅ mobile-auth.js LOADED");

document.addEventListener("DOMContentLoaded", () => {
  const openEmailBtn = document.getElementById("open-email");
  const emailOverlay = document.getElementById("email-overlay");
  const otpOverlay = document.getElementById("otp-overlay");

  const sendOtpBtn = document.getElementById("send-otp");
  const verifyOtpBtn = document.getElementById("verify-otp");

  if (!openEmailBtn) {
    console.warn("❌ #open-email not found");
    return;
  }

  // 👉 OPEN EMAIL MODAL
  openEmailBtn.addEventListener("click", () => {
    emailOverlay?.classList.remove("hidden");
  });

  // 👉 SEND OTP
  sendOtpBtn?.addEventListener("click", async () => {
    const email = document.getElementById("auth-email")?.value?.trim();
    if (!email) return;

    await fetch(`${window.API_URL}/api/otp/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    emailOverlay.classList.add("hidden");
    otpOverlay.classList.remove("hidden");
  });

  // 👉 VERIFY OTP
  verifyOtpBtn?.addEventListener("click", async () => {
    const email = document.getElementById("auth-email")?.value?.trim();
    const otp = document.getElementById("auth-otp")?.value?.trim();

    if (!email || !otp) return;

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

    localStorage.setItem("token", data.token);
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    window.location.href = "/mobile.html";
  });
});