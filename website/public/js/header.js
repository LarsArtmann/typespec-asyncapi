const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  const lightIcon = themeToggle.querySelector(".theme-icon-light");
  const darkIcon = themeToggle.querySelector(".theme-icon-dark");
  const autoIcon = themeToggle.querySelector(".theme-icon-auto");
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  const themes = ["light", "dark", "auto"];

  function getStoredTheme() {
    return localStorage.getItem("starlight-theme") || localStorage.getItem("theme") || "auto";
  }

  function resolveVisualTheme(stored) {
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme() {
    const stored = getStoredTheme();
    const visual = resolveVisualTheme(stored);
    if (lightIcon) lightIcon.classList.toggle("hidden", stored !== "light");
    if (darkIcon) darkIcon.classList.toggle("hidden", stored !== "dark");
    if (autoIcon) autoIcon.classList.toggle("hidden", stored !== "auto");
    themeToggle.setAttribute("aria-label", "Current: " + stored + " (click to cycle)");
    const color = visual === "light" ? "#fafaf9" : "#0c0a09";
    themeColorMetas.forEach((m) => m.setAttribute("content", color));
  }

  applyTheme();

  themeToggle.addEventListener("click", () => {
    const current = getStoredTheme();
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    localStorage.setItem("starlight-theme", next);
    document.documentElement.dataset.theme = resolveVisualTheme(next);
    applyTheme();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const stored = getStoredTheme();
    if (stored === "auto" || !stored) {
      document.documentElement.dataset.theme = resolveVisualTheme(stored);
      applyTheme();
    }
  });
}

const toggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
if (toggle && navLinks) {
  const menuIcon = toggle.querySelector(".menu-icon");
  const closeIcon = toggle.querySelector(".close-icon");

  toggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");
    if (menuIcon) menuIcon.classList.toggle("hidden", isOpen);
    if (closeIcon) closeIcon.classList.toggle("hidden", !isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      if (menuIcon) menuIcon.classList.remove("hidden");
      if (closeIcon) closeIcon.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}
