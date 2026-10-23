const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  const lightIcon = themeToggle.querySelector(".theme-icon-light");
  const darkIcon = themeToggle.querySelector(".theme-icon-dark");
  const autoIcon = themeToggle.querySelector(".theme-icon-auto");
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  const themes = ["light", "dark", "auto"];

  function getStoredTheme() {
    return (
      localStorage.getItem("starlight-theme") ||
      localStorage.getItem("theme") ||
      "auto"
    );
  }

  function resolveVisualTheme(stored) {
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme() {
    const stored = getStoredTheme();
    const visual = resolveVisualTheme(stored);
    if (lightIcon) lightIcon.classList.toggle("hidden", stored !== "light");
    if (darkIcon) darkIcon.classList.toggle("hidden", stored !== "dark");
    if (autoIcon) autoIcon.classList.toggle("hidden", stored !== "auto");
    themeToggle.setAttribute(
      "aria-label",
      "Current: " + stored + " (click to cycle)",
    );
    const color = visual === "light" ? "#faf8f5" : "#0a0908";
    themeColorMetas.forEach((meta) => meta.setAttribute("content", color));
  }

  applyTheme();

  themeToggle.addEventListener("click", () => {
    const current = getStoredTheme();
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    localStorage.setItem("starlight-theme", next);
    document.documentElement.dataset.theme = resolveVisualTheme(next);
    applyTheme();
  });

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
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

  function setOpen(isOpen) {
    navLinks.classList.toggle("open", isOpen);
    if (menuIcon) menuIcon.classList.toggle("hidden", isOpen);
    if (closeIcon) closeIcon.classList.toggle("hidden", !isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  function closeNav(returnFocus) {
    if (!navLinks.classList.contains("open")) return;
    setOpen(false);
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    setOpen(!navLinks.classList.contains("open"));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeNav(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav(true);
  });

  document.addEventListener("click", (event) => {
    if (!navLinks.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (navLinks.contains(target) || toggle.contains(target)) return;
    closeNav(false);
  });

  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    if (event.matches) closeNav(false);
  });
}
