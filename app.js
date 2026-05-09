const STORAGE_KEY = "kaoyan_daily_task_v4";
const DAY = 24 * 60 * 60 * 1000;
const EXAM_DATE = "2026-12-19";
const UNKNOWN_REAPPEAR_AFTER = 5;
const KNOWN_INTERVALS_BY_TODAY_MISSES = [20, 10, 5, 3, 2, 1];
const PHRASE_INTERVALS_BY_TODAY_MISSES = [14, 7, 4, 2, 1];

const content = window.KAOYAN_CONTENT || { words: [], phrases: [] };
const writingPlan = window.KAOYAN_WRITING || { lessons: [] };
const grammarPlan = window.KAOYAN_GRAMMAR || { lessons: [] };
const examPlan = window.KAOYAN_EXAM || { truthStart: "2026-09-01", availableYears: [], blocks: [] };

const fallbackWords = [{
  id: "fallback-benefit",
  unit: 0,
  term: "benefit",
  ipa: "/'benefit/",
  pos: "n./v.",
  meaning: "益处；受益",
  exam: "常见搭配 benefit from, bring benefits to",
  sentence: "Daily review can benefit learners in the long run.",
  translation: "每日复习从长远看能让学习者受益。",
  memory: "今天先做到会读、会认、能在句子里理解。"
}];

const catalogWords = (content.words?.length ? content.words : fallbackWords)
  .map((word, index) => ({
    id: word.id || `word-${index}`,
    group: clean(word.group || "必考词"),
    unit: Number(word.unit || 0),
    term: clean(word.term),
    ipa: clean(word.ipa),
    pos: clean(word.pos),
    meaning: clean(word.meaning),
    exam: clean(word.exam),
    sentence: clean(word.sentence),
    translation: clean(word.translation),
    memory: clean(word.memory),
    source: clean(word.source)
  }))
  .filter((word) => word.term);

const catalogPhrases = (content.phrases || [])
  .map((phrase, index) => ({
    id: phrase.id || `phrase-${index}`,
    phrase: clean(phrase.phrase),
    meaning: clean(phrase.meaning),
    example: clean(phrase.example),
    translation: clean(phrase.translation),
    source: clean(phrase.source),
    examFrequency: Number(phrase.examFrequency || 0)
  }))
  .filter((phrase) => phrase.phrase);

const wordIndex = buildWordIndex(catalogWords);

const grammarLessons = grammarPlan.lessons?.length ? grammarPlan.lessons : [
  {
    topic: "第 1 课：主语、谓语、宾语是什么",
    sentence: "Daily review improves memory.",
    translation: "每日复习能提高记忆。",
    labels: ["主语：动作或状态的发出者", "谓语：句子的动作或状态", "宾语：动作影响的对象"],
    explanation: "主语就是“谁/什么”，谓语就是“做什么/是什么”，宾语就是动作影响的对象。本句 Daily review 是主语，improves 是谓语，memory 是宾语。",
    writing: "A improves B."
  },
  {
    topic: "第 2 课：主谓宾",
    sentence: "Repeated practice builds a useful habit.",
    translation: "反复练习能建立有用的习惯。",
    labels: ["主语：Repeated practice", "谓语：builds", "宾语：a useful habit"],
    explanation: "主谓宾是考研阅读里最常见的骨架。看到长句时，先把修饰拿开，保留“谁做什么”。",
    writing: "Repeated practice builds a useful habit."
  },
  {
    topic: "第 3 课：主系表",
    sentence: "A simple plan is more likely to last.",
    translation: "一个简单的计划更有可能坚持下去。",
    labels: ["主语：A simple plan", "系动词：is", "表语：more likely"],
    explanation: "主系表不是“做动作”，而是说明主语是什么或处于什么状态。is, are, become, seem 常见。",
    writing: "A clear goal is more likely to guide action."
  },
  {
    topic: "第 4 课：介词短语",
    sentence: "Words in real sentences are easier to remember.",
    translation: "真实句子里的单词更容易记住。",
    labels: ["主语：Words", "介词短语：in real sentences", "系动词：are"],
    explanation: "in real sentences 修饰 Words，告诉你是哪种单词。介词短语通常先括起来，不要让它干扰主干。",
    writing: "Knowledge in practice is easier to understand."
  },
  {
    topic: "第 5 课：并列结构",
    sentence: "Vocabulary and grammar support reading and writing.",
    translation: "词汇和语法支撑阅读和写作。",
    labels: ["and 连接并列主语", "support 是谓语", "reading and writing 是并列宾语"],
    explanation: "and 可以连接词、短语、句子。看到 and，先判断它连接的是同一层级的内容。",
    writing: "Vocabulary and grammar support better communication."
  },
  {
    topic: "第 6 课：to do 表目的",
    sentence: "You need a method to review words repeatedly.",
    translation: "你需要一种方法来反复复习单词。",
    labels: ["主语：You", "谓语：need", "目的：to review words repeatedly"],
    explanation: "to review 不是本句谓语，本句谓语是 need。to do 常常表示目的或用途。",
    writing: "We need a plan to improve efficiency."
  },
  {
    topic: "第 7 课：定语从句",
    sentence: "A task that fits your daily life is easier to finish.",
    translation: "适合你日常生活的任务更容易完成。",
    labels: ["A task 是被修饰的名词", "that fits your daily life 是定语从句", "主干：A task is easier"],
    explanation: "定语从句用来修饰名词。先看主干，再回头处理 that/which/who 后面的内容。",
    writing: "A habit that starts small is easier to keep."
  },
  {
    topic: "第 8 课：状语从句",
    sentence: "When a word appears often, it becomes easier to use.",
    translation: "当一个单词经常出现时，它就更容易被使用。",
    labels: ["When 引导时间状语从句", "主句：it becomes easier to use"],
    explanation: "状语从句通常交代时间、原因、条件、让步。主句才是核心信息。",
    writing: "When practice becomes regular, progress becomes visible."
  },
  {
    topic: "第 9 课：非谓语 doing",
    sentence: "Learning words in context reduces forgetting.",
    translation: "在语境中学习单词能减少遗忘。",
    labels: ["Learning words in context 作主语", "reduces 是谓语", "forgetting 是宾语"],
    explanation: "Learning 在这里不是正在进行，而是动名词作主语，相当于“学习这件事”。",
    writing: "Reading examples in context improves understanding."
  },
  {
    topic: "第 10 课：名词性从句",
    sentence: "What you repeat often becomes what you remember well.",
    translation: "你经常重复的东西，会变成你记得牢的东西。",
    labels: ["What you repeat often 作主语", "becomes 是谓语", "what you remember well 作表语"],
    explanation: "what 引导从句时，可以理解为“……的东西”。先找谓语 becomes，再看前后两个 what 从句。",
    writing: "What we practice often becomes what we can use."
  }
];

const writingLessons = writingPlan.lessons?.length ? writingPlan.lessons : [
  {
    title: "小作文：建议信",
    model: "I am writing to offer some practical suggestions concerning your study plan.",
    translation: "我写信是想就你的学习计划提供一些实用建议。",
    pattern: "I am writing to offer some practical suggestions concerning ...",
    structure: ["开头：说明写信目的", "主体：给出 2 条具体建议", "结尾：表达希望建议有帮助"],
    exercises: ["抄写模板句 1 遍。", "把 your study plan 换成 vocabulary learning。", "用今日单词写 1 条建议。"]
  },
  {
    title: "小作文：邀请信",
    model: "It would be a great pleasure for me if you could attend this activity.",
    translation: "如果你能参加这次活动，我将非常高兴。",
    pattern: "It would be a great pleasure for me if ...",
    structure: ["开头：发出邀请", "主体：交代时间、地点、内容", "结尾：期待回复"],
    exercises: ["抄写模板句。", "替换 this activity 为 a reading group。", "补一句活动内容。"]
  },
  {
    title: "大作文：图表描述",
    model: "The chart clearly shows a steady increase in the number of people who choose online learning.",
    translation: "该图表清楚显示选择在线学习的人数稳步上升。",
    pattern: "The chart clearly shows a steady increase/decrease in ...",
    structure: ["第一段：描述图表趋势", "第二段：分析原因", "第三段：总结或预测"],
    exercises: ["圈出 increase/decrease。", "把 online learning 换成 reading practice。", "写一句原因句：The main reason is that ..."]
  },
  {
    title: "大作文：原因分析",
    model: "As a result, learners can make steady progress.",
    translation: "因此，学习者可以取得稳定进步。",
    pattern: "As a result, ...",
    structure: ["先写原因", "再写结果", "最后回到主题"],
    exercises: ["先写一句 The main reason is that ...", "第二句用 As a result。", "用 progress, improve, benefit 等词收尾。"]
  }
];

