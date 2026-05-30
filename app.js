const REQUIRED_SHEETS = ["Проект", "Плановые документы", "Фактические документы"];
const RISK_VISIBLE_LIMIT = 5;
const AMOUNT_TOLERANCE_RATIO = 0.05;
const DATE_NEAR_DAYS = 14;

const PROJECT_FIELD_CONFIG = [
  { label: "Код проекта", keys: ["Код проекта"], cell: "B2" },
  { label: "Имя проекта", keys: ["Имя проекта"], cell: "B3" },
  { label: "Статус проекта", keys: ["Статус проекта"], cell: "B4" },
  { label: "Тип проекта", keys: ["Укрупненный тип", "Тип проекта"], cell: "B5" },
  { label: "Клиент", keys: ["Клиент"], cell: "B6" },
  { label: "Руководитель проекта", keys: ["Руководитель проекта"], cell: null },
  { label: "Начало", keys: ["Начало"], cell: "B7" },
  { label: "Окончание", keys: ["Окончание"], cell: "B8" },
];

const PROJECT_FIELDS = PROJECT_FIELD_CONFIG.map((field) => field.label);
const PROJECT_SOURCE_FIELDS = PROJECT_FIELD_CONFIG.flatMap((field) => field.keys);

const PLANNED_COLUMNS = [
  "Стадия проекта",
  "Статья бюджета",
  "Тип документа",
  "Сумма, без НДС",
  "Дата документа",
  "Комментарий",
  "Сопост. с фактом",
  "Распределено полностью",
];

const ACTUAL_COLUMNS = [
  "Дата",
  "Номер документа",
  "Статья бюджета ЦУП",
  "Сумма 1C, без НДС",
  "Контрагент",
  "Комментарий",
  "Статус 1C",
];

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const errorBox = document.querySelector("#errorBox");
const results = document.querySelector("#results");
const projectGrid = document.querySelector("#projectGrid");
const assistantConclusion = document.querySelector("#assistantConclusion");
const assistantKpiGrid = document.querySelector("#assistantKpiGrid");
const riskyPaymentsTable = document.querySelector("#riskyPaymentsTable");
const summaryGrid = document.querySelector("#summaryGrid");
const riskSummary = document.querySelector("#riskSummary");
const riskFilterInputs = [...document.querySelectorAll("[data-risk-filter]")];
const riskFilterReset = document.querySelector("#riskFilterReset");
const riskTable = document.querySelector("#riskTable");
const riskToggleButton = document.querySelector("#riskToggleButton");
const plannedTable = document.querySelector("#plannedTable");
const actualTable = document.querySelector("#actualTable");
const groupAnalysisTable = document.querySelector("#groupAnalysisTable");

let riskTableExpanded = false;
let currentRisks = [];

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) {
    handleFile(file);
  }
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  const [file] = event.dataTransfer.files;
  if (file) {
    fileInput.files = event.dataTransfer.files;
    handleFile(file);
  }
});

riskToggleButton.addEventListener("click", () => {
  riskTableExpanded = !riskTableExpanded;
  renderRiskTableRows();
});

riskFilterInputs.forEach((input) => {
  input.addEventListener("input", () => {
    riskTableExpanded = false;
    renderRiskTableRows();
  });
});

riskFilterReset.addEventListener("click", () => {
  clearRiskFilters();
  riskTableExpanded = false;
  renderRiskTableRows();
});

async function handleFile(file) {
  clearError();
  setStatus("processing", `Обрабатываю файл: ${file.name}`);

  try {
    ensureXlsxLoaded();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: false,
    });

    validateWorkbook(workbook);

    const projectMatrix = sheetToMatrix(workbook, "Проект");
    const plannedRows = sheetToRows(workbook, "Плановые документы", PLANNED_COLUMNS);
    const actualRows = sheetToRows(workbook, "Фактические документы", ACTUAL_COLUMNS);

    const project = extractProject(projectMatrix);
    const planned = plannedRows
      .filter((row) => isBudgetArticle(row["Статья бюджета"]))
      .map((row) => ({ ...row, assistantNotes: getPlannedNotes(row) }));
    const actual = actualRows
      .filter((row) => isBudgetArticle(row["Статья бюджета ЦУП"]))
      .map((row) => ({ ...row, assistantNotes: getActualNotes(row) }));
    const risks = getFirstFinancialRisks(planned);

    renderProject(project);
    renderAssistantProductView(project, planned, actual);
    renderSummary(planned, actual);
    renderRisks(risks);
    renderPlannedTable(planned);
    renderActualTable(actual);
    renderGroupAnalysisTable(analyzePlannedActPaymentGroups(planned));

    results.classList.remove("hidden");
    setStatus("ready", `Файл обработан: ${file.name}`);
  } catch (error) {
    results.classList.add("hidden");
    setStatus("error", "Не удалось обработать файл");
    showError(error.message);
  }
}

function ensureXlsxLoaded() {
  if (!window.XLSX) {
    throw new Error("Библиотека чтения Excel не загрузилась. Проверьте подключение к интернету или подключите SheetJS локально.");
  }
}

function validateWorkbook(workbook) {
  const missed = REQUIRED_SHEETS.filter((sheetName) => !workbook.SheetNames.includes(sheetName));
  if (missed.length) {
    throw new Error(`В файле нет обязательных листов: ${missed.join(", ")}.`);
  }
}

function sheetToMatrix(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }).map((row) => row.map(normalizeValue));
}

function sheetToRows(workbook, sheetName, expectedColumns) {
  const matrix = sheetToMatrix(workbook, sheetName);
  const headerIndex = findHeaderRowIndex(matrix, expectedColumns);
  if (headerIndex === -1) {
    return [];
  }

  const headers = matrix[headerIndex].map(normalizeKey);
  return matrix.slice(headerIndex + 1)
    .filter((row) => row.some(hasValue))
    .map((row) => {
      const objectRow = {};
      headers.forEach((header, index) => {
        if (header) {
          objectRow[header] = normalizeValue(row[index] ?? "");
        }
      });
      return objectRow;
    });
}

