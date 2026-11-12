const syncViewportInlineSize = () => {
  document.documentElement.style.setProperty(
    "--viewport-inline-size",
    `${document.documentElement.clientWidth}px`
  );
};

syncViewportInlineSize();
window.addEventListener("resize", syncViewportInlineSize, { passive: true });

const revealGroups = [
  { selector: ".logo-strip", step: 0, variant: "reveal-zoom" },
  { selector: ".products > .card-photos", step: 0, variant: "reveal-zoom" },
  { selector: ".product-row > .card", step: 140, variant: "reveal-zoom" },
  { selector: ".testimonials > h2", step: 0, variant: "reveal-slide-left" },
  { selector: ".testimonial-grid", step: 0, variant: "reveal-zoom" },
  { selector: ".switch > .eyebrow, .switch > h2, .switch > .lede, .switch > .card-actions", step: 90, variant: "reveal-slide-left" },
  { selector: ".switch > .import-panel", step: 220, variant: "reveal-zoom" },
  { selector: ".toys > .toys-heading", step: 0, variant: "reveal-slide-left" },
  { selector: ".toys > .toys-carousel", step: 0, variant: "reveal-zoom" },
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

const QUACK_DUCKY_DELAY = 1780;
const QUACK_BOTTOM_DELAY = 5550;
const QUACK_BOOT_TIMEOUT = 4000;

const decodeRiveBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
};

const initQuackFold = () => {
  const stage = document.querySelector("[data-quack-stage]");
  const shell = stage?.parentElement;

  if (!stage || !shell) {
    return;
  }

  const fit = () => {
    const bounds = shell.getBoundingClientRect();
    const maxScale =
      parseFloat(
        getComputedStyle(stage).getPropertyValue("--quack-max-scale")
      ) || 1.25;

    if (!stage.offsetWidth || !stage.offsetHeight) {
      return;
    }

    const scale = Math.min(
      bounds.width / stage.offsetWidth,
      bounds.height / stage.offsetHeight,
      maxScale
    );

    stage.style.transform = `scale(${scale})`;
  };

  fit();
  window.addEventListener("resize", fit, { passive: true });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const cssAnimations = () => stage.getAnimations({ subtree: true });

  const holdCss = () => {
    cssAnimations().forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });
  };

  const runCss = () => {
    cssAnimations().forEach((animation) => {
      animation.currentTime = 0;
      animation.play();
    });
  };

  let ducky = null;
  let duckyName = "Timeline 1";
  let bottom = null;
  let bottomName = "Timeline 1";
  let duckyTimer = 0;
  let bottomTimer = 0;
  let holdInterval = 0;
  let watchdog = 0;
  let started = false;

  // The canvas carries its own 2x backing store via width/height, so the
  // drawing surface is never resized at runtime — asking Rive to do that here
  // zeroes the surface and faults the wasm heap.
  const createRive = (canvas, source, onReady) => {
    try {
      const instance = new window.rive.Rive({
        ...source,
        canvas,
        autoplay: false,
        fit: window.rive.Fit.contain,
        onLoad: () => {
          onReady(instance.contents?.artboards?.[0]?.animations?.[0] || "Timeline 1");
        },
        onLoadError: () => onReady(null)
      });

      return instance;
    } catch {
      return null;
    }
  };

  const initBottom = () => {
    const canvas = stage.querySelector("[data-quack-bottom]");

    if (!canvas || bottom || !window.rive || !window.__BOTTOM_RIV) {
      return;
    }

    bottom = createRive(
      canvas,
      { buffer: decodeRiveBuffer(window.__BOTTOM_RIV) },
      (name) => {
        bottomName = name || bottomName;
      }
    );
  };

  const startSequence = () => {
    if (started) {
      return;
    }

    started = true;
    window.clearInterval(holdInterval);
    window.clearTimeout(watchdog);
    runCss();

    const playSafely = (instance, name) => {
      try {
        instance.play(name);
      } catch {
        /* a wasm fault in Rive must not take the rest of the fold down */
      }
    };

    if (ducky) {
      ducky.stop();
      duckyTimer = window.setTimeout(() => playSafely(ducky, duckyName), QUACK_DUCKY_DELAY);
    }

    initBottom();

    if (bottom) {
      bottom.stop();
      bottomTimer = window.setTimeout(() => playSafely(bottom, bottomName), QUACK_BOTTOM_DELAY);
    }
  };

  const initDucky = () => {
    const canvas = stage.querySelector("[data-quack-ducky]");

    if (!canvas || !window.rive || !window.__DUCKY_RIV) {
      startSequence();
      return;
    }

    ducky = createRive(
      canvas,
      { buffer: decodeRiveBuffer(window.__DUCKY_RIV) },
      (name) => {
        duckyName = name || duckyName;
        startSequence();
      }
    );

    if (!ducky) {
      startSequence();
    }
  };

  holdCss();

  // The CSS timeline is held at frame zero until Rive is ready, so the duck and
  // the type land together. If Rive never shows up, play the CSS half anyway.
  holdInterval = window.setInterval(() => {
    if (!started) {
      holdCss();
    }
  }, 80);

  let attempts = 0;

  const boot = () => {
    if (window.rive && window.__DUCKY_RIV) {
      // window.rive exists as soon as the shim parses, but the wasm module it
      // decodes files with lands later; building an instance before then fails.
      const ready = window.rive.RuntimeLoader?.awaitInstance;

      if (ready) {
        window.rive.RuntimeLoader.awaitInstance().then(initDucky, startSequence);
      } else {
        initDucky();
      }

      return;
    }

    attempts += 1;

    if (attempts > 40) {
      startSequence();
      return;
    }

    window.setTimeout(boot, 60);
  };

  // The fold sits below the products now, so the sequence must wait until it
  // is actually on screen - otherwise the duck skates past an empty viewport.
  const seen = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) {
      return;
    }

    seen.disconnect();
    boot();

    // Whatever happens to Rive, the type and the tag still have to play.
    if (!started) {
      watchdog = window.setTimeout(startSequence, QUACK_BOOT_TIMEOUT);
    }
  }, { threshold: 0.2 });

  seen.observe(stage);

  window.addEventListener("pagehide", () => {
    seen.disconnect();
    window.clearInterval(holdInterval);
    window.clearTimeout(watchdog);
    window.clearTimeout(duckyTimer);
    window.clearTimeout(bottomTimer);
  });
};

