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
const diagnosticForm = document.getElementById("diagnostic-form");
const hero = document.querySelector(".hero");
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
  { name: "company", error: "company-error" },
  { name: "email", error: "email-error" },
];

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readForm() {
  const data = new FormData(form);
  return {
    name: String(data.get("name") || "").trim(),
    company: String(data.get("company") || "").trim(),
    email: String(data.get("email") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
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

document.querySelectorAll("[data-cta]").forEach((el) => {
  el.addEventListener("click", () => {
    emit("fit_check_cta_click", { placement: el.getAttribute("data-cta") });
  });
});

form?.addEventListener("focusin", function onStart() {
  emit("fit_check_form_start", { placement: "diagnostic-form" });
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
  const data = new FormData(headerForm);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  headerForm.querySelectorAll("input").forEach((input) => input.setAttribute("aria-invalid", "false"));
  if (!name || !isEmail(email)) {
    event.preventDefault();
    if (!name) headerForm.elements.name.setAttribute("aria-invalid", "true");
    if (!isEmail(email)) headerForm.elements.email.setAttribute("aria-invalid", "true");
    headerStatus.textContent = "Add your name and a work email.";
    return;
  }
  // Valid: let the browser submit natively — Netlify Forms handles delivery.
  headerStatus.textContent = "Sending…";
});

form?.addEventListener("submit", (event) => {
  const { values, firstInvalid } = validate();
  if (firstInvalid) {
    event.preventDefault();
    setStatus("Fix the highlighted fields, then submit.", "error");
    firstInvalid.focus();
    return;
  }
  emit("fit_check_submit_attempt", { need: values.need });
  // Valid: let the browser submit natively — Netlify Forms handles delivery.
  // On localhost there is no Netlify, so a submit there will not send email.
  submitButton.disabled = true;
  setStatus("Sending…", "ok");
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

// Services dropdown (Round 2): click toggles on desktop; hover/focus also opens it.
document.querySelectorAll(".nav-drop-btn").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    const wrap = btn.closest(".nav-drop-wrap");
    const open = wrap.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });
});
document.addEventListener("click", () => {
  document.querySelectorAll(".nav-drop-wrap.is-open").forEach((wrap) => {
    wrap.classList.remove("is-open");
    wrap.querySelector(".nav-drop-btn")?.setAttribute("aria-expanded", "false");
  });
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
  if (!mobileDock || !hero || !diagnosticForm) return;
  if (window.matchMedia("(min-width: 981px)").matches) {
    mobileDock.classList.add("is-hidden");
    return;
  }
  const heroVisible = hero.getBoundingClientRect().bottom > 72;
  const diagnosticVisible = diagnosticForm.getBoundingClientRect().top < window.innerHeight - 48;
  mobileDock.classList.toggle("is-hidden", heroVisible || diagnosticVisible);
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

// Process flow 1 → 5: arm the animation, then play it once when the
// section scrolls into view. Gold fill grows left to right; each numbered
// circle turns gold in turn. Without IntersectionObserver, show the
// finished state immediately so nothing stays hidden.
const flowSteps = document.querySelector(".lt-steps");
if (flowSteps) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    flowSteps.classList.add("is-in");
  } else if ("IntersectionObserver" in window) {
    flowSteps.classList.add("lt-armed");
    const flowWatch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          flowSteps.classList.add("is-in");
          flowWatch.unobserve(flowSteps);
        });
      },
      { threshold: 0.3 }
    );
    flowWatch.observe(flowSteps);
  } else {
    flowSteps.classList.add("is-in");
  }
}

// Before / after cards: left card first, its X items pop 1 by 1, then the
// right card, its check items pop 1 by 1. Same arm-then-observe pattern as
// the process flow, so with no IntersectionObserver the finished state
// shows immediately and nothing stays hidden.
const shift = document.querySelector(".lt-shift");
if (shift) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    shift.classList.add("is-in");
  } else if ("IntersectionObserver" in window) {
    shift.classList.add("lt-armed");
    const shiftWatch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          shift.classList.add("is-in");
          shiftWatch.unobserve(shift);
        });
      },
      { threshold: 0.25 }
    );
    shiftWatch.observe(shift);
  } else {
    shift.classList.add("is-in");
  }
}

// Hero check items: rise in order, one by one, on load. The hero is
// already in view, so no observer — arm the list, then play it on the
// next frame. Reduced motion or no JS leaves the finished state.
const heroMarks = document.querySelector(".lt-marks");
if (heroMarks) {
  if (reduceMotion) {
    heroMarks.classList.add("is-in");
  } else {
    heroMarks.classList.add("lt-armed");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => heroMarks.classList.add("is-in"));
    });
  }
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