const defaultSettings = {
  startDate: "2026-05-09",
  baseNewWords: 10,
  currentNewWords: 10,
  maxNewWords: 35,
  phraseCount: 2,
  studyStart: "07:10",
  studyEnd: "22:05",
  standStart: "09:50",
  standEnd: "18:50",
  penColor: "#1d2525",
  penSize: 3,
  deepSeekKey: "",
  deepSeekModel: "deepseek-v4-flash"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let state = loadState();
let activeDayKey = "";
let session = null;
let voices = [];
let deferredInstallPrompt = null;
let saveTimer = null;

init();

function init() {
  bindNavigation();
  bindActions();
  bindGlobalSpeechAndLookup();
  bindInstallPrompt();
  registerServiceWorker();
  loadVoices();
  window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
  renderAll();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn(error);
    }
  }
  return normalizeState({});
}

function normalizeState(next) {
  const settings = { ...defaultSettings, ...(next.settings || {}) };
  settings.baseNewWords = clamp(Number(settings.baseNewWords || 10), 5, 20);
  settings.currentNewWords = clamp(Number(settings.currentNewWords || settings.baseNewWords), 5, Number(settings.maxNewWords || 35));
  settings.maxNewWords = clamp(Number(settings.maxNewWords || 35), Math.max(10, settings.baseNewWords), 60);
  settings.phraseCount = clamp(Number(settings.phraseCount || 2), 1, 6);
  settings.studyStart = isTimeValue(settings.studyStart) ? settings.studyStart : "07:10";
  settings.studyEnd = isTimeValue(settings.studyEnd) ? settings.studyEnd : "22:05";
  settings.penSize = clamp(Number(settings.penSize || 3), 1, 12);
  settings.deepSeekModel = settings.deepSeekModel || "deepseek-v4-flash";
  settings.deepSeekKey = settings.deepSeekKey || "";
  return {
    settings,
    days: next.days || {},
    wordProgress: next.wordProgress || {},
    phraseProgress: next.phraseProgress || {},
    handwriting: next.handwriting || {},
    completedDates: next.completedDates || [],
    streak: Number(next.streak || 0)
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindNavigation() {
  $$(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.view;
      $$(".nav-button").forEach((item) => item.classList.toggle("active", item === button));
      $$(".view").forEach((view) => view.classList.toggle("active", view.id === target));
      renderAll();
    });
  });
}

function bindActions() {
  $("#backButton").addEventListener("click", closeStudy);
  $("#uploadProgressButton").addEventListener("click", simulateCloudUpload);
  ["startDateInput", "baseWordsInput", "currentWordsInput", "maxWordsInput", "phraseCountInput", "studyStartInput", "studyEndInput", "standStartInput", "standEndInput", "deepSeekKeyInput", "deepSeekModelInput"].forEach((id) => {
    const input = $(`#${id}`);
    input.addEventListener("change", saveSettingsFromInputs);
    input.addEventListener("input", debounce(saveSettingsFromInputs, 450));
  });
}

function bindGlobalSpeechAndLookup() {
  document.addEventListener("click", (event) => {
    const token = event.target.closest("[data-lookup]");
    if (token) {
      showWordPopover(token, event);
      return;
    }
    if (!event.target.closest("#wordPopover")) hidePopover();
  });

  document.addEventListener("click", (event) => {
    const node = event.target.closest("[data-speak]");
    if (!node) return;
    if (node.closest("[data-lookup]")) return;
    const text = node.dataset.speak || node.textContent;
    speak(text, node.dataset.lang || guessLang(text), node);
  });
}

function bindInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $("#installButton").classList.remove("hidden");
  });
  $("#installButton").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("#installButton").classList.add("hidden");
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function renderAll() {
  activeDayKey = getActiveDayKey();
  ensurePlan(activeDayKey);
  renderHeader();
  renderToday();
  renderStats();
  renderSettings();
}

function renderHeader() {
  const prefix = activeDayKey < todayKey() ? "补学" : "今天";
  $("#dateLabel").textContent = `${prefix} ${activeDayKey} · ${weekdayName(dateFromKey(activeDayKey))}`;
}

function renderToday() {
  const plan = getPlan();
  const stats = getTaskStats(plan);
  $("#progressPercent").textContent = `${Math.round(stats.rate * 100)}%`;
  $(".progress-ring").style.setProperty("--progress", `${Math.round(stats.rate * 360)}deg`);
  $("#countdownTop").textContent = getCountdownText();

  const lock = $("#lockBanner");
  if (activeDayKey < todayKey()) {
    lock.classList.remove("hidden");
    lock.textContent = `还有 ${activeDayKey} 的学习任务没有完成。补完后系统自动记录打卡。`;
  } else {
    lock.classList.add("hidden");
  }

  $("#todayTasks").innerHTML = plan.tasks.map(renderTaskCard).join("");
  $$(".task-card [data-start]").forEach((button) => {
    button.addEventListener("click", () => openSession(button.dataset.start));
  });

  $("#todayReminders").innerHTML = getReminderCards(dateFromKey(activeDayKey)).map((item) => `
    <article class="reminder-card">
      <div class="task-time">${escapeHtml(item.time)}</div>
      <div class="task-title">${escapeHtml(item.title)}</div>
      <div class="task-note">${escapeHtml(item.note)}</div>
    </article>
  `).join("");

  autoCompleteIfReady(plan);
}

function renderTaskCard(task) {
  const meta = task.meta?.length ? `<div class="task-meta">${task.meta.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}</div>` : "";
  return `
    <article class="task-card ${task.done ? "done" : ""}">
      <div class="task-row">
        <div class="task-main">
          <div class="task-time">${escapeHtml(task.time)}</div>
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${meta}
        </div>
        <button class="small-button" type="button" data-start="${escapeAttr(task.kind)}">${task.done ? "复习" : "开始"}</button>
      </div>
    </article>
  `;
}

function renderStats() {
  const wordStarted = Object.values(state.wordProgress).filter((item) => item.started).length;
  const wordMastered = Object.values(state.wordProgress).filter((item) => item.status === "mastered").length;
  const phraseStarted = Object.values(state.phraseProgress).filter((item) => item.started).length;
  const mistakes = Object.values(state.wordProgress).filter((item) => item.mistakes > 0 && item.status !== "mastered").length;
  const pending = Math.max(0, catalogWords.length - wordStarted);
  const daysLeft = Math.ceil(pending / Math.max(1, state.settings.currentNewWords));

  $("#statsGrid").innerHTML = [
    statCard("已学单词", wordStarted),
    statCard("已掌握", wordMastered),
    statCard("已学短语", phraseStarted),
    statCard("待学单词", pending),
    statCard("错词回炉", mistakes),
    statCard("自动打卡天数", state.completedDates.length)
  ].join("");

  $("#estimateLabel").textContent = `按当前速度还需约 ${daysLeft} 天`;

  const mistakeWords = Object.entries(state.wordProgress)
    .filter(([, progress]) => progress.mistakes > 0 && progress.status !== "mastered")
    .sort((a, b) => b[1].mistakes - a[1].mistakes)
    .slice(0, 12)
    .map(([id, progress]) => {
      const word = getWord(id);
      return `<button class="small-button" type="button" data-speak="${escapeAttr(word.term)}">${escapeHtml(word.term)} · ${progress.mistakes}次</button>`;
    });

  $("#mistakeWords").innerHTML = mistakeWords.length ? mistakeWords.join(" ") : `<p class="body-text">暂时没有错词。很好，先稳住节奏。</p>`;
  renderAllMemory();
}

function statCard(label, value) {
  return `<article class="stat-card"><strong>${escapeHtml(value)}</strong><span class="body-text">${escapeHtml(label)}</span></article>`;
}

