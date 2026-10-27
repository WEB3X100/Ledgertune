const form = document.getElementById("inquiry-form");
const statusEl = document.getElementById("form-status");
const submitButton = document.getElementById("submit-inquiry");
const hideReview = document.getElementById("hide-review");
const toggleReview = document.getElementById("toggle-review");
const reviewPanel = document.getElementById("review-panel");
const reviewStrip = document.getElementById("review-strip");
const menuToggle = document.getElementById("menu-toggle");
const header = document.getElementById("site-header");
const mobileDock = document.getElementById("mobile-dock");
const inquiry = document.getElementById("inquiry");
const hero = document.querySelector(".hero");
const formSuccess = document.getElementById("form-success");
const brandHome = document.getElementById("brand-home");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

const widgetViews = {
  collect: {
    score: "2 of 6",
    trend: "items collected",
    progress: "2 of 6 checks",
    scale: 0.33,
    items: [
      ["Bank feeds", "Ready", "status-ready"],
      ["Open bills", "Next", "status-next"],
      ["Management pack", "Next", "status-next"],
    ],
  },
  review: {
    score: "4 of 6",
    trend: "checkpoints ready",
    progress: "4 of 6 checks",
    scale: 0.67,
    items: [
      ["Bank reconciliation", "Ready", "status-ready"],
      ["Vendor bills", "Review", "status-review"],
      ["Management pack", "Next", "status-next"],
    ],
  },
  close: {
    score: "6 of 6",
    trend: "ready for pack",
    progress: "6 of 6 checks",
    scale: 1,
    items: [
      ["Bank reconciliation", "Ready", "status-ready"],
      ["Vendor bills", "Ready", "status-ready"],
      ["Management pack", "Ready", "status-ready"],
    ],
  },
};

function renderCloseWidget(viewName) {
  const view = widgetViews[viewName] || widgetViews.review;
  const score = document.getElementById("close-score");
  const trend = document.getElementById("close-trend");
  const progressCopy = document.getElementById("close-progress-copy");
  const progressBar = document.getElementById("close-progress-bar");
  if (!score || !trend || !progressCopy || !progressBar) return;

  score.textContent = view.score;
  trend.textContent = view.trend;
  progressCopy.textContent = view.progress;
  progressBar.style.transform = `scaleX(${view.scale})`;
  progressBar.style.transformOrigin = "left center";

  view.items.forEach(([label, status, className], index) => {
    const item = document.getElementById(`close-item-${index + 1}`);
    const statusNode = document.getElementById(`close-status-${index + 1}`);
    if (!item || !statusNode) return;
    item.textContent = label;
    statusNode.textContent = status;
    statusNode.className = className;
  });
}

document.querySelectorAll(".close-state").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".close-state").forEach((el) => {
      el.classList.remove("is-active");
      el.setAttribute("aria-pressed", "false");
    });
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");
    renderCloseWidget(button.getAttribute("data-state"));
  });
});

const requiredFields = [
  { name: "name", error: "name-error" },
  { name: "email", error: "email-error" },
];

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readForm() {
  const data = new FormData(form);
  return {
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    need: String(data.get("need") || "Not sure yet").trim(),
  };
}

function setStatus(message, kind) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.kind = kind || "ok";
}

function showError(id, on) {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = !on;
}

function clearErrors() {
  requiredFields.forEach((field) => {
    const input = form?.elements[field.name];
    input?.closest(".field")?.classList.remove("is-invalid");
    input?.setAttribute("aria-invalid", "false");
    showError(field.error, false);
  });
}

function validate() {
  const values = readForm();
  clearErrors();
  let firstInvalid = null;
  requiredFields.forEach((field) => {
    const input = form.elements[field.name];
    const empty = !values[field.name];
    const badEmail = field.name === "email" && values.email && !isEmail(values.email);
    if (!empty && !badEmail) return;
    input?.closest(".field")?.classList.add("is-invalid");
    input?.setAttribute("aria-invalid", "true");
    showError(field.error, true);
    firstInvalid = firstInvalid || input;
  });
  return { values, firstInvalid };
}

