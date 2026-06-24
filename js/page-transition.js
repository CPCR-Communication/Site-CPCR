(function () {
  "use strict";

  const TRANSITION_MS = 650;
  let isTransitioning = false;

  function getLogoSrc() {
    const logo = document.querySelector(".navbar__logo, .footer__logo, .login-card__logo");
    if (logo && logo.getAttribute("src")) {
      return logo.getAttribute("src").replace(/\\/g, "/");
    }

    const inAdmin = /\/admin(?:\/|$)/i.test(window.location.pathname);
    return inAdmin ? "../images/Logo/cpcr-logo.png" : "images/Logo/cpcr-logo.png";
  }

  function ensureOverlay() {
    let overlay = document.getElementById("page-transition");
    if (overlay) {
      const img = overlay.querySelector(".page-transition__logo");
      if (img) img.src = getLogoSrc();
      return overlay;
    }

    overlay = document.createElement("div");
    overlay.id = "page-transition";
    overlay.className = "page-transition";
    overlay.setAttribute("aria-hidden", "true");

    const img = document.createElement("img");
    img.className = "page-transition__logo";
    img.src = getLogoSrc();
    img.alt = "";
    img.width = 200;
    img.height = 56;
    img.decoding = "async";

    overlay.appendChild(img);
    document.body.appendChild(overlay);
    return overlay;
  }

  function resetTransition() {
    isTransitioning = false;
    const overlay = document.getElementById("page-transition");
    if (!overlay) return;
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
  }

  function getPageKey(pathname) {
    const path = (pathname || "/").toLowerCase().replace(/\\/g, "/");
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";

    if (segments.includes("admin")) return "admin";
    if (last === "politique-de-confidentialite.html" || last === "politique-de-confidentialite") {
      return "politique";
    }
    if (last === "mentions-legales.html" || last === "mentions-legales") {
      return "mentions";
    }
    if (!segments.length || last === "index.html") return "home";
    return path;
  }

  function isAnimatedPageLink(link, event) {
    if (event.defaultPrevented) return false;
    if (link.target === "_blank") return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return false;
    }

    const rawHref = (link.getAttribute("href") || "").trim();
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("tel:") || rawHref.startsWith("mailto:")) {
      return false;
    }

    let targetUrl;
    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch {
      return false;
    }

    const currentUrl = new URL(window.location.href);
    if (targetUrl.origin !== currentUrl.origin) return false;

    const fromKey = getPageKey(currentUrl.pathname);
    const toKey = getPageKey(targetUrl.pathname);
    if (fromKey === toKey) return false;

    return toKey === "home" || toKey === "politique" || toKey === "mentions" || toKey === "admin";
  }

  function playPageTransition(callback) {
    if (isTransitioning) return;
    isTransitioning = true;

    const overlay = ensureOverlay();
    overlay.classList.remove("is-active");
    void overlay.offsetWidth;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-active");

    window.setTimeout(() => {
      callback();
    }, TRANSITION_MS);
  }

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest("a");
      if (!link || !isAnimatedPageLink(link, event)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      playPageTransition(() => {
        window.location.assign(link.href);
      });
    },
    true
  );

  window.addEventListener("pageshow", () => {
    resetTransition();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resetTransition);
  } else {
    resetTransition();
  }
})();