function renderAllMemory() {
  const groups = new Map();
  catalogWords.forEach((word) => {
    const groupName = `${word.group || "词库"} U${word.unit || 0}`;
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(memoryRow(word.term, word.meaning, state.wordProgress[word.id] || {}, "词"));
  });

  const phraseRows = catalogPhrases.map((phrase) => memoryRow(phrase.phrase, phrase.meaning, state.phraseProgress[phrase.id] || {}, "短语"));
  const wordGroups = Array.from(groups.entries()).map(([name, rows], index) => `
    <details class="unit-group" ${index === 0 ? "open" : ""}>
      <summary>${escapeHtml(name)} · ${rows.length} 个</summary>
      <div class="unit-body">${rows.join("")}</div>
    </details>
  `);
  const phraseGroup = `
    <details class="unit-group">
      <summary>短语 · ${phraseRows.length} 个</summary>
      <div class="unit-body">${phraseRows.join("")}</div>
    </details>
  `;
  $("#allMemoryList").innerHTML = wordGroups.concat(phraseGroup).join("");
}

function memoryRow(term, meaning, progress, type) {
  const status = progress.status === "mastered" ? "已掌握" : progress.started ? `复习至 ${progress.dueDate || "待定"}` : "未开始";
  return `
    <article class="memory-row">
      <div>
        <strong data-speak="${escapeAttr(term)}">${escapeHtml(term)}</strong>
        <span class="body-text">${escapeHtml(type)} · ${escapeHtml(meaning || "释义待补充")}</span>
      </div>
      <span class="pill">${escapeHtml(status)}</span>
    </article>
  `;
}

function renderSettings() {
  $("#startDateInput").value = state.settings.startDate;
  $("#baseWordsInput").value = state.settings.baseNewWords;
  $("#currentWordsInput").value = state.settings.currentNewWords;
  $("#maxWordsInput").value = state.settings.maxNewWords;
  $("#phraseCountInput").value = state.settings.phraseCount;
  $("#studyStartInput").value = state.settings.studyStart;
  $("#studyEndInput").value = state.settings.studyEnd;
  $("#standStartInput").value = state.settings.standStart;
  $("#standEndInput").value = state.settings.standEnd;
  $("#deepSeekKeyInput").value = state.settings.deepSeekKey || "";
  $("#deepSeekModelInput").value = state.settings.deepSeekModel || "deepseek-v4-flash";
}

function ensurePlan(key) {
  if (state.days[key]) return;

  const date = dateFromKey(key);
  const weekend = isWeekend(date);
  const dueWordIds = getDueWordIds(key);
  const newWordIds = weekend ? [] : takeNewWords(state.settings.currentNewWords);
  const duePhraseIds = getDuePhraseIds(key);
  const newPhraseIds = takeNewPhrases(weekend ? 1 : state.settings.phraseCount);

  newWordIds.forEach((id) => startWord(id, key));
  newPhraseIds.forEach((id) => startPhrase(id, key));

  const wordIds = unique(dueWordIds.concat(newWordIds));
  const phraseIds = unique(duePhraseIds.concat(newPhraseIds));
  const truthTraining = getTruthTraining(key);
  const tasks = weekend ? weekendTasks(wordIds, phraseIds, key, truthTraining) : weekdayTasks(wordIds, phraseIds, key, truthTraining);

  state.days[key] = {
    key,
    completed: false,
    wordIds,
    phraseIds,
    lessonIndex: getLessonIndex(key),
    writingIndex: getWritingLessonIndex(key),
    truthTraining,
    tasks,
    logs: {}
  };
  saveState();
}

function rebuildActivePlan() {
  const key = activeDayKey || getActiveDayKey();
  const plan = state.days[key];
  if (!plan || plan.completed) return;

  releaseUnansweredNewItems(plan.wordIds || [], plan, state.wordProgress);
  releaseUnansweredNewItems(plan.phraseIds || [], plan, state.phraseProgress);
  delete state.days[key];
  activeDayKey = key;
  ensurePlan(key);
}

function releaseUnansweredNewItems(ids, plan, progressMap) {
  ids.forEach((id) => {
    const progress = progressMap[id];
    const hasAnswered = Boolean(plan.logs?.[id]);
    const wasIntroducedToday = progress?.introducedOn === plan.key || (!progress?.introducedOn && progress?.dueDate === plan.key && Number(progress?.reviewCount || 0) === 0);
    if (progress && !hasAnswered && wasIntroducedToday) {
      delete progressMap[id];
    }
  });
}

function weekdayTasks(wordIds, phraseIds, key, truthTraining) {
  const times = getStudySchedule(false);
  const tasks = [
    task(times.vocab, "单词复习", "先回忆，点屏幕后看释义、例句和翻译。认识就放远，不认识 5 个后回炉。", "vocab", [`${wordIds.length} 个`]),
    task(times.phrases, "短语练习", "短语和单词一样复习，例句带中文翻译，服务阅读和写作。", "phrases", [`${phraseIds.length} 个`]),
    task(times.grammar, "语法课", "先讲主语、谓语、宾语这些基础概念，再逐步进入长难句。", "grammar"),
    task(times.writing, isTruthWritingPhase(key) ? "真题写作" : "写作训练", isTruthWritingPhase(key) ? "9 月后按真题题干写完整小作文或大作文，再让 AI 批改结构、语法和用词。" : "按小作文类型和大作文题型学习：先拆段落，再练核心句，最后手写。", "writing"),
    task(times.review, "收尾复盘", "看今日错词、错短语和学习完成情况，系统自动打卡。", "review")
  ];
  if (truthTraining) {
    tasks.splice(3, 0, task(times.exam, "真题训练", `${truthTraining.year} 英语二：${truthTraining.title}。先做题，再让 AI 讲为什么选、为什么排除。`, "exam", [truthTraining.short]));
  }
  return tasks;
}

function weekendTasks(wordIds, phraseIds, key, truthTraining) {
  const times = getStudySchedule(true);
  const tasks = [
    task(times.vocab, "周末单词循环", "不新增大量新词，集中复习本周错词和到期词。", "vocab", [`${wordIds.length} 个`]),
    task(times.phrases, "短语复盘", "把短语放进例句和作文句里复习。", "phrases", [`${phraseIds.length} 个`]),
    task("15:00", "管综训练", "数学基础题 + 逻辑题型训练，整理错题。", "management"),
    task(times.grammar, "语法整合", "复盘本周语法，用本周词汇理解句子。", "grammar"),
    task(times.writing, isTruthWritingPhase(key) ? "真题写作复盘" : "写作训练", isTruthWritingPhase(key) ? "复盘本周真题写作，重写一篇最薄弱的作文。" : "手写一个小作文片段或大作文段落。", "writing"),
    task(times.review, "收尾复盘", "生成下周节奏，系统自动打卡。", "review")
  ];
  if (truthTraining) {
    tasks.splice(4, 0, task(times.exam, "真题板块复盘", `${truthTraining.year} 英语二：${truthTraining.title}。周末重点整理错因。`, "exam", [truthTraining.short]));
  }
  return tasks;
}

function getStudySchedule(weekend) {
  const start = state.settings.studyStart || (weekend ? "09:30" : "07:10");
  const end = state.settings.studyEnd || "22:05";
  return {
    vocab: start,
    phrases: addMinutesToTime(start, weekend ? 40 : 15),
    exam: addMinutesToTime(end, weekend ? -130 : -125),
    grammar: addMinutesToTime(end, weekend ? -85 : -95),
    writing: addMinutesToTime(end, -30),
    review: addMinutesToTime(end, -10)
  };
}

function task(time, title, note, kind, meta = []) {
  return { id: kind, time, title, note, kind, meta, done: false };
}

function getReminderCards(date) {
  const cards = [
    { time: "09:50-18:50", title: "上班站立", note: "每小时站立 2-3 分钟，接水、慢走、肩颈和髋部轻活动。" },
    { time: "20:10", title: "腰部友好锻炼", note: "散步、猫牛式、鸟狗式、臀桥、髋屈肌拉伸。只是提醒，不参与打卡。" }
  ];
  const key = formatDate(date);
  if (key < (examPlan.truthStart || "2026-09-01")) {
    cards.push({
      time: "9月1日",
      title: "真题阶段预告",
      note: "到 9 月 1 日自动加入真题训练：阅读1、阅读2、阅读3、阅读4、新题型、翻译、完形、写作。"
    });
  }
  if (isWeekend(date)) cards[0] = { time: "周末", title: "少久坐", note: "补学习也要每 50 分钟起身活动 2-3 分钟。" };
  return cards;
}