function markSent() {
  form.classList.add("is-sent");
  if (formSuccess) formSuccess.hidden = false;
  submitButton.disabled = true;
  setStatus("Request saved on this device. No email was sent.", "ok");
}

document.querySelectorAll("[data-cta]").forEach((el) => {
  el.addEventListener("click", () => {
    emit("fit_check_cta_click", { placement: el.getAttribute("data-cta") });
  });
});

form?.addEventListener("focusin", function onStart() {
  emit("fit_check_form_start", { placement: "inquiry" });
  form.removeEventListener("focusin", onStart);
});

const headerFormWrap = document.getElementById("header-form");
const openHeaderForm = document.getElementById("open-header-form");
const headerForm = document.getElementById("header-inquiry-form");
const headerStatus = document.getElementById("header-form-status");
openHeaderForm?.addEventListener("click", () => {
  const open = headerFormWrap.hasAttribute("hidden");
  headerFormWrap.hidden = !open;
  openHeaderForm.setAttribute("aria-expanded", String(open));
  if (open) {
    header?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    headerForm?.elements.name?.focus();
  }
});
headerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(headerForm);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const need = String(data.get("need") || "Not sure yet").trim();
  headerForm.querySelectorAll("input").forEach((input) => input.setAttribute("aria-invalid", "false"));
  if (!name || !isEmail(email)) {
    if (!name) headerForm.elements.name.setAttribute("aria-invalid", "true");
    if (!isEmail(email)) headerForm.elements.email.setAttribute("aria-invalid", "true");
    headerStatus.textContent = "Add your name and a work email.";
    return;
  }
  try {
    window.localStorage.setItem(
      "qbo-fit-check-preview",
      JSON.stringify({ name, email, need, savedAt: new Date().toISOString(), placement: "header" })
    );
  } catch { /* preview still confirms */ }
  headerStatus.textContent = "Request saved on this device. No email was sent.";
  headerForm.reset();
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const { values, firstInvalid } = validate();
  if (firstInvalid) {
    setStatus("Fix the highlighted fields, then submit.", "error");
    firstInvalid.focus();
    return;
  }
  emit("fit_check_submit_attempt", { need: values.need });
  try {
    window.localStorage.setItem(
      "qbo-fit-check-preview",
      JSON.stringify({ ...values, savedAt: new Date().toISOString() })
    );
  } catch {
    /* local preview still succeeds without persistence */
  }
  markSent();
  emit("fit_check_submit_success", { destination: "local-preview" });
});

toggleReview?.addEventListener("click", () => {
  const open = reviewPanel.hasAttribute("hidden");
  reviewPanel.hidden = !open;
  toggleReview.setAttribute("aria-expanded", String(open));
});

hideReview?.addEventListener("click", () => {
  reviewStrip.hidden = true;
});

