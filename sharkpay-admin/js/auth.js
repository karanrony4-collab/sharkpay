// auth.js
import { supabase } from "../../user-app/js/config/supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const sessionStr = localStorage.getItem("SharkPay_admin_session");
  if (!sessionStr) {
    window.location.href = "./login.html";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("SharkPay_admin_session");
      window.location.href = "./login.html";
    });
  }
});

export async function logActivity(action, details) {
  try {
    await supabase.from("activity_logs").insert({
      action,
      details,
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
