alert("calendar.js chargé");

// =======================
// VARIABLES GLOBALES
// =======================

let currentDate = new Date();
let vacancesZoneA = [];

// =======================
// JOURS FÉRIÉS (fixes FR)
// =======================

const JOURS_FERIES_FIXES = [
  "01-01",
  "01-05",
  "08-05",
  "14-07",
  "15-08",
  "01-11",
  "11-11",
  "25-12"
];

// =======================
// OUTILS
// =======================

function pad(n) {
  return n.toString().padStart(2, "0");
}

function formatKey(date) {
  return date.toISOString().split("T")[0];
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function isJourFerie(date) {
  const key = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}`;
  return JOURS_FERIES_FIXES.includes(key);
  console.log("Jour férié :", date);
}

// =======================
// VACANCES SCOLAIRES – API
// =======================

function loadVacancesZoneA() {
  const cache = localStorage.getItem("vacancesZoneA");

  if (cache) {
    vacancesZoneA = JSON.parse(cache);
    return Promise.resolve();
  }

  const url =
    "https://data.education.gouv.fr/api/explore/v2.0/catalog/datasets/fr-en-calendrier-scolaire/records" +
    "?limit=100" +
    "&refine=zones:Zone A" +
    "&refine=location:France métropolitaine";

  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      if (!data.results) {
        vacancesZoneA = [];
        return;
      }

      vacancesZoneA = data.results.map(r => ({
        start: r.start_date,
        end: r.end_date,
        label: r.description
      }));

      localStorage.setItem(
        "vacancesZoneA",
        JSON.stringify(vacancesZoneA)
      );
    })
    .catch(err => {
      console.error("Vacances scolaires indisponibles", err);
      vacancesZoneA = [];
    });
}

function getVacancesZoneA(date) {
  const key = formatKey(date);
  return vacancesZoneA.find(v => key >= v.start && key <= v.end) || null;
}

// =======================
// RENDER DU MOIS
// =======================

function renderMonth() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const title = document.getElementById("monthTitle");
  if (title) {
    title.textContent = currentDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });
  }

  // En-tête colonnes
  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
    <div class="col-date">Date</div>
    <div class="col-duree">Durée</div>
    <div class="col-comment">Commentaires</div>
  `;
  calendar.appendChild(header);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);

    const row = document.createElement("div");
    row.className = "day-row";

    if (isWeekend(date)) row.classList.add("weekend");
    if (isJourFerie(date)) row.classList.add("ferie");

    const vac = getVacancesZoneA(date);
    if (vac) {
      row.classList.add("vacancesA");
      row.title = vac.label;
    }

    const jour = date
      .toLocaleDateString("fr-FR", { weekday: "short" })
      .toUpperCase()
      .replace(".", "");

    row.innerHTML = `
      <div class="col-date">${jour}. ${pad(d)}</div>
      <input class="col-duree" maxlength="5" />
      <input class="col-comment" maxlength="30" />
    `;

    calendar.appendChild(row);
  }
}

// =======================
// NAVIGATION MOIS
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


