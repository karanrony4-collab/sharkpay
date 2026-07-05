import { supabase } from "../../user-app/js/config/supabase.js";
import { logActivity } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const adminEmailInput = document.getElementById("adminEmail");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const errorMsg = document.getElementById("profileError");
  const successMsg = document.getElementById("profileSuccess");

  // Load current admin email from session
  let currentAdminId = null;
  try {
    const sessionStr = localStorage.getItem("SharkPay_admin_session");
    if (sessionStr) {
      const adminData = JSON.parse(sessionStr);
      if (adminData.email) {
        adminEmailInput.value = adminData.email;
        currentAdminId = adminData.id;
      }
    }
  } catch (e) {
    console.error("Error reading session data:", e);
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      errorMsg.classList.add("hidden");
      successMsg.classList.add("hidden");

      if (newPassword !== confirmPassword) {
        errorMsg.textContent = "Passwords do not match";
        errorMsg.classList.remove("hidden");
        return;
      }

      if (newPassword.length < 6) {
        errorMsg.textContent = "Password must be at least 6 characters";
        errorMsg.classList.remove("hidden");
        return;
      }

      if (!currentAdminId) {
        errorMsg.textContent = "Admin session invalid, please login again";
        errorMsg.classList.remove("hidden");
        return;
      }

      const btn = e.target.querySelector("button");
      btn.textContent = "Updating...";
      btn.disabled = true;

      try {
        const { error } = await supabase
          .from("admins")
          .update({ password: newPassword })
          .eq("id", currentAdminId);

        if (error) throw error;

        successMsg.textContent = "Password updated successfully!";
        successMsg.classList.remove("hidden");
        
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";
        
        await logActivity("Profile Update", `Changed password for admin: ${adminEmailInput.value}`);
        
        // Update session
        const sessionStr = localStorage.getItem("SharkPay_admin_session");
        const adminData = JSON.parse(sessionStr);
        adminData.password = newPassword;
        localStorage.setItem("SharkPay_admin_session", JSON.stringify(adminData));
        
      } catch (err) {
        console.error("Failed to update password:", err);
        errorMsg.textContent = "Failed to update password: " + err.message;
        errorMsg.classList.remove("hidden");
      } finally {
        btn.textContent = "Update Password";
        btn.disabled = false;
      }
    });
  }
});