function findHeaderRowIndex(matrix, expectedColumns) {
  return matrix.findIndex((row) => {
    const headers = row.map(normalizeKey);
    return expectedColumns.some((column) => headers.includes(column));
  });
}

function normalizeKey(key) {
  return String(key)
    .replace(/\u00a0/g, " ")
    .replace(/1С/g, "1C")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeValue(value) {
  return typeof value === "string" ? value.trim() : value;
}

function extractProject(matrix) {
  const project = {};

  matrix.forEach((row) => {
    row.forEach((cell, index) => {
      const key = normalizeKey(cell);
      const field = PROJECT_FIELD_CONFIG.find((item) => item.keys.includes(key));
      if (field) {
        const rightValue = row[index + 1];
        const belowValue = findValueBelow(matrix, key);
        project[field.label] = hasValue(rightValue) ? rightValue : belowValue;
      }
    });
  });

  PROJECT_FIELD_CONFIG.forEach((field) => {
    if (!field.cell) {
      return;
    }
    const cellValue = getProjectCellValue(matrix, field);
    if (hasValue(cellValue)) {
      project[field.label] = cellValue;
    }
  });

  return project;
}

function getProjectCellValue(matrix, field) {
  const cellPosition = getMatrixPosition(field.cell);
  if (!cellPosition) {
    return "";
  }

  const leftCell = matrix[cellPosition.rowIndex]?.[cellPosition.columnIndex - 1];
  const leftKey = normalizeKey(leftCell);
  if (!field.keys.includes(leftKey)) {
    return "";
  }

  return matrix[cellPosition.rowIndex]?.[cellPosition.columnIndex] ?? "";
}

function getMatrixCell(matrix, address) {
  const position = getMatrixPosition(address);
  if (!position) {
    return "";
  }
  return matrix[position.rowIndex]?.[position.columnIndex] ?? "";
}

function getMatrixPosition(address) {
  const match = String(address).toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return null;
  }

  const [, columnLetters, rowNumber] = match;
  const rowIndex = Number(rowNumber) - 1;
  const columnIndex = columnLetters
    .split("")
    .reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;

  return { rowIndex, columnIndex };
}

function getProjectSourceFields() {
  return [...new Set(PROJECT_SOURCE_FIELDS)];
}

function findValueBelow(matrix, field) {
  for (let rowIndex = 0; rowIndex < matrix.length - 1; rowIndex += 1) {
    const columnIndex = matrix[rowIndex].findIndex((cell) => normalizeKey(cell) === field);
    if (columnIndex !== -1) {
      return matrix[rowIndex + 1]?.[columnIndex] ?? "";
    }
  }
  return "";
}

function matrixToRowsByProjectHeader(matrix) {
  const headerIndex = findHeaderRowIndex(matrix, getProjectSourceFields());
  if (headerIndex === -1) {
    return [];
  }

  const headers = matrix[headerIndex].map(normalizeKey);
  return matrix.slice(headerIndex + 1).map((row) => {
    const objectRow = {};
    headers.forEach((header, index) => {
      if (header) {
        objectRow[header] = normalizeValue(row[index] ?? "");
      }
    });
    return objectRow;
  });
}

function isBudgetArticle(value) {
  const article = String(value ?? "").trim();
  return /^([23])(\.|$)/.test(article) || /^[23]\D/.test(article);
}

function getArticleType(value) {
  const article = String(value ?? "").trim();
  if (article.startsWith("3")) {
    return "act";
  }
  if (article.startsWith("2")) {
    return "payment";
  }
  return "other";
}

function getPlannedNotes(row) {
  const notes = [];
  if (!hasValue(row["Дата документа"])) {
    notes.push("Не указана дата");
  }
  if (toNumber(row["Сумма, без НДС"]) === 0) {
    notes.push("Проверить сумму");
  }
  if (!isFullyDistributed(row["Распределено полностью"])) {
    notes.push("Проверить распределение");
  }
  return notes;
}

function getActualNotes(row) {
  const notes = [];
  if (!hasValue(row["Дата"])) {
    notes.push("Не указана дата");
  }
  if (toNumber(row["Сумма 1C, без НДС"]) === 0) {
    notes.push("Проверить сумму");
  }
  return notes;
}

function getFirstFinancialRisks(plannedRows) {
  const acts = plannedRows
    .filter((row) => getArticleType(row["Статья бюджета"]) === "act")
    .filter((row) => toDate(row["Дата документа"]));
  const payments = plannedRows
    .filter((row) => getArticleType(row["Статья бюджета"]) === "payment")
    .filter((row) => toDate(row["Дата документа"]));

  const groups = groupDocumentsByStage(acts, payments);
  const risks = [...groups.values()].map(analyzeStageFinancialLinks);

  risks.forEach((risk) => {
    if (risk.hasAdvance || risk.confidence === "требуется ручная проверка") {
      risk.payments.forEach((payment) => {
        payment.riskLevel = "critical";
        payment.assistantNotes.push(risk.hasAdvance ? "Возможный аванс" : "Связь требует ручной проверки");
      });
    }
  });

  return risks.sort((first, second) => first.sortDate - second.sortDate);
}

function groupDocumentsByStage(acts, payments) {
  const groups = new Map();
  [...acts, ...payments].forEach((row) => {
    const stage = formatText(row["Стадия проекта"]);
    const key = normalizeComparable(stage);
    if (!groups.has(key)) {
      groups.set(key, { stage, acts: [], payments: [] });
    }
    const group = groups.get(key);
    if (getArticleType(row["Статья бюджета"]) === "act") {
      group.acts.push(row);
    } else {
      group.payments.push(row);
    }
  });
  return groups;
}

