// === Configuration ===
const CONFIG = {
  year: new Date().getFullYear(),
  month: 10, // October (1-12)
  timeZone: "America/Toronto"
};

// Get today's y/m/d in a specific timezone
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

// Unlock only when the real date reaches the door's day in October
function isDoorUnlocked(day) {
  const { year, month, day: todayDay } = getZonedDateParts(CONFIG.timeZone);
  if (year > CONFIG.year) return true;
  if (year < CONFIG.year) return false;
  if (month > CONFIG.month) return true;
  if (month < CONFIG.month) return false;
  return todayDay >= day;
}

function buildCalendar() {
  const grid = document.getElementById("calendar");
  if (!grid) return console.error("#calendar not found in index.html");
  grid.innerHTML = "";

  if (!Array.isArray(window.DOORS)) {
    console.error("DOORS data not found. Ensure data/doors.js loads before script.js.");
    return;
  }

  // Shuffle tiles each load
  const shuffled = [...window.DOORS].sort(() => Math.random() - 0.5);

  shuffled.forEach((entry) => {
    const day = entry.day;
    const unlocked = isDoorUnlocked(day);

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
    thumb.loading = "eager"; // show grid quickly
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
    img.loading = "lazy"; // load only when needed
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

// Close with X, backdrop, or Esc
document.getElementById("closeModal")?.addEventListener("click", closeModal);
document.getElementById("modal")?.addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Init
(function init() {
  buildCalendar();
})();