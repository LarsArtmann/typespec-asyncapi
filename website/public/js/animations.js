if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll("[data-animate]").forEach((el) => el.classList.add("animate-fade-in"));
}
