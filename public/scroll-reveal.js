const syncViewportInlineSize = () => {
  document.documentElement.style.setProperty(
    "--viewport-inline-size",
    `${document.documentElement.clientWidth}px`
  );
};

syncViewportInlineSize();
window.addEventListener("resize", syncViewportInlineSize, { passive: true });

const revealGroups = [
  { selector: ".hero-copy", step: 0, variant: "reveal-slide-left" },
  { selector: ".hero-visual", step: 120, variant: "reveal-zoom" },
  { selector: ".hero-side", step: 220, variant: "reveal-slide-right" },
  { selector: ".logo-strip", step: 0, variant: "reveal-zoom" },
  { selector: ".products > .card-photos", step: 0, variant: "reveal-zoom" },
  { selector: ".product-row > .card", step: 140, variant: "reveal-zoom" },
  { selector: ".testimonials > h2", step: 0, variant: "reveal-slide-left" },
  { selector: ".testimonial-grid", step: 0, variant: "reveal-zoom" },
  { selector: ".switch > .eyebrow, .switch > h2, .switch > .lede, .switch > .card-actions", step: 90, variant: "reveal-slide-left" },
  { selector: ".switch > .import-panel", step: 220, variant: "reveal-zoom" },
  { selector: ".footer > .footer-top", step: 0, variant: "reveal-slide-left" },
  { selector: ".footer > .footer-community", step: 120, variant: "reveal-slide-left" },
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

const initTestimonialBackground = () => {
  const testimonials = document.querySelector(".testimonials");

  if (!testimonials) {
    return;
  }

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    testimonials.classList.add("is-in-view");
    return;
  }

  const backgroundObserver = new IntersectionObserver(
    ([entry]) => {
      testimonials.classList.toggle("is-in-view", entry.isIntersecting);
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  backgroundObserver.observe(testimonials);
};

const initMobileTopbarFooterHandoff = () => {
  const footer = document.querySelector(".footer");

  if (!footer || !("IntersectionObserver" in window)) {
    return;
  }

  const footerObserver = new IntersectionObserver(
    ([entry]) => {
      document.body.classList.toggle("footer-in-view", entry.isIntersecting);
    },
    {
      threshold: 0.08
    }
  );

  footerObserver.observe(footer);
};

const initSwitchGapStretch = () => {
  const switchSection = document.querySelector(".switch");
  const migrationPanel = switchSection?.querySelector(".import-panel");

  if (
    !switchSection ||
    !migrationPanel ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  let frame = 0;
  let lastScrollY = window.scrollY;
  let maxProgress = 0;

  const update = () => {
    frame = 0;

    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY >= lastScrollY;
    lastScrollY = currentScrollY;

    if (!scrollingDown) {
      return;
    }

    const viewportHeight = window.innerHeight;
    const panelBottom = migrationPanel.getBoundingClientRect().bottom;
    const progress = clamp(
      (viewportHeight * 0.9 - panelBottom) / (viewportHeight * 0.4),
      0,
      1
    );

    maxProgress = Math.max(maxProgress, progress);
    const maxStretch = window.innerWidth <= 820 ? 36 : 72;
    switchSection.style.setProperty(
      "--switch-gap-stretch",
      `${(maxProgress * maxStretch).toFixed(2)}px`
    );
  };

  const requestUpdate = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
};

const initPrivacyStory = () => {
  const section = document.querySelector(".privacy-story");
  const sticky = section?.querySelector(".privacy-story-sticky");
  const eyebrow = section?.querySelector(".privacy-story-eyebrow");
  const headline = section?.querySelector(".privacy-story-copy h2");
  const response = section?.querySelector(".privacy-story-copy p");
  const hint = section?.querySelector(".privacy-story-hint");
  const objects = Array.from(section?.querySelectorAll(".feature-object") || []);

  if (!section || !sticky || !headline || !response || !objects.length) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");
  const smoothstep = (start, end, value) => {
    const progress = clamp((value - start) / (end - start), 0, 1);
    return progress * progress * (3 - 2 * progress);
  };
  const directions = [
    { x: -150, y: 70, rotation: -12 },
    { x: 120, y: -90, rotation: 10 },
    { x: 160, y: 64, rotation: 13 },
    { x: -120, y: 110, rotation: -10 }
  ];
  const restingRotations = [-2.8, 2.1, 3.2, -2.4];
  const floatSpeeds = [0.00105, 0.00088, 0.00097, 0.00079];
  const states = objects.map(() => ({
    x: 0,
    y: 0,
    scale: 0.62,
    rotation: 0,
    vx: 0,
    vy: 0,
    vs: 0,
    vr: 0,
    initialized: false
  }));
  let activeFeature = "";
  let storyProgress = 0;
  let frame = 0;
  let lastTime = 0;
  let isNearViewport = false;

  const setActiveFeature = (feature = "") => {
    activeFeature = activeFeature === feature ? "" : feature;
    section.dataset.active = activeFeature;

    objects.forEach((object) => {
      const isActive = object.dataset.feature === activeFeature;
      object.classList.toggle("is-active", isActive);
      object.querySelector(".feature-bubble")?.setAttribute("aria-expanded", String(isActive));
      object.querySelector(".feature-card")?.setAttribute("aria-hidden", String(!isActive));
    });

    requestTick();
  };

  objects.forEach((object) => {
    const feature = object.dataset.feature;
    const bubble = object.querySelector(".feature-bubble");
    const close = object.querySelector(".feature-card-close");

    object.addEventListener("pointerenter", () => {
      if (
        hoverCapable.matches &&
        (reduceMotion.matches || storyProgress > 0.62) &&
        activeFeature !== feature
      ) {
        setActiveFeature(feature);
      }
    });

    object.addEventListener("pointerleave", (event) => {
      if (
        hoverCapable.matches &&
        activeFeature === feature &&
        !object.contains(event.relatedTarget)
      ) {
        setActiveFeature("");
      }
    });

    bubble?.addEventListener("click", (event) => {
      if (!hoverCapable.matches || event.detail === 0) {
        setActiveFeature(feature);
      }
    });

    object.addEventListener("focusin", () => {
      if ((reduceMotion.matches || storyProgress > 0.62) && activeFeature !== feature) {
        setActiveFeature(feature);
      }
    });

    object.addEventListener("focusout", (event) => {
      if (activeFeature === feature && !object.contains(event.relatedTarget)) {
        setActiveFeature("");
      }
    });

    close?.addEventListener("click", (event) => {
      event.stopPropagation();
      setActiveFeature("");
      bubble?.focus({ preventScroll: true });
    });
  });

  section.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeFeature) {
      const activeObject = objects.find(({ dataset }) => dataset.feature === activeFeature);
      setActiveFeature("");
      activeObject?.querySelector(".feature-bubble")?.focus({ preventScroll: true });
    }
  });

  if (reduceMotion.matches) {
    section.classList.add("is-reduced-motion");
    return;
  }

  const getScrollProgress = () => {
    const bounds = section.getBoundingClientRect();
    const distance = Math.max(section.offsetHeight - window.innerHeight, 1);
    return clamp(-bounds.top / distance, 0, 1);
  };

  const resolveCollisions = (targets, activeIndex, width, height) => {
    const movable = targets.filter((_, index) => index !== activeIndex);

    for (let pass = 0; pass < 4; pass += 1) {
      for (let first = 0; first < movable.length; first += 1) {
        for (let second = first + 1; second < movable.length; second += 1) {
          const a = movable[first];
          const b = movable[second];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const overlapX = 205 - Math.abs(dx);
          const overlapY = 104 - Math.abs(dy);

          if (overlapX <= 0 || overlapY <= 0) {
            continue;
          }

          if (overlapX < overlapY) {
            const push = overlapX / 2 + 8;
            const direction = Math.sign(dx) || 1;
            a.x -= push * direction;
            b.x += push * direction;
          } else {
            const push = overlapY / 2 + 6;
            const direction = Math.sign(dy) || 1;
            a.y -= push * direction;
            b.y += push * direction;
          }

          a.x = clamp(a.x, 128, width - 128);
          b.x = clamp(b.x, 128, width - 128);
          a.y = clamp(a.y, height * 0.37, height - 82);
          b.y = clamp(b.y, height * 0.37, height - 82);
        }
      }
    }
  };

  const getBubbleTargets = (width, height, time, entries, isMobile, verticalOffset) => {
    const basePositions = isMobile
      ? [
          [0.31, 0.5],
          [0.69, 0.5],
          [0.31, 0.67],
          [0.69, 0.67]
        ]
      : [
          [0.32, 0.52],
          [0.57, 0.46],
          [0.68, 0.62],
          [0.47, 0.69]
        ];
    const targets = basePositions.map(([x, y], index) => ({
      x: width * x + directions[index].x * (1 - entries[index]) * (isMobile ? 0.55 : 1),
      y:
        height * y +
        directions[index].y * (1 - entries[index]) * (isMobile ? 0.55 : 1) +
        verticalOffset,
      scale: 0.62 + entries[index] * 0.38,
      rotation:
        directions[index].rotation * (1 - entries[index]) +
        restingRotations[index] * entries[index],
      opacity: entries[index]
    }));
    const activeIndex = objects.findIndex(({ dataset }) => dataset.feature === activeFeature);

    if (activeIndex >= 0) {
      if (isMobile) {
        const openSlots = [0.24, 0.5, 0.76];
        let slotIndex = 0;

        targets.forEach((target, index) => {
          if (index === activeIndex) {
            target.x = width * 0.5;
            target.y = height * 0.67 + verticalOffset;
            target.scale = 1;
            target.rotation = 0;
            target.opacity = 1;
            return;
          }

          target.x = width * openSlots[slotIndex];
          target.y = height * 0.39 + verticalOffset;
          target.scale = 0.62;
          target.rotation = restingRotations[index] * 1.35;
          target.opacity *= 0.38;
          slotIndex += 1;
        });
      } else {
        const cardWidth = Math.min(470, window.innerWidth * 0.4);
        const cardHeight = 300;
        const activeTarget = targets[activeIndex];
        activeTarget.x = clamp(activeTarget.x, cardWidth / 2 + 34, width - cardWidth / 2 - 34);
        activeTarget.y = clamp(activeTarget.y, height * 0.56, height - cardHeight / 2 - 40);
        activeTarget.scale = 1;
        activeTarget.rotation = 0;

        targets.forEach((target, index) => {
          if (index === activeIndex) {
            return;
          }

          const dx = target.x - activeTarget.x;
          const dy = target.y - activeTarget.y;
          const overlapX = cardWidth / 2 + 145 - Math.abs(dx);
          const overlapY = cardHeight / 2 + 82 - Math.abs(dy);

          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              target.x += (Math.sign(dx) || (index % 2 ? 1 : -1)) * (overlapX + 30);
            } else {
              target.y += (Math.sign(dy) || (index % 2 ? 1 : -1)) * (overlapY + 26);
            }
          }

          target.x = clamp(target.x, 128, width - 128);
          target.y = clamp(target.y, height * 0.37, height - 82);
          target.scale = 0.86;
          target.rotation = restingRotations[index] * 1.35;
        });

        resolveCollisions(targets, activeIndex, width, height);
      }
    } else if (entries.every((entry) => entry > 0.985)) {
      targets.forEach((target, index) => {
        const phase = time * floatSpeeds[index] + index * 1.7;
        target.x += Math.sin(phase) * (isMobile ? 4 : 7.5);
        target.y += Math.cos(phase * 1.14) * (isMobile ? 6.5 : 10.5);
        target.rotation += Math.sin(phase * 0.82) * (isMobile ? 0.4 : 0.85);
      });
    }

    return targets;
  };

  const springValue = (state, valueKey, velocityKey, target, delta, stiffness, damping) => {
    state[velocityKey] += (target - state[valueKey]) * stiffness * delta;
    state[velocityKey] *= Math.pow(damping, delta);
    state[valueKey] += state[velocityKey] * delta;
  };

  const render = (time = performance.now()) => {
    frame = 0;
    const delta = lastTime ? clamp((time - lastTime) / 16.667, 0.5, 2.2) : 1;
    lastTime = time;
    storyProgress = getScrollProgress();
    const isMobile = window.innerWidth <= 820;
    const width = sticky.clientWidth;
    const height = sticky.clientHeight;
    const headlineMove = smoothstep(0.17, 0.43, storyProgress);
    const responseReveal = smoothstep(0.29, 0.48, storyProgress);
    const endStateDrop = smoothstep(0.68, 0.9, storyProgress);
    const endStateDropPercent = endStateDrop * (isMobile ? 5.5 : 8);
    const endStateDropPixels = height * (endStateDropPercent / 100);
    const initialHeadlineLeft = isMobile ? 6 : 15;
    const initialHeadlineTop = isMobile ? 30 : 36;
    const finalHeadlineLeft = isMobile ? 6 : 7.5;
    const finalHeadlineTop = isMobile ? 12.5 : 12.5;
    const finalHeadlineScale = isMobile ? 0.5 : 0.56;
    const headlineLeft = initialHeadlineLeft + (finalHeadlineLeft - initialHeadlineLeft) * headlineMove;
    const headlineTop = initialHeadlineTop + (finalHeadlineTop - initialHeadlineTop) * headlineMove;
    const headlineScale = 1 + (finalHeadlineScale - 1) * headlineMove;

    headline.style.left = `${headlineLeft}%`;
    headline.style.top = `${headlineTop + endStateDropPercent}%`;
    headline.style.textAlign = "left";
    headline.style.transform = `scale(${headlineScale})`;
    if (eyebrow) {
      const initialEyebrowTop = isMobile ? 22 : 28;
      const finalEyebrowTop = isMobile ? 7.5 : 7.5;
      const eyebrowLeft = initialHeadlineLeft + (finalHeadlineLeft - initialHeadlineLeft) * headlineMove;
      const eyebrowTop = initialEyebrowTop + (finalEyebrowTop - initialEyebrowTop) * headlineMove;
      eyebrow.style.left = `${eyebrowLeft}%`;
      eyebrow.style.top = `${eyebrowTop + endStateDropPercent}%`;
      eyebrow.style.transform = `scale(${1 - headlineMove * 0.16})`;
      eyebrow.style.transformOrigin = "left top";
    }
    response.style.left = `${finalHeadlineLeft}%`;
    response.style.top = `${(isMobile ? 32 : 29) + endStateDropPercent}%`;
    response.style.opacity = responseReveal.toFixed(3);
    response.style.transform = `translate3d(0, ${(1 - responseReveal) * 34}px, 0) rotate(${(1 - responseReveal) * 2}deg)`;

    if (hint) {
      hint.style.opacity = clamp(1 - storyProgress * 7, 0, 1).toFixed(3);
    }

    const entries = objects.map((_, index) =>
      smoothstep(0.5 + index * 0.052, 0.7 + index * 0.052, storyProgress)
    );

    if (storyProgress < 0.48 && activeFeature) {
      setActiveFeature("");
    }

    const targets = getBubbleTargets(
      width,
      height,
      time,
      entries,
      isMobile,
      endStateDropPixels
    );

    states.forEach((state, index) => {
      const target = targets[index];

      if (!state.initialized) {
        state.x = target.x;
        state.y = target.y;
        state.scale = target.scale;
        state.rotation = target.rotation;
        state.initialized = true;
      }

      springValue(state, "x", "vx", target.x, delta, 0.085, 0.72);
      springValue(state, "y", "vy", target.y, delta, 0.085, 0.72);
      springValue(state, "scale", "vs", target.scale, delta, 0.11, 0.7);
      springValue(state, "rotation", "vr", target.rotation, delta, 0.1, 0.7);

      objects[index].style.opacity = target.opacity.toFixed(3);
      objects[index].style.pointerEvents = target.opacity > 0.82 ? "auto" : "none";
      objects[index].style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotation.toFixed(3)}deg) scale(${state.scale.toFixed(4)})`;
    });

    section.dataset.stage = storyProgress < 0.28 ? "intro" : storyProgress < 0.52 ? "response" : "features";

    if (isNearViewport && !frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  function requestTick() {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  }

  const proximityObserver = new IntersectionObserver(
    ([entry]) => {
      isNearViewport = entry.isIntersecting;
      if (isNearViewport) {
        lastTime = 0;
        requestTick();
      }
    },
    { rootMargin: "80% 0px 80% 0px" }
  );

  proximityObserver.observe(section);
  requestTick();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });
};

const parallaxGroups = [
  { selector: ".hero-copy", speed: -0.045, max: 30 },
  { selector: ".hero-illustration", speed: 0.075, max: 48 },
  { selector: ".hero-side", speed: -0.03, max: 22 },
  { selector: ".product-card-logo", speed: -0.02, max: 14 },
  { selector: ".product-card-copy", speed: -0.035, max: 20 },
  { selector: ".testimonials > h2", speed: -0.035, max: 24 },
  { selector: ".testimonial-grid", speed: 0.03, max: 22 },
  { selector: ".import-panel", speed: 0.04, max: 26 },
  { selector: ".footer-top", speed: -0.025, max: 20 },
  { selector: ".footer-community", speed: -0.045, max: 32 },
  { selector: ".footer-crowd-art", speed: 0.055, max: 38 }
];

const parallaxBackgrounds = [
  { selector: ".testimonials", speed: 0.025, max: 24 },
  { selector: ".footer", speed: 0.02, max: 30 }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const initParallax = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const layers = parallaxGroups.flatMap(({ selector, speed, max }) =>
    Array.from(document.querySelectorAll(selector), (node) => ({
      node,
      speed,
      max,
      current: 0
    }))
  );
  const backgrounds = parallaxBackgrounds.flatMap(({ selector, speed, max }) =>
    Array.from(document.querySelectorAll(selector), (node) => ({ node, speed, max }))
  );

  if (!layers.length && !backgrounds.length) {
    return;
  }

  layers.forEach(({ node }) => node.classList.add("parallax-layer"));

  let frame = 0;

  const getOffset = (node, speed, max, viewportHeight, strength, current = 0) => {
    const bounds = node.getBoundingClientRect();
    const centerDelta = viewportHeight / 2 - (bounds.top + bounds.height / 2 - current);
    return clamp(centerDelta * speed * strength, -max * strength, max * strength);
  };

  const update = () => {
    frame = 0;

    const viewportHeight = window.innerHeight;
    const strength = window.innerWidth <= 820 ? 0.55 : 1;

    layers.forEach((layer) => {
      const { node, speed, max, current } = layer;
      const offset = getOffset(node, speed, max, viewportHeight, strength, current);
      layer.current = offset;
      node.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });

    backgrounds.forEach(({ node, speed, max }) => {
      const offset = getOffset(node, speed, max, viewportHeight, strength);
      node.style.setProperty("--parallax-bg-y", `${offset.toFixed(2)}px`);
    });
  };

  const requestUpdate = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
};

const initAnimations = () => {
  initScrollReveal();
  initTestimonialBackground();
  initMobileTopbarFooterHandoff();
  initSwitchGapStretch();
  initPrivacyStory();
  initParallax();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimations, { once: true });
} else {
  initAnimations();
}
