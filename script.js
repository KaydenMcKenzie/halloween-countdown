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
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const obj = {};
  for (const p of parts) if (p.type !== "literal") obj[p.type] = p.value;
  return {
    year: parseInt(obj.year),
    month: parseInt(obj.month),
    day: parseInt(obj.day),
  };
}

// Only unlock when the real date reaches the door's day in October
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
  grid.innerHTML = "";

  if (!Array.isArray(window.DOORS)) {
    console.error("DOORS data not found. Check data/doors.js is loaded before script.js.");
    return;
  }

  // Shuffle the tiles each load
  const shuffled = [...window.DOORS].sort(() => Math.random() - 0.5);

  shuffled.forEach((entry) => {
    const day = entry.day;
    const unlocked = isDoorUnlocked(day);

    const door = document.createElement("div");
    door.className = "door " + (unlocked ? "unlocked" : "locked");

    const inner = document.createElement("div");
    inner.className = "door-inner";

    // -------- Front face (door tile with centered <img>) --------
    const front = document.createElement("div");
    front.className = "door-face door-front";

    const thumb = document.createElement("img");
    thumb.className = "door-thumb";
    // Prefer doorImage for the tile; fall back to image if that's what you used
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

    // -------- Back face (bigger image shown behind + in modal) --------
    const back = document.createElement("div");
    back.className = "door-face door-back";

    const img = document.createElement("img");
    img.className = "peek";
    // Prefer activityImage for the popup; fall back to modalImage or image
    img.src = entry.activityImage || entry.modalImage || entry.image || "";
    img.alt = entry.title || `Day ${day} Image`;
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    door.appendChild(inner);

    // Interactions
    if (unlocked) {
      door.addEventListener("click", () => {
        door.classList.toggle("open");
        openModal(entry);
      });
    } else {
      door.addEventListener("click", () => {
        lockedOverlay.style.opacity = 1;
        setTimeout(() => {
          lockedOverlay.style.opacity = 0;
        }, 900);
      });
    }

    grid.appendChild(door);
  });
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

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});

// Init
(function init() {
  buildCalendar();
})();