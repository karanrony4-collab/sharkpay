document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");

  if (!sidebar || !toggleBtn) return;

  // Check initial state from localStorage or screen size
  const isMobile = window.innerWidth <= 768;
  const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

  if (isMobile) {
    sidebar.classList.add("mobile-hidden");
    sidebar.classList.remove("collapsed");
  } else if (isCollapsed) {
    sidebar.classList.add("collapsed");
  }

  toggleBtn.addEventListener("click", () => {
    const isMobileNow = window.innerWidth <= 768;
    if (isMobileNow) {
      if (sidebar.classList.contains("mobile-hidden")) {
        sidebar.classList.remove("mobile-hidden");
        sidebar.classList.add("mobile-visible");
      } else {
        sidebar.classList.add("mobile-hidden");
        sidebar.classList.remove("mobile-visible");
      }
    } else {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sidebarCollapsed",
        sidebar.classList.contains("collapsed"),
      );
    }
  });

  // Hide/collapse sidebar on option click
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const isMobileNow = window.innerWidth <= 768;
      if (isMobileNow) {
        sidebar.classList.add("mobile-hidden");
        sidebar.classList.remove("mobile-visible");
      } else {
        // Also collapse on desktop if requested "select kr le to phir hide ho jaye"
        sidebar.classList.add("collapsed");
        localStorage.setItem("sidebarCollapsed", "true");
      }
    });
  });

  // Handle resize events
  window.addEventListener("resize", () => {
    const isMobileNow = window.innerWidth <= 768;
    if (isMobileNow) {
      sidebar.classList.remove("collapsed");
      if (!sidebar.classList.contains("mobile-visible")) {
        sidebar.classList.add("mobile-hidden");
      }
    } else {
      sidebar.classList.remove("mobile-hidden");
      sidebar.classList.remove("mobile-visible");
      const shouldCollapse =
        localStorage.getItem("sidebarCollapsed") === "true";
      if (shouldCollapse) {
        sidebar.classList.add("collapsed");
      } else {
        sidebar.classList.remove("collapsed");
      }
    }
  });
});
