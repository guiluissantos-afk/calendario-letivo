/* =========================================================
   CALENDÁRIO LETIVO – SCRIPT FINAL COM DATAS FIXAS + FIRESTORE
   Guilherme – Versão 2026
   MODIFICAÇÃO: Sistema de duas páginas (visualização/editor)
   Integração Firestore (Opção A)
========================================================= */

/* ============================================
   (o restante do script original permanece igual)
   -- variáveis, cores, initialCalendarData, etc.
   Aqui incluí apenas o código completo com a
   integração Firestore adicionada.
============================================ */

let calendarData = null;
let editMode = false; // Por padrão, modo de visualização

// início do ano letivo 2026 (fixo: 09/02/2026)
const INICIO_2026_FIXO = {
  year: 2026,
  monthIndex: 1, // Fevereiro (0-based)
  day: 9,
};

// elementos DOM (serão inicializados após o DOM carregar)
let yearCalendarEl, totalAnoAtualEl, inicioAnoLetivoEl, fimAnoLetivoEl;

// CORES SUAVIZADAS (saturação reduzida em 30%)
const COLOR_MAP = {
  comum: "#7bbf7d", // Verde suavizado
  evento: "#77b5fe", // Azul suavizado
  sabado_letivo: "#a3d17a", // Verde claro suavizado
  avaliacao: "#7986cb", // Azul índigo suavizado
  ferias: "#ff8a80", // Vermelho suavizado
  recesso: "#ffb74d", // Laranja suavizado
  recesso_professores: "#ff8a65", // Laranja escuro suavizado
  feriado: "#ba68c8", // Roxo suavizado
  paralisacao: "#a1887f", // Marrom suavizado
  recuperacao: "#ffd54f", // Amarelo suavizado
};

const TEXT_COLOR_MAP = {
  comum: "#1a3c1a",
  evento: "#0a2c5a",
  sabado_letivo: "#2a451a",
  avaliacao: "#0d153f",
  feriado: "#2d0a33",
  recesso: "#663500",
  recesso_professores: "#5d1a00",
  ferias: "#5d0000",
  paralisacao: "#2e1e1a",
  recuperacao: "#5d4300",
};

const LETIVO_TYPES = ["comum", "evento", "avaliacao", "sabado_letivo"];

const COLORED_WEEKEND_TYPES = [
  "sabado_letivo",
  "ferias",
  "feriado",
  "recesso_professores",
  "recesso",
  "paralisacao",
  "recuperacao",
];

const initialCalendarData = {
  year: 2026,
  months: [
    {
      name: "Janeiro 2026",
      year: 2026,
      days: 31,
      startDay: 4,
      daysData: {
        1: {
          type: "feriado",
          title: "Confraternização Universal",
          letivo: false,
          color: COLOR_MAP.feriado,
        },
        2: {
          type: "recesso",
          title: "Recesso",
          letivo: false,
          color: COLOR_MAP.recesso,
        },
        4: {
          type: "comum",
          title: "Dia letivo 2025",
          letivo: true,
          color: COLOR_MAP.comum,
        },
        5: {
          type: "comum",
          title: "Dia letivo 2025",
          letivo: true,
          color: COLOR_MAP.comum,
        },
        6: {
          type: "comum",
          title: "Último dia letivo 2025",
          letivo: true,
          color: COLOR_MAP.comum,
        },
      },
    },
    {
      name: "Fevereiro 2026",
      year: 2026,
      days: 28,
      startDay: 0,
      daysData: {
        1: {
          type: "recesso_professores",
          title: "Recesso dos Professores 2025",
          letivo: false,
          color: COLOR_MAP.recesso_professores,
        },
        2: {
          type: "recesso_professores",
          title: "Recesso dos Professores 2025",
          letivo: false,
          color: COLOR_MAP.recesso_professores,
        },
        3: {
          type: "recesso_professores",
          title: "Recesso dos Professores 2025",
          letivo: false,
          color: COLOR_MAP.recesso_professores,
        },
        4: {
          type: "recesso_professores",
          title: "Recesso dos Professores 2025",
          letivo: false,
          color: COLOR_MAP.recesso_professores,
        },
        9: {
          type: "comum",
          title: "Início do ano letivo 2026",
          letivo: true,
          color: COLOR_MAP.comum,
        },
      },
    },
    { name: "Março 2026", year: 2026, days: 31, startDay: 0, daysData: {} },
    { name: "Abril 2026", year: 2026, days: 30, startDay: 3, daysData: {} },
    { name: "Maio 2026", year: 2026, days: 31, startDay: 5, daysData: {} },
    { name: "Junho 2026", year: 2026, days: 30, startDay: 1, daysData: {} },
    { name: "Julho 2026", year: 2026, days: 31, startDay: 3, daysData: {} },
    { name: "Agosto 2026", year: 2026, days: 31, startDay: 6, daysData: {} },
    { name: "Setembro 2026", year: 2026, days: 30, startDay: 2, daysData: {} },
    { name: "Outubro 2026", year: 2026, days: 31, startDay: 4, daysData: {} },
    { name: "Novembro 2026", year: 2026, days: 30, startDay: 0, daysData: {} },
    { name: "Dezembro 2026", year: 2026, days: 31, startDay: 2, daysData: {} },
    { name: "Janeiro 2027", year: 2027, days: 31, startDay: 5, daysData: {} },
    { name: "Fevereiro 2027", year: 2027, days: 28, startDay: 1, daysData: {} },
  ],
};