function getActiveDayKey() {
  const today = todayKey();
  const unfinished = Object.keys(state.days)
    .filter((key) => key < today && !state.days[key].completed)
    .sort()[0];
  return unfinished || today;
}

function getPlan() {
  return state.days[activeDayKey];
}

function getTaskStats(plan) {
  const total = plan.tasks.length;
  const done = plan.tasks.filter((item) => item.done).length;
  return { total, done, rate: total ? done / total : 0 };
}

function canCompletePlan(plan) {
  const required = plan.tasks.map((item) => item.kind);
  return required.every((kind) => plan.tasks.find((item) => item.kind === kind)?.done);
}

function autoCompleteIfReady(plan) {
  if (!plan.completed && canCompletePlan(plan)) {
    plan.completed = true;
    if (!state.completedDates.includes(plan.key)) state.completedDates.push(plan.key);
    updateTomorrowWordTarget(plan);
    saveState();
    toast("今日核心任务完成，已自动打卡。");
  }
}

function updateTomorrowWordTarget(plan) {
  const wordLogs = Object.values(plan.logs || {}).filter((log) => log.type === "word" && log.result === "known");
  if (!wordLogs.length) return;
  const lowMissCount = wordLogs.filter((log) => Number(log.misses || 0) === 0).length;
  const rate = lowMissCount / wordLogs.length;
  if (rate >= 0.8) {
    state.streak += 1;
    state.settings.currentNewWords = clamp(state.settings.currentNewWords + (state.streak % 3 === 0 ? 2 : 1), state.settings.baseNewWords, state.settings.maxNewWords);
  } else if (rate < 0.5) {
    state.streak = 0;
    state.settings.currentNewWords = clamp(state.settings.currentNewWords - 2, state.settings.baseNewWords, state.settings.maxNewWords);
  } else {
    state.streak = 0;
  }
}

function openSession(kind) {
  const plan = getPlan();
  if (kind === "vocab") {
    session = { kind, queue: [...plan.wordIds], index: 0, revealed: false, failCounts: {} };
  } else if (kind === "phrases") {
    session = { kind, queue: [...plan.phraseIds], index: 0, revealed: false, failCounts: {} };
  } else {
    session = { kind };
  }
  $("#studyScreen").classList.remove("hidden");
  renderSession();
}

function closeStudy() {
  $("#studyScreen").classList.add("hidden");
  session = null;
  renderAll();
}

function renderSession() {
  const plan = getPlan();
  if (session.kind === "vocab") return renderWordSession();
  if (session.kind === "phrases") return renderPhraseSession();
  if (session.kind === "grammar") return renderGrammarSession(plan);
  if (session.kind === "writing") return renderWritingSession(plan);
  if (session.kind === "exam") return renderExamSession(plan);
  if (session.kind === "management") return renderChecklistSession("管综训练", ["数学基础题 30-45 分钟", "逻辑题型训练 30-45 分钟", "整理错题和错因"], "management");
  if (session.kind === "review") return renderReviewSession(plan);
}

function renderWordSession() {
  $("#studyKicker").textContent = "单词复习";
  if (!session.queue.length || session.index >= session.queue.length) {
    markTaskDone("vocab");
    renderDone("这一组单词完成了。");
    return;
  }

  const id = session.queue[session.index];
  const word = getWord(id);
  $("#studyTitle").textContent = `剩余 ${Math.max(0, session.queue.length - session.index)} 个`;
  $("#studyBody").innerHTML = `
    <article class="momo-card">
      <div class="momo-top">
        <p class="tiny-label">先回忆发音和释义</p>
        <h2 data-speak="${escapeAttr(word.term)}">${escapeHtml(word.term)}</h2>
        <div class="speaker-line">
          <span>美</span>
          <span>${escapeHtml(word.ipa || "")}</span>
          <button class="small-button" type="button" data-speak="${escapeAttr(word.term)}">朗读</button>
        </div>
      </div>
      <button class="momo-middle" type="button" id="revealButton">
        ${session.revealed ? renderWordAnswer(word) : `<div class="tap-hint">请回忆单词发音和释义<br>点击屏幕显示答案</div>`}
      </button>
      <div class="momo-actions">
        <button class="answer-button known" type="button" data-result="known">认识</button>
        <button class="answer-button unknown" type="button" data-result="unknown">不认识</button>
      </div>
    </article>
  `;
  $("#revealButton").addEventListener("click", () => {
    session.revealed = true;
    renderSession();
  });
  $$("[data-result]").forEach((button) => {
    button.addEventListener("click", () => handleMemoryResult(id, button.dataset.result, "word"));
  });
}

function renderWordAnswer(word) {
  return `
    <div class="answer-panel">
      <h3>${escapeHtml(word.meaning || "释义待补充")}</h3>
      <p><strong>词性：</strong>${escapeHtml(word.pos || "待补充")}</p>
      <p><strong>考研高频考法：</strong>${renderLookupText(word.exam || "结合真题语境记忆。", word.term)}</p>
      <p><strong>例句：</strong>${renderLookupText(word.sentence || "", word.term)}</p>
      <p><strong>翻译：</strong>${escapeHtml(word.translation || "暂无中文翻译")}</p>
      <p><strong>助记：</strong>${escapeHtml(word.memory || "今天先做到会读、会认、能在句子里理解。")}</p>
    </div>
  `;
}

function renderPhraseSession() {
  $("#studyKicker").textContent = "短语练习";
  if (!session.queue.length || session.index >= session.queue.length) {
    markTaskDone("phrases");
    renderDone("这一组短语完成了。");
    return;
  }

  const id = session.queue[session.index];
  const phrase = getPhrase(id);
  $("#studyTitle").textContent = `剩余 ${Math.max(0, session.queue.length - session.index)} 个`;
  $("#studyBody").innerHTML = `
    <article class="momo-card">
      <div class="momo-top">
        <p class="tiny-label">先回忆中文和用法</p>
        <h2 data-speak="${escapeAttr(phrase.phrase)}">${escapeHtml(phrase.phrase)}</h2>
        <button class="small-button" type="button" data-speak="${escapeAttr(phrase.phrase)}">朗读</button>
      </div>
      <button class="momo-middle" type="button" id="revealButton">
        ${session.revealed ? renderPhraseAnswer(phrase) : `<div class="tap-hint">请回忆短语意思和例句<br>点击屏幕显示答案</div>`}
      </button>
      <div class="momo-actions">
        <button class="answer-button known" type="button" data-result="known">认识</button>
        <button class="answer-button unknown" type="button" data-result="unknown">不认识</button>
      </div>
    </article>
  `;
  $("#revealButton").addEventListener("click", () => {
    session.revealed = true;
    renderSession();
  });
  $$("[data-result]").forEach((button) => {
    button.addEventListener("click", () => handleMemoryResult(id, button.dataset.result, "phrase"));
  });
}

function renderPhraseAnswer(phrase) {
  return `
    <div class="answer-panel">
      <h3>${escapeHtml(phrase.meaning || "释义待补充")}</h3>
      ${phrase.examFrequency ? `<p><strong>真题频次：</strong>本地真题语料出现 ${phrase.examFrequency} 次</p>` : ""}
      <p><strong>例句：</strong>${renderLookupText(phrase.example || "", phrase.phrase)}</p>
      <p><strong>翻译：</strong>${escapeHtml(phrase.translation || "")}</p>
      <p><strong>写作迁移：</strong>今天写作里尽量把这个短语放进一个句子。</p>
    </div>
  `;
}

function handleMemoryResult(id, result, type) {
  if (result === "unknown") {
    session.failCounts[id] = Number(session.failCounts[id] || 0) + 1;
    const insertAt = Math.min(session.index + UNKNOWN_REAPPEAR_AFTER + 1, session.queue.length);
    session.queue.splice(insertAt, 0, id);
    session.index += 1;
    session.revealed = false;
    renderSession();
    return;
  }

  const misses = Number(session.failCounts[id] || 0);
  if (type === "word") markWordKnown(id, misses);
  if (type === "phrase") markPhraseKnown(id, misses);
  session.queue = session.queue.filter((item, index) => index <= session.index || item !== id);
  session.index += 1;
  session.revealed = false;
  renderSession();
}

