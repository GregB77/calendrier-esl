// =======================
// CONFIG
// =======================

let currentDate = new Date();
let vacancesZoneA = [];

// Jours fériés FR (fixes + mobiles simples)
const JOURS_FERIES_FIXES = [
  "01-01", // Jour de l'an
  "01-05",
  "08-05",
  "14-07",
  "15-08",
  "01-11",
  "11-11",
  "25-12"
];

// =======================
// UTILS
// =======================

function formatKey(date) {
  return date.toISOString().split("T")[0];
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function isJourFerie(date) {
  const key = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}`;
  return JOURS_FERIES_FIXES.includes(key);
}

// =======================
// VACANCES SCOLAIRES (API)
// =======================

function loadVacancesZoneA() {
  const url =
    "https://data.education.gouv.fr/api/explore/v2.0/catalog/datasets/fr-en-calendrier-scolaire/records" +
    "?limit=100" +
    "&refine=zone:A" +
    "&refine=location:France";

  return fetch(url)
    .then(res => res.json())
    .then(data => {
      vacancesZoneA = data.results.map(r => ({
        start: r.start_date,
        end: r.end_date
      }));
    })
    .catch(err => {
      console.error("Vacances scolaires indisponibles", err);
      vacancesZoneA = [];
    });
}

function isVacancesZoneA(date) {
  const key = formatKey(date);
  return vacancesZoneA.some(v => key >= v.start && key <= v.end);
}

// =======================
// RENDER
// =======================

function renderMonth() {
  const container = document.getElementById("calendar");
  container.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Header
  document.getElementById("monthTitle").textContent =
    currentDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });

  // Table header
  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
    <div class="col-date">Date</div>
    <div class="col-duree">Durée</div>
    <div class="col-comment">Commentaires</div>
  `;
  container.appendChild(header);

  // Dates
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);

    const row = document.createElement("div");
    row.className = "day-row";

    if (isWeekend(date)) row.classList.add("weekend");
    if (isJourFerie(date)) row.classList.add("ferie");
    if (isVacancesZoneA(date)) row.classList.add("vacancesA");

    const jour = date
      .toLocaleDateString("fr-FR", { weekday: "short" })
      .toUpperCase()
      .replace(".", "");

    row.innerHTML = `
      <div class="col-date">${jour}. ${pad(d)}</div>
      <input class="col-duree" maxlength="5" />
      <input class="col-comment" maxlength="30" />
    `;

    container.appendChild(row);
  }
}

// =======================
// NAVIGATION
// =======================

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMonth();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMonth();
}

// =======================
// SWIPE MOBILE
// =======================

let startX = 0;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  if (dx > 80) prevMonth();
  if (dx < -80) nextMonth();
});

// =======================
// INIT
// =======================

document.addEventListener("DOMContentLoaded", () => {
  loadVacancesZoneA().then(renderMonth);
});
