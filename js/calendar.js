let currentDate = new Date();
let uid = null;
let vacancesZoneA = vacancesData.A || [];

/* AUTH */
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    uid = user.uid;
    renderMonth();
  }
});

/* FORMAT YYYY-MM-DD */
function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* HOLIDAYS FR */
function getFrenchHolidays(year) {
  const holidays = [];
  [
    "01-01",
    "05-01",
    "05-08",
    "07-14",
    "08-15",
    "11-01",
    "11-11",
    "12-25"
  ].forEach(d => holidays.push(`${year}-${d}`));

  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);

  const easter = new Date(year, month - 1, day);

  const addDays = d => {
    const x = new Date(easter);
    x.setDate(x.getDate() + d);
    holidays.push(formatKey(x));
  };

  addDays(1);
  addDays(39);
  addDays(50);

  return holidays;
}

/* VACANCES ZONE A */
function isVacancesZoneA(date) {
  const key = formatKey(date);
  return vacancesZoneA.some(v => key >= v.start && key <= v.end);
}

/* RENDER */
function renderMonth() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const holidays = getFrenchHolidays(y);

  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  document.getElementById("weekLabel").innerText =
    first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const header = document.createElement("div");
  header.className = "table-header";
  header.innerHTML = `
    <div>Date</div>
    <div>Durée</div>
    <div>Commentaires</div>
  `;
  calendar.appendChild(header);

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(y, m, d);
    const key = formatKey(date);

    const row = document.createElement("div");
    row.className = "day-row";

    const day = date.getDay();
    if (day === 0 || day === 6) row.classList.add("weekend");
    if (holidays.includes(key)) row.classList.add("holiday");
    if (isVacancesZoneA(date)) row.classList.add("vacancesA");

    const colDate = document.createElement("div");
    colDate.className = "col-date";

    const jour = date.toLocaleDateString("fr-FR", { weekday: "short" }).toUpperCase();
    const num = String(d).padStart(2, "0");

    colDate.innerText = `${jour}\u00A0${num}`;

    const duration = document.createElement("input");
    duration.maxLength = 5;

    const comment = document.createElement("input");
    comment.maxLength = 30;

    db.ref(`users/${uid}/calendar/${key}`)
      .once("value")
      .then(snap => {
        const v = snap.val() || {};
        duration.value = v.duration || "";
        comment.value = v.comment || "";
      });

    function save() {
      db.ref(`users/${uid}/calendar/${key}`).set({
        duration: duration.value,
        comment: comment.value
      });
    }

    duration.addEventListener("input", save);
    comment.addEventListener("input", save);

    row.append(colDate, duration, comment);
    calendar.appendChild(row);
  }
}

/* NAV */
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMonth();
}
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMonth();
}

/* SWIPE */
let startX = 0;
document.addEventListener("touchstart", e => startX = e.touches[0].clientX);
document.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 60) diff > 0 ? prevMonth() : nextMonth();
});
