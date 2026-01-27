// ----------------------------
// calendar.js
// ----------------------------

console.log("calendar.js chargé");

let currentMonth = new Date();
currentMonth.setDate(1);

let vacancesZoneA = [];

// jours fériés fixes
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

function pad(n) {
  return n.toString().padStart(2, "0");
}

function isJourFerie(date) {
  const key = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}`;
  return JOURS_FERIES_FIXES.includes(key);
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function isInVacances(date) {
  return vacancesZoneA.some(v => {
    const start = new Date(v.start);
    const end = new Date(v.end);
    return date >= start && date <= end;
  });
}

function loadVacancesZoneA() {
  const cache = localStorage.getItem("vacancesZoneA");

  if (cache) {
    vacancesZoneA = JSON.parse(cache);
    console.log("Vacances chargées depuis cache:", vacancesZoneA.length);
    return Promise.resolve();
  }

  const url =
    "https://data.education.gouv.fr/api/explore/v2.0/catalog/datasets/fr-en-calendrier-scolaire/records?limit=500";

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

      vacancesZoneA = data.results
        .filter(r => r.record.zones === "Zone A")
        .map(r => ({
          start: r.record.start_date,
          end: r.record.end_date,
          label: r.record.description
        }));

      localStorage.setItem("vacancesZoneA", JSON.stringify(vacancesZoneA));
      console.log("Vacances chargées depuis API:", vacancesZoneA.length);
    })
    .catch(err => {
      console.error("Vacances scolaires indisponibles", err);
      vacancesZoneA = [];
    });
}

function renderMonth() {
  const monthName = currentMonth.toLocaleString("fr-FR", { month: "long" });
  const year = currentMonth.getFullYear();
  document.getElementById("monthTitle").textContent = `${monthName} ${year}`;

  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  // entête colonnes
  const header = document.createElement("div");
  header.className = "table-header";
  header.innerHTML = `
    <div class="col-date">Date</div>
    <div class="col-duree">Durée</div>
    <div class="col-comment">Commentaires</div>
  `;
  calendar.appendChild(header);

  // parcourir les jours du mois
  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, currentMonth.getMonth(), day);

    const row = document.createElement("div");
    row.className = "day-row";

    if (isWeekend(date)) row.classList.add("weekend");
    if (isJourFerie(date)) row.classList.add("ferie");
    if (isInVacances(date)) row.classList.add("vacances");

    // colonne 1 : date
    const col1 = document.createElement("div");
    col1.className = "col-date";
    col1.textContent = date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }).toUpperCase();

    // colonne 2 : durée (5 chars max)
    const col2 = document.createElement("input");
    col2.className = "col-duree";
    col2.maxLength = 5;

    // colonne 3 : commentaires (30 chars max)
    const col3 = document.createElement("input");
    col3.className = "col-comment";
    col3.maxLength = 30;

    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);

    calendar.appendChild(row);
  }
}

function prevMonth() {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderMonth();
}

function nextMonth() {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderMonth();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready");
  loadVacancesZoneA().then(() => {
    console.log("vacances chargées :", vacancesZoneA.length);
    renderMonth();
  });
});
