(function () {
  "use strict";

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");
  var mq = window.matchMedia("(min-width: 768px)");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr").textContent = open ? "Menü schliessen" : "Menü öffnen";
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  function onMq(e) { if (e.matches) setMenu(false); }
  if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);

  // Navigation: Rand nach dem Scrollen, hell/dunkel je nach Abschnitt darunter
  var media = document.querySelector(".hero__media");
  var themed = Array.prototype.slice.call(document.querySelectorAll("[data-theme]"));
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    var y = nav.offsetHeight / 2, dark = false, over = false;
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { dark = themed[i].getAttribute("data-theme") === "dark"; break; }
    }
    // Über dem Hero-Foto: Leiste durchsichtig
    if (media) { var m = media.getBoundingClientRect(); over = m.top <= 2 && m.bottom > nav.offsetHeight; }
    nav.classList.toggle("is-dark", dark);
    nav.classList.toggle("is-over", over);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Aktiven Menüpunkt markieren
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__menu ul a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    // Alle Abschnitte beobachten, damit die Markierung auch bei Abschnitten ohne Menüpunkt (Hero, Warteliste) verschwindet
    Array.prototype.slice.call(document.querySelectorAll("main > section, footer[id]")).forEach(function (el) { io.observe(el); });
  }

  // Abschnitte einblenden (einmal), nicht bei reduzierter Bewegung
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!reduce && "IntersectionObserver" in window && items.length) {
    document.documentElement.classList.add("has-reveal");
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        ro.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    items.forEach(function (el) {
      // Was beim Laden schon sichtbar ist, sofort zeigen (z. B. Sprung per Anker)
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in"); else ro.observe(el);
    });
    // Am Seitenende alles zeigen (der Footer erreicht sonst auf kleinen Bildschirmen die Schwelle nicht)
    window.addEventListener("scroll", function () {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        items.forEach(function (el) { el.classList.add("is-in"); });
      }
    }, { passive: true });
    // Beim Drucken oder Ankersprung alles zeigen
    window.addEventListener("beforeprint", function () { items.forEach(function (el) { el.classList.add("is-in"); }); });
  }


  // Fassung 7: Wortmarke im Hero wird beim Scrollen kleiner, ruhig per rAF
  var mark = document.querySelector(".hero__mark");
  var heroEl = document.querySelector(".hero");
  if (mark && heroEl && !reduce) {
    var ticking = false;
    var upd = function () {
      ticking = false;
      var p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, heroEl.offsetHeight * .6)));
      mark.style.setProperty("--p", p.toFixed(3));
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // Fassung 7: Cursor-Kreis nur mit feiner Maus, nicht auf Touch, nicht bei reduzierter Bewegung
  var cur = document.querySelector(".cursor");
  if (cur && !reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.documentElement.classList.add("has-cursor");
    var tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    var loop = function () {
      cx += (tx - cx) * .25; cy += (ty - cy) * .25;
      cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > .3) requestAnimationFrame(loop); else run = false;
    };
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!cur.classList.contains("is-on")) { cx = tx; cy = ty; cur.classList.add("is-on"); }
      cur.classList.toggle("is-link", !!(e.target.closest && e.target.closest("a, button")));
      if (!run) { run = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener("mouseleave", function () { cur.classList.remove("is-on"); });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
