(() => {
  "use strict";

  const shell = document.getElementById("prototype-shell");
  const viewButtons = [...document.querySelectorAll("[data-view]")];
  const views = [...document.querySelectorAll("[data-screen]")];
  const deviceToggle = document.getElementById("device-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const motionToggle = document.getElementById("motion-toggle");
  const densitySelect = document.getElementById("density-select");
  const viewportName = document.getElementById("viewport-name");
  const toast = document.getElementById("prototype-toast");
  const transferModal = document.getElementById("transfer-modal");
  const consentModal = document.getElementById("consent-modal");
  const draftConfirm = document.getElementById("draft-confirm");
  const confirmTransfer = document.getElementById("confirm-transfer");
  const transferSuccess = document.getElementById("transfer-success");
  const progressBar = document.getElementById("reading-progress-bar");
  let activeView = "home";
  let priorFocus = null;
  let toastTimer = 0;
  let transferTimer = 0;

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function setView(name, { moveFocus = true } = {}) {
    const target = views.find((view) => view.dataset.screen === name);
    if (!target) return;
    activeView = name;
    views.forEach((view) => {
      const selected = view === target;
      view.hidden = !selected;
      view.classList.toggle("is-active", selected);
    });
    viewButtons.forEach((button) => {
      const selected = button.dataset.view === name;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    shell.scrollIntoView({ behavior: document.body.classList.contains("reduce-motion") ? "auto" : "smooth", block: "start" });
    if (moveFocus) {
      window.setTimeout(() => target.focus?.({ preventScroll: true }), 20);
    }
    updateReadingProgress();
  }

  viewButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelectorAll("[data-view-jump]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.viewJump)));

  deviceToggle.addEventListener("click", () => {
    const isMobile = shell.classList.toggle("is-mobile");
    deviceToggle.setAttribute("aria-pressed", String(isMobile));
    deviceToggle.textContent = isMobile ? "Desktop" : "Mobile";
    viewportName.textContent = isMobile ? "390 mobile" : "1440 desktop";
    showToast(isMobile ? "Mobile composition: 390px" : "Desktop composition: responsive shell");
  });

  themeToggle.addEventListener("click", () => {
    const night = document.body.classList.toggle("night-mode");
    themeToggle.setAttribute("aria-pressed", String(night));
    themeToggle.textContent = night ? "Day" : "Night";
    showToast(night ? "Archival night palette enabled" : "Newsprint day palette enabled");
  });

  motionToggle.addEventListener("click", () => {
    const reduced = document.body.classList.toggle("reduce-motion");
    motionToggle.setAttribute("aria-pressed", String(reduced));
    motionToggle.textContent = reduced ? "Still" : "Motion";
    showToast(reduced ? "Motion reduced; static art fallback active" : "Lightweight motion enabled");
  });

  densitySelect.addEventListener("change", () => {
    const revenue = densitySelect.value === "revenue";
    shell.classList.toggle("density-revenue", revenue);
    showToast(revenue ? "Revenue load: one additional reserved slot on long pages" : "Standard load: premium restrained placement map");
  });

  function openModal(modal) {
    priorFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => modal.querySelector(".modal-close")?.focus(), 10);
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.style.overflow = "";
    priorFocus?.focus?.();
  }

  document.querySelectorAll("[data-open-consent]").forEach((button) => button.addEventListener("click", () => openModal(consentModal)));
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop"))));
  [transferModal, consentModal].forEach((modal) => modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  }));

  function openTransfer() {
    window.clearTimeout(transferTimer);
    draftConfirm.checked = false;
    confirmTransfer.disabled = true;
    confirmTransfer.innerHTML = "Stage review draft <span>↗</span>";
    transferSuccess.hidden = true;
    openModal(transferModal);
  }

  document.getElementById("open-transfer").addEventListener("click", openTransfer);
  document.getElementById("rail-transfer").addEventListener("click", openTransfer);
  draftConfirm.addEventListener("change", () => { confirmTransfer.disabled = !draftConfirm.checked; });
  confirmTransfer.addEventListener("click", () => {
    if (!draftConfirm.checked) return;
    confirmTransfer.disabled = true;
    confirmTransfer.textContent = "Signing and staging…";
    transferTimer = window.setTimeout(() => {
      confirmTransfer.textContent = "Draft staged";
      transferSuccess.hidden = false;
      transferSuccess.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 850);
  });
  document.getElementById("jump-admin").addEventListener("click", () => {
    closeModal(transferModal);
    setView("admin");
    showToast("Opened Payload review queue · draft remains unpublished");
  });
  document.getElementById("open-admin-draft").addEventListener("click", () => showToast("Draft HR-2026-0716 opened · publishing gate is still locked"));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!transferModal.hidden) closeModal(transferModal);
    if (!consentModal.hidden) closeModal(consentModal);
  });

  document.querySelectorAll('a[href="#"]').forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Prototype link · destination specified in the engineering blueprint");
  }));
  document.querySelectorAll(".city-tabs button, .city-cloud button").forEach((button) => button.addEventListener("click", () => {
    const group = button.closest(".city-tabs");
    if (group) group.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    showToast(`${button.textContent.trim()} edition selected`);
  }));
  document.querySelectorAll(".menu-button").forEach((button) => button.addEventListener("click", () => showToast("Sections drawer · mobile and keyboard behavior specified in blueprint")));
  document.querySelectorAll(".mobile-anchor button").forEach((button) => button.addEventListener("click", () => {
    button.closest(".mobile-anchor").style.display = "none";
    showToast("Mobile anchor dismissed for this session");
  }));

  function updateReadingProgress() {
    if (activeView !== "article" || !progressBar) {
      if (progressBar) progressBar.style.width = "0%";
      return;
    }
    const article = document.querySelector('[data-screen="article"] .article-wrap');
    if (!article) return;
    const rect = article.getBoundingClientRect();
    const total = Math.max(1, article.offsetHeight - window.innerHeight);
    const traveled = Math.min(total, Math.max(0, -rect.top + 70));
    progressBar.style.width = `${Math.round((traveled / total) * 100)}%`;
  }
  window.addEventListener("scroll", updateReadingProgress, { passive: true });

  // VFX lens: a very small pointer parallax. It never changes content position,
  // is disabled under reduced motion, and uses one rAF-updated transform.
  const hero = document.querySelector(".cinematic-hero");
  const heroArt = hero?.querySelector(".hero-art");
  let parallaxFrame = 0;
  hero?.addEventListener("pointermove", (event) => {
    if (!heroArt || document.body.classList.contains("reduce-motion") || shell.classList.contains("is-mobile")) return;
    window.cancelAnimationFrame(parallaxFrame);
    parallaxFrame = window.requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 5;
      heroArt.style.transform = `scale(1.045) translate(${x}px, ${y}px)`;
    });
  });
  hero?.addEventListener("pointerleave", () => { if (heroArt) heroArt.style.transform = ""; });

  setView("home", { moveFocus: false });
})();