function loadCalendar() {
  // Tentar carregar do Firestore primeiro (se inicializado)
  if (typeof db !== "undefined") {
    // tentativa assíncrona: loadFromFirestore retorna Promise
    return loadFromFirestore()
      .then((loaded) => {
        if (loaded) {
          // já atribuiu calendarData dentro de loadFromFirestore
          restoreFixedDates();
          return;
        } else {
          // fallback para local
          const saved = localStorage.getItem("calendario_letivo_2026");
          if (saved) {
            calendarData = JSON.parse(saved);
            restoreFixedDates();
          } else {
            calendarData = JSON.parse(JSON.stringify(initialCalendarData));
            applyRecuperacaoFinal();
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar do Firestore:", err);
        // fallback local
        const saved = localStorage.getItem("calendario_letivo_2026");
        if (saved) {
          calendarData = JSON.parse(saved);
          restoreFixedDates();
        } else {
          calendarData = JSON.parse(JSON.stringify(initialCalendarData));
          applyRecuperacaoFinal();
        }
      });
  } else {
    const saved = localStorage.getItem("calendario_letivo_2026");
    if (saved) {
      calendarData = JSON.parse(saved);
      restoreFixedDates();
    } else {
      calendarData = JSON.parse(JSON.stringify(initialCalendarData));
      applyRecuperacaoFinal();
    }
    return Promise.resolve();
  }
}

function saveCalendar() {
  localStorage.setItem("calendario_letivo_2026", JSON.stringify(calendarData));
  // Salvar no Firestore (se disponível) — com debounce
  if (typeof db !== "undefined") {
    debounceSaveToFirestore();
  }
}

function applyRecuperacaoFinal() {
  const startDate = new Date(2026, 0, 7); // 07/01/2026
  const endDate = new Date(2026, 0, 20); // 20/01/2026

  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado

    // Apenas dias úteis (segunda a sexta)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const day = date.getDate();
      calendarData.months[0].daysData[day] = {
        type: "recuperacao",
        title: "Recuperação Final 2025",
        letivo: false,
        color: COLOR_MAP.recuperacao,
      };
    }
  }

  // Aplicar recesso dos professores (21/01 a 04/02 - dias corridos)
  const recessoStart = new Date(2026, 0, 21); // 21/01/2026
  const recessoEnd = new Date(2026, 1, 4); // 04/02/2026

  for (
    let date = new Date(recessoStart);
    date <= recessoEnd;
    date.setDate(date.getDate() + 1)
  ) {
    const day = date.getDate();
    const monthIndex = date.getMonth(); // 0 = janeiro, 1 = fevereiro

    calendarData.months[monthIndex].daysData[day] = {
      type: "recesso_professores",
      title: "Recesso dos Professores 2025",
      letivo: false,
      color: COLOR_MAP.recesso_professores,
    };
  }
}

function restoreFixedDates() {
  const fixedJanDays = {
    1: {
      type: "feriado",
      title: "Confraternização Universal",
      letivo: false,
      color: COLOR_MAP.feriado,
    },
    2: {
      type: "recesso",
      title: "Recesso",
      letivo: false,
      color: COLOR_MAP.recesso,
    },
    4: {
      type: "comum",
      title: "Dia letivo 2025",
      letivo: true,
      color: COLOR_MAP.comum,
    },
    5: {
      type: "comum",
      title: "Dia letivo 2025",
      letivo: true,
      color: COLOR_MAP.comum,
    },
    6: {
      type: "comum",
      title: "Último dia letivo 2025",
      letivo: true,
      color: COLOR_MAP.comum,
    },
  };

  for (let day in fixedJanDays) {
    calendarData.months[0].daysData[day] = { ...fixedJanDays[day] };
  }

  applyRecuperacaoFinal();

  const fixedFebDays = {
    1: {
      type: "recesso_professores",
      title: "Recesso dos Professores 2025",
      letivo: false,
      color: COLOR_MAP.recesso_professores,
    },
    2: {
      type: "recesso_professores",
      title: "Recesso dos Professores 2025",
      letivo: false,
      color: COLOR_MAP.recesso_professores,
    },
    3: {
      type: "recesso_professores",
      title: "Recesso dos Professores 2025",
      letivo: false,
      color: COLOR_MAP.recesso_professores,
    },
    4: {
      type: "recesso_professores",
      title: "Recesso dos Professores 2025",
      letivo: false,
      color: COLOR_MAP.recesso_professores,
    },
    9: {
      type: "comum",
      title: "Início do ano letivo 2026",
      letivo: true,
      color: COLOR_MAP.comum,
    },
  };

  for (let day in fixedFebDays) {
    if (parseInt(day) <= 9) {
      calendarData.months[1].daysData[day] = { ...fixedFebDays[day] };
    }
  }
}

