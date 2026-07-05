import { supabase } from "../../user-app/js/config/supabase.js";
import { logActivity } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.getElementById("downloadPdfBtn");
  const statusDiv = document.getElementById("reportStatus");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", async () => {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Generating PDF...';
      statusDiv.textContent = "Fetching users data...";
      statusDiv.style.color = "#3b82f6";
      
      try {
        const { data: users, error } = await supabase
          .from("users")
          .select("id, mobile, status, login_count, last_login, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!users || users.length === 0) {
          statusDiv.textContent = "No users found to generate report.";
          statusDiv.style.color = "#ef4444";
          downloadBtn.disabled = false;
          downloadBtn.innerHTML = '<i data-lucide="download"></i> Download All Users (PDF)';
          lucide.createIcons();
          return;
        }

        statusDiv.textContent = `Found ${users.length} users. Creating PDF...`;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("SharkPay - Users Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Users: ${users.length}`, 14, 36);

        const tableColumn = ["Mobile", "Status", "Logins", "Last Login", "Created At"];
        const tableRows = [];

        users.forEach(user => {
          const userData = [
            user.mobile,
            user.status,
            user.login_count,
            new Date(user.last_login).toLocaleDateString(),
            new Date(user.created_at).toLocaleDateString()
          ];
          tableRows.push(userData);
        });

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 42,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save("SharkPay_Users_Report.pdf");

        statusDiv.textContent = "PDF downloaded successfully!";
        statusDiv.style.color = "#10b981";
        
        await logActivity("Report Generation", `Downloaded PDF report of ${users.length} users`);
        
      } catch (err) {
        console.error("PDF generation failed:", err);
        statusDiv.textContent = "Error generating PDF: " + err.message;
        statusDiv.style.color = "#ef4444";
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i data-lucide="download"></i> Download All Users (PDF)';
        lucide.createIcons();
      }
    });
  }
});
