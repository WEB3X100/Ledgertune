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
const closeView = document.getElementById("close-view");
const formSuccess = document.getElementById("form-success");

const widgetViews = {
  close: {
    score: "4 of 6",
    trend: "checkpoints ready",
    progress: "67% complete",
    width: "67%",
    items: [
      ["Bank reconciliation", "Ready", "status-ready"],
      ["Vendor bills", "Review", "status-review"],
      ["Management pack", "Next", "status-next"],
    ],
  },
  cash: {
    score: "2 of 3",
    trend: "accounts in view",
    progress: "67% connected",
    width: "67%",
    items: [
      ["Operating account", "Synced", "status-ready"],
      ["Credit card", "Review", "status-review"],
      ["13-week forecast", "Next", "status-next"],
    ],
  },
};

function renderCloseWidget(viewName) {
  const view = widgetViews[viewName] || widgetViews.close;
  const score = document.getElementById("close-score");
  const trend = document.getElementById("close-trend");
  const progressCopy = document.getElementById("close-progress-copy");
  const progressBar = document.getElementById("close-progress-bar");
  if (!score || !trend || !progressCopy || !progressBar) return;

  score.textContent = view.score;
  trend.textContent = view.trend;
  progressCopy.textContent = view.progress;
  progressBar.style.width = view.width;

  view.items.forEach(([label, status, className], index) => {
    const item = document.getElementById(`close-item-${index + 1}`);
    const statusNode = document.getElementById(`close-status-${index + 1}`);
    if (!item || !statusNode) return;
    item.textContent = label;
    statusNode.textContent = status;
    statusNode.className = className;
  });
}

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
    const input = form.elements[field.name];
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

function encodeForm(values) {
  const body = new URLSearchParams();
  body.set("form-name", "consultation");
  body.set("name", values.name);
  body.set("email", values.email);
  body.set("need", values.need);
  return body.toString();
}

async function submitInquiry(values) {
  const payload = {
    name: values.name,
    email: values.email,
    need: values.need,
    source: "neuralsync-qbo-consultation",
  };

  try {
    const local = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (local.ok) return true;
  } catch {
    /* Fall through to Netlify static form post. */
  }

  const hosted = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodeForm(values),
  });
  if (!hosted.ok) throw new Error("form-post-failed");
  return true;
}

function markSent() {
  form.classList.add("is-sent");
  if (formSuccess) formSuccess.hidden = false;
  submitButton.disabled = true;
  setStatus("Consultation request received. We will email you to schedule the 30-minute call.", "ok");
}

form.addEventListener("change", () => {
  if (statusEl.dataset.kind === "error") clearErrors();
});

closeView?.addEventListener("change", () => {
  renderCloseWidget(closeView.value);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { values, firstInvalid } = validate();
  if (firstInvalid) {
    setStatus("Fix the highlighted fields, then request the consultation.", "error");
    firstInvalid.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending request...";
  setStatus("Sending your consultation request.");

  try {
    await submitInquiry(values);
    markSent();
  } catch {
    submitButton.disabled = false;
    submitButton.textContent = "Request a consultation";
    setStatus("The request did not send. Email info@neuralsync.ca and we will schedule the call.", "error");
  }
});

toggleReview?.addEventListener("click", () => {
  const open = reviewPanel.hasAttribute("hidden");
  reviewPanel.hidden = !open;
  toggleReview.setAttribute("aria-expanded", String(open));
});

hideReview?.addEventListener("click", () => {
  reviewStrip.hidden = true;
});

menuToggle.addEventListener("click", () => {
  const open = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-need]").forEach((link) => {
  link.addEventListener("click", () => {
    const need = link.getAttribute("data-need");
    if (form.need && need) {
      const option = [...form.need.options].find((el) => el.value === need);
      if (option) form.need.value = need;
      link.closest("article")?.classList.add("is-chosen");
    }
    clearErrors();
    window.setTimeout(() => form.elements.name.focus(), 200);
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

  const updateDock = () => {
    if (window.matchMedia("(min-width: 981px)").matches) {
      mobileDock.classList.add("is-hidden");
      return;
    }
    const heroVisible = Boolean(hero && hero.getBoundingClientRect().bottom > 72);
    const inquiryVisible = inquiry.getBoundingClientRect().top < window.innerHeight - 48;
    mobileDock.classList.toggle("is-hidden", heroVisible || inquiryVisible);
  };
  window.addEventListener("scroll", updateDock, { passive: true });
  window.addEventListener("resize", updateDock);
  updateDock();
}

const query = new URLSearchParams(window.location.search);
const localReview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
reviewStrip.hidden = !(localReview || query.get("review") === "1");

renderCloseWidget(closeView?.value || "close");