function detectEndDate2026() {
  let ultimoDiaLetivo = null;

  for (let mi = calendarData.months.length - 1; mi >= 0; mi--) {
    const month = calendarData.months[mi];

    for (let d = month.days; d >= 1; d--) {
      const info = month.daysData[d];

      if (
        mi < INICIO_2026_FIXO.monthIndex ||
        (mi === INICIO_2026_FIXO.monthIndex && d < INICIO_2026_FIXO.day)
      ) {
        continue;
      }

      if (info && info.type === "recuperacao" && (mi > 0 || d > 20)) {
        continue;
      }

      if (info && LETIVO_TYPES.includes(info.type)) {
        ultimoDiaLetivo = { monthIndex: mi, day: d };
        return ultimoDiaLetivo;
      }
    }
  }

  return null;
}

function renderCalendar() {
  if (!yearCalendarEl) {
    yearCalendarEl = document.getElementById("yearCalendar");
    totalAnoAtualEl = document.getElementById("totalAnoAtual");
    inicioAnoLetivoEl = document.getElementById("inicioAnoLetivo");
    fimAnoLetivoEl = document.getElementById("fimAnoLetivo");
  }

  yearCalendarEl.innerHTML = "";

  calendarData.months.forEach((month, monthIndex) => {
    const monthEl = createMonthElement(month, monthIndex);
    yearCalendarEl.appendChild(monthEl);
  });

  updateStatistics();
  saveCalendar();
}

function createMonthElement(month, monthIndex) {
  const box = document.createElement("div");
  box.className = "month-container";

  const header = document.createElement("div");
  header.className = "month-header";

  const monthName = document.createElement("span");
  monthName.textContent = month.name;
  monthName.title = "Clique para ver detalhes do mês";
  monthName.onclick = () => openMonthViewModal(monthIndex);
  header.appendChild(monthName);

  if (editMode) {
    const editIcon = document.createElement("span");
    editIcon.className = "edit-month-icon";
    editIcon.textContent = "📝";
    editIcon.title = "Editar mês";
    editIcon.onclick = () => openMonthModal(monthIndex);
    header.appendChild(editIcon);
  }

  box.appendChild(header);

  const weekRow = document.createElement("div");
  weekRow.className = "weekday-row";
  ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach((w) => {
    const wEl = document.createElement("div");
    wEl.className = "weekday";
    wEl.textContent = w;
    weekRow.appendChild(wEl);
  });
  box.appendChild(weekRow);

  const grid = document.createElement("div");
  grid.className = "month-grid";

  let offset;
  if (monthIndex < initialCalendarData.months.length) {
    offset = initialCalendarData.months[monthIndex].startDay;
  } else {
    offset = month.startDay;
  }

  for (let i = 0; i < offset; i++) {
    const empty = document.createElement("div");
    empty.className = "empty-cell";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= month.days; d++) {
    const cell = createDayCell(monthIndex, d);
    grid.appendChild(cell);
  }

  box.appendChild(grid);

  const total = document.createElement("div");
  total.className = "month-total";
  const total2026 = calculateMonthDays2026(monthIndex);
  total.innerHTML = `
    <div class="month-total-2026">${total2026}</div>
    <div class="month-total-label">dias letivos</div>
  `;
  box.appendChild(total);

  return box;
}

function createDayCell(monthIndex, day) {
  const month = calendarData.months[monthIndex];
  const info = month.daysData[day] || null;
  const dow = getDayOfWeek(month.year, monthIndex + 1, day);
  const year = month.year;

  const cell = document.createElement("div");
  cell.className = "day-cell";

  const isEditable = editMode && isDayEditable(monthIndex, day);

  if (!isEditable && editMode) {
    cell.classList.add("non-editable");
    cell.title = "Período fixo - não editável";
  }

  if (monthIndex === 0 && day === 6) {
    cell.classList.add("last-day-2025");
  }

  const num = document.createElement("div");
  num.className = "day-number";
  num.textContent = day;
  cell.appendChild(num);

  if (monthIndex === 1 && day === 9) {
    cell.classList.add("first-day-2026");
  }

  const endDate = detectEndDate2026();
  if (endDate && monthIndex === endDate.monthIndex && day === endDate.day) {
    cell.classList.add("last-day-2026");
  }

  if (info) {
    cell.dataset.type = info.type;

    const isWeekend = dow === 0 || dow === 6;

    if (dow === 6 && LETIVO_TYPES.includes(info.type)) {
      cell.style.backgroundColor = COLOR_MAP.sabado_letivo;
      cell.style.color = TEXT_COLOR_MAP.sabado_letivo;
      cell.classList.add("sabado-letivo-verde");
      cell.classList.add("colored-weekend");
    } else if (isWeekend) {
      if (COLORED_WEEKEND_TYPES.includes(info.type)) {
        cell.style.backgroundColor = COLOR_MAP[info.type];
        cell.style.color = TEXT_COLOR_MAP[info.type];
        cell.classList.add("colored-weekend");
      } else {
        cell.style.backgroundColor = "#ffffff";
        cell.style.color = "#6b7280";
        cell.classList.add("weekend-no-color");
      }
    } else {
      if (info.type && COLOR_MAP[info.type]) {
        cell.style.backgroundColor = COLOR_MAP[info.type];
        cell.style.color = TEXT_COLOR_MAP[info.type];
      }
    }

    const typeNames = {
      comum: "Dia Letivo",
      evento: "Evento Escolar",
      avaliacao: "Avaliação",
      sabado_letivo: "Sábado Letivo",
      feriado: "Feriado",
      recesso: "Recesso",
      recesso_professores: "Recesso dos Professores",
      ferias: "Férias",
      paralisacao: "Paralisação",
      recuperacao: "Recuperação Final",
    };

    let tooltipText = typeNames[info.type];

    if (info.title && info.title.trim() !== "") {
      tooltipText += `: ${info.title}`;
    }

    if (info.description && info.description.trim() !== "") {
      tooltipText += `\n${info.description}`;
    }

    if (dow === 6 && LETIVO_TYPES.includes(info.type)) {
      tooltipText += "\n✓ Sábado Letivo";
    }

    if (isWeekend && !COLORED_WEEKEND_TYPES.includes(info.type)) {
      tooltipText += " (Final de semana - sem cor)";
    }

    cell.setAttribute("data-title", tooltipText);
    // também deixar atributo compatível com tooltip minimalista
    cell.setAttribute("data-tooltip", tooltipText);
  } else {
    if (dow === 0 || dow === 6) {
      cell.classList.add("weekend");
      cell.style.backgroundColor = "#f3f4f6";
      cell.style.color = "#9ca3af";
    } else {
      cell.style.backgroundColor = "#f9fafb";
      cell.style.color = "#6b7280";
    }
  }

  cell.addEventListener("click", () => {
    if (!editMode) return;
    if (!isEditable) {
      alert(
        "Este dia não pode ser editado. É parte do período fixo do ano anterior."
      );
      return;
    }
    openDayModal(monthIndex, day);
  });

  return cell;
}

