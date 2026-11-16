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

// Fixed transparent header over the hero (homepage only — the header
// carries .site-header--over-hero): gains a solid navy background once
// the page has scrolled a little, so it stays readable on the light
// sections below. At the very top it stays transparent over the photo.
const updateHeader = () => {
  if (!header || !hero || !header.classList.contains("site-header--over-hero")) return;
  header.classList.toggle("is-scrolled", window.scrollY > 100);
};
window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("resize", updateHeader);
updateHeader();

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

// Hero flowing table + spending donut + profit bars.
// One fixed data model drives all three: the 12 months cycle through the
// feed, the donut centre shows the bottom month's net profit, and the bars
// show each month's profit. Reduced motion or no JS shows the full static
// 12-row table instead.
(function () {
  var card = document.querySelector(".lt-flow");
  if (!card) return;
  var list = card.querySelector(".lt-flow-list");
  if (!list || !list.children.length) return;
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

  var next = 6;
  var shifting = false;
  var shiftTimer = null;
  // Fixed sample data, read from the table itself; the year totals are the
  // static figures shown in the table (monthly values are rounded, so they
  // are not summed from the rows).
  var model = {
    rows: Array.prototype.map.call(list.children, function (li, i) {
      return {
        m: months[i].m,
        alt: months[i].alt,
        rev: parseFloat(li.getAttribute("data-rev")),
        cost: parseFloat(li.getAttribute("data-cost")),
        profit: parseFloat(li.getAttribute("data-profit"))
      };
    }),
    totals: { rev: 480000, cost: 416000, profit: 64000 }
  };

  function fmt(n) {
    return (n < 0 ? "\u2212$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
  }
  // Anchor for the donut centre and the highlighted bar: the LAST row of
  // the visible window — the month that just slid in at the bottom. In
  // reduced motion the full 12-row table is static, so the anchor stays on
  // the first month (Jan), as before.
  function anchorIndex() { return reduced ? 0 : (((next - 1) % 12) + 12) % 12; }

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
  function markCurrent() {
    var anchor = anchorIndex();
    bars.forEach(function (fill, i) { fill.classList.toggle("is-now", i === anchor); });
    barlabs.forEach(function (lab, i) { lab.classList.toggle("is-now", i === anchor); });
  }
  function renderBars() {
    var max = 0;
    model.rows.forEach(function (d) { max = Math.max(max, Math.abs(d.profit)); });
    if (max <= 0) max = 1;
    bars.forEach(function (fill, i) {
      var p = model.rows[i].profit;
      var h;
      if (p >= 0) {
        h = Math.max(3, Math.round(p / max * 88));
        fill.classList.remove("neg");
      } else {
        h = Math.min(8, Math.max(3, Math.round(Math.abs(p) / max * 88)));
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
  // Donut centre is set instantly, label and value together, in the same
  // synchronous pass as the bar highlight — so a still frame never catches
  // a mid-count value that matches no month.
  function renderCentre() {
    var d = model.rows[anchorIndex()];
    if (centreMonth) centreMonth.textContent = d.m + " \u00b7 profit";
    if (centreVal) centreVal.textContent = fmt(d.profit);
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
  function tick() {
    if (shifting || document.hidden) return;
    shifting = true;
    var d = model.rows[next % model.rows.length];
    next += 1;
    var li = makeRow(d);
    list.appendChild(li);
    var step = list.children[0].offsetHeight;
    countUp(li);
    // The slide is driven frame by frame on the main thread (not a CSS
    // transition) so the transform and the centre/bar flip land in the same
    // painted frame: at the midpoint of the slide the centre and bar switch
    // to the month arriving at the bottom, in the same task that sets the
    // transform. No still frame can ever show them disagreeing with the
    // visible bottom row. The timeout below is only a watchdog for a stalled
    // animation frame (e.g. tab hidden mid-slide).
    var start = null;
    var flipped = false;
    function slideFrame(ts) {
      if (!shifting) return;
      if (start === null) start = ts;
      var t = Math.min((ts - start) / 550, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      list.style.transition = "none";
      list.style.transform = "translateY(" + (-step * eased) + "px)";
      if (t >= 0.5 && !flipped) {
        flipped = true;
        markCurrent();
        renderCentre();
      }
      if (t < 1) requestAnimationFrame(slideFrame);
      else finishShift();
    }
    function finishShift() {
      if (!shifting) return;
      shifting = false;
      shiftTimer = null;
      list.style.transition = "none";
      list.style.transform = "translateY(0)";
      if (list.firstElementChild) list.removeChild(list.firstElementChild);
      void list.offsetHeight;
      list.style.transition = "";
      markCurrent();
      renderCentre();
    }
    requestAnimationFrame(slideFrame);
    shiftTimer = setTimeout(finishShift, 650);
  }

  if (reduced) {
    card.classList.add("lt-flow-static");
    renderBars();
    renderTotals();
    renderCentre();
    return;
  }
  card.classList.add("lt-flow-js");
  while (list.children.length > 6) list.removeChild(list.lastElementChild);
  renderBars();
  renderTotals();
  renderCentre();
  setInterval(function () { if (!document.hidden) tick(); }, 1600);
})();

// Unified Reports page: one document, no tabs. The panel header is
// "Reports" and the sections stack inside it — General ledger
// (T-account), Income statement (PNL) + waterfall, the merged combo
// chart, Balance sheet with AR and AP inside it, the balances
// bubbles, a cash-flow strip that is still awaiting figures, and the
// flowing month table. The T-account, income statement, waterfall,
// balance sheet, bubbles and cash-flow strip are static HTML, so they
// render with or without JS. Only the combo chart and the flowing
// table need this script: the chart follows the same bottom-row
// anchor as the table. Every figure in the static sections is a
// figure already on the page — nothing is invented. Cash flow has no
// figures anywhere on the page, so its strip stays an awaiting state.
(function () {
  var card = document.getElementById("lt-rep-flow");
  if (!card) return;
  var list = document.getElementById("lt-rep-list");
  if (!list || !list.children.length) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  card.classList.add("lt-rep-js");

  // P&L rows are read from the static table in the DOM (same as the hero),
  // so the no-JS fallback shows the same figures.
  var pnlRows = Array.prototype.map.call(list.children, function (li, i) {
    return {
      label: li.querySelector(".lt-flow-m").textContent,
      values: [
        parseFloat(li.getAttribute("data-rev")),
        parseFloat(li.getAttribute("data-cost")),
        parseFloat(li.getAttribute("data-profit"))
      ],
      alt: i % 2 === 1
    };
  });
  var BAR_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  var comboEl = document.getElementById("lt-rep-combo");
  var viewEl = list.parentElement;

  // The flowing table shows a 4-row window — the compression that
  // keeps the page compact. The anchor is the bottom row of the
  // window, so it still follows the arriving month.
  var WINDOW = 4;
  var state = { anchor: WINDOW - 1, next: WINDOW, timer: null };
  var shifting = false;
  var shiftTimer = null;
  var charts = { combo: null };

  function fmt(n) {
    return (n < 0 ? "\u2212$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
  }

  function makeRow(d, idx) {
    var li = document.createElement("li");
    li.className = "lt-flow-row lt-flow-enter" + (idx % 2 === 1 ? " lt-flow-alt" : "");
    var html = '<span class="lt-flow-m">' + d.label + "</span>";
    d.values.forEach(function (v, j) {
      html += '<span class="lt-flow-n' +
        (j === d.values.length - 1 ? " lt-flow-p" : "") +
        (v < 0 ? " lt-flow-neg" : "") +
        '" data-v="' + v + '">$0</span>';
    });
    li.innerHTML = html;
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

  // ---- Chart helpers -------------------------------------------------
  var MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function smoothPath(pts) {
    if (pts.length < 2) return "";
    var d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += "C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
    }
    return d;
  }
  // Merged combo chart: grouped bars (Revenue navy, Costs muted blue)
  // with the three trend lines drawn over them on the SAME scale and
  // month slots — the bars show the monthly volumes, the lines connect
  // the same points, and the gold profit line floats on its own. One
  // axis set, one legend, one card. Compressed to 130px tall.
  var COMBO = { w: 640, h: 130, l: 48, r: 16, t: 14, b: 28, min: -5000, max: 60000 };
  function comboX(i) { return COMBO.l + i * (COMBO.w - COMBO.l - COMBO.r) / 11; }
  function comboY(v) { return barY(v, COMBO); }
  function renderCombo() {
    var rows = pnlRows;
    var series = [
      { label: "Revenue", color: "#102438", vals: rows.map(function (r) { return r.values[0]; }) },
      { label: "Costs", color: "#9db8cc", vals: rows.map(function (r) { return r.values[1]; }) },
      { label: "Profit", color: "#c19b5d", vals: rows.map(function (r) { return r.values[2]; }) }
    ];
    var pts = series.map(function (s) {
      return s.vals.map(function (v, i) { return [comboX(i), comboY(v)]; });
    });
    var grid = gridSvg(COMBO, [0, 20000, 40000, 60000]);
    var slot = (COMBO.w - COMBO.l - COMBO.r) / 12;
    var bw = 13, gap = 4, pair = bw * 2 + gap;
    var y0 = barY(0, COMBO);
    var bars = rows.map(function (r, i) {
      var gx = comboX(i) - pair / 2;
      var rev = r.values[0], cost = r.values[1];
      var rh = y0 - barY(rev, COMBO), ch = y0 - barY(cost, COMBO);
      return '<g class="lt-rep-group" data-i="' + i + '">' +
        '<rect x="' + gx.toFixed(1) + '" y="' + barY(rev, COMBO).toFixed(1) + '" width="' + bw + '" height="' + Math.max(rh, 1).toFixed(1) + '" rx="3" fill="#102438"><title>' + MONTHS_FULL[i] + " revenue " + fmt(rev) + "</title></rect>" +
        '<rect x="' + (gx + bw + gap).toFixed(1) + '" y="' + barY(cost, COMBO).toFixed(1) + '" width="' + bw + '" height="' + Math.max(ch, 1).toFixed(1) + '" rx="3" fill="#9db8cc"><title>' + MONTHS_FULL[i] + " costs " + fmt(cost) + "</title></rect>" +
        '<text class="lt-rep-axis lt-rep-month" data-i="' + i + '" x="' + comboX(i).toFixed(1) + '" y="' + (COMBO.h - 8) + '" text-anchor="middle">' + BAR_LABELS[i] + "</text>" +
        "</g>";
    }).join("");
    var lines = series.map(function (s, j) {
      return '<path class="lt-rep-line" d="' + smoothPath(pts[j]) + '" stroke="' + s.color + '"/>';
    }).join("");
    var dots = series.map(function (s, j) {
      return pts[j].map(function (p, i) {
        return '<circle class="lt-rep-dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.2" stroke="' + s.color + '"><title>' + MONTHS_FULL[i] + " " + s.label + " " + fmt(s.vals[i]) + "</title></circle>";
      }).join("");
    }).join("");
    var rings = [0, 1, 2].map(function () { return '<circle class="lt-rep-ring" r="6.5" cx="0" cy="0"/>'; }).join("");
    comboEl.innerHTML =
      '<ul class="lt-rep-legend">' +
      '<li><i class="lt-rep-sw-bar" style="background:#102438"></i>Revenue</li>' +
      '<li><i class="lt-rep-sw-bar" style="background:#9db8cc"></i>Costs</li>' +
      '<li><i class="lt-rep-sw-line" style="background:#c19b5d"></i>Profit</li>' +
      "</ul>" +
      '<svg viewBox="0 0 ' + COMBO.w + " " + COMBO.h + '" role="img" aria-label="Combined bar and line chart of revenue, costs and profit by month">' +
      grid + bars + lines + dots +
      '<g><line class="lt-rep-guide" x1="0" y1="' + COMBO.t + '" x2="0" y2="' + (COMBO.h - COMBO.b) + '"/>' + rings + "</g>" +
      "</svg>";
    charts.combo = {
      guide: comboEl.querySelector(".lt-rep-guide"),
      rings: Array.prototype.slice.call(comboEl.querySelectorAll(".lt-rep-ring")),
      months: Array.prototype.slice.call(comboEl.querySelectorAll(".lt-rep-month")),
      groups: Array.prototype.slice.call(comboEl.querySelectorAll(".lt-rep-group")),
      xs: rows.map(function (r, i) { return comboX(i); }),
      ys: pts.map(function (p) { return p.map(function (q) { return q[1]; }); })
    };
  }
  // Shared bar-chart geometry.
  function barY(v, g) { return g.t + (g.max - v) / (g.max - g.min) * (g.h - g.t - g.b); }
  function gridSvg(g, steps) {
    return steps.map(function (s) {
      var y = barY(s, g);
      var cls = s === 0 ? "lt-rep-zeroline" : "lt-rep-gridline";
      var lab = s === 0 ? "$0" : "$" + (s / 1000) + "k";
      return '<line class="' + cls + '" x1="' + g.l + '" y1="' + y.toFixed(1) + '" x2="' + (g.w - g.r) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="lt-rep-axis" x="' + (g.l - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + lab + "</text>";
    }).join("");
  }
  // Move the combo chart's active marker to the bottom-row anchor.
  function markCharts() {
    var a = state.anchor;
    if (!charts.combo) return;
    var x = charts.combo.xs[a];
    charts.combo.guide.setAttribute("x1", x.toFixed(1));
    charts.combo.guide.setAttribute("x2", x.toFixed(1));
    charts.combo.rings.forEach(function (ring, j) {
      ring.setAttribute("cx", x.toFixed(1));
      ring.setAttribute("cy", charts.combo.ys[j][a].toFixed(1));
    });
    charts.combo.months.forEach(function (m, i) {
      m.classList.toggle("is-now", i === a);
    });
    charts.combo.groups.forEach(function (g, i) { g.classList.toggle("is-now", i === a); });
  }
  // Pill rows carry a 3px gap, so the slide step is row height + gap.
  function rowPitch() {
    var first = list.firstElementChild;
    if (!first) return 0;
    var cs = window.getComputedStyle(first);
    return first.offsetHeight + parseFloat(cs.marginBottom || "0");
  }
  function sizeFlowView() {
    if (!viewEl) return;
    if (reduced) { viewEl.style.height = ""; return; }
    var pitch = rowPitch();
    if (pitch > 0) viewEl.style.height = Math.round(pitch * WINDOW) + "px";
  }
  function rebuildWindow() {
    if (shiftTimer !== null) { clearTimeout(shiftTimer); shiftTimer = null; }
    list.style.transition = "none";
    list.style.transform = "translateY(0)";
    shifting = false;
    while (list.firstElementChild) list.removeChild(list.firstElementChild);
    var count = reduced ? pnlRows.length : WINDOW;
    var start = reduced ? 0 : (((state.next - WINDOW) % pnlRows.length) + pnlRows.length) % pnlRows.length;
    for (var i = 0; i < count; i++) {
      var idx = (start + i) % pnlRows.length;
      var li = makeRow(pnlRows[idx], idx);
      Array.prototype.forEach.call(li.querySelectorAll(".lt-flow-n"), function (s) {
        s.textContent = fmt(parseFloat(s.getAttribute("data-v")));
      });
      li.classList.remove("lt-flow-enter");
      list.appendChild(li);
    }
    void list.offsetHeight;
    list.style.transition = "";
    sizeFlowView();
  }
  function tick() {
    if (shifting || document.hidden) return;
    shifting = true;
    var d = pnlRows[state.next % pnlRows.length];
    state.next += 1;
    var li = makeRow(d, (state.next - 1) % pnlRows.length);
    list.appendChild(li);
    var step = rowPitch();
    countUp(li);
    var start = null;
    var flipped = false;
    function slideFrame(ts) {
      if (!shifting) return;
      if (start === null) start = ts;
      var t = Math.min((ts - start) / 550, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      list.style.transition = "none";
      list.style.transform = "translateY(" + (-step * eased) + "px)";
      if (t >= 0.5 && !flipped) {
        flipped = true;
        state.anchor = ((state.next - 1) % pnlRows.length + pnlRows.length) % pnlRows.length;
        markCharts();
      }
      if (t < 1) requestAnimationFrame(slideFrame);
      else finishShift();
    }
    function finishShift() {
      if (!shifting) return;
      shifting = false;
      shiftTimer = null;
      list.style.transition = "none";
      list.style.transform = "translateY(0)";
      if (list.firstElementChild) list.removeChild(list.firstElementChild);
      void list.offsetHeight;
      list.style.transition = "";
      markCharts();
    }
    requestAnimationFrame(slideFrame);
    shiftTimer = setTimeout(finishShift, 650);
  }
  function stopTimer() {
    if (state.timer !== null) { clearInterval(state.timer); state.timer = null; }
  }
  function startTimer() {
    stopTimer();
    if (!reduced) state.timer = setInterval(function () { if (!document.hidden) tick(); }, 1600);
  }
  window.addEventListener("resize", sizeFlowView);
  renderCombo();
  rebuildWindow();
  markCharts();
  if (reduced) {
    card.classList.add("lt-flow-static");
  } else {
    card.classList.add("lt-flow-js");
    startTimer();
  }
})();