menuToggle?.addEventListener("click", () => {
  const open = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
  if (open && headerFormWrap) {
    headerFormWrap.hidden = true;
    openHeaderForm?.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll("#site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

function goTop(event) {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  history.replaceState(null, "", `${location.pathname}${location.search}#top`);
}

brandHome?.addEventListener("click", goTop);

if (location.hash === "#top") {
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", () => {
  if (location.hash === "#top") window.scrollTo(0, 0);
});

document.querySelectorAll("[data-need]").forEach((link) => {
  link.addEventListener("click", () => {
    const need = link.getAttribute("data-need");
    if (form?.need && need) {
      const option = [...form.need.options].find((el) => el.value === need);
      if (option) form.need.value = need;
    }
    window.setTimeout(() => form?.elements.name?.focus(), 200);
  });
});

const navLinks = [...document.querySelectorAll('#site-nav a[href^="#"]')];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (sections.length && "IntersectionObserver" in window) {
  const navWatch = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
  );
  sections.forEach((section) => navWatch.observe(section));
}

const updateDock = () => {
  if (!mobileDock || !hero || !inquiry) return;
  if (window.matchMedia("(min-width: 981px)").matches) {
    mobileDock.classList.add("is-hidden");
    return;
  }
  const heroVisible = hero.getBoundingClientRect().bottom > 72;
  const inquiryVisible = inquiry.getBoundingClientRect().top < window.innerHeight - 48;
  mobileDock.classList.toggle("is-hidden", heroVisible || inquiryVisible);
};
window.addEventListener("scroll", updateDock, { passive: true });
window.addEventListener("resize", updateDock);
updateDock();

const query = new URLSearchParams(window.location.search);
const localReview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
if (reviewStrip) reviewStrip.hidden = query.get("review") !== "1";

if ("IntersectionObserver" in window) {
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      });
    },
    { threshold: 0.2 }
  );
  document.querySelectorAll("[data-reveal]").forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.12}s`;
    reveal.observe(el);
  });
} else {
  document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
}

renderCloseWidget("review");

const helpDeck = document.querySelector("[data-help-deck]");
if (helpDeck) {
  const tabs = [...helpDeck.querySelectorAll("[data-help]")];
  const panels = [...helpDeck.querySelectorAll("[data-help-panel]")];
  const track = helpDeck.querySelector("[data-help-track]");
  const status = helpDeck.querySelector("[data-help-status]");
  const stage = helpDeck.querySelector(".help-stage");
  const labels = ["Reports", "Classes", "Workflows", "Permissions", "Close review", "Management pack"];
  let index = 0;
  let startX = 0;
  let dragging = false;

  const show = (nextIndex) => {
    index = (nextIndex + panels.length) % panels.length;
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
    });
    if (status) status.textContent = `${index + 1} of 6 · ${labels[index]}`;
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => show(Number(tab.getAttribute("data-help"))));
  });
  helpDeck.querySelector("[data-help-prev]")?.addEventListener("click", () => show(index - 1));
  helpDeck.querySelector("[data-help-next]")?.addEventListener("click", () => show(index + 1));
  helpDeck.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") show(index + 1);
    if (event.key === "ArrowLeft") show(index - 1);
  });

  const onDown = (event) => {
    dragging = true;
    startX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
  };
  const onUp = (event) => {
    if (!dragging) return;
    dragging = false;
    const endX = event.clientX ?? event.changedTouches?.[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (delta < -40) show(index + 1);
    if (delta > 40) show(index - 1);
  };
  stage?.addEventListener("pointerdown", onDown);
  stage?.addEventListener("pointerup", onUp);
  stage?.addEventListener("pointercancel", () => {
    dragging = false;
  });
  show(0);
}

const tstack = document.querySelector("[data-tstack]");
if (tstack) {
  const cards = [...tstack.querySelectorAll("[data-tstack-card]")];
  const dotsWrap = tstack.querySelector("[data-tstack-dots]");
  const total = cards.length;
  let active = 0;
  let dragging = false;
  let startX = 0;
  let offset = 0;

  cards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "tstack-dot";
    dot.setAttribute("aria-label", `Quote ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    dotsWrap?.append(dot);
  });
  const dots = [...(dotsWrap?.querySelectorAll(".tstack-dot") || [])];

  const layout = () => {
    cards.forEach((card, i) => {
      const order = (i - active + total) % total;
      card.classList.toggle("is-dragging", dragging && order === 0);
      if (order === 0) {
        card.style.transform = `translateX(${offset}px)`;
        card.style.opacity = "1";
        card.style.zIndex = String(total);
      } else if (order <= 2) {
        card.style.transform = `scale(${1 - 0.05 * order}) translateY(${-1.6 * order}rem)`;
        card.style.opacity = String(1 - 0.18 * order);
        card.style.zIndex = String(total - order);
      } else {
        card.style.transform = "scale(0.9)";
        card.style.opacity = "0";
        card.style.zIndex = "0";
      }
    });
    dots.forEach((dot, i) => dot.classList.toggle("is-on", i === active));
  };

  const go = (next) => {
    active = (next + total) % total;
    offset = 0;
    dragging = false;
    layout();
  };

  cards.forEach((card, i) => {
    const start = (event) => {
      if ((i - active + total) % total !== 0) return;
      dragging = true;
      startX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
    };
    card.addEventListener("pointerdown", start);
  });
  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    offset = event.clientX - startX;
    layout();
  });
  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    if (Math.abs(offset) > 50) go(active + (offset < 0 ? 1 : -1));
    else go(active);
  });
  layout();
}
