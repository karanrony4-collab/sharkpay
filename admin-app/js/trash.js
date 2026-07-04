import { supabase } from "../../user-app/js/config/supabase.js";
import { logActivity } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const trashTableBody = document.getElementById("trashTableBody");
  async function fetchTrash() {
    try {
      const { data: trashItems } = await supabase
        .from("trash")
        .select("*")
        .order("deleted_at", { ascending: false });
      trashTableBody.innerHTML = "";
      if (!trashItems || trashItems.length === 0) {
        trashTableBody.innerHTML =
          '<tr><td colspan="3" style="text-align:center;">Trash is empty</td></tr>';
        return;
      }
      trashItems.forEach((item) => {
        const tr = document.createElement("tr");
        const userMobile = item.record_data?.mobile || "Unknown";
        tr.innerHTML = `
                  <td>${userMobile}</td>
                  <td>${new Date(item.deleted_at).toLocaleString()}</td>
                  <td>
                      <button class="restore-btn admin-btn" data-id="${item.id}" style="width: auto; padding: 4px 8px; background: #10b981;">Restore</button>
                      <button class="delete-perm-btn admin-btn" data-id="${item.id}" style="width: auto; padding: 4px 8px; background: #ef4444;">Delete</button>
                  </td>
              `;
        trashTableBody.appendChild(tr);
      });

      document.querySelectorAll(".restore-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.getAttribute("data-id");
          const item = trashItems.find((t) => t.id === id);
          if (item && item.original_table === "users") {
            await supabase.from("users").insert(item.record_data);
            await supabase.from("trash").delete().eq("id", id);
            fetchTrash();
            logActivity(
              "User Restored",
              `Restored user ${item.record_data.mobile} from trash`,
            );
          }
        });
      });

      document.querySelectorAll(".delete-perm-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          if (!confirm("Permanently delete this user? This cannot be undone."))
            return;
          const id = e.currentTarget.getAttribute("data-id");
          const item = trashItems.find((t) => t.id === id);

          if (item && item.record_data && item.record_data.id) {
            // Permanently delete from users table as requested
            await supabase.from("users").delete().eq("id", item.record_data.id);
          }
          await supabase.from("trash").delete().eq("id", id);
          fetchTrash();
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  document
    .getElementById("restoreAllBtn")
    .addEventListener("click", async () => {
      const { data: trashItems } = await supabase.from("trash").select("*");
      if (trashItems) {
        for (const item of trashItems) {
          if (item.original_table === "users") {
            await supabase.from("users").insert(item.record_data);
            await supabase.from("trash").delete().eq("id", item.id);
          }
        }
        fetchTrash();
      }
    });

  document
    .getElementById("emptyTrashBtn")
    .addEventListener("click", async () => {
      if (confirm("Are you sure you want to empty the trash?")) {
        const { data: trashItems } = await supabase.from("trash").select("*");
        if (trashItems) {
          for (const item of trashItems) {
            if (item.record_data && item.record_data.id) {
              // Permanently delete from users table as requested
              await supabase
                .from("users")
                .delete()
                .eq("id", item.record_data.id);
            }
            await supabase.from("trash").delete().eq("id", item.id);
          }
          fetchTrash();
        }
      }
    });

  fetchTrash();
});