function markWordKnown(id, misses) {
  const progress = state.wordProgress[id] || startWord(id, activeDayKey);
  progress.started = true;
  progress.reviewCount = Number(progress.reviewCount || 0) + 1;
  progress.mistakes = Number(progress.mistakes || 0) + misses;
  progress.lastResult = misses ? "learned_after_unknown" : "known";
  progress.status = misses ? "learning" : "stable";
  progress.dueDate = addDaysKey(dateFromKey(activeDayKey), intervalForMisses(misses, KNOWN_INTERVALS_BY_TODAY_MISSES));
  getPlan().logs[id] = { type: "word", result: "known", misses, at: new Date().toISOString() };
  saveState();
}

function markPhraseKnown(id, misses) {
  const progress = state.phraseProgress[id] || startPhrase(id, activeDayKey);
  progress.started = true;
  progress.reviewCount = Number(progress.reviewCount || 0) + 1;
  progress.mistakes = Number(progress.mistakes || 0) + misses;
  progress.lastResult = misses ? "learned_after_unknown" : "known";
  progress.status = misses ? "learning" : "stable";
  progress.dueDate = addDaysKey(dateFromKey(activeDayKey), intervalForMisses(misses, PHRASE_INTERVALS_BY_TODAY_MISSES));
  getPlan().logs[id] = { type: "phrase", result: "known", misses, at: new Date().toISOString() };
  saveState();
}

function renderGrammarSession(plan) {
  const lesson = grammarLessons[plan.lessonIndex % grammarLessons.length];
  $("#studyKicker").textContent = lesson.topic;
  $("#studyTitle").textContent = "真题语法课";
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <p class="tiny-label">英文句子，点击任意单词可查义和朗读</p>
      <p class="lesson-sentence">${renderLookupText(lesson.sentence)}</p>
      <p class="body-text"><strong>中文翻译：</strong>${escapeHtml(lesson.translation)}</p>
      <div class="tag-list">${lesson.labels.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("")}</div>
      <p class="body-text">${escapeHtml(lesson.explanation)}</p>
      <p class="body-text"><strong>写作迁移：</strong>${renderLookupText(lesson.writing)}</p>
    </article>
    ${canvasPanel("grammar", "手写拆句和翻译")}
  `;
  setupCanvas("grammar");
}

function renderWritingSession(plan) {
  const lesson = writingLessons[plan.writingIndex % writingLessons.length];
  const words = plan.wordIds.slice(0, 5).map(getWord);
  const phrases = plan.phraseIds.slice(0, 3).map(getPhrase);
  $("#studyKicker").textContent = lesson.title;
  $("#studyTitle").textContent = lesson.phase === "truth" ? "真题写作整篇训练" : `${lesson.type || "写作"}：${lesson.subtype || "结构课"}`;
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <p class="tiny-label">${lesson.phase === "truth" ? "9 月后按真题题干整篇训练" : "先判断类型，再拆段落，最后写句子"}</p>
      <p class="lesson-sentence">${renderLookupText(lesson.model)}</p>
      <p class="body-text"><strong>中文：</strong>${escapeHtml(lesson.translation)}</p>
      <p class="body-text"><strong>句型：</strong>${escapeHtml(lesson.pattern)}</p>
      <div class="writing-steps">
        <div class="writing-step"><strong>作文结构</strong><p class="body-text">${lesson.structure.map(escapeHtml).join(" → ")}</p></div>
        ${(lesson.paragraphBreakdown || []).map((step, index) => `<div class="writing-step"><strong>段落 ${index + 1}</strong><p class="body-text">${escapeHtml(step)}</p></div>`).join("")}
        ${lesson.exercises.map((step, index) => `<div class="writing-step"><strong>练习 ${index + 1}</strong><p class="body-text">${escapeHtml(step)}</p></div>`).join("")}
      </div>
      <p class="body-text"><strong>今日素材：</strong>${words.map((word) => `<span class="speakable" data-speak="${escapeAttr(word.term)}">${escapeHtml(word.term)}</span>`).join("、")} ${phrases.map((phrase) => `<span class="speakable" data-speak="${escapeAttr(phrase.phrase)}">${escapeHtml(phrase.phrase)}</span>`).join("、")}</p>
      <button id="deepSeekButton" class="small-button" type="button">用 DeepSeek 生成今日写作练习</button>
      <div id="deepSeekOutput" class="body-text"></div>
    </article>
    ${canvasPanel("writing", "手写作文句")}
  `;
  $("#deepSeekButton").addEventListener("click", () => generateDeepSeekWriting(lesson, words, phrases));
  setupCanvas("writing");
}

function renderExamSession(plan) {
  const training = plan.truthTraining || getTruthTraining(plan.key);
  if (!training) {
    renderChecklistSession("真题训练", ["9 月后自动开启真题板块训练。"], "exam");
    return;
  }
  $("#studyKicker").textContent = `${training.year} 英语二`;
  $("#studyTitle").textContent = training.title;
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <p class="tiny-label">真题板块训练：先做题，再讲原因</p>
      <p class="lesson-sentence">${escapeHtml(training.goal)}</p>
      <div class="writing-steps">
        ${training.steps.map((step, index) => `<div class="writing-step"><strong>步骤 ${index + 1}</strong><p class="body-text">${escapeHtml(step)}</p></div>`).join("")}
      </div>
      <p class="body-text"><strong>AI 讲解提示：</strong>${escapeHtml(training.aiPrompt)}</p>
      <button id="deepSeekExamButton" class="small-button" type="button">用 DeepSeek 生成讲解提纲</button>
      <div id="deepSeekOutput" class="body-text"></div>
    </article>
    ${canvasPanel("exam", "记录定位句、错因和AI讲解")}
  `;
  $("#deepSeekExamButton").addEventListener("click", () => generateDeepSeekExam(training));
  setupCanvas("exam");
}

function canvasPanel(kind, title) {
  const colors = ["#1d2525", "#258681", "#d76545", "#2f5ea8"];
  return `
    <article class="canvas-panel">
      <div class="canvas-toolbar">
        ${colors.map((color) => `<button class="color-dot ${state.settings.penColor === color ? "active" : ""}" type="button" style="background:${color}" data-pen-color="${color}" aria-label="笔色"></button>`).join("")}
        <input class="range-control" type="range" min="1" max="12" value="${state.settings.penSize}" data-pen-size />
        <button class="small-button" type="button" data-eraser>橡皮</button>
        <button class="small-button" type="button" data-canvas-clear>清空</button>
      </div>
      <p class="tiny-label">${escapeHtml(title)}：自动保存，支持手指和 Apple Pencil / 触控笔</p>
      <canvas id="${kind}Canvas" class="hand-canvas"></canvas>
    </article>
  `;
}

function setupCanvas(kind) {
  const canvas = $(`#${kind}Canvas`);
  const context = canvas.getContext("2d");
  const key = `${activeDayKey}-${kind}`;
  let drawing = false;
  let last = null;
  let eraser = false;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    const saved = state.handwriting[key];
    if (saved) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
      image.src = saved;
    }
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function applyPen() {
    context.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    context.strokeStyle = state.settings.penColor;
    context.lineWidth = eraser ? Math.max(12, state.settings.penSize * 3) : state.settings.penSize;
  }

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    last = point(event);
    applyPen();
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const next = point(event);
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    last = next;
  });
  canvas.addEventListener("pointerup", () => {
    drawing = false;
    last = null;
    state.handwriting[key] = canvas.toDataURL("image/png");
    markTaskDone(kind);
    saveState();
  });

  $$("[data-pen-color]").forEach((button) => {
    button.addEventListener("click", () => {
      eraser = false;
      state.settings.penColor = button.dataset.penColor;
      saveState();
      $$(".color-dot").forEach((item) => item.classList.toggle("active", item === button));
    });
  });
  $("[data-pen-size]").addEventListener("input", (event) => {
    state.settings.penSize = Number(event.target.value);
    saveState();
  });
  $("[data-eraser]").addEventListener("click", () => {
    eraser = !eraser;
    toast(eraser ? "橡皮已开启。" : "已切回笔。");
  });
  $("[data-canvas-clear]").addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    delete state.handwriting[key];
    saveState();
  });
  resize();
}

