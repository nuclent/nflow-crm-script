(function () {
  const STORAGE_KEY = "visitedCasePages";
  const MAX_PAGES = 10;
  const CASE_URL_REGEX = /\/case\/([^/?#&]+)/;

  // Retrieve visited pages from localStorage
  function getVisitedPages() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      console.error("Error reading visitedCasePages from localStorage:", e);
      return [];
    }
  }

  // Save visited pages to localStorage
  function saveVisitedPages(pages) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(pages.slice(0, MAX_PAGES))
    );
  }

  // Add or update current page in visited pages
  function addCurrentPage() {
    const match = window.location.pathname.match(CASE_URL_REGEX);
    if (match && match[1]) {
      const caseId = match[1];
      let pages = getVisitedPages();

      const index = pages.findIndex((page) => page.id === caseId);
      if (index !== -1) {
        // Update title if it has changed
        if (pages[index].title !== document.title) {
          pages[index].title = document.title;
          saveVisitedPages(pages);
          renderNav();
        }
      } else {
        // Add new entry at the beginning
        pages.unshift({
          id: caseId,
          url: window.location.href,
          title: document.title,
        });
        saveVisitedPages(pages);
        renderNav();
      }
    }
  }

  // Remove a specific page from visited pages
  function removePage(caseId) {
    let pages = getVisitedPages();
    pages = pages.filter((page) => page.id !== caseId);
    saveVisitedPages(pages);
    renderNav();
  }

  // Clear all visited pages
  function clearAllPages() {
    if (confirm("Are you sure you want to clear all visited cases?")) {
      localStorage.removeItem(STORAGE_KEY);
      renderNav();
    }
  }

  // Navigate using React Router's history (client-side)
  function navigateTo(url) {
    history.pushState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
  }

  // Create and render the sticky navigation tab and panel
  function renderNav() {
    // Check if panel is currently open
    const existingPanel = document.getElementById("visited-pages-panel");
    const isPanelOpen =
      existingPanel && existingPanel.style.display === "block";

    // Remove existing nav and panel if any
    const existingNav = document.getElementById("visited-pages-nav");
    if (existingNav) existingNav.remove();
    if (existingPanel) existingPanel.remove();

    const pages = getVisitedPages();
    if (pages.length === 0) return;

    // Create navigation tab
    const nav = document.createElement("div");
    nav.id = "visited-pages-nav";
    Object.assign(nav.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "60px",
      height: "60px",
      background: "#007BFF",
      color: "#fff",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      zIndex: 1000,
      fontSize: "24px",
    });
    nav.innerText = "📂";

    // Create the panel
    const panel = document.createElement("div");
    panel.id = "visited-pages-panel";
    Object.assign(panel.style, {
      position: "fixed",
      bottom: "90px",
      right: "20px",
      width: "350px", // Increased width to prevent text wrapping
      maxHeight: "400px",
      background: "#fff",
      color: "#000",
      border: "1px solid #ccc",
      borderRadius: "8px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      overflowY: "auto",
      display: isPanelOpen ? "block" : "none", // Maintain open state
      zIndex: 1000,
      padding: "10px",
    });

    // Header with Clear All button
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    });

    const title = document.createElement("span");
    title.innerText = "Visited Cases";
    Object.assign(title.style, {
      fontWeight: "bold",
      fontSize: "16px",
    });

    const clearAllBtn = document.createElement("button");
    clearAllBtn.innerText = "Clear All";
    Object.assign(clearAllBtn.style, {
      background: "#dc3545",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      padding: "5px 10px",
      cursor: "pointer",
      fontSize: "14px",
    });

    clearAllBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearAllPages();
    });

    header.appendChild(title);
    header.appendChild(clearAllBtn);
    panel.appendChild(header);

    // Get current URL for highlighting
    const currentUrl = window.location.href;

    // Populate the panel with links and remove buttons
    pages.forEach((page) => {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.justifyContent = "space-between";
      container.style.alignItems = "center";
      container.style.marginBottom = "8px";

      const link = document.createElement("a");
      link.href = page.url;
      link.innerText = page.title || `Case ${page.id}`;
      Object.assign(link.style, {
        color: "#007BFF",
        textDecoration: "none",
        flex: "1",
        marginRight: "10px",
        wordBreak: "normal", // Prevent wrapping
        padding: "4px",
        borderRadius: "4px",
        background: page.url === currentUrl ? "#e0f7fa" : "transparent", // Highlight if current
        fontWeight: page.url === currentUrl ? "bold" : "normal",
        whiteSpace: "nowrap", // Prevent text wrapping
        overflow: "hidden",
        textOverflow: "ellipsis",
      });

      // Handle click for client-side navigation
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(page.url);
        panel.style.display = "block"; // Keep panel open
      });

      // Remove button for each case
      const removeBtn = document.createElement("button");
      removeBtn.innerText = "✖";
      Object.assign(removeBtn.style, {
        background: "none",
        border: "none",
        color: "#dc3545",
        cursor: "pointer",
        fontSize: "16px",
      });

      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removePage(page.id);
        if (page.url === currentUrl) {
          panel.style.display = "none"; // Optionally close if current page is removed
        }
      });

      container.appendChild(link);
      container.appendChild(removeBtn);
      panel.appendChild(container);
    });

    // Toggle panel visibility
    nav.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    // Close panel when clicking outside
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !panel.contains(e.target)) {
        panel.style.display = "none";
      }
    });

    document.body.appendChild(nav);
    document.body.appendChild(panel);
  }

  // Monitor URL changes in SPA
  function monitorURLChanges() {
    let lastUrl = window.location.href;

    // Override pushState
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    // Override replaceState
    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    // Listen to popstate
    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("locationchange"));
    });

    // Listen to custom locationchange event
    window.addEventListener("locationchange", () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        addCurrentPage();
      }
    });
  }

  // Observe title changes to update visited pages
  function observeTitleChange() {
    const titleElement = document.querySelector("title");
    if (!titleElement) return;

    const observer = new MutationObserver(() => {
      addCurrentPage();
    });

    observer.observe(titleElement, { childList: true });
  }

  // Initialize the script
  function init() {
    addCurrentPage();
    renderNav();
    monitorURLChanges();
    observeTitleChange();
  }

  // Run init on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
