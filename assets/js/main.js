/* Maria Yasin portfolio interactions */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var nav = document.getElementById("nav");
  var bar = document.getElementById("progressBar");
  var burger = document.getElementById("burger");
  var menu = document.getElementById("mobileMenu");
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  var chips = document.querySelectorAll(".chip, .sticker");
  var toTop = document.getElementById("toTop");
  var jr = document.querySelector(".jr");

  /* ---------- scroll: sticky nav + progress + parallax ---------- */
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;

      nav.classList.toggle("is-stuck", y > 40);
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

      // the back-to-top button only earns its space once there is a way back
      if (toTop) toTop.hidden = y < window.innerHeight * 0.8;

      if (!reduced) {
        parallaxEls.forEach(function (el) {
          var rate = parseFloat(el.getAttribute("data-parallax")) || 0.1;
          var mid = el.getBoundingClientRect().top + y - window.innerHeight / 2;
          el.style.translate = "0 " + (y - mid) * rate + "px";
        });
      }

      // the journey rail draws itself in as the section travels up the screen
      if (jr && !reduced) {
        var jb = jr.getBoundingClientRect();
        var p = (window.innerHeight * 0.72 - jb.top) / jb.height;
        jr.style.setProperty("--rail", Math.max(0, Math.min(1, p)).toFixed(3));
      }

      sweep();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- side drawer ---------- */
  var veil = document.getElementById("drawerVeil");

  function setDrawer(open) {
    if (!menu) return;
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle("drawer-open", open);

    if (open) {
      menu.hidden = false;
      if (veil) veil.hidden = false;
      // one frame with the panel in the DOM, so the slide actually animates
      requestAnimationFrame(function () {
        menu.classList.add("is-open");
        if (veil) veil.classList.add("is-open");
      });
    } else {
      menu.classList.remove("is-open");
      if (veil) veil.classList.remove("is-open");
      setTimeout(function () {
        if (!menu.classList.contains("is-open")) {
          menu.hidden = true;
          if (veil) veil.hidden = true;
        }
      }, 400);
    }
  }

  if (burger && menu) {
    burger.addEventListener("click", function () {
      setDrawer(burger.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setDrawer(false);
    });
    if (veil) veil.addEventListener("click", function () { setDrawer(false); });
    var closeBtn = document.getElementById("drawerClose");
    if (closeBtn) closeBtn.addEventListener("click", function () { setDrawer(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") setDrawer(false);
    });
  }

  /* ---------- reveal on scroll + counters + bars ----------
     A rect sweep rather than IntersectionObserver: an anchor jump or a fast
     flick can carry an element past the observer without it ever firing,
     which left whole sections stuck at opacity 0. This re-checks every
     pending element each frame, so nothing can be skipped.               */
  var pending = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (reduced) {
    pending.forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = el.getAttribute("data-count");
    });
    pending = [];
  } else {
    pending.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + "ms";
    });
  }

  function sweep() {
    if (!pending.length) return;
    var vh = window.innerHeight;
    for (var i = pending.length - 1; i >= 0; i--) {
      var el = pending[i];
      // top-only test: anything already above the fold must show too,
      // otherwise a jump past it would leave it invisible for good
      if (el.getBoundingClientRect().top < vh * 0.9) {
        el.classList.add("is-in");
        el.querySelectorAll("[data-count]").forEach(countUp);
        pending.splice(i, 1);
      }
    }
  }
  window.addEventListener("resize", sweep, { passive: true });
  window.addEventListener("load", sweep);

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var start = performance.now();
    var dur = 1200;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- active nav link ---------- */
  var sections = document.querySelectorAll("section[id]");
  var navLinks = document.querySelectorAll(".nav__links a");

  if ("IntersectionObserver" in window && navLinks.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- pointer parallax on chips & stickers ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches && chips.length) {
    var hero = document.querySelector(".hero");
    var mx = 0, my = 0, raf = null;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    }, { passive: true });

    function render() {
      raf = null;
      var rect = hero.getBoundingClientRect();
      if (rect.bottom < 0) return;

      var nx = (mx - rect.width / 2) / rect.width;
      var ny = (my - rect.height / 2) / rect.height;

      // the bob keyframes read these, so the float and the parallax compose
      chips.forEach(function (el) {
        var d = parseFloat(el.getAttribute("data-depth")) || 14;
        el.style.setProperty("--px", -nx * d + "px");
        el.style.setProperty("--py", -ny * d + "px");
      });
    }
  }

  /* ---------- anchor offset for the fixed nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 74;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ---------- back to top ---------- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* first paint: set the nav/progress state and reveal whatever is on screen */
  onScroll();
})();
