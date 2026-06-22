(function () {
  "use strict";

  const TRANSITION_MS = 650;
  let isTransitioning = false;

  function getLogoSrc() {
    const logo = document.querySelector(".navbar__logo");
    if (logo && logo.getAttribute("src")) {
      return logo.getAttribute("src").replace(/\\/g, "/");
    }
    return "images/Logo/cpcr-logo.png";
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

  function isPolitiqueLink(link, event) {
    if (event.defaultPrevented) return false;
    if (link.target === "_blank") return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return false;

    const rawHref = link.getAttribute("href");
    if (!rawHref || !rawHref.includes("politique-de-confidentialite.html")) {
      return false;
    }

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return false;
    }

    const current = new URL(window.location.href);
    return url.origin === window.location.origin && url.pathname !== current.pathname;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !isPolitiqueLink(link, event)) return;

    event.preventDefault();
    playPageTransition(() => {
      window.location.assign(link.href);
    });
  });
})();
