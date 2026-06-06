const STORAGE_KEY = "rpNavigatorState";

const STAGE_LABELS = {
  initiation: "Инициация",
  execution: "Реализация",
  closing: "Закрытие",
};

const STATUS_LABELS = {
  not_started: "Не начато",
  in_progress: "В работе",
  done: "Выполнено",
  skipped: "Пропущено",
};

const FREQUENCY_LABELS = {
  once: "Однократно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  biweekly: "Раз в две недели",
  event: "По событию",
};

const WEEKDAY_LABELS = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница",
};

const MONTH_RULE_LABELS = {
  first_workday: "Первый рабочий день месяца",
  beginning_of_month: "Начало месяца",
  end_of_month: "Конец месяца",
};

const PRIORITY_LABELS = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const ROLE_OPTIONS = [
  "Руководитель проекта",
  "Администратор проекта/дирекции",
  "Куратор",
  "Иная роль",
];

const operationalActions = [
  action("init-accept-from-sales", "Приём проекта от продаж", "Старт проекта", "initiation", "Проект передан от продаж в реализацию", "Принять проект от продаж: получить исходные договорённости, границы проекта, ожидания заказчика, ограничения, вводные по команде и рискам.", "РП понимает контекст проекта, договорённости с заказчиком, состав работ, ограничения и ближайшие шаги.", "once", "high", "Проверь, что переданы все ключевые вводные по проекту, клиенту, договорённостям и ожиданиям.", ["инициация", "продажи"]),
  action("init-team-setup", "Формирование команды", "Команда", "initiation", "Проект принят в работу", "Определить состав команды проекта, роли участников, зоны ответственности и потребность в ресурсах.", "Команда проекта определена, роли понятны, ответственные назначены.", "once", "high", "Зафиксируй ключевых участников проекта и их зоны ответственности.", ["команда", "ресурсы"]),
  action("init-contractor-card-sed", "Карточка контрагента в СЭД", "Документы", "initiation", "Для проекта нужен документооборот с контрагентом", "Проверить наличие карточки контрагента в СЭД и инициировать создание или актуализацию при необходимости.", "Карточка контрагента в СЭД создана или актуализирована.", "event", "medium", "Проверь реквизиты и корректность данных контрагента.", ["СЭД", "контрагент"]),
  action("init-contract", "Договор", "Документы", "initiation", "Необходимо оформить договорную базу проекта", "Проверить наличие договора, статус согласования, приложения, условия оплаты, порядок приёмки и ответственных.", "Договорная база понятна, статус договора прозрачен, блокеры выявлены.", "event", "high", "Обрати внимание на сроки, сумму, порядок актирования и условия оплаты.", ["договор", "актирование"]),
  action("init-project-charter", "Устав/паспорт проекта", "Управление проектом", "initiation", "Проект необходимо формализовать", "Подготовить устав или паспорт проекта: цели, границы, участники, роли, результаты, ограничения и ключевые риски.", "Устав или паспорт проекта подготовлен и может использоваться как основа управления проектом.", "once", "high", "Зафиксируй цели, границы, роли, риски и критерии результата.", ["паспорт", "устав"]),
  action("init-cup-project-card", "Карточка проекта в ЦУП", "ЦУП", "initiation", "Проект должен быть отражён в ЦУП", "Создать или проверить карточку проекта в ЦУП: название, клиент, руководитель проекта, тип проекта, даты, стадия.", "Карточка проекта в ЦУП создана и содержит актуальные данные.", "once", "medium", "Проверь корректность основных реквизитов проекта в ЦУП.", ["ЦУП", "карточка"]),
  action("init-project-plan", "План проекта", "Планирование", "initiation", "Необходимо сформировать план проекта", "Сформировать план проекта: этапы, сроки, работы, зависимости и ключевые результаты.", "План проекта создан и отражает структуру работ, сроки и зависимости.", "once", "high", "План должен быть пригоден для дальнейшей актуализации в ходе реализации.", ["план", "сроки"]),
  action("init-project-budget", "Бюджет проекта", "Бюджет", "initiation", "Необходимо сформировать бюджет проекта", "Сформировать или проверить бюджет проекта: плановые трудозатраты, поступления, затраты и основные финансовые параметры.", "Бюджет проекта сформирован и может использоваться для контроля в ЦУП.", "once", "high", "Проверь связь бюджета с договорённостями, планом проекта и ожидаемыми работами.", ["бюджет", "финансы"]),
  action("init-control-points", "Контрольные точки", "Контрольные точки", "initiation", "Необходимо определить контрольные точки проекта", "Сформировать реестр контрольных точек проекта: события, сроки, результаты и критерии прохождения.", "Контрольные точки определены и позволяют отслеживать движение проекта.", "once", "medium", "Контрольная точка должна иметь дату, результат и понятный критерий выполнения.", ["контрольные точки"]),
  action("init-team-work", "Работа с командой", "Команда", "initiation", "Команда проекта сформирована", "Организовать взаимодействие с командой: правила коммуникации, регулярные встречи, роли и ожидания.", "Команда понимает правила взаимодействия, роли и ближайшие задачи.", "event", "medium", "Зафиксируй договорённости с командой и формат регулярной синхронизации.", ["команда", "коммуникации"]),
  action("init-kickoff-meetings", "Стартовые встречи", "Коммуникации", "initiation", "Проект готов к запуску", "Провести стартовые встречи с командой и заказчиком, зафиксировать цели, роли, ожидания, правила коммуникации и ближайшие шаги.", "Стартовые встречи проведены, договорённости и следующие шаги зафиксированы.", "once", "high", "После встречи зафиксируй решения, открытые вопросы и ответственных.", ["kickoff", "коммуникации"]),
  action("exec-update-project-card", "Актуализация карточки проекта", "ЦУП", "execution", "Изменились данные проекта или требуется регулярная актуализация", "Проверить и актуализировать карточку проекта в ЦУП: статус, стадию, даты, ответственных и другие ключевые параметры.", "Карточка проекта в ЦУП содержит актуальные данные.", "weekly", "medium", "В плане еженедельная актуализация выполняется каждый четверг вместе с планом, бюджетом и контрольными точками.", ["ЦУП", "четверг"], "thursday"),
  action("exec-update-project-plan-cup", "Актуализация плана проекта в ЦУП", "План проекта", "execution", "Еженедельно, каждый четверг", "Актуализировать план проекта в ЦУП: сроки, работы, зависимости, статусы и ближайшие задачи.", "План проекта в ЦУП отражает актуальное состояние проекта.", "weekly", "high", "Это регулярное действие из блока «Еженедельно, каждый четверг».", ["ЦУП", "план проекта"], "thursday"),
  action("exec-update-budget", "Актуализация бюджета проекта", "Бюджет", "execution", "Еженедельно, каждый четверг", "Актуализировать бюджет проекта: проверить плановые и фактические данные, изменения трудозатрат, поступлений и затрат.", "Бюджет проекта актуален и соответствует текущему состоянию проекта.", "weekly", "high", "Это регулярное действие из блока «Еженедельно, каждый четверг».", ["бюджет", "ЦУП"], "thursday"),
  action("exec-update-control-points", "Актуализация реестра контрольных точек", "Контрольные точки", "execution", "Еженедельно, каждый четверг", "Актуализировать реестр контрольных точек: сроки, статусы, фактическое выполнение и отклонения.", "Реестр контрольных точек отражает актуальное состояние проекта.", "weekly", "high", "Это регулярное действие из блока «Еженедельно, каждый четверг».", ["контрольные точки", "ЦУП"], "thursday"),
  action("exec-timesheets", "Согласование таймшитов", "Таймшиты", "execution", "Еженедельно, каждая пятница", "Согласовать списания таймшитов всеми участниками проекта в ЦУП.", "Таймшиты участников проекта согласованы в ЦУП.", "weekly", "high", "Это регулярное действие из блока «Еженедельно, каждая пятница».", ["таймшиты", "ЦУП"], "friday"),
  action("exec-orp", "Формирование ОРП / согласование ОРП / сохранение ОРП", "ОРП", "execution", "В соответствии с графиком актирования", "Собрать данные для актуального отчёта руководителя проекта в соответствии с графиком актирования, сверить их с фактическим объёмом работ, актуализировать план проекта и бюджет в ЦУП, внести риски из реестра рисков и открытые вопросы из реестра вопросов, отправить ОРП на согласование заказчику, подписать с заказчиком и выложить подписанный ОРП в ЦУП.", "ОРП сформирован, согласован с заказчиком, подписан и сохранён в ЦУП; план проекта и бюджет актуализированы.", "biweekly", "high", "ОРП — это отчёт руководителя проекта. Проверь риски, открытые вопросы, фактический объём работ, актуальность плана и бюджета.", ["ОРП", "актирование", "риски"]),
  action("exec-automonitoring", "Мониторинг проектных показателей", "Мониторинг", "execution", "Каждый 1-й рабочий день месяца", "Проверить результаты автомониторинга, устранить замечания или заполнить комментарии по замечаниям, если их невозможно устранить.", "Результаты автомониторинга проверены, замечания устранены или прокомментированы.", "monthly", "high", "Каждый 6-й рабочий день месяца руководитель получает список проектов с красными индикаторами, поэтому важно заранее отработать замечания.", ["автомониторинг", "показатели"], null, "first_workday"),
  action("exec-contractors-timesheets", "Работа с подрядчиками", "Подрядчики", "execution", "В начале каждого месяца", "Согласовать или оспорить таймшиты подрядчиков за предыдущий месяц, после подтверждения внести часы подрядчика в бюджет проекта, при необходимости скорректировать акт или счёт для оплаты подрядчику.", "Таймшиты подрядчиков согласованы или оспорены, часы внесены в бюджет проекта, документы для оплаты скорректированы при необходимости.", "monthly", "medium", "Проверь таймшиты подрядчиков, часы в бюджете, акт и счёт на оплату.", ["подрядчики", "таймшиты"], null, "beginning_of_month"),
  action("exec-plan-fact-timesheets", "План-факт по плану проекта", "План-факт", "execution", "В начале каждого месяца", "Подгрузить факт таймшитов из ЦУП за предыдущий месяц в план проекта ЦУП через кнопку «План-факт», недописанные часы при необходимости перенести на следующий период.", "Факт таймшитов за предыдущий месяц подгружен в план проекта, недописанные часы обработаны.", "monthly", "high", "Используй кнопку «План-факт» в плане проекта ЦУП и проверь недописанные часы.", ["план-факт", "таймшиты"], null, "beginning_of_month"),
  action("exec-cup-documents", "Документы в ЦУП", "ЦУП", "execution", "Появились или изменились проектные документы", "Проверить наличие и актуальность проектных документов в ЦУП.", "Документы в ЦУП актуальны и соответствуют текущему состоянию проекта.", "event", "medium", "Проверяй документы при изменениях по договору, актированию, плану или бюджету.", ["документы", "ЦУП"]),
];

const app = document.querySelector("#app");
let state = loadState();
let selectedProjectId = null;
let selectedTab = "now";
let filters = { stage: "all", category: "all", frequencyType: "all", status: "all", priority: "all" };
let profileError = "";
let profileEditing = !isProfileComplete(state.userProfile);
let projectFormVisible = false;

render();

function action(id, title, category, stage, trigger, description, goodResult, frequencyType, priority, helperText, tags, weekday = null, monthRule = null) {
  return { id, title, category, stage, trigger, description, goodResult, frequencyType, weekday, monthRule, helperText, helperLink: "", priority, tags, defaultVisible: true };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeState(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  const now = new Date().toISOString();
  return normalizeState({
    userProfile: { id: makeId("user"), lastName: "", firstName: "", role: "", createdAt: now, updatedAt: now },
    projects: [],
  });
}

function normalizeState(rawState) {
  const now = new Date().toISOString();
  const userProfile = rawState.userProfile || {};
  const migratedName = splitLegacyName(userProfile.name);
  return {
    ...rawState,
    userProfile: {
      id: userProfile.id || makeId("user"),
      lastName: userProfile.lastName ?? migratedName.lastName,
      firstName: userProfile.firstName ?? migratedName.firstName,
      role: userProfile.role || "",
      createdAt: userProfile.createdAt || now,
      updatedAt: userProfile.updatedAt || now,
    },
    projects: Array.isArray(rawState.projects) ? rawState.projects : [],
  };
}

function splitLegacyName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }
  return { firstName: "", lastName: "" };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const selectedProject = getSelectedProject();
  if (selectedProject) {
    app.innerHTML = `<section class="workspace project-workspace">${renderProjectScreen(selectedProject)}</section>`;
    bindEvents();
    return;
  }
  if (selectedProjectId) {
    app.innerHTML = `<section class="workspace project-workspace">${renderNoAccess()}</section>`;
    bindEvents();
    return;
  }

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        ${renderProfile()}
        ${renderDataTools()}
      </aside>
      <section class="workspace">
        ${isFirstState() ? renderWelcome() : renderProjectsList()}
        ${renderCreateProject()}
      </section>
    </div>
  `;
  bindEvents();
}

function renderProfile() {
  const profile = state.userProfile;
  const hasProfile = isProfileComplete(profile);
  if (hasProfile && !profileEditing) {
    return `
      <section class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Профиль</p>
            <h2>Пользователь</h2>
          </div>
        </div>
        <div class="profile-summary">
          <strong>${escapeHtml(getUserFullName())}</strong>
          <span>${escapeHtml(profile.role)}</span>
        </div>
        <button class="button secondary" id="editProfileButton" type="button">Редактировать профиль</button>
      </section>
    `;
  }

  return `
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Профиль</p>
          <h2>Пользователь</h2>
        </div>
      </div>
      <form class="form-grid" id="profileForm" novalidate>
        <div class="field">
          <label for="profileLastName">Фамилия</label>
          <input id="profileLastName" name="lastName" value="${escapeHtml(profile.lastName)}" placeholder="Например, Потапова" aria-required="true">
        </div>
        <div class="field">
          <label for="profileFirstName">Имя</label>
          <input id="profileFirstName" name="firstName" value="${escapeHtml(profile.firstName)}" placeholder="Например, Вероника" aria-required="true">
        </div>
        <div class="field">
          <label for="profileRole">Роль</label>
          <select id="profileRole" name="role" aria-required="true">
            <option value="">Выберите роль</option>
            ${ROLE_OPTIONS.map((role) => `<option value="${escapeHtml(role)}" ${profile.role === role ? "selected" : ""}>${escapeHtml(role)}</option>`).join("")}
          </select>
        </div>
        ${profileError ? `<div class="form-error">${profileError}</div>` : ""}
        <div class="row">
          <button class="button" type="submit">Сохранить профиль</button>
          ${hasProfile ? '<button class="button secondary" id="cancelProfileEdit" type="button">Отмена</button>' : ""}
        </div>
      </form>
    </section>
  `;
}

function renderCreateProject() {
  if (!isProfileComplete(state.userProfile)) {
    return `
      <section class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Новый проект</p>
            <h2>Создание проекта</h2>
          </div>
        </div>
        <p class="muted">Сначала заполните профиль, чтобы создавать проекты.</p>
        <button class="button" type="button" disabled>Создать проект</button>
      </section>
    `;
  }

  if (!projectFormVisible) {
    return `
      <section class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Новый проект</p>
            <h2>Создание проекта</h2>
          </div>
        </div>
        <button class="button" id="showProjectForm" type="button">Создать проект</button>
      </section>
    `;
  }

  return `
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Мои проекты</p>
          <h2>Создать проект</h2>
        </div>
      </div>
      <form class="form-grid" id="projectForm">
        <div class="field"><label>Название проекта</label><input id="projectTitle" name="title" required></div>
        <div class="field"><label>Клиент</label><input name="client" required></div>
        <div class="field"><label>Тип проекта</label><input name="projectType" placeholder="Внедрение, поддержка, внутренний продукт"></div>
        <div class="field">
          <label>Стадия</label>
          <select name="stage">
            <option value="initiation">Инициация</option>
            <option value="execution">Реализация</option>
            <option value="closing">Закрытие</option>
          </select>
        </div>
        <div class="field"><label>Дата начала</label><input name="startDate" type="date"></div>
        <div class="field"><label>Дата окончания</label><input name="endDate" type="date"></div>
        <div class="row">
          <button class="button" type="submit">Создать проект</button>
          <button class="button secondary" id="cancelProjectCreate" type="button">Отмена</button>
        </div>
      </form>
    </section>
  `;
}

function renderProjectsList() {
  const accessibleProjects = getAccessibleProjects();
  const cards = accessibleProjects.map((project) => {
    const progress = getProjectProgress(project);
    const openCount = getOpenActions(project).length;
    return `
      <article class="project-card ${project.id === selectedProjectId ? "active" : ""}">
        <div class="card-top">
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <p class="muted">${escapeHtml(project.client)}</p>
          </div>
          <button class="button small secondary" data-select-project="${project.id}">Открыть</button>
        </div>
        <div class="badges">
          <span class="badge">${STAGE_LABELS[project.stage]}</span>
          <span class="badge">${formatDate(project.startDate)} - ${formatDate(project.endDate)}</span>
          <span class="badge">${openCount} открыто</span>
        </div>
        ${renderProgress(progress)}
      </article>
    `;
  }).join("");

  return `
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Проекты</p>
          <h2>Мои проекты</h2>
        </div>
      </div>
      <div class="project-list">${cards || '<div class="empty">Пока нет доступных проектов. Создайте проект или попросите добавить вас в участники.</div>'}</div>
    </section>
  `;
}

function renderDataTools() {
  return `
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Данные</p>
          <h2>Настройки MVP</h2>
        </div>
      </div>
      <button class="button danger" id="clearDataButton" type="button">Очистить данные</button>
    </section>
  `;
}

function renderEmptyWorkspace() {
  return `
    <section class="panel">
      <p class="eyebrow">Старт</p>
      <h2>Мои проекты</h2>
      <p class="lead">Создайте первый проект или откройте демо-проект, чтобы увидеть операционный навигатор РП.</p>
    </section>
  `;
}

function renderNoAccess() {
  return `
    <section class="panel compact-panel">
      <button class="button secondary" id="backToProjects" type="button">Назад к моим проектам</button>
    </section>
    <section class="panel">
      <p class="eyebrow">Доступ</p>
      <h2>У вас нет доступа к этому проекту</h2>
      <p class="lead">Проект не найден среди проектов, которые вы создали или где вы указаны участником.</p>
    </section>
  `;
}

function renderWelcome() {
  return `
    <section class="panel welcome-panel">
      <p class="eyebrow">Первый запуск</p>
      <h2>Добро пожаловать в Личный кабинет РП</h2>
      <p class="lead">Создайте проект, чтобы увидеть операционный план по стадии, неделе и месяцу.</p>
      <div class="welcome-actions">
        <button class="button" id="startCreateProject" type="button">Создать первый проект</button>
        <button class="button secondary" id="openDemoProject" type="button">Открыть демо-проект</button>
      </div>
    </section>
  `;
}

function renderProjectScreen(project) {
  const progress = getProjectProgress(project);
  const kpis = getProjectKpis(project);
  const tabActions = getActionsForTab(project, selectedTab);
  const readonly = !canEditProject(project);

  return `
    <section class="panel compact-panel">
      <button class="button secondary" id="backToProjects" type="button">Назад к моим проектам</button>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Проект</p>
          <h2>${escapeHtml(project.title)}</h2>
        </div>
      </div>
      ${renderProjectDetails(project, readonly, progress)}
      <div class="kpi-grid">
        ${kpi("Открытые действия", kpis.open)}
        ${kpi("В работе", kpis.inProgress)}
        ${kpi("Выполненные", kpis.done)}
        ${kpi("Прогресс", `${progress.percent}%`)}
      </div>
      ${renderProgress(progress)}
    </section>

    <section class="panel navigator-note">
      <p class="eyebrow">Навигатор</p>
      <h2>Операционный навигатор проекта</h2>
      <p class="lead">Навигатор показывает, какие операционные действия актуальны для РП сейчас, на этой неделе, в этом месяце и на текущей стадии проекта. Отмечайте выполненные действия — прогресс проекта будет обновляться автоматически.</p>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Разделы</p>
          <h2>Операционные действия</h2>
        </div>
      </div>
      <div class="tabs">
        ${tabButton("now", "Сейчас")}
        ${tabButton("week", "На этой неделе")}
        ${tabButton("month", "В этом месяце")}
        ${tabButton("stage", "На стадии проекта")}
        ${tabButton("all", "Все действия")}
      </div>
    </section>

    <section class="panel">
      ${selectedTab === "all" ? renderFilters() : ""}
      <div class="actions-grid">
        ${tabActions.map((item) => renderActionCard(item, project, readonly, false)).join("") || '<div class="empty">Нет актуальных действий для этого раздела.</div>'}
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Доступ</p>
          <h2>Участники и права</h2>
        </div>
      </div>
      ${renderParticipants(project, readonly)}
    </section>
  `;
}

function renderProjectDetails(project, readonly, progress) {
  if (readonly) {
    return `
      <div class="meta-grid">
        ${meta("Клиент", project.client)}
        ${meta("Тип", project.projectType || "Не указан")}
        ${meta("Стадия", STAGE_LABELS[project.stage])}
        ${meta("Начало", formatDate(project.startDate))}
        ${meta("Окончание", formatDate(project.endDate))}
        ${meta("Прогресс", `${progress.done} из ${progress.total} (${progress.percent}%)`)}
      </div>
    `;
  }

  return `
    <form class="project-edit-grid" id="projectDetailsForm">
      <div class="field"><label>Название проекта</label><input name="title" value="${escapeHtml(project.title)}" required></div>
      <div class="field"><label>Клиент</label><input name="client" value="${escapeHtml(project.client)}" required></div>
      <div class="field"><label>Тип</label><input name="projectType" value="${escapeHtml(project.projectType || "")}"></div>
      <div class="field">
        <label>Стадия</label>
        <select name="stage">
          ${Object.entries(STAGE_LABELS).map(([value, label]) => `<option value="${value}" ${project.stage === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>
      <div class="field"><label>Дата начала</label><input name="startDate" type="date" value="${escapeHtml(project.startDate || "")}"></div>
      <div class="field"><label>Дата окончания</label><input name="endDate" type="date" value="${escapeHtml(project.endDate || "")}"></div>
      <button class="button secondary" type="submit">Сохранить карточку</button>
    </form>
  `;
}

function renderParticipants(project, readonly) {
  const list = project.participants.map((participant) => `
    <div class="participant">
      <div>
        <strong>${escapeHtml(participant.name)}</strong>
        <div class="muted">${escapeHtml(participant.email || "email не указан")}</div>
      </div>
      <select data-participant-access="${participant.id}" ${readonly ? "disabled" : ""}>
        <option value="editor" ${participant.accessLevel === "editor" ? "selected" : ""}>Редактор</option>
        <option value="viewer" ${participant.accessLevel === "viewer" ? "selected" : ""}>Наблюдатель</option>
      </select>
      <button class="button small danger" data-remove-participant="${participant.id}" ${readonly ? "disabled" : ""}>Удалить</button>
    </div>
  `).join("");

  return `
    <div class="participants">${list}</div>
    <form class="form-grid" id="participantForm" style="margin-top: 14px;">
      <div class="field"><label>Фамилия и имя / полное имя</label><input name="name" ${readonly ? "disabled" : ""}></div>
      <div class="field"><label>Email</label><input name="email" type="email" ${readonly ? "disabled" : ""}></div>
      <div class="field">
        <label>Право доступа</label>
        <select name="accessLevel" ${readonly ? "disabled" : ""}>
          <option value="editor">Редактор</option>
          <option value="viewer">Наблюдатель</option>
        </select>
      </div>
      <button class="button secondary" type="submit" ${readonly ? "disabled" : ""}>Добавить участника</button>
    </form>
  `;
}

function renderActionCard(actionItem, project, readonly, compact) {
  const status = getActionStatus(project, actionItem.id);
  const effectiveStatus = status?.status || "not_started";
  const comment = status?.comment || "";
  const classes = `action-card ${effectiveStatus}`;
  const helperLink = actionItem.helperLink
    ? `<a href="${escapeHtml(actionItem.helperLink)}" target="_blank" rel="noreferrer">Открыть материал</a>`
    : "";

  return `
    <article class="${classes}">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(actionItem.title)}</h3>
          <div class="badges">
            <span class="badge">${escapeHtml(actionItem.category)}</span>
            <span class="badge frequency">${escapeHtml(FREQUENCY_LABELS[actionItem.frequencyType])}</span>
            <span class="badge ${actionItem.priority}">Приоритет: ${PRIORITY_LABELS[actionItem.priority]}</span>
            <span class="badge ${effectiveStatus === "done" ? "done" : effectiveStatus === "in_progress" ? "progress" : ""}">${STATUS_LABELS[effectiveStatus]}</span>
          </div>
        </div>
      </div>
      <p class="action-summary">${escapeHtml(actionItem.trigger)}</p>
      <details class="details" ${compact ? "" : "open"}>
        <summary>Подробнее</summary>
        <div class="details-body">
          <section class="instruction-block">
            <h4>Когда выполнять</h4>
            <p>${escapeHtml(actionItem.trigger)}</p>
            <p class="muted">${escapeHtml(formatFrequency(actionItem))}</p>
          </section>
          <section class="instruction-block">
            <h4>Что сделать</h4>
            <p>${escapeHtml(actionItem.description)}</p>
          </section>
          <section class="instruction-block result-block">
            <h4>Критерий хорошего результата</h4>
            <p>${escapeHtml(actionItem.goodResult)}</p>
          </section>
          <section class="instruction-block">
            <h4>Что может помочь</h4>
            <p>${escapeHtml(actionItem.helperText || "Дополнительные материалы не указаны.")}</p>
            ${helperLink}
          </section>
          <section class="instruction-block">
            <h4>Комментарий по проекту</h4>
            <textarea data-action-comment="${actionItem.id}" placeholder="Комментарий" ${readonly ? "disabled" : ""}>${escapeHtml(comment)}</textarea>
          </section>
          <section class="instruction-block">
            <h4>Статус</h4>
            <div class="status-controls">
              <select data-action-status="${actionItem.id}" ${readonly ? "disabled" : ""}>
                ${Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${effectiveStatus === value ? "selected" : ""}>${label}</option>`).join("")}
              </select>
              <button class="button small" data-action-done="${actionItem.id}" ${readonly || effectiveStatus === "done" ? "disabled" : ""}>Выполнено</button>
            </div>
          </section>
        </div>
      </details>
    </article>
  `;
}

function renderFilters() {
  const categories = [...new Set(operationalActions.map((item) => item.category))].sort();
  return `
    <div class="filters">
      ${selectFilter("stage", "Стадия", [["all", "Все"], ...Object.entries(STAGE_LABELS)])}
      ${selectFilter("category", "Категория", [["all", "Все"], ...categories.map((item) => [item, item])])}
      ${selectFilter("frequencyType", "Периодичность", [["all", "Все"], ...Object.entries(FREQUENCY_LABELS)])}
      ${selectFilter("status", "Статус", [["all", "Все"], ...Object.entries(STATUS_LABELS)])}
      ${selectFilter("priority", "Приоритет", [["all", "Все"], ...Object.entries(PRIORITY_LABELS)])}
    </div>
  `;
}

function selectFilter(name, label, options) {
  return `
    <div class="field">
      <label>${label}</label>
      <select data-filter="${name}">
        ${options.map(([value, text]) => `<option value="${value}" ${filters[name] === value ? "selected" : ""}>${text}</option>`).join("")}
      </select>
    </div>
  `;
}

function bindEvents() {
  document.querySelector("#profileForm")?.addEventListener("submit", saveProfile);
  document.querySelector("#projectForm")?.addEventListener("submit", createProject);
  document.querySelector("#projectDetailsForm")?.addEventListener("submit", updateProjectDetails);
  document.querySelector("#participantForm")?.addEventListener("submit", addParticipant);
  document.querySelector("#editProfileButton")?.addEventListener("click", () => {
    profileEditing = true;
    profileError = "";
    render();
  });
  document.querySelector("#cancelProfileEdit")?.addEventListener("click", () => {
    profileEditing = false;
    profileError = "";
    render();
  });
  document.querySelector("#showProjectForm")?.addEventListener("click", () => {
    projectFormVisible = true;
    render();
  });
  document.querySelector("#cancelProjectCreate")?.addEventListener("click", () => {
    projectFormVisible = false;
    render();
  });
  document.querySelector("#backToProjects")?.addEventListener("click", () => {
    selectedProjectId = null;
    selectedTab = "now";
    render();
  });
  document.querySelector("#startCreateProject")?.addEventListener("click", focusFirstSetupField);
  document.querySelector("#openDemoProject")?.addEventListener("click", createDemoProject);
  document.querySelector("#clearDataButton")?.addEventListener("click", clearAppData);
  document.querySelectorAll("[data-select-project]").forEach((button) => button.addEventListener("click", () => {
    selectedProjectId = button.dataset.selectProject;
    selectedTab = "now";
    projectFormVisible = false;
    render();
  }));

  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
    selectedTab = button.dataset.tab;
    render();
  }));

  document.querySelectorAll("[data-action-status]").forEach((select) => select.addEventListener("change", () => {
    updateActionStatus(select.dataset.actionStatus, select.value);
  }));

  document.querySelectorAll("[data-action-comment]").forEach((textarea) => textarea.addEventListener("change", () => {
    updateActionComment(textarea.dataset.actionComment, textarea.value);
  }));

  document.querySelectorAll("[data-action-done]").forEach((button) => button.addEventListener("click", () => {
    updateActionStatus(button.dataset.actionDone, "done");
  }));

  document.querySelectorAll("[data-participant-access]").forEach((select) => select.addEventListener("change", () => {
    updateParticipantAccess(select.dataset.participantAccess, select.value);
  }));

  document.querySelectorAll("[data-remove-participant]").forEach((button) => button.addEventListener("click", () => {
    removeParticipant(button.dataset.removeParticipant);
  }));

  document.querySelectorAll("[data-filter]").forEach((select) => select.addEventListener("change", () => {
    filters[select.dataset.filter] = select.value;
    render();
  }));
}

function saveProfile(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const lastName = data.get("lastName").trim();
  const firstName = data.get("firstName").trim();
  const role = data.get("role");

  if (!lastName || !firstName || !ROLE_OPTIONS.includes(role)) {
    profileError = "Заполните фамилию, имя и роль";
    render();
    return;
  }

  state.userProfile = {
    ...state.userProfile,
    lastName,
    firstName,
    role,
    updatedAt: new Date().toISOString(),
  };
  profileError = "";
  profileEditing = false;
  saveState();
  render();
}

function createProject(event) {
  event.preventDefault();
  if (!isProfileComplete(state.userProfile)) {
    profileError = "Заполните фамилию, имя и роль";
    profileEditing = true;
    render();
    return;
  }
  const data = new FormData(event.target);
  const now = new Date().toISOString();
  const ownerName = getUserFullName();
  const project = {
    id: makeId("project"),
    title: data.get("title").trim(),
    client: data.get("client").trim(),
    projectType: data.get("projectType").trim(),
    stage: data.get("stage"),
    startDate: data.get("startDate"),
    endDate: data.get("endDate"),
    ownerId: state.userProfile.id,
    participants: [{ id: makeId("participant"), name: ownerName, email: "", accessLevel: "editor" }],
    actionStatuses: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
  state.projects.unshift(project);
  selectedProjectId = project.id;
  projectFormVisible = false;
  saveState();
  render();
}

function updateProjectDetails(event) {
  event.preventDefault();
  const project = getSelectedProject();
  if (!project || !canEditProject(project)) return;
  const data = new FormData(event.target);
  project.title = data.get("title").trim();
  project.client = data.get("client").trim();
  project.projectType = data.get("projectType").trim();
  project.stage = data.get("stage");
  project.startDate = data.get("startDate");
  project.endDate = data.get("endDate");
  touchProject(project);
}

function createDemoProject() {
  const now = new Date().toISOString();
  const userId = "demo-user-veronika";
  const projectId = "demo-project-rrk-erp";

  state = {
    userProfile: {
      id: userId,
      lastName: "Потапова",
      firstName: "Вероника",
      role: "Руководитель проекта",
      createdAt: now,
      updatedAt: now,
    },
    projects: [
      {
        id: projectId,
        title: "РРК_Переход на 1С ERP",
        client: "Русская рыбная компания",
        projectType: "Внедрение",
        stage: "execution",
        startDate: "2024-11-01",
        endDate: "2026-12-31",
        ownerId: userId,
        participants: [
          { id: "demo-participant-veronika", name: "Потапова Вероника", email: "veronika@example.com", accessLevel: "editor" },
          { id: "demo-participant-admin", name: "Администратор проекта", email: "admin@example.com", accessLevel: "editor" },
          { id: "demo-participant-curator", name: "Куратор проекта", email: "curator@example.com", accessLevel: "viewer" },
        ],
        actionStatuses: [
          demoStatus("exec-update-budget", projectId, "in_progress", userId, "Проверить изменения по трудозатратам и поступлениям."),
          demoStatus("exec-update-project-plan-cup", projectId, "not_started", userId, ""),
          demoStatus("exec-timesheets", projectId, "not_started", userId, ""),
          demoStatus("exec-automonitoring", projectId, "not_started", userId, ""),
          demoStatus("exec-orp", projectId, "in_progress", userId, "Собрать риски и открытые вопросы перед согласованием."),
        ],
        comments: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
  selectedProjectId = projectId;
  selectedTab = "now";
  profileEditing = false;
  projectFormVisible = false;
  filters = { stage: "all", category: "all", frequencyType: "all", status: "all", priority: "all" };
  saveState();
  render();
}

function demoStatus(actionId, projectId, status, userId, comment) {
  return {
    actionId,
    projectId,
    status,
    completedAt: null,
    comment,
    updatedBy: userId,
  };
}

function clearAppData() {
  if (!confirm("Очистить профиль, проекты и демо-данные из localStorage?")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  selectedProjectId = null;
  selectedTab = "now";
  profileEditing = true;
  projectFormVisible = false;
  filters = { stage: "all", category: "all", frequencyType: "all", status: "all", priority: "all" };
  render();
}

function focusFirstSetupField() {
  projectFormVisible = true;
  if (!isProfileComplete(state.userProfile)) {
    profileEditing = true;
  }
  render();
  const target = isProfileComplete(state.userProfile) ? document.querySelector("#projectTitle") : document.querySelector("#profileLastName");
  target?.focus();
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function addParticipant(event) {
  event.preventDefault();
  const project = getSelectedProject();
  const data = new FormData(event.target);
  const name = data.get("name").trim();
  if (!project || !name || !canEditProject(project)) return;
  project.participants.push({ id: makeId("participant"), name, email: data.get("email").trim(), accessLevel: data.get("accessLevel") });
  touchProject(project);
}

function updateParticipantAccess(participantId, accessLevel) {
  const project = getSelectedProject();
  const participant = project?.participants.find((item) => item.id === participantId);
  if (!participant || !canEditProject(project)) return;
  participant.accessLevel = accessLevel;
  touchProject(project);
}

function removeParticipant(participantId) {
  const project = getSelectedProject();
  if (!project || !canEditProject(project)) return;
  project.participants = project.participants.filter((item) => item.id !== participantId);
  touchProject(project);
}

function updateActionStatus(actionId, status) {
  const project = getSelectedProject();
  if (!project || !canEditProject(project)) return;
  const item = ensureActionStatus(project, actionId);
  item.status = status;
  item.completedAt = status === "done" ? new Date().toISOString() : null;
  item.updatedBy = state.userProfile.id;
  touchProject(project);
}

function updateActionComment(actionId, comment) {
  const project = getSelectedProject();
  if (!project || !canEditProject(project)) return;
  const item = ensureActionStatus(project, actionId);
  item.comment = comment.trim();
  item.updatedBy = state.userProfile.id;
  if (item.comment) {
    project.comments.push({ id: makeId("comment"), actionId, projectId: project.id, authorName: getUserFullName() || "Пользователь", text: item.comment, createdAt: new Date().toISOString() });
  }
  touchProject(project);
}

function ensureActionStatus(project, actionId) {
  let item = project.actionStatuses.find((status) => status.projectId === project.id && status.actionId === actionId);
  if (!item) {
    item = { actionId, projectId: project.id, status: "not_started", completedAt: null, comment: "", updatedBy: state.userProfile.id };
    project.actionStatuses.push(item);
  }
  return item;
}

function getActionsForTab(project, tab) {
  if (tab === "now") return getNowActions(operationalActions, project, new Date());
  if (tab === "week") return getWeekActions(operationalActions, project, new Date());
  if (tab === "month") return getMonthActions(operationalActions, project, new Date());
  if (tab === "stage") return getStageActions(operationalActions, project);
  return getAllProcesses(operationalActions, project, filters);
}

function getNowActions(actions, project, today) {
  return sortActions(actions.filter((item) => item.stage === project.stage && isOpen(project, item.id) && (
    getEffectiveStatus(project, item.id) === "in_progress" ||
    (item.stage === project.stage && item.priority === "high" && item.frequencyType !== "monthly") ||
    item.weekday === getWeekday(today) ||
    isMonthRuleDueToday(item.monthRule, today) ||
    ["weekly", "biweekly"].includes(item.frequencyType)
  ))).slice(0, 7);
}

function getWeekActions(actions, project) {
  return sortActions(actions.filter((item) => item.stage === project.stage && isOpen(project, item.id) && (
    item.frequencyType === "weekly" ||
    item.frequencyType === "biweekly" ||
    (item.stage === project.stage && item.priority === "high" && ["once", "event"].includes(item.frequencyType))
  )));
}

function getMonthActions(actions, project) {
  return sortActions(actions.filter((item) => item.stage === project.stage && isOpen(project, item.id) && (
    item.frequencyType === "monthly" ||
    ["first_workday", "beginning_of_month", "end_of_month"].includes(item.monthRule) ||
    ["Мониторинг", "Подрядчики", "План-факт", "ОРП"].includes(item.category)
  )));
}

function getStageActions(actions, project) {
  return sortActions(actions.filter((item) => isOpen(project, item.id) && item.stage === project.stage && ["once", "event"].includes(item.frequencyType)));
}

function getAllProcesses(actions, project, activeFilters) {
  return sortActions(actions.filter((item) => {
    const status = getEffectiveStatus(project, item.id);
    return matches(item.stage, activeFilters.stage) &&
      matches(item.category, activeFilters.category) &&
      matches(item.frequencyType, activeFilters.frequencyType) &&
      matches(status, activeFilters.status) &&
      matches(item.priority, activeFilters.priority);
  }));
}

function getOpenActions(project) {
  return operationalActions.filter((item) => item.stage === project.stage && isOpen(project, item.id));
}

function getProjectProgress(project) {
  const visibleActions = operationalActions.filter((item) => item.defaultVisible && item.stage === project.stage);
  const done = visibleActions.filter((item) => getEffectiveStatus(project, item.id) === "done").length;
  const total = visibleActions.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

function getProjectKpis(project) {
  const stageActions = operationalActions.filter((item) => item.defaultVisible && item.stage === project.stage);
  return {
    open: stageActions.filter((item) => isOpen(project, item.id)).length,
    inProgress: stageActions.filter((item) => getEffectiveStatus(project, item.id) === "in_progress").length,
    done: stageActions.filter((item) => getEffectiveStatus(project, item.id) === "done").length,
  };
}

function getActionStatus(project, actionId) {
  return project.actionStatuses.find((item) => item.projectId === project.id && item.actionId === actionId);
}

function getEffectiveStatus(project, actionId) {
  return getActionStatus(project, actionId)?.status || "not_started";
}

function isOpen(project, actionId) {
  return ["not_started", "in_progress"].includes(getEffectiveStatus(project, actionId));
}

function sortActions(actions) {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...actions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.title.localeCompare(b.title, "ru"));
}

function isMonthRuleDueToday(monthRule, today) {
  if (!monthRule) return false;
  const day = today.getDate();
  if (monthRule === "first_workday" || monthRule === "beginning_of_month") return day <= 5;
  if (monthRule === "end_of_month") return day >= 25;
  return false;
}

function getWeekday(date) {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
}

function matches(value, filterValue) {
  return filterValue === "all" || value === filterValue;
}

function isFirstState() {
  return !isProfileComplete(state.userProfile) && state.projects.length === 0;
}

function getSelectedProject() {
  const project = state.projects.find((item) => item.id === selectedProjectId);
  return project && canAccessProject(project) ? project : null;
}

function getAccessibleProjects() {
  return state.projects.filter(canAccessProject);
}

function canAccessProject(project) {
  if (!project) {
    return false;
  }
  if (!isProfileComplete(state.userProfile)) {
    return false;
  }
  return project.ownerId === state.userProfile.id || Boolean(getCurrentParticipant(project));
}

function canEditProject(project) {
  if (!canAccessProject(project)) {
    return false;
  }
  if (project.ownerId === state.userProfile.id) {
    return true;
  }
  return getCurrentParticipant(project)?.accessLevel === "editor";
}

function getCurrentParticipant(project) {
  const currentName = normalizePersonName(getUserFullName());
  const legacyName = normalizePersonName(`${state.userProfile.firstName || ""} ${state.userProfile.lastName || ""}`);
  return project.participants.find((participant) => {
    const participantName = normalizePersonName(participant.name);
    return participantName === currentName || participantName === legacyName;
  });
}

function isProfileComplete(profile) {
  return Boolean(profile?.lastName?.trim() && profile?.firstName?.trim() && ROLE_OPTIONS.includes(profile?.role));
}

function getUserFullName() {
  const lastName = state.userProfile.lastName?.trim() || "";
  const firstName = state.userProfile.firstName?.trim() || "";
  return `${lastName} ${firstName}`.trim();
}

function normalizePersonName(name) {
  return String(name || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function touchProject(project) {
  project.updatedAt = new Date().toISOString();
  saveState();
  render();
}

function tabButton(tab, label) {
  return `<button class="tab ${selectedTab === tab ? "active" : ""}" data-tab="${tab}">${label}</button>`;
}

function meta(label, value) {
  return `<div class="meta"><span>${label}</span><strong>${escapeHtml(value || "Не указано")}</strong></div>`;
}

function kpi(label, value) {
  return `<div class="kpi"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderProgress(progress) {
  return `
    <div class="progress-wrap" style="margin-top: 14px;">
      <div class="row">
        <strong>${progress.done} из ${progress.total}</strong>
        <span class="muted">${progress.percent}% выполнения</span>
      </div>
      <div class="progress-bar"><span style="width: ${progress.percent}%"></span></div>
    </div>
  `;
}

function formatFrequency(item) {
  const parts = [FREQUENCY_LABELS[item.frequencyType] || item.frequencyType];
  if (item.weekday) parts.push(WEEKDAY_LABELS[item.weekday]);
  if (item.monthRule) parts.push(MONTH_RULE_LABELS[item.monthRule]);
  return parts.join(", ");
}

function formatDate(value) {
  if (!value) return "Не указано";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