function isSaturday(year, monthIndex, day) {
  const dow = getDayOfWeek(year, monthIndex + 1, day);
  return dow === 6;
}

function isDayEditable(monthIndex, day) {
  const month = calendarData.months[monthIndex];
  const year = month.year;

  if (isSaturday(year, monthIndex, day)) {
    if (year > 2026 || (year === 2026 && monthIndex >= 1)) {
      return true;
    }
  }

  if (monthIndex === 0) return false;

  if (monthIndex === 1) {
    if (day >= 1 && day <= 4) return false;
    if (day === 9) return false;
    return true;
  }

  return true;
}

function getDayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay();
}

let dayModal, closeDayModal, dayTitleInput, dayDescInput, dayTypeSelect;
let saveDayBtn, setStartBtn, setEndBtn, deleteDayBtn;
let selectedMonth = null,
  selectedDay = null;

function initEditorModals() {
  dayModal = document.getElementById("dayModal");
  if (!dayModal) return;

  closeDayModal = document.getElementById("closeDayModal");
  dayTitleInput = document.getElementById("dayTitle");
  dayDescInput = document.getElementById("dayDescription");
  dayTypeSelect = document.getElementById("dayType");
  saveDayBtn = document.getElementById("saveDay");
  setStartBtn = document.getElementById("setPeriodStart");
  setEndBtn = document.getElementById("setPeriodEnd");
  deleteDayBtn = document.getElementById("deleteDay");

  if (closeDayModal && !closeDayModal.hasListener) {
    closeDayModal.addEventListener("click", () => {
      dayModal.style.display = "none";
    });
    closeDayModal.hasListener = true;
  }

  if (saveDayBtn && !saveDayBtn.hasListener) {
    saveDayBtn.addEventListener("click", () => {
      applyDayEdit(selectedMonth, selectedDay, dayTypeSelect.value);
      dayModal.style.display = "none";
      renderCalendar();
    });
    saveDayBtn.hasListener = true;
  }

  if (deleteDayBtn && !deleteDayBtn.hasListener) {
    deleteDayBtn.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja apagar o evento deste dia?")) {
        deleteDayEvent(selectedMonth, selectedDay);
        dayModal.style.display = "none";
        renderCalendar();
      }
    });
    deleteDayBtn.hasListener = true;
  }

  if (setStartBtn && !setStartBtn.hasListener) {
    setStartBtn.addEventListener("click", () => {
      if (!isDayEditable(selectedMonth, selectedDay)) {
        alert("Não é possível definir período em dias não editáveis.");
        return;
      }
      periodStart = { monthIndex: selectedMonth, day: selectedDay };
      alert("Início do período definido.");
      dayModal.style.display = "none";
    });
    setStartBtn.hasListener = true;
  }

  if (setEndBtn && !setEndBtn.hasListener) {
    setEndBtn.addEventListener("click", () => {
      if (!periodStart) {
        alert("Você deve primeiro definir o início do período.");
        return;
      }

      if (!isDayEditable(selectedMonth, selectedDay)) {
        alert("Não é possível definir período em dias não editáveis.");
        return;
      }

      periodEnd = { monthIndex: selectedMonth, day: selectedDay };
      applyPeriod(periodStart, periodEnd, dayTypeSelect.value);

      periodStart = null;
      periodEnd = null;

      dayModal.style.display = "none";
      renderCalendar();
    });
    setEndBtn.hasListener = true;
  }
}