function analyzeStageFinancialLinks(group) {
  const { acts, payments } = group;
  const actTotal = sumDocuments(acts);
  const paymentTotal = sumDocuments(payments);
  const hasAdvance = hasAdvancePayment(acts, payments);
  const markerOverlap = getMarkerOverlap(acts, payments);
  const amountStatus = getAmountStatus(actTotal, paymentTotal);
  const dateStatus = getDateStatus(acts, payments);
  const connectionType = getConnectionType(acts, payments);
  const confidence = getConnectionConfidence({
    acts,
    payments,
    amountStatus,
    dateStatus,
    markerOverlap,
  });

  return {
    connectionType,
    stage: group.stage,
    acts,
    payments,
    actsSummary: summarizeDocuments(acts, "акт"),
    paymentsSummary: summarizeDocuments(payments, "поступление"),
    amountsSummary: `${formatCurrency(actTotal)} / ${formatCurrency(paymentTotal)} (${amountStatus})`,
    datesSummary: dateStatus,
    confidence,
    hasAdvance,
    reason: getConnectionReason({
      connectionType,
      confidence,
      markerOverlap,
      amountStatus,
      dateStatus,
      hasAdvance,
    }),
    riskAmount: paymentTotal,
    sortDate: getEarliestDocumentDate([...acts, ...payments])?.valueOf() ?? 0,
  };
}

function getConnectionType(acts, payments) {
  if (!acts.length) {
    return "поступление без найденного акта";
  }
  if (!payments.length) {
    return "акт без найденного поступления";
  }
  if (acts.length === 1 && payments.length === 1) {
    return "1 акт → 1 поступление";
  }
  if (acts.length === 1) {
    return "1 акт → несколько поступлений";
  }
  if (payments.length === 1) {
    return "несколько актов → 1 поступление";
  }
  return "несколько актов → несколько поступлений";
}

function getConnectionConfidence({ acts, payments, amountStatus, dateStatus, markerOverlap }) {
  if (!acts.length || !payments.length) {
    return "требуется ручная проверка";
  }
  const isOneToOne = acts.length === 1 && payments.length === 1;
  const hasAmountSignal = amountStatus === "суммы близки";
  const hasDateSignal = dateStatus.includes("даты близко") || dateStatus.includes("после актов");
  const hasMarkerSignal = markerOverlap.length > 0;

  if (isOneToOne && hasAmountSignal && (hasMarkerSignal || hasDateSignal)) {
    return "высокая";
  }
  if ((hasAmountSignal && hasDateSignal) || (hasMarkerSignal && (hasAmountSignal || hasDateSignal))) {
    return "средняя";
  }
  if (hasAmountSignal || hasDateSignal || hasMarkerSignal) {
    return "низкая";
  }
  return "требуется ручная проверка";
}

function getConnectionReason({ connectionType, confidence, markerOverlap, amountStatus, dateStatus, hasAdvance }) {
  const details = [
    `Тип возможной связи: ${connectionType}.`,
    `Суммы: ${amountStatus}.`,
    `Даты: ${dateStatus}.`,
  ];

  if (markerOverlap.length) {
    details.push(`Общие признаки в комментариях: ${markerOverlap.join(", ")}.`);
  } else {
    details.push("Общие признаки в комментариях не найдены.");
  }
  if (hasAdvance) {
    details.push("Есть возможный аванс: поступление запланировано раньше или в дату акта внутри стадии.");
  }
  if (confidence === "требуется ручная проверка") {
    details.push("Не удалось однозначно связать акт и поступление. Требуется ручная проверка");
  }

  return details.join(" ");
}

function sumDocuments(rows) {
  return rows.reduce((sum, row) => sum + toNumber(row["Сумма, без НДС"]), 0);
}

function getAmountStatus(actTotal, paymentTotal) {
  if (!actTotal || !paymentTotal) {
    return "недостаточно данных по суммам";
  }
  const diff = Math.abs(actTotal - paymentTotal);
  const base = Math.max(Math.abs(actTotal), Math.abs(paymentTotal), 1);
  if (diff / base <= AMOUNT_TOLERANCE_RATIO) {
    return "суммы близки";
  }
  return "суммы отличаются";
}

function getDateStatus(acts, payments) {
  const actDates = acts.map((row) => toDate(row["Дата документа"])).filter(Boolean);
  const paymentDates = payments.map((row) => toDate(row["Дата документа"])).filter(Boolean);
  if (!actDates.length || !paymentDates.length) {
    return "недостаточно данных по датам";
  }

  const minDiff = Math.min(...paymentDates.flatMap((paymentDate) => (
    actDates.map((actDate) => Math.abs(getDayDiff(actDate, paymentDate)))
  )));
  const earliestPayment = new Date(Math.min(...paymentDates.map((date) => date.valueOf())));
  const latestAct = new Date(Math.max(...actDates.map((date) => date.valueOf())));

  if (minDiff <= DATE_NEAR_DAYS) {
    return `даты близко, минимум ${minDiff} дн.`;
  }
  if (earliestPayment > latestAct) {
    return "поступления после актов";
  }
  return "есть поступления раньше актов";
}

function hasAdvancePayment(acts, payments) {
  return payments.some((payment) => {
    const paymentDate = toDate(payment["Дата документа"]);
    return paymentDate && acts.some((act) => {
      const actDate = toDate(act["Дата документа"]);
      return actDate && getDayDiff(actDate, paymentDate) <= 0;
    });
  });
}

function getMarkerOverlap(acts, payments) {
  const actMarkers = new Set(acts.flatMap(extractDocumentMarkers));
  const paymentMarkers = new Set(payments.flatMap(extractDocumentMarkers));
  return [...actMarkers].filter((marker) => paymentMarkers.has(marker)).slice(0, 6);
}

function extractDocumentMarkers(row) {
  const text = normalizeComparable(row["Комментарий"]);
  const markers = [];
  const patterns = [
    /(?:задани[ея]|зд)\s*№?\s*([a-zа-яё0-9./-]+)/gi,
    /(?:этап)\s*№?\s*([a-zа-яё0-9./-]+)/gi,
    /(?:орп)\s*№?\s*([a-zа-яё0-9./-]+)/gi,
  ];

  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      markers.push(match[0].replace(/\s+/g, " ").trim());
      if (match[1]) {
        markers.push(match[1].trim());
      }
    }
  });

  return [...new Set(markers)].filter(Boolean);
}

