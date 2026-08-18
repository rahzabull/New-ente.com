const revealGroups = [
  { selector: ".hero-copy", step: 0, variant: "reveal-slide-left" },
  { selector: ".hero-visual", step: 120, variant: "reveal-zoom" },
  { selector: ".hero-side", step: 220, variant: "reveal-slide-right" },
  { selector: ".logo-strip", step: 0, variant: "reveal-zoom" },
  { selector: ".products > .card-photos", step: 0, variant: "reveal-zoom" },
  { selector: ".product-row > .card", step: 140, variant: "reveal-zoom" },
  { selector: ".why > .eyebrow, .why > h2, .why > .lede", step: 100, variant: "reveal-slide-left" },
  { selector: ".feature-grid > article", step: 110, variant: "reveal-zoom" },
  { selector: ".knowledge-row > *", step: 130, variant: "reveal-slide-right" },
  { selector: ".testimonials > h2", step: 0, variant: "reveal-slide-left" },
  { selector: ".testimonial-grid > .quote-card", step: 140, variant: "reveal-zoom" },
  { selector: ".switch > .eyebrow, .switch > h2, .switch > .lede, .switch > .card-actions", step: 90, variant: "reveal-slide-left" },
  { selector: ".switch > .import-panel", step: 220, variant: "reveal-zoom" },
  { selector: ".community > .community-art", step: 0, variant: "reveal-slide-left" },
  { selector: ".community > .community-copy", step: 140, variant: "reveal-slide-right" },
  { selector: ".footer > .footer-top", step: 0, variant: "reveal-slide-left" },
  { selector: ".footer > .footer-main", step: 120, variant: "reveal-zoom" },
  { selector: ".footer > .footer-socials", step: 220, variant: "reveal-slide-right" }
];

const addRevealClasses = () => {
  const seen = new Set();

  revealGroups.forEach(({ selector, step, variant }) => {
    const nodes = document.querySelectorAll(selector);

    nodes.forEach((node, index) => {
      if (seen.has(node)) {
        return;
      }

      seen.add(node);
      node.classList.add("reveal-on-scroll");

      if (variant) {
        node.classList.add(variant);
      }

      node.style.setProperty("--reveal-delay", `${index * step}ms`);
    });
  });
};

const revealImmediately = () => {
  document
    .querySelectorAll(".reveal-on-scroll")
    .forEach((node) => node.classList.add("is-visible"));
};

const initScrollReveal = () => {
  addRevealClasses();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealImmediately();
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealImmediately();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px"
    }
  );

  document
    .querySelectorAll(".reveal-on-scroll")
    .forEach((node) => observer.observe(node));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollReveal, { once: true });
} else {
  initScrollReveal();
}