function openDayModal(monthIndex, day) {
  initEditorModals();

  if (!dayModal) {
    console.error(
      "Modal de dia não encontrado. Certifique-se de estar na página de editor."
    );
    return;
  }

  selectedMonth = monthIndex;
  selectedDay = day;

  const month = calendarData.months[monthIndex];
  const info = month.daysData[day] || {};

  dayTitleInput.value = info.title || "";
  dayDescInput.value = info.description || "";
  dayTypeSelect.value = info.type || "comum";

  document.getElementById(
    "modalDayTitle"
  ).textContent = `${day} de ${month.name}`;

  const dow = getDayOfWeek(month.year, monthIndex + 1, day);
  if (dow === 6) {
    const year = month.year;
    if (year > 2026 || (year === 2026 && monthIndex >= 1)) {
      const modalTitle = document.getElementById("modalDayTitle");
      modalTitle.innerHTML = `${day} de ${month.name} <span style="color:#34c9a6; font-size:0.8em;">(Sábado - pode ser definido como dia letivo)</span>`;

      if (!info.type || info.type === "") {
        dayTypeSelect.value = "comum";
      }
    }
  }

  dayModal.style.display = "flex";
}

function applyDayEdit(monthIndex, day, type) {
  const month = calendarData.months[monthIndex];

  if (!isDayEditable(monthIndex, day)) return;

  month.daysData[day] = {
    type,
    title: dayTitleInput.value.trim(),
    description: dayDescInput.value.trim(),
    letivo: LETIVO_TYPES.includes(type),
    color: COLOR_MAP[type],
  };
}

function deleteDayEvent(monthIndex, day) {
  const month = calendarData.months[monthIndex];

  if (!isDayEditable(monthIndex, day)) return;

  if (month.daysData[day]) {
    delete month.daysData[day];
  }
}

let periodStart = null;
let periodEnd = null;

function applyPeriod(start, end, type) {
  const startObj = dateObj(start);
  const endObj = dateObj(end);

  if (isDateGreater(startObj, endObj)) {
    const temp = { ...start };
    start = { ...end };
    end = temp;
  }

  for (let mi = start.monthIndex; mi <= end.monthIndex; mi++) {
    const month = calendarData.months[mi];

    const fromDay = mi === start.monthIndex ? start.day : 1;
    const toDay = mi === end.monthIndex ? end.day : month.days;

    for (let d = fromDay; d <= toDay; d++) {
      if (isDayEditable(mi, d)) {
        month.daysData[d] = {
          type,
          title: dayTitleInput.value.trim(),
          description: dayDescInput.value.trim(),
          letivo: LETIVO_TYPES.includes(type),
          color: COLOR_MAP[type],
        };
      }
    }
  }
}

function dateObj(point) {
  const year = calendarData.months[point.monthIndex].year;
  return {
    year,
    month: point.monthIndex + 1,
    day: point.day,
  };
}

function isDateGreater(a, b) {
  if (a.year !== b.year) return a.year > b.year;
  if (a.month !== b.month) return a.month > b.month;
  return a.day > b.day;
}

function calculateMonthDays2026(monthIndex) {
  const month = calendarData.months[monthIndex];
  let count = 0;

  for (let d = 1; d <= month.days; d++) {
    if (
      monthIndex < INICIO_2026_FIXO.monthIndex ||
      (monthIndex === INICIO_2026_FIXO.monthIndex && d < INICIO_2026_FIXO.day)
    ) {
      continue;
    }

    const info = month.daysData[d];
    const dow = getDayOfWeek(month.year, monthIndex + 1, d);

    if (dow === 6) {
      if (info && LETIVO_TYPES.includes(info.type)) {
        count++;
      }
      continue;
    }

    if (dow === 0) {
      continue;
    }

    if (info && LETIVO_TYPES.includes(info.type)) {
      count++;
    }
  }

  return count;
}

function calculateYearTotal2026() {
  let total = 0;
  for (let i = 0; i < calendarData.months.length; i++) {
    total += calculateMonthDays2026(i);
  }
  return total;
}

function updateStatistics() {
  if (!totalAnoAtualEl || !inicioAnoLetivoEl || !fimAnoLetivoEl) {
    return;
  }

  const total2026 = calculateYearTotal2026();

  totalAnoAtualEl.textContent = total2026;

  updateProgressBar(total2026);

  const inicioSpan = inicioAnoLetivoEl.querySelector("span");
  const fimSpan = fimAnoLetivoEl.querySelector("span");

  inicioSpan.textContent = "09 de Fevereiro 2026";
  fimSpan.textContent = "Não definido";

  const endDate = detectEndDate2026();
  if (endDate) {
    const month = calendarData.months[endDate.monthIndex];
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const monthName = monthNames[endDate.monthIndex % 12];
    fimSpan.textContent = `${endDate.day} de ${monthName}`;
  }

  const totalDisplays = document.querySelectorAll(".month-total");
  totalDisplays.forEach((el, i) => {
    const total2026 = calculateMonthDays2026(i);
    const total2026El = el.querySelector(".month-total-2026");
    if (total2026El) {
      total2026El.textContent = total2026;
    } else {
      el.innerHTML = `
        <div class="month-total-2026">${total2026}</div>
        <div class="month-total-label">dias letivos</div>
      `;
    }
  });
}

