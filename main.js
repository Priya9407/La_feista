/* ==================================================================
   LA FESTA — MAIN.JS
   Vanilla JS + GSAP. No frameworks, no build step.
   Sections: Preloader, Hero backdrop, Nav, Mobile menu, Scroll reveals,
   Counters, Menu tabs, Gallery filter + lightbox, Floating UI, Misc.
================================================================== */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion)
    document.documentElement.classList.add("reduce-motion");

  /* GSAP plugin registration (GSAP + ScrollTrigger loaded via CDN in index.html) */
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ----------------------------------------------------------------
     1. PRELOADER
     Simple progress-bar animation, then fades the overlay out once
     the page (and webfonts/images) are ready.
  ---------------------------------------------------------------- */
  function initPreloader() {
    const preloader = document.getElementById("preloader");
    const bar = preloader
      ? preloader.querySelector(".preloader__bar span")
      : null;
    if (!preloader) return;

    let progress = 0;
    const tick = setInterval(() => {
      progress += Math.random() * 18;
      if (progress >= 100) progress = 100;
      if (bar) bar.style.width = progress + "%";
      if (progress >= 100) clearInterval(tick);
    }, 140);

    const finish = () => {
      clearInterval(tick);
      if (bar) bar.style.width = "100%";
      setTimeout(() => {
        preloader.classList.add("is-hidden");
        document.body.style.overflow = "";
        playHeroIntro();
      }, 350);
    };

    document.body.style.overflow = "hidden";
    if (document.readyState === "complete") {
      setTimeout(finish, 600);
    } else {
      window.addEventListener("load", () => setTimeout(finish, 400));
      // Safety net so the preloader never blocks the site indefinitely
      setTimeout(finish, 3000);
    }
  }

  /* ----------------------------------------------------------------
     2. HERO — intro text reveal + cinematic backdrop crossfade
     A looping image sequence stands in for a hosted video file.
     To use a real video instead, replace #heroBackdrop's contents
     with: <video autoplay muted loop playsinline><source src="your-video.mp4" type="video/mp4"></video>
  ---------------------------------------------------------------- */
  function playHeroIntro() {
    if (!hasGSAP) return;
    const lines = document.querySelectorAll(".hero__line");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".hero__eyebrow", { y: 16, opacity: 0, duration: 0.7 })
      .from(
        lines,
        { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.12 },
        "-=0.3",
      )
      .from(".hero__sub", { y: 16, opacity: 0, duration: 0.7 }, "-=0.4")
      .from(".hero__ctas", { y: 16, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(
        ".rating-seal",
        {
          scale: 0.6,
          opacity: 0,
          rotate: -30,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        "-=0.5",
      )
      .from(".hero__scroll", { opacity: 0, duration: 0.6 }, "-=0.3");
  }

  function initHeroBackdrop() {
    const slides = document.querySelectorAll(".hero__slide");
    if (!slides.length) return;
    let index = 0;
    if (prefersReducedMotion) return; // keep first frame static, no motion
    setInterval(() => {
      slides[index].classList.remove("hero__slide--active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("hero__slide--active");
    }, 5500);
  }

  /* ----------------------------------------------------------------
     3. STICKY NAVBAR + smooth-scroll offset
  ---------------------------------------------------------------- */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const setState = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    setState();
    window.addEventListener("scroll", setState, { passive: true });

    // Close mobile menu when a link is tapped
    document
      .querySelectorAll(".mobile-menu__link, .mobile-menu__cta")
      .forEach((link) => {
        link.addEventListener("click", () => closeMobileMenu());
      });
  }

  function openMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    const burger = document.getElementById("burgerBtn");
    if (!menu || !burger) return;
    menu.classList.add("is-open");
    burger.classList.add("is-active");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";

    // Add click-outside-to-close listener
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 10);

    // Add escape key listener
    document.addEventListener("keydown", handleEscapeKey);
  }

  function closeMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    const burger = document.getElementById("burgerBtn");
    if (!menu || !burger) return;
    menu.classList.remove("is-open");
    burger.classList.remove("is-active");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("click", handleOutsideClick);
    document.removeEventListener("keydown", handleEscapeKey);
  }

  function handleOutsideClick(e) {
    const menu = document.getElementById("mobileMenu");
    const burger = document.getElementById("burgerBtn");
    if (!menu || !burger) return;
    if (!menu.contains(e.target) && !burger.contains(e.target)) {
      closeMobileMenu();
    }
  }

  function handleEscapeKey(e) {
    if (e.key === "Escape") {
      closeMobileMenu();
    }
  }

  function initMobileMenu() {
    const burger = document.getElementById("burgerBtn");
    if (!burger) return;

    // Remove any existing listeners to prevent duplicates
    const newBurger = burger.cloneNode(true);
    burger.parentNode.replaceChild(newBurger, burger);

    newBurger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = document
        .getElementById("mobileMenu")
        .classList.contains("is-open");
      isOpen ? closeMobileMenu() : openMobileMenu();
    });

    // Add touch event for better mobile response
    newBurger.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = document
        .getElementById("mobileMenu")
        .classList.contains("is-open");
      isOpen ? closeMobileMenu() : openMobileMenu();
    });
  }

  /* ----------------------------------------------------------------
     4. SCROLL-TRIGGERED REVEALS (GSAP ScrollTrigger)
     Targets every [data-animate] element plus dish/why/review cards.
  ---------------------------------------------------------------- */
  function initScrollReveals() {
    if (!hasGSAP || !window.ScrollTrigger) {
      // No-JS / no-GSAP fallback: just reveal everything
      document
        .querySelectorAll("[data-animate]")
        .forEach((el) => (el.style.opacity = 1));
      return;
    }

    const reveal = (selector, vars = {}) => {
      document.querySelectorAll(selector).forEach((el) => {
        // Skip if element is inside hero section (handled by playHeroIntro)
        if (el.closest('.hero')) return;

        gsap.fromTo(
          el,
          { opacity: 0, y: 36, ...vars.from },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            ...vars.to,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    };

    reveal('[data-animate="fade-up"]');
    reveal('[data-animate="card"]');

    // Image reveal: clip-path wipe
    document.querySelectorAll('[data-animate="img-reveal"]').forEach((el) => {
      // Skip if element is inside hero section (handled by playHeroIntro)
      if (el.closest('.hero')) return;

      gsap.fromTo(
        el,
        { clipPath: "inset(0% 0% 100% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
        },
      );
    });

    // Section eyebrows / titles — gentle stagger per section
    document.querySelectorAll(".section-head").forEach((head) => {
      gsap.from(head.children, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: head, start: "top 85%" },
      });
    });

    // Ember dividers — pop in
    gsap.utils.toArray(".ember-divider span").forEach((dot) => {
      gsap.from(dot, {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        scrollTrigger: { trigger: dot, start: "top 95%" },
      });
    });
  }

  /* ----------------------------------------------------------------
     5. COUNTER ANIMATIONS
  ---------------------------------------------------------------- */
  function initCounters() {
    const counters = document.querySelectorAll(".counter__num");
    if (!counters.length) return;

    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const isDecimal = el.dataset.decimal === "true";
      const suffix = el.dataset.suffix || "";
      const duration = 1600;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = target * eased;
        el.textContent =
          (isDecimal ? value.toFixed(1) : Math.round(value)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    counters.forEach((c) => observer.observe(c));
  }

  /* ----------------------------------------------------------------
     6. MENU PREVIEW — animated tabs
  ---------------------------------------------------------------- */
  function initMenuTabs() {
    const tabs = document.querySelectorAll(".menu-tab");
    const panels = document.querySelectorAll(".menu-panel");
    const indicator = document.getElementById("tabIndicator");
    if (!tabs.length) return;

    const moveIndicator = (tab) => {
      if (!indicator) return;
      indicator.style.width = tab.offsetWidth + "px";
      indicator.style.left = tab.offsetLeft + "px";
    };

    // place indicator on first active tab once layout is ready
    requestAnimationFrame(() =>
      moveIndicator(document.querySelector(".menu-tab.is-active")),
    );
    window.addEventListener("resize", () =>
      moveIndicator(document.querySelector(".menu-tab.is-active")),
    );

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        moveIndicator(tab);

        const target = tab.dataset.tab;
        panels.forEach((panel) => {
          const isMatch = panel.dataset.panel === target;
          panel.classList.toggle("is-active", isMatch);
          panel.hidden = !isMatch;
        });
      });
    });
  }

  /* ----------------------------------------------------------------
     7. GALLERY — filter + lightbox
  ---------------------------------------------------------------- */
  function initGallery() {
    const filters = document.querySelectorAll(".gallery-filter");
    const items = Array.from(document.querySelectorAll(".gallery-item"));
    if (!items.length) return;

    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const filter = btn.dataset.filter;

        items.forEach((item) => {
          const show = filter === "all" || item.dataset.cat === filter;
          item.classList.toggle("is-hidden", !show);
          if (hasGSAP && show) {
            gsap.fromTo(
              item,
              { opacity: 0, scale: 0.9 },
              { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" },
            );
          }
        });
      });
    });

    // Lightbox
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const closeBtn = document.getElementById("lightboxClose");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    let currentIndex = 0;

    const visibleItems = () =>
      items.filter((i) => !i.classList.contains("is-hidden"));

    const openLightbox = (item) => {
      const list = visibleItems();
      currentIndex = list.indexOf(item);
      updateLightboxImage();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const updateLightboxImage = () => {
      const list = visibleItems();
      const img = list[currentIndex].querySelector("img");
      lightboxImg.src = img.src.replace("w=600", "w=1400");
      lightboxImg.alt = img.alt;
    };
    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    const showNext = () => {
      const list = visibleItems();
      currentIndex = (currentIndex + 1) % list.length;
      updateLightboxImage();
    };
    const showPrev = () => {
      const list = visibleItems();
      currentIndex = (currentIndex - 1 + list.length) % list.length;
      updateLightboxImage();
    };

    items.forEach((item) =>
      item.addEventListener("click", () => openLightbox(item)),
    );
    closeBtn.addEventListener("click", closeLightbox);
    nextBtn.addEventListener("click", showNext);
    prevBtn.addEventListener("click", showPrev);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    });
  }

  /* ----------------------------------------------------------------
     8. FLOATING RESERVE BUTTON + BACK-TO-TOP
  ---------------------------------------------------------------- */
  function initFloatingUI() {
    const reserveBtn = document.getElementById("floatingReserve");
    const topBtn = document.getElementById("backToTop");
    const hero = document.getElementById("home");

    const onScroll = () => {
      const scrolledPastHero =
        window.scrollY > (hero ? hero.offsetHeight * 0.8 : 400);
      if (reserveBtn)
        reserveBtn.classList.toggle("is-visible", scrolledPastHero);
      if (topBtn) topBtn.classList.toggle("is-visible", window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (topBtn) {
      topBtn.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      });
    }
  }

  /* ----------------------------------------------------------------
     9. MISC — footer year
  ---------------------------------------------------------------- */
  function initMisc() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ----------------------------------------------------------------
     INIT
  ---------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initHeroBackdrop();
    initNav();
    initMobileMenu();
    initScrollReveals();
    initCounters();
    initMenuTabs();
    initGallery();
    initFloatingUI();
    initMisc();
  });
})();
