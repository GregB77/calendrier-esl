// VARIABLES GLOBALES ==========================================================

let currentDate = new Date();
let vacancesZoneA = [];
let saveTimeout = null;


// JOURS FÉRIÉS ================================================================

const JOURS_FERIES_FIXES = [
  "01-01",  // Nouvel an
  "01-05",  // Fête du travail
  "08-05",  // Victoire 1945
  "14-07",  // Fête nationale
  "15-08",  // Assomption
  "01-11",  // Toussaint
  "11-11",  // Armistice 1918
  "25-12"   // Noël
];

function getEasterDate(year) {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);

  return new Date(year, month - 1, day);
}

function getJoursFeriesMobiles(year) {
  const easter = getEasterDate(year);

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  return [
    addDays(easter, 1),   // Lundi de Pâques
    addDays(easter, 39),  // Ascension
    addDays(easter, 50)   // Lundi de Pentecôte
  ];
}


// OUTILS ======================================================================

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
  // Jours fixes
  const key = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}`;
  if (JOURS_FERIES_FIXES.includes(key)) return true;

  // Jours mobiles
  const mobiles = getJoursFeriesMobiles(date.getFullYear());
  return mobiles.some(d =>
    d.getDate() === date.getDate() &&
    d.getMonth() === date.getMonth()
  );
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}


// VACANCES SCOLAIRES – API ====================================================

function loadVacancesZoneA() {
  const cache = localStorage.getItem("vacancesZoneA");
  const cacheTime = localStorage.getItem("vacancesZoneATime");

  // Cache valide 30 jours
  if (cache && cacheTime && (Date.now() - parseInt(cacheTime)) < 30 * 24 * 60 * 60 * 1000) {
    vacancesZoneA = JSON.parse(cache);
    return Promise.resolve();
  }

  const url = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?limit=99&refine=location%3A%22Lyon%22";

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

      localStorage.setItem("vacancesZoneA", JSON.stringify(vacancesZoneA));
      localStorage.setItem("vacancesZoneATime", Date.now().toString());

      // console.table(vacancesZoneA); // debug utile
    })
    .catch(err => {
      console.error("Vacances scolaires indisponibles", err);
      vacancesZoneA = [];
    });
}

function getVacancesZoneA(date) {
  const time = date.getTime();

  return vacancesZoneA.find(v => {
    return time >= new Date(v.start).getTime() &&
           time <= new Date(v.end).getTime();
  }) || null;
}


// INDICATEUR DE SAUVEGARDE ====================================================

function showSaveIndicator() {
  const indicator = document.getElementById("saveIndicator");
  if (!indicator) return;
  
  indicator.classList.add("show");
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    indicator.classList.remove("show");
  }, 2000);
}


// RENDER DU MOIS ==============================================================

function renderMonth() {
  const calendar = document.getElementById("calendar");
  if (!calendar) return;
  
  calendar.innerHTML = "";

  // Mise à jour du titre
  const title = document.getElementById("monthTitle");
  if (title) {
    title.textContent = currentDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  // Génération des jours
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const row = createDayRow(date, d);
    calendar.appendChild(row);
  }
}

function createDayRow(date, dayNumber) {
  const row = document.createElement("div");
  row.className = "day-row";

  // Classes spéciales
  if (isWeekend(date)) row.classList.add("weekend");
  if (isJourFerie(date)) row.classList.add("ferie");
  if (isToday(date)) row.classList.add("today");

  // Vacances
  const vac = getVacancesZoneA(date);
  if (vac) {
    row.classList.add("holiday");
    row.title = vac.label;
  }

  // Label du jour
  const jour = date
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .toUpperCase()
    .replace(".", "");

  // Construction du HTML
  row.innerHTML = `
    <div class="col-date">${jour}. ${pad(dayNumber)}</div>
    <input 
      class="col-duree" 
      type="text"
      inputmode="text"
      autocomplete="off"
      placeholder="Durée"
      data-date="${formatKey(date)}"
      data-field="duree"
    />
    <input 
      class="col-comment" 
      type="text"
      maxlength="100" 
      placeholder="Ajouter un commentaire..."
      data-date="${formatKey(date)}"
      data-field="comment"
    />
  `;

  // Ajout des événements
  const inputs = row.querySelectorAll("input");
  inputs.forEach(input => {
    input.addEventListener("input", handleInputChange);
  });

  return row;
}


// GESTION DES INPUTS ==========================================================

function handleInputChange(e) {
  const input = e.target;
  const date = input.dataset.date;
  const field = input.dataset.field;
  const value = input.value;

  // Sauvegarde (simulée ici, à connecter à Firebase)
  saveData(date, field, value);
  showSaveIndicator();
}

function handleInputFocus(e) {
  const row = e.target.closest(".day-row");
  if (row) {
    row.style.transform = "translateX(8px)";
  }
}

function saveData(date, field, value) {
  // Cette fonction devra être connectée à Firebase
  // Pour l'instant, sauvegarde locale
  const key = `calendar_${date}_${field}`;
  localStorage.setItem(key, value);
  console.log(`💾 Saved: ${key} = ${value}`);
}

function loadData(date, field) {
  const key = `calendar_${date}_${field}`;
  return localStorage.getItem(key) || "";
}


// NAVIGATION MOIS =============================================================

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMonth();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMonth();
}

function goToday() {
  currentDate = new Date();
  renderMonth();
  setTimeout(() => {
    const todayRow = document.querySelector(".day-row.today");
    if (todayRow) {
      todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = todayRow.querySelector("input");
      if (input) input.focus();
    }
  }, 100);
}


// SWIPE MOBILE ================================================================

let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;

document.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  isSwiping = false;
}, { passive: true });

document.addEventListener("touchmove", e => {
  if (!isSwiping) {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    
    if (dx > dy && dx > 10) {
      isSwiping = true;
    }
  }
}, { passive: true });

document.addEventListener("touchend", e => {
  if (isSwiping) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    
    if (Math.abs(dx) > 100) {
      if (dx > 0) {
        prevMonth();
      } else {
        nextMonth();
      }
    }
  }
  isSwiping = false;
}, { passive: true });


// RACCOURCIS CLAVIER ==========================================================

document.addEventListener("keydown", e => {
  if (document.activeElement.tagName !== "INPUT") {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevMonth();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextMonth();
    } else if (e.key === "t" || e.key === "T") {
      e.preventDefault();
      goToday();
    }
  }
});


// INIT ========================================================================

document.addEventListener("DOMContentLoaded", () => {
  loadVacancesZoneA()
    .then(renderMonth)
    .catch(err => {
      console.error("Erreur d'initialisation:", err);
      renderMonth();
    });
});