function updateProgressBar(total2026) {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  if (!progressFill || !progressText) return;

  const percentage = Math.min((total2026 / 200) * 100, 100);
  const percentageFormatted = Math.round(percentage);

  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${percentageFormatted}%`;

  if (percentage >= 100) {
    progressFill.style.background = "#34c9a6";
  } else if (percentage >= 90) {
    progressFill.style.background = "#ffb74d";
  } else {
    progressFill.style.background = "#5d93ff";
  }
}

let monthModal, closeMonthModal, saveMonthBtn;
let monthNameInput, monthDescInput, monthNotesInput, monthTargetInput;
let selectedMonthIndex = null;

function initMonthModal() {
  monthModal = document.getElementById("monthModal");
  if (!monthModal) return;

  closeMonthModal = document.getElementById("closeMonthModal");
  saveMonthBtn = document.getElementById("saveMonth");
  monthNameInput = document.getElementById("monthName");
  monthDescInput = document.getElementById("monthDesc");
  monthNotesInput = document.getElementById("monthNotes");
  monthTargetInput = document.getElementById("monthTarget");

  if (closeMonthModal && !closeMonthModal.hasListener) {
    closeMonthModal.addEventListener("click", () => {
      monthModal.style.display = "none";
    });
    closeMonthModal.hasListener = true;
  }

  if (saveMonthBtn && !saveMonthBtn.hasListener) {
    saveMonthBtn.addEventListener("click", () => {
      if (selectedMonthIndex !== null) {
        const month = calendarData.months[selectedMonthIndex];

        month.name = monthNameInput.value.trim();
        month.description = monthDescInput.value.trim();
        month.notes = monthNotesInput.value.trim();
        month.target = monthTargetInput.value
          ? parseInt(monthTargetInput.value)
          : null;

        monthModal.style.display = "none";
        renderCalendar();
      }
    });
    saveMonthBtn.hasListener = true;
  }
}

function openMonthModal(monthIndex) {
  initMonthModal();

  if (!monthModal) {
    console.error(
      "Modal de mês não encontrado. Certifique-se de estar na página de editor."
    );
    return;
  }

  selectedMonthIndex = monthIndex;
  const month = calendarData.months[monthIndex];

  monthNameInput.value = month.name || "";
  monthDescInput.value = month.description || "";
  monthNotesInput.value = month.notes || "";
  monthTargetInput.value = month.target || "";

  document.getElementById(
    "modalMonthTitle"
  ).textContent = `Editar ${month.name}`;
  monthModal.style.display = "flex";
}

function openMonthViewModal(monthIndex) {
  const month = calendarData.months[monthIndex];
  const monthViewModal = document.getElementById("monthViewModal");
  const monthViewTitle = document.getElementById("monthViewTitle");
  const monthViewDescription = document.getElementById("monthViewDescription");
  const monthViewGrid = document.getElementById("monthViewGrid");
  const monthViewNotes = document.getElementById("monthViewNotes");
  const monthViewTarget = document.getElementById("monthViewTarget");

  if (!monthViewModal || !monthViewTitle) {
    console.error("Elementos da visualização do mês não encontrados.");
    return;
  }

  monthViewTitle.textContent = month.name;

  monthViewDescription.innerHTML = month.description
    ? `<strong>Descrição:</strong> ${month.description}`
    : "<em>Sem descrição</em>";

  monthViewGrid.innerHTML = "";

  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  weekdays.forEach((weekday) => {
    const dayHeader = document.createElement("div");
    dayHeader.style.padding = "10px";
    dayHeader.style.background = "var(--gray-100)";
    dayHeader.style.fontWeight = "600";
    dayHeader.style.textAlign = "center";
    dayHeader.style.borderBottom = "2px solid var(--gray-300)";
    dayHeader.textContent = weekday;
    monthViewGrid.appendChild(dayHeader);
  });

  let offset;
  if (monthIndex < initialCalendarData.months.length) {
    offset = initialCalendarData.months[monthIndex].startDay;
  } else {
    offset = month.startDay;
  }

  for (let i = 0; i < offset; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "month-view-day-empty";
    monthViewGrid.appendChild(emptyCell);
  }

  for (let d = 1; d <= month.days; d++) {
    const dayCell = document.createElement("div");
    dayCell.className = "month-view-day";

    const dow = getDayOfWeek(month.year, monthIndex + 1, d);
    if (dow === 0 || dow === 6) {
      dayCell.classList.add("month-view-day-weekend");
    }

    const info = month.daysData[d] || null;

    const dayNumber = document.createElement("div");
    dayNumber.className = "month-view-day-number";
    dayNumber.textContent = d;
    dayCell.appendChild(dayNumber);

    const dayContent = document.createElement("div");
    dayContent.className = "month-view-day-content";

    if (info) {
      dayCell.dataset.type = info.type;

      const typeNames = {
        comum: "Dia Letivo",
        evento: "Evento Escolar",
        avaliacao: "Avaliação",
        sabado_letivo: "Sábado Letivo",
        feriado: "Feriado",
        recesso: "Recesso",
        recesso_professores: "Recesso dos Professores",
        ferias: "Férias",
        paralisacao: "Paralisação",
        recuperacao: "Recuperação Final",
      };

      let contentText = `<strong>${typeNames[info.type]}</strong>`;

      if (info.title && info.title.trim() !== "") {
        contentText += `<br>${info.title}`;
      }

      if (info.description && info.description.trim() !== "") {
        contentText += `<br><small>${info.description}</small>`;
      }

      if (dow === 6 && LETIVO_TYPES.includes(info.type)) {
        contentText += `<br><small>✓ Sábado Letivo</small>`;
      }

      dayContent.innerHTML = contentText;
    } else {
      if (dow === 0 || dow === 6) {
        dayContent.textContent = "Final de semana";
      } else {
        dayContent.textContent = "Dia sem eventos";
      }
    }

    dayCell.appendChild(dayContent);
    monthViewGrid.appendChild(dayCell);
  }

  monthViewNotes.innerHTML = month.notes
    ? `<strong>Observações:</strong> ${month.notes}`
    : "";

  monthViewTarget.innerHTML = month.target
    ? `<strong>Meta de dias letivos:</strong> ${month.target}`
    : "";

  monthViewModal.style.display = "flex";
}

/* =========================================================
   16. EXPORTAÇÃO PARA PDF (COMPARTILHADO)
========================================================= */

async function generatePDF() {
  try {
    if (typeof window.jspdf !== "undefined") {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "mm", "a4");

      doc.setFontSize(20);
      doc.text("Calendário Letivo 2025/2026", 105, 20, { align: "center" });

      const mode = editMode ? "Editor" : "Visualização";
      doc.setFontSize(10);
      doc.text(`Modo: ${mode}`, 20, 15);

      const now = new Date();
      const dateStr = now.toLocaleDateString("pt-BR");
      const timeStr = now.toLocaleTimeString("pt-BR");
      doc.text(`Gerado em: ${dateStr} ${timeStr}`, 105, 15, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.text(
        `Total de dias letivos 2026: ${calculateYearTotal2026()} de 200`,
        20,
        35
      );

      const endDate = detectEndDate2026();
      if (endDate) {
        const monthNames = [
          "Janeiro",
          "Fevereiro",
          "Março",
          "Abril",
          "Maio",
          "Junho",
          "Julho",
          "Agosto",
          "Setembro",
          "Outubro",
          "Novembro",
          "Dezembro",
        ];
        const monthName = monthNames[endDate.monthIndex % 12];
        doc.text(`Fim do ano letivo: ${endDate.day} de ${monthName}`, 20, 45);
      }

      doc.setFontSize(10);
      let yPos = 60;

      const legendItems = [
        { color: COLOR_MAP.comum, label: "Dia Letivo" },
        { color: COLOR_MAP.evento, label: "Evento Escolar" },
        { color: COLOR_MAP.avaliacao, label: "Avaliação" },
        { color: COLOR_MAP.sabado_letivo, label: "Sábado Letivo" },
        { color: COLOR_MAP.feriado, label: "Feriado" },
        { color: COLOR_MAP.recesso, label: "Recesso" },
        { color: COLOR_MAP.recesso_professores, label: "Recesso Professores" },
        { color: COLOR_MAP.ferias, label: "Férias" },
        { color: COLOR_MAP.paralisacao, label: "Paralisação" },
        { color: COLOR_MAP.recuperacao, label: "Recuperação Final" },
      ];

      doc.text("Legenda:", 20, yPos);
      yPos += 10;

      for (let i = 0; i < legendItems.length; i++) {
        if (i % 3 === 0 && i > 0) {
          yPos += 7;
        }

        const xPos = 20 + (i % 3) * 60;

        doc.setFillColor(legendItems[i].color);
        doc.rect(xPos, yPos - 3, 5, 5, "F");

        doc.text(legendItems[i].label, xPos + 7, yPos);
      }

      yPos += 15;

      doc.setFontSize(12);
      doc.text("Resumo por Mês:", 20, yPos);
      yPos += 10;

      for (let i = 0; i < calendarData.months.length; i++) {
        const month = calendarData.months[i];
        const total = calculateMonthDays2026(i);

        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.text(`${month.name}: ${total} dias letivos`, 20, yPos);
        yPos += 7;

        const specialDays = [];
        for (let d = 1; d <= month.days; d++) {
          const info = month.daysData[d];
          if (info && info.title) {
            specialDays.push(`${d}: ${info.title}`);
          }
        }

        if (specialDays.length > 0) {
          doc.setFontSize(9);
          const daysText = specialDays.slice(0, 3).join(", ");
          doc.text(daysText + (specialDays.length > 3 ? "..." : ""), 25, yPos);
          yPos += 5;
        }

        yPos += 3;
      }

      doc.save(
        `calendario_letivo_${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.pdf`
      );
    } else {
      alert("Biblioteca jsPDF não encontrada. Usando método alternativo...");

      if (typeof html2canvas !== "undefined") {
        const element = document.body;
        html2canvas(element).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "calendario_letivo.png";
          link.click();
        });
      } else {
        alert(
          "Não foi possível gerar o PDF. Certifique-se de que está conectado à internet para carregar as bibliotecas necessárias."
        );
      }
    }
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
  }
}

/* =========================================================
   17. FUNÇÕES PARA OS BOTÕES DO EDITOR
========================================================= */

function initEditorButtons() {
  const toggleEditModeBtn = document.getElementById("toggleEditMode");
  const resetCalendarBtn = document.getElementById("resetCalendar");
  const exportJSONBtn = document.getElementById("exportJSON");
  const importJSONBtn = document.getElementById("importJSON");
  const exportPDFBtn = document.getElementById("exportPDF");
  const jsonFileInput = document.getElementById("jsonFileInput");

  if (toggleEditModeBtn && !toggleEditModeBtn.hasListener) {
    toggleEditModeBtn.addEventListener("click", () => {
      editMode = !editMode;
      const indicator = document.getElementById("editModeIndicator");
      if (editMode) {
        indicator.classList.add("active");
        indicator.innerHTML =
          "✏️ MODO DE EDIÇÃO ATIVO - Clique nos dias para editar";
        toggleEditModeBtn.textContent = "Desativar Modo de Edição";
      } else {
        indicator.classList.remove("active");
        indicator.innerHTML = "MODO DE EDIÇÃO INATIVO";
        toggleEditModeBtn.textContent = "Ativar Modo de Edição";
      }
      renderCalendar();
    });
    toggleEditModeBtn.hasListener = true;
  }

  if (resetCalendarBtn && !resetCalendarBtn.hasListener) {
    resetCalendarBtn.addEventListener("click", () => {
      if (
        confirm(
          "Tem certeza que deseja resetar o calendário? Todos os dados EDITÁVEIS serão perdidos."
        )
      ) {
        localStorage.removeItem("calendario_letivo_2026");
        // Também remover do Firestore documento default (opcional)
        if (typeof db !== "undefined") {
          db.collection("calendars")
            .doc("default")
            .delete()
            .catch(() => {});
        }
        loadCalendar().then(() => renderCalendar());
      }
    });
    resetCalendarBtn.hasListener = true;
  }

  if (exportJSONBtn && !exportJSONBtn.hasListener) {
    exportJSONBtn.addEventListener("click", () => {
      const dataStr = JSON.stringify(calendarData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calendario_letivo_2026.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    exportJSONBtn.hasListener = true;
  }

  if (importJSONBtn && !importJSONBtn.hasListener) {
    importJSONBtn.addEventListener("click", () => {
      if (jsonFileInput) {
        jsonFileInput.click();
      }
    });
    importJSONBtn.hasListener = true;
  }

  if (jsonFileInput && !jsonFileInput.hasListener) {
    jsonFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          calendarData = importedData;
          restoreFixedDates();
          saveCalendar();
          renderCalendar();
          alert("Calendário importado com sucesso! Datas fixas restauradas.");
        } catch (error) {
          alert("Erro ao importar arquivo. Verifique se é um JSON válido.");
        }
      };
      reader.readAsText(file);
    });
    jsonFileInput.hasListener = true;
  }

  if (exportPDFBtn && !exportPDFBtn.hasListener) {
    exportPDFBtn.addEventListener("click", generatePDF);
    exportPDFBtn.hasListener = true;
  }
}

/* =========================================================
   FIRESTORE: INICIALIZAÇÃO, LEITURA E GRAVAÇÃO
   Collection: calendars
   Document: default
========================================================= */

let firebaseApp = null;
let db = undefined;
let _saveTimeout = null;

function initFirebase() {
  try {
    if (
      !window.FIREBASE_CONFIG ||
      Object.keys(window.FIREBASE_CONFIG).length === 0
    ) {
      console.warn(
        "Firebase config vazio — pulando inicialização do Firestore."
      );
      return;
    }

    // Inicializar app Firebase (compat)
    firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
    db = firebase.firestore();

    console.log("Firestore inicializado.");
  } catch (err) {
    console.error("Erro ao inicializar Firebase:", err);
    db = undefined;
  }
}

// salvar no Firestore (documento único)
function saveToFirestore() {
  if (!db) return Promise.reject("Firestore não inicializado.");

  // Normalizar calendarData para gravar (pode gravar o objeto diretamente)
  const payload = { ...calendarData };

  return db
    .collection("calendars")
    .doc("default")
    .set(payload, { merge: true })
    .then(() => {
      console.log("Calendário salvo no Firestore.");
    })
    .catch((err) => {
      console.error("Erro ao salvar no Firestore:", err);
    });
}

function debounceSaveToFirestore() {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    saveToFirestore();
  }, 800); // aguarda 800ms sem novas chamadas
}

function loadFromFirestore() {
  if (!db) return Promise.resolve(false);

  return db
    .collection("calendars")
    .doc("default")
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data && data.months) {
          calendarData = data;
          console.log("Calendário carregado do Firestore.");
          return true;
        }
      }
      return false;
    })
    .catch((err) => {
      console.error("Erro ao buscar documento no Firestore:", err);
      return false;
    });
}

/* =========================================================
   18. INICIALIZAÇÃO COMPLETA DO SISTEMA
========================================================= */

function initCalendar() {
  // Agora loadCalendar é assíncrono (pode retornar Promise)
  return loadCalendar().then(() => {
    renderCalendar();

    if (document.getElementById("editorContent")) {
      initEditorModals();
      initMonthModal();
      initEditorButtons();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // apenas caso alguém chame sem passar pelo index/editor
});
