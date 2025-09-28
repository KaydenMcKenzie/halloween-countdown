// === Configuration ===
const CONFIG = {
  year: new Date().getFullYear(),
  month: 10, // October
  timeZone: "America/Toronto"
};

/* ---------- Preview (checkbox + localStorage) ---------- */
function isPreviewEnabled() {
  return localStorage.getItem("hc_preview") === "1";
}
function setPreviewEnabled(on) {
  if (on) localStorage.setItem("hc_preview", "1");
  else localStorage.removeItem("hc_preview");
}

/* ---------- Countdown (to Oct 31 in Toronto) ---------- */
function nowInTZ(tz) {
  // Convert "now" to a Date object representing that instant in the given TZ
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
}
function targetHalloweenStart(year, tz) {
  // Midnight at the start of Oct 31 in the given timezone
  const local = new Date(`${year}-10-31T00:00:00`);
  return new Date(local.toLocaleString('en-US', { timeZone: tz }));
}
function updateCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  // Pick this year's Oct 31; if we've passed it, show the festive message.
  const tz = CONFIG.timeZone || 'America/Toronto';
  const now = nowInTZ(tz);
  const target = targetHalloweenStart(CONFIG.year, tz);

  const diff = target - now; // ms

  if (diff <= 0) {
    el.textContent = '🎃 Happy Halloween!';
    return;
  }

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  el.textContent = `🎃 ${days}d ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`;
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

/* ---------- Build UI ---------- */
function buildCalendar() {
  const grid = document.getElementById("calendar");
  if (!grid) return console.error("#calendar not found");
  grid.innerHTML = "";

  if (!Array.isArray(window.DOORS)) {
    console.error("window.DOORS not found. Make sure data/doors.js is loaded before script.js.");
    return;
  }

  // preview state from checkbox (if present) or memory
  const toggle = document.getElementById("previewToggle");
  const preview = toggle ? toggle.checked : isPreviewEnabled();

  // SHUFFLE the tiles each load
  const shuffled = [...window.DOORS].sort(() => Math.random() - 0.5);

  shuffled.forEach((entry) => {
    const day = entry.day;
    const unlocked = isDoorUnlocked(day, preview);

    /* Outer tile */
    const door = document.createElement("div");
    door.className = "door " + (unlocked ? "unlocked" : "locked");

    const inner = document.createElement("div");
    inner.className = "door-inner";

    /* Front face */
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

    /* Back face */
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

    /* Click behavior */
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
  document.getElementById("modal")?.classList.add("hidden");
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
    toggle.checked = isPreviewEnabled();                // load memory
    toggle.addEventListener("change", (e) => {          // persist & rebuild
      setPreviewEnabled(e.target.checked);
      buildCalendar();
    });
  }

document.getElementById("resetDoors").addEventListener("click", () => {
  document.querySelectorAll(".door.open").forEach(door => {
    door.classList.remove("open");
  });

  buildCalendar();
});

