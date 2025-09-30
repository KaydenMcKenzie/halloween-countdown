// === Configuration ===
const CONFIG = {
  year: new Date().getFullYear(),
  month: 10, // October
  timeZone: "America/Toronto"
};

/* ---------- Preview toggle ---------- */
function isPreviewEnabled() {
  return localStorage.getItem("hc_preview") === "1";
}
function setPreviewEnabled(on) {
  if (on) localStorage.setItem("hc_preview", "1");
  else localStorage.removeItem("hc_preview");
}

/* ---------- Countdown ---------- */
function getNowInTZ(tz) {
  return new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
}
function getTargetHalloweenStart(year, tz) {
  const localMidnight = new Date(`${year}-10-31T00:00:00`);
  return new Date(localMidnight.toLocaleString("en-US", { timeZone: tz }));
}
function updateCountdown() {
  const el = document.getElementById("countdown");
  if (!el) return;

  const tz = CONFIG.timeZone;
  const now = getNowInTZ(tz);
  const target = getTargetHalloweenStart(CONFIG.year, tz);
  const diffMs = target - now;

  if (diffMs <= 0) {
    el.textContent = "🎃 Happy Halloween!";
    return;
  }

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  el.textContent = `🎃 ${days}d ${String(hours).padStart(2, "0")}h ${String(
    mins
  ).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
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

/* ---------- Build calendar ---------- */
function buildCalendar() {
  const grid = document.getElementById("calendar");
  if (!grid) return console.error("#calendar not found");
  grid.innerHTML = "";

  if (!Array.isArray(window.DOORS)) {
    console.error("window.DOORS not found. Check data/doors.js is loaded first.");
    return;
  }

  const toggle = document.getElementById("previewToggle");
  const preview = toggle ? toggle.checked : isPreviewEnabled();

  // Shuffle doors
  const shuffled = [...window.DOORS].sort(() => Math.random() - 0.5);

  shuffled.forEach((entry) => {
    const day = entry.day;
    const unlocked = isDoorUnlocked(day, preview);

    /* Door container */
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

    /* Interactions */
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
  const bonusEl = document.getElementById("bonusLink");
  if (!modal || !titleEl || !imgEl || !linkEl) return;

  titleEl.textContent = entry.title || "Activity";
  imgEl.src = entry.activityImage || entry.modalImage || entry.image || "";
  imgEl.alt = entry.title || "Activity image";
  linkEl.href = entry.link || "#";                     
  bonusEl.href = entry.bonusLink || "#";

  modal.classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modal")?.classList.add("hidden");
}

/* ---------- Events & Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Preview toggle
  const toggle = document.getElementById("previewToggle");
  if (toggle) {
    toggle.checked = isPreviewEnabled();
    toggle.addEventListener("change", (e) => {
      setPreviewEnabled(e.target.checked);
      buildCalendar();
    });
  }

  // Reset doors
  document.getElementById("resetDoors")?.addEventListener("click", () => {
    document.querySelectorAll(".door.open").forEach((door) =>
      door.classList.remove("open")
    );
  });

  // Modal close
  document.getElementById("closeModal")?.addEventListener("click", closeModal);
  document.getElementById("modal")?.addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Countdown
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Build calendar
  buildCalendar();
});