// === Configuration ===
const CONFIG = {
  year: new Date().getFullYear(),
  month: 10, // October
  timeZone: "America/Toronto"
};

// Helper to get today's date in a timezone
function getZonedDateParts(tz) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = fmt.formatToParts(new Date());
  const obj = {};
  for (const p of parts) { if (p.type !== 'literal') obj[p.type] = p.value; }
  return { year: parseInt(obj.year), month: parseInt(obj.month), day: parseInt(obj.day) };
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

function buildCalendar() {
  const grid = document.getElementById('calendar');
  grid.innerHTML = '';
  const preview = document.getElementById('previewToggle').checked;

  if (!Array.isArray(window.DOORS)) {
    console.error("DOORS data not found. Check data/doors.js.");
    return;
  }

  // Shuffle tiles each load
  const shuffled = [...window.DOORS].sort(() => Math.random() - 0.5);

  shuffled.forEach(entry => {
    const day = entry.day;
    const unlocked = isDoorUnlocked(day, preview);

    const door = document.createElement('div');
    door.className = 'door ' + (unlocked ? 'unlocked' : 'locked');

    const inner = document.createElement('div');
    inner.className = 'door-inner';

    // Front face (door tile)
    const front = document.createElement('div');
    front.className = 'door-face door-front';
    front.style.backgroundImage = `url('${entry.image}')`;
    front.style.backgroundSize = 'cover';
    front.style.backgroundPosition = 'center';
    front.style.backgroundRepeat = 'no-repeat';

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = String(day);
    front.appendChild(dayNumber);

    const lockedOverlay = document.createElement('div');
    lockedOverlay.className = 'locked-overlay';
    lockedOverlay.textContent = 'Opens Oct ' + day;
    front.appendChild(lockedOverlay);

    // Back face (bigger image preview)
    const back = document.createElement('div');
    back.className = 'door-face door-back';

    const img = document.createElement('img');
    img.className = 'peek';
    img.src = entry.modalImage || entry.image;
    img.alt = entry.title || ('Day ' + day + ' Image');
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    door.appendChild(inner);

    // Interactions
    if (unlocked) {
      door.addEventListener('click', () => {
        door.classList.toggle('open');
        openModal(entry);
      });
    } else {
      door.addEventListener('click', () => {
        lockedOverlay.style.opacity = 1;
        setTimeout(() => { lockedOverlay.style.opacity = 0; }, 900);
      });
    }

    grid.appendChild(door);
  });
}

function openModal(entry) {
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = entry.title || 'Activity';

  const imgEl = document.getElementById('modalImage');
  imgEl.src = entry.modalImage || entry.image || '';
  imgEl.alt = entry.title || 'Activity image';

  const linkEl = document.getElementById('modalLink');
  linkEl.href = entry.link || '#';

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});

// Preview toggle
document.getElementById('previewToggle').addEventListener('change', buildCalendar);

// Initialize
(function init() {
    buildCalendar();
})();