function summarizeDocuments(rows, singular) {
  if (!rows.length) {
    return `нет ${singular === "акт" ? "актов" : "поступлений"}`;
  }
  const countText = `${rows.length} ${singular === "акт" ? getRuPlural(rows.length, "акт", "акта", "актов") : getRuPlural(rows.length, "поступление", "поступления", "поступлений")}`;
  const totalText = formatCurrency(sumDocuments(rows));
  const dates = rows.map((row) => formatDate(row["Дата документа"])).filter((date) => date !== "--");
  return `${countText}, ${totalText}, даты: ${dates.join(", ") || "--"}`;
}

function getEarliestDocumentDate(rows) {
  const dates = rows.map((row) => toDate(row["Дата документа"])).filter(Boolean);
  if (!dates.length) {
    return null;
  }
  return new Date(Math.min(...dates.map((date) => date.valueOf())));
}

function getRuPlural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

function normalizeComparable(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function getDayDiff(startDate, endDate) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((clearTime(endDate) - clearTime(startDate)) / dayMs);
}

function clearTime(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isFullyDistributed(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["да", "yes", "true", "истина", "1", "полностью"].includes(normalized);
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = String(value ?? "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function toDate(value) {
  if (!hasValue(value)) {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return createUtcDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }

  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) {
    const serialDate = excelSerialToDate(Number(text));
    if (serialDate) {
      return serialDate;
    }
  }

  const ruMatch = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (ruMatch) {
    const [, day, month, year] = ruMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const date = createUtcDate(Number(fullYear), Number(month), Number(day));
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function excelSerialToDate(serial) {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) {
    return null;
  }
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) {
    return null;
  }
  return createUtcDate(parsed.y, parsed.m, parsed.d);
}

function createUtcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) {
    return "--";
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function formatText(value) {
  return hasValue(value) ? String(value) : "--";
}

function sumByArticle(rows, articleType, amountColumn) {
  return rows
    .filter((row) => getArticleType(row[articleType === "planned" ? "Статья бюджета" : "Статья бюджета ЦУП"]) === amountColumn.type)
    .reduce((sum, row) => sum + toNumber(row[amountColumn.key]), 0);
}

function latestDate(rows, dateKey) {
  const timestamps = rows
    .map((row) => toDate(row[dateKey]))
    .filter(Boolean)
    .map((date) => date.valueOf());

  if (!timestamps.length) {
    return "--";
  }
  return formatDate(new Date(Math.max(...timestamps)));
}

function renderProject(project) {
  projectGrid.innerHTML = "";
  const projectFields = [
    ["Код проекта", formatProjectValue("Код проекта", project["Код проекта"])],
    ["Имя проекта", formatProjectValue("Имя проекта", project["Имя проекта"])],
    ["Клиент", formatProjectValue("Клиент", project["Клиент"])],
    ["Руководитель проекта", formatProjectValue("Руководитель проекта", project["Руководитель проекта"])],
    ["Период проекта", formatProjectPeriod(project)],
  ];

  projectFields.forEach(([field, value]) => {
    const wrapper = document.createElement("div");
    wrapper.className = "project-field";
    wrapper.innerHTML = `<dt>${field}</dt><dd>${escapeHtml(value)}</dd>`;
    projectGrid.append(wrapper);
  });
}

function formatProjectPeriod(project) {
  const start = formatDate(project["Начало"]);
  const end = formatDate(project["Окончание"]);
  if (start === "--" && end === "--") {
    return "--";
  }
  return `${start} - ${end}`;
}

function formatProjectValue(field, value) {
  if (["Начало", "Окончание"].includes(field) && hasValue(value)) {
    return formatDate(value);
  }
  if (field === "Руководитель проекта") {
    return formatProjectManager(value);
  }
  return formatText(value);
}

function formatProjectManager(value) {
  return formatText(String(value ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim());
}

function renderAssistantProductView(project, planned, actual) {
  const plannedPayments = planned.filter((row) => getArticleType(row["Статья бюджета"]) === "payment");
  const riskyPayments = analyzeRiskyPlannedPayments(planned, actual);
  const riskyAmount = riskyPayments.reduce((sum, item) => sum + toNumber(item.payment["Сумма, без НДС"]), 0);
  const reasonSummary = summarizeRiskReasons(riskyPayments);

  assistantConclusion.textContent = `По проекту найдено ${plannedPayments.length} плановых поступлений. Из них ${riskyPayments.length} требуют проверки на сумму ${formatCurrency(riskyAmount)}. Основные причины риска: ${reasonSummary}.`;
  renderAssistantKpis(plannedPayments, riskyPayments, actual);
  renderRiskyPaymentsTable(riskyPayments);
}

function renderAssistantKpis(plannedPayments, riskyPayments, actual) {
  const riskyAmount = riskyPayments.reduce((sum, item) => sum + toNumber(item.payment["Сумма, без НДС"]), 0);
  const nearestRisk = getNearestRiskyPayment(riskyPayments);
  const latestActualPayment = latestDate(
    actual.filter((row) => getArticleType(row["Статья бюджета ЦУП"]) === "payment"),
    "Дата",
  );

  const cards = [
    ["Всего плановых поступлений", plannedPayments.length, false],
    ["Требуют проверки", riskyPayments.length, false],
    ["Сумма в зоне риска", formatCurrency(riskyAmount), false],
    ["Ближайшее рискованное поступление", nearestRisk ? formatDate(nearestRisk.paymentDate) : "--", true],
    ["Последняя фактическая оплата", latestActualPayment, true],
  ];

  assistantKpiGrid.innerHTML = "";
  cards.forEach(([label, value, wide]) => {
    const card = document.createElement("article");
    card.className = `summary-card${wide ? " wide" : ""}`;
    card.innerHTML = `<div class="summary-label">${label}</div><div class="summary-value">${escapeHtml(String(value))}</div>`;
    assistantKpiGrid.append(card);
  });
}

function analyzeRiskyPlannedPayments(planned, actual) {
  const plannedActs = planned.filter((row) => getArticleType(row["Статья бюджета"]) === "act");
  const plannedPayments = planned.filter((row) => getArticleType(row["Статья бюджета"]) === "payment");

  return plannedPayments
    .map((payment) => analyzeSinglePlannedPayment(payment, plannedActs, plannedPayments, actual))
    .filter((item) => item.riskLevel !== "низкий риск")
    .sort((first, second) => (first.paymentDate?.valueOf() ?? 0) - (second.paymentDate?.valueOf() ?? 0));
}

function analyzeSinglePlannedPayment(payment, plannedActs, plannedPayments, actual) {
  const stage = formatText(payment["Стадия проекта"]);
  const stageKey = normalizeComparable(stage);
  const stageActs = plannedActs.filter((act) => normalizeComparable(act["Стадия проекта"]) === stageKey);
  const stagePayments = plannedPayments.filter((row) => normalizeComparable(row["Стадия проекта"]) === stageKey);
  const paymentDate = toDate(payment["Дата документа"]);
  const nearestAct = findNearestDocumentByDate(paymentDate, stageActs, "Дата документа");
  const nearestActDate = nearestAct ? toDate(nearestAct["Дата документа"]) : null;
  const groupActTotal = sumDocuments(stageActs);
  const groupPaymentTotal = sumDocuments(stagePayments);
  const amountDiffRatio = getAmountDiffRatio(groupActTotal, groupPaymentTotal);
  const actualPaymentHistory = actual
    .filter((row) => getArticleType(row["Статья бюджета ЦУП"]) === "payment")
    .filter((row) => normalizeComparable(row["Комментарий"]).includes(stageKey) || normalizeComparable(row["Статья бюджета ЦУП"]).startsWith("2"));

  const risk = getPaymentRisk({
    payment,
    paymentDate,
    nearestAct,
    nearestActDate,
    amountDiffRatio,
  });
  const forecastDate = getAssistantForecastDate(paymentDate, nearestActDate, risk.reason);

  return {
    payment,
    stage,
    paymentDate,
    forecastDate,
    nearestAct,
    nearestActDate,
    lagDays: nearestActDate && paymentDate ? getDayDiff(nearestActDate, paymentDate) : null,
    riskLevel: risk.level,
    reason: risk.reason,
    actualPaymentHistory,
    budgetComment: formatText(payment["Комментарий"]),
  };
}

function getPaymentRisk({ payment, paymentDate, nearestAct, nearestActDate, amountDiffRatio }) {
  if (!hasValue(payment["Дата документа"])) {
    return { level: "требуется проверка", reason: "Не указана плановая дата поступления" };
  }
  if (toNumber(payment["Сумма, без НДС"]) === 0) {
    return { level: "средний риск", reason: "Сумма поступления равна нулю или не распознана" };
  }
  if (!nearestAct) {
    return { level: "требуется проверка", reason: "Поступление без найденного планового акта по этой стадии" };
  }
  const lagDays = getDayDiff(nearestActDate, paymentDate);
  if (lagDays === 0) {
    return { level: "высокий риск", reason: "Поступление запланировано в дату ближайшего акта" };
  }
  if (lagDays < 0) {
    return { level: "требуется проверка", reason: "Поступление раньше акта: возможно аванс или ошибка дат" };
  }
  if (amountDiffRatio > AMOUNT_TOLERANCE_RATIO) {
    return { level: "средний риск", reason: "Суммы актов и поступлений по стадии отличаются больше чем на 5%" };
  }
  return { level: "низкий риск", reason: "Поступление позже акта, суммы по стадии примерно сходятся" };
}

function getAssistantForecastDate(paymentDate, nearestActDate, reason) {
  if (!paymentDate) {
    return null;
  }
  if (nearestActDate && reason.includes("раньше акта")) {
    return addDays(nearestActDate, 1);
  }
  if (nearestActDate && reason.includes("в дату ближайшего акта")) {
    return addDays(nearestActDate, 1);
  }
  return paymentDate;
}

function renderRiskyPaymentsTable(items) {
  riskyPaymentsTable.innerHTML = "";
  if (!items.length) {
    renderEmptyRow(riskyPaymentsTable, 7, "Плановые поступления, требующие проверки, не найдены");
    return;
  }

  items.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.stage)}</td>
      <td class="number-cell">${escapeHtml(formatCurrency(item.payment["Сумма, без НДС"]))}</td>
      <td class="date-cell">${escapeHtml(formatDate(item.paymentDate))}</td>
      <td class="date-cell">${escapeHtml(item.forecastDate ? formatDate(item.forecastDate) : "--")}</td>
      <td>${renderGroupRiskBadge(item.riskLevel)}</td>
      <td>${escapeHtml(item.reason)}</td>
      <td>${renderPaymentDetails(item)}</td>
    `;
    riskyPaymentsTable.append(tr);
  });
}

function renderPaymentDetails(item) {
  const actualHistory = item.actualPaymentHistory.length
    ? item.actualPaymentHistory.map((row) => `${formatDate(row["Дата"])} ${formatCurrency(row["Сумма 1C, без НДС"])}`).join("; ")
    : "Фактические оплаты по стадии не найдены";
  const nearestActText = item.nearestAct
    ? `${formatDate(item.nearestActDate)} ${formatCurrency(item.nearestAct["Сумма, без НДС"])}`
    : "Не найден";
  const lagText = item.lagDays === null ? "--" : formatLag(item.lagDays);

  return `
    <details class="row-details">
      <summary>Подробнее</summary>
      <dl>
        <dt>Ближайший плановый акт</dt><dd>${escapeHtml(nearestActText)}</dd>
        <dt>Лаг между актом и поступлением</dt><dd>${escapeHtml(lagText)}</dd>
        <dt>Договорное условие</dt><dd>Не задано в текущей версии MVP</dd>
        <dt>История фактических оплат</dt><dd>${escapeHtml(actualHistory)}</dd>
        <dt>Комментарий из бюджета</dt><dd>${escapeHtml(item.budgetComment)}</dd>
      </dl>
    </details>
  `;
}

function summarizeRiskReasons(items) {
  if (!items.length) {
    return "существенные причины риска не обнаружены";
  }
  return [...new Set(items.map((item) => item.reason))].slice(0, 3).join("; ");
}

function getNearestRiskyPayment(items) {
  return items
    .filter((item) => item.paymentDate)
    .sort((first, second) => first.paymentDate - second.paymentDate)[0] ?? null;
}

function findNearestDocumentByDate(targetDate, rows, dateKey) {
  if (!rows.length) {
    return null;
  }
  if (!targetDate) {
    return rows[0];
  }
  return rows
    .map((row) => ({ row, date: toDate(row[dateKey]) }))
    .filter((item) => item.date)
    .map((item) => ({ row: item.row, diff: Math.abs(getDayDiff(item.date, targetDate)) }))
    .filter((item) => Number.isFinite(item.diff))
    .sort((first, second) => first.diff - second.diff)[0]?.row ?? null;
}

function addDays(date, days) {
  return new Date(date.valueOf() + days * 24 * 60 * 60 * 1000);
}

function renderSummary(planned, actual) {
  const plannedActs = planned.filter((row) => getArticleType(row["Статья бюджета"]) === "act");
  const plannedPayments = planned.filter((row) => getArticleType(row["Статья бюджета"]) === "payment");
  const actualActs = actual.filter((row) => getArticleType(row["Статья бюджета ЦУП"]) === "act");
  const actualPayments = actual.filter((row) => getArticleType(row["Статья бюджета ЦУП"]) === "payment");

  const cards = [
    ["Плановые акты (ст. 3.1)", plannedActs.length, false],
    ["Сумма плановых актов (ст. 3.1)", formatCurrency(plannedActs.reduce((sum, row) => sum + toNumber(row["Сумма, без НДС"]), 0)), false],
    ["Плановые поступления (ст. 2.1)", plannedPayments.length, false],
    ["Сумма плановых поступлений (ст. 2.1)", formatCurrency(plannedPayments.reduce((sum, row) => sum + toNumber(row["Сумма, без НДС"]), 0)), false],
    ["Фактические акты (ст. 3.1)", actualActs.length, false],
    ["Сумма фактических актов (ст. 3.1)", formatCurrency(actualActs.reduce((sum, row) => sum + toNumber(row["Сумма 1C, без НДС"]), 0)), false],
    ["Фактические поступления (ст. 2.1)", actualPayments.length, false],
    ["Сумма фактических поступлений (ст. 2.1)", formatCurrency(actualPayments.reduce((sum, row) => sum + toNumber(row["Сумма 1C, без НДС"]), 0)), false],
    ["Последняя дата фактического акта", latestDate(actualActs, "Дата"), true],
    ["Последняя дата фактического поступления", latestDate(actualPayments, "Дата"), true],
  ];

  summaryGrid.innerHTML = "";
  cards.forEach(([label, value, wide]) => {
    const card = document.createElement("article");
    card.className = `summary-card${wide ? " wide" : ""}`;
    card.innerHTML = `<div class="summary-label">${label}</div><div class="summary-value">${escapeHtml(String(value))}</div>`;
    summaryGrid.append(card);
  });
}

function renderRisks(risks) {
  currentRisks = risks;
  riskTableExpanded = false;
  clearRiskFilters();

  const riskSum = risks.reduce((sum, risk) => sum + risk.riskAmount, 0);
  const affectedStages = new Set(risks.map((risk) => formatText(risk.stage)));
  const manualReviewCount = risks.filter((risk) => risk.confidence === "требуется ручная проверка").length;

  const cards = [
    ["Групп связей", risks.length, false],
    ["Сумма поступлений в анализе", formatCurrency(riskSum), false],
    ["Требуют ручной проверки", manualReviewCount, false],
    ["Стадий в анализе", affectedStages.size, true],
  ];

  riskSummary.innerHTML = "";
  cards.forEach(([label, value, neutral]) => {
    const card = document.createElement("article");
    card.className = `risk-summary-card${neutral ? " neutral" : ""}`;
    card.innerHTML = `<div class="summary-label">${label}</div><div class="summary-value">${escapeHtml(String(value))}</div>`;
    riskSummary.append(card);
  });

  renderRiskTableRows();
}

function renderRiskTableRows() {
  const filteredRisks = getFilteredRisks();
  riskTable.innerHTML = "";
  riskToggleButton.classList.add("hidden");
  riskFilterReset.classList.toggle("hidden", !currentRisks.length || !Object.keys(getRiskFilters()).length);

  if (!currentRisks.length) {
    renderEmptyRow(riskTable, 8, "Связи актов и поступлений по плановым документам не найдены");
    return;
  }

  if (!filteredRisks.length) {
    renderEmptyRow(riskTable, 8, "По выбранным фильтрам риски не найдены");
    return;
  }

  const visibleRisks = riskTableExpanded ? filteredRisks : filteredRisks.slice(0, RISK_VISIBLE_LIMIT);
  visibleRisks.forEach((risk) => {
    const tr = document.createElement("tr");
    tr.className = risk.confidence === "требуется ручная проверка" ? "risk-row" : "";
    tr.innerHTML = `
      <td>${escapeHtml(risk.connectionType)}</td>
      <td>${escapeHtml(formatText(risk.stage))}</td>
      <td>${escapeHtml(risk.actsSummary)}</td>
      <td>${escapeHtml(risk.paymentsSummary)}</td>
      <td>${escapeHtml(risk.amountsSummary)}</td>
      <td>${escapeHtml(risk.datesSummary)}</td>
      <td>${renderConfidence(risk.confidence)}</td>
      <td class="risk-comment">${escapeHtml(risk.reason)}</td>
    `;
    riskTable.append(tr);
  });

  if (filteredRisks.length > RISK_VISIBLE_LIMIT) {
    riskToggleButton.classList.remove("hidden");
    riskToggleButton.textContent = riskTableExpanded
      ? "Свернуть"
      : `Показать все (${filteredRisks.length})`;
  }
}

function getFilteredRisks() {
  const filters = getRiskFilters();
  if (!Object.keys(filters).length) {
    return currentRisks;
  }

  return currentRisks.filter((risk) => {
    const values = getRiskFilterValues(risk);
    return Object.entries(filters).every(([key, filter]) => {
      const value = normalizeFilterText(values[key]);
      return value.includes(filter) || normalizeFilterCompact(value).includes(normalizeFilterCompact(filter));
    });
  });
}

function getRiskFilters() {
  return riskFilterInputs.reduce((filters, input) => {
    const value = normalizeFilterText(input.value);
    if (value) {
      filters[input.dataset.riskFilter] = value;
    }
    return filters;
  }, {});
}

function getRiskFilterValues(risk) {
  return {
    connectionType: risk.connectionType,
    stage: formatText(risk.stage),
    acts: risk.actsSummary,
    payments: risk.paymentsSummary,
    amounts: risk.amountsSummary,
    dates: risk.datesSummary,
    confidence: risk.confidence,
    reason: risk.reason,
  };
}

function clearRiskFilters() {
  riskFilterInputs.forEach((input) => {
    input.value = "";
  });
}

function normalizeFilterText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeFilterCompact(value) {
  return String(value ?? "").replace(/\s+/g, "").toLowerCase();
}

function analyzePlannedActPaymentGroups(plannedRows) {
  const groups = new Map();

  plannedRows.forEach((row) => {
    const articleType = getArticleType(row["Статья бюджета"]);
    if (!["act", "payment"].includes(articleType)) {
      return;
    }

    const stage = formatText(row["Стадия проекта"]);
    const key = normalizeComparable(stage);
    if (!groups.has(key)) {
      groups.set(key, {
        stage,
        acts: [],
        payments: [],
      });
    }

    groups.get(key)[articleType === "act" ? "acts" : "payments"].push(row);
  });

  return [...groups.values()]
    .map(analyzePlannedStageGroup)
    .sort((first, second) => first.stage.localeCompare(second.stage, "ru"));
}

function analyzePlannedStageGroup(group) {
  const markers = getGroupMarkers(group);
  const actTotal = sumDocuments(group.acts);
  const paymentTotal = sumDocuments(group.payments);
  const amountDiff = actTotal - paymentTotal;
  const amountDiffRatio = getAmountDiffRatio(actTotal, paymentTotal);
  const dateSignals = getGroupDateSignals(group.acts, group.payments);
  const connectionType = getGroupConnectionType(group.acts, group.payments);
  const riskLevel = getGroupRiskLevel({
    acts: group.acts,
    payments: group.payments,
    amountDiffRatio,
    dateSignals,
  });

  return {
    groupName: markers.length ? `${group.stage} / ${markers.join(", ")}` : group.stage,
    stage: group.stage,
    markers,
    actsCount: group.acts.length,
    actsTotal: actTotal,
    actsPeriod: getDocumentPeriod(group.acts, "Дата документа"),
    paymentsCount: group.payments.length,
    paymentsTotal: paymentTotal,
    paymentsPeriod: getDocumentPeriod(group.payments, "Дата документа"),
    amountDiff,
    connectionType,
    riskLevel,
    assistantComment: getGroupAssistantComment({
      connectionType,
      riskLevel,
      amountDiffRatio,
      dateSignals,
      markers,
    }),
  };
}

function getGroupConnectionType(acts, payments) {
  if (acts.length && !payments.length) {
    return "акт без поступления";
  }
  if (!acts.length && payments.length) {
    return "поступление без акта";
  }
  if (acts.length === 1 && payments.length === 1) {
    return "1 акт → 1 поступление";
  }
  if (acts.length === 1 && payments.length > 1) {
    return "1 акт → несколько поступлений";
  }
  if (acts.length > 1 && payments.length === 1) {
    return "несколько актов → 1 поступление";
  }
  return "несколько актов → несколько поступлений";
}

function getGroupRiskLevel({ acts, payments, amountDiffRatio, dateSignals }) {
  if (acts.length && !payments.length) {
    return "высокий риск";
  }
  if (!acts.length && payments.length) {
    return "требуется проверка";
  }
  if (dateSignals.sameDayPayment) {
    return "высокий риск";
  }
  if (dateSignals.earlyPayment) {
    return "требуется проверка";
  }
  if (amountDiffRatio > AMOUNT_TOLERANCE_RATIO) {
    return "средний риск";
  }
  if (dateSignals.paymentsAfterActs) {
    return "низкий риск";
  }
  return "требуется проверка";
}

function getGroupAssistantComment({ connectionType, riskLevel, amountDiffRatio, dateSignals, markers }) {
  const comments = [`Тип связи: ${connectionType}.`];

  if (markers.length) {
    comments.push(`Найдены признаки в комментариях: ${markers.join(", ")}.`);
  } else {
    comments.push("Признаки «Задание», «Этап», «ОРП» в комментариях не найдены.");
  }

  if (connectionType === "акт без поступления") {
    comments.push("Высокий риск: по стадии есть плановый акт, но нет планового поступления.");
  } else if (connectionType === "поступление без акта") {
    comments.push("Требуется проверка: по стадии есть плановое поступление без найденного акта.");
  }

  if (amountDiffRatio > AMOUNT_TOLERANCE_RATIO) {
    comments.push("Суммы актов и поступлений отличаются больше чем на 5%.");
  }
  if (dateSignals.earlyPayment) {
    comments.push("Требуется проверка: возможно аванс или ошибка дат.");
  }
  if (dateSignals.sameDayPayment) {
    comments.push("Высокий риск: поступление запланировано в дату акта.");
  }
  if (riskLevel === "низкий риск") {
    comments.push("Акты и поступления есть, суммы примерно сходятся, поступления позже актов.");
  }

  return comments.join(" ");
}

function getGroupMarkers(group) {
  return [...new Set([...group.acts, ...group.payments].flatMap(extractDocumentMarkers))];
}

function getAmountDiffRatio(actTotal, paymentTotal) {
  const base = Math.max(Math.abs(actTotal), Math.abs(paymentTotal), 1);
  return Math.abs(actTotal - paymentTotal) / base;
}

function getGroupDateSignals(acts, payments) {
  const actDates = acts.map((row) => toDate(row["Дата документа"])).filter(Boolean);
  const paymentDates = payments.map((row) => toDate(row["Дата документа"])).filter(Boolean);

  if (!actDates.length || !paymentDates.length) {
    return {
      earlyPayment: false,
      sameDayPayment: false,
      paymentsAfterActs: false,
    };
  }

  const earliestPayment = new Date(Math.min(...paymentDates.map((date) => date.valueOf())));
  const earliestAct = new Date(Math.min(...actDates.map((date) => date.valueOf())));
  const latestAct = new Date(Math.max(...actDates.map((date) => date.valueOf())));
  const sameDayPayment = paymentDates.some((paymentDate) => (
    actDates.some((actDate) => getDayDiff(actDate, paymentDate) === 0)
  ));

  return {
    earlyPayment: earliestPayment < earliestAct,
    sameDayPayment,
    paymentsAfterActs: earliestPayment > latestAct,
  };
}

function getDocumentPeriod(rows, dateKey) {
  const dates = rows.map((row) => toDate(row[dateKey])).filter(Boolean);
  if (!dates.length) {
    return "--";
  }

  const minDate = new Date(Math.min(...dates.map((date) => date.valueOf())));
  const maxDate = new Date(Math.max(...dates.map((date) => date.valueOf())));
  if (minDate.valueOf() === maxDate.valueOf()) {
    return formatDate(minDate);
  }
  return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
}

function renderGroupAnalysisTable(groups) {
  groupAnalysisTable.innerHTML = "";
  if (!groups.length) {
    renderEmptyRow(groupAnalysisTable, 13, "Группы плановых актов и поступлений не найдены");
    return;
  }

  groups.forEach((group) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(group.groupName)}</td>
      <td>${escapeHtml(group.stage)}</td>
      <td>${escapeHtml(group.markers.length ? group.markers.join(", ") : "--")}</td>
      <td class="number-cell">${group.actsCount}</td>
      <td class="number-cell">${escapeHtml(formatCurrency(group.actsTotal))}</td>
      <td class="date-cell">${escapeHtml(group.actsPeriod)}</td>
      <td class="number-cell">${group.paymentsCount}</td>
      <td class="number-cell">${escapeHtml(formatCurrency(group.paymentsTotal))}</td>
      <td class="date-cell">${escapeHtml(group.paymentsPeriod)}</td>
      <td class="number-cell">${escapeHtml(formatCurrency(group.amountDiff))}</td>
      <td>${escapeHtml(group.connectionType)}</td>
      <td>${renderGroupRiskBadge(group.riskLevel)}</td>
      <td class="risk-comment">${escapeHtml(group.assistantComment)}</td>
    `;
    groupAnalysisTable.append(tr);
  });
}

