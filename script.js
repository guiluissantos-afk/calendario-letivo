/* =========================================================
   CALENDÁRIO LETIVO – SCRIPT FINAL COM DATAS FIXAS + FIRESTORE
   Guilherme – Versão 2026
   MODIFICAÇÃO: Sistema de duas páginas (visualização/editor)
   Integração Firestore (Opção A) + Logomarca da Escola
========================================================= */

let calendarData = null;
let editMode = false;
let yearCalendarEl, totalAnoAtualEl, inicioAnoLetivoEl, fimAnoLetivoEl;

const COLOR_MAP = {
  comum: "#7bbf7d",
  evento: "#77b5fe",
  sabado_letivo: "#a3d17a",
  avaliacao: "#7986cb",
  ferias: "#ff8a80",
  recesso: "#ffb74d",
  recesso_professores: "#ff8a65",
  feriado: "#ba68c8",
  paralisacao: "#a1887f",
  recuperacao: "#ffd54f",
  personalizado: "#cccccc",
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
  personalizado: "#333333",
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
  "personalizado",
];

const TYPE_NAMES = {
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
  personalizado: "Personalizado",
};

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

// CORREÇÃO 1: Declarar periodStart e periodEnd no escopo global
let periodStart = null;
let periodEnd = null;

function loadCalendar() {
  if (typeof db !== "undefined") {
    return loadFromFirestore()
      .then((loaded) => {
        if (loaded) {
          restoreFixedDates();
          return;
        } else {
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
  if (typeof db !== "undefined") {
    debounceSaveToFirestore();
  }
}

function applyRecuperacaoFinal() {
  const yearsToApply = [2026, 2027];

  yearsToApply.forEach((year) => {
    const startDate = new Date(year, 0, 7);
    const endDate = new Date(year, 0, 20);

    let monthIndex = -1;
    for (let i = 0; i < calendarData.months.length; i++) {
      const month = calendarData.months[i];
      const { month: actualMonth, year: actualYear } = getActualMonthAndYear(i);
      if (actualYear === year && actualMonth === 1) {
        monthIndex = i;
        break;
      }
    }

    if (monthIndex === -1) return;

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const day = date.getDate();
        calendarData.months[monthIndex].daysData[day] = {
          type: "recuperacao",
          title: `Recuperação Final ${year - 1}`,
          letivo: false,
          color: COLOR_MAP.recuperacao,
        };
      }
    }
  });

  yearsToApply.forEach((year) => {
    const recessoStart = new Date(year, 0, 21);
    const recessoEnd = new Date(year, 1, 4);

    for (
      let date = new Date(recessoStart);
      date <= recessoEnd;
      date.setDate(date.getDate() + 1)
    ) {
      const day = date.getDate();
      const actualMonth = date.getMonth();

      let monthIndex = -1;
      for (let i = 0; i < calendarData.months.length; i++) {
        const month = calendarData.months[i];
        const { month: monthFromIndex, year: yearFromIndex } =
          getActualMonthAndYear(i);
        if (yearFromIndex === year && monthFromIndex === actualMonth + 1) {
          monthIndex = i;
          break;
        }
      }

      if (monthIndex !== -1) {
        calendarData.months[monthIndex].daysData[day] = {
          type: "recesso_professores",
          title: `Recesso dos Professores ${year - 1}`,
          letivo: false,
          color: COLOR_MAP.recesso_professores,
        };
      }
    }
  });
}

function restoreFixedDates() {
  const years = [2026, 2027];

  years.forEach((year) => {
    let janIndex = -1,
      febIndex = -1;

    for (let i = 0; i < calendarData.months.length; i++) {
      const { month: actualMonth, year: actualYear } = getActualMonthAndYear(i);
      if (actualYear === year) {
        if (actualMonth === 1) janIndex = i;
        if (actualMonth === 2) febIndex = i;
      }
    }

    if (janIndex !== -1) {
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
      };

      for (let day in fixedJanDays) {
        calendarData.months[janIndex].daysData[day] = { ...fixedJanDays[day] };
      }
    }

    if (febIndex !== -1) {
      calendarData.months[febIndex].daysData[9] = {
        type: "comum",
        title: `Início do ano letivo ${year}`,
        letivo: true,
        color: COLOR_MAP.comum,
      };
    }
  });

  applyRecuperacaoFinal();
}

function detectEndDate2026() {
  let ultimoDiaLetivo = null;

  for (let mi = calendarData.months.length - 1; mi >= 0; mi--) {
    const month = calendarData.months[mi];

    for (let d = month.days; d >= 1; d--) {
      const info = month.daysData[d];

      if (info && info.type === "recuperacao" && (mi > 0 || d > 20)) {
        continue;
      }

      if (
        info &&
        (info.letivo === true ||
          (info.letivo === undefined && LETIVO_TYPES.includes(info.type)))
      ) {
        ultimoDiaLetivo = { monthIndex: mi, day: d };
        return ultimoDiaLetivo;
      }
    }
  }

  return null;
}

function detectStartDate2026() {
  for (let mi = 0; mi < calendarData.months.length; mi++) {
    const month = calendarData.months[mi];

    for (let d = 1; d <= month.days; d++) {
      const info = month.daysData[d];

      if (info && info.type === "recuperacao" && (mi > 0 || d > 20)) {
        continue;
      }

      if (
        info &&
        (info.letivo === true ||
          (info.letivo === undefined && LETIVO_TYPES.includes(info.type)))
      ) {
        return { monthIndex: mi, day: d };
      }
    }
  }

  return null;
}

// CORREÇÃO 2: Adicionar Virtual DOM para otimização
class MonthRenderer {
  constructor(monthIndex, monthData) {
    this.monthIndex = monthIndex;
    this.monthData = monthData;
    this.cachedHTML = null;
    this.lastUpdateTime = 0;
    this.updateThreshold = 100;
  }

  needsUpdate() {
    return (
      !this.cachedHTML ||
      Date.now() - this.lastUpdateTime > this.updateThreshold
    );
  }

  render() {
    if (!this.needsUpdate() && this.cachedHTML) {
      return this.cachedHTML;
    }

    const box = document.createElement("div");
    box.className = "month-container";

    const header = document.createElement("div");
    header.className = "month-header";

    const monthName = document.createElement("span");
    monthName.textContent = this.monthData.name;
    monthName.title = "Clique para ver detalhes do mês";
    monthName.onclick = () => openMonthViewModal(this.monthIndex);
    header.appendChild(monthName);

    if (editMode) {
      const editIcon = document.createElement("span");
      editIcon.className = "edit-month-icon";
      editIcon.textContent = "📝";
      editIcon.title = "Editar mês";
      editIcon.onclick = () => openMonthModal(this.monthIndex);
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
    if (this.monthIndex < initialCalendarData.months.length) {
      offset = initialCalendarData.months[this.monthIndex].startDay;
    } else {
      offset = this.monthData.startDay;
    }

    for (let i = 0; i < offset; i++) {
      const empty = document.createElement("div");
      empty.className = "empty-cell";
      grid.appendChild(empty);
    }

    for (let d = 1; d <= this.monthData.days; d++) {
      const cell = this.createDayCell(d);
      grid.appendChild(cell);
    }

    box.appendChild(grid);

    const total = document.createElement("div");
    total.className = "month-total";
    const total2026 = calculateMonthDays2026(this.monthIndex);
    total.innerHTML = `
      <div class="month-total-2026">${total2026}</div>
      <div class="month-total-label">dias letivos</div>
    `;
    box.appendChild(total);

    const monthInfo = document.createElement("div");
    monthInfo.className = "month-info";
    monthInfo.style.padding = "12px";
    monthInfo.style.borderTop = "1px solid var(--gray-200)";
    monthInfo.style.background = "var(--gray-50)";
    monthInfo.style.fontSize = "0.85rem";
    monthInfo.style.color = "var(--gray-600)";

    if (
      this.monthData.description &&
      this.monthData.description.trim() !== ""
    ) {
      const desc = document.createElement("div");
      desc.style.marginBottom = "8px";
      desc.style.fontWeight = "500";
      desc.innerHTML = `<strong>Descrição:</strong> ${this.monthData.description}`;
      monthInfo.appendChild(desc);
    }

    const eventGroups = groupConsecutiveEvents(this.monthData, this.monthIndex);

    if (eventGroups.length > 0) {
      const specialDaysList = document.createElement("div");
      specialDaysList.style.marginTop = eventGroups.length > 0 ? "8px" : "0";

      const title = document.createElement("div");
      title.style.fontWeight = "500";
      title.style.marginBottom = "4px";
      title.textContent = "Eventos do mês:";
      specialDaysList.appendChild(title);

      const groupedByType = {};
      eventGroups.forEach((group) => {
        if (!groupedByType[group.type]) {
          groupedByType[group.type] = [];
        }
        groupedByType[group.type].push(group);
      });

      Object.keys(groupedByType).forEach((type) => {
        const typeContainer = document.createElement("div");
        typeContainer.style.marginBottom = "6px";
        typeContainer.style.paddingLeft = "8px";
        typeContainer.style.borderLeft = "2px solid var(--gray-300)";

        const typeTitle = document.createElement("div");
        typeTitle.style.fontWeight = "500";
        typeTitle.style.fontSize = "0.8rem";
        typeTitle.style.color = "var(--gray-700)";
        typeTitle.textContent = type + ":";
        typeContainer.appendChild(typeTitle);

        const daysList = document.createElement("div");
        daysList.style.fontSize = "0.78rem";
        daysList.style.color = "var(--gray-600)";
        daysList.style.marginLeft = "8px";

        const groupTexts = groupedByType[type]
          .map((group) => {
            const eventDays = group.days.filter((day) => {
              const info = this.monthData.daysData[day];
              if (!info) return false;
              const { month: actualMonth, year: actualYear } =
                getActualMonthAndYear(this.monthIndex);
              const dow = getDayOfWeek(actualYear, actualMonth, day);
              if (dow === 0) return false;
              if (dow === 6) return info.type === "sabado_letivo";
              return true;
            });

            if (eventDays.length === 0) return "";

            const firstDay = Math.min(...eventDays);
            const lastDay = Math.max(...eventDays);

            if (firstDay === lastDay) {
              return `Dia ${firstDay}: ${group.title}`;
            } else {
              return `Dia ${firstDay} a Dia ${lastDay}: ${group.title}`;
            }
          })
          .filter((text) => text !== "")
          .join("; ");

        daysList.textContent = groupTexts;
        typeContainer.appendChild(daysList);
        specialDaysList.appendChild(typeContainer);
      });

      monthInfo.appendChild(specialDaysList);
    } else if (
      this.monthData.description &&
      this.monthData.description.trim() !== ""
    ) {
      const noEvents = document.createElement("div");
      noEvents.style.fontStyle = "italic";
      noEvents.style.color = "var(--gray-500)";
      noEvents.style.marginTop = "8px";
      noEvents.style.fontSize = "0.8rem";
      noEvents.textContent = "Nenhum evento especial neste mês.";
      monthInfo.appendChild(noEvents);
    }

    if (monthInfo.children.length > 0) {
      box.appendChild(monthInfo);
    }

    this.cachedHTML = box;
    this.lastUpdateTime = Date.now();

    return box;
  }

  createDayCell(day) {
    const info = this.monthData.daysData[day] || null;
    const { month: actualMonth, year: actualYear } = getActualMonthAndYear(
      this.monthIndex
    );
    const dow = getDayOfWeek(actualYear, actualMonth, day);

    const cell = document.createElement("div");
    cell.className = "day-cell";

    const isEditable = editMode && isDayEditable(this.monthIndex, day);

    if (!isEditable && editMode) {
      cell.classList.add("non-editable");
      cell.title = "Período fixo - não editável";
    }

    if (this.monthIndex === 0 && day === 6) {
      cell.classList.add("last-day-2025");
    }

    const num = document.createElement("div");
    num.className = "day-number";
    num.textContent = day;
    cell.appendChild(num);

    const startDate = detectStartDate2026();
    if (
      startDate &&
      this.monthIndex === startDate.monthIndex &&
      day === startDate.day
    ) {
      cell.classList.add("first-day-2026");
    }

    const endDate = detectEndDate2026();
    if (
      endDate &&
      this.monthIndex === endDate.monthIndex &&
      day === endDate.day
    ) {
      cell.classList.add("last-day-2026");
    }

    if (info) {
      cell.dataset.type = info.type;

      const isWeekend = dow === 0 || dow === 6;

      if (dow === 6 && LETIVO_TYPES.includes(info.type)) {
        cell.style.backgroundColor = info.color || COLOR_MAP.sabado_letivo;
        cell.style.color = getContrastColor(
          info.color || COLOR_MAP.sabado_letivo
        );
        cell.classList.add("sabado-letivo-verde");
        cell.classList.add("colored-weekend");
      }

      if (isWeekend && !(dow === 6 && LETIVO_TYPES.includes(info.type))) {
        if (COLORED_WEEKEND_TYPES.includes(info.type)) {
          cell.style.backgroundColor =
            info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado;
          cell.style.color = getContrastColor(
            info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado
          );
          cell.classList.add("colored-weekend");
        } else {
          cell.style.backgroundColor = "#ffffff";
          cell.style.color = "#6b7280";
          cell.classList.add("weekend-no-color");
        }
      }

      if (!isWeekend) {
        if (info.type && (info.color || COLOR_MAP[info.type])) {
          cell.style.backgroundColor =
            info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado;
          cell.style.color = getContrastColor(
            info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado
          );
        }
      }

      let tooltipText = TYPE_NAMES[info.type] || info.type || "Personalizado";

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

      if (info.letivo !== undefined) {
        if (info.letivo) {
          tooltipText += "\n✓ Conta para os 200 dias letivos";
        } else {
          tooltipText += "\n✗ Não conta para os 200 dias letivos";
        }
      }

      cell.setAttribute("data-title", tooltipText);
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
      openDayModal(this.monthIndex, day);
    });

    return cell;
  }

  invalidateCache() {
    this.cachedHTML = null;
  }
}

// Renderers cache para Virtual DOM
let monthRenderers = [];

function renderCalendar() {
  if (!yearCalendarEl) {
    yearCalendarEl = document.getElementById("yearCalendar");
    totalAnoAtualEl = document.getElementById("totalAnoAtual");
    inicioAnoLetivoEl = document.getElementById("inicioAnoLetivo");
    fimAnoLetivoEl = document.getElementById("fimAnoLetivo");
  }

  // Inicializar renderers se necessário
  if (monthRenderers.length !== calendarData.months.length) {
    monthRenderers = calendarData.months.map(
      (month, index) => new MonthRenderer(index, month)
    );
  }

  // Usar fragmento de documento para renderização em lote
  const fragment = document.createDocumentFragment();

  calendarData.months.forEach((month, monthIndex) => {
    let renderer = monthRenderers[monthIndex];
    if (!renderer) {
      renderer = new MonthRenderer(monthIndex, month);
      monthRenderers[monthIndex] = renderer;
    }

    if (renderer.monthData !== month) {
      renderer.monthData = month;
      renderer.invalidateCache();
    }

    fragment.appendChild(renderer.render());
  });

  // Limpar e renderizar em lote
  yearCalendarEl.innerHTML = "";
  yearCalendarEl.appendChild(fragment);

  updateStatistics();
  saveCalendar();

  updateColorLegend();
}

function getActualMonthAndYear(monthIndex) {
  const baseYear = 2026;
  const monthOffset = monthIndex;
  const actualMonth = (monthOffset % 12) + 1;
  const actualYear = baseYear + Math.floor(monthOffset / 12);

  return { month: actualMonth, year: actualYear };
}

function isWeekendWithoutEvent(month, monthIndex, day) {
  const { month: actualMonth, year: actualYear } =
    getActualMonthAndYear(monthIndex);
  const dow = getDayOfWeek(actualYear, actualMonth, day);

  if (dow === 0 || dow === 6) {
    const info = month.daysData[day];
    if (dow === 6 && info && info.type === "sabado_letivo") {
      return false;
    }
    return true;
  }
  return false;
}

function groupConsecutiveEvents(month, monthIndex) {
  const groups = [];
  let currentGroup = null;

  for (let d = 1; d <= month.days; d++) {
    const info = month.daysData[d];

    if (info && info.type && info.type !== "comum" && info.title) {
      const typeName = TYPE_NAMES[info.type] || info.type;
      const eventKey = `${info.title}|${typeName}|${info.description || ""}`;

      const isWeekend = isWeekendWithoutEvent(month, monthIndex, d);

      if (isWeekend) {
        if (currentGroup) {
          currentGroup.endDay = d;
          currentGroup.days.push(d);
        }
        continue;
      }

      if (currentGroup && currentGroup.key === eventKey) {
        currentGroup.endDay = d;
        currentGroup.days.push(d);
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          key: eventKey,
          title: info.title,
          type: typeName,
          description: info.description || "",
          startDay: d,
          endDay: d,
          days: [d],
          letivo: info.letivo || false,
        };
      }
    } else {
      const isWeekend = isWeekendWithoutEvent(month, monthIndex, d);

      if (!isWeekend) {
        if (currentGroup) {
          groups.push(currentGroup);
          currentGroup = null;
        }
      } else if (currentGroup) {
        currentGroup.endDay = d;
        currentGroup.days.push(d);
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

function createMonthElement(month, monthIndex) {
  const renderer = new MonthRenderer(monthIndex, month);
  return renderer.render();
}

function createDayCell(monthIndex, day) {
  const month = calendarData.months[monthIndex];
  const info = month.daysData[day] || null;
  const { month: actualMonth, year: actualYear } =
    getActualMonthAndYear(monthIndex);
  const dow = getDayOfWeek(actualYear, actualMonth, day);

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

  const startDate = detectStartDate2026();
  if (
    startDate &&
    monthIndex === startDate.monthIndex &&
    day === startDate.day
  ) {
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
      cell.style.backgroundColor = info.color || COLOR_MAP.sabado_letivo;
      cell.style.color = getContrastColor(
        info.color || COLOR_MAP.sabado_letivo
      );
      cell.classList.add("sabado-letivo-verde");
      cell.classList.add("colored-weekend");
    }

    if (isWeekend && !(dow === 6 && LETIVO_TYPES.includes(info.type))) {
      if (COLORED_WEEKEND_TYPES.includes(info.type)) {
        cell.style.backgroundColor =
          info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado;
        cell.style.color = getContrastColor(
          info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado
        );
        cell.classList.add("colored-weekend");
      } else {
        cell.style.backgroundColor = "#ffffff";
        cell.style.color = "#6b7280";
        cell.classList.add("weekend-no-color");
      }
    }

    if (!isWeekend) {
      if (info.type && (info.color || COLOR_MAP[info.type])) {
        cell.style.backgroundColor =
          info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado;
        cell.style.color = getContrastColor(
          info.color || COLOR_MAP[info.type] || COLOR_MAP.personalizado
        );
      }
    }

    let tooltipText = TYPE_NAMES[info.type] || info.type || "Personalizado";

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

    if (info.letivo !== undefined) {
      if (info.letivo) {
        tooltipText += "\n✓ Conta para os 200 dias letivos";
      } else {
        tooltipText += "\n✗ Não conta para os 200 dias letivos";
      }
    }

    cell.setAttribute("data-title", tooltipText);
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
    openDayModal(monthIndex, day);
  });

  return cell;
}

function isSaturday(year, monthIndex, day) {
  const { month: actualMonth, year: actualYear } =
    getActualMonthAndYear(monthIndex);
  const dow = getDayOfWeek(actualYear, actualMonth, day);
  return dow === 6;
}

function isDayEditable(monthIndex, day) {
  return true;
}

function getDayOfWeek(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getContrastColor(hexColor) {
  if (!hexColor.startsWith("#")) {
    if (COLOR_MAP[hexColor]) {
      hexColor = COLOR_MAP[hexColor];
    } else {
      return "#333333";
    }
  }

  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#333333" : "#ffffff";
}

let dayModal, closeDayModal, dayTitleInput, dayDescInput, dayTypeSelect;
let dayCountAsLetivoCheckbox,
  dayColorPicker,
  dayColorInput,
  applyCustomColorBtn;
let colorOptions, currentColorPreview;
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
  dayCountAsLetivoCheckbox = document.getElementById("dayCountAsLetivo");
  dayColorPicker = document.getElementById("dayColorPicker");
  dayColorInput = document.getElementById("dayColorInput");
  applyCustomColorBtn = document.getElementById("applyCustomColor");
  currentColorPreview = document.getElementById("currentColorPreview");
  colorOptions = document.querySelectorAll(".color-option");

  saveDayBtn = document.getElementById("saveDay");
  deleteDayBtn = document.getElementById("deleteDay");

  // REMOVIDO: Referências aos botões "Copiar Configuração" e "Colar Período"
  // setStartBtn e setEndBtn não existem mais

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

      if (monthRenderers[selectedMonth]) {
        monthRenderers[selectedMonth].invalidateCache();
      }

      renderCalendar();
    });
    saveDayBtn.hasListener = true;
  }

  if (deleteDayBtn && !deleteDayBtn.hasListener) {
    deleteDayBtn.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja apagar o evento deste dia?")) {
        deleteDayEvent(selectedMonth, selectedDay);
        dayModal.style.display = "none";

        if (monthRenderers[selectedMonth]) {
          monthRenderers[selectedMonth].invalidateCache();
        }

        renderCalendar();
      }
    });
    deleteDayBtn.hasListener = true;
  }

  // REMOVIDO: Event listeners para setStartBtn e setEndBtn
  // Esses botões não existem mais na interface

  if (colorOptions && colorOptions.length > 0 && !colorOptions[0].hasListener) {
    colorOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const color = this.getAttribute("data-color");
        dayColorPicker.value = color;
        dayColorInput.value = color;
        currentColorPreview.style.backgroundColor = color;
      });
      option.hasListener = true;
    });
  }

  if (dayColorPicker && !dayColorPicker.hasListener) {
    dayColorPicker.addEventListener("input", function () {
      dayColorInput.value = this.value;
      currentColorPreview.style.backgroundColor = this.value;
    });
    dayColorPicker.hasListener = true;
  }

  if (dayColorInput && !dayColorInput.hasListener) {
    dayColorInput.addEventListener("input", function () {
      const color = this.value;
      if (
        color.match(/^#[0-9A-Fa-f]{6}$/) ||
        color.match(/^#[0-9A-Fa-f]{3}$/)
      ) {
        dayColorPicker.value = color;
        currentColorPreview.style.backgroundColor = color;
      } else if (COLOR_MAP[color]) {
        dayColorPicker.value = COLOR_MAP[color];
        currentColorPreview.style.backgroundColor = COLOR_MAP[color];
      }
    });
    dayColorInput.hasListener = true;
  }

  if (applyCustomColorBtn && !applyCustomColorBtn.hasListener) {
    applyCustomColorBtn.addEventListener("click", function () {
      const color = dayColorInput.value;
      if (color) {
        if (
          color.match(/^#[0-9A-Fa-f]{6}$/) ||
          color.match(/^#[0-9A-Fa-f]{3}$/)
        ) {
          dayColorPicker.value = color;
          currentColorPreview.style.backgroundColor = color;
        } else if (COLOR_MAP[color]) {
          dayColorPicker.value = COLOR_MAP[color];
          currentColorPreview.style.backgroundColor = COLOR_MAP[color];
        } else {
          try {
            const tempDiv = document.createElement("div");
            tempDiv.style.color = color;
            if (tempDiv.style.color) {
              dayColorPicker.value = colorToHex(color);
              currentColorPreview.style.backgroundColor = color;
            }
          } catch (e) {
            alert(
              "Cor inválida. Use formato HEX (#RRGGBB) ou nome de cor CSS."
            );
          }
        }
      }
    });
    applyCustomColorBtn.hasListener = true;
  }

  if (dayTypeSelect && !dayTypeSelect.hasColorListener) {
    dayTypeSelect.addEventListener("change", function () {
      const type = this.value;
      const defaultColor = COLOR_MAP[type] || COLOR_MAP.personalizado;
      dayColorPicker.value = defaultColor;
      dayColorInput.value = defaultColor;
      currentColorPreview.style.backgroundColor = defaultColor;
    });
    dayTypeSelect.hasColorListener = true;
  }
}

function colorToHex(color) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  return ctx.fillStyle;
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

  if (info.letivo !== undefined) {
    dayCountAsLetivoCheckbox.checked = info.letivo;
  } else {
    const tipo = info.type || "comum";
    dayCountAsLetivoCheckbox.checked = LETIVO_TYPES.includes(tipo);
  }

  const defaultColor = COLOR_MAP[info.type] || COLOR_MAP.comum;
  const currentColor = info.color || defaultColor;

  dayColorPicker.value = currentColor;
  dayColorInput.value = currentColor;
  currentColorPreview.style.backgroundColor = currentColor;

  document.getElementById(
    "modalDayTitle"
  ).textContent = `${day} de ${month.name}`;

  const { month: actualMonth, year: actualYear } =
    getActualMonthAndYear(monthIndex);
  const dow = getDayOfWeek(actualYear, actualMonth, day);

  if (dow === 6) {
    const year = actualYear;
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

  month.daysData[day] = {
    type,
    title: dayTitleInput.value.trim(),
    description: dayDescInput.value.trim(),
    letivo: dayCountAsLetivoCheckbox.checked,
    color: dayColorPicker.value,
  };
}

function deleteDayEvent(monthIndex, day) {
  const month = calendarData.months[monthIndex];

  if (month.daysData[day]) {
    delete month.daysData[day];
  }
}

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
      month.daysData[d] = {
        type,
        title: dayTitleInput.value.trim(),
        description: dayDescInput.value.trim(),
        letivo: dayCountAsLetivoCheckbox.checked,
        color: dayColorPicker.value,
      };
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
    const info = month.daysData[d];
    const { month: actualMonth, year: actualYear } =
      getActualMonthAndYear(monthIndex);
    const dow = getDayOfWeek(actualYear, actualMonth, d);

    if (dow === 6) {
      if (
        info &&
        (info.letivo === true ||
          (info.letivo === undefined && LETIVO_TYPES.includes(info.type)))
      ) {
        count++;
      }
      continue;
    }

    if (dow === 0) {
      continue;
    }

    if (
      info &&
      (info.letivo === true ||
        (info.letivo === undefined && LETIVO_TYPES.includes(info.type)))
    ) {
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

function updateColorLegend() {
  const legendContainer = document.getElementById("legendItems");
  if (!legendContainer) return;

  const colorMap = new Map();

  Object.entries(TYPE_NAMES).forEach(([type, name]) => {
    if (COLOR_MAP[type]) {
      colorMap.set(COLOR_MAP[type], name);
    }
  });

  calendarData.months.forEach((month) => {
    Object.values(month.daysData).forEach((day) => {
      if (day.color && day.color !== COLOR_MAP[day.type]) {
        const typeName = TYPE_NAMES[day.type] || day.type || "Personalizado";
        const label = day.title ? `${typeName}: ${day.title}` : typeName;
        colorMap.set(day.color, label);
      }
    });
  });

  legendContainer.innerHTML = "";

  colorMap.forEach((label, color) => {
    const legendItem = document.createElement("div");
    legendItem.style.display = "flex";
    legendItem.style.alignItems = "center";
    legendItem.style.gap = "10px";
    legendItem.style.padding = "8px";
    legendItem.style.borderRadius = "6px";
    legendItem.style.backgroundColor = "var(--gray-50)";

    const colorBox = document.createElement("div");
    colorBox.style.width = "20px";
    colorBox.style.height = "20px";
    colorBox.style.borderRadius = "4px";
    colorBox.style.backgroundColor = color;
    colorBox.style.border = "1px solid var(--gray-300)";
    colorBox.style.flexShrink = "0";

    const labelText = document.createElement("span");
    labelText.textContent = label;
    labelText.style.fontSize = "0.85rem";
    labelText.style.color = "var(--gray-700)";
    labelText.style.flex = "1";

    legendItem.appendChild(colorBox);
    legendItem.appendChild(labelText);
    legendContainer.appendChild(legendItem);
  });

  if (colorMap.size === Object.keys(COLOR_MAP).length) {
    const infoMsg = document.createElement("div");
    infoMsg.style.gridColumn = "1 / -1";
    infoMsg.style.textAlign = "center";
    infoMsg.style.padding = "10px";
    infoMsg.style.color = "var(--gray-500)";
    infoMsg.style.fontSize = "0.9rem";
    infoMsg.textContent =
      "Usando cores padrão. O editor pode personalizar cores.";
    legendContainer.appendChild(infoMsg);
  }
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

  const startDate = detectStartDate2026();
  if (startDate) {
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
    const monthName = monthNames[startDate.monthIndex % 12];
    inicioSpan.textContent = `${startDate.day} de ${monthName}`;
  } else {
    inicioSpan.textContent = "Não definido";
  }

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
    fimSpan.textContent = `${endDate.day} de ${monthName}`;
  } else {
    fimSpan.textContent = "Não definido";
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

        if (monthRenderers[selectedMonthIndex]) {
          monthRenderers[selectedMonthIndex].invalidateCache();
        }

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

    const { month: actualMonth, year: actualYear } =
      getActualMonthAndYear(monthIndex);
    const dow = getDayOfWeek(actualYear, actualMonth, d);

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

      if (info.color) {
        dayCell.style.backgroundColor = info.color;
        dayCell.style.color = getContrastColor(info.color);
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

      let contentText = `<strong>${
        typeNames[info.type] || info.type || "Personalizado"
      }</strong>`;

      if (info.title && info.title.trim() !== "") {
        contentText += `<br>${info.title}`;
      }

      if (info.description && info.description.trim() !== "") {
        contentText += `<br><small>${info.description}</small>`;
      }

      if (dow === 6 && LETIVO_TYPES.includes(info.type)) {
        contentText += `<br><small>✓ Sábado Letivo</small>`;
      }

      if (info.letivo !== undefined) {
        if (info.letivo) {
          contentText += `<br><small>✓ Conta para os 200 dias letivos</small>`;
        } else {
          contentText += `<br><small>✗ Não conta para os 200 dias letivos</small>`;
        }
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

// NOVA FUNÇÃO: Gerar PDF com logomarca da escola
async function generatePDF() {
  try {
    if (typeof window.jspdf !== "undefined") {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "mm", "a4");

      const schoolConfig = window.SCHOOL_CONFIG || {};
      const schoolName = schoolConfig.name || "";
      const showLogoInPDF = schoolConfig.showInPDF !== false;

      // NOVO: Adicionar logomarca se configurado
      let logoAdded = false;
      if (showLogoInPDF && schoolConfig.logo) {
        try {
          // Tentar carregar a imagem para o PDF
          const img = new Image();
          img.crossOrigin = "anonymous";

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = schoolConfig.logo;
          });

          // Adicionar logomarca ao PDF (canto superior esquerdo)
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL("image/png");

          // Calcular dimensões para caber no PDF
          const maxWidth = 40; // mm
          const maxHeight = 20; // mm
          let width = img.width;
          let height = img.height;

          // Redimensionar proporcionalmente
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          doc.addImage(imgData, "PNG", 20, 15, width, height);
          logoAdded = true;
        } catch (error) {
          console.warn("Não foi possível adicionar a logomarca ao PDF:", error);
        }
      }

      doc.setFontSize(20);

      // Ajustar posição do título baseado na logo
      const titleX = logoAdded ? 70 : 105;
      const titleAlign = logoAdded ? "left" : "center";

      doc.text("Calendário Letivo 2025/2026", titleX, 20, {
        align: titleAlign,
      });

      // Adicionar nome da escola se configurado
      if (schoolName && schoolName !== "Nome da Escola") {
        doc.setFontSize(14);
        doc.text(schoolName, titleX, 30, { align: titleAlign });
      }

      const mode = editMode ? "Editor" : "Visualização";
      doc.setFontSize(10);
      doc.text(`Modo: ${mode}`, 20, logoAdded ? 40 : 15);

      const now = new Date();
      const dateStr = now.toLocaleDateString("pt-BR");
      const timeStr = now.toLocaleTimeString("pt-BR");
      doc.text(`Gerado em: ${dateStr} ${timeStr}`, 105, logoAdded ? 40 : 15, {
        align: "center",
      });

      // Ajustar posição Y baseado na logo
      let yPos = logoAdded ? 60 : 35;

      doc.setFontSize(12);
      doc.text(
        `Total de dias letivos 2026: ${calculateYearTotal2026()} de 200`,
        20,
        yPos
      );
      yPos += 10;

      const startDate = detectStartDate2026();
      const endDate = detectEndDate2026();

      if (startDate) {
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
        const monthName = monthNames[startDate.monthIndex % 12];
        doc.text(
          `Início do ano letivo: ${startDate.day} de ${monthName}`,
          20,
          yPos
        );
        yPos += 10;
      }

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
        doc.text(`Fim do ano letivo: ${endDate.day} de ${monthName}`, 20, yPos);
        yPos += 15;
      } else {
        yPos += 5;
      }

      doc.setFontSize(10);
      yPos += 5;

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

          // Adicionar logo também nas páginas subsequentes se configurado
          if (logoAdded && schoolName) {
            doc.setFontSize(12);
            doc.text(schoolName, 20, 15);
          }
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

      // NOVO: Adicionar rodapé com nome da escola
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Página ${i} de ${pageCount} • ${
            schoolName || "Calendário Letivo"
          } • ${dateStr}`,
          105,
          290,
          { align: "center" }
        );
      }

      doc.save(
        `calendario_letivo_${
          schoolName ? schoolName.replace(/\s+/g, "_") : "escola"
        }_${now.getFullYear()}${(now.getMonth() + 1)
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
          link.download = `calendario_letivo_${
            schoolName ? schoolName.replace(/\s+/g, "_") : "escola"
          }.png`;
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

      monthRenderers.forEach((renderer) => {
        if (renderer) renderer.invalidateCache();
      });

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
        if (typeof db !== "undefined") {
          db.collection("calendars")
            .doc("default")
            .delete()
            .catch(() => {});
        }

        monthRenderers = [];

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

          monthRenderers = [];

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

    firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
    db = firebase.firestore();

    console.log("Firestore inicializado.");
  } catch (err) {
    console.error("Erro ao inicializar Firebase:", err);
    db = undefined;
  }
}

function saveToFirestore() {
  if (!db) return Promise.reject("Firestore não inicializado.");

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
  }, 800);
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

function initCalendar() {
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
