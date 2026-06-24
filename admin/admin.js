(function () {
  "use strict";

  var API = "/.netlify/functions/admin-api";
  var TOKEN_KEY = "cpcr_admin_token";
  var content = null;
  var dragSrcIndex = null;

  var loginScreen = document.getElementById("login-screen");
  var adminApp = document.getElementById("admin-app");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");
  var adminStatus = document.getElementById("admin-status");
  var cataloguesEditor = document.getElementById("catalogues-editor");
  var featuresEditor = document.getElementById("presentation-features-editor");
  var engagementEditor = document.getElementById("engagement-items-editor");

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function api(action, options) {
    options = options || {};
    var url = API + "?action=" + encodeURIComponent(action);
    var fetchOptions = {
      method: options.method || "GET",
      credentials: "same-origin",
    };
    var headers = {};
    var token = getToken();
    if (token && action !== "login") {
      headers.Authorization = "Bearer " + token;
    }
    if (options.body) {
      headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(options.body);
    }
    if (Object.keys(headers).length) {
      fetchOptions.headers = headers;
    }
    return fetch(url, fetchOptions).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Erreur serveur");
        return data;
      });
    });
  }

  function getByPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function setByPath(obj, path, value) {
    var keys = path.split(".");
    var current = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  function showStatus(message, type) {
    adminStatus.textContent = message;
    adminStatus.hidden = false;
    adminStatus.className = "admin-status is-" + type;
    window.clearTimeout(showStatus._timer);
    showStatus._timer = window.setTimeout(function () {
      adminStatus.hidden = true;
    }, 5000);
  }

  function showLogin() {
    document.body.classList.remove("is-authenticated");
    document.body.classList.add("is-login-locked");
    loginScreen.hidden = false;
    adminApp.hidden = true;
  }

  function showAdmin() {
    document.body.classList.add("is-authenticated");
    document.body.classList.remove("is-login-locked");
    loginScreen.hidden = true;
    adminApp.hidden = false;
  }

  function normalizeImagePath(path) {
    if (!path) return "";
    return "../" + String(path).replace(/\\/g, "/").replace(/^\//, "");
  }

  function updateImagePreview(img, path) {
    if (!img) return;
    if (path) {
      img.src = normalizeImagePath(path);
      img.hidden = false;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
    }
  }

  function bindSimpleFields() {
    document.querySelectorAll("[data-path]").forEach(function (el) {
      var path = el.getAttribute("data-path");
      el.value = getByPath(content, path) || "";
      el.addEventListener("input", function () {
        setByPath(content, path, el.value);
      });
    });

    document.querySelectorAll("[data-lines]").forEach(function (el) {
      var path = el.getAttribute("data-lines");
      var lines = getByPath(content, path) || [];
      el.value = lines.join("\n");
      el.addEventListener("input", function () {
        setByPath(
          content,
          path,
          el.value.split("\n").map(function (line) {
            return line.trim();
          }).filter(Boolean)
        );
      });
    });

    updateImagePreview(document.getElementById("hero-image-preview"), content.hero && content.hero.image);
  }

  function renderFeatureEditors() {
    featuresEditor.innerHTML = "";
    (content.presentation.features || []).forEach(function (feature, index) {
      var block = document.createElement("div");
      block.className = "feature-editor";
      block.innerHTML =
        "<h4>Point " + (index + 1) + "</h4>" +
        '<div class="field"><label>Titre</label><input type="text" data-feature-title /></div>' +
        '<div class="field"><label>Texte</label><textarea rows="2" data-feature-text></textarea></div>';
      block.querySelector("[data-feature-title]").value = feature.title || "";
      block.querySelector("[data-feature-text]").value = feature.text || "";
      block.querySelector("[data-feature-title]").addEventListener("input", function (e) {
        content.presentation.features[index].title = e.target.value;
      });
      block.querySelector("[data-feature-text]").addEventListener("input", function (e) {
        content.presentation.features[index].text = e.target.value;
      });
      featuresEditor.appendChild(block);
    });
  }

  function renderEngagementEditors() {
    engagementEditor.innerHTML = "";
    (content.engagement.items || []).forEach(function (item, index) {
      var block = document.createElement("div");
      block.className = "engagement-editor";
      block.innerHTML =
        "<h4>Engagement " + (index + 1) + "</h4>" +
        '<div class="field"><label>Titre</label><input type="text" data-eng-title /></div>' +
        '<div class="field"><label>Texte</label><textarea rows="2" data-eng-text></textarea></div>';
      block.querySelector("[data-eng-title]").value = item.title || "";
      block.querySelector("[data-eng-text]").value = item.text || "";
      block.querySelector("[data-eng-title]").addEventListener("input", function (e) {
        content.engagement.items[index].title = e.target.value;
      });
      block.querySelector("[data-eng-text]").addEventListener("input", function (e) {
        content.engagement.items[index].text = e.target.value;
      });
      engagementEditor.appendChild(block);
    });
  }

  function renderCatalogueItem(item, index) {
    var el = document.createElement("div");
    el.className = "catalogue-item";
    el.draggable = true;
    el.dataset.index = String(index);

    el.innerHTML =
      '<button type="button" class="catalogue-item__handle" title="Glisser pour réordonner" aria-label="Réordonner">⠿</button>' +
      '<div class="catalogue-item__body">' +
      '<div class="field"><label>Nom du catalogue</label><input type="text" data-cat-label /></div>' +
      '<div class="field"><label>Pictogramme</label><input type="text" data-cat-icon placeholder="leaf, shirt, globe…" /><p class="field-hint">Nom d’icône Lucide — voir <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer">lucide.dev/icons</a></p></div>' +
      '<div class="field"><label>Lien du catalogue</label><input type="url" data-cat-url placeholder="https://..." /></div>' +
      '<div class="field"><label>Image de couverture</label>' +
      '<div class="catalogue-item__image-row">' +
      '<img class="catalogue-item__preview" alt="" />' +
      '<input type="text" data-cat-image placeholder="images/..." />' +
      '<label class="btn btn--outline btn--sm">Envoyer une image<input type="file" accept="image/*" data-cat-upload hidden /></label>' +
      "</div></div></div>" +
      '<button type="button" class="catalogue-item__remove">Supprimer</button>';

    el.querySelector("[data-cat-label]").value = item.label || "";
    el.querySelector("[data-cat-icon]").value = item.icon || "";
    el.querySelector("[data-cat-url]").value = item.url || "";
    el.querySelector("[data-cat-image]").value = item.image || "";
    updateImagePreview(el.querySelector(".catalogue-item__preview"), item.image);

    el.querySelector("[data-cat-label]").addEventListener("input", function (e) {
      content.catalogues.items[index].label = e.target.value;
    });
    el.querySelector("[data-cat-icon]").addEventListener("input", function (e) {
      content.catalogues.items[index].icon = e.target.value;
    });
    el.querySelector("[data-cat-url]").addEventListener("input", function (e) {
      content.catalogues.items[index].url = e.target.value;
    });
    el.querySelector("[data-cat-image]").addEventListener("input", function (e) {
      content.catalogues.items[index].image = e.target.value;
      updateImagePreview(el.querySelector(".catalogue-item__preview"), e.target.value);
    });

    el.querySelector("[data-cat-upload]").addEventListener("change", function (e) {
      uploadImage(e.target.files[0], function (path) {
        content.catalogues.items[index].image = path;
        el.querySelector("[data-cat-image]").value = path;
        updateImagePreview(el.querySelector(".catalogue-item__preview"), path);
      });
      e.target.value = "";
    });

    el.querySelector(".catalogue-item__remove").addEventListener("click", function () {
      if (!window.confirm("Supprimer ce catalogue ?")) return;
      content.catalogues.items.splice(index, 1);
      renderCataloguesEditor();
    });

    el.addEventListener("dragstart", function () {
      dragSrcIndex = index;
      el.classList.add("is-dragging");
    });
    el.addEventListener("dragend", function () {
      el.classList.remove("is-dragging");
      dragSrcIndex = null;
    });
    el.addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    el.addEventListener("drop", function (e) {
      e.preventDefault();
      var targetIndex = Number(el.dataset.index);
      if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;
      var moved = content.catalogues.items.splice(dragSrcIndex, 1)[0];
      content.catalogues.items.splice(targetIndex, 0, moved);
      renderCataloguesEditor();
    });

    return el;
  }

  function renderCataloguesEditor() {
    cataloguesEditor.innerHTML = "";
    (content.catalogues.items || []).forEach(function (item, index) {
      cataloguesEditor.appendChild(renderCatalogueItem(item, index));
    });
  }

  function populateForm() {
    bindSimpleFields();
    renderFeatureEditors();
    renderEngagementEditors();
    renderCataloguesEditor();
  }

  function uploadImage(file, callback) {
    if (!file) return;
    showStatus("Envoi de l'image en cours…", "success");
    var reader = new FileReader();
    reader.onload = function () {
      var result = reader.result || "";
      var base64 = result.split(",")[1] || "";
      api("upload", {
        method: "POST",
        body: {
          filename: file.name,
          mime: file.type,
          data: base64,
        },
      })
        .then(function (data) {
          callback(data.path);
          showStatus("Image envoyée avec succès.", "success");
        })
        .catch(function (err) {
          showStatus(err.message, "error");
        });
    };
    reader.onerror = function () {
      showStatus("Impossible de lire l'image.", "error");
    };
    reader.readAsDataURL(file);
  }

  function bindUploads() {
    document.querySelectorAll("[data-upload-target]").forEach(function (input) {
      input.addEventListener("change", function (e) {
        var path = input.getAttribute("data-upload-target");
        uploadImage(e.target.files[0], function (imagePath) {
          setByPath(content, path, imagePath);
          var field = document.querySelector('[data-path="' + path + '"]');
          if (field) field.value = imagePath;
          if (path === "hero.image") {
            updateImagePreview(document.getElementById("hero-image-preview"), imagePath);
          }
        });
        e.target.value = "";
      });
    });
  }

  function saveContent() {
    showStatus("Enregistrement en cours…", "success");
    return api("save", { method: "POST", body: { data: content } })
      .then(function (data) {
        showStatus(data.message || "Modifications enregistrées.", "success");
      })
      .catch(function (err) {
        showStatus(err.message, "error");
      });
  }

  function loadContent() {
    return api("get").then(function (response) {
      content = response.data;
      populateForm();
      bindUploads();
    });
  }

  function initTabs() {
    var tabs = document.querySelectorAll(".admin-tabs__btn");
    var panels = document.querySelectorAll(".admin-panel");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        tabs.forEach(function (t) {
          t.classList.toggle("is-active", t === tab);
        });
        panels.forEach(function (panel) {
          var active = panel.getAttribute("data-panel") === name;
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        });
      });
    });
  }

  function checkAuth() {
    return api("check")
      .then(function (data) {
        if (data.authenticated) {
          showAdmin();
          return loadContent();
        }
        showLogin();
      })
      .catch(function () {
        showLogin();
      });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var password = document.getElementById("login-password").value;
    api("login", { method: "POST", body: { password: password } })
      .then(function (data) {
        setToken(data.token);
        document.getElementById("login-password").value = "";
        showAdmin();
        return loadContent();
      })
      .catch(function (err) {
        loginError.textContent = err.message;
        loginError.hidden = false;
      });
  });

  document.getElementById("btn-logout").addEventListener("click", function () {
    setToken("");
    api("logout", { method: "POST" }).finally(showLogin);
  });

  document.getElementById("btn-save").addEventListener("click", saveContent);
  document.getElementById("btn-save-bottom").addEventListener("click", saveContent);

  document.getElementById("btn-add-catalogue").addEventListener("click", function () {
    if (!content.catalogues.items) content.catalogues.items = [];
    content.catalogues.items.push({
      label: "Nouveau catalogue",
      icon: "book-open",
      image: "",
      url: "",
    });
    renderCataloguesEditor();
  });

  initTabs();
  checkAuth();
})();
