(function () {
  "use strict";

  var CONTENT_URL = "/.netlify/functions/get-content";
  var FALLBACK_URL = "data/site-content.json";

  function normalizePath(path) {
    return path ? String(path).replace(/\\/g, "/").trim() : "";
  }

  function setText(el, text) {
    if (el && text != null) el.textContent = text;
  }

  function setHtml(el, html) {
    if (el && html != null) el.innerHTML = html;
  }

  function padIndex(num) {
    return String(num).padStart(2, "0");
  }

  function resolveCatalogueIcon(item) {
    if (item.icon) return item.icon;
    var label = (item.label || "").toLowerCase();
    if (label.indexOf("responsable") !== -1 || label.indexOf("rse") !== -1) return "leaf";
    if (label.indexOf("fabrication") !== -1) return "factory";
    if (label.indexOf("nature") !== -1) return "trees";
    if (label.indexOf("catalogue du monde") !== -1 || label.indexOf("gros catalogue") !== -1) return "globe";
    if (label.indexOf("textile") !== -1) return "shirt";
    if (label.indexOf("écriture") !== -1 || label.indexOf("senator") !== -1) return "pen-line";
    if (label.indexOf("vip") !== -1) return "gem";
    if (label.indexOf("made in france") !== -1) return "flag";
    return "book-open";
  }

  function buildCatalogueItem(item, index, isFirst) {
    var link = document.createElement("a");
    var image = normalizePath(item.image);
    var label = item.label || "";
    var url = item.url || "#";

    link.href = url;
    link.className = "catalogues-list__item" + (isFirst ? " is-active" : "");
    link.setAttribute("data-image", image);
    link.setAttribute("data-label", label);
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    var indexSpan = document.createElement("span");
    indexSpan.className = "catalogues-list__index";
    indexSpan.setAttribute("aria-hidden", "true");
    indexSpan.textContent = padIndex(index + 1);

    var iconWrap = document.createElement("span");
    iconWrap.className = "catalogues-list__icon";
    iconWrap.setAttribute("aria-hidden", "true");

    var icon = document.createElement("i");
    icon.setAttribute("data-lucide", resolveCatalogueIcon(item));
    iconWrap.appendChild(icon);

    var labelSpan = document.createElement("span");
    labelSpan.className = "catalogues-list__label";
    labelSpan.textContent = label;

    var mainWrap = document.createElement("span");
    mainWrap.className = "catalogues-list__main";
    mainWrap.appendChild(labelSpan);
    mainWrap.appendChild(iconWrap);

    var arrow = document.createElement("i");
    arrow.setAttribute("data-lucide", "arrow-up-right");
    arrow.className = "catalogues-list__arrow";
    arrow.setAttribute("aria-hidden", "true");

    link.appendChild(indexSpan);
    link.appendChild(mainWrap);
    link.appendChild(arrow);

    return link;
  }

  function applyContent(data) {
    if (!data) return;

    if (data.meta) {
      if (data.meta.title) document.title = data.meta.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && data.meta.description) {
        metaDesc.setAttribute("content", data.meta.description);
      }
    }

    if (data.hero) {
      var hero = data.hero;
      setText(document.getElementById("hero-location"), hero.location);

      var heroTitle = document.getElementById("hero-title");
      if (heroTitle && hero.titleLines && hero.titleLines.length) {
        heroTitle.innerHTML = hero.titleLines.map(function (line) {
          return line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }).join("<br>");
      }

      setText(document.getElementById("hero-subtitle"), hero.subtitle);

      var heroImage = document.getElementById("hero-image");
      if (heroImage) {
        if (hero.image) heroImage.src = normalizePath(hero.image);
        if (hero.imageAlt) heroImage.alt = hero.imageAlt;
      }

      setText(document.getElementById("hero-cta-catalogues"), hero.ctaCatalogues);
      setText(document.getElementById("hero-cta-devis"), hero.ctaDevis);
    }

    if (data.presentation) {
      setHtml(document.getElementById("presentation-lead"), data.presentation.lead);

      var featuresWrap = document.getElementById("presentation-features");
      if (featuresWrap && data.presentation.features) {
        featuresWrap.innerHTML = "";
        data.presentation.features.forEach(function (feature) {
          var card = document.createElement("div");
          card.className = "hero-feature-card";
          card.innerHTML =
            '<div class="hero-feature-card__icon"><i data-lucide="' +
            (feature.icon || "star") +
            '" aria-hidden="true"></i></div>' +
            "<h3></h3><p></p>";
          card.querySelector("h3").textContent = feature.title || "";
          card.querySelector("p").textContent = feature.text || "";
          featuresWrap.appendChild(card);
        });
      }
    }

    if (data.catalogues) {
      setText(document.getElementById("catalogues-title"), data.catalogues.title);
      setText(document.getElementById("catalogues-intro"), data.catalogues.intro);

      var list = document.getElementById("catalogues-list");
      var items = data.catalogues.items || [];

      if (list) {
        list.innerHTML = "";
        items.forEach(function (item, index) {
          list.appendChild(buildCatalogueItem(item, index, index === 0));
        });
      }

      if (items.length) {
        var first = items[0];
        var cover = document.getElementById("catalogue-cover");
        var caption = document.getElementById("catalogue-caption");
        if (cover) {
          cover.src = normalizePath(first.image);
          cover.alt = "Couverture du catalogue " + (first.label || "");
        }
        if (caption) caption.textContent = first.label || "";
      }
    }

    if (data.engagement) {
      setText(document.getElementById("engagement-title"), data.engagement.title);

      var engagementGrid = document.getElementById("engagement-grid");
      if (engagementGrid && data.engagement.items) {
        engagementGrid.innerHTML = "";
        data.engagement.items.forEach(function (item) {
          var article = document.createElement("article");
          article.className = "engagement-item";
          article.innerHTML =
            '<div class="engagement-item__icon"><i data-lucide="' +
            (item.icon || "star") +
            '" aria-hidden="true"></i></div>' +
            "<h3></h3><p></p>";
          article.querySelector("h3").textContent = item.title || "";
          article.querySelector("p").textContent = item.text || "";
          engagementGrid.appendChild(article);
        });
      }
    }

    if (data.contact) {
      var contact = data.contact;
      setText(document.getElementById("contact-title"), contact.title);
      setText(document.getElementById("contact-intro"), contact.intro);
      setText(document.getElementById("contact-location-title"), contact.locationTitle);
      setText(document.getElementById("contact-location-text"), contact.locationText);
      setText(document.getElementById("contact-address"), contact.address);

      var phoneLink = document.getElementById("contact-phone");
      if (phoneLink) {
        phoneLink.textContent = contact.phone || "";
        if (contact.phoneLink) phoneLink.href = "tel:" + contact.phoneLink;
      }

      var mapLink = document.getElementById("contact-map");
      if (mapLink) {
        if (contact.mapUrl) mapLink.href = contact.mapUrl;
        var mapLabel = mapLink.querySelector(".contact__map-label");
        if (mapLabel) mapLabel.textContent = contact.mapLabel || "Voir sur la carte";
      }
    }

    if (data.footer) {
      setText(document.getElementById("footer-location"), data.footer.location);
      setText(document.getElementById("footer-copy"), data.footer.copyright);

      var footerPhone = document.getElementById("footer-phone");
      if (footerPhone && data.contact) {
        footerPhone.textContent = data.contact.phone || "";
        if (data.contact.phoneLink) footerPhone.href = "tel:" + data.contact.phoneLink;
      }
    }

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  function applyFooterOnly(data) {
    if (!data || !data.footer) return;

    setText(document.getElementById("footer-location"), data.footer.location);
    setText(document.getElementById("footer-copy"), data.footer.copyright);

    var footerPhone = document.getElementById("footer-phone");
    if (footerPhone && data.contact) {
      footerPhone.textContent = data.contact.phone || "";
      if (data.contact.phoneLink) footerPhone.href = "tel:" + data.contact.phoneLink;
    }
  }

  function initCataloguesIfReady() {
    if (typeof window.initCataloguesShowcase === "function") {
      window.initCataloguesShowcase();
    }
  }

  function loadContent() {
    return fetch(CONTENT_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Contenu introuvable");
        return response.json();
      })
      .catch(function () {
        return fetch(FALLBACK_URL, { cache: "no-store" }).then(function (response) {
          if (!response.ok) throw new Error("Contenu introuvable");
          return response.json();
        });
      })
      .then(function (data) {
        if (document.getElementById("hero-title")) {
          applyContent(data);
          initCataloguesIfReady();
        } else {
          applyFooterOnly(data);
        }
        return data;
      })
      .catch(function (err) {
        console.warn("[CPCR] Impossible de charger le contenu dynamique:", err);
        initCataloguesIfReady();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadContent);
  } else {
    loadContent();
  }
})();
