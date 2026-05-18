const STORAGE_KEY = "kaoyan_daily_task_v5";
const PLAN_VERSION = 9;
const DAY = 24 * 60 * 60 * 1000;
const EXAM_DATE = "2026-12-19";
const WRITING_TEMPLATE_START = "2026-05-18";
const UNKNOWN_REAPPEAR_AFTER = 5;
const WORD_DAILY_TARGET = 3;
const PHRASE_DAILY_TARGET = 10;
const WORD_TARGET_START = 30;
const WORD_TARGET_MAX = 80;
const KNOWN_INTERVALS_BY_TODAY_MISSES = [20, 10, 5, 3, 2, 1];
const PHRASE_INTERVALS_BY_TODAY_MISSES = [14, 7, 4, 2, 1];

const content = window.KAOYAN_CONTENT || { words: [], phrases: [] };
const lookupContent = window.KAOYAN_LOOKUP || { words: [] };
const writingPlan = window.KAOYAN_WRITING || { lessons: [] };
const grammarPlan = window.KAOYAN_GRAMMAR || { lessons: [] };
const examPlan = window.KAOYAN_EXAM || { truthStart: "2026-09-01", availableYears: [], blocks: [] };
const examAnalysis = window.KAOYAN_ANALYSIS_DATA || null;

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

const lookupOnlyWords = (lookupContent.words || [])
  .map((word, index) => ({
    id: word.id || `lookup-${index}`,
    group: "查词词库",
    unit: 0,
    term: clean(word.term),
    ipa: clean(word.ipa),
    pos: clean(word.pos || "lookup"),
    meaning: clean(word.meaning || "查词词库补充词；释义待完善"),
    exam: "",
    sentence: "",
    translation: "",
    memory: "",
    source: clean(word.source || "lookup-only"),
    lookupOnly: true
  }))
  .filter((word) => word.term);

const wordIndex = buildWordIndex([...catalogWords, ...lookupOnlyWords]);

const commonPhraseDetails = {
  "more than": {
    meaning: "超过；多于；不仅仅是",
    example: "This method is more than a simple review tool.",
    translation: "这个方法不仅仅是一个简单的复习工具。"
  },
  "according to": {
    meaning: "根据；按照",
    example: "According to the passage, regular practice matters more than speed.",
    translation: "根据文章，规律练习比速度更重要。"
  },
  "rather than": {
    meaning: "而不是",
    example: "We should understand the sentence rather than memorize it blindly.",
    translation: "我们应该理解这个句子，而不是盲目记忆。"
  },
  "as well as": {
    meaning: "也；以及；和",
    example: "Writing needs grammar as well as vocabulary.",
    translation: "写作既需要词汇，也需要语法。"
  },
  "result in": {
    meaning: "导致；造成",
    example: "A lack of review may result in quick forgetting.",
    translation: "缺少复习可能会导致快速遗忘。"
  },
  "in terms of": {
    meaning: "就……而言；从……方面来看",
    example: "In terms of reading, context is extremely important.",
    translation: "就阅读而言，语境非常重要。"
  },
  "in turn": {
    meaning: "反过来；依次；进而",
    example: "Better habits can in turn improve learning efficiency.",
    translation: "更好的习惯进而可以提高学习效率。"
  },
  "in fact": {
    meaning: "事实上",
    example: "In fact, many long sentences have a clear main structure.",
    translation: "事实上，很多长难句都有清晰的主干。"
  },
  "in contrast": {
    meaning: "相比之下；与此相反",
    example: "In contrast, careless reading often leads to mistakes.",
    translation: "相比之下，粗心阅读常常会导致错误。"
  },
  "focus on": {
    meaning: "集中于；专注于",
    example: "You should focus on the main clause first.",
    translation: "你应该先关注主句。"
  }
};

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

const simpleGrammarLessons = [
  {
    topic: "第 1 周：简单句 1",
    sentence: "Daily review improves memory.",
    translation: "每日复习能提高记忆。",
    labels: ["主语：Daily review", "谓语：improves", "宾语：memory"],
    explanation: "先找到谁做什么。这个句子的主干是 Daily review improves memory。",
    writing: "Regular practice improves performance."
  },
  {
    topic: "第 1 周：简单句 2",
    sentence: "Repeated practice builds a useful habit.",
    translation: "反复练习能建立有用的习惯。",
    labels: ["主语：Repeated practice", "谓语：builds", "宾语：a useful habit"],
    explanation: "主语可以由形容词修饰，但真正的核心名词是 practice。",
    writing: "Careful reading builds a strong foundation."
  },
  {
    topic: "第 1 周：主系表 1",
    sentence: "A clear goal is important.",
    translation: "清晰的目标很重要。",
    labels: ["主语：A clear goal", "系动词：is", "表语：important"],
    explanation: "主系表句子不强调动作，而是说明主语的状态或性质。",
    writing: "A good plan is necessary."
  },
  {
    topic: "第 1 周：主系表 2",
    sentence: "This method is useful for beginners.",
    translation: "这个方法对初学者有用。",
    labels: ["主语：This method", "系动词：is", "表语：useful", "介词短语：for beginners"],
    explanation: "for beginners 补充说明 useful 的对象，先抓主干再处理介词短语。",
    writing: "This habit is helpful for learners."
  },
  {
    topic: "第 1 周：介词短语 1",
    sentence: "Words in context are easier to remember.",
    translation: "语境中的单词更容易记住。",
    labels: ["主语核心：Words", "介词短语：in context", "表语：easier"],
    explanation: "in context 修饰 Words。先把介词短语括起来，主干就清楚了。",
    writing: "Ideas in examples are easier to understand."
  },
  {
    topic: "第 1 周：介词短语 2",
    sentence: "The answer to this question is clear.",
    translation: "这个问题的答案很清楚。",
    labels: ["主语核心：answer", "介词短语：to this question", "系动词：is"],
    explanation: "to this question 修饰 answer，不要误以为 question 是主语。",
    writing: "The solution to this problem is simple."
  },
  {
    topic: "第 1 周：并列 1",
    sentence: "Vocabulary and grammar support reading.",
    translation: "词汇和语法支撑阅读。",
    labels: ["并列主语：Vocabulary and grammar", "谓语：support", "宾语：reading"],
    explanation: "and 连接同一层级的内容，这里连接两个主语。",
    writing: "Reading and writing require patience."
  },
  {
    topic: "第 1 周：并列 2",
    sentence: "He reads carefully and writes clearly.",
    translation: "他认真阅读，并清楚地写作。",
    labels: ["主语：He", "并列谓语：reads and writes", "状语：carefully / clearly"],
    explanation: "and 连接两个动作，共用同一个主语 He。",
    writing: "She listens carefully and speaks confidently."
  },
  {
    topic: "第 1 周：to do 1",
    sentence: "You need a plan to review words.",
    translation: "你需要一个计划来复习单词。",
    labels: ["主干：You need a plan", "目的：to review words"],
    explanation: "to review words 表示目的，不是主句谓语。",
    writing: "We need time to solve the problem."
  },
  {
    topic: "第 1 周：to do 2",
    sentence: "It is useful to read aloud.",
    translation: "朗读是有用的。",
    labels: ["形式主语：It", "真正主语：to read aloud", "表语：useful"],
    explanation: "It 只是形式主语，真正要说的是 to read aloud。",
    writing: "It is important to practice daily."
  },
  {
    topic: "第 1 周：定语从句 1",
    sentence: "A habit that starts small is easier to keep.",
    translation: "从小处开始的习惯更容易坚持。",
    labels: ["主语核心：A habit", "定语从句：that starts small", "主干：A habit is easier"],
    explanation: "that starts small 修饰 habit，先拿掉从句看主干。",
    writing: "A plan that fits your life is easier to follow."
  },
  {
    topic: "第 1 周：定语从句 2",
    sentence: "Students who review often remember more.",
    translation: "经常复习的学生记得更多。",
    labels: ["主语核心：Students", "定语从句：who review often", "谓语：remember"],
    explanation: "who 引导的定语从句修饰 Students，不是全句主干。",
    writing: "People who read widely think deeply."
  },
  {
    topic: "第 1 周：状语从句 1",
    sentence: "When practice becomes regular, progress becomes visible.",
    translation: "当练习变得规律，进步就会变得可见。",
    labels: ["状语从句：When practice becomes regular", "主句：progress becomes visible"],
    explanation: "when 引导时间状语从句，主句通常在逗号后。",
    writing: "When effort becomes consistent, results become better."
  },
  {
    topic: "第 1 周：宾语从句 1",
    sentence: "I know that steady practice matters.",
    translation: "我知道稳定练习很重要。",
    labels: ["主句：I know", "宾语从句：that steady practice matters"],
    explanation: "that 后面是一整个句子，作为 know 的宾语。",
    writing: "We believe that daily review works."
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
  baseNewWords: 30,
  currentNewWords: 30,
  maxNewWords: 60,
  phraseCount: 5,
  studyStart: "07:10",
  studyEnd: "22:05",
  standStart: "09:50",
  standEnd: "18:50",
  penColor: "#1d2525",
  penSize: 3,
  notificationsEnabled: false,
  lastNotificationSchedule: "",
  lastCloudSync: "",
  cloudSyncUrl: "",
  cloudSyncCode: "",
  aiProxyUrl: "",
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
let examHubCategory = "reading";
let examHubYear = "";

init();

function init() {
  document.body.dataset.activeView = $(".view.active")?.id || "homeView";
  bindNoAccidentalZoom();
  bindPressFeedback();
  bindNavigation();
  bindActions();
  bindGlobalSpeechAndLookup();
  bindInstallPrompt();
  registerServiceWorker();
  loadVoices();
  window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
  renderAll();
}

function bindPressFeedback() {
  document.addEventListener("pointerdown", (event) => {
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    if (target) target.classList.add("is-pressing");
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      if (target) target.classList.remove("is-pressing");
    });
  });
}

function bindNoAccidentalZoom() {
  let lastTouchEnd = 0;
  document.addEventListener("dblclick", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 320) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
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
  localStorage.removeItem("kaoyan_daily_task_v4");
  return normalizeState({});
}

function normalizeState(next) {
  const settings = { ...defaultSettings, ...(next.settings || {}) };
  settings.baseNewWords = clamp(Number(settings.baseNewWords || 30), 10, 60);
  settings.currentNewWords = clamp(Number(settings.currentNewWords || settings.baseNewWords), 10, Number(settings.maxNewWords || 60));
  settings.maxNewWords = clamp(Number(settings.maxNewWords || 60), Math.max(30, settings.baseNewWords), 80);
  settings.phraseCount = clamp(Number(settings.phraseCount || 5), 1, 10);
  settings.studyStart = isTimeValue(settings.studyStart) ? settings.studyStart : "07:10";
  settings.studyEnd = isTimeValue(settings.studyEnd) ? settings.studyEnd : "22:05";
  settings.penSize = clamp(Number(settings.penSize || 3), 1, 12);
  settings.deepSeekModel = settings.deepSeekModel || "deepseek-v4-flash";
  settings.cloudSyncUrl = settings.cloudSyncUrl || "";
  settings.cloudSyncCode = settings.cloudSyncCode || "";
  settings.lastCloudSync = settings.lastCloudSync || "";
  settings.aiProxyUrl = settings.aiProxyUrl || "";
  settings.deepSeekKey = settings.deepSeekKey || "";
  return {
    settings,
    days: next.days || {},
    wordProgress: next.wordProgress || {},
    phraseProgress: next.phraseProgress || {},
    examProgress: next.examProgress || {},
    missingWords: next.missingWords || {},
    customWords: next.customWords || {},
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
      $$(".view").forEach((view) => {
        const active = view.id === target;
        view.classList.toggle("active", active);
        view.setAttribute("aria-hidden", active ? "false" : "true");
      });
      document.body.dataset.activeView = target;
      renderAll();
    });
  });
}

function bindActions() {
  $("#backButton").addEventListener("click", closeStudy);
  $("#cloudButton")?.addEventListener("click", uploadCloudSync);
  bindStudySwipeBack();
}

function bindStudySwipeBack() {
  const screen = $("#studyScreen");
  let startX = 0;
  let startY = 0;
  screen.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: true });
  screen.addEventListener("touchend", (event) => {
    if (screen.classList.contains("hidden")) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = Math.abs(touch.clientY - startY);
    if (startX < 50 && dx > 80 && dy < 80) closeStudy();
  }, { passive: true });
}

function bindGlobalSpeechAndLookup() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const token = target?.closest("[data-lookup]");
    if (token) {
      event.preventDefault();
      event.stopPropagation();
      showWordPopover(token, event);
      return;
    }
    if (!target?.closest("#wordPopover")) hidePopover();
  });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const node = target?.closest("[data-speak]");
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
  renderAnalysisExamHub();
  renderStats();
  renderProfile();
}

function renderHeader() {
  $("#dateLabel").textContent = "";
}

function renderToday() {
  const plan = getPlan();
  plan.tasks = plan.tasks.filter((item) => item.kind !== "management" && item.kind !== "review");
  const stats = getTaskStats(plan);
  $("#countdownTop").textContent = getCountdownText();
  renderCloudStatus();

  const nextTask = plan.tasks.find((item) => !item.done) || plan.tasks[0];
  $(".hero-card")?.classList.add("hidden");

  const lock = $("#lockBanner");
  lock?.classList.add("hidden");

  $("#todayTasks").innerHTML = plan.tasks.map((task) => renderTaskCard(task, nextTask && task.kind === nextTask.kind)).join("");
  $$(".task-card [data-start]").forEach((button) => {
    button.addEventListener("click", () => openSession(button.dataset.start));
  });

  $("#todayReminders").closest(".panel")?.classList.add("hidden");

  autoCompleteIfReady(plan);
}

