(function () {
  "use strict";

  const showcase = document.getElementById("catalogues-showcase");
  if (!showcase) return;

  const coverImage = document.getElementById("catalogue-cover");
  const caption = document.getElementById("catalogue-caption");
  const previewFrame = showcase.querySelector(".catalogues-preview__frame");
  const items = Array.from(showcase.querySelectorAll(".catalogues-list__item"));

  if (!coverImage || !items.length) return;

  const FADE_MS_AUTO = 550;
  const FADE_MS_HOVER = 120;
  const AUTO_INTERVAL = 4000;
  const OPEN_DELAY = 650;

  let currentSrc = "";
  let isTransitioning = false;
  let isHovered = false;
  let isOpeningLink = false;
  let autoIndex = 0;
  let autoTimer = null;
  let fadeTimeout = null;
  let openTimeout = null;

  function normalizeSrc(src) {
    return src ? src.replace(/\\/g, "/").trim() : "";
  }

  function setActiveItem(item) {
    items.forEach((el) => el.classList.toggle("is-active", el === item));
  }

  function clearFadeTimeout() {
    if (fadeTimeout) {
      window.clearTimeout(fadeTimeout);
      fadeTimeout = null;
    }
  }

  function swapCover(src, label, animate, fast) {
    if (!src) return;
    if (src === currentSrc && animate) return;
    if (isTransitioning && animate && !fast) return;

    clearFadeTimeout();
    coverImage.classList.toggle("is-fast", Boolean(fast));

    if (!animate) {
      coverImage.setAttribute("src", src);
      coverImage.setAttribute("alt", "Couverture du catalogue " + label);
      if (caption) caption.textContent = label;
      currentSrc = src;
      coverImage.classList.add("is-visible");
      isTransitioning = false;
      return;
    }

    const fadeMs = fast ? FADE_MS_HOVER : FADE_MS_AUTO;
    isTransitioning = true;
    coverImage.classList.remove("is-visible");

    fadeTimeout = window.setTimeout(() => {
      fadeTimeout = null;
      coverImage.setAttribute("src", src);
      coverImage.setAttribute("alt", "Couverture du catalogue " + label);

      if (caption) {
        caption.textContent = label;
      }

      const onLoad = () => {
        coverImage.classList.add("is-visible");
        isTransitioning = false;
        coverImage.removeEventListener("load", onLoad);
        coverImage.removeEventListener("error", onError);
      };

      const onError = () => {
        coverImage.classList.add("is-visible");
        isTransitioning = false;
        coverImage.removeEventListener("load", onLoad);
        coverImage.removeEventListener("error", onError);
      };

      coverImage.addEventListener("load", onLoad);
      coverImage.addEventListener("error", onError);

      if (coverImage.complete) {
        onLoad();
      }

      currentSrc = src;
    }, fadeMs);
  }

  function showItem(item, animate, fast) {
    const src = normalizeSrc(item.getAttribute("data-image"));
    const label = item.getAttribute("data-label") || item.textContent.trim();
    setActiveItem(item);
    swapCover(src, label, animate, fast);
  }

  function showItemAt(index, animate, fast) {
    autoIndex = ((index % items.length) + items.length) % items.length;
    showItem(items[autoIndex], animate, fast);
  }

  function stopAutoRotate() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function playClickAnimation(item) {
    item.classList.remove("is-clicked");
    void item.offsetWidth;
    item.classList.add("is-clicked");
    window.setTimeout(() => item.classList.remove("is-clicked"), 400);

    if (previewFrame) {
      previewFrame.classList.remove("is-opening");
      void previewFrame.offsetWidth;
      previewFrame.classList.add("is-opening");
      window.setTimeout(() => previewFrame.classList.remove("is-opening"), 400);
    }
  }

  function playLogoSplash() {
    if (!previewFrame) return;
    previewFrame.classList.remove("is-logo-splash");
    void previewFrame.offsetWidth;
    previewFrame.classList.add("is-logo-splash");
  }

  function hideLogoSplash() {
    if (previewFrame) {
      previewFrame.classList.remove("is-logo-splash");
    }
  }

  function openCatalogueLink(item) {
    const href = item.getAttribute("href");
    if (!href || isOpeningLink) return;

    isOpeningLink = true;
    stopAutoRotate();
    playClickAnimation(item);
    playLogoSplash();

    if (openTimeout) {
      window.clearTimeout(openTimeout);
    }

    openTimeout = window.setTimeout(() => {
      window.open(href, "_blank", "noopener,noreferrer");
      hideLogoSplash();
      isOpeningLink = false;
      openTimeout = null;
      if (!isHovered) {
        startAutoRotate();
      }
    }, OPEN_DELAY);
  }

  function startAutoRotate() {
    stopAutoRotate();
    autoTimer = window.setInterval(() => {
      if (isHovered || isTransitioning || isOpeningLink) return;
      showItemAt(autoIndex + 1, true, false);
    }, AUTO_INTERVAL);
  }

  items.forEach((item, index) => {
    item.addEventListener("mouseenter", () => {
      isHovered = true;
      stopAutoRotate();
      autoIndex = index;
      showItem(item, true, true);
    });

    item.addEventListener("mouseleave", () => {
      isHovered = false;
      if (!isOpeningLink) {
        startAutoRotate();
      }
    });

    item.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
        return;
      }

      event.preventDefault();
      openCatalogueLink(item);
    });
  });

  showItemAt(0, false, false);
  startAutoRotate();
})();
