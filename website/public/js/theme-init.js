(function () {
  var stored = localStorage.getItem("starlight-theme") || localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var isLight = stored === "light" || ((!stored || stored === "auto") && !prefersDark);
  document.documentElement.dataset.theme = isLight ? "light" : "dark";
})();
