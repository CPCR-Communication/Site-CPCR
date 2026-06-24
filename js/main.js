(function () {
  "use strict";

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");
  const contactForm = document.getElementById("contact-form");
  const formFeedback = document.getElementById("form-feedback");

  if (navbar) {
    window.addEventListener(
      "scroll",
      () => {
        navbar.classList.toggle("navbar--scrolled", window.scrollY > 20);
      },
      { passive: true }
    );
    navbar.classList.toggle("navbar--scrolled", window.scrollY > 20);
  }

  function closeMobileNav() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    const icon = navToggle.querySelector("[data-lucide]");
    if (icon) {
      icon.setAttribute("data-lucide", "menu");
      lucide.createIcons();
    }
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      const icon = navToggle.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", isOpen ? "x" : "menu");
        lucide.createIcons();
      }
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileNav);
    });

    document.addEventListener("click", (e) => {
      if (
        navMenu.classList.contains("is-open") &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeMobileNav();
      }
    });
  }

  function showFeedback(message, type) {
    if (!formFeedback) return;
    formFeedback.textContent = message;
    formFeedback.hidden = false;
    formFeedback.className = "form-feedback form-feedback--" + type;
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const nom = contactForm.querySelector('[name="nom"]').value.trim();
      const entreprise = contactForm.querySelector('[name="entreprise"]').value.trim();
      const subjectField = contactForm.querySelector('[name="subject"]');
      if (subjectField) {
        subjectField.value = entreprise
          ? `Nouvelle demande de devis : ${nom} — ${entreprise}`
          : `Nouvelle demande de devis :${nom}`;
      }

      try {
        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(new FormData(contactForm)).toString(),
        });

        if (!response.ok) throw new Error("Erreur réseau");

        showFeedback(
          "Votre message a bien été envoyé. Une réponse vous sera apportée dans les plus brefs délais.",
          "success"
        );
        contactForm.reset();
        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      } catch {
        showFeedback(
          "Une erreur est survenue. Réessayez ou contactez-nous par téléphone.",
          "error"
        );
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function initPageReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-page-loaded");
      return;
    }

    const blocks = [
      navbar,
      ...document.querySelectorAll("main > .section, main > .legal-page"),
      document.querySelector(".footer"),
    ].filter(Boolean);

    const stagger = 0.09;

    blocks.forEach((block, index) => {
      block.classList.add("reveal-block");
      if (block === navbar) {
        block.classList.add("reveal-block--nav");
      }
      block.style.setProperty("--reveal-delay", index * stagger + "s");
    });

    window.requestAnimationFrame(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-page-loaded");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPageReveal);
  } else {
    initPageReveal();
  }
})();