// Hersom services: move the glow to whichever card is hovered / tapped / focused.
// CSS :hover does it instantly; this keeps it on the last hovered card.
(function () {
  var cards = document.querySelectorAll("#services .lt-card");
  function activate(card) {
    cards.forEach(function (c) { c.classList.remove("lt-featured"); });
    card.classList.add("lt-featured");
  }
  cards.forEach(function (card) {
    card.addEventListener("mouseenter", function () { activate(card); });
    card.addEventListener("focusin", function () { activate(card); });
    card.addEventListener("click", function () { activate(card); });
  });
})();

// Hero flowing table + spending donut + profit bars + mini calculator.
// One data model drives all four: the 12 months cycle through the feed,
// the donut centre shows the top month's net profit, the bars show each
// month's profit, and the calculator rescales everything. Reduced motion
// or no JS shows the full static 12-row table instead.
(function () {
  var card = document.querySelector(".lt-flow");
  if (!card) return;
  var list = card.querySelector(".lt-flow-list");
  if (!list || !list.children.length) return;
  var SHAPE = [46, 52, 40, 61, 48, 70, 58, 74, 63, 80, 68, 86];
  var SHAPE_SUM = 746;
  var SPEND = 4136.67 + 2190 + 1946.67 + 2433.33 + 1460; // $12,166.67 / month
  var DEF_REV = 40000, DEF_COST = 22500;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var months = Array.prototype.map.call(list.children, function (li, i) {
    return { m: li.querySelector(".lt-flow-m").textContent, alt: i % 2 === 1 };
  });
  var totRev = card.querySelector("#lt-flow-tot-rev");
  var totCost = card.querySelector("#lt-flow-tot-cost");
  var totProfit = card.querySelector("#lt-flow-tot-profit");
  var centreVal = card.querySelector("#lt-flow-centre-val");
  var centreMonth = card.querySelector("#lt-flow-centre-month");
  var bars = Array.prototype.slice.call(card.querySelectorAll(".lt-flow-barfill"));
  var barlabs = Array.prototype.slice.call(card.querySelectorAll(".lt-flow-barlabs span"));
  var revInput = card.querySelector("#lt-flow-rev");
  var costInput = card.querySelector("#lt-flow-cost");
  var resetBtn = card.querySelector(".lt-flow-reset");

  var next = 6;
  var shifting = false;
  var shiftTimer = null;
  var lastRev = DEF_REV, lastCost = DEF_COST;
  var model = compute(DEF_REV, DEF_COST);

  function fmt(n) {
    return (n < 0 ? "\u2212$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
  }
  // Monthly revenue[m] = revenue * shape[m] / 746 * 12; monthly cost of
  // sales the same shape; table Costs[m] = cost[m] + fixed spending.
  // Evaluated left to right so the defaults reproduce the static table.
  function compute(revMonthly, costMonthly) {
    var rows = months.map(function (mo, i) {
      var rev = revMonthly * SHAPE[i] / SHAPE_SUM * 12;
      var cos = costMonthly * SHAPE[i] / SHAPE_SUM * 12;
      var cost = cos + SPEND;
      return { m: mo.m, alt: mo.alt, rev: rev, cost: cost, profit: rev - cost };
    });
    return {
      rows: rows,
      totals: {
        rev: revMonthly * 12,
        cost: costMonthly * 12 + SPEND * 12,
        profit: revMonthly * 12 - (costMonthly * 12 + SPEND * 12)
      }
    };
  }
  function topIndex() { return (((next - 6) % 12) + 12) % 12; }

  function makeRow(d) {
    var li = document.createElement("li");
    li.className = "lt-flow-row lt-flow-enter" + (d.alt ? " lt-flow-alt" : "");
    li.setAttribute("data-rev", d.rev);
    li.setAttribute("data-cost", d.cost);
    li.setAttribute("data-profit", d.profit);
    li.innerHTML =
      '<span class="lt-flow-m">' + d.m + "</span>" +
      '<span class="lt-flow-n" data-v="' + d.rev + '">$0</span>' +
      '<span class="lt-flow-n" data-v="' + d.cost + '">$0</span>' +
      '<span class="lt-flow-n lt-flow-p' + (d.profit < 0 ? " lt-flow-neg" : "") +
      '" data-v="' + d.profit + '">$0</span>';
    return li;
  }
  function countUp(li) {
    var spans = li.querySelectorAll(".lt-flow-n");
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / 650, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      Array.prototype.forEach.call(spans, function (s) {
        var target = parseFloat(s.getAttribute("data-v"));
        s.textContent = fmt(target * eased);
      });
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function countTo(el, target) {
    if (!el) return;
    if (reduced) { el.textContent = fmt(target); return; }
    var cur = parseFloat(el.textContent.replace(/\u2212/g, "-").replace(/[^0-9.\-]/g, "")) || 0;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / 500, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(cur + (target - cur) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function markCurrent() {
    var top = topIndex();
    bars.forEach(function (fill, i) { fill.classList.toggle("is-now", i === top); });
    barlabs.forEach(function (lab, i) { lab.classList.toggle("is-now", i === top); });
  }
  function renderBars() {
    var max = 0;
    model.rows.forEach(function (d) { max = Math.max(max, Math.abs(d.profit)); });
    if (max <= 0) max = 1;
    bars.forEach(function (fill, i) {
      var p = model.rows[i].profit;
      var h;
      if (p >= 0) {
        h = Math.max(3, Math.round(p / max * 56));
        fill.classList.remove("neg");
      } else {
        h = Math.min(8, Math.max(3, Math.round(Math.abs(p) / max * 56)));
        fill.classList.add("neg");
      }
      fill.style.height = h + "px";
      fill.setAttribute("data-profit", Math.round(p));
    });
    markCurrent();
  }
  function renderTotals() {
    if (totRev) totRev.textContent = fmt(model.totals.rev);
    if (totCost) totCost.textContent = fmt(model.totals.cost);
    if (totProfit) totProfit.textContent = fmt(model.totals.profit);
  }
  function renderCentre(animate) {
    var d = model.rows[topIndex()];
    if (centreMonth) centreMonth.textContent = d.m + " \u00b7 profit";
    if (centreVal) {
      if (animate) countTo(centreVal, d.profit);
      else centreVal.textContent = fmt(d.profit);
    }
  }
  function rebuildWindow() {
    if (shiftTimer !== null) { clearTimeout(shiftTimer); shiftTimer = null; }
    list.style.transition = "none";
    list.style.transform = "translateY(0)";
    shifting = false;
    while (list.firstElementChild) list.removeChild(list.firstElementChild);
    for (var i = 0; i < 6; i++) {
      var d = model.rows[((next - 6 + i) % 12 + 12) % 12];
      var li = makeRow(d);
      Array.prototype.forEach.call(li.querySelectorAll(".lt-flow-n"), function (s) {
        s.textContent = fmt(parseFloat(s.getAttribute("data-v")));
      });
      li.classList.remove("lt-flow-enter");
      list.appendChild(li);
    }
    void list.offsetHeight;
    list.style.transition = "";
  }
  function renderRowsStatic() {
    Array.prototype.forEach.call(list.children, function (li, i) {
      var d = model.rows[i];
      if (!d) return;
      li.setAttribute("data-rev", d.rev);
      li.setAttribute("data-cost", d.cost);
      li.setAttribute("data-profit", d.profit);
      var spans = li.querySelectorAll(".lt-flow-n");
      if (spans[0]) spans[0].textContent = fmt(d.rev);
      if (spans[1]) spans[1].textContent = fmt(d.cost);
      if (spans[2]) {
        spans[2].textContent = fmt(d.profit);
        spans[2].classList.toggle("lt-flow-neg", d.profit < 0);
      }
    });
  }
  function readInputs() {
    var r = revInput ? parseFloat(revInput.value) : NaN;
    var c = costInput ? parseFloat(costInput.value) : NaN;
    if (isNaN(r) || r < 0) r = lastRev;
    if (isNaN(c) || c < 0) c = lastCost;
    return { rev: r, cost: c };
  }
  function rescale(animateCentre) {
    var v = readInputs();
    lastRev = v.rev; lastCost = v.cost;
    model = compute(v.rev, v.cost);
    if (reduced) renderRowsStatic();
    else rebuildWindow();
    renderBars();
    renderTotals();
    renderCentre(animateCentre !== false);
  }
  function wireCalc() {
    if (revInput) revInput.addEventListener("input", function () { rescale(true); });
    if (costInput) costInput.addEventListener("input", function () { rescale(true); });
    if (resetBtn) resetBtn.addEventListener("click", function () {
      if (revInput) revInput.value = DEF_REV;
      if (costInput) costInput.value = DEF_COST;
      rescale(false);
      if (revInput) revInput.focus();
    });
  }
  function tick() {
    if (shifting || document.hidden) return;
    shifting = true;
    var d = model.rows[next % model.rows.length];
    next += 1;
    var li = makeRow(d);
    list.appendChild(li);
    var step = list.children[0].offsetHeight;
    countUp(li);
    requestAnimationFrame(function () {
      list.style.transition = "transform .55s cubic-bezier(.4, 0, .2, 1)";
      list.style.transform = "translateY(" + -step + "px)";
    });
    shiftTimer = setTimeout(function () {
      list.style.transition = "none";
      list.style.transform = "translateY(0)";
      if (list.firstElementChild) list.removeChild(list.firstElementChild);
      void list.offsetHeight;
      list.style.transition = "";
      shifting = false;
      shiftTimer = null;
      markCurrent();
      renderCentre(true);
    }, 600);
  }

  if (reduced) {
    card.classList.add("lt-flow-static");
    renderBars();
    renderTotals();
    renderCentre(false);
    wireCalc();
    return;
  }
  card.classList.add("lt-flow-js");
  while (list.children.length > 6) list.removeChild(list.lastElementChild);
  renderBars();
  renderTotals();
  renderCentre(false);
  wireCalc();
  setInterval(function () { if (!document.hidden) tick(); }, 1600);
})();