function renderGroupRiskBadge(riskLevel) {
  const className = riskLevel === "высокий риск"
    ? "critical"
    : riskLevel === "низкий риск"
      ? "ok"
      : "";
  return `<span class="badge ${className}">${escapeHtml(riskLevel)}</span>`;
}

function formatLag(days) {
  if (days === 0) {
    return "0 дней";
  }
  if (days < 0) {
    return `${Math.abs(days)} дн. до акта`;
  }
  return `${days} дн. после акта`;
}

function renderPlannedTable(rows) {
  plannedTable.innerHTML = "";
  if (!rows.length) {
    renderEmptyRow(plannedTable, 9, "Плановые документы по статьям 3.* и 2.* не найдены");
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    if (row.riskLevel === "critical") {
      tr.className = "risk-row";
    }
    const cells = PLANNED_COLUMNS.map((column) => formatCell(row[column], column));
    tr.innerHTML = `${cells.join("")}<td>${renderNotes(row.assistantNotes)}</td>`;
    plannedTable.append(tr);
  });
}

function renderActualTable(rows) {
  actualTable.innerHTML = "";
  if (!rows.length) {
    renderEmptyRow(actualTable, 8, "Фактические документы по статьям 3.* и 2.* не найдены");
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const cells = ACTUAL_COLUMNS.map((column) => formatCell(row[column], column));
    tr.innerHTML = `${cells.join("")}<td>${renderNotes(row.assistantNotes)}</td>`;
    actualTable.append(tr);
  });
}

