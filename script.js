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

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