function renderExamHub() {
  const root = $("#examView");
  if (!root) return;
  const sets = examPlan.questions || [];
  const years = [...new Set(sets.map((set) => Number(set.year)).filter(Boolean))].sort((a, b) => b - a);
  const blockMap = new Map((examPlan.blocks || []).map((block) => [block.id, block]));
  if (!examHubYear && years.length) examHubYear = String(years[0]);
  if (examHubYear && !years.includes(Number(examHubYear)) && years.length) examHubYear = String(years[0]);

  const categories = [
    { id: "reading", label: "阅读", note: "阅读理解 Part A", blockIds: ["reading-1", "reading-2", "reading-3", "reading-4"] },
    { id: "cloze", label: "完形", note: "Use of English", blockIds: ["cloze"] },
    { id: "new-type", label: "新题型", note: "段落匹配与排序", blockIds: ["new-type"] },
    { id: "translation", label: "翻译", note: "英译汉", blockIds: ["translation"] },
    { id: "writing", label: "写作", note: "小作文 / 大作文", blockIds: ["writing-truth"] }
  ];
  const activeCategory = categories.find((item) => item.id === examHubCategory) || categories[0];
  const selectedYear = Number(examHubYear || years[0] || new Date().getFullYear());
  const availableSets = sets.filter((set) => activeCategory.blockIds.includes(set.blockId) && Number(set.year) === selectedYear);
  const totalSets = sets.length;
  const doneSets = sets.filter((set) => state.examProgress?.[examProgressKey(set.year, set.blockId)]?.submitted).length;
  const todoSets = Math.max(0, totalSets - doneSets);

  root.innerHTML = `
    <div class="section-title">
      <p class="tiny-label">真题题库</p>
      <h2 id="examTitle">已做和未作</h2>
    </div>

    <section class="panel compact-panel exam-summary-panel">
      <div class="exam-summary-grid">
        <div>
          <p class="tiny-label">已做</p>
          <strong>${doneSets}</strong>
        </div>
        <div>
          <p class="tiny-label">未作</p>
          <strong>${todoSets}</strong>
        </div>
        <div>
          <p class="tiny-label">阅读题</p>
          <strong>${sets.reduce((sum, set) => sum + Number(set.questions?.length || 0), 0)}</strong>
        </div>
      </div>
      <p class="body-text">按大类选择，再用年份下拉切换；阅读已接入真实题干、选项、答案和原文。</p>
    </section>

    <section class="panel compact-panel exam-filter-panel">
      <div class="exam-category-tabs" role="tablist" aria-label="真题大类">
        ${categories.map((category) => `
          <button class="${category.id === activeCategory.id ? "active" : ""}" type="button" data-exam-category="${escapeAttr(category.id)}">
            ${escapeHtml(category.label)}
          </button>
        `).join("")}
      </div>
      <label class="exam-year-select">
        <span>年份</span>
        <select id="examYearSelect">
          ${years.map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`).join("")}
        </select>
      </label>
    </section>

    <section class="panel exam-year-panel">
      <div class="panel-row">
        <div>
          <p class="tiny-label">${escapeHtml(activeCategory.note)}</p>
          <h3>${selectedYear} ${escapeHtml(activeCategory.label)}</h3>
        </div>
        <span class="pill">${availableSets.length ? "可做" : "流程已建"}</span>
      </div>
      <div class="exam-entry-grid">
        ${activeCategory.blockIds.map((blockId) => {
          const set = sets.find((item) => Number(item.year) === selectedYear && item.blockId === blockId);
          const block = blockMap.get(blockId);
          const progress = state.examProgress?.[examProgressKey(selectedYear, blockId)];
          return `
            <button class="exam-entry-button ${progress?.submitted ? "done" : ""}" type="button" data-start-exam-year="${selectedYear}" data-start-exam-block="${escapeAttr(blockId)}">
              <span>${escapeHtml(block?.short || blockId)}</span>
              <small>${progress?.submitted ? "已做" : set ? "未作" : "待补真题"}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;

  Array.from(root.querySelectorAll("[data-exam-category]")).forEach((button) => {
    button.addEventListener("click", () => {
      examHubCategory = button.dataset.examCategory || "reading";
      renderExamHub();
    });
  });
  $("#examYearSelect")?.addEventListener("change", (event) => {
    examHubYear = event.target.value;
    renderExamHub();
  });
  Array.from(root.querySelectorAll("[data-start-exam-year]")).forEach((button) => {
    button.addEventListener("click", () => {
      const block = blockMap.get(button.dataset.startExamBlock);
      if (!block) return;
      openSession("exam", { training: { ...block, year: Number(button.dataset.startExamYear) } });
    });
  });
}

function examProgressKey(year, blockId) {
  return `${year}-${blockId}`;
}

function renderExamHubV2() {
  const root = $("#examView");
  if (!root) return;
  const sets = examPlan.questions || [];
  const readyYears = (examPlan.availableYears || sets.map((set) => set.year)).map(Number).filter(Boolean);
  const maxReadyYear = Math.max(...readyYears, 0);
  const years = [...new Set([
    ...readyYears,
    ...(examPlan.missingYears || []).map(Number).filter((year) => year && (!maxReadyYear || year <= maxReadyYear))
  ])].sort((a, b) => b - a);
  const blockMap = new Map((examPlan.blocks || []).map((block) => [block.id, block]));
  const categories = [
    { id: "reading", label: "阅读", note: "阅读理解 Part A", blockIds: ["reading-1", "reading-2", "reading-3", "reading-4"] },
    { id: "cloze", label: "完形", note: "Use of English", blockIds: ["cloze"] },
    { id: "new-type", label: "新题型", note: "段落匹配与排序", blockIds: ["new-type"] },
    { id: "translation", label: "翻译", note: "英译汉", blockIds: ["translation"] },
    { id: "writing", label: "写作", note: "小作文 / 大作文", blockIds: ["writing-truth"] }
  ];
  const activeCategory = categories.find((item) => item.id === examHubCategory) || categories[0];
  const doneSets = sets.filter((set) => state.examProgress?.[examProgressKey(set.year, set.blockId)]?.submitted).length;
  const todoSets = Math.max(0, sets.length - doneSets);
  const totalQuestions = sets.reduce((sum, set) => sum + Number(set.questions?.length || 0), 0);

  root.innerHTML = `
    <div class="section-title">
      <p class="tiny-label">真题题库</p>
      <h2 id="examTitle">已做和未作</h2>
    </div>

    <section class="panel compact-panel exam-summary-panel">
      <div class="exam-summary-grid">
        <div>
          <p class="tiny-label">已做</p>
          <strong>${doneSets}</strong>
        </div>
        <div>
          <p class="tiny-label">未作</p>
          <strong>${todoSets}</strong>
        </div>
        <div>
          <p class="tiny-label">阅读题</p>
          <strong>${totalQuestions}</strong>
        </div>
      </div>
      <p class="body-text">按大类选择；阅读已接入真实题干、选项、答案和原文。</p>
    </section>

    <section class="panel compact-panel exam-filter-panel">
      <div class="exam-category-tabs" role="tablist" aria-label="真题大类">
        ${categories.map((category) => `
          <button class="${category.id === activeCategory.id ? "active" : ""}" type="button" data-exam-category="${escapeAttr(category.id)}">
            ${escapeHtml(category.label)}
          </button>
        `).join("")}
      </div>
    </section>

    <section class="exam-year-list">
      ${years.map((year) => {
        const availableSets = sets.filter((set) => activeCategory.blockIds.includes(set.blockId) && Number(set.year) === Number(year));
        return `
          <article class="panel exam-year-panel">
            <div class="panel-row">
              <div>
                <p class="tiny-label">${escapeHtml(activeCategory.note)}</p>
                <h3>${year} ${escapeHtml(activeCategory.label)}</h3>
              </div>
              <span class="pill">${availableSets.length ? "可做" : "流程已建"}</span>
            </div>
            <div class="exam-entry-grid">
              ${activeCategory.blockIds.map((blockId) => {
                const set = sets.find((item) => Number(item.year) === Number(year) && item.blockId === blockId);
                const block = blockMap.get(blockId);
                const progress = state.examProgress?.[examProgressKey(year, blockId)];
                return `
                  <button class="exam-entry-button ${progress?.submitted ? "done" : ""}" type="button" data-start-exam-year="${year}" data-start-exam-block="${escapeAttr(blockId)}">
                    <span>${escapeHtml(block?.short || blockId)}</span>
                    <small>${progress?.submitted ? "已做" : set ? "未作" : "待补真题"}</small>
                  </button>
                `;
              }).join("")}
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;

  Array.from(root.querySelectorAll("[data-exam-category]")).forEach((button) => {
    button.addEventListener("click", () => {
      examHubCategory = button.dataset.examCategory || "reading";
      renderExamHubV2();
    });
  });
  Array.from(root.querySelectorAll("[data-start-exam-year]")).forEach((button) => {
    button.addEventListener("click", () => {
      const block = blockMap.get(button.dataset.startExamBlock);
      if (!block) return;
      openSession("exam", { training: { ...block, year: Number(button.dataset.startExamYear) } });
    });
  });
}

async function renderAnalysisExamHub() {
  const root = $("#examView");
  if (!root) return;
  if (!examAnalysis) {
    renderExamHubV2();
    return;
  }

  const years = examAnalysis.listYears().sort((a, b) => b - a);
  const sections = examAnalysis.listSections();
  const selectedYear = Number(examHubYear || years[0]);
  examHubYear = String(selectedYear);
  const loadToken = `${Date.now()}-${selectedYear}`;
  root.dataset.examLoadToken = loadToken;
  root.innerHTML = `
    <div class="section-title">
      <p class="tiny-label">真题题库</p>
      <h2 id="examTitle">英语二 / 管理类联考英语</h2>
    </div>
    <section class="panel compact-panel">
      <p class="body-text">正在读取 ${selectedYear} 年真题数据...</p>
    </section>
  `;

  let stats;
  try {
    stats = await examAnalysis.getYearStats(selectedYear);
  } catch (error) {
    console.error(error);
    if (root.dataset.examLoadToken !== loadToken) return;
    root.innerHTML = `
      <div class="section-title">
        <p class="tiny-label">真题题库</p>
        <h2 id="examTitle">数据读取失败</h2>
      </div>
      <section class="panel compact-panel">
        <p class="body-text">没有读到 ${selectedYear} 年的 analysis_processed 数据，请确认文件已放在对应年份目录。</p>
      </section>
    `;
    return;
  }
  if (root.dataset.examLoadToken !== loadToken) return;

  const examCards = buildExamHubCards(selectedYear, sections, stats);

  root.innerHTML = `
    <div class="section-title">
      <p class="tiny-label">真题题库</p>
      <h2 id="examTitle">${selectedYear} 英语二</h2>
    </div>

    <section class="panel compact-panel exam-filter-panel">
      <div class="panel-row">
        <div>
          <p class="tiny-label">年份选择</p>
          <h3>${selectedYear} 年</h3>
        </div>
        <span class="pill">${stats.total} 题</span>
      </div>
      <div class="exam-category-tabs exam-year-tabs" role="tablist" aria-label="年份">
        ${years.map((year) => `
          <button class="${Number(year) === selectedYear ? "active" : ""}" type="button" data-exam-year="${year}">
            ${year}
          </button>
        `).join("")}
      </div>
    </section>

    <section class="exam-hub-grid">
      ${examCards.map((card) => renderExamHubCard(card)).join("")}
    </section>
  `;

  Array.from(root.querySelectorAll("[data-exam-year]")).forEach((button) => {
    button.addEventListener("click", () => {
      examHubYear = button.dataset.examYear || String(selectedYear);
      renderAnalysisExamHub();
    });
  });
  Array.from(root.querySelectorAll("[data-start-analysis-year]")).forEach((button) => {
    button.addEventListener("click", () => {
      const section = sections.find((item) => item.id === button.dataset.startAnalysisSection);
      if (!section) return;
      const textNo = Number(button.dataset.startAnalysisText || 0);
      const writingPartName = section.id === "writing" && textNo ? (textNo === 47 ? "小作文" : "大作文") : "";
      const title = writingPartName
        ? `${selectedYear} ${writingPartName}`
        : textNo
        ? `${selectedYear} ${section.label} Text ${textNo}`
        : `${selectedYear} ${section.label}`;
      openSession("exam", {
        training: {
          id: section.id,
          source: "analysisProcessed",
          title,
          short: writingPartName || (textNo ? `${section.short} Text ${textNo}` : section.short),
          goal: writingPartName ? (textNo === 47 ? "Writing Part A" : "Writing Part B") : textNo ? `${section.note} · Text ${textNo}` : section.note,
          steps: getExamTrainingSteps(section.id),
          textNo,
          year: Number(button.dataset.startAnalysisYear)
        }
      });
    });
  });
}

function buildExamHubCards(year, sections, stats) {
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const statsMap = new Map((stats.bySection || []).map((item) => [item.id, item]));
  const cards = [];
  const useOfEnglish = sectionMap.get("useOfEnglish");
  if (useOfEnglish) cards.push(makeExamHubCard(year, useOfEnglish, statsMap.get("useOfEnglish"), "1-20", "20 空"));
  const reading = sectionMap.get("readingPartA");
  if (reading) {
    [1, 2, 3, 4].forEach((textNo) => {
      const start = 21 + (textNo - 1) * 5;
      cards.push(makeExamHubCard(year, reading, statsMap.get("readingPartA"), `${start}-${start + 4}`, `Text ${textNo}`, textNo));
    });
  }
  ["readingPartB", "translation"].forEach((id) => {
    const section = sectionMap.get(id);
    if (!section) return;
    const sectionStats = statsMap.get(id);
    cards.push(makeExamHubCard(year, section, sectionStats, section.questionRange, section.short));
  });
  const writing = sectionMap.get("writing");
  if (writing) {
    const sectionStats = statsMap.get("writing");
    cards.push(makeExamHubCard(year, writing, sectionStats, "47", "小作文", 47));
    cards.push(makeExamHubCard(year, writing, sectionStats, "48", "大作文", 48));
  }
  return cards;
}

function makeExamHubCard(year, section, sectionStats = {}, questionRange, label, textNo = 0) {
  const total = section.id === "writing" && textNo ? 1 : textNo ? 5 : Number(sectionStats.total || 0);
  const progress = getAnalysisSectionProgress(year, section.id, textNo);
  const answered = getAnsweredCount(progress.answers);
  const scoreText = progress.submitted && Number.isFinite(progress.score)
    ? `${progress.score}/${progress.total || total}`
    : `${answered}/${total}`;
  return {
    year,
    section,
    textNo,
    label,
    questionRange,
    total,
    progress,
    scoreText,
    missing: textNo ? 0 : Number(sectionStats.analysisMissing || 0)
  };
}

function renderExamHubCard(card) {
  const title = card.section.id === "writing" && card.textNo
    ? card.label
    : card.textNo ? `阅读理解 A · ${card.label}` : card.section.label;
  const buttonMeta = card.section.id === "writing" && card.textNo ? card.label : card.textNo ? `Text ${card.textNo}` : card.section.short;
  return `
    <article class="panel exam-year-panel analysis-section-card">
      <div class="panel-row">
        <div>
          <p class="tiny-label">${escapeHtml(card.section.note)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <span class="pill">${card.progress.submitted ? "已完成" : "可练习"}</span>
      </div>
      <div class="analysis-section-meta">
        <span>题号 ${escapeHtml(card.questionRange)}</span>
        <span>题量 ${card.total}</span>
        <span>解析缺失 ${card.missing}</span>
        <span>进度 ${escapeHtml(card.scoreText)}</span>
      </div>
      <button class="exam-entry-button ${card.progress.submitted ? "done" : ""}" type="button" data-start-analysis-year="${card.year}" data-start-analysis-section="${escapeAttr(card.section.id)}" data-start-analysis-text="${card.textNo || ""}">
        <span>${card.progress.submitted ? "继续复盘" : "开始做题"}</span>
        <small>${escapeHtml(buttonMeta)}</small>
      </button>
    </article>
  `;
}

function getExamTrainingSteps(sectionId) {
  if (sectionId === "readingPartA") return ["先读文章", "逐题定位", "交卷后看解析"];
  if (sectionId === "useOfEnglish") return ["通读全文", "逐空选择", "复盘固定搭配和逻辑"];
  return ["完成作答", "核对官方答案", "复盘解析"];
}

function getAnalysisSectionProgress(year, sectionId, textNo = 0) {
  return state.examProgress?.[analysisProgressKey(year, sectionId, textNo)] || {};
}

function analysisProgressKey(year, sectionId, textNo = 0) {
  return textNo ? `${year}-${sectionId}-text${textNo}` : examProgressKey(year, sectionId);
}

function getAnsweredCount(answers = {}) {
  return Object.values(answers || {}).filter(Boolean).length;
}

function getAnalysisYearProgress(year, sections) {
  if (!sections.length) return 0;
  const done = sections.filter((section) => getAnalysisSectionProgress(year, section.id).submitted).length;
  return Math.round(done / sections.length * 100);
}

function renderCloudStatus() {
  const cloud = $("#cloudButton");
  if (!cloud) return;
  cloud.classList.toggle("synced", Boolean(state.settings.lastCloudSync));
  cloud.title = state.settings.lastCloudSync ? `已同步 ${formatTime(new Date(state.settings.lastCloudSync))}` : "同步";
}

async function enableStudyNotifications() {
  const localNotifications = window.Capacitor?.Plugins?.LocalNotifications;
  if (!localNotifications) {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      toast(result === "granted" ? "浏览器通知已开启。安装成 App 后可同步到手表。" : "通知权限没有开启。");
      return;
    }
    toast("当前环境不支持通知；请安装新版 App 后再点开启提醒。");
    return;
  }

  const permission = await localNotifications.requestPermissions();
  if (permission.display !== "granted") {
    toast("通知权限没有开启，请在 iPhone 设置里允许通知。");
    return;
  }

  const pending = await localNotifications.getPending();
  if (pending.notifications?.length) {
    await localNotifications.cancel({ notifications: pending.notifications.map((item) => ({ id: item.id })) });
  }
  await localNotifications.schedule({ notifications: buildStudyNotifications() });
  state.settings.notificationsEnabled = true;
  state.settings.lastNotificationSchedule = new Date().toISOString();
  saveState();
  renderToday();
  toast("已同步 7 天学习、站立和锻炼提醒。");
}

function buildStudyNotifications() {
  const notifications = [];
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const key = formatDate(date);
    ensurePlan(key);
    const plan = state.days[key];
    plan.tasks
      .filter((item) => item.kind !== "management")
      .forEach((item, index) => {
        const at = nextDateAt(date, item.time);
        if (at <= today) return;
        notifications.push({
          id: 10000 + dayOffset * 100 + index,
          title: item.title,
          body: item.note || "今天的小任务开始了。",
          schedule: { at },
          sound: "default"
        });
      });
    if (!isWeekend(date)) {
      for (let hour = 9; hour <= 18; hour += 1) {
        const at = new Date(date);
        at.setHours(hour, 50, 0, 0);
        if (at <= today) continue;
        notifications.push({
          id: 20000 + dayOffset * 100 + hour,
          title: "上班站立",
          body: "起身 2-3 分钟，接水、慢走、肩颈放松。",
          schedule: { at },
          sound: "default"
        });
      }
    }
    const exerciseAt = nextDateAt(date, "20:10");
    if (exerciseAt > today) {
      notifications.push({
        id: 30000 + dayOffset,
        title: "腰部友好锻炼",
        body: "散步、猫牛式、鸟狗式、臀桥，疼痛明显就只轻走。",
        schedule: { at: exerciseAt },
        sound: "default"
      });
    }
  }
  return notifications.slice(0, 64);
}

function renderTaskCard(task, isNext = false) {
  const label = getTaskDisplayLabel(task);
  const todayProgress = getTaskTodayProgressText(task);
  const totalProgress = getTaskTotalProgressText(task);
  const status = task.done ? "已完成" : isNext ? "下一项" : "待开始";
  return `
    <article class="task-card ${task.done ? "done" : ""} ${isNext && !task.done ? "next" : ""}">
      <div class="task-row">
        <div class="task-main">
          <div class="task-kicker">
            <span class="task-time">${escapeHtml(task.time)}</span>
            <span class="task-status">${escapeHtml(status)}</span>
          </div>
          <div class="task-title">${escapeHtml(label)}</div>
          <p class="task-note">今日 ${escapeHtml(todayProgress)}</p>
        </div>
        <div class="task-total" aria-label="总进度">
          <span>总计</span>
          <strong>${escapeHtml(totalProgress)}</strong>
        </div>
        <button class="small-button task-cta" type="button" data-start="${escapeAttr(task.kind)}">${task.done ? "复习" : isNext ? "开始" : "进入"}</button>
      </div>
    </article>
  `;
}

function getTaskDisplayLabel(task) {
  const labels = {
    vocab: "背单词",
    phrases: "短语",
    grammar: "语法",
    translation: "翻译",
    writing: "写作",
    exam: "真题"
  };
  return labels[task.kind] || task.title;
}

function getTaskProgressText(task) {
  return getTaskTodayProgressText(task);
}

function getTaskTodayProgressText(task) {
  const plan = getPlan();
  if (task.kind === "vocab") return `${countCompletedMemory(plan.wordIds, "word")}/${plan.wordIds.length || 0}`;
  if (task.kind === "phrases") return `${countCompletedMemory(plan.phraseIds, "phrase")}/${plan.phraseIds.length || 0}`;
  return `${task.done ? 1 : 0}/1`;
}

function getTaskTotalProgressText(task) {
  const plan = getPlan();
  if (task.kind === "vocab") {
    const total = getMemoryWords().length;
    const learned = Object.values(state.wordProgress || {}).filter((item) => item.started).length;
    return `${learned}/${total}`;
  }
  if (task.kind === "phrases") {
    const total = catalogPhrases.length;
    const learned = Object.values(state.phraseProgress || {}).filter((item) => item.started).length;
    return `${learned}/${total}`;
  }
  if (task.kind === "grammar" || task.kind === "translation") {
    const total = grammarLessons.length;
    const learned = clamp(Number(plan.lessonIndex || 0) + (task.done ? 1 : 0), 0, total);
    return `${learned}/${total}`;
  }
  if (task.kind === "writing") {
    const total = writingLessons.length;
    const learned = clamp(Number(plan.writingIndex || 0) + (task.done ? 1 : 0), 0, total);
    return `${learned}/${total}`;
  }
  if (task.kind === "exam") {
    const sets = examPlan.questions || [];
    const done = sets.filter((set) => state.examProgress?.[examProgressKey(set.year, set.blockId)]?.submitted).length;
    return `${done}/${sets.length}`;
  }
  return getTaskTodayProgressText(task);
}

function countCompletedMemory(ids = [], type) {
  const target = requiredMemoryCount(type);
  const plan = getPlan();
  return unique(ids).filter((id) => Number(plan.logs?.[id]?.knownCount || 0) >= target).length;
}

function renderStats() {
  const wordStarted = Object.values(state.wordProgress).filter((item) => item.started).length;
  const wordMastered = Object.values(state.wordProgress).filter((item) => item.status === "mastered").length;
  const phraseStarted = Object.values(state.phraseProgress).filter((item) => item.started).length;
  const mistakes = Object.values(state.wordProgress).filter((item) => item.mistakes > 0 && item.status !== "mastered").length;
  const pending = Math.max(0, getMemoryWords().length - wordStarted);
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
  getMemoryWords().forEach((word) => {
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

function writingTemplateCatalogHtml() {
  const groups = new Map();
  writingLessons
    .filter((lesson) => lesson.phase !== "truth")
    .forEach((lesson) => {
      const type = lesson.type || "写作";
      const subtype = lesson.subtype || lesson.title || "模板";
      if (!groups.has(type)) groups.set(type, new Map());
      const subtypeMap = groups.get(type);
      subtypeMap.set(subtype, (subtypeMap.get(subtype) || 0) + 1);
    });

  return Array.from(groups.entries()).map(([type, subtypeMap]) => `
    <details class="library-group" open>
      <summary>${escapeHtml(type)} · ${subtypeMap.size} 类</summary>
      <div class="library-chip-row">
        ${Array.from(subtypeMap.entries()).map(([subtype, count]) => `
          <span class="library-chip">${escapeHtml(subtype)} · ${count} 天</span>
        `).join("")}
      </div>
    </details>
  `).join("");
}

function profileMemoryLibraryHtml() {
  const wordGroups = new Map();
  getMemoryWords().forEach((word) => {
    const groupName = `${word.group || "词库"} U${word.unit || 0}`;
    if (!wordGroups.has(groupName)) wordGroups.set(groupName, []);
    wordGroups.get(groupName).push(word);
  });
  const wordHtml = Array.from(wordGroups.entries()).map(([groupName, words]) => `
    <details class="library-group">
      <summary>${escapeHtml(groupName)} · ${words.length} 个</summary>
      <div class="library-row-list">
        ${words.map((word) => `
          <article class="library-row">
            <strong data-speak="${escapeAttr(word.term)}">${escapeHtml(word.term)}</strong>
            <span>${escapeHtml(word.meaning || word.exam || "释义待完善")}</span>
          </article>
        `).join("")}
      </div>
    </details>
  `).join("");

  const phraseHtml = `
    <details class="library-group">
      <summary>全部短语 · ${catalogPhrases.length} 个</summary>
      <div class="library-row-list">
        ${catalogPhrases.map((phrase) => `
          <article class="library-row">
            <strong data-speak="${escapeAttr(phrase.phrase)}">${escapeHtml(phrase.phrase)}</strong>
            <span>${escapeHtml(phrase.meaning || phrase.translation || "释义待完善")}</span>
          </article>
        `).join("")}
      </div>
    </details>
  `;

  return `
    <details class="library-group" open>
      <summary>全部单词 · 按单元分</summary>
      <div class="library-nested">${wordHtml}</div>
    </details>
    ${phraseHtml}
  `;
}

function profileWritingTemplateLibraryHtml() {
  const groups = new Map();
  writingLessons
    .filter((lesson) => lesson.phase !== "truth")
    .forEach((lesson) => {
      const type = lesson.type || "写作";
      const subtype = lesson.subtype || lesson.title || "模板";
      if (!groups.has(type)) groups.set(type, new Map());
      const subtypeMap = groups.get(type);
      if (!subtypeMap.has(subtype)) subtypeMap.set(subtype, []);
      subtypeMap.get(subtype).push(lesson);
    });

  return Array.from(groups.entries()).map(([type, subtypeMap]) => `
    <details class="library-group" open>
      <summary>${escapeHtml(type)} · ${subtypeMap.size} 类</summary>
      <div class="library-nested">
        ${Array.from(subtypeMap.entries()).map(([subtype, lessons]) => `
          <details class="library-group">
            <summary>${escapeHtml(subtype)} · ${lessons.length} 天</summary>
            <div class="library-row-list">
              ${lessons.map((lesson) => `
                <article class="library-template-row">
                  <strong>${escapeHtml(lesson.title || subtype)}</strong>
                  ${(lesson.practiceLines || lesson.templateLines || []).map((line) => `
                    <p>${renderLookupText(line.en || "")}</p>
                    <span>${escapeHtml(line.cn || "")}</span>
                  `).join("")}
                </article>
              `).join("")}
            </div>
          </details>
        `).join("")}
      </div>
    </details>
  `).join("");
}

function renderProfile() {
  const profile = $("#profileView");
  if (!profile) return;
  const plan = getPlan();
  if (!plan) return;
  const stats = getTaskStats(plan);
  const completed = Math.round(stats.rate * 100);
  const syncLabel = state.settings.lastCloudSync ? `今日 ${formatTime(new Date(state.settings.lastCloudSync))}` : "本机";
  profile.innerHTML = `
    <div class="section-title">
      <p class="tiny-label">我的</p>
      <h2 id="profileTitle">同步与提醒</h2>
    </div>
    <section class="profile-grid">
      <article class="panel profile-panel">
        <div class="panel-row">
          <h3>同步</h3>
          <button id="profileCloudButton" class="icon-button ${state.settings.lastCloudSync ? "synced" : ""}" type="button" title="同步" aria-label="同步">☁</button>
        </div>
        <p class="body-text">${syncLabel} · 今日 ${completed}%</p>
        <button id="profileCloudDownloadButton" class="small-button compact-button" type="button">从云端恢复</button>
      </article>
      <article class="panel profile-panel">
        <div class="panel-row">
          <h3>提醒</h3>
          <span class="pill">${state.settings.notificationsEnabled ? "已开启" : "未开启"}</span>
        </div>
        <button id="profileNotificationButton" class="primary-button compact-button" type="button">
          ${state.settings.notificationsEnabled ? "重新同步提醒" : "开启提醒"}
        </button>
      </article>
      <article class="panel profile-panel wide">
        <details>
          <summary>云端同步</summary>
          <p class="body-text">上传到你自己的 Cloudflare KV。同步码相当于密码；云端备份不会上传本地 DeepSeek API Key。</p>
          <label class="setting-field">
            <span>同步地址</span>
            <input id="cloudSyncUrlInput" type="url" placeholder="https://你的同步 Worker 地址" value="${escapeAttr(state.settings.cloudSyncUrl || "")}" />
          </label>
          <label class="setting-field">
            <span>同步码</span>
            <div class="secret-field">
              <input id="cloudSyncCodeInput" type="password" autocomplete="off" spellcheck="false" placeholder="自己设置一串长一点的同步码" value="${escapeAttr(state.settings.cloudSyncCode || "")}" />
              <button id="toggleCloudSyncCodeButton" class="small-button" type="button">显示</button>
            </div>
          </label>
          <div class="action-row">
            <button id="uploadCloudSyncButton" class="small-button" type="button">上传到云端</button>
            <button id="downloadCloudSyncButton" class="small-button" type="button">从云端恢复</button>
          </div>
        </details>
      </article>
      <article class="panel profile-panel wide">
        <details>
          <summary>DeepSeek 批改接口</summary>
          <p class="body-text">本机自用可以直接填 API Key；用 npm start 打开时会走本地转发。Key 会保存在本机数据里，备份也会带上它。</p>
          <label class="setting-field">
            <span>本地 API Key</span>
            <div class="secret-field">
              <input id="deepSeekKeyInput" type="password" autocomplete="off" spellcheck="false" placeholder="sk-..." value="${escapeAttr(state.settings.deepSeekKey || "")}" />
              <button id="toggleDeepSeekKeyButton" class="small-button" type="button">显示</button>
            </div>
          </label>
          <div class="action-row">
            <button id="copyDeepSeekKeyButton" class="small-button" type="button">复制 Key</button>
            <button id="clearDeepSeekKeyButton" class="small-button" type="button">清空 Key</button>
          </div>
          <label class="setting-field">
            <span>云端代理地址（可选）</span>
            <input id="aiProxyUrlInput" type="url" placeholder="https://你的代理地址；不填则优先用本地 Key" value="${escapeAttr(state.settings.aiProxyUrl || "")}" />
          </label>
          <label class="setting-field">
            <span>模型</span>
            <input id="deepSeekModelInput" type="text" value="${escapeAttr(state.settings.deepSeekModel || "deepseek-v4-flash")}" />
          </label>
        </details>
      </article>
      <article class="panel profile-panel wide">
        <details>
          <summary>学习资源库</summary>
          <div class="library-stat-grid">
            <div><strong>${getMemoryWords().length}</strong><span>全部单词</span></div>
            <div><strong>${catalogPhrases.length}</strong><span>全部短语</span></div>
            <div><strong>${writingLessons.filter((lesson) => lesson.phase !== "truth").length}</strong><span>写作模板课</span></div>
          </div>
          <p class="body-text">这里可以直接查看全部学习材料：单词按单元分，短语集中查看，写作模板按大作文和小作文分类型展开。</p>
          ${profileMemoryLibraryHtml()}
          ${profileWritingTemplateLibraryHtml()}
        </details>
      </article>
      <article class="panel profile-panel wide">
        <details>
          <summary>备份</summary>
          <textarea id="backupBox" rows="8" spellcheck="false" placeholder="这里用于生成或粘贴本地备份。"></textarea>
          <div class="action-row">
            <button id="exportDataButton" class="small-button" type="button">生成备份</button>
            <button id="importDataButton" class="small-button" type="button">恢复备份</button>
          </div>
        </details>
      </article>
    </section>
  `;
  $("#profileCloudButton")?.addEventListener("click", uploadCloudSync);
  $("#profileCloudDownloadButton")?.addEventListener("click", downloadCloudSync);
  $("#profileNotificationButton")?.addEventListener("click", enableStudyNotifications);
  $("#cloudSyncUrlInput")?.addEventListener("input", (event) => {
    state.settings.cloudSyncUrl = event.target.value.trim();
    saveState();
  });
  $("#cloudSyncCodeInput")?.addEventListener("input", (event) => {
    state.settings.cloudSyncCode = event.target.value.trim();
    saveState();
  });
  $("#toggleCloudSyncCodeButton")?.addEventListener("click", () => {
    const input = $("#cloudSyncCodeInput");
    if (!input) return;
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    $("#toggleCloudSyncCodeButton").textContent = visible ? "显示" : "隐藏";
  });
  $("#uploadCloudSyncButton")?.addEventListener("click", uploadCloudSync);
  $("#downloadCloudSyncButton")?.addEventListener("click", downloadCloudSync);
  $("#deepSeekKeyInput")?.addEventListener("input", (event) => {
    state.settings.deepSeekKey = event.target.value.trim();
    saveState();
  });
  $("#toggleDeepSeekKeyButton")?.addEventListener("click", () => {
    const input = $("#deepSeekKeyInput");
    if (!input) return;
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    $("#toggleDeepSeekKeyButton").textContent = visible ? "显示" : "隐藏";
  });
  $("#copyDeepSeekKeyButton")?.addEventListener("click", () => {
    copyText(state.settings.deepSeekKey || "", "Key 已复制。", "还没有填写 Key。");
  });
  $("#clearDeepSeekKeyButton")?.addEventListener("click", () => {
    state.settings.deepSeekKey = "";
    saveState();
    renderProfile();
    toast("Key 已清空。");
  });
  $("#aiProxyUrlInput")?.addEventListener("input", (event) => {
    state.settings.aiProxyUrl = event.target.value.trim();
    saveState();
  });
  $("#deepSeekModelInput")?.addEventListener("input", (event) => {
    state.settings.deepSeekModel = event.target.value.trim() || "deepseek-v4-flash";
    saveState();
  });
  $("#exportDataButton")?.addEventListener("click", exportData);
  $("#importDataButton")?.addEventListener("click", importData);
}

function ensurePlan(key) {
  if (state.days[key]?.version === PLAN_VERSION) return;
  if (state.days[key] && state.days[key].version !== PLAN_VERSION) {
    if (state.days[key].completed) return;
    delete state.days[key];
  }

  const date = dateFromKey(key);
  const weekend = isWeekend(date);
  const dueWordIds = getDueWordIds(key);
  const wordTarget = plannedWordTarget(key);
  const newWordIds = takeNewWords(Math.max(0, wordTarget - dueWordIds.length));
  const duePhraseIds = getDuePhraseIds(key);
  const newPhraseIds = takeNewPhrases(Math.max(0, plannedPhraseTarget(key) - duePhraseIds.length));

  newWordIds.forEach((id) => startWord(id, key));
  newPhraseIds.forEach((id) => startPhrase(id, key));

  const wordIds = unique(dueWordIds.concat(newWordIds));
  const phraseIds = unique(duePhraseIds.concat(newPhraseIds));
  const truthTraining = getTruthTraining(key);
  const tasks = weekend ? weekendTasks(wordIds, phraseIds, key, truthTraining) : weekdayTasks(wordIds, phraseIds, key, truthTraining);

  state.days[key] = {
    version: PLAN_VERSION,
    key,
    completed: false,
    wordIds,
    phraseIds,
    wordTarget,
    phraseTarget: plannedPhraseTarget(key),
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

function plannedWordTarget(key) {
  const date = dateFromKey(key);
  if (key >= "2026-11-01") return 0;
  const days = Math.max(0, Math.floor((date - dateFromKey(state.settings.startDate)) / DAY));
  return clamp(WORD_TARGET_START + days, WORD_TARGET_START, WORD_TARGET_MAX);
}

function plannedPhraseTarget(key) {
  return PHRASE_DAILY_TARGET;
}

function getAutoPlanSummary(key) {
  const target = plannedWordTarget(key);
  const phraseTarget = plannedPhraseTarget(key);
  const phase = key >= "2026-11-01" ? "冲刺复习期" : key >= "2026-09-01" ? "真题强化期" : "词汇主攻期";
  return `${phase}：今日词次目标 ${target}，短语 ${phraseTarget}。到 11 月起停止系统新增，主刷错词、真题词和翻译错句。`;
}

function weekdayTasks(wordIds, phraseIds, key, truthTraining) {
  const times = getStudySchedule(false);
  const tasks = [
    task(times.vocab, "单词复习", "先回忆，点屏幕后看释义、例句和翻译。认识就放远，不认识 5 个后回炉。", "vocab", [`${wordIds.length} 个`]),
    task(times.phrases, "短语 10 个", "每天固定 10 个短语，例句带中文翻译，服务阅读和写作。", "phrases", [`${phraseIds.length} 个`]),
    task(times.grammar, "语法 2 句", "每天两句：第一周简单句，后面进入真题长难句。", "grammar"),
    task(times.translation, "翻译课", "从句子里找谓语、抓主干、拆修饰，再写直译和通顺译。", "translation"),
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
    task(times.vocab, "周末单词循环", "周末也继续背新词，同时回炉本周错词和到期词。", "vocab", [`${wordIds.length} 个`]),
    task(times.phrases, "短语 10 个", "每天固定 10 个短语，放进例句和作文句里复习。", "phrases", [`${phraseIds.length} 个`]),
    task(times.grammar, "语法 2 句", "每天两句：第一周简单句，后面进入真题长难句。", "grammar"),
    task(times.translation, "翻译复盘", "重译本周最卡的一句，按谓语、主干、修饰、直译、通顺译复盘。", "translation"),
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
    translation: addMinutesToTime(end, weekend ? -60 : -62),
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

function openSession(kind, options = {}) {
  const plan = getPlan();
  if (kind === "vocab") {
    const taskDone = Boolean(plan.tasks.find((item) => item.kind === "vocab")?.done);
    const ids = taskDone ? plan.wordIds : remainingMemoryIds(plan.wordIds, "word");
    session = { kind, queue: [...ids], index: 0, revealed: false, failCounts: {}, practiceOnly: taskDone };
  } else if (kind === "phrases") {
    const taskDone = Boolean(plan.tasks.find((item) => item.kind === "phrases")?.done);
    const ids = taskDone ? plan.phraseIds : remainingMemoryIds(plan.phraseIds, "phrase");
    session = { kind, queue: [...ids], index: 0, revealed: false, failCounts: {}, practiceOnly: taskDone };
  } else if (kind === "exam") {
    const training = options.training || plan.truthTraining || getTruthTraining(plan.key);
    const saved = plan.logs.examSession || {};
    const sessionKey = training ? `${training.year}-${training.id}${training.textNo ? `-text${training.textNo}` : ""}` : "";
    const savedMatches = !options.training && saved.trainingId === training?.id && Number(saved.year) === Number(training?.year) && Number(saved.textNo || 0) === Number(training?.textNo || 0);
    session = {
      kind,
      exam: {
        training,
        sessionKey,
        fromHub: Boolean(options.training),
        trainingId: training?.id || "",
        textNo: Number(training?.textNo || 0),
        startedAt: savedMatches ? saved.startedAt : Date.now(),
        answers: savedMatches ? saved.answers || {} : {},
        flagged: savedMatches ? saved.flagged || {} : {},
        collected: savedMatches ? saved.collected || {} : {},
        notes: savedMatches ? saved.notes || "" : "",
        wrongLines: savedMatches ? saved.wrongLines || "" : "",
        submitted: savedMatches ? Boolean(saved.submitted) : false,
        score: savedMatches ? Number(saved.score || 0) : 0
      }
    };
  } else {
    session = { kind };
  }
  const studyScreen = $("#studyScreen");
  studyScreen.classList.toggle("memory-mode", kind === "vocab" || kind === "phrases");
  studyScreen.classList.toggle("lesson-mode", kind !== "vocab" && kind !== "phrases");
  studyScreen.classList.toggle("exam-mode", kind === "exam");
  studyScreen.classList.remove("hidden");
  renderSession();
}

function closeStudy() {
  const studyScreen = $("#studyScreen");
  studyScreen.classList.add("hidden");
  studyScreen.classList.remove("memory-mode", "lesson-mode", "exam-mode");
  session = null;
  renderAll();
}

function renderSession() {
  const plan = getPlan();
  if (session.kind === "vocab") return renderWordSession();
  if (session.kind === "phrases") return renderPhraseSession();
  if (session.kind === "grammar") return renderGrammarSession(plan);
  if (session.kind === "translation") return renderTranslationSession(plan);
  if (session.kind === "writing") return renderWritingSession(plan);
  if (session.kind === "exam") return renderExamSession(plan);
  if (session.kind === "management") return renderChecklistSession("管综训练", ["数学基础题 30-45 分钟", "逻辑题型训练 30-45 分钟", "整理错题和错因"], "management");
  if (session.kind === "review") return renderReviewSession(plan);
}

function requiredMemoryCount(type) {
  return type === "phrase" ? PHRASE_DAILY_TARGET : WORD_DAILY_TARGET;
}

function memoryLog(plan, id, type) {
  plan.logs[id] = {
    type,
    result: "learning",
    knownCount: Number(plan.logs[id]?.knownCount || 0),
    misses: Number(plan.logs[id]?.misses || 0),
    at: plan.logs[id]?.at || new Date().toISOString()
  };
  return plan.logs[id];
}

function remainingMemoryIds(ids, type) {
  const plan = getPlan();
  const target = requiredMemoryCount(type);
  return unique(ids).filter((id) => Number(plan.logs?.[id]?.knownCount || 0) < target);
}

function remainingMemoryCount(type) {
  const plan = getPlan();
  return remainingMemoryIds(type === "phrase" ? plan.phraseIds : plan.wordIds, type).length;
}

function todayMemoryCount(id) {
  return Number(getPlan().logs?.[id]?.knownCount || 0);
}

function renderWordSession() {
  $("#studyKicker").textContent = "单词";
  if (!session.queue.length || session.index >= session.queue.length) {
    markTaskDone("vocab");
    renderDone("这一组单词完成了。");
    return;
  }

  const id = session.queue[session.index];
  const word = getWord(id);
  const actionState = session.revealed ? "" : "disabled aria-disabled=\"true\"";
  const remaining = session.practiceOnly ? Math.max(0, session.queue.length - session.index) : remainingMemoryCount("word");
  $("#studyTitle").textContent = `单词 · 剩余 ${remaining}`;
  $("#studyBody").innerHTML = `
    <article class="momo-card memory-card word-card">
      <div class="momo-top">
        <div class="memory-meta-row">
          <span class="memory-type">单词</span>
          <span class="momo-progress">今日 ${Math.min(todayMemoryCount(id), WORD_DAILY_TARGET)}/${WORD_DAILY_TARGET}</span>
        </div>
        <h2 data-speak="${escapeAttr(word.term)}">${escapeHtml(word.term)}</h2>
        <div class="speaker-line">
          <span>美</span>
          <span>${escapeHtml(word.ipa || "")}</span>
        </div>
      </div>
      <div class="momo-middle" id="revealButton" role="button" tabindex="0">
        ${session.revealed ? renderWordAnswer(word) : `<div class="tap-hint">点击看答案</div>`}
      </div>
      <div class="momo-actions">
        <button class="answer-button known" type="button" data-result="known" ${actionState}>认识</button>
        <button class="answer-button unknown" type="button" data-result="unknown" ${actionState}>不认识</button>
      </div>
    </article>
  `;
  $("#revealButton").addEventListener("click", () => {
    if (!session.revealed) {
      session.revealed = true;
      renderSession();
      speak(word.term, "en-US");
    }
  });
  $("#revealButton").addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !session.revealed) {
      event.preventDefault();
      session.revealed = true;
      renderSession();
      speak(word.term, "en-US");
    }
  });
  $$("[data-result]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!session.revealed) {
        session.revealed = true;
        renderSession();
        speak(word.term, "en-US");
        return;
      }
      handleMemoryResult(id, button.dataset.result, "word");
    });
  });
}

function renderWordAnswer(word) {
  return `
    <div class="answer-panel">
      <h3>${escapeHtml(word.meaning || "释义待补充")}</h3>
      <p><strong>词性：</strong>${escapeHtml(formatPartOfSpeech(word.pos))}</p>
      <p><strong>考研高频考法：</strong>${renderLookupText(word.exam || "结合真题语境记忆。", word.term)}</p>
      <p><strong>例句：</strong>${renderLookupText(word.sentence || "", word.term)}</p>
      <p><strong>翻译：</strong>${escapeHtml(word.translation || "暂无中文翻译")}</p>
      <p><strong>助记：</strong>${escapeHtml(word.memory || "今天先做到会读、会认、能在句子里理解。")}</p>
    </div>
  `;
}

function renderPhraseSession() {
  $("#studyKicker").textContent = "短语";
  if (!session.queue.length || session.index >= session.queue.length) {
    markTaskDone("phrases");
    renderDone("这一组短语完成了。");
    return;
  }

  const id = session.queue[session.index];
  const phrase = getPhrase(id);
  const actionState = session.revealed ? "" : "disabled aria-disabled=\"true\"";
  const remaining = session.practiceOnly ? Math.max(0, session.queue.length - session.index) : remainingMemoryCount("phrase");
  $("#studyTitle").textContent = `短语 · 剩余 ${remaining}`;
  $("#studyBody").innerHTML = `
    <article class="momo-card memory-card phrase-card">
      <div class="momo-top">
        <div class="memory-meta-row">
          <span class="memory-type">短语</span>
          <span class="momo-progress">今日 ${Math.min(todayMemoryCount(id), PHRASE_DAILY_TARGET)}/${PHRASE_DAILY_TARGET}</span>
        </div>
        <h2 data-speak="${escapeAttr(phrase.phrase)}">${escapeHtml(phrase.phrase)}</h2>
        ${phrase.examFrequency ? `<span class="phrase-frequency top-frequency">真题 ${escapeHtml(phrase.examFrequency)} 次</span>` : ""}
      </div>
      <div class="momo-middle" id="revealButton" role="button" tabindex="0">
        ${session.revealed ? renderPhraseAnswer(phrase) : `<div class="tap-hint">点击看答案</div>`}
      </div>
      <div class="momo-actions">
        <button class="answer-button known" type="button" data-result="known" ${actionState}>认识</button>
        <button class="answer-button unknown" type="button" data-result="unknown" ${actionState}>不认识</button>
      </div>
    </article>
  `;
  $("#revealButton").addEventListener("click", () => {
    if (!session.revealed) {
      session.revealed = true;
      renderSession();
      setTimeout(() => speak(phrase.phrase, guessLang(phrase.phrase)), 0);
    }
  });
  $("#revealButton").addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !session.revealed) {
      event.preventDefault();
      session.revealed = true;
      renderSession();
      setTimeout(() => speak(phrase.phrase, guessLang(phrase.phrase)), 0);
    }
  });
  $$("[data-result]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!session.revealed) {
        session.revealed = true;
        renderSession();
        setTimeout(() => speak(phrase.phrase, guessLang(phrase.phrase)), 0);
        return;
      }
      handleMemoryResult(id, button.dataset.result, "phrase");
    });
  });
}

function renderPhraseAnswer(phrase) {
  const details = getPhraseDisplayDetails(phrase);
  return `
    <div class="answer-panel">
      <div class="answer-title-row">
        <h3>${escapeHtml(details.meaning)}</h3>
      </div>
      <p><strong>例句：</strong>${renderLookupText(details.example, phrase.phrase)}</p>
      <p><strong>翻译：</strong>${escapeHtml(details.translation)}</p>
    </div>
  `;
}

function formatPartOfSpeech(pos) {
  const raw = String(pos || "").trim();
  if (!raw) return "待补充";
  const key = raw.toLowerCase().replace(/\s+/g, "");
  const map = {
    "v.": "动词",
    "vi.": "不及物动词",
    "vt.": "及物动词",
    "n.": "名词",
    "adj.": "形容词",
    "adv.": "副词",
    "prep.": "介词",
    "conj.": "连词",
    "pron.": "代词",
    "num.": "数词",
    "phr.": "短语"
  };
  const label = map[key] || map[key.replace(/;.*$/, "")] || "";
  return label ? `${label}（${raw}）` : raw;
}

function getPhraseDisplayDetails(phrase) {
  const key = normalizePhraseKey(phrase.phrase);
  const fallback = commonPhraseDetails[key] || {};
  const meaning = isWeakPhraseField(phrase.meaning, phrase.phrase)
    ? fallback.meaning || phrase.meaning || "释义待补充"
    : phrase.meaning;
  const example = isWeakPhraseField(phrase.example, phrase.phrase)
    ? fallback.example || `Try to use "${phrase.phrase}" in one complete sentence.`
    : phrase.example;
  const translation = isWeakPhraseField(phrase.translation, phrase.phrase)
    ? fallback.translation || "译文待补充。"
    : phrase.translation;
  const source = phrase.source && !phrase.source.includes("本地短语资料")
    ? phrase.source
    : "真题频次整理";
  return { meaning, example, translation, source };
}

function normalizePhraseKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isWeakPhraseField(value, phrase) {
  const text = String(value || "").trim();
  if (!text) return true;
  const phraseKey = normalizePhraseKey(phrase);
  const lower = text.toLowerCase();
  return lower === phraseKey
    || lower.endsWith(`${phraseKey}.`)
    || lower.includes("try to use")
    || lower.includes("this phrase appears in the exam corpus")
    || text.includes("真题高频短语")
    || text.includes("OCR")
    || text.includes("这个短语来自本地真题语料")
    || text.includes("先认读，再回到原文理解");
}

function writingPracticeLines(lesson, words, phrases) {
  if (Array.isArray(lesson.practiceLines) && lesson.practiceLines.length) {
    return lesson.practiceLines.map((line, index) => ({
      label: line.label || `${paragraphName(index)}：仿写训练`,
      cn: line.cn || "先理解句子功能，再替换题干关键词。",
      en: line.en || lesson.model || lesson.pattern || "",
      structure: line.structure || "模板句 + 题干关键词 + 具体内容"
    }));
  }
  const materialWord = words.find((word) => word?.term)?.term || "practice";
  const materialPhrase = phrases.find((phrase) => phrase?.phrase)?.phrase || "in this regard";
  const baseSentence = lesson.model || lesson.pattern || "I am writing to offer my suggestions.";
  const patternSentence = (lesson.pattern || baseSentence)
    .replace(/\.\.\./g, materialPhrase)
    .replace(/\s+$/, "");
  const secondSentence = patternSentence === baseSentence
    ? `I suggest that you pay attention to ${materialPhrase} and keep practicing ${materialWord}.`
    : patternSentence;
  return [
    {
      label: `${paragraphName(0)}：${lesson.structure?.[0] || "说明写作目的"}`,
      cn: "本句用于开头，直接交代写信目的或回应题干要求，不展开细节。",
      en: baseSentence,
      structure: "I am writing to + 动词原形 + 具体目的。"
    },
    {
      label: `${paragraphName(1)}：${lesson.structure?.[1] || "展开主体内容"}`,
      cn: `本句用于主体段，把 ${materialPhrase} 和 ${materialWord} 放进一个具体建议或安排里。`,
      en: secondSentence,
      structure: "I suggest that + 主语 + 动词短语；and 连接第二个并列动作。"
    }
  ];
}

function writingStructureHint(lesson, index) {
  const subtype = lesson.subtype || lesson.type || "作文";
  const structure = Array.isArray(lesson.structure) ? lesson.structure[index] || lesson.structure[0] : "";
  if (lesson.phase === "truth") return "先判断题型和收信人，再按题干要求补齐目的、要点和结尾。";
  if (index === 0) return `${subtype}开头句：写信目的 + 具体动作。${structure ? `对应：${structure}` : ""}`;
  return `${subtype}主体句：连接词 + 建议/原因/安排 + 具体名词。`;
}

function handleMemoryResult(id, result, type) {
  const plan = getPlan();
  const target = requiredMemoryCount(type);
  const log = memoryLog(plan, id, type);
  if (result === "unknown") {
    session.failCounts[id] = Number(session.failCounts[id] || 0) + 1;
    log.misses += 1;
    log.at = new Date().toISOString();
    const insertAt = Math.min(session.index + UNKNOWN_REAPPEAR_AFTER + 1, session.queue.length);
    session.queue.splice(insertAt, 0, id);
    session.index += 1;
    session.revealed = false;
    saveState();
    renderSession();
    return;
  }

  log.knownCount += 1;
  log.at = new Date().toISOString();
  log.result = log.knownCount >= target ? "known" : "learning";
  if (log.knownCount >= target) {
    if (type === "word") markWordKnown(id, log.misses);
    if (type === "phrase") markPhraseKnown(id, log.misses);
    session.queue = session.queue.filter((item, index) => index <= session.index || item !== id);
  } else {
    const insertAt = Math.min(session.index + UNKNOWN_REAPPEAR_AFTER + 1, session.queue.length);
    session.queue.splice(insertAt, 0, id);
  }
  session.index += 1;
  session.revealed = false;
  saveState();
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
  const log = getPlan().logs[id] || {};
  getPlan().logs[id] = { ...log, type: "word", result: "known", knownCount: Math.max(Number(log.knownCount || 0), WORD_DAILY_TARGET), misses, at: new Date().toISOString() };
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
  const log = getPlan().logs[id] || {};
  getPlan().logs[id] = { ...log, type: "phrase", result: "known", knownCount: Math.max(Number(log.knownCount || 0), PHRASE_DAILY_TARGET), misses, at: new Date().toISOString() };
  saveState();
}

function getGrammarLessonsForDay(plan) {
  const dayIndex = Number(plan.lessonIndex || 0);
  if (dayIndex < 7) {
    const start = dayIndex * 2;
    return [0, 1].map((offset) => simpleGrammarLessons[(start + offset) % simpleGrammarLessons.length]);
  }
  const truthLessons = grammarLessons.length ? grammarLessons : simpleGrammarLessons;
  const start = (dayIndex - 7) * 2;
  return [0, 1].map((offset) => truthLessons[(start + offset) % truthLessons.length]);
}

function renderGrammarSession(plan) {
  const lessons = getGrammarLessonsForDay(plan);
  const isSimpleWeek = Number(plan.lessonIndex || 0) < 7;
  $("#studyKicker").textContent = isSimpleWeek ? "第 1 周 · 简单句" : "真题长难句";
  $("#studyTitle").textContent = "语法课 · 每天 2 句";
  $("#studyBody").innerHTML = `
    <div class="grammar-lesson-stack">
      ${lessons.map((lesson, index) => `
        <article class="lesson-card grammar-lesson-card">
          <p class="tiny-label">${isSimpleWeek ? "简单句基础" : "真题长难句"} · 第 ${index + 1} 句，点击任意单词可查义和朗读</p>
          <p class="lesson-sentence">${renderLookupText(lesson.sentence)}</p>
          <p class="body-text"><strong>中文翻译：</strong>${escapeHtml(lesson.translation)}</p>
          <div class="tag-list">${(lesson.labels || []).map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("")}</div>
          <p class="body-text">${escapeHtml(lesson.explanation || "")}</p>
          <p class="body-text"><strong>仿写句：</strong>${renderLookupText(lesson.writing || "")}</p>
          ${canvasPanel(`grammar-${index}`, "手写拆句和翻译")}
        </article>
      `).join("")}
    </div>
  `;
  lessons.forEach((_, index) => setupCanvas(`grammar-${index}`, "grammar"));
}

function renderTranslationSession(plan) {
  const lesson = grammarLessons[plan.lessonIndex % grammarLessons.length];
  const source = plan.truthTraining?.sourceSentence || lesson.sentence;
  const translation = plan.truthTraining?.translation || lesson.translation;
  const focus = session.translationFocus || "";
  $("#studyKicker").textContent = "翻译训练";
  $("#studyTitle").textContent = "拆句到成文";
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <p class="lesson-sentence">${renderTranslationSentence(source, lesson, focus)}${focus === "translation" ? `<span class="translation-inline">${escapeHtml(translation || "译文待补充。")}</span>` : ""}</p>
      <div class="writing-steps translation-steps">
        <button class="writing-step ${focus === "predicate" ? "active" : ""}" type="button" data-translation-focus="predicate"><strong>找谓语</strong></button>
        <button class="writing-step ${focus === "main" ? "active" : ""}" type="button" data-translation-focus="main"><strong>抓主干</strong></button>
        <button class="writing-step ${focus === "modifier" ? "active" : ""}" type="button" data-translation-focus="modifier"><strong>拆修饰</strong></button>
        <button class="writing-step ${focus === "translation" ? "active" : ""}" type="button" data-translation-focus="translation"><strong>通顺译</strong></button>
      </div>
    </article>
    ${canvasPanel("translation", "手写译文")}
  `;
  $$("[data-translation-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      session.translationFocus = button.dataset.translationFocus;
      renderSession();
    });
  });
  setupCanvas("translation");
}

function renderTranslationSentence(source, lesson, focus) {
  const text = String(source || "");
  if (focus === "translation") return renderLookupText(text);
  if (focus === "main") return `<span class="sentence-focus">${renderLookupText(text)}</span>`;
  const labels = lesson.labels || [];
  let target = "";
  if (focus === "predicate") {
    target = getLabelValue(labels, ["谓语", "系动词"]);
  } else if (focus === "modifier") {
    target = labels.map((label) => String(label).split("：")[1] || "").filter(Boolean).slice(1).join(" ");
  }
  return renderSentenceWithFocus(text, target);
}

function getLabelValue(labels, names) {
  const item = labels.find((label) => names.some((name) => String(label).startsWith(`${name}：`)));
  return item ? String(item).split("：").slice(1).join("：").trim() : "";
}

function renderSentenceWithFocus(text, target) {
  const source = String(text || "");
  const needle = String(target || "").trim();
  if (!needle) return renderLookupText(source);
  const range = findTextRange(source, needle)?.[0] || findTextRange(source, needle.split(/\s+/)[0])?.[0];
  if (!range) return renderLookupText(source);
  return `${renderLookupText(source.slice(0, range.start))}<span class="sentence-focus">${renderLookupText(source.slice(range.start, range.end))}</span>${renderLookupText(source.slice(range.end))}`;
}

function renderWritingSession(plan) {
  const lesson = writingLessons[plan.writingIndex % writingLessons.length];
  const words = plan.wordIds.slice(0, 5).map(getWord);
  const phrases = plan.phraseIds.slice(0, 3).map(getPhrase);
  const practiceLines = writingPracticeLines(lesson, words, phrases);
  $("#studyKicker").textContent = lesson.title;
  $("#studyTitle").textContent = lesson.phase === "truth" ? "真题写作整篇训练" : `${lesson.type || "写作"}：${lesson.subtype || "结构课"}`;
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <p class="tiny-label">${lesson.phase === "truth" ? "9 月后按真题题干整篇训练" : "先判断类型，再拆段落，最后写句子"}</p>
      <div class="writing-steps">
        <div class="writing-step writing-structure-card"><strong>作文结构</strong><p class="body-text">${lesson.structure.map((item, index) => `${paragraphName(index)}：${escapeHtml(item)}`).join(" → ")}</p></div>
      </div>
      <div class="writing-practice-list">
        ${practiceLines.map((line, index) => `
          <section class="writing-practice-card">
            <p class="tiny-label">${escapeHtml(line.label)}</p>
            <p class="body-text"><strong>句子解析：</strong>${escapeHtml(line.cn)}</p>
            <p class="body-text"><strong>句子结构：</strong>${escapeHtml(line.structure)}</p>
            <p class="lesson-sentence">${renderLookupText(line.en)}</p>
            ${canvasPanel(`writing-${index}`, "手写仿写")}
          </section>
        `).join("")}
      </div>
      <p class="body-text"><strong>今日素材：</strong>${words.map((word) => `<span class="speakable" data-speak="${escapeAttr(word.term)}">${escapeHtml(word.term)}</span>`).join("、")} ${phrases.map((phrase) => `<span class="speakable" data-speak="${escapeAttr(phrase.phrase)}">${escapeHtml(phrase.phrase)}</span>`).join("、")}</p>
      <button id="deepSeekButton" class="small-button ${lesson.phase === "truth" ? "" : "hidden"}" type="button">用 DeepSeek 批改真题写作</button>
      <div id="deepSeekOutput" class="body-text"></div>
    </article>
  `;
  $("#deepSeekButton").addEventListener("click", () => generateDeepSeekWriting(lesson, words, phrases));
  practiceLines.forEach((_, index) => setupCanvas(`writing-${index}`, "writing"));
}

function renderWritingSession(plan) {
  const lesson = writingLessons[plan.writingIndex % writingLessons.length];
  const practiceLines = writingPracticeLines(lesson, [], []).slice(0, Number(lesson.dailySentenceLimit || 2));
  $("#studyKicker").textContent = lesson.title;
  $("#studyTitle").textContent = lesson.subtype || lesson.title || "大作文模板";
  $("#studyBody").innerHTML = `
    <article class="lesson-card writing-minimal-card">
      <div class="writing-template-head">
        <p class="tiny-label">${escapeHtml(lesson.type || "写作")} · ${escapeHtml(lesson.subtype || "模板")}</p>
        <h2>${escapeHtml(lesson.subtype || lesson.title || "大作文模板")}</h2>
      </div>
      <div class="writing-sentence-stack">
        ${practiceLines.map((line, index) => `
          <section class="writing-sentence-card">
            <p class="tiny-label">${escapeHtml(line.label || `第 ${index + 1} 句`)}</p>
            <p class="lesson-sentence">${renderLookupText(line.en)}</p>
            <p class="body-text"><strong>中文翻译：</strong>${escapeHtml(line.cn || "")}</p>
            <button class="sentence-speak-button" type="button" data-speak="${escapeAttr(line.en || "")}" aria-label="朗读整句">
              <span aria-hidden="true">🔊</span>
              <strong>朗读整句</strong>
            </button>
            ${canvasPanel(`writing-${index}`, "手写背诵")}
          </section>
        `).join("")}
      </div>
    </article>
  `;
  practiceLines.forEach((_, index) => setupCanvas(`writing-${index}`, "writing"));
}

function paragraphName(index) {
  return ["第一段", "第二段", "第三段", "第四段"][index] || `第 ${index + 1} 段`;
}

function formatParagraphStructure(item, index) {
  const text = String(item || "");
  if (/^第[一二三四五六七八九十]+[段句层步]/.test(text)) return escapeHtml(text);
  return `${paragraphName(index)}：${escapeHtml(text)}`;
}

function isAnalysisExamTraining(training) {
  return Boolean(examAnalysis && training?.source === "analysisProcessed");
}

async function renderAnalysisExamSession(plan, training) {
  const studyToken = `${training.year}-${training.id}-${Date.now()}`;
  session.exam.studyToken = studyToken;
  $("#studyKicker").textContent = `${training.year} 英语二`;
  $("#studyTitle").textContent = training.title || training.short || "真题训练";
  $("#studyBody").innerHTML = `
    <article class="exam-shell">
      <div class="exam-toolbar">
        <div>
          <p class="tiny-label">${escapeHtml(training.year)} ${escapeHtml(training.short || "")}</p>
          <h3>${escapeHtml(training.title || "真题训练")}</h3>
        </div>
        <span class="pill">读取中</span>
      </div>
      <section class="panel compact-panel">
        <p class="body-text">正在读取本地 JSON...</p>
      </section>
    </article>
  `;

  let questions = [];
  try {
    questions = await examAnalysis.getSectionQuestions(training.year, training.id);
    if (training.id === "readingPartA" && Number(training.textNo || 0)) {
      questions = questions.filter((question) => Number(question.textNo || 0) === Number(training.textNo));
    }
    if (training.id === "writing" && Number(training.textNo || 0)) {
      questions = questions.filter((question) => Number(question.questionNo || 0) === Number(training.textNo));
    }
  } catch (error) {
    console.error(error);
    if (session?.exam?.studyToken !== studyToken) return;
    $("#studyBody").innerHTML = `
      <article class="exam-shell">
        <section class="panel compact-panel">
          <h3>数据读取失败</h3>
          <p class="body-text">没有读到 ${escapeHtml(training.year)} ${escapeHtml(training.short || training.id)} 的 JSON 数据。</p>
        </section>
      </article>
    `;
    return;
  }
  if (session?.exam?.studyToken !== studyToken) return;

  const savedProgress = getAnalysisSectionProgress(training.year, training.id, Number(training.textNo || 0));
  if (!session.exam.loadedFromProgress) {
    session.exam.answers = { ...(savedProgress.answers || {}), ...(session.exam.answers || {}) };
    session.exam.submitted = Boolean(savedProgress.submitted || session.exam.submitted);
    session.exam.score = Number(savedProgress.score || session.exam.score || 0);
    session.exam.loadedFromProgress = true;
  }

  const objectiveQuestions = questions.filter((question) => question.kind === "objective");
  const answered = questions.filter((question) => question.kind !== "objective" ? Boolean(session.exam.submitted) : Boolean(session.exam.answers[question.id])).length;
  const elapsed = formatDuration(Date.now() - Number(session.exam.startedAt || Date.now()));
  const report = session.exam.submitted ? renderAnalysisExamReport(questions) : "";
  const showsNotes = training.id === "translation";

  $("#studyBody").innerHTML = `
    <article class="exam-shell analysis-exam-shell ${session.exam.submitted ? "submitted-exam-shell" : ""}">
      <div class="exam-toolbar">
        <div>
          <p class="tiny-label">${escapeHtml(training.year)} 英语二</p>
          <h3>${escapeHtml(training.title || "真题训练")}</h3>
        </div>
        <div class="exam-actions">
          <span class="pill">${elapsed}</span>
          <span class="pill">${answered}/${questions.length}</span>
          <button id="submitExamButton" class="small-button" type="button">${session.exam.submitted ? "错题重做" : "交卷看解析"}</button>
        </div>
      </div>

      ${report}
      ${training.id === "writing" && session.exam.submitted ? `
        <section class="exam-analysis writing-review-panel">
          <div class="panel-row">
            <h3>作文批改</h3>
            <button id="deepSeekWritingReviewButton" class="small-button" type="button">DeepSeek 批改作文</button>
          </div>
          <p class="body-text">提交后可批改小作文和大作文：结构、要点覆盖、语法、用词、替换建议和提分版。</p>
          <div id="deepSeekOutput" class="body-text"></div>
        </section>
      ` : ""}
      <div class="exam-layout ${showsNotes ? "notes-only-layout" : ""}">
        <section class="exam-paper">
          ${renderAnalysisPaper(training, questions)}
        </section>
      </div>
      ${showsNotes ? `
        <section class="exam-notes-panel">
          <textarea id="examNotes" rows="10" placeholder="在这里作答">${escapeHtml(session.exam.notes || "")}</textarea>
        </section>
      ` : ""}
    </article>
    ${needsAnalysisCanvas(training, questions) ? canvasPanel("exam", training.id === "writing" ? "手写真题作文" : "手写译文") : ""}
  `;
  bindAnalysisExamEvents(plan, training, questions, objectiveQuestions);
  $("#deepSeekWritingReviewButton")?.addEventListener("click", () => generateDeepSeekWritingReview(training));
  if (needsAnalysisCanvas(training, questions)) setupCanvas("exam", "exam-draft");
}

function renderAnalysisPaper(training, questions) {
  if (training.id === "readingPartA") return renderReadingPartAPaper(questions);
  if (training.id === "useOfEnglish") return renderUseOfEnglishPaper(questions);
  if (training.id === "readingPartB") return renderReadingPartBPaper(questions);
  if (training.id === "writing") return renderWritingPaper(questions);
  return questions.map((question, index) => renderAnalysisQuestionV2(question, index)).join("");
}

function getObjectiveQuestionsSorted(questions) {
  return [...questions].filter((question) => question.kind === "objective").sort((a, b) => a.questionNo - b.questionNo);
}

function getActiveExamQuestion(questions) {
  const sorted = getObjectiveQuestionsSorted(questions);
  if (!sorted.length) return null;
  const saved = sorted.find((question) => question.id === session.exam.activeQuestionId);
  if (saved) return saved;
  const partB = sorted.find((question) => question.id === session.exam.partBActiveQuestion);
  if (partB) {
    session.exam.activeQuestionId = partB.id;
    return partB;
  }
  const firstUnanswered = sorted.find((question) => !session.exam.answers[question.id]) || sorted[0];
  session.exam.activeQuestionId = firstUnanswered.id;
  return firstUnanswered;
}

function getActiveExamQuestionIndex(questions) {
  const sorted = getObjectiveQuestionsSorted(questions);
  const active = getActiveExamQuestion(questions);
  return Math.max(0, sorted.findIndex((question) => question.id === active?.id));
}

function renderExamDrawerHandle(questions) {
  const collapsed = Boolean(session.exam.drawerCollapsed);
  const active = getActiveExamQuestion(questions);
  const label = collapsed ? "展开题目" : "收起题目";
  return `
    <button class="exam-drawer-handle" type="button" data-toggle-exam-drawer aria-label="${label}" aria-expanded="${collapsed ? "false" : "true"}">
      <span aria-hidden="true"></span>
      <b>${active ? `${escapeHtml(active.questionNo)} 题` : "题目"}</b>
    </button>
  `;
}

function examDrawerClass(questions) {
  getActiveExamQuestion(questions);
  return `exam-question-drawer ${session.exam.drawerCollapsed ? "collapsed" : ""}`;
}

function renderActiveQuestionList(questions, extraClass = "") {
  const active = getActiveExamQuestion(questions);
  if (!active) return "";
  return `
    <div class="exam-question-list current-question-list ${extraClass}">
      ${renderAnalysisQuestionCompact(active)}
    </div>
  `;
}

function renderWritingPaper(questions) {
  const sorted = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  return `
    <div class="writing-paper">
      ${sorted.map((question) => `
        <article id="exam-${escapeAttr(question.id)}" class="exam-question analysis-question writing-question">
          ${renderAnalysisQuestionPrompt(question)}
          ${renderWritingAsset(question)}
          <label class="writing-answer-field">
            <span>${question.questionNo === 47 ? "小作文作答" : "大作文作答"}</span>
            <textarea data-writing-answer="${escapeAttr(question.questionNo)}" rows="${question.questionNo === 47 ? 8 : 12}" placeholder="${question.questionNo === 47 ? "在这里写小作文" : "在这里写大作文"}">${escapeHtml(getWritingDraft(question.questionNo))}</textarea>
          </label>
        </article>
      `).join("")}
    </div>
  `;
}

function renderReadingPartAPaper(questions) {
  const groups = new Map();
  questions.forEach((question) => {
    const key = Number(question.textNo || 0) || Math.ceil((Number(question.questionNo || 21) - 20) / 5);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(question);
  });
  return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]).map(([textNo, group]) => {
    const sorted = group.sort((a, b) => a.questionNo - b.questionNo);
    const first = sorted[0];
    const start = sorted[0]?.questionNo || 0;
    const end = sorted[sorted.length - 1]?.questionNo || start;
    return `
      <article class="exam-text-panel reading-part-panel" id="exam-text-${textNo}">
        <header class="exam-text-head">
          <div>
            <p class="tiny-label">${escapeHtml(first?.year || "")} 阅读理解 A</p>
            <h3>Text ${textNo}</h3>
          </div>
          <span class="pill">${start}-${end} 题</span>
        </header>
        <div class="exam-text-layout">
          <section class="exam-passage analysis-source exam-text-passage">
            <h4>原文 / 文章</h4>
            <div class="analysis-passage-body">${renderHighlightedPassageForQuestions(sorted)}</div>
          </section>
          <section class="${examDrawerClass(sorted)}">
            ${renderExamDrawerHandle(sorted)}
            ${renderQuestionDrawerHeader(sorted, "MBA 大师题库")}
            ${renderActiveQuestionList(sorted)}
          </section>
        </div>
      </article>
    `;
  }).join("");
}

function renderUseOfEnglishPaper(questions) {
  const sorted = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  const first = sorted[0];
  return `
    <article class="exam-text-panel use-cloze-panel">
      <header class="exam-text-head">
        <div>
          <p class="tiny-label">${escapeHtml(first?.year || "")} Section I</p>
          <h3>完形填空</h3>
        </div>
        <span class="pill">1-20 空</span>
      </header>
      <div class="exam-text-layout">
        <section class="exam-passage analysis-source exam-text-passage">
          <h4>原文 / 文章</h4>
          <div class="analysis-passage-body">${renderClozePassage(first || {}, sorted)}</div>
        </section>
        <section class="${examDrawerClass(sorted)}">
          ${renderExamDrawerHandle(sorted)}
          ${renderQuestionDrawerHeader(sorted, "MBA 大师题库")}
          ${renderActiveQuestionList(sorted, "cloze-question-list")}
        </section>
      </div>
    </article>
  `;
}

function renderReadingPartBPaper(questions) {
  const sorted = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  const first = sorted[0] || {};
  const start = sorted[0]?.questionNo || 41;
  const end = sorted[sorted.length - 1]?.questionNo || 45;
  return `
    <article class="exam-text-panel reading-part-b-panel" id="exam-text-part-b">
      <header class="exam-text-head">
        <div>
          <p class="tiny-label">${escapeHtml(first.year || "")} 阅读理解 B</p>
          <h3>新题型</h3>
        </div>
        <span class="pill">${start}-${end} 题</span>
      </header>
      <div class="exam-text-layout">
        <section class="exam-passage analysis-source exam-text-passage">
          <h4>原文 / 文章</h4>
          <div class="analysis-passage-body">${renderPartBPaperBody(sorted)}</div>
        </section>
        <section class="${examDrawerClass(sorted)}">
          ${renderExamDrawerHandle(sorted)}
          ${renderQuestionDrawerHeader(sorted, "MBA 大师题库")}
          ${renderPartBAnswerGrid(sorted)}
          ${renderActiveQuestionList(sorted, "part-b-question-list")}
        </section>
      </div>
    </article>
  `;
}

function renderPartBPaperBody(questions) {
  const first = questions[0] || {};
  const layout = first.partBLayout || inferPartBLayoutFromQuestions(questions);
  if (layout === "matching-table") return renderPartBMatchingPaper(questions);
  if (layout === "true-false") return renderPartBTrueFalsePaper(questions);
  return renderPartBSubheadingPaper(questions);
}

function inferPartBLayoutFromQuestions(questions) {
  const answers = questions.map((question) => question.officialAnswer || "");
  if (answers.length && answers.every((answer) => /^[TF]$/.test(answer))) return "true-false";
  const stems = questions.map((question) => question.stem || "").join(" ");
  if (!/_{2,}/.test(stems) && questions.every((question) => String(question.stem || "").length < 80)) return "matching-table";
  return "subheading";
}

function renderPartBSubheadingPaper(questions) {
  const options = questions.find((question) => question.options?.length)?.options || [];
  return `
    <div class="part-b-paper part-b-subheading-paper">
      <div class="part-b-passage-flow">
        ${renderPartBParagraphFlow(questions)}
      </div>
      ${renderPartBOptionList(options, questions)}
    </div>
  `;
}

function renderPartBMatchingPaper(questions) {
  const sorted = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  const options = sorted.find((question) => question.options?.length)?.options || [];
  return `
    <div class="part-b-paper part-b-matching-paper">
      <div class="part-b-passage-flow">${renderPartBPlainParagraphs(sorted)}</div>
      <table class="part-b-match-table">
        <tbody>
          ${renderPartBMatchRows(sorted, options)}
        </tbody>
      </table>
    </div>
  `;
}

function renderPartBTrueFalsePaper(questions) {
  const sorted = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  return `
    <div class="part-b-paper part-b-truefalse-paper">
      <div class="part-b-passage-flow">${renderPartBPlainParagraphs(sorted)}</div>
      <div class="part-b-statement-list">
        ${sorted.map((question) => {
          const selected = session.exam.answers[question.id] || "";
          return `
            <article class="part-b-statement">
              <button type="button" data-part-b-target="${escapeAttr(question.id)}">${escapeHtml(question.questionNo)}.</button>
              <p>${renderLookupText(String(question.stem || "").replace(/^4[1-5]\.\s*/, ""))}</p>
              <div>
                ${["T", "F"].map((key) => `
                  <button class="${selected === key ? "selected" : ""}" type="button" data-answer-question="${escapeAttr(question.id)}" data-answer="${key}">${key}</button>
                `).join("")}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderPartBOptionList(options, questions) {
  const activeId = getActivePartBQuestionId(questions);
  if (!options.length) return "";
  return `
    <div class="part-b-paper-options">
      ${options.map((option) => `
        <button type="button" data-answer-question="${escapeAttr(activeId)}" data-answer="${escapeAttr(option.key)}">
          <b>[${escapeHtml(option.key)}]</b>
          <span>${renderLookupText(option.text)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderPartBPlainParagraphs(questions) {
  const first = questions[0] || {};
  const paragraphs = first.paragraphs?.length ? first.paragraphs : [first.passage].filter(Boolean);
  return paragraphs.map((paragraph, index) => cleanPartBDisplayText(paragraph)).filter(Boolean).map((paragraph, index) => {
    const className = index === 0 && isPartBTitleParagraph(paragraph) ? "part-b-title" : "";
    return `<p class="${className}">${renderLookupText(paragraph)}</p>`;
  }).join("");
}

function renderPartBParagraphFlow(questions) {
  const first = questions[0] || {};
  const paragraphs = first.paragraphs?.length ? first.paragraphs : [first.passage].filter(Boolean);
  const displayParagraphs = getPartBDisplayParagraphs(paragraphs);
  return displayParagraphs.map((paragraph, index) => renderPartBParagraph(paragraph, index, questions)).join("");
}

function getPartBDisplayParagraphs(paragraphs) {
  const displayParagraphs = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const text = cleanPartBDisplayText(paragraphs[index]);
    if (!text) continue;
    if (/^4[1-5]\.?\s*(?:(?:_+|________)\.?)?\s*$/.test(text) && paragraphs[index + 1]) {
      const nextText = cleanPartBDisplayText(paragraphs[index + 1]);
      if (nextText) {
        displayParagraphs.push(`${text} ${nextText}`);
        index += 1;
        continue;
      }
    }
    displayParagraphs.push(text);
  }
  return displayParagraphs;
}

function cleanPartBDisplayText(value) {
  return String(value || "")
    .replace(/[\u4e00-\u9fff][\s\S]*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderPartBParagraph(paragraph, index, questions) {
  const text = String(paragraph || "").trim();
  const blankMatch = text.match(/^(4[1-5])\s*(?:[._＿—-]+\s*)?\.?\s*([\s\S]*)$/);
  if (blankMatch) {
    const questionNo = Number(blankMatch[1]);
    const question = questions.find((item) => Number(item.questionNo) === questionNo) || {};
    const selected = session.exam.answers[question.id] || "";
    const body = blankMatch[2].replace(/^_+\s*\.?\s*/, "").trim();
    return `
      <section class="part-b-blank-paragraph" id="exam-${escapeAttr(question.id || `part-b-${questionNo}`)}">
        <button class="${selected ? "answered" : ""}" type="button" data-part-b-target="${escapeAttr(question.id || "")}">
          <span>${escapeHtml(questionNo)}</span>
          <strong>${selected ? `[${escapeHtml(selected)}]` : "________"}</strong>
        </button>
        ${body ? `<p>${renderLookupText(body)}</p>` : ""}
      </section>
    `;
  }
  const className = index === 0 && isPartBTitleParagraph(text) ? "part-b-title" : "";
  return `<p class="${className}">${renderLookupText(text)}</p>`;
}

function renderPartBMatchRows(questions, options) {
  const sortedQuestions = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  const rowCount = Math.max(sortedQuestions.length, options.length);
  const activeId = getActivePartBQuestionId(sortedQuestions);
  return Array.from({ length: rowCount }, (_, index) => {
    const question = sortedQuestions[index];
    const option = options[index];
    const selected = question ? session.exam.answers[question.id] || "" : "";
    return `
      <tr>
        <td class="part-b-left-cell">
          ${question ? `
            <button class="${selected ? "answered" : ""}" type="button" data-part-b-target="${escapeAttr(question.id)}">
              <b>${escapeHtml(question.questionNo)}.</b>
              <span>${renderLookupText(String(question.stem || "").replace(/^4[1-5]\.\s*/, ""))}</span>
              ${selected ? `<em>[${escapeHtml(selected)}]</em>` : ""}
            </button>
          ` : ""}
        </td>
        <td class="part-b-right-cell">
          ${option ? `
            <button type="button" data-answer-question="${escapeAttr(activeId)}" data-answer="${escapeAttr(option.key)}">
              <b>[${escapeHtml(option.key)}]</b>
              <span>${renderLookupText(option.text)}</span>
            </button>
          ` : ""}
        </td>
      </tr>
    `;
  }).join("");
}

function isPartBTitleParagraph(paragraph) {
  const text = String(paragraph || "").trim();
  return text.length <= 140 && /^[A-Z0-9"“]/.test(text) && !/[.;:]$/.test(text);
}

function renderPartBAnswerGrid(questions) {
  const sorted = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  const activeId = getActivePartBQuestionId(sorted);
  return `
    <div class="part-b-answer-grid" aria-label="新题型答案区">
      ${sorted.map((question) => {
        const selected = session.exam.answers[question.id] || "";
        const submitted = Boolean(session.exam.submitted);
        const isCorrect = submitted && selected && selected === question.officialAnswer;
        const isWrong = submitted && selected && selected !== question.officialAnswer;
        return `
          <button class="${question.id === activeId ? "active" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}" type="button" data-part-b-target="${escapeAttr(question.id)}">
            <strong>${question.questionNo}</strong>
            <span>${escapeHtml(selected || "未选")}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderPartBOptionBank(questions) {
  const options = questions.find((question) => question.options?.length)?.options || [];
  const activeId = getActivePartBQuestionId(questions);
  if (!options.length) return "";
  return `
    <div class="part-b-option-bank" aria-label="新题型选项">
      ${options.map((option) => `
        <button type="button" data-answer-question="${escapeAttr(activeId)}" data-answer="${escapeAttr(option.key)}">
          <b>[${escapeHtml(option.key)}]</b>
          <span>${renderLookupText(option.text)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function getActivePartBQuestionId(questions) {
  const sorted = [...questions].sort((a, b) => a.questionNo - b.questionNo);
  const active = sorted.find((question) => question.id === session.exam.partBActiveQuestion);
  return (active || sorted.find((question) => !session.exam.answers[question.id]) || sorted[0] || {}).id || "";
}

function renderClozeOptionMatrix(questions) {
  return `
    <div class="cloze-option-matrix" aria-label="完形填空选项表">
      ${questions.map((question) => {
        const selected = session.exam.answers[question.id] || "";
        const submitted = Boolean(session.exam.submitted);
        return `
          <article class="cloze-option-row ${submitted ? "submitted" : ""}">
            <strong>${question.questionNo}.</strong>
            ${["A", "B", "C", "D"].map((key) => {
              const option = question.options.find((item) => item.key === key);
              if (!option) return `<span class="cloze-option-empty"></span>`;
              const isCorrect = submitted && key === question.officialAnswer;
              const isWrong = submitted && selected === key && key !== question.officialAnswer;
              return `
                <button class="${selected === key ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong-option" : ""}" type="button" data-answer-question="${escapeAttr(question.id)}" data-answer="${escapeAttr(key)}">
                  <b>[${escapeHtml(key)}]</b> <span>${renderLookupText(option.text)}</span>
                </button>
              `;
            }).join("")}
          </article>
          ${submitted ? renderClozeInlineAnalysis(question, selected) : ""}
        `;
      }).join("")}
    </div>
  `;
}

function renderClozeInlineAnalysis(question, selected) {
  const wrong = selected && question.officialAnswer && selected !== question.officialAnswer;
  return `
    <details class="cloze-inline-analysis ${wrong ? "wrong" : ""}">
      <summary>
        <span>${escapeHtml(question.questionNo)} 题解析</span>
        <strong>正确答案 ${escapeHtml(question.officialAnswer || "-")}</strong>
      </summary>
      ${renderAnalysisAnswerSummary(question, selected)}
      ${renderQuestionAnalysis(question)}
    </details>
  `;
}

function renderQuestionDrawerHeader(questions, sourceLabel = "") {
  const objective = questions.filter((question) => question.kind === "objective");
  const active = getActiveExamQuestion(questions) || objective[0] || questions[0];
  const currentIndex = Math.max(0, objective.findIndex((question) => question.id === active?.id));
  const total = objective.length || questions.length;
  return `
    <header class="exam-drawer-head">
      <div>
        <strong><span>${Math.max(1, currentIndex + 1)}</span>/${total}</strong>
      </div>
    </header>
  `;
}

function renderClozePassage(question, questions) {
  let html = escapeHtml((question.paragraphs?.length ? question.paragraphs.join("\n\n") : question.passage || ""));
  [...questions].sort((a, b) => b.questionNo - a.questionNo).forEach((item) => {
    const pattern = new RegExp(`(?<![A-Za-z0-9])${item.questionNo}(?![A-Za-z0-9%])`, "g");
    const selected = session.exam.answers[item.id] || "";
    const submitted = Boolean(session.exam.submitted);
    const stateClass = submitted
      ? selected === item.officialAnswer ? "correct" : selected ? "wrong" : "unanswered"
      : selected ? "selected" : "";
    const label = submitted ? `${item.questionNo}.${selected || "未作答"}` : `${item.questionNo}.`;
    html = html.replace(pattern, `<button class="cloze-blank ${stateClass}" type="button" data-jump-question="${escapeAttr(item.id)}">${escapeHtml(label)}</button>`);
  });
  return html.split(/\n{2,}/).map((paragraph) => `<p class="analysis-paragraph">${paragraph}</p>`).join("");
}

function renderAnalysisQuestionCompact(question) {
  const selected = session.exam.answers[question.id] || "";
  const submitted = Boolean(session.exam.submitted);
  const officialAnswer = question.officialAnswer || "";
  const isWrong = submitted && question.kind === "objective" && selected && officialAnswer && selected !== officialAnswer;
  const evidenceAnchor = submitted ? getFirstEvidenceAnchor(question) : "";
  const tag = question.section === "readingPartA" ? `Text ${question.textNo}` : "";
  return `
    <article id="exam-${escapeAttr(question.id)}" class="exam-question analysis-question compact-exam-question ${isWrong ? "wrong" : ""}" ${evidenceAnchor ? `data-jump-first-evidence="${escapeAttr(evidenceAnchor)}"` : ""}>
      <div class="exam-question-head">
        <span class="pill">${question.questionNo} 题</span>
        ${tag ? `<span class="exam-tag">${escapeHtml(tag)}</span>` : ""}
      </div>
      <p class="body-text question-stem"><strong>${question.questionNo}.</strong> ${renderAnnotatedQuestionStem(question)}</p>
      ${renderAnalysisOptions(question, selected, submitted)}
      ${submitted ? renderAnalysisAnswerSummary(question, selected) : ""}
      ${submitted ? renderQuestionAnalysis(question) : ""}
    </article>
  `;
}

function getFirstEvidenceAnchor(question) {
  const first = getEvidenceSentences(question)[0];
  if (!first) return "";
  return getEvidenceAnchorId(question, first.paragraphIndex || 1, first.index);
}

function renderAnalysisQuestion(question, index) {
  const selected = session.exam.answers[question.id] || "";
  const submitted = Boolean(session.exam.submitted);
  const officialAnswer = question.officialAnswer || "";
  const isWrong = submitted && question.kind === "objective" && selected && officialAnswer && selected !== officialAnswer;
  return `
    <article id="exam-${escapeAttr(question.id)}" class="exam-question analysis-question ${isWrong ? "wrong" : ""}">
      <div class="exam-question-head">
        <span class="pill">${question.questionNo} 题</span>
        <span class="exam-tag">${escapeHtml(question.sectionLabel)}${question.textNo ? ` Text ${question.textNo}` : ""}</span>
      </div>
      ${renderAnalysisQuestionSource(question)}
      <p class="body-text">${renderLookupText(question.stem || `第 ${question.questionNo} 题`)}</p>
      ${renderAnalysisOptions(question, selected, submitted)}
      ${renderWritingAsset(question)}
      ${submitted ? renderAnalysisAnswerSummary(question, selected) : ""}
      ${submitted ? renderQuestionAnalysis(question) : ""}
    </article>
  `;
}

function renderAnalysisQuestionV2(question, index) {
  const selected = session.exam.answers[question.id] || "";
  const submitted = Boolean(session.exam.submitted);
  const officialAnswer = question.officialAnswer || "";
  const isWrong = submitted && question.kind === "objective" && selected && officialAnswer && selected !== officialAnswer;
  return `
    <article id="exam-${escapeAttr(question.id)}" class="exam-question analysis-question ${isWrong ? "wrong" : ""}">
      <div class="exam-question-head">
        <span class="pill">${escapeHtml(getAnalysisQuestionTitle(question))}</span>
      </div>
      ${renderAnalysisQuestionSource(question)}
      ${renderAnalysisQuestionPrompt(question)}
      ${renderAnalysisOptions(question, selected, submitted)}
      ${renderWritingAsset(question)}
      ${submitted ? renderAnalysisAnswerSummary(question, selected) : ""}
      ${submitted ? renderQuestionAnalysis(question) : ""}
    </article>
  `;
}

function getWritingDraft(questionNo) {
  const notes = String(session.exam.notes || "");
  const marker = questionNo === 47 ? "【47 小作文】" : "【48 大作文】";
  const otherMarker = questionNo === 47 ? "【48 大作文】" : "【47 小作文】";
  const start = notes.indexOf(marker);
  if (start < 0) return "";
  const bodyStart = start + marker.length;
  const other = notes.indexOf(otherMarker, bodyStart);
  return notes.slice(bodyStart, other >= 0 ? other : notes.length).trim();
}

function setWritingDraft(questionNo, value) {
  const q47 = questionNo === 47 ? value : getWritingDraft(47);
  const q48 = questionNo === 48 ? value : getWritingDraft(48);
  session.exam.notes = [
    q47.trim() ? `【47 小作文】\n${q47.trim()}` : "",
    q48.trim() ? `【48 大作文】\n${q48.trim()}` : ""
  ].filter(Boolean).join("\n\n");
}

function getAnalysisQuestionTitle(question) {
  if (question.section === "writing") {
    return `${question.questionNo === 48 ? "Part B" : "Part A"} · ${question.questionNo}`;
  }
  return `${question.questionNo} 题`;
}

function renderAnalysisQuestionPrompt(question) {
  const stem = String(question.stem || "").trim();
  if (!stem) return "";
  if (question.section === "translation" && /^Translate the following text into Chinese\.?$/i.test(stem)) return "";
  if (question.section === "writing") {
    return `<div class="body-text writing-prompt">${renderExamPromptLines(stem)}</div>`;
  }
  const className = question.section === "writing" ? "body-text writing-prompt" : "body-text";
  return `<p class="${className}">${renderAnnotatedQuestionStem(question)}</p>`;
}

function renderExamPromptLines(value) {
  const text = formatExamPromptText(value);
  return text.split("\n").filter((line) => line.trim()).map((line) => (
    `<p>${renderLookupText(line.trim())}</p>`
  )).join("");
}

function formatExamPromptText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\b(Part\s+[AB])\s+(?=\d+\.\s*Directions)/gi, "$1\n")
    .replace(/\b(\d+\.\s*Directions[:：])\s*/gi, "$1\n")
    .replace(/(\d\))(?=\S)/g, "$1 ")
    .replace(/\s+(?=\d\)\s)/g, "\n")
    .replace(/;\s+(?=\d\)\s)/g, ";\n")
    .replace(/\.\s+(?=(?:You should|Write your|Do not|Use [“\"A-Z]|In your writing|In your essay)\b)/g, ".\n")
    .replace(/\)\s+(?=Do not|Use [“\"A-Z])/g, ")\n")
    .replace(/\s+\((10|15)\s+points?\)$/i, "\n($1 points)")
    .trim();
}

function renderAnnotatedQuestionStem(question) {
  const stem = question.stem || `第 ${question.questionNo} 题`;
  return renderAnnotatedLookupText(stem, [], session.exam.submitted ? getQuestionVocabularyTerms(question) : []);
}

function renderHighlightedPassage(question) {
  const paragraphs = question.paragraphs?.length ? question.paragraphs : [question.passage].filter(Boolean);
  const evidence = session.exam.submitted ? getEvidenceSentences(question).map((item) => ({ ...item, anchorId: getEvidenceAnchorId(question, item.paragraphIndex || 1, item.index) })) : [];
  const vocab = session.exam.submitted ? getQuestionVocabularyTerms(question) : [];
  return paragraphs.map((paragraph, index) => {
    const paragraphNo = index + 1;
    const html = renderAnnotatedLookupText(paragraph, evidence, vocab, paragraphNo);
    return `<p id="${escapeAttr(getEvidenceAnchorId(question, paragraphNo))}" class="analysis-paragraph">${html}</p>`;
  }).join("");
}

function renderHighlightedPassageForQuestions(questions) {
  const first = questions[0] || {};
  const paragraphs = first.paragraphs?.length ? first.paragraphs : [first.passage].filter(Boolean);
  const evidence = session.exam.submitted
    ? questions.flatMap((question) => getEvidenceSentences(question).map((item) => ({ ...item, anchorId: getEvidenceAnchorId(question, item.paragraphIndex || 1, item.index) })))
    : [];
  const vocab = session.exam.submitted ? questions.flatMap((question) => getQuestionVocabularyTerms(question)) : [];
  return paragraphs.map((paragraph, index) => {
    const paragraphNo = index + 1;
    return `<p id="${escapeAttr(getEvidenceAnchorId(first, paragraphNo))}" class="analysis-paragraph">${renderAnnotatedLookupText(paragraph, evidence, vocab, paragraphNo)}</p>`;
  }).join("");
}

function getEvidenceSentences(question) {
  const value = question.analysis?.evidenceSentences || question.analysis?.evidence;
  if (!value) return [];
  const items = Array.isArray(value) ? value : [{ sentence: String(value) }];
  return items.map((item, index) => ({
    paragraphIndex: Number(item.paragraphIndex || 0),
    sentence: cleanEvidenceText(item.sentence || item.text || item.evidence || item),
    reason: clean(item.reason || ""),
    index
  })).filter((item) => item.sentence);
}

function getQuestionVocabularyTerms(question) {
  const terms = [];
  const add = (value) => {
    const text = clean(String(value || ""));
    if (text && /[A-Za-z]/.test(text) && text.length <= 80) terms.push(text);
  };
  (question.analysis?.keyVocabulary || []).forEach((item) => add(item.word || item.phrase || item.expression));
  (question.analysis?.keyPhrases || []).forEach((item) => add(item.phrase || item.word));
  (question.analysis?.synonymReplacements || []).forEach((item) => {
    add(item.optionExpression);
    add(item.originalExpression);
  });
  return unique(terms).sort((a, b) => b.length - a.length);
}

function renderAnnotatedLookupText(text, evidenceItems = [], vocabTerms = [], paragraphNo = 0) {
  const source = String(text || "");
  const ranges = [];
  evidenceItems.forEach((item) => {
    if (paragraphNo && item.paragraphIndex && item.paragraphIndex !== paragraphNo) return;
    findTextRange(source, item.sentence)?.forEach((range) => ranges.push({ ...range, type: "evidence", index: item.index, anchorId: item.anchorId }));
  });
  vocabTerms.forEach((term) => {
    findAllTextRanges(source, term).forEach((range) => ranges.push({ ...range, type: "vocab" }));
  });
  if (!ranges.length) return renderLookupText(source);
  const points = new Set([0, source.length]);
  ranges.forEach((range) => {
    points.add(range.start);
    points.add(range.end);
  });
  const sorted = [...points].sort((a, b) => a - b);
  return sorted.slice(0, -1).map((start, index) => {
    const end = sorted[index + 1];
    const piece = source.slice(start, end);
    const active = ranges.filter((range) => start >= range.start && end <= range.end);
    const classes = [];
    const evidence = active.find((range) => range.type === "evidence");
    if (evidence) classes.push("evidence-highlight");
    if (active.some((range) => range.type === "vocab")) classes.push("vocab-highlight");
    const body = renderLookupText(piece);
    if (!classes.length) return body;
    const evidenceAttr = evidence ? ` data-evidence-index="${evidence.index}"` : "";
    const anchorAttr = evidence?.anchorId && evidence.start === start ? ` id="${escapeAttr(evidence.anchorId)}"` : "";
    return `<span${anchorAttr} class="${classes.join(" ")}"${evidenceAttr}>${body}</span>`;
  }).join("");
}

function findTextRange(source, needle) {
  const exact = findAllTextRanges(source, needle);
  if (exact.length) return exact.slice(0, 1);
  const compactSource = compactForMatch(source);
  const compactNeedle = compactForMatch(needle);
  if (!compactNeedle) return [];
  const index = compactSource.text.indexOf(compactNeedle.text);
  if (index < 0) return [];
  const start = compactSource.map[index];
  const end = compactSource.map[index + compactNeedle.text.length - 1] + 1;
  return [{ start, end }];
}

function findAllTextRanges(source, needle) {
  const text = String(source || "");
  const target = String(needle || "").trim();
  if (!target) return [];
  const ranges = [];
  const lower = text.toLowerCase();
  const targetLower = target.toLowerCase();
  let index = lower.indexOf(targetLower);
  while (index >= 0) {
    const before = index === 0 ? "" : text[index - 1];
    const after = text[index + target.length] || "";
    const wordBoundary = !/[A-Za-z]/.test(target[0]) || (!/[A-Za-z]/.test(before) && !/[A-Za-z]/.test(after));
    if (wordBoundary) ranges.push({ start: index, end: index + target.length });
    index = lower.indexOf(targetLower, index + Math.max(1, target.length));
  }
  return ranges;
}

function compactForMatch(value) {
  const map = [];
  const chars = [];
  String(value || "").split("").forEach((char, index) => {
    if (/\s/.test(char)) return;
    chars.push(char.toLowerCase());
    map.push(index);
  });
  return { text: chars.join(""), map };
}

function cleanEvidenceText(value) {
  return clean(value).replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
}

function getEvidenceAnchorId(question, paragraphNo, evidenceIndex = "") {
  return `evidence-${question.id}-${paragraphNo}${evidenceIndex !== "" ? `-${evidenceIndex}` : ""}`;
}

function renderAnalysisQuestionSource(question) {
  const source = question.passage;
  if (!source) return "";
  const open = question.section !== "readingPartA" || question.questionNo % 5 === 1;
  return `
    <details class="exam-passage analysis-source" ${open ? "open" : ""}>
      <summary>${question.section === "translation" ? "翻译原文" : "原文 / 文章"}</summary>
      <div class="analysis-passage-body">${renderHighlightedPassage(question)}</div>
    </details>
  `;
}

function renderAnalysisOptions(question, selected, submitted) {
  if (!question.options?.length) return "";
  const analyses = submitted
    ? question.options.map((option) => renderOptionAnalysisLine(question, option.key, option.key === question.officialAnswer)).filter(Boolean)
    : [];
  return `
    <div class="option-grid ${question.options.length > 4 ? "wide-options" : ""}">
      ${question.options.map((option) => {
        const isCorrect = submitted && option.key === question.officialAnswer;
        const isSelectedWrong = submitted && selected === option.key && option.key !== question.officialAnswer;
        return `
          <button class="${selected === option.key ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isSelectedWrong ? "wrong-option" : ""}" type="button" data-answer-question="${escapeAttr(question.id)}" data-answer="${escapeAttr(option.key)}">
            <i aria-hidden="true"></i><strong>${escapeHtml(option.key)}</strong><span>${renderLookupText(option.text)}</span>
          </button>
        `;
      }).join("")}
    </div>
    ${analyses.length ? `<div class="option-analysis-list">${analyses.join("")}</div>` : ""}
  `;
}

function renderOptionAnalysisLine(question, key, isCorrect = false) {
  if (isCorrect && question.analysis?.whyCorrect) {
    return `<div class="option-analysis correct"><strong>${escapeHtml(key)}</strong><span>${escapeHtml(question.analysis.whyCorrect)}</span></div>`;
  }
  const source = question.analysis?.wrongOptionAnalysis || question.analysis?.wrongChoicesOrDistractors;
  if (!source || isCorrect) return "";
  const text = typeof source === "object" && !Array.isArray(source) ? source[key] : "";
  if (!text) return "";
  return `<div class="option-analysis wrong"><strong>${escapeHtml(key)}</strong><span>${escapeHtml(text)}</span></div>`;
}

function renderWritingAsset(question) {
  if (question.section !== "writing" || question.questionNo !== 48) return "";
  if (question.imagePath) {
    return `<img class="writing-chart-image" src="${escapeAttr(question.imagePath)}" alt="写作 Part B 图表" />`;
  }
  return `<p class="body-text muted-note">图表待补充</p>${question.chartDescription ? `<p class="body-text">${escapeHtml(question.chartDescription)}</p>` : ""}`;
}

function renderAnalysisAnswerSummary(question, selected) {
  if (question.kind !== "objective") return "";
  const wrong = selected && question.officialAnswer && selected !== question.officialAnswer;
  return `
    <div class="analysis-answer-summary ${wrong ? "wrong" : ""}">
      <span>正确答案：<strong>${escapeHtml(question.officialAnswer || "未提供")}</strong></span>
    </div>
  `;
}

function renderQuestionAnalysis(question) {
  if (question.section === "writing") return "";
  if (!question.analysis) {
    return `<section class="analysis-block"><h4>解析</h4><p class="body-text">解析待补充</p></section>`;
  }
  const fields = getAnalysisFields(question.section);
  return `
    <section class="analysis-block">
      <h4>解析</h4>
      ${renderEvidenceJumpPanel(question)}
      ${fields.map(([key, label, mode]) => renderAnalysisField(label, question.analysis[key], mode)).join("")}
    </section>
  `;
}

function renderEvidenceJumpPanel(question) {
  const evidence = getEvidenceSentences(question);
  if (!evidence.length) return "";
  return `
    <div class="evidence-jump-panel">
      <strong>原文定位</strong>
      <div>
        ${evidence.map((item, index) => {
          const paragraphNo = item.paragraphIndex || 1;
          return `<button type="button" data-jump-evidence="${escapeAttr(getEvidenceAnchorId(question, paragraphNo, item.index))}">定位 ${index + 1}</button>`;
        }).join("")}
      </div>
    </div>
  `;
}

function getAnalysisFields(sectionId) {
  const fields = {
    useOfEnglish: [["context", "上下文"], ["keyVocabulary", "重点词汇"], ["teacherExplanation", "老师讲解", "details"], ["skillTip", "技巧提示", "details"]],
    readingPartA: [["questionType", "题型"], ["synonymReplacements", "同义替换"], ["keyVocabulary", "重点词汇"], ["teacherExplanation", "老师讲解", "details"], ["skillTip", "技巧提示", "details"]],
    readingPartB: [["evidence", "定位依据"], ["teacherExplanation", "老师讲解", "details"], ["skillTip", "技巧提示", "details"]],
    translation: [["referenceTranslation", "参考译文"], ["sentenceStructure", "句子结构"], ["keyPhrases", "关键短语"], ["translationDifficulties", "翻译难点"], ["teacherExplanation", "老师讲解", "details"]]
  };
  return fields[sectionId] || [];
}

function renderAnalysisField(label, value, mode = "") {
  if (value == null || value === "" || (Array.isArray(value) && !value.length)) return "";
  if (mode === "details") {
    return `
      <details class="analysis-field analysis-details">
        <summary>${escapeHtml(label)}</summary>
        ${renderAnalysisValue(value)}
      </details>
    `;
  }
  return `
    <div class="analysis-field">
      <strong>${escapeHtml(label)}</strong>
      ${renderAnalysisValue(value)}
    </div>
  `;
}

function renderAnalysisValue(value) {
  if (Array.isArray(value)) return `<ul>${value.map((item) => `<li>${renderAnalysisInlineValue(item)}</li>`).join("")}</ul>`;
  if (typeof value === "object") {
    return `<dl>${Object.entries(value).filter(([, item]) => item != null && item !== "").map(([key, item]) => `
      <dt>${escapeHtml(key)}</dt><dd>${renderAnalysisInlineValue(item)}</dd>
    `).join("")}</dl>`;
  }
  return `<p>${escapeHtml(value)}</p>`;
}

function renderAnalysisInlineValue(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(renderAnalysisInlineValue).join("；");
  if (typeof value === "object") {
    const term = value.word || value.phrase || value.expression || value.optionExpression || value.originalExpression || "";
    const meaning = value.meaning || value.explanation || value.note || "";
    if (term) return `<span class="vocab-line"><b>${escapeHtml(term)}</b>${meaning ? ` ${escapeHtml(meaning)}` : ""}</span>`;
    return Object.entries(value)
      .filter(([, item]) => item != null && item !== "")
      .map(([, item]) => renderAnalysisInlineValue(item))
      .join(" ");
  }
  return escapeHtml(value);
}

function renderAnalysisExamReport(questions) {
  const objectiveQuestions = questions.filter((question) => question.kind === "objective");
  const result = scoreAnalysisExam(objectiveQuestions);
  return `
    <section class="exam-report">
      <div>
        <p class="tiny-label">报告</p>
        <h3>${objectiveQuestions.length ? `${result.score}/${objectiveQuestions.length}` : "已记录"}</h3>
      </div>
      <div class="report-tags">
        <span class="pill">错题 ${result.wrong.length}</span>
        <span class="pill">解析缺失 ${questions.filter((question) => question.analysisRequired && !question.analysis).length}</span>
      </div>
      <p class="body-text">${objectiveQuestions.length ? "下方已显示官方答案和解析，优先看定位句与干扰项。" : "本题型已记录进度，可继续手写练习与复盘。"}</p>
    </section>
  `;
}

function scoreAnalysisExam(objectiveQuestions) {
  const wrong = objectiveQuestions.filter((question) => session.exam.answers[question.id] !== question.officialAnswer);
  return { score: Math.max(0, objectiveQuestions.length - wrong.length), wrong };
}

function renderAnalysisExamReport(questions) {
  const objectiveQuestions = questions.filter((question) => question.kind === "objective");
  const result = scoreAnalysisExam(objectiveQuestions);
  const total = objectiveQuestions.length || questions.length;
  const score = objectiveQuestions.length ? result.score : total;
  const accuracy = total ? Math.round((score / total) * 100) : 0;
  const elapsed = formatDuration(Date.now() - Number(session.exam.startedAt || Date.now()));
  const missing = questions.filter((question) => question.analysisRequired && !question.analysis).length;
  return `
    <section class="exam-report exam-practice-report">
      <div class="exam-report-hero">
        <div class="exam-score-ring" style="--score: ${accuracy * 3.6}deg">
          <span>${score}</span>
          <small>共 ${total} 题</small>
        </div>
        <div class="exam-report-stats">
          <p class="tiny-label">练习报告</p>
          <h3>${getReportSectionName(questions)}</h3>
          <div>
            <span>正确率 <strong>${accuracy}%</strong></span>
            <span>用时 <strong>${elapsed}</strong></span>
          </div>
        </div>
      </div>
      ${objectiveQuestions.length ? `
        <div class="exam-report-map" aria-label="答题情况">
          ${objectiveQuestions.map((question) => renderReportDot(question)).join("")}
        </div>
        <div class="exam-report-actions">
          <button class="small-button" type="button" data-scroll-first-analysis>错题解析</button>
          <button class="small-button" type="button" data-scroll-first-analysis>全部解析</button>
          <button class="small-button secondary" type="button" data-close-report>继续练习</button>
        </div>
      ` : ""}
      ${missing ? `<p class="body-text muted-note">解析缺失 ${missing} 题</p>` : ""}
    </section>
  `;
}

function getReportSectionName(questions) {
  const first = questions[0] || {};
  if (first.section === "readingPartA") return first.textNo ? `阅读理解 A · Text ${first.textNo}` : "阅读理解 A";
  return first.sectionLabel || "多种题型综合";
}

function renderReportDot(question) {
  const selected = session.exam.answers[question.id] || "";
  const isCorrect = selected && selected === question.officialAnswer;
  const className = !selected ? "empty" : isCorrect ? "correct" : "wrong";
  return `<button class="${className}" type="button" data-jump-question="${escapeAttr(question.id)}">${escapeHtml(question.questionNo)}</button>`;
}

function moveActiveExamQuestion(questions, direction, persist) {
  const sorted = getObjectiveQuestionsSorted(questions);
  if (!sorted.length) return;
  const active = getActiveExamQuestion(questions);
  const current = Math.max(0, sorted.findIndex((question) => question.id === active?.id));
  const nextIndex = clamp(current + direction, 0, sorted.length - 1);
  const next = sorted[nextIndex];
  session.exam.activeQuestionId = next.id;
  if (next.section === "readingPartB") session.exam.partBActiveQuestion = next.id;
  session.exam.drawerCollapsed = false;
  persist();
  renderSession();
}

function bindExamDrawerControls(questions, persist) {
  const drawer = $(".exam-question-drawer");
  if (!drawer) return;
  $("[data-toggle-exam-drawer]")?.addEventListener("click", () => {
    session.exam.drawerCollapsed = !session.exam.drawerCollapsed;
    drawer.classList.toggle("collapsed", session.exam.drawerCollapsed);
    const handle = $("[data-toggle-exam-drawer]");
    handle?.setAttribute("aria-expanded", session.exam.drawerCollapsed ? "false" : "true");
    handle?.setAttribute("aria-label", session.exam.drawerCollapsed ? "展开题目" : "收起题目");
    persist();
  });

  let startX = 0;
  let startY = 0;
  drawer.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: true });
  drawer.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < 54 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    moveActiveExamQuestion(questions, deltaX > 0 ? 1 : -1, persist);
  }, { passive: true });
}

function bindAnalysisExamEvents(plan, training, questions, objectiveQuestions) {
  const persist = () => {
    session.exam.notes = $("#examNotes")?.value.trim() || session.exam.notes || "";
    const key = analysisProgressKey(training.year, training.id, Number(training.textNo || 0));
    state.examProgress[key] = {
      ...(state.examProgress[key] || {}),
      submitted: Boolean(session.exam.submitted),
      score: Number(session.exam.score || 0),
      total: objectiveQuestions.length || questions.length,
      answers: session.exam.answers,
      notes: session.exam.notes,
      textNo: Number(training.textNo || 0),
      missingAnalysis: questions.filter((question) => question.analysisRequired && !question.analysis).length,
      at: new Date().toISOString()
    };
    if (!session.exam.fromHub) {
      plan.logs.examSession = {
        type: "exam",
        trainingId: training.id,
        title: training.title,
        year: training.year,
        textNo: Number(training.textNo || 0),
        startedAt: session.exam.startedAt,
          answers: session.exam.answers,
          notes: session.exam.notes,
          textNo: training.textNo || 0,
          submitted: session.exam.submitted,
        score: session.exam.score
      };
    }
    saveState();
  };

  $$("[data-answer-question]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("[data-lookup]")) return;
      session.exam.activeQuestionId = button.dataset.answerQuestion;
      session.exam.answers[button.dataset.answerQuestion] = button.dataset.answer;
      if (button.closest(".part-b-option-bank")) {
        session.exam.partBActiveQuestion = button.dataset.answerQuestion;
      }
      if (session.exam.submitted) {
        session.exam.score = scoreAnalysisExam(objectiveQuestions).score;
      }
      persist();
      renderSession();
    });
  });
  $$("[data-part-b-target]").forEach((button) => {
    button.addEventListener("click", () => {
      session.exam.partBActiveQuestion = button.dataset.partBTarget;
      session.exam.activeQuestionId = button.dataset.partBTarget;
      session.exam.drawerCollapsed = false;
      persist();
      renderSession();
    });
  });
  $$("[data-writing-answer]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      setWritingDraft(Number(textarea.dataset.writingAnswer), textarea.value);
      persist();
    });
  });
  $$("[data-jump-question]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.jumpQuestion;
      if (questions.some((question) => question.id === targetId && question.kind === "objective")) {
        session.exam.activeQuestionId = targetId;
        session.exam.partBActiveQuestion = targetId;
        session.exam.drawerCollapsed = false;
        persist();
        renderSession();
        return;
      }
      $(`#exam-${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  bindExamDrawerControls(questions, persist);
  $$("[data-scroll-first-analysis]").forEach((button) => {
    button.addEventListener("click", () => {
      const firstWrong = scoreAnalysisExam(objectiveQuestions).wrong[0];
      const target = firstWrong ? $(`#exam-${firstWrong.id}`) : $(".analysis-question");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  $$("[data-close-report]").forEach((button) => {
    button.addEventListener("click", closeStudy);
  });
  $$("[data-jump-evidence]").forEach((button) => {
    button.addEventListener("click", () => {
      jumpToEvidence(button.dataset.jumpEvidence);
    });
  });
  $$("[data-jump-first-evidence]").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      jumpToEvidence(item.dataset.jumpFirstEvidence);
    });
  });
  $("#submitExamButton")?.addEventListener("click", () => {
    if (session.exam.submitted) {
      const wrongIds = new Set(scoreAnalysisExam(objectiveQuestions).wrong.map((question) => question.id));
      session.exam.answers = Object.fromEntries(Object.entries(session.exam.answers || {}).filter(([id]) => wrongIds.has(id)));
      session.exam.submitted = false;
      session.exam.score = 0;
      persist();
      renderSession();
      return;
    }
    if ($("#examNotes")) session.exam.notes = $("#examNotes").value.trim();
    session.exam.submitted = true;
    session.exam.score = scoreAnalysisExam(objectiveQuestions).score;
    state.examProgress[analysisProgressKey(training.year, training.id, Number(training.textNo || 0))] = {
      submitted: true,
      score: session.exam.score,
      total: objectiveQuestions.length || questions.length,
      answers: session.exam.answers,
      notes: session.exam.notes,
      textNo: Number(training.textNo || 0),
      missingAnalysis: questions.filter((question) => question.analysisRequired && !question.analysis).length,
      at: new Date().toISOString()
    };
    persist();
    if (!session.exam.fromHub) markTaskDone("exam");
    toast(objectiveQuestions.length ? `交卷完成：${session.exam.score}/${objectiveQuestions.length}` : "进度已记录");
    renderSession();
  });
  $("#examNotes")?.addEventListener("input", (event) => {
    session.exam.notes = event.target.value;
    persist();
  });
}

function jumpToEvidence(anchorId) {
  const target = document.getElementById(anchorId);
  target?.closest("details")?.setAttribute("open", "");
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.classList.add("evidence-pulse");
  setTimeout(() => target?.classList.remove("evidence-pulse"), 1200);
}

function needsAnalysisCanvas(training, questions) {
  return false;
}

function renderExamSession(plan) {
  const training = session.exam?.training || plan.truthTraining || getTruthTraining(plan.key);
  if (isAnalysisExamTraining(training)) return renderAnalysisExamSession(plan, training);
  if (!training) {
    renderChecklistSession("真题训练", ["9 月后自动开启真题板块训练。"], "exam");
    return;
  }
  const sessionKey = `${training.year}-${training.id}`;
  if (!session.exam || session.exam.sessionKey !== sessionKey) {
    session.exam = {
      training,
      sessionKey,
      fromHub: false,
      trainingId: training.id,
      startedAt: Date.now(),
      answers: {},
      flagged: {},
      collected: {},
      notes: "",
      wrongLines: "",
      submitted: false,
      score: 0
    };
  }
  const questionSet = getExamQuestionSet(training, plan.key);
  const questions = getExamQuestions(training, questionSet);
  const answered = questions.filter((question) => session.exam.answers[question.id]).length;
  const elapsed = formatDuration(Date.now() - Number(session.exam.startedAt || Date.now()));
  $("#studyKicker").textContent = `${training.year} 英语二`;
  $("#studyTitle").textContent = training.title;
  const report = session.exam.submitted ? renderExamReport(training, questions) : "";
  $("#studyBody").innerHTML = `
    <article class="exam-shell">
      <div class="exam-toolbar">
        <div>
          <p class="tiny-label">${escapeHtml(training.year)} 英语二</p>
          <h3>${escapeHtml(training.title)}</h3>
        </div>
        <div class="exam-actions">
          <span class="pill">${elapsed}</span>
          <span class="pill">${answered}/${questions.length}</span>
          <button id="submitExamButton" class="small-button" type="button">${session.exam.submitted ? "更新报告" : "交卷"}</button>
        </div>
      </div>

      <div class="exam-goal">
        <p class="body-text">${escapeHtml(training.goal)}</p>
        ${questionSet?.passage ? `
          <details class="exam-passage" open>
            <summary>原文</summary>
            <p>${renderLookupText(questionSet.passage)}</p>
          </details>
        ` : ""}
        <div class="exam-step-strip">
          ${training.steps.map((step) => `<span>${escapeHtml(step)}</span>`).join("")}
        </div>
      </div>

      ${report}
      <div class="exam-layout">
        <section class="exam-paper">
          ${questions.map((question, index) => renderExamQuestion(question, index)).join("")}
        </section>
        <aside class="answer-sheet" aria-label="答题卡">
          <strong>答题卡</strong>
          <div class="answer-dots">
            ${questions.map((question, index) => `
              <button class="${session.exam.answers[question.id] ? "answered" : ""} ${session.exam.flagged[question.id] ? "flagged" : ""}" type="button" data-jump-question="${escapeAttr(question.id)}">
                ${index + 1}
              </button>
            `).join("")}
          </div>
          <textarea id="examWrongLines" rows="5" placeholder="错句 / 定位句 / 易错词">${escapeHtml(session.exam.wrongLines || "")}</textarea>
          <textarea id="examNotes" rows="5" placeholder="错因：定位错、同义替换没看出、选项偷换概念...">${escapeHtml(session.exam.notes || "")}</textarea>
        </aside>
      </div>

      <section class="exam-analysis">
        <div class="panel-row">
          <h3>解析</h3>
          <button id="deepSeekExamButton" class="small-button" type="button">生成讲解提纲</button>
        </div>
        <p class="body-text">${escapeHtml(training.aiPrompt)}</p>
        <div id="deepSeekOutput" class="body-text"></div>
      </section>
    </article>
    ${needsExamCanvas(training) ? canvasPanel("exam", training.id === "writing-truth" ? "手写真题作文" : "手写译文") : ""}
  `;
  bindExamSessionEvents(training, questions);
  $("#deepSeekExamButton").addEventListener("click", () => generateDeepSeekExam(training));
  if (needsExamCanvas(training)) setupCanvas("exam", "exam-draft");
}

function renderExamQuestion(question, index) {
  const selected = session.exam.answers[question.id] || "";
  const flagged = Boolean(session.exam.flagged[question.id]);
  const collected = Boolean(session.exam.collected[question.id]);
  const submitted = Boolean(session.exam.submitted);
  const wrong = submitted && selected && selected !== question.answer;
  return `
    <article id="exam-${escapeAttr(question.id)}" class="exam-question ${wrong ? "wrong" : ""}">
      <div class="exam-question-head">
        <span class="pill">第 ${index + 1} 题</span>
        <div class="exam-mini-actions">
          <button class="${flagged ? "active" : ""}" type="button" data-flag-question="${escapeAttr(question.id)}">标疑</button>
          <button class="${collected ? "active" : ""}" type="button" data-collect-question="${escapeAttr(question.id)}">收藏</button>
        </div>
      </div>
      <p class="body-text">${renderLookupText(question.stem)}</p>
      <div class="option-grid">
        ${question.options.map((option) => `
          <button class="${selected === option.key ? "selected" : ""} ${submitted && option.key === question.answer ? "correct" : ""}" type="button" data-answer-question="${escapeAttr(question.id)}" data-answer="${option.key}">
            <strong>${option.key}</strong><span>${renderLookupText(option.text)}</span>
          </button>
        `).join("")}
      </div>
      ${submitted ? `<p class="body-text exam-explain">${escapeHtml(question.explain)}</p>` : ""}
    </article>
  `;
}

function renderExamReport(training, questions) {
  const result = scoreExam(questions);
  return `
    <section class="exam-report">
      <div>
        <p class="tiny-label">报告</p>
        <h3>${result.score}/${questions.length}</h3>
      </div>
      <div class="report-tags">
        <span class="pill">错题 ${result.wrong.length}</span>
        <span class="pill">标疑 ${Object.values(session.exam.flagged).filter(Boolean).length}</span>
        <span class="pill">收藏 ${Object.values(session.exam.collected).filter(Boolean).length}</span>
      </div>
      <p class="body-text">${result.wrong.length ? "错题和错句已经进入今日复盘；先看定位句，再看选项陷阱。" : "这一组做得很稳，继续复盘定位和同义替换。"}</p>
    </section>
  `;
}

function scoreExam(questions) {
  const wrong = questions.filter((question) => session.exam.answers[question.id] !== question.answer);
  return { score: Math.max(0, questions.length - wrong.length), wrong };
}

function bindExamSessionEvents(training, questions) {
  const plan = getPlan();
  const persist = () => {
    if (!session.exam.fromHub) {
      plan.logs.examSession = {
        type: "exam",
        trainingId: training.id,
        title: training.title,
        year: training.year,
        startedAt: session.exam.startedAt,
        answers: session.exam.answers,
        flagged: session.exam.flagged,
        collected: session.exam.collected,
        notes: session.exam.notes,
        wrongLines: session.exam.wrongLines,
        submitted: session.exam.submitted,
        score: session.exam.score,
        total: questions.length,
        at: new Date().toISOString()
      };
    }
    saveState();
  };

  $$("[data-answer-question]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("[data-lookup]")) return;
      session.exam.answers[button.dataset.answerQuestion] = button.dataset.answer;
      persist();
      renderSession();
    });
  });
  $$("[data-flag-question]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.flagQuestion;
      session.exam.flagged[id] = !session.exam.flagged[id];
      persist();
      renderSession();
    });
  });
  $$("[data-collect-question]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.collectQuestion;
      session.exam.collected[id] = !session.exam.collected[id];
      persist();
      renderSession();
    });
  });
  $$("[data-jump-question]").forEach((button) => {
    button.addEventListener("click", () => {
      $(`#exam-${button.dataset.jumpQuestion}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  $("#submitExamButton")?.addEventListener("click", () => {
    session.exam.notes = $("#examNotes")?.value.trim() || "";
    session.exam.wrongLines = $("#examWrongLines")?.value.trim() || "";
    session.exam.submitted = true;
    session.exam.score = scoreExam(questions).score;
    state.examProgress[examProgressKey(training.year, training.id)] = {
      submitted: true,
      score: session.exam.score,
      total: questions.length,
      at: new Date().toISOString()
    };
    persist();
    if (!session.exam.fromHub) markTaskDone("exam");
    toast(`交卷完成：${session.exam.score}/${questions.length}`);
    renderSession();
  });
  $("#examNotes")?.addEventListener("input", (event) => {
    session.exam.notes = event.target.value;
    persist();
  });
  $("#examWrongLines")?.addEventListener("input", (event) => {
    session.exam.wrongLines = event.target.value;
    persist();
  });
}

function getExamQuestionSet(training, key) {
  const sets = (examPlan.questions || []).filter((set) => set.blockId === training.id);
  if (!sets.length) return null;
  const exact = sets.find((set) => Number(set.year) === Number(training.year));
  if (exact) return exact;
  const index = Math.max(0, Math.floor((dateFromKey(key || activeDayKey || todayKey()) - dateFromKey(examPlan.truthStart || "2026-09-01")) / DAY));
  return sets[index % sets.length];
}

function getExamQuestions(training, questionSet = null) {
  if (questionSet?.questions?.length) {
    return questionSet.questions.map((question, index) => ({
      id: question.id || `${training.id}-${index + 1}`,
      number: Number(question.number || index + 1),
      stem: question.stem || `${training.title} 第 ${index + 1} 题`,
      answer: question.answer || ["A", "B", "C", "D"][index % 4],
      options: normalizeExamOptions(question.options),
      explain: question.explain || "先回到原文定位，再比较选项是否偷换对象、范围、态度或因果。"
    }));
  }
  const count = getExamQuestionCount(training);
  const bank = {
    "reading-1": ["细节定位", "同义替换", "态度判断", "推断题", "主旨题"],
    "reading-2": ["同义替换", "例证功能", "态度词", "段落关系", "标题题"],
    "reading-3": ["长段筛选", "因果关系", "转折信息", "词义猜测", "作者观点"],
    "reading-4": ["主旨题", "推断题", "细节题", "论证逻辑", "标题题"],
    "new-type": ["段落主题", "代词指代", "逻辑连接", "主题复现", "顺序衔接"],
    cloze: ["上下文", "固定搭配", "词义辨析", "逻辑关系", "介词搭配", "代词指代", "动词辨析", "形容词辨析", "连词", "篇章主旨"],
    translation: ["主干", "从句", "介词短语"],
    "writing-truth": ["审题", "结构"]
  };
  const labels = bank[training.id] || bank["reading-1"];
  return Array.from({ length: count }, (_, index) => {
    const label = labels[index % labels.length];
    const answer = ["A", "B", "C", "D"][index % 4];
    return {
      id: `${training.id}-${index + 1}`,
      stem: `${training.title} 第 ${index + 1} 题：先完成真题原卷，再在这里记录${label}判断。`,
      answer,
      options: ["A", "B", "C", "D"].map((key) => ({ key, text: getOptionLabel(key, label) })),
      explain: `${label}题复盘：先回原文定位，再比较选项是否偷换对象、范围、态度或因果。`
    };
  });
}

function normalizeExamOptions(options = []) {
  const byKey = new Map(options.map((option) => [option.key, option.text]));
  return ["A", "B", "C", "D"].map((key, index) => ({
    key,
    text: byKey.get(key) || getOptionLabel(key, "对照原卷")
  }));
}

function getExamQuestionCount(training) {
  if (training.id === "cloze") return 10;
  if (training.id === "translation") return 3;
  if (training.id === "writing-truth") return 2;
  return 5;
}

function getOptionLabel(key, label) {
  const labels = {
    A: "定位明确，待核对原文依据",
    B: "可能同义替换，需看范围",
    C: "可能偷换概念，需排除",
    D: "可能过度推断，需复盘"
  };
  return `${labels[key]} · ${label}`;
}

function needsExamCanvas(training) {
  return training.id === "translation" || training.id === "writing-truth";
}

function canvasPanel(kind, title) {
  const colors = ["#17212b", "#286f8f", "#d66a4d", "#3a74e8"];
  return `
    <article class="canvas-panel">
      <div class="canvas-toolbar">
        ${colors.map((color) => `<button class="color-dot ${state.settings.penColor === color ? "active" : ""}" type="button" style="background:${color}" data-pen-color="${color}" aria-label="笔色"></button>`).join("")}
        <input class="range-control" type="range" min="1" max="12" value="${state.settings.penSize}" data-pen-size />
        <button class="small-button" type="button" data-eraser>橡皮</button>
        <button class="small-button" type="button" data-canvas-clear>清空</button>
        <button class="small-button canvas-submit" type="button" data-complete-session>提交</button>
      </div>
      <p class="tiny-label">${escapeHtml(title)}：自动保存，支持手指和 Apple Pencil / 触控笔</p>
      <canvas id="${kind}Canvas" class="hand-canvas"></canvas>
    </article>
  `;
}

function setupCanvas(kind, taskKind = kind) {
  const canvas = $(`#${kind}Canvas`);
  if (!canvas) return;
  const panel = canvas.closest(".canvas-panel");
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
    event.preventDefault();
    drawing = true;
    last = point(event);
    applyPen();
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    event.preventDefault();
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
    saveState();
  });

  panel.querySelectorAll("[data-pen-color]").forEach((button) => {
    button.addEventListener("click", () => {
      eraser = false;
      state.settings.penColor = button.dataset.penColor;
      saveState();
      panel.querySelectorAll(".color-dot").forEach((item) => item.classList.toggle("active", item === button));
    });
  });
  panel.querySelector("[data-pen-size]").addEventListener("input", (event) => {
    state.settings.penSize = Number(event.target.value);
    saveState();
  });
  panel.querySelector("[data-eraser]").addEventListener("click", () => {
    eraser = !eraser;
    toast(eraser ? "橡皮已开启。" : "已切回笔。");
  });
  panel.querySelector("[data-canvas-clear]").addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    delete state.handwriting[key];
    saveState();
  });
  panel.querySelector("[data-complete-session]")?.addEventListener("click", () => completeCurrentSession(taskKind));
  resize();
}

function completeCurrentSession(taskKind) {
  if (!["grammar", "translation", "writing"].includes(taskKind)) return;
  markTaskDone(taskKind);
  renderDone("已提交，今日任务完成。");
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
  const examLog = plan.logs?.examSession;
  const examWrong = examLog?.submitted ? Math.max(0, Number(examLog.total || 0) - Number(examLog.score || 0)) : 0;
  $("#studyBody").innerHTML = `
    <article class="lesson-card">
      <p class="body-text"><strong>今日回炉单词：</strong>${wrongWords.length ? wrongWords.map((word) => `<span class="speakable" data-speak="${escapeAttr(word)}">${escapeHtml(word)}</span>`).join("、") : "暂无"}</p>
      <p class="body-text"><strong>今日回炉短语：</strong>${wrongPhrases.length ? wrongPhrases.map((phrase) => `<span class="speakable" data-speak="${escapeAttr(phrase)}">${escapeHtml(phrase)}</span>`).join("、") : "暂无"}</p>
      ${examLog?.submitted ? `
        <p class="body-text"><strong>真题回炉：</strong>${escapeHtml(examLog.year)} ${escapeHtml(examLog.title)}，错题 ${examWrong} 个。</p>
        <p class="body-text"><strong>错句/错因：</strong>${escapeHtml([examLog.wrongLines, examLog.notes].filter(Boolean).join("；") || "暂无记录")}</p>
      ` : ""}
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
  return getMemoryWords().filter((word) => !state.wordProgress[word.id]?.started).slice(0, count).map((word) => word.id);
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
  return getMemoryWords().find((word) => word.id === id) || fallbackWords[0];
}

function getMemoryWords() {
  return catalogWords.concat(getCustomMemoryWords());
}

function getCustomMemoryWords() {
  return Object.values(state?.customWords || {})
    .map((word) => ({
      id: clean(word.id),
      group: clean(word.group || "手动加入"),
      unit: Number(word.unit || 0),
      term: clean(word.term),
      ipa: clean(word.ipa),
      pos: clean(word.pos || "lookup"),
      meaning: clean(word.meaning || "释义待完善"),
      exam: clean(word.exam || "点词加入，结合真题语境复习。"),
      sentence: clean(word.sentence),
      translation: clean(word.translation),
      memory: clean(word.memory),
      source: clean(word.source || "word popover"),
      custom: true
    }))
    .filter((word) => word.id && word.term);
}

function findMemoryWordByTerm(value) {
  const key = cleanLookupKey(value);
  if (!key) return null;
  return getMemoryWords().find((word) => cleanLookupKey(word.term) === key) || null;
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
  const phaseStart = targetPhase === "truth" ? getTruthStartKey() : (state.settings.writingTemplateStart || WRITING_TEMPLATE_START);
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
  if (examAnalysis) {
    const sections = examAnalysis.listSections();
    const years = examAnalysis.listYears();
    if (!sections.length || !years.length) return null;
    const index = Math.max(0, Math.floor((dateFromKey(key) - dateFromKey(examPlan.truthStart || "2026-09-01")) / DAY));
    const section = sections[index % sections.length];
    const year = years[Math.floor(index / sections.length) % years.length];
    return {
      id: section.id,
      source: "analysisProcessed",
      title: `${year} ${section.label}`,
      short: section.short,
      goal: section.note,
      steps: ["完成作答", "核对官方答案", "复盘解析定位和干扰项"],
      year
    };
  }
  const blocks = examPlan.blocks || [];
  const years = examPlan.availableYears || [];
  if (!blocks.length || !years.length) return null;
  const index = Math.max(0, Math.floor((dateFromKey(key) - dateFromKey(examPlan.truthStart || "2026-09-01")) / DAY));
  const block = blocks[index % blocks.length];
  const year = years[Math.floor(index / blocks.length) % years.length];
  return { ...block, year };
}

function exportData() {
  $("#backupBox").value = JSON.stringify(state, null, 2);
  toast("备份已生成。");
}

function importData() {
  try {
    state = normalizeState(JSON.parse($("#backupBox").value));
    saveState();
    renderAll();
    toast("备份已导入。");
  } catch (error) {
    toast("备份格式不正确。");
  }
}

async function uploadCloudSync() {
  if (!hasCloudSyncConfig()) return;
  try {
    toast("正在上传到云端...");
    const uploadedAt = new Date().toISOString();
    const response = await fetch(cloudSyncEndpoint("upload"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        syncCode: state.settings.cloudSyncCode,
        uploadedAt,
        state: createCloudSyncState()
      })
    });
    const data = await readJsonResponse(response);
    state.settings.lastCloudSync = data.updatedAt || uploadedAt;
    saveState();
    renderCloudStatus();
    renderProfile();
    toast("已上传到云端。");
  } catch (error) {
    toast(`上传失败：${error.message}`);
  }
}

async function downloadCloudSync() {
  if (!hasCloudSyncConfig()) return;
  try {
    toast("正在从云端恢复...");
    const response = await fetch(cloudSyncEndpoint("download"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncCode: state.settings.cloudSyncCode })
    });
    const data = await readJsonResponse(response);
    if (!data.state) throw new Error("云端没有可恢复的数据");

    const localSettings = {
      cloudSyncUrl: state.settings.cloudSyncUrl,
      cloudSyncCode: state.settings.cloudSyncCode,
      deepSeekKey: state.settings.deepSeekKey
    };
    state = normalizeState(data.state);
    state.settings = { ...state.settings, ...localSettings, lastCloudSync: data.updatedAt || new Date().toISOString() };
    saveState();
    renderAll();
    toast("已从云端恢复。");
  } catch (error) {
    toast(`恢复失败：${error.message}`);
  }
}

function hasCloudSyncConfig() {
  if (!state.settings.cloudSyncUrl) {
    toast("请先在“我的 → 云端同步”填写同步地址。");
    return false;
  }
  if (!state.settings.cloudSyncCode || state.settings.cloudSyncCode.length < 8) {
    toast("请先填写至少 8 位同步码。");
    return false;
  }
  return true;
}

function cloudSyncEndpoint(action) {
  const base = state.settings.cloudSyncUrl.replace(/\/+$/, "");
  return `${base}/sync/${action}`;
}

function createCloudSyncState() {
  const snapshot = JSON.parse(JSON.stringify(state));
  snapshot.settings = {
    ...snapshot.settings,
    cloudSyncUrl: "",
    cloudSyncCode: "",
    deepSeekKey: ""
  };
  return snapshot;
}

async function readJsonResponse(response) {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data.error || text || `HTTP ${response.status}`);
  }
  return data;
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

function hasDeepSeekConfig() {
  return Boolean((state.settings.deepSeekKey || "").trim() || (state.settings.aiProxyUrl || "").trim());
}

async function requestDeepSeekCompletion(payload) {
  const localKey = (state.settings.deepSeekKey || "").trim();
  const proxyUrl = (state.settings.aiProxyUrl || "").trim();
  const localEndpoint = localKey ? getLocalDeepSeekEndpoint() : "";
  const url = localEndpoint || proxyUrl;
  if (!url) throw new Error("缺少 API Key 或代理地址");

  const headers = { "Content-Type": "application/json" };
  const body = { ...payload };
  if (localKey && localEndpoint) {
    body.apiKey = localKey;
  } else if (localKey) {
    headers.Authorization = `Bearer ${localKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = null;
  }
  if (!response.ok) {
    const message = data?.error?.message || data?.error || text || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data || {};
}

function getLocalDeepSeekEndpoint() {
  const host = window.location.hostname;
  const localHost = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  const privateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  if (window.location.protocol === "http:" && (localHost || privateLan)) {
    return `${window.location.origin}/api/deepseek`;
  }
  return "";
}

async function generateDeepSeekWriting(lesson, words, phrases) {
  const output = $("#deepSeekOutput");
  if (!hasDeepSeekConfig()) {
    output.textContent = "DeepSeek 还没有配置。请在“我的”里填写本地 API Key，或填写云端代理地址。";
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
    const data = await requestDeepSeekCompletion({
      model: state.settings.deepSeekModel || "deepseek-v4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      thinking: { type: "disabled" }
    });
    output.textContent = data.choices?.[0]?.message?.content || "没有返回内容。";
  } catch (error) {
    output.textContent = `生成失败：${error.message}。本地 Key 模式请用 npm start 打开应用；如果直接打开 HTML，可能会被浏览器跨域限制。`;
  }
}

async function generateDeepSeekExam(training) {
  const output = $("#deepSeekOutput");
  if (!hasDeepSeekConfig()) {
    output.textContent = "DeepSeek 还没有配置。请在“我的”里填写本地 API Key，或填写云端代理地址。";
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
    const data = await requestDeepSeekCompletion({
      model: state.settings.deepSeekModel || "deepseek-v4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35,
      thinking: { type: "disabled" }
    });
    output.textContent = data.choices?.[0]?.message?.content || "没有返回内容。";
  } catch (error) {
    output.textContent = `生成失败：${error.message}。本地 Key 模式请用 npm start 打开应用；如果直接打开 HTML，可能会被浏览器跨域限制。`;
  }
}

async function generateDeepSeekWritingReview(training) {
  const output = $("#deepSeekOutput");
  if (!output) return;
  if (!hasDeepSeekConfig()) {
    output.textContent = "DeepSeek 还没有配置。请在“我的”里填写本地 API Key，或填写云端代理地址。";
    return;
  }
  const smallEssay = getWritingDraft(47);
  const bigEssay = getWritingDraft(48);
  if (!smallEssay && !bigEssay) {
    output.textContent = "还没有检测到作文文本。请先在小作文或大作文作答框里输入内容，再交卷批改。";
    return;
  }

  output.textContent = "正在批改作文...";
  const prompt = [
    "你是严格但讲得清楚的考研英语二写作阅卷老师。请按英语二评分思路批改下面的真题作文。",
    `年份：${training.year} 英语二`,
    `题型：${training.title || "写作"}`,
    smallEssay ? `【小作文原文】\n${smallEssay}` : "",
    bigEssay ? `【大作文原文】\n${bigEssay}` : "",
    "请输出：1. 估分和扣分原因；2. 要点是否覆盖；3. 结构是否符合高分模板；4. 语法和拼写问题；5. 词汇替换建议；6. 每篇给一版可背的提分修改稿；7. 下次最该改的三件事。",
  ].filter(Boolean).join("\n\n");

  try {
    const data = await requestDeepSeekCompletion({
      model: state.settings.deepSeekModel || "deepseek-v4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
      thinking: { type: "disabled" }
    });
    output.textContent = data.choices?.[0]?.message?.content || "没有返回内容。";
  } catch (error) {
    output.textContent = `批改失败：${error.message}。本地 Key 模式请用 npm start 打开应用；如果直接打开 HTML，可能会被浏览器跨域限制。`;
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
    const customHit = findMemoryWordByTerm(candidate.term);
    if (customHit?.custom) return { word: customHit, suffix: candidate.suffix || "", original: candidate.original };
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
  const popover = $("#wordPopover");
  const clicked = token.textContent;
  if (!word) {
    popover.innerHTML = `
      <strong data-speak="${escapeAttr(clicked)}">${escapeHtml(clicked)}</strong>
      <span class="suffix-line">未收录释义 · 已可朗读</span>
      <button class="popover-action" type="button" data-add-memory-word="${escapeAttr(clicked)}">加入背单词</button>
    `;
    popover.querySelector("[data-add-memory-word]")?.addEventListener("click", () => {
      addLookupWordToMemory(clicked, null);
    });
    positionPopover(popover, token, event, 240, 128);
    popover.classList.add("missing");
    popover.classList.remove("hidden");
    speak(clicked, "en-US", token);
    return;
  }
  const suffixLine = lookupMatch?.suffix
    ? `<span class="suffix-line">原形：${escapeHtml(word.term)} · 变化：${escapeHtml(lookupMatch.suffix)}</span>`
    : "";
  const meaning = getUsefulPopoverMeaning(word);
  const memoryWord = findMemoryWordByTerm(word.term);
  const memoryAction = memoryWord
    ? `<span class="suffix-line">已在背单词列表</span>`
    : `<button class="popover-action" type="button" data-add-memory-word="${escapeAttr(word.term)}">加入背单词</button>`;
  popover.innerHTML = `
    <strong data-speak="${escapeAttr(clicked)}">${escapeHtml(clicked)} ${escapeHtml(word.ipa || "")}</strong>
    ${suffixLine}
    ${meaning ? `<span>${escapeHtml(meaning)}</span>` : ""}
    ${memoryAction}
  `;
  popover.querySelector("[data-add-memory-word]")?.addEventListener("click", () => {
    addLookupWordToMemory(clicked, word);
  });
  positionPopover(popover, token, event, 240, 132);
  popover.classList.remove("missing");
  popover.classList.remove("hidden");
  speak(clicked, "en-US", token);
}

function getUsefulPopoverMeaning(word) {
  const meaning = String(word?.meaning || "").trim();
  if (!meaning) return "";
  if (meaning.includes("资料补充词")) return "";
  if (meaning.includes("后续可继续精修释义")) return "";
  if (meaning.includes("释义待完善")) return word.lookupOnly ? "已收录到查词词库，释义待完善" : "";
  if (meaning === "释义待补充") return "";
  return meaning;
}

function rememberMissingWord(value) {
  const word = cleanLookupKey(value);
  if (!word) return;
  const today = getActiveDayKey();
  const bucket = state.missingWords || {};
  bucket[word] = {
    word,
    count: Number(bucket[word]?.count || 0) + 1,
    firstSeen: bucket[word]?.firstSeen || today,
    lastSeen: today
  };
  state.missingWords = bucket;
  saveState();
  toast(`已加入待补：${word}`);
}

function addLookupWordToMemory(value, lookupWord = null) {
  const term = cleanLookupKey(lookupWord?.term || value);
  if (!term) return;
  const existing = findMemoryWordByTerm(term);
  if (existing) {
    toast(`已在背单词：${existing.term}`);
    return;
  }
  const id = `custom-${term.replace(/[^a-z0-9]+/g, "-")}`;
  const meaning = getUsefulPopoverMeaning(lookupWord) || lookupWord?.meaning || "释义待完善";
  state.customWords = {
    ...(state.customWords || {}),
    [id]: {
      id,
      group: "手动加入",
      unit: 0,
      term,
      ipa: lookupWord?.ipa || "",
      pos: lookupWord?.pos || "lookup",
      meaning,
      exam: "点词加入，结合真题语境复习。",
      sentence: "",
      translation: "",
      memory: "",
      source: "word popover"
    }
  };
  rememberMissingWord(term);
  saveState();
  renderStats();
  toast(`已加入背单词：${term}`);
  hidePopover();
}

function positionPopover(popover, token, event = null, boxWidth = 220, boxHeight = 86) {
  const rect = token.getBoundingClientRect();
  const anchorX = event?.clientX ?? rect.left;
  const anchorY = event?.clientY ?? rect.bottom;
  popover.style.maxWidth = `${Math.min(boxWidth, window.innerWidth - 24)}px`;
  const left = Math.min(window.innerWidth - boxWidth - 12, Math.max(12, anchorX + 10));
  const top = Math.min(window.innerHeight - boxHeight, Math.max(12, anchorY + 10));
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

function hidePopover() {
  $("#wordPopover").classList.add("hidden");
}

function loadVoices() {
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  if (activeDayKey) renderProfile();
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
  return `${days}天`;
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

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
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

async function copyText(value, successMessage = "已复制。", emptyMessage = "没有可复制的内容。") {
  if (!value) {
    toast(emptyMessage);
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    toast(successMessage);
  } catch (error) {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    toast(successMessage);
  }
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