const parallaxGroups = [
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

const initToysCarousel = () => {
  const carousel = document.querySelector("[data-toys-carousel]");

  if (!carousel) {
    return;
  }

  const viewport = carousel.querySelector(".toys-viewport");
  const track = carousel.querySelector(".toys-track");
  const originals = [...carousel.querySelectorAll(".toy-card")];
  const confettiHost = carousel.closest(".toys") || carousel;
  const toysHeading = confettiHost.querySelector("#toys-title");
  const previous = carousel.querySelector("[data-toys-prev]");
  const next = carousel.querySelector("[data-toys-next]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const confettiLayer = document.createElement("div");
  const confettiCooldowns = new WeakMap();
  const confettiColors = ["#06e600", "#156df4", "#b000ff", "#ffd106", "#ff7043", "#5965f2"];
  let cards = [];
  let setWidth = 0;
  let offset = 0;
  let impulse = 0;
  let cruiseSpeed = 25;
  let targetCruiseSpeed = 25;
  let lastTime = performance.now();
  let resizeFrame = 0;
  let animationFrame = 0;
  let isVisible = true;

  confettiLayer.className = "toy-confetti-layer";
  confettiLayer.setAttribute("aria-hidden", "true");
  confettiHost.append(confettiLayer);

  const burstConfetti = (card) => {
    if (reducedMotion.matches) {
      return;
    }

    const now = performance.now();
    const lastBurst = confettiCooldowns.get(card) || 0;

    if (now - lastBurst < 420) {
      return;
    }

    confettiCooldowns.set(card, now);
    const cardBounds = card.getBoundingClientRect();
    const hostBounds = confettiHost.getBoundingClientRect();
    const originX = cardBounds.left - hostBounds.left + cardBounds.width / 2;
    const originY = cardBounds.top - hostBounds.top + cardBounds.height * 0.52;
    const count = 18;

    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.42;
      const force = 52 + Math.random() * 68;
      const dx = Math.cos(angle) * force;
      const dy = Math.sin(angle) * force - 28;
      const duration = 980 + Math.random() * 280;
      const delay = Math.random() * 75;

      particle.className = "toy-confetti";
      particle.style.setProperty("--confetti-origin-x", `${originX.toFixed(2)}px`);
      particle.style.setProperty("--confetti-origin-y", `${originY.toFixed(2)}px`);
      particle.style.setProperty("--confetti-dx", `${dx.toFixed(2)}px`);
      particle.style.setProperty("--confetti-rise-y", `${dy.toFixed(2)}px`);
      particle.style.setProperty("--confetti-fall-y", `${(dy + 74 + Math.random() * 38).toFixed(2)}px`);
      const rotation = Math.round((Math.random() - 0.5) * 720);
      particle.style.setProperty("--confetti-rotation", `${rotation}deg`);
      particle.style.setProperty("--confetti-final-rotation", `${Math.round(rotation * 1.45)}deg`);
      particle.style.setProperty("--confetti-size", `${Math.round(7 + Math.random() * 7)}px`);
      particle.style.setProperty("--confetti-color", confettiColors[index % confettiColors.length]);
      particle.style.setProperty("--confetti-duration", `${duration.toFixed(0)}ms`);
      particle.style.setProperty("--confetti-delay", `${delay.toFixed(0)}ms`);
      confettiLayer.append(particle);

      window.setTimeout(() => particle.remove(), duration + delay + 100);
    }
  };

  const before = document.createDocumentFragment();
  const after = document.createDocumentFragment();

  originals.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    before.append(clone);
  });

  originals.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    after.append(clone);
  });

  track.prepend(before);
  track.append(after);
  cards = [...track.querySelectorAll(".toy-card")];

  if (toysHeading && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    toysHeading.addEventListener("pointerenter", () => burstConfetti(toysHeading));
  }

  const wrapOffset = () => {
    if (!setWidth) {
      return;
    }

    while (offset >= 0) {
      offset -= setWidth;
    }

    while (offset < -setWidth * 2) {
      offset += setWidth;
    }
  };

  const updateFocus = () => {
    const liveSetWidth = cards[originals.length].offsetLeft - cards[0].offsetLeft;

    if (liveSetWidth > 0) {
      setWidth = liveSetWidth;
    }

    const viewportWidth = viewport.clientWidth;
    const center = viewportWidth / 2;
    const plateau = Math.min(215, viewportWidth * 0.2);
    const falloff = Math.max(150, viewportWidth * 0.32);
    const compact = viewportWidth < 620;
    const minimumScale = compact ? 0.84 : 0.86;
    const maximumScale = compact ? 1.08 : 1.14;

    const cardStates = cards.map((card) => {
      const cardCenter = card.offsetLeft + offset + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      const progress = 1 - clamp((distance - plateau) / falloff, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      const scale = minimumScale + (maximumScale - minimumScale) * eased;
      const lift = -10 * eased;
      const rotation = ((cardCenter - center) / Math.max(viewportWidth, 1)) * 1.2;

      return { card, eased, lift, rotation, scale };
    });

    cardStates.forEach(({ card, eased, lift, rotation, scale }) => {
      const spacing = ((scale - 1) * card.offsetWidth) / 2;

      card.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(3)}deg)`;
      card.style.marginInline = `${spacing.toFixed(2)}px`;
      card.style.zIndex = String(Math.round(eased * 10));
    });
  };

  const measure = () => {
    const first = cards[0];
    const repeatedFirst = cards[originals.length];

    setWidth = repeatedFirst.offsetLeft - first.offsetLeft;
    offset = -setWidth;
    impulse = 0;
    track.style.setProperty("--toys-offset", `${offset}px`);
    updateFocus();
  };

  const nudge = (direction) => {
    if (reducedMotion.matches) {
      const step = (cards[0]?.offsetWidth || 220) + 24;
      offset += step * direction;
      wrapOffset();
      track.style.setProperty("--toys-offset", `${offset}px`);
      updateFocus();
      return;
    }

    impulse += direction * 380;
  };

  const animate = (now) => {
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (isVisible && !document.hidden && !reducedMotion.matches) {
      const speedEase = 1 - Math.exp(-7 * delta);
      cruiseSpeed += (targetCruiseSpeed - cruiseSpeed) * speedEase;
      offset += (cruiseSpeed + impulse) * delta;
      impulse *= Math.pow(0.055, delta);
      wrapOffset();
      track.style.setProperty("--toys-offset", `${offset}px`);
      updateFocus();
    }

    animationFrame = window.requestAnimationFrame(animate);
  };

  previous.disabled = false;
  next.disabled = false;
  previous.addEventListener("click", () => nudge(-1));
  next.addEventListener("click", () => nudge(1));

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    carousel.addEventListener("pointerenter", () => {
      targetCruiseSpeed = 0;
    });

    carousel.addEventListener("pointerleave", () => {
      targetCruiseSpeed = 25;
    });
  }

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      previous.click();
    } else if (event.key === "ArrowRight") {
      next.click();
    }
  });

  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(measure);
  }, { passive: true });

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    lastTime = performance.now();
  }, { rootMargin: "20% 0px" });

  observer.observe(carousel);
  measure();
  animationFrame = window.requestAnimationFrame(animate);
};

const initAnimations = () => {
  initScrollReveal();
  initTestimonialBackground();
  initTestimonialHover();
  initMobileTopbarFooterHandoff();
  initSwitchGapStretch();
  initQuackFold();
  initParallax();
  initFooterElastic();
  initToysCarousel();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimations, { once: true });
} else {
  initAnimations();
}
