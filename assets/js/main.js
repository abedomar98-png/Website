/* =====================================================================
   main.js — runtime behaviors for Abed-Latif Al-Omar site
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- 1. Language switching + persistence ---------- */
  const LS_KEY = "alo-lang";
  const dict = (typeof I18N !== "undefined") ? I18N : { en: {}, ar: {} };

  function applyLang(lang) {
    const html = document.documentElement;
    const dir = lang === "ar" ? "rtl" : "ltr";
    html.removeAttribute("dir");
    void html.offsetWidth;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", dir);
    html.style.direction = dir;
    // Set direction inline on body — forces re-inheritance in all children
    // without relying on the CSS cascade from html, which some browsers
    // don't re-propagate correctly when an attribute selector deactivates.
    if (document.body) document.body.style.direction = dir;

    const t = dict[lang] || {};
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const k = el.getAttribute("data-i18n");
      if (t[k] !== undefined) el.textContent = t[k];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const k = el.getAttribute("data-i18n-placeholder");
      if (t[k] !== undefined) el.setAttribute("placeholder", t[k]);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      const k = el.getAttribute("data-i18n-aria");
      if (t[k] !== undefined) el.setAttribute("aria-label", t[k]);
    });

    // Persist
    try { localStorage.setItem(LS_KEY, lang); } catch (e) {}

    // Update title if present
    const titleKey = document.body.getAttribute("data-title-key");
    if (titleKey && t[titleKey]) {
      document.title = t[titleKey] + " · Abed-Latif Al-Omar";
    }
  }

  function initLang() {
    let saved = "en";
    try { saved = localStorage.getItem(LS_KEY) || "en"; } catch (e) {}
    applyLang(saved);

    document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const cur = document.documentElement.getAttribute("lang");
        const next = cur === "en" ? "ar" : "en";
        try { localStorage.setItem(LS_KEY, next); } catch (e) {}
        window.location.reload();
      });
    });
  }

  /* ---------- 2. Nav scroll state ---------- */
  function initNav() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const onScroll = function () {
      if (window.scrollY > 60) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 3. Mobile menu ---------- */
  function initMobileMenu() {
    const burger = document.querySelector(".nav-burger");
    const menu = document.querySelector(".mobile-menu");
    if (!burger || !menu) return;

    burger.addEventListener("click", function () {
      menu.classList.add("open");
      document.body.style.overflow = "hidden";
    });
    menu.querySelectorAll(".close-btn, a").forEach(function (el) {
      el.addEventListener("click", function () {
        menu.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- 4. Reveal on scroll + safety timeout ---------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    let observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        });
      }, { threshold: .08, rootMargin: "0px 0px -40px 0px" });
      items.forEach(function (el) { observer.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add("is-visible"); });
    }

    // Safety: after 1500ms force-show anything still hidden
    // (ensures Playwright full-page screenshots capture all content)
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 1500);
  }

  /* ---------- 5. Stat counters ---------- */
  function animateCount(el) {
    const target = parseInt(el.getAttribute("data-count"), 10);
    const suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;

    const duration = 1400;
    const start = performance.now();
    const ease = function (t) { return 1 - Math.pow(1 - t, 3); };

    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const val = Math.round(target * ease(p));
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function initStats() {
    const stats = document.querySelectorAll(".stat-num[data-count]");
    if (!stats.length) return;

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animateCount(e.target);
            obs.unobserve(e.target);
          }
        });
      }, { threshold: .4 });
      stats.forEach(function (el) { obs.observe(el); });
    } else {
      stats.forEach(animateCount);
    }

    // Safety: 1500ms timeout fills any unanimated counters
    setTimeout(function () {
      document.querySelectorAll(".stat-num[data-count]").forEach(function (el) {
        if (!el.textContent || el.textContent === "0") {
          const target = el.getAttribute("data-count");
          const suffix = el.getAttribute("data-suffix") || "";
          el.textContent = target + suffix;
        }
      });
    }, 1500);
  }

  /* ---------- 6. Skill bars ---------- */
  function initSkillBars() {
    const bars = document.querySelectorAll(".skill-fill[data-pct]");
    if (!bars.length) return;

    function fill(el) {
      const pct = el.getAttribute("data-pct");
      el.style.width = pct + "%";
    }

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            fill(e.target);
            obs.unobserve(e.target);
          }
        });
      }, { threshold: .25 });
      bars.forEach(function (el) { obs.observe(el); });
    } else {
      bars.forEach(fill);
    }

    // Safety
    setTimeout(function () {
      bars.forEach(function (el) {
        if (!el.style.width || el.style.width === "0px" || el.style.width === "0%") {
          fill(el);
        }
      });
    }, 1500);
  }

  /* ---------- 7. Insights filters ---------- */
  function initFilters() {
    const btns = document.querySelectorAll("[data-filter]");
    const cards = document.querySelectorAll("[data-cat]");
    if (!btns.length || !cards.length) return;

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        const want = btn.getAttribute("data-filter");
        cards.forEach(function (c) {
          const cat = c.getAttribute("data-cat");
          c.style.display = (want === "all" || cat === want) ? "" : "none";
        });
      });
    });
  }

  /* ---------- 8. Marquee duplication (for seamless loop) ---------- */
  function initMarquees() {
    document.querySelectorAll(".marquee").forEach(function (m) {
      // Duplicate content so the translateX(-50%) loop is seamless
      m.innerHTML = m.innerHTML + m.innerHTML;
    });
  }

  /* ---------- 9. Active nav link ---------- */
  function markActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a, .mobile-menu a").forEach(function (a) {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html") || (path === "index.html" && href === "index.html")) {
        a.classList.add("active");
      }
    });
  }

  /* ---------- 10. Boot ---------- */
  function boot() {
    initLang();
    initNav();
    initMobileMenu();
    initMarquees();
    initReveal();
    initStats();
    initSkillBars();
    initFilters();
    markActiveNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
