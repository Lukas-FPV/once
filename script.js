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
  var media = document.querySelector(".hero");
  var themed = Array.prototype.slice.call(document.querySelectorAll("[data-theme]"));
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    var y = nav.offsetHeight / 2, dark = false, over = false;
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { dark = themed[i].getAttribute("data-theme") === "dark"; break; }
    }
    // Über dem dunklen Hero: Leiste durchsichtig
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

  // Fassung 9: Agent-Figur. Läuft einmal (~16 s), wenn sichtbar. Ein Zeitgeber t steuert alles,
  // Pause hält t an. Reduzierte Bewegung oder ohne JS: Endbild aus dem HTML (Figur freundlich, alles sichtbar), kein Knopf.
  var demo = document.getElementById("demo");
  if (demo && !reduce && "IntersectionObserver" in window && window.requestAnimationFrame) {
    var END = 16000;
    var steps = demo.querySelectorAll(".demo__step");
    var words = demo.querySelectorAll(".w");
    var svcs = demo.querySelectorAll(".svc li");
    var bar = demo.querySelector(".load__bar");
    var agent = demo.querySelector(".agent");
    var head = demo.querySelector(".agent__head");
    var face = demo.querySelector(".agent__face");
    var ctrl = demo.querySelector(".demo__ctrl");
    var status = demo.querySelector(".demo__status");
    var stepAt = [600, 3600, 6000, 9200, 13400];          // Schritte 1–5 (ms)
    var t = 0, last = 0, paused = false, done = false, running = false;
    var pose = { x: -30, y: 0, r: 0 };                   // Blick/Drehung, weich nachgeführt
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var ease = function (v) { return v * v * (3 - 2 * v); };
    var mood = function (t) {
      if (t < 400) return "neutral";
      if (t < 3600) return "attentive";                   // 1 aufmerksam, dreht sich zum Nutzer
      if (t < 6000) return "thinking";                    // 2 nachdenklich
      if (t < 9200) return "neutral";                     // 3 Verbindung
      if (t < 12800) return "ask";                        // 4 Rückfrage
      return "friendly";                                  // 5 fertig
    };
    var target = function (m, t) {
      var sway = Math.sin(t / 650) * 6 * (t < 12800 ? 1 : 0); // sanftes Kippen, max. 12 Grad mit Neigung
      if (m === "neutral" && t < 400) return { x: -30, y: 0, r: -6 };
      if (m === "attentive") return { x: 0, y: -4, r: sway * .5 };
      if (m === "thinking") return { x: 22, y: -10, r: 8 + sway * .3 };
      if (m === "neutral") return { x: Math.sin(t / 500) * 14, y: 0, r: sway };
      if (m === "ask") return { x: -4, y: 6, r: -12 };
      return { x: 0, y: 0, r: 0 };
    };
    var render = function (dt) {
      var m = mood(t);
      if (agent.getAttribute("data-mood") !== m) agent.setAttribute("data-mood", m);
      var g = target(m, t), k = dt ? 1 - Math.pow(.004, dt / 1000) : 1;
      pose.x += (g.x - pose.x) * k; pose.y += (g.y - pose.y) * k; pose.r += (g.r - pose.r) * k;
      // Nicken: Kugel kippt einmal nach unten und zurück (13.2–14.0 s)
      var n = t > 13200 && t < 14000 ? Math.sin(Math.PI * (t - 13200) / 800) : 0;
      head.style.transform = "translateY(" + (n * 6).toFixed(2) + "px) rotate(" + pose.r.toFixed(2) + "deg)";
      face.style.transform = "translate(" + pose.x.toFixed(2) + "px," + (pose.y + n * 12).toFixed(2) + "px)";
      for (var i = 0; i < steps.length; i++) steps[i].classList.toggle("is-on", t >= stepAt[i]);
      for (var j = 0; j < words.length; j++) words[j].classList.toggle("is-on", t >= 900 + j * 330);
      for (var s = 0; s < svcs.length; s++) svcs[s].classList.toggle("is-on", t >= 6200 + s * 550);
      bar.style.transform = "scaleX(" + ease(clamp((t - 3800) / 2000)).toFixed(3) + ")";
    };
    var label = function () {
      ctrl.textContent = done ? "Animation nochmal abspielen" : (paused ? "Animation fortsetzen" : "Animation pausieren");
      status.textContent = done ? "Animation beendet" : (paused ? "Animation pausiert" : "Animation läuft");
    };
    var frame = function (now) {
      var dt = Math.min(100, now - last); last = now;
      if (!paused) {
        t = Math.min(END, t + dt);
        render(dt);
        if (t >= END) { done = true; running = false; head.style.transform = ""; face.style.transform = ""; label(); return; }
      }
      requestAnimationFrame(frame);
    };
    var start = function () {
      t = 0; done = false; paused = false; pose = { x: -30, y: 0, r: -6 };
      demo.classList.remove("demo--paused"); render(0); label();
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    };
    demo.classList.add("demo--anim");
    render(0);
    ctrl.hidden = false; status.hidden = false; label();
    ctrl.addEventListener("click", function () {
      if (done) { start(); return; }
      paused = !paused;
      demo.classList.toggle("demo--paused", paused);
      label();
    });
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); start(); }
    }, { threshold: .35 });
    io.observe(demo);
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
