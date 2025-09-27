// === Configuration ===
const CONFIG = {
  year: new Date().getFullYear(),
  month: 10, // October (1-12)
  timeZone: "America/Toronto"
};

/* ---------- Preview mode helpers (checkbox + localStorage) ---------- */
function isPreviewEnabled() {
  return localStorage.getItem("hc_preview") === "1";
}
function setPreviewEnabled(on) {
  if (on) localStorage.setItem("hc_preview", "1");
  else localStorage.removeItem("hc_preview");
}

/* ---------- Date helpers ---------- */
function getZonedDateParts(tz) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = fmt.formatToParts(new Date());
  const obj = {};
  for (const p of parts) if (p.type !== "literal") obj[p.type] = p.value;
  return {
    year: parseInt(obj.year, 10),
    month: parseInt(obj.month, 10),
    day: parseInt(obj.day, 10)
  };
}

function isDoorUnlocked(day, preview = false) {
  if (preview) return true;
  const { year, month, day: todayDay } = getZonedDateParts(CONFIG.timeZone);
  if (year > CONFIG.year) return true;
  if (year < CONFIG.year) return false;
  if (month > CONFIG.month) return true;
  if (month < CONFIG.month) return false;
  return todayDay >= day;
}

/* ---------- UI build ---------- */
function buildCalendar() {
  const grid = document.getElementById("calendar");
  if (!grid) return console.error("#calendar not found in index.html");
  grid.innerHTML = "";

  if (!Array.isArray(window.DOORS)) {
    console.error("DOORS data not found. Ensure data/doors.js loads before script.js.");
    return;
  }

  // preview is controlled by checkbox (persisted in localStorage)
  const toggle = document.getElementById("previewToggle");
  const preview = toggle ? toggle.checked : isPreviewEnabled();

  // Shuffle the doors each load
const shuffled = [...window.DOORS].sort(() => Math.random() - 0.5);
shuffled.forEach((entry) => {

  ordered.forEach((entry) => {
    const day = entry.day;
    const unlocked = isDoorUnlocked(day, preview);

    // Outer tile
    const door = document.createElement("div");
    door.className = "door " + (unlocked ? "unlocked" : "locked");

    const inner = document.createElement("div");
    inner.className = "door-inner";

    // ---------- FRONT (door tile with centered <img>) ----------
    const front = document.createElement("div");
    front.className = "door-face door-front";

    const thumb = document.createElement("img");
    thumb.className = "door-thumb";
    thumb.loading = "eager";
    thumb.decoding = "async";
    thumb.src = entry.doorImage || entry.image || "";
    thumb.alt = entry.title ? `${entry.title} (Day ${day})` : `Day ${day} Door`;
    front.appendChild(thumb);

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = String(day);
    front.appendChild(dayNumber);

    const lockedOverlay = document.createElement("div");
    lockedOverlay.className = "locked-overlay";
    lockedOverlay.textContent = "Opens Oct " + day;
    front.appendChild(lockedOverlay);

    // ---------- BACK (revealed image) ----------
    const back = document.createElement("div");
    back.className = "door-face door-back";

    const img = document.createElement("img");
    img.className = "peek";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = entry.activityImage || entry.modalImage || entry.image || "";
    img.alt = entry.title ? `${entry.title} (Day ${day})` : `Day ${day} Image`;
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    door.appendChild(inner);

    // Click behavior
    if (unlocked) {
      door.addEventListener("click", () => {
        door.classList.toggle("open");
        openModal(entry);
      });
    } else {
      door.addEventListener("click", () => {
        lockedOverlay.style.opacity = 1;
        setTimeout(() => (lockedOverlay.style.opacity = 0), 900);
      });
    }

    grid.appendChild(door);
  });
}

/* ---------- Modal ---------- */
function openModal(entry) {
  const modal = document.getElementById("modal");
  const titleEl = document.getElementById("modalTitle");
  const imgEl = document.getElementById("modalImage");
  const linkEl = document.getElementById("modalLink");
  if (!modal || !titleEl || !imgEl || !linkEl) return;

  titleEl.textContent = entry.title || "Activity";
  imgEl.src = entry.activityImage || entry.modalImage || entry.image || "";
  imgEl.alt = entry.title || "Activity image";
  linkEl.href = entry.link || "#";

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) modal.classList.add("hidden");
}

/* ---------- Events & init ---------- */
document.getElementById("closeModal")?.addEventListener("click", closeModal);
document.getElementById("modal")?.addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("previewToggle");
  if (toggle) {
    // initialize checkbox from saved state
    toggle.checked = isPreviewEnabled();
    // persist changes and rebuild
    toggle.addEventListener("change", (e) => {
      setPreviewEnabled(e.target.checked);
      buildCalendar();
    });
  }
  buildCalendar();
});