const root = document.documentElement;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const targets = document.querySelectorAll("[data-animate]");

root.classList.add("js");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  targets.forEach((el) => el.classList.add("animate-fade-in"));
} else {
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
  targets.forEach((el) => observer.observe(el));
}
