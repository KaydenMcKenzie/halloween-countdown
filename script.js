// === Configuration ===
const CONFIG = {
  year: new Date().getFullYear(),
  month: 10, // October
  timeZone: "America/Toronto"
};

function isPreviewEnabled() {
  return localStorage.getItem("hc_preview") === "1";
}
function setPreviewEnabled(on) {
  if (on) localStorage.setItem("hc_preview", "1");
  else localStorage.removeItem("hc_preview");
  buildCalendar();
}

// Get today's date in given timezone
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

// Door unlock check
function isDoorUnlocked(day) {
  if (isPreviewEnabled()) return true;
  const { year, month, day: todayDay } = getZonedDateParts(CONFIG.timeZone);
  if (year > CONFIG.year) return true;
  if (year < CONFIG.year) return false;
  if (month > CONFIG.month) return true;
  if (month < CONFIG.month) return false;
  return todayDay >= day;
}

function buildCalendar() {
  const grid = document.getElementById("calendar");
  if (!grid) return;
  grid.innerHTML = "";

  if (!Array.isArray(window.DOORS)) {
    console.error("DOORS data not found. Check data/doors.js is loaded before script.js.");
    return;
  }

  const ordered = [...window.DOORS].sort((a, b) => a.day - b.day);

  ordered.forEach((entry) => {
    const day = entry.day;
    const unlocked = isDoorUnlocked(day);

    const door = document.createElement("div");
    door.className = "door " + (unlocked ? "unlocked" : "locked");

    const inner = document.createElement("div");
    inner.className = "door-inner";

    // FRONT
    const front = document.createElement("div");
    front.className = "door-face door-front";

    const thumb = document.createElement("img");
    thumb.className = "door-thumb";
    thumb.src = entry.doorImage || entry.image || "";
    thumb.alt = entry.title || `Day ${day} Door`;
    front.appendChild(thumb);

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = String(day);
    front.appendChild(dayNumber);

    const lockedOverlay = document.createElement("div");
    lockedOverlay.className = "locked-overlay";
    lockedOverlay.textContent = "Opens Oct " + day;
    front.appendChild(lockedOverlay);

    // BACK
    const back = document.createElement("div");
    back.className = "door-face door-back";

    const img = document.createElement("img");
    img.className = "peek";
    img.src = entry.activityImage || entry.modalImage || entry.image || "";
    img.alt = entry.title || `Day ${day} Image`;
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    door.appendChild(inner);

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

  // Sync checkbox with state
  const toggle = document.getElementById("previewToggle");
  if (toggle) toggle.checked = isPreviewEnabled();
}

function openModal(entry) {
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = entry.title || "Activity";

  const imgEl = document.getElementById("modalImage");
  imgEl.src = entry.activityImage || entry.modalImage || entry.image || "";
  imgEl.alt = entry.title || "Activity image";

  const linkEl = document.getElementById("modalLink");
  linkEl.href = entry.link || "#";

  modal.classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

// Event bindings
document.getElementById("closeModal")?.addEventListener("click", closeModal);
document.getElementById("modal")?.addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Preview toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("previewToggle");
  if (toggle) {
    toggle.checked = isPreviewEnabled();
    toggle.addEventListener("change", (e) => {
      setPreviewEnabled(e.target.checked);
    });
  }
  buildCalendar();
});