function renderChecklistSession(title, items, taskKind) {
  $("#studyKicker").textContent = "今日事项";
  $("#studyTitle").textContent = title;
  $("#studyBody").innerHTML = `
    <div class="exercise-list">
      ${items.map((item) => `
        <label class="check-item">
          <input type="checkbox" />
          <span>${escapeHtml(item)}</span>
        </label>
      `).join("")}
    </div>
    <button id="finishChecklistButton" class="primary-button" type="button">完成这一项</button>
  `;
  $("#finishChecklistButton").addEventListener("click", () => {
    markTaskDone(taskKind);
    closeStudy();
  });
}

function renderReviewSession(plan) {
  $("#studyKicker").textContent = "收尾复盘";
  $("#studyTitle").textContent = "今日状态";
  const wrongWords = Object.entries(plan.logs || {})
    .filter(([, log]) => log.type === "word" && Number(log.misses || 0) > 0)
    .map(([id]) => getWord(id).term);
  const wrongPhrases = Object.entries(plan.logs || {})
    .filter(([, log]) => log.type === "phrase" && Number(log.misses || 0) > 0)
    .map(([id]) => getPhrase(id).phrase);
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <p class="body-text"><strong>今日回炉单词：</strong>${wrongWords.length ? wrongWords.map((word) => `<span class="speakable" data-speak="${escapeAttr(word)}">${escapeHtml(word)}</span>`).join("、") : "暂无"}</p>
      <p class="body-text"><strong>今日回炉短语：</strong>${wrongPhrases.length ? wrongPhrases.map((phrase) => `<span class="speakable" data-speak="${escapeAttr(phrase)}">${escapeHtml(phrase)}</span>`).join("、") : "暂无"}</p>
      <p class="body-text">错过的内容已经按你的记忆表现重新安排复习时间。</p>
    </article>
    <button id="finishReviewButton" class="primary-button" type="button">确认复盘</button>
  `;
  $("#finishReviewButton").addEventListener("click", () => {
    markTaskDone("review");
    closeStudy();
  });
}

function renderDone(message) {
  $("#studyTitle").textContent = "完成";
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <h3>完成</h3>
      <p class="body-text">${escapeHtml(message)}</p>
      <button id="doneBackButton" class="primary-button" type="button">返回今日</button>
    </article>
  `;
  $("#doneBackButton").addEventListener("click", closeStudy);
}

function markTaskDone(kind) {
  const plan = getPlan();
  const item = plan.tasks.find((taskItem) => taskItem.kind === kind);
  if (item) item.done = true;
  autoCompleteIfReady(plan);
  saveState();
}

function startWord(id, key) {
  state.wordProgress[id] = {
    ...(state.wordProgress[id] || {}),
    started: true,
    introducedOn: state.wordProgress[id]?.introducedOn || key,
    dueDate: state.wordProgress[id]?.dueDate || key,
    status: state.wordProgress[id]?.status || "learning",
    mistakes: Number(state.wordProgress[id]?.mistakes || 0),
    reviewCount: Number(state.wordProgress[id]?.reviewCount || 0)
  };
  return state.wordProgress[id];
}

function startPhrase(id, key) {
  state.phraseProgress[id] = {
    ...(state.phraseProgress[id] || {}),
    started: true,
    introducedOn: state.phraseProgress[id]?.introducedOn || key,
    dueDate: state.phraseProgress[id]?.dueDate || key,
    status: state.phraseProgress[id]?.status || "learning",
    mistakes: Number(state.phraseProgress[id]?.mistakes || 0),
    reviewCount: Number(state.phraseProgress[id]?.reviewCount || 0)
  };
  return state.phraseProgress[id];
}

function takeNewWords(count) {
  return catalogWords.filter((word) => !state.wordProgress[word.id]?.started).slice(0, count).map((word) => word.id);
}

function takeNewPhrases(count) {
  return catalogPhrases.filter((phrase) => !state.phraseProgress[phrase.id]?.started).slice(0, count).map((phrase) => phrase.id);
}

function getDueWordIds(key) {
  return Object.entries(state.wordProgress)
    .filter(([, progress]) => progress.started && progress.status !== "mastered" && progress.dueDate && progress.dueDate <= key)
    .map(([id]) => id);
}

function getDuePhraseIds(key) {
  return Object.entries(state.phraseProgress)
    .filter(([, progress]) => progress.started && progress.status !== "mastered" && progress.dueDate && progress.dueDate <= key)
    .map(([id]) => id);
}

function getWord(id) {
  return catalogWords.find((word) => word.id === id) || fallbackWords[0];
}

function getPhrase(id) {
  return catalogPhrases.find((phrase) => phrase.id === id) || {
    id: "fallback-phrase",
    phrase: "focus on",
    meaning: "集中于",
    example: "Tonight we focus on one sentence.",
    translation: "今晚我们专注一个句子。"
  };
}

function getLessonIndex(key) {
  return Math.max(0, Math.floor((dateFromKey(key) - dateFromKey(state.settings.startDate)) / DAY));
}

function getWritingLessonIndex(key) {
  const targetPhase = isTruthWritingPhase(key) ? "truth" : "foundation";
  const lessons = writingLessons.filter((lesson) => !lesson.phase || lesson.phase === targetPhase);
  const phaseStart = targetPhase === "truth" ? getTruthStartKey() : state.settings.startDate;
  const index = Math.max(0, Math.floor((dateFromKey(key) - dateFromKey(phaseStart)) / DAY));
  if (!lessons.length) return getLessonIndex(key);
  const lesson = lessons[index % lessons.length];
  return writingLessons.indexOf(lesson);
}

function getTruthStartKey() {
  return writingPlan.truthStart || examPlan.truthStart || "2026-09-01";
}

function isTruthWritingPhase(key) {
  return key >= getTruthStartKey();
}

function getTruthTraining(key) {
  if (key < (examPlan.truthStart || "2026-09-01")) return null;
  const blocks = examPlan.blocks || [];
  const years = examPlan.availableYears || [];
  if (!blocks.length || !years.length) return null;
  const index = Math.max(0, Math.floor((dateFromKey(key) - dateFromKey(examPlan.truthStart || "2026-09-01")) / DAY));
  const block = blocks[index % blocks.length];
  const year = years[Math.floor(index / blocks.length) % years.length];
  return { ...block, year };
}

function saveSettingsFromInputs() {
  const keepEditing = Boolean(document.activeElement?.closest("#settingsView input, #settingsView textarea"));
  const before = JSON.stringify({
    startDate: state.settings.startDate,
    currentNewWords: state.settings.currentNewWords,
    phraseCount: state.settings.phraseCount,
    studyStart: state.settings.studyStart,
    studyEnd: state.settings.studyEnd
  });
  const base = clamp(Number($("#baseWordsInput").value), 5, 20);
  const max = clamp(Number($("#maxWordsInput").value), Math.max(10, base), 60);
  state.settings = {
    ...state.settings,
    startDate: $("#startDateInput").value || state.settings.startDate,
    baseNewWords: base,
    currentNewWords: clamp(Number($("#currentWordsInput").value || base), 5, max),
    maxNewWords: max,
    phraseCount: clamp(Number($("#phraseCountInput").value), 1, 6),
    studyStart: isTimeValue($("#studyStartInput").value) ? $("#studyStartInput").value : "07:10",
    studyEnd: isTimeValue($("#studyEndInput").value) ? $("#studyEndInput").value : "22:05",
    standStart: $("#standStartInput").value || "09:50",
    standEnd: $("#standEndInput").value || "18:50",
    deepSeekKey: $("#deepSeekKeyInput").value.trim(),
    deepSeekModel: $("#deepSeekModelInput").value.trim() || "deepseek-v4-flash"
  };
  const after = JSON.stringify({
    startDate: state.settings.startDate,
    currentNewWords: state.settings.currentNewWords,
    phraseCount: state.settings.phraseCount,
    studyStart: state.settings.studyStart,
    studyEnd: state.settings.studyEnd
  });
  if (before !== after) rebuildActivePlan();
  saveState();
  if (keepEditing) {
    activeDayKey = getActiveDayKey();
    ensurePlan(activeDayKey);
    renderHeader();
    renderToday();
    renderStats();
  } else {
    renderAll();
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => toast("设置已自动保存。"), 250);
}

function exportData() {
  setUploadProgress("正在生成本地备份", 35);
  $("#backupBox").value = JSON.stringify(state, null, 2);
  setUploadProgress("备份已生成，可复制或上传到云端", 100);
  toast("备份已生成。");
}

function importData() {
  try {
    setUploadProgress("正在读取备份", 45);
    state = normalizeState(JSON.parse($("#backupBox").value));
    saveState();
    setUploadProgress("导入完成，学习进度已恢复", 100);
    renderAll();
    toast("备份已导入。");
  } catch (error) {
    setUploadProgress("导入失败，请检查备份内容", 0);
    toast("备份格式不正确。");
  }
}

function simulateCloudUpload() {
  const steps = [
    ["准备进度", 12],
    ["上传学习记录", 38],
    ["上传单词记忆", 66],
    ["上传完成", 100]
  ];
  steps.forEach(([label, value], index) => {
    window.setTimeout(() => setUploadProgress(label, value), index * 260);
  });
  window.setTimeout(() => toast("进度已准备上传。接入云端后会同步到手机和 iPad。"), steps.length * 260);
}

function setUploadProgress(label, percent) {
  const labelNode = $("#uploadProgressLabel");
  const textNode = $("#uploadProgressText");
  const fillNode = $("#uploadProgressFill");
  if (!labelNode || !textNode || !fillNode) return;
  const value = clamp(percent, 0, 100);
  labelNode.textContent = label;
  textNode.textContent = `${value}%`;
  fillNode.style.width = `${value}%`;
}

function downloadIcs() {
  const ics = buildIcs();
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kaoyan-apple-watch-reminders.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("已导出 Apple 日历提醒。");
}

async function generateDeepSeekWriting(lesson, words, phrases) {
  const output = $("#deepSeekOutput");
  if (!state.settings.deepSeekKey) {
    output.textContent = "还没有填写 DeepSeek API Key。先到设置里填 Key；浏览器直连可能遇到 CORS，正式版建议走后端代理。";
    return;
  }

  output.textContent = "正在生成...";
  const prompt = [
    "你是考研英语二写作老师。请基于以下作文训练主题，给零基础学生生成今天的练习。",
    `主题：${lesson.title}`,
    `类型：${lesson.type || ""} ${lesson.subtype || ""}`,
    `句型：${lesson.pattern}`,
    `段落结构：${(lesson.structure || []).join(" / ")}`,
    `今日单词：${words.map((word) => word.term).join(", ")}`,
    `今日短语：${phrases.map((phrase) => phrase.phrase).join(", ")}`,
    "要求：中文讲解。基础阶段按“判断类型-拆段落-仿写句子”给练习；9月后按真题整篇写作给审题、提纲、成文和批改步骤。"
  ].join("\n");

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.settings.deepSeekKey}`
      },
      body: JSON.stringify({
        model: state.settings.deepSeekModel || "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        thinking: { type: "disabled" }
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    output.textContent = data.choices?.[0]?.message?.content || "没有返回内容。";
  } catch (error) {
    output.textContent = `生成失败：${error.message}。如果是浏览器跨域限制，需要加一个本地/云端代理服务。`;
  }
}

async function generateDeepSeekExam(training) {
  const output = $("#deepSeekOutput");
  if (!state.settings.deepSeekKey) {
    output.textContent = "还没有填写 DeepSeek API Key。先到设置里填 Key；浏览器直连可能遇到 CORS，正式版建议走后端代理。";
    return;
  }

  output.textContent = "正在生成...";
  const prompt = [
    "你是考研英语二真题老师。请给基础薄弱学生生成真题讲解提纲。",
    `年份：${training.year} 英语二`,
    `板块：${training.title}`,
    `训练目标：${training.goal}`,
    `讲解要求：${training.aiPrompt}`,
    "输出格式：1. 做题顺序；2. 每题怎么定位；3. 正确选项为什么对；4. 错误选项常见陷阱；5. 今日需要积累的词和短语；6. 复盘问题。"
  ].join("\n");

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.settings.deepSeekKey}`
      },
      body: JSON.stringify({
        model: state.settings.deepSeekModel || "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        thinking: { type: "disabled" }
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    output.textContent = data.choices?.[0]?.message?.content || "没有返回内容。";
  } catch (error) {
    output.textContent = `生成失败：${error.message}。如果是浏览器跨域限制，需要加一个本地/云端代理服务。`;
  }
}

function buildIcs() {
  const start = dateFromKey(state.settings.startDate);
  const until = "20261219T155900Z";
  const events = [
    makeEvent("morning-vocab", "考研单词复习", "先回忆，再看释义和例句。", nextDateAt(start, "07:10"), 20, "FREQ=DAILY;UNTIL=" + until),
    makeEvent("evening-exercise", "腰部友好锻炼", "先活动 20 分钟，再进入晚间学习。", nextDateAt(start, "20:10"), 20, "FREQ=DAILY;UNTIL=" + until),
    makeEvent("evening-study", "考研晚间学习", "语法课、写作训练、收尾复盘。", nextDateAt(start, "20:30"), 90, "FREQ=DAILY;UNTIL=" + until),
    makeEvent("work-stand", "站立 2-3 分钟", "接水、慢走、肩颈放松；腰不舒服时不做弯腰拉伸。", nextWeekdayAt(start, state.settings.standStart), 3, "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9,10,11,12,13,14,15,16,17,18;BYMINUTE=50;BYSECOND=0;UNTIL=" + until)
  ];
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kaoyan Daily Task//CN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

function makeEvent(id, summary, description, start, minutes, rrule) {
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  return [
    "BEGIN:VEVENT",
    `UID:${id}@kaoyan-daily-task`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsLocal(start)}`,
    `DTEND:${toIcsLocal(end)}`,
    `RRULE:${rrule}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT0M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(summary)}`,
    "END:VALARM",
    "END:VEVENT"
  ].join("\r\n");
}

function renderLookupText(text, highlight = "", alreadyHtml = false) {
  const source = alreadyHtml ? text : escapeHtml(text || "");
  return source.replace(/([A-Za-z][A-Za-z'-]*)/g, (match) => {
    const lower = match.toLowerCase();
    const lookupMatch = findLookupMatch(lower);
    const lookup = lookupMatch ? lookupMatch.word.term.toLowerCase() : lower;
    const className = lower === highlight.toLowerCase() ? "token-word highlight-term" : "token-word";
    const suffixAttrs = lookupMatch?.suffix
      ? ` data-root="${escapeAttr(lookupMatch.word.term)}" data-suffix="${escapeAttr(lookupMatch.suffix)}"`
      : "";
    return `<span class="${className}" data-lookup="${escapeAttr(lookup)}" data-speak="${escapeAttr(match)}"${suffixAttrs}>${match}</span>`;
  });
}

function buildWordIndex(words) {
  const index = new Map();
  words.forEach((word) => {
    lookupCandidates(word.term).forEach((candidate) => {
      if (candidate?.term && !index.has(candidate.term)) index.set(candidate.term, word);
    });
  });
  return index;
}

function findLookupWord(value) {
  return findLookupMatch(value)?.word || null;
}

function findLookupMatch(value) {
  let exactSupplement = null;
  for (const candidate of lookupCandidates(value)) {
    const hit = wordIndex.get(candidate.term);
    if (!hit) continue;
    if (!candidate.suffix && hit.group !== "资料补充词") return { word: hit, suffix: "", original: candidate.original };
    if (!candidate.suffix) {
      exactSupplement = { word: hit, suffix: "", original: candidate.original };
      continue;
    }
    return { word: hit, suffix: candidate.suffix, original: candidate.original };
  }
  return exactSupplement;
}

function lookupCandidates(value) {
  const key = cleanLookupKey(value);
  if (!key) return [];
  const candidates = [];
  const seen = new Set();
  const addCandidate = (term, suffix = "") => {
    const cleanTerm = cleanLookupKey(term);
    if (!cleanTerm || seen.has(cleanTerm)) return;
    seen.add(cleanTerm);
    candidates.push({ term: cleanTerm, suffix, original: key });
  };
  addCandidate(key);
  const irregular = {
    am: "be",
    is: "be",
    are: "be",
    was: "be",
    were: "be",
    been: "be",
    being: "be",
    did: "do",
    done: "do",
    does: "do",
    doing: "do",
    had: "have",
    has: "have",
    having: "have",
    went: "go",
    gone: "go",
    goes: "go",
    made: "make",
    making: "make",
    took: "take",
    taken: "take",
    gave: "give",
    given: "give",
    wrote: "write",
    written: "write",
    writing: "write",
    read: "read",
    bought: "buy",
    brought: "bring",
    thought: "think",
    taught: "teach",
    found: "find",
    felt: "feel",
    built: "build",
    kept: "keep",
    held: "hold",
    known: "know",
    knew: "know",
    seen: "see",
    saw: "see",
    children: "child",
    people: "person",
    men: "man",
    women: "woman",
    better: "good",
    best: "good",
    worse: "bad",
    worst: "bad"
  };

  if (irregular[key]) addCandidate(irregular[key], "不规则变化");
  if (key.endsWith("'s")) addCandidate(key.slice(0, -2), "所有格/三单 -'s");
  if (key.endsWith("ies") && key.length > 4) addCandidate(`${key.slice(0, -3)}y`, "复数/三单 -ies");
  if (key.endsWith("ves") && key.length > 4) {
    addCandidate(`${key.slice(0, -3)}f`, "复数 -ves");
    addCandidate(`${key.slice(0, -3)}fe`, "复数 -ves");
  }
  if (key.endsWith("es") && key.length > 3) addCandidate(key.slice(0, -2), "复数/三单 -es");
  if (key.endsWith("s") && key.length > 3) addCandidate(key.slice(0, -1), "复数/三单 -s");
  if (key.endsWith("ied") && key.length > 4) addCandidate(`${key.slice(0, -3)}y`, "过去式/过去分词 -ied");
  if (key.endsWith("ed") && key.length > 4) {
    addCandidate(key.slice(0, -2), "过去式/过去分词 -ed");
    addCandidate(key.slice(0, -1), "过去式/过去分词 -ed");
    if (/([a-z])\1ed$/.test(key)) addCandidate(key.slice(0, -3), "双写尾字母 + -ed");
  }
  if (key.endsWith("ing") && key.length > 5) {
    addCandidate(key.slice(0, -3), "现在分词/动名词 -ing");
    addCandidate(`${key.slice(0, -3)}e`, "去 e + -ing");
    if (/([a-z])\1ing$/.test(key)) addCandidate(key.slice(0, -4), "双写尾字母 + -ing");
  }
  if (key.endsWith("er") && key.length > 4) {
    addCandidate(key.slice(0, -2), "比较级/名词后缀 -er");
    addCandidate(key.slice(0, -1), "比较级/名词后缀 -er");
  }
  if (key.endsWith("est") && key.length > 5) {
    addCandidate(key.slice(0, -3), "最高级 -est");
    addCandidate(key.slice(0, -2), "最高级 -est");
  }
  [
    ["ation", "派生后缀 -ation", "e"],
    ["tion", "派生后缀 -tion", "e"],
    ["sion", "派生后缀 -sion", "d"],
    ["ment", "派生后缀 -ment", ""],
    ["ness", "派生后缀 -ness", ""],
    ["ity", "派生后缀 -ity", "e"],
    ["ly", "副词后缀 -ly", ""],
    ["ful", "形容词后缀 -ful", ""],
    ["less", "形容词后缀 -less", ""],
    ["able", "形容词后缀 -able", "e"],
    ["ible", "形容词后缀 -ible", "e"],
    ["ive", "形容词后缀 -ive", "e"],
    ["al", "形容词/名词后缀 -al", ""],
    ["ic", "形容词后缀 -ic", ""]
  ].forEach(([suffix, label, restore]) => {
    if (key.endsWith(suffix) && key.length > suffix.length + 3) {
      addCandidate(`${key.slice(0, -suffix.length)}${restore}`, label);
      addCandidate(key.slice(0, -suffix.length), label);
    }
  });
  return candidates;
}

function cleanLookupKey(value) {
  return String(value || "").toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
}

function highlightTerm(sentence, term) {
  if (!sentence) return "";
  const escaped = escapeHtml(sentence);
  if (!term) return escaped;
  const pattern = new RegExp(`\\b(${escapeRegExp(term)})\\b`, "gi");
  return escaped.replace(pattern, `<span class="highlight-term">$1</span>`);
}

function showWordPopover(token, event = null) {
  const lookup = token.dataset.lookup || token.textContent.toLowerCase();
  const lookupMatch = findLookupMatch(token.textContent) || findLookupMatch(lookup);
  const word = lookupMatch?.word;
  if (!word) {
    speak(token.textContent, "en-US", token);
    return;
  }
  const popover = $("#wordPopover");
  const suffixLine = lookupMatch?.suffix ? `<span class="suffix-line">变化：${escapeHtml(token.textContent)} → ${escapeHtml(word.term)}（${escapeHtml(lookupMatch.suffix)}）</span>` : "";
  popover.innerHTML = `
    <strong data-speak="${escapeAttr(word.term)}">${escapeHtml(word.term)} ${escapeHtml(word.ipa || "")}</strong>
    ${suffixLine}
    <span>${escapeHtml(word.meaning || "释义待补充")}</span>
  `;
  const rect = token.getBoundingClientRect();
  const anchorX = event?.clientX ?? rect.left;
  const anchorY = event?.clientY ?? rect.bottom;
  const boxWidth = 220;
  popover.style.maxWidth = `${Math.min(boxWidth, window.innerWidth - 24)}px`;
  const left = Math.min(window.innerWidth - boxWidth - 12, Math.max(12, anchorX + 10));
  const top = Math.min(window.innerHeight - 86, Math.max(12, anchorY + 10));
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.classList.remove("hidden");
  speak(word.term, "en-US", token);
}

function hidePopover() {
  $("#wordPopover").classList.add("hidden");
}

function loadVoices() {
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  renderSettings();
}

function speak(text, lang = "en-US", element = null) {
  if (!text || !("speechSynthesis" in window)) {
    toast("当前浏览器不支持朗读。");
    return;
  }
  window.speechSynthesis.cancel();
  $$(".speaking").forEach((item) => item.classList.remove("speaking"));
  element?.classList.add("speaking");
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = lang.startsWith("en") ? 0.78 : 0.9;
  utterance.pitch = 1.05;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  utterance.onend = () => element?.classList.remove("speaking");
  utterance.onerror = () => element?.classList.remove("speaking");
  window.speechSynthesis.speak(utterance);
}

function pickVoice(lang) {
  const langVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  const preferred = ["samantha", "jenny", "aria", "google us english", "microsoft", "natural"];
  return langVoices.find((voice) => preferred.some((name) => voice.name.toLowerCase().includes(name))) || langVoices[0];
}

function getVoiceInfo() {
  const english = pickVoice("en-US");
  return english ? `当前优先使用：${english.name}（${english.lang}）。如果手机/iPad 上声音仍机械，可以在 iOS 设置里下载更高质量英文语音。` : "当前浏览器还没有返回可用英文语音。";
}

function getCountdownText() {
  const today = dateFromKey(todayKey());
  const exam = dateFromKey(EXAM_DATE);
  const days = Math.max(0, Math.ceil((exam - today) / DAY));
  return `距离预计初试 ${EXAM_DATE} 约 ${days} 天。`;
}

function getStandSlots() {
  const [startHour, startMinute] = state.settings.standStart.split(":").map(Number);
  const [endHour, endMinute] = state.settings.standEnd.split(":").map(Number);
  const slots = [];
  const cursor = new Date();
  cursor.setHours(startHour, startMinute, 0, 0);
  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);
  while (cursor <= end) {
    slots.push(formatTime(cursor));
    cursor.setHours(cursor.getHours() + 1);
  }
  return slots;
}

function intervalForMisses(misses, intervals) {
  return intervals[Math.min(misses, intervals.length - 1)];
}

function unique(items) {
  return Array.from(new Set(items));
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function todayKey() {
  return formatDate(new Date());
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDaysKey(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return formatDate(next);
}

function weekdayName(date) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function nextDateAt(date, time) {
  const next = new Date(date);
  const [hour, minute] = time.split(":").map(Number);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function nextWeekdayAt(date, time) {
  const next = nextDateAt(date, time);
  while (isWeekend(next)) next.setDate(next.getDate() + 1);
  return next;
}

function toIcsLocal(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function toIcsUtc(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcs(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function guessLang(text) {
  return /[\u4e00-\u9fa5]/.test(text) ? "zh-CN" : "en-US";
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isTimeValue(value) {
  return /^\d{2}:\d{2}$/.test(String(value || ""));
}

function addMinutesToTime(value, minutes) {
  const [hours, mins] = String(value || "00:00").split(":").map(Number);
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}
