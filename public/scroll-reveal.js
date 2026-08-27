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

const initTestimonialHover = () => {
  const testimonials = document.querySelector(".testimonials");
  const track = testimonials?.querySelector(".testimonial-track");
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!testimonials || !track || !hoverCapable.matches || reduceMotion.matches) {
    return;
  }

  const cursorPop = document.createElement("img");
  cursorPop.className = "testimonial-cursor-pop";
  cursorPop.src = "./assets/trusted-by-pop.svg";
  cursorPop.alt = "";
  cursorPop.setAttribute("aria-hidden", "true");
  testimonials.append(cursorPop);

  let marqueeAnimation = null;
  let targetRate = 1;
  let currentRate = 1;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerActive = false;
  let frame = 0;
  let lastTime = 0;

  const getMarqueeAnimation = () => {
    if (!marqueeAnimation) {
      marqueeAnimation = track
        .getAnimations()
        .find((animation) => animation.animationName === "testimonial-scroll-right");
    }

    return marqueeAnimation;
  };

  const isPointerInside = () => {
    const bounds = testimonials.getBoundingClientRect();

    return (
      pointerX >= bounds.left &&
      pointerX <= bounds.right &&
      pointerY >= bounds.top &&
      pointerY <= bounds.bottom
    );
  };

  const positionCursor = (clientX, clientY, immediate = false) => {
    const bounds = testimonials.getBoundingClientRect();
    const width = cursorPop.offsetWidth || 190;
    const height = cursorPop.offsetHeight || 50;
    targetX = clamp(clientX - bounds.left + 20, 10, testimonials.clientWidth - width - 10);
    targetY = clamp(clientY - bounds.top + 20, 10, testimonials.clientHeight - height - 10);

    if (immediate) {
      currentX = targetX;
      currentY = targetY;
    }
  };

  const renderHover = (time = performance.now()) => {
    frame = 0;
    const delta = lastTime ? clamp(time - lastTime, 8, 34) : 16.667;
    lastTime = time;
    const rateDuration = targetRate === 0 ? 360 : 480;
    const rateEase = 1 - Math.exp(-delta / rateDuration);
    const cursorEase = 1 - Math.exp(-delta / 72);

    currentRate += (targetRate - currentRate) * rateEase;
    currentX += (targetX - currentX) * cursorEase;
    currentY += (targetY - currentY) * cursorEase;

    if (Math.abs(targetRate - currentRate) < 0.004) {
      currentRate = targetRate;
    }

    getMarqueeAnimation()?.updatePlaybackRate(currentRate);
    cursorPop.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(
      2
    )}px, 0) rotate(-3deg)`;

    if (pointerActive || Math.abs(targetRate - currentRate) >= 0.004) {
      frame = window.requestAnimationFrame(renderHover);
    }
  };

  const requestHoverFrame = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(renderHover);
    }
  };

  const hideCursor = () => {
    if (!pointerActive && !cursorPop.classList.contains("is-active")) {
      return;
    }

    pointerActive = false;
    targetRate = 1;
    cursorPop.classList.remove("is-active");
    requestHoverFrame();
  };

  testimonials.addEventListener("pointerenter", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerActive = true;
    targetRate = 0;
    positionCursor(pointerX, pointerY, true);
    cursorPop.classList.add("is-active");
    requestHoverFrame();
  });

  testimonials.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    positionCursor(pointerX, pointerY);
    requestHoverFrame();
  });

  testimonials.addEventListener("pointerleave", hideCursor);

  window.addEventListener(
    "scroll",
    () => {
      if (!pointerActive) {
        return;
      }

      if (!isPointerInside()) {
        hideCursor();
        return;
      }

      positionCursor(pointerX, pointerY);
      requestHoverFrame();
    },
    { passive: true }
  );
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
  const stones = Array.from(section?.querySelectorAll(".privacy-stones span") || []);

  if (!section || !sticky || !headline || !response || !objects.length) {
    return;
  }

  const headlineLines = Array.from(headline.children);

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
  const stonePositions = [
    [0.18, 0.5],
    [0.43, 0.43],
    [0.79, 0.46],
    [0.84, 0.64],
    [0.72, 0.77],
    [0.56, 0.8],
    [0.34, 0.76],
    [0.2, 0.68],
    [0.53, 0.57],
    [0.88, 0.55]
  ];
  const stoneStates = stones.map(() => ({
    x: 0,
    y: 0,
    scale: 0.5,
    rotation: 0,
    vx: 0,
    vy: 0,
    vs: 0,
    vr: 0,
    initialized: false
  }));
  const pointer = { x: 0, y: 0, active: false };
  let activeFeature = "";
  let activeOpenedAt = 0;
  let hoverCloseTimer = 0;
  let storyProgress = 0;
  let frame = 0;
  let lastTime = 0;
  let isNearViewport = false;

  const clearHoverClose = () => {
    if (hoverCloseTimer) {
      window.clearTimeout(hoverCloseTimer);
      hoverCloseTimer = 0;
    }
  };

  const setActiveFeature = (feature = "") => {
    clearHoverClose();
    activeFeature = activeFeature === feature ? "" : feature;
    activeOpenedAt = activeFeature ? performance.now() : 0;
    section.dataset.active = activeFeature;

    objects.forEach((object) => {
      const isActive = object.dataset.feature === activeFeature;
      object.classList.toggle("is-active", isActive);
      object.querySelector(".feature-bubble")?.setAttribute("aria-expanded", String(isActive));
      object.querySelector(".feature-card")?.setAttribute("aria-hidden", String(!isActive));
    });

    requestTick();
  };

  const scheduleHoverClose = (delay = 160) => {
    clearHoverClose();
    const featureAtSchedule = activeFeature;

    if (!featureAtSchedule) {
      return;
    }

    hoverCloseTimer = window.setTimeout(() => {
      hoverCloseTimer = 0;
      if (activeFeature === featureAtSchedule) {
        setActiveFeature("");
      }
    }, delay);
  };

  objects.forEach((object) => {
    const feature = object.dataset.feature;
    const bubble = object.querySelector(".feature-bubble");
    const close = object.querySelector(".feature-card-close");

    object.addEventListener("pointerenter", () => {
      clearHoverClose();
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
        if (performance.now() - activeOpenedAt > 440) {
          scheduleHoverClose(170);
        }
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

  sticky.addEventListener("pointermove", (event) => {
    if (!hoverCapable.matches) {
      return;
    }

    const bounds = sticky.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;

    if (activeFeature && performance.now() - activeOpenedAt > 440) {
      const activeObject = objects.find(({ dataset }) => dataset.feature === activeFeature);
      const activeSurfaces = [
        activeObject?.querySelector(".feature-bubble"),
        activeObject?.querySelector(".feature-card")
      ].filter(Boolean);
      const isInsideActiveSurface = activeSurfaces.some((surface) => {
        const surfaceBounds = surface.getBoundingClientRect();
        const margin = 14;
        return (
          event.clientX >= surfaceBounds.left - margin &&
          event.clientX <= surfaceBounds.right + margin &&
          event.clientY >= surfaceBounds.top - margin &&
          event.clientY <= surfaceBounds.bottom + margin
        );
      });

      if (isInsideActiveSurface) {
        clearHoverClose();
      } else {
        scheduleHoverClose(190);
      }
    }

    requestTick();
  });

  sticky.addEventListener("pointerleave", () => {
    pointer.active = false;
    if (hoverCapable.matches && activeFeature) {
      scheduleHoverClose(130);
    }
    requestTick();
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

  const getIntroProgress = () => {
    const bounds = section.getBoundingClientRect();
    const viewportHeight = Math.max(window.innerHeight, 1);
    return clamp((viewportHeight * 0.8 - bounds.top) / (viewportHeight * 0.58), 0, 1);
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
    // The section releases shortly after the final bubble settles, while this
    // scale preserves the established physical timing of the internal stages.
    storyProgress = clamp(getScrollProgress() / 1.16, 0, 1);
    const introProgress = getIntroProgress();
    const isMobile = window.innerWidth <= 820;
    const width = sticky.clientWidth;
    const height = sticky.clientHeight;
    const introReveal = smoothstep(0, 1, introProgress);
    const headlineMove = smoothstep(0.17, 0.43, storyProgress);
    const responseReveal = smoothstep(0.29, 0.48, storyProgress);
    const endStateDropPercent = isMobile ? 5.5 : 8;
    const endStateDropPixels = height * (endStateDropPercent / 100);
    const initialHeadlineLeft = isMobile ? 6 : 15;
    const initialHeadlineTop = 22;
    const finalHeadlineLeft = isMobile ? 6 : 7.5;
    const finalHeadlineTop = 12.5 + endStateDropPercent;
    const finalHeadlineScale = isMobile ? 0.5 : 0.56;
    const headlineLeft = initialHeadlineLeft + (finalHeadlineLeft - initialHeadlineLeft) * headlineMove;
    const headlineTop = initialHeadlineTop + (finalHeadlineTop - initialHeadlineTop) * headlineMove;
    const headlineScale = 1 + (finalHeadlineScale - 1) * headlineMove;
    const introScale = 0.97 + introReveal * 0.03;
    const introOffset = (1 - introReveal) * 18;

    headline.style.left = `${headlineLeft}%`;
    headline.style.top = `${headlineTop}%`;
    headline.style.opacity = "1";
    headline.style.textAlign = "left";
    headline.style.transform = `translate3d(0, ${introOffset.toFixed(2)}px, 0) scale(${(
      headlineScale * introScale
    ).toFixed(4)})`;
    headlineLines.forEach((line, index) => {
      const lineReveal =
        index === 0
          ? smoothstep(0, 0.44, introProgress)
          : smoothstep(0.52, 1, introProgress);
      line.style.opacity = lineReveal > 0.01 ? "1" : "0";
      line.style.clipPath = `inset(0 ${((1 - lineReveal) * 100).toFixed(2)}% 0 0)`;
    });
    if (eyebrow) {
      const initialEyebrowTop = 14;
      const finalEyebrowTop = 7.5 + endStateDropPercent;
      const eyebrowLeft = initialHeadlineLeft + (finalHeadlineLeft - initialHeadlineLeft) * headlineMove;
      const eyebrowTop = initialEyebrowTop + (finalEyebrowTop - initialEyebrowTop) * headlineMove;
      eyebrow.style.left = `${eyebrowLeft}%`;
      eyebrow.style.top = `${eyebrowTop}%`;
      eyebrow.style.opacity = "1";
      eyebrow.style.transform = `translate3d(0, ${(
        introOffset * 0.55
      ).toFixed(2)}px, 0) scale(${(
        (1.28 - introReveal * 0.28) * (1 - headlineMove * 0.16)
      ).toFixed(4)})`;
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

      springValue(state, "x", "vx", target.x, delta, 0.06, 0.76);
      springValue(state, "y", "vy", target.y, delta, 0.06, 0.76);
      springValue(state, "scale", "vs", target.scale, delta, 0.075, 0.74);
      springValue(state, "rotation", "vr", target.rotation, delta, 0.065, 0.74);

      objects[index].style.opacity = target.opacity.toFixed(3);
      objects[index].style.pointerEvents = target.opacity > 0.82 ? "auto" : "none";
      objects[index].style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotation.toFixed(3)}deg) scale(${state.scale.toFixed(4)})`;
    });

    stones.forEach((stone, index) => {
      const reveal = smoothstep(
        0.54 + index * 0.012,
        0.69 + index * 0.012,
        storyProgress
      );
      const [baseX, baseY] = stonePositions[index] || [0.5, 0.7];
      const phase = time * (0.00072 + index * 0.000045) + index * 1.31;
      let targetX = width * baseX + Math.sin(phase) * (isMobile ? 5 : 12);
      let targetY =
        height * baseY +
        endStateDropPixels +
        Math.cos(phase * 1.17) * (isMobile ? 7 : 15);
      let targetRotation = Math.sin(phase * 0.83) * (isMobile ? 3 : 6) + index * 7;

      if (pointer.active && reveal > 0.8) {
        const dx = targetX - pointer.x;
        const dy = targetY - pointer.y;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const radius = isMobile ? 105 : 175;

        if (distance < radius) {
          const force = Math.pow(1 - distance / radius, 2);
          const push = force * (isMobile ? 34 : 78);
          targetX += (dx / distance) * push;
          targetY += (dy / distance) * push;
          targetRotation += (dx / distance) * force * 18;
        }
      }

      targetX = clamp(targetX, 24, width - 24);
      targetY = clamp(targetY, height * 0.39, height - 34);
      const targetScale = 0.62 + reveal * (isMobile ? 0.2 : 0.38);
      const state = stoneStates[index];

      if (!state.initialized) {
        state.x = targetX;
        state.y = targetY;
        state.scale = targetScale;
        state.rotation = targetRotation;
        state.initialized = true;
      }

      springValue(state, "x", "vx", targetX, delta, 0.072, 0.76);
      springValue(state, "y", "vy", targetY, delta, 0.072, 0.76);
      springValue(state, "scale", "vs", targetScale, delta, 0.1, 0.72);
      springValue(state, "rotation", "vr", targetRotation, delta, 0.075, 0.75);

      stone.style.opacity = (reveal * (activeFeature ? 0.48 : 0.92)).toFixed(3);
      stone.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${state.rotation.toFixed(3)}deg) scale(${state.scale.toFixed(4)})`;
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

const initFooterElastic = () => {
  const art = document.querySelector(".footer-crowd-art");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (!art || reduceMotion.matches || !hoverCapable.matches) {
    return;
  }

  const state = {
    scaleX: 1,
    scaleY: 1,
    shiftY: 0,
    rotation: 0,
    scaleXVelocity: 0,
    scaleYVelocity: 0,
    shiftYVelocity: 0,
    rotationVelocity: 0
  };
  let hovered = false;
  let pointerX = 0;
  let pointerVelocityX = 0;
  let pointerVelocityY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = 0;
  let lastFrameTime = 0;
  let frame = 0;

  const spring = (valueKey, velocityKey, target, delta) => {
    state[velocityKey] += (target - state[valueKey]) * 0.105 * delta;
    state[velocityKey] *= Math.pow(0.79, delta);
    state[valueKey] += state[velocityKey] * delta;
  };

  const render = (time) => {
    const delta = lastFrameTime ? clamp((time - lastFrameTime) / 16.667, 0.5, 2) : 1;
    lastFrameTime = time;
    pointerVelocityX *= Math.pow(0.8, delta);
    pointerVelocityY *= Math.pow(0.8, delta);

    const verticalMotion = clamp(pointerVelocityY / 1.35, -1, 1);
    const horizontalMotion = clamp(pointerVelocityX / 1.35, -1, 1);
    const downwardAmount = Math.max(verticalMotion, 0);
    const upwardAmount = Math.min(verticalMotion, 0);
    const targetScaleY = hovered
      ? 1.055 + downwardAmount * 0.065 + upwardAmount * 0.04
      : 1;
    const targetScaleX = hovered
      ? 0.97 - downwardAmount * 0.03 - upwardAmount * 0.02
      : 1;
    const targetShiftY = hovered ? -4 + verticalMotion * 7 : 0;
    const targetRotation = hovered ? pointerX * 0.72 + horizontalMotion * 0.42 : 0;

    spring("scaleY", "scaleYVelocity", targetScaleY, delta);
    spring("scaleX", "scaleXVelocity", targetScaleX, delta);
    spring("shiftY", "shiftYVelocity", targetShiftY, delta);
    spring("rotation", "rotationVelocity", targetRotation, delta);

    art.style.setProperty("--footer-elastic-scale-x", state.scaleX.toFixed(4));
    art.style.setProperty("--footer-elastic-scale-y", state.scaleY.toFixed(4));
    art.style.setProperty("--footer-elastic-shift", `${state.shiftY.toFixed(2)}px`);
    art.style.setProperty("--footer-elastic-rotation", `${state.rotation.toFixed(3)}deg`);

    const isSettled =
      Math.abs(pointerVelocityX) < 0.002 &&
      Math.abs(pointerVelocityY) < 0.002 &&
      Math.abs(state.scaleX - targetScaleX) < 0.0004 &&
      Math.abs(state.scaleY - targetScaleY) < 0.0004 &&
      Math.abs(state.shiftY - targetShiftY) < 0.04 &&
      Math.abs(state.rotation - targetRotation) < 0.004;

    if (isSettled) {
      frame = 0;
      lastFrameTime = 0;
      art.style.setProperty("--footer-elastic-scale-x", targetScaleX.toFixed(4));
      art.style.setProperty("--footer-elastic-scale-y", targetScaleY.toFixed(4));
      art.style.setProperty("--footer-elastic-shift", `${targetShiftY.toFixed(2)}px`);
      art.style.setProperty("--footer-elastic-rotation", `${targetRotation.toFixed(3)}deg`);
      return;
    }

    frame = window.requestAnimationFrame(render);
  };

  const requestTick = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(render);
    }
  };

  const updatePointerPosition = (event) => {
    const bounds = art.getBoundingClientRect();
    pointerX = clamp(((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1, -1, 1);
  };

  art.addEventListener("pointerenter", (event) => {
    hovered = true;
    updatePointerPosition(event);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = performance.now();
    state.scaleYVelocity += 0.018;
    state.scaleXVelocity -= 0.009;
    requestTick();
  });

  art.addEventListener("pointermove", (event) => {
    const now = performance.now();
    const elapsed = Math.max(now - lastPointerTime, 8);
    pointerVelocityX = clamp((event.clientX - lastPointerX) / elapsed, -2.4, 2.4);
    pointerVelocityY = clamp((event.clientY - lastPointerY) / elapsed, -2.4, 2.4);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = now;
    updatePointerPosition(event);
    requestTick();
  });

  art.addEventListener("pointerleave", () => {
    hovered = false;
    pointerX = 0;
    state.scaleYVelocity -= 0.012;
    state.scaleXVelocity += 0.006;
    requestTick();
  });
};

const initAnimations = () => {
  initScrollReveal();
  initTestimonialBackground();
  initTestimonialHover();
  initMobileTopbarFooterHandoff();
  initSwitchGapStretch();
  initPrivacyStory();
  initParallax();
  initFooterElastic();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimations, { once: true });
} else {
  initAnimations();
}
