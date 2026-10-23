/* ---- CONFIG: set real details here. Leave empty until confirmed. ---- */
const CONFIG = {
  contactHref: "https://www.instagram.com/danimysta/",
  contactLabel: "Instagram @danimysta"
};

(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileNav = matchMedia("(max-width: 760px)");

  // Contact CTA: only becomes an external link when a real destination exists
  if (CONFIG.contactHref) {
    document.querySelectorAll(".nav__cta, #contactCta").forEach(a => {
      a.href = CONFIG.contactHref;
      a.textContent = CONFIG.contactLabel;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  }

  const btn = $(".nav__toggle");
  const menu = $("#menu");
  const panelClose = $(".nav__panel-close");
  const main = $("#main");
  const navLinks = $$(".nav__menu a, .nav__links .nav__cta");
  const railMark = $(".nav__rail-mark");
  const sectionIds = ["identity", "expression", "practices", "daniella", "contact"];
  let lockedScrollPos = 0;

  const isOpen = () => btn.getAttribute("aria-expanded") === "true";

  const focusables = () =>
    $$('a[href], button:not([disabled])', menu).filter(el => el.offsetParent !== null || menu.classList.contains("is-open"));

  const syncRail = () => {
    if (!railMark || !mobileNav.matches || !isOpen()) return;
    const current = $(".nav__menu a.is-current", menu) || $(".nav__menu a", menu);
    const body = $(".nav__panel-body", menu);
    if (!current || !body) return;
    const linkRect = current.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const top = linkRect.top - bodyRect.top + body.scrollTop + linkRect.height * 0.12;
    railMark.style.height = `${Math.max(linkRect.height * 0.76, 40)}px`;
    railMark.style.transform = `translateY(${top}px)`;
  };

  const syncCurrent = () => {
    if (!mobileNav.matches) {
      $$(".nav__menu a.is-current").forEach(a => a.classList.remove("is-current"));
      return;
    }
    const probe = window.scrollY + innerHeight * 0.32;
    let current = sectionIds[0];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= probe) current = id;
    }
    $$(".nav__menu a[data-nav]").forEach(a => {
      a.classList.toggle("is-current", a.getAttribute("data-nav") === current);
    });
    syncRail();
  };

  const lockScroll = (lock) => {
    if (lock) {
      lockedScrollPos = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${lockedScrollPos}px`;
      document.body.classList.add("nav-open");
    } else {
      document.body.classList.remove("nav-open");
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      window.scrollTo(0, lockedScrollPos);
    }
  };

  const setMenu = (open, { focusTarget } = {}) => {
    btn.setAttribute("aria-expanded", open);
    menu.classList.toggle("is-open", open);
    if (main) main.inert = open;
    if (mobileNav.matches) menu.inert = !open;
    lockScroll(open);

    if (mobileNav.matches) {
      menu.setAttribute("role", open ? "dialog" : "");
      menu.setAttribute("aria-modal", open ? "true" : "");
    } else {
      menu.removeAttribute("role");
      menu.removeAttribute("aria-modal");
    }

    if (open) {
      syncCurrent();
      requestAnimationFrame(() => {
        syncRail();
        (focusTarget || panelClose || btn).focus();
      });
    } else {
      (focusTarget || btn).focus();
    }
  };

  btn.addEventListener("click", () => setMenu(!isOpen()));
  panelClose.addEventListener("click", () => setMenu(false, { focusTarget: btn }));

  menu.addEventListener("click", e => {
    const link = e.target.closest("a[href]");
    if (link && menu.contains(link)) setMenu(false, { focusTarget: btn });
  });

  addEventListener("keydown", e => {
    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      setMenu(false, { focusTarget: btn });
    }
    if (e.key !== "Tab" || !isOpen()) return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  $$(".nav__menu a[data-nav]").forEach(a => {
    a.addEventListener("mouseenter", () => {
      if (!mobileNav.matches || !isOpen()) return;
      $$(".nav__menu a.is-current").forEach(el => el.classList.remove("is-current"));
      a.classList.add("is-current");
      syncRail();
    });
  });
  menu.addEventListener("mouseleave", () => syncCurrent());

  mobileNav.addEventListener("change", () => {
    if (!mobileNav.matches && isOpen()) setMenu(false);
    syncCurrent();
  });

  $(".nav__panel-body")?.addEventListener("scroll", syncRail, { passive: true });
  addEventListener("scroll", syncCurrent, { passive: true });
  addEventListener("resize", () => { syncCurrent(); if (isOpen()) syncRail(); });

  // Reveals (content stays visible without JS / reduced motion)
  const els = document.querySelectorAll("[data-r]");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .25 });
    els.forEach(el => { el.classList.add("r"); io.observe(el); });
  }

  const p = $("[data-parallax]");
  if (p && !reduce) {
    let t = false;
    addEventListener("scroll", () => { if (t) return; t = true; requestAnimationFrame(() => {
      const r = p.parentElement.getBoundingClientRect(), k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      p.style.transform = "translate3d(0," + (k * -40).toFixed(1) + "px,0)"; t = false; }); }, { passive: true });
  }
  $("#yr").textContent = new Date().getFullYear();

  const nav = $(".nav");
  const syncNavBar = () => nav.classList.toggle("is-scrolled", window.scrollY > 12);
  syncNavBar();
  addEventListener("scroll", syncNavBar, { passive: true });
  syncCurrent();
  if (mobileNav.matches) menu.inert = !isOpen();
})();