function formatCell(value, column) {
  if (column.includes("Сумма")) {
    return `<td class="number-cell">${escapeHtml(formatCurrency(value))}</td>`;
  }
  if (column === "Дата" || column.includes("Дата") || column === "Начало" || column === "Окончание") {
    return `<td class="date-cell">${escapeHtml(formatDate(value))}</td>`;
  }
  return `<td>${escapeHtml(formatText(value))}</td>`;
}

function renderNotes(notes) {
  if (!notes.length) {
    return '<span class="badge ok">Без замечаний</span>';
  }
  return `<div class="badge-list">${notes.map((note) => `<span class="badge">${escapeHtml(note)}</span>`).join("")}</div>`;
}

function renderConfidence(confidence) {
  const className = confidence === "высокая"
    ? "ok"
    : confidence === "требуется ручная проверка"
      ? "critical"
      : "";
  return `<span class="badge ${className}">${escapeHtml(confidence)}</span>`;
}

function renderEmptyRow(tableBody, colspan, text) {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td colspan="${colspan}" class="empty-state">${escapeHtml(text)}</td>`;
  tableBody.append(tr);
}

function setStatus(type, text) {
  statusText.textContent = text;
  statusDot.className = "status-dot";
  if (type === "ready") {
    statusDot.classList.add("ready");
  }
  if (type === "error") {
    statusDot.classList.add("error");
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
