(function (global) {
  const YEARS = Array.from({ length: 16 }, (_, index) => 2010 + index);
  const BASE_DIR = "./analysis_processed";

  const SECTIONS = [
    {
      id: "useOfEnglish",
      label: "完形填空",
      short: "完形",
      note: "Use of English 1-20",
      questionRange: "1-20",
      fileSuffix: "use_of_english_analysis",
      order: 1
    },
    {
      id: "readingPartA",
      label: "阅读理解 A",
      short: "阅读 A",
      note: "Reading Part A 21-40",
      questionRange: "21-40",
      fileSuffix: "reading_part_a_analysis",
      order: 2
    },
    {
      id: "readingPartB",
      label: "新题型",
      short: "新题型",
      note: "Reading Part B 41-45",
      questionRange: "41-45",
      fileSuffix: "reading_part_b_analysis",
      order: 3
    },
    {
      id: "translation",
      label: "翻译",
      short: "翻译",
      note: "Translation 46",
      questionRange: "46",
      fileSuffix: "translation_analysis",
      order: 4
    },
    {
      id: "writing",
      label: "写作",
      short: "写作",
      note: "Writing 47-48",
      questionRange: "47-48",
      fileSuffix: "writing",
      order: 5
    }
  ];

  const sectionById = new Map(SECTIONS.map((section) => [section.id, section]));
  const yearCache = new Map();
  const sectionCache = new Map();
  const READING_OVERRIDES = (global.KAOYAN_READING_OVERRIDES && global.KAOYAN_READING_OVERRIDES.overrides) || {};
  const BUNDLED_ANALYSIS = global.KAOYAN_ANALYSIS_BUNDLE || {};

  function bundledJson(path) {
    const key = String(path || "").replace(/^\.\/analysis_processed\//, "").replace(/^analysis_processed\//, "");
    const value = BUNDLED_ANALYSIS[key];
    return value ? JSON.parse(JSON.stringify(value)) : null;
  }

  async function fetchJson(path) {
    const bundled = bundledJson(path);
    if (bundled) return bundled;
    const response = await fetch(path, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${path}: ${response.status}`);
    }
    return response.json();
  }

  async function loadYear(year) {
    const numericYear = Number(year);
    if (!YEARS.includes(numericYear)) {
      throw new Error(`Unsupported exam year: ${year}`);
    }
    if (!yearCache.has(numericYear)) {
      const path = `${BASE_DIR}/${numericYear}/${numericYear}_exam_analysis.json`;
      yearCache.set(numericYear, fetchJson(path));
    }
    return yearCache.get(numericYear);
  }

  async function loadSection(year, sectionId) {
    const numericYear = Number(year);
    const section = sectionById.get(sectionId);
    if (!section) throw new Error(`Unsupported section: ${sectionId}`);
    const cacheKey = `${numericYear}:${sectionId}`;
    if (sectionCache.has(cacheKey)) return sectionCache.get(cacheKey);

    const promise = loadYear(numericYear).then(async (yearData) => {
      if (yearData?.[sectionId]) return yearData[sectionId];
      const path = `${BASE_DIR}/${numericYear}/${numericYear}_${section.fileSuffix}.json`;
      return fetchJson(path);
    });
    sectionCache.set(cacheKey, promise);
    return promise;
  }

  async function getSectionQuestions(year, sectionId) {
    const yearData = await loadYear(year);
    const sectionData = await loadSection(year, sectionId);
    return normalizeSectionQuestions(yearData, sectionData, sectionId);
  }

  async function getYearQuestions(year) {
    const groups = await Promise.all(SECTIONS.map((section) => getSectionQuestions(year, section.id)));
    return groups.flat().sort((a, b) => a.questionNo - b.questionNo);
  }

  async function getQuestion(year, sectionId, questionNo) {
    const questions = await getSectionQuestions(year, sectionId);
    return questions.find((question) => Number(question.questionNo) === Number(questionNo)) || null;
  }

  async function getPrevQuestion(year, sectionId, questionNo) {
    return getAdjacentQuestion(year, sectionId, questionNo, -1);
  }

  async function getNextQuestion(year, sectionId, questionNo) {
    return getAdjacentQuestion(year, sectionId, questionNo, 1);
  }

  async function getAdjacentQuestion(year, sectionId, questionNo, step) {
    const questions = sectionId
      ? await getSectionQuestions(year, sectionId)
      : await getYearQuestions(year);
    const index = questions.findIndex((question) => Number(question.questionNo) === Number(questionNo));
    if (index < 0) return null;
    return questions[index + step] || null;
  }

  async function getYearStats(year) {
    const questions = await getYearQuestions(year);
    const objective = questions.filter((question) => question.kind === "objective");
    return {
      year: Number(year),
      total: questions.length,
      objectiveTotal: objective.length,
      answerMissing: objective.filter((question) => !question.officialAnswer).length,
      analysisMissing: questions.filter((question) => question.analysisRequired && !question.analysis).length,
      bySection: SECTIONS.map((section) => {
        const sectionQuestions = questions.filter((question) => question.section === section.id);
        const sectionObjective = sectionQuestions.filter((question) => question.kind === "objective");
        return {
          id: section.id,
          label: section.label,
          total: sectionQuestions.length,
          objectiveTotal: sectionObjective.length,
          answerMissing: sectionObjective.filter((question) => !question.officialAnswer).length,
          analysisMissing: sectionQuestions.filter((question) => question.analysisRequired && !question.analysis).length
        };
      })
    };
  }

  function normalizeSectionQuestions(yearData, sectionData, sectionId) {
    if (sectionId === "useOfEnglish") return normalizeUseOfEnglish(yearData, sectionData);
    if (sectionId === "readingPartA") return normalizeReadingPartA(yearData, sectionData);
    if (sectionId === "readingPartB") return normalizeReadingPartB(yearData, sectionData);
    if (sectionId === "translation") return normalizeTranslation(yearData, sectionData);
    if (sectionId === "writing") return normalizeWriting(yearData, sectionData);
    return [];
  }

  function normalizeUseOfEnglish(yearData, sectionData) {
    const rawText = cleanText(sectionData?.rawText || "");
    const optionMap = extractClozeOptions(rawText);
    const passage = removeClozePageArtifacts(cleanExamDirections(removeClozeOptions(rawText)));
    return (sectionData?.questions || []).map((question) => {
      const questionNo = Number(question.number);
      let options = normalizeOptions(question.options);
      if (options.length < 4 || options.some((option) => /(?:\[[A-D]\]|\d{1,2}\.)/.test(option.text))) {
        options = normalizeOptions(optionMap[questionNo]);
      }
      if (options.length < 4 || options.some((option) => /(?:\[[A-D]\]|\d{1,2}\.)/.test(option.text))) {
        options = optionsFromAnalysis(question.analysis);
      }
      return normalizeQuestion(yearData, {
        section: "useOfEnglish",
        kind: "objective",
        questionNo,
        passage,
        paragraphs: passage ? [passage] : [],
        stem: `第 ${questionNo} 空`,
        options,
        answer: question.answer,
        analysis: question.analysis,
        raw: question,
        analysisRequired: true
      });
    });
  }

  function normalizeReadingPartA(yearData, sectionData) {
    return (sectionData?.texts || []).flatMap((text) => {
      const baseParagraphs = normalizeReadingParagraphs((text.paragraphs || []).map((paragraph) => paragraph.text || paragraph).filter(Boolean));
      const manualOverride = getReadingParagraphOverride(Number(yearData.year), Number(text.textNo || 0));
      const generatedOverride = getGeneratedReadingParagraphOverride(Number(yearData.year), Number(text.textNo || 0), baseParagraphs);
      const paragraphs = manualOverride.length
        ? manualOverride
        : (generatedOverride.length ? generatedOverride : baseParagraphs);
      const passage = paragraphs.join("\n\n");
      return (text.questions || []).map((question) => {
        const questionNo = Number(question.number);
        return normalizeQuestion(yearData, {
          section: "readingPartA",
          kind: "objective",
          questionNo,
          textNo: Number(text.textNo || 0),
          passage,
          paragraphs,
          stem: cleanReadingQuestionStem(question.stem, questionNo),
          options: normalizeOptions(question.options),
          answer: question.answer,
          analysis: question.analysis,
          raw: question,
          analysisRequired: true
        });
      });
    });
  }

  function getReadingParagraphOverride(year, textNo) {
    if (year === 2025 && textNo === 2) {
      return [
        "When it was established, the National Health Service (NHS) was visionary: offering high-quality, timely care to meet the dominant needs of the population it served. Nearly 75 years on, with the UK facing very different health challenges, it is clear that model is out of date.",
        "From life expectancy to cancer and infant mortality rates, we are lagging behind many of our peers. With more than 6.8 million on waitlists, healthcare is becoming increasingly inaccessible for those who cannot opt to pay for private treatment; and the cost of providing healthcare is increasingly squeezing out investment in other public services. As demand for healthcare continues to grow, pressures on the workforce-which is already near breaking point-will only become more acute.",
        "Many of the answers to the crisis in health and care are well rehearsed. We need to be much better at reducing and diverting demand on health services, rather than simply managing it. Much more needs to be invested in communities and primary care to reduce our reliance on hospitals. And capacity in social care needs to be greater, to support the growing number of people living with long-term conditions.",
        "Yet despite two decades of strategies and a number of major health reforms, we have failed to make meaningful progress on any of these aims.",
        "That is why Reform is launching a new programme of work entitled \"Reimagining health\", supported by ten former health ministers from across the three main political parties. Together, we are calling for a much more open and honest conversation about the future of health in the UK, and an \"urgent rethink\" of the hospital-centric model we retain.",
        "This must begin with the question of how we maximise the health of the nation, rather than \"fix\" the NHS. It is estimated, for example, that healthcare accounts for only about 20% of health outcomes. Much more important are the places we live, work and socialise-yet there is no clear cross-government strategy for improving these social determinants of health.",
        "Worse, when policies like the national obesity strategy are scrapped, taxpayers are left with the hefty price tag of treating the illnesses, like diabetes, that result.",
        "Reform wants to ask how power and resources should be distributed in our health system. What health functions should remain at the centre, and what should be devolved to local leaders, often responsible for services that create health, and with a much better understanding of the needs of their populations?"
      ];
    }
    return [];
  }

  function getGeneratedReadingParagraphOverride(year, textNo, baseParagraphs) {
    const yearOverrides = READING_OVERRIDES[String(year)] || READING_OVERRIDES[year] || {};
    const rawParagraphs = yearOverrides[String(textNo)] || yearOverrides[textNo] || [];
    if (!Array.isArray(rawParagraphs) || !rawParagraphs.length) return [];
    const paragraphs = normalizeReadingParagraphs(rawParagraphs);
    if (!isGeneratedReadingOverrideUsable(paragraphs, baseParagraphs)) return [];
    return paragraphs;
  }

  function isGeneratedReadingOverrideUsable(paragraphs, baseParagraphs) {
    if (!paragraphs.length) return false;
    if (hasReadingQuestionContamination(paragraphs)) return false;
    if (isReadingTextTooCompressed(paragraphs)) return false;
    const generatedLength = paragraphs.join(" ").length;
    const baseLength = (baseParagraphs || []).join(" ").length;
    if (generatedLength < 900) return false;
    if (!baseLength) return true;
    if (baseLength < 1200 && generatedLength > baseLength * 1.4) return true;
    if (generatedLength > 1800 && generatedLength > baseLength * 1.12) return true;
    return false;
  }

  function hasReadingQuestionContamination(paragraphs) {
    const text = paragraphs.join(" ");
    return /\[[A-D]\]\s*[a-zA-Z]/.test(text)
      || /\bPart\s+B\b/.test(text)
      || /\bANSWER SHEET\b/i.test(text)
      || /\bWhich of the following\b/i.test(text)
      || /\bThe most (?:appropriate|suitable) title\b/i.test(text)
      || /\bAccording to (?:Paragraph|the author|Jenny Radesky|Radesky|Sparrow|Quinn|the first|the last)\b/i.test(text);
  }

  function isReadingTextTooCompressed(paragraphs) {
    const text = paragraphs.join(" ");
    const letters = (text.match(/[A-Za-z]/g) || []).length;
    const spaces = (text.match(/\s/g) || []).length;
    return letters > 1200 && spaces / letters < 0.08;
  }

  function normalizeReadingPartB(yearData, sectionData) {
    const rawText = sectionData?.rawText || "";
    const parsed = parseReadingPartBPaper(rawText, sectionData?.questions || [], Number(yearData.year));
    const rawFlat = String(rawText || "").replace(/\s+/g, " ");
    const knownLayout = getKnownPartBLayout(Number(yearData.year));
    const paperLayout = knownLayout || (/choosing\s+the\s+most\s+suitable\s+subheading/i.test(rawFlat)
      ? "subheading"
      : (/match each of the numbered items/i.test(rawFlat) || /finding information from the left column/i.test(rawFlat))
      ? "matching-table"
      : (/true\s+or\s+false|Choose\s+T/i.test(rawFlat) ? "true-false" : parsed.layout));
    const parsedParagraphs = isPartBParsedPassageUsable(parsed.paragraphs) ? parsed.paragraphs : [];
    const passage = parsedParagraphs.join("\n\n") || cleanPartBPassage(rawText);
    const paragraphs = parsedParagraphs.length ? parsedParagraphs : splitLongPartBParagraphs(splitPartBPassage(passage).map((paragraph) => cleanPartBParagraph(paragraph)).filter(Boolean));
    const options = parsed.options.length ? parsed.options : extractPartBOptions(rawText);
    const labelOverride = getPartBLabelOverride(Number(yearData.year));
    return (sectionData?.questions || []).map((question) => {
      const questionNo = Number(question.number);
      const label = paperLayout === "subheading" ? "" : (labelOverride[questionNo] || parsed.labels[questionNo] || extractPartBQuestionLabel(rawText, questionNo) || extractPartBQuestionLabel(passage, questionNo));
      const answer = getOfficialAnswer(yearData, { questionNo, answer: question.answer, analysis: question.analysis });
      return normalizeQuestion(yearData, {
        section: "readingPartB",
        kind: "objective",
        questionNo,
        passage,
        paragraphs,
        stem: label ? `${questionNo}. ${label}` : (paperLayout === "subheading" ? `${questionNo}. ________` : `第 ${questionNo} 题`),
        options: options.length ? options : getFallbackPartBOptions(answer),
        partBLayout: paperLayout,
        partBLabels: parsed.labels,
        answer: question.answer,
        analysis: question.analysis,
        raw: question,
        analysisRequired: true
      });
    });
  }

  function normalizeTranslation(yearData, sectionData) {
    const questionNo = Number(sectionData?.questionNo || 46);
    const sourceText = sectionData?.analysis?.sourceText || sectionData?.sourceText || sectionData?.rawText || "";
    return [normalizeQuestion(yearData, {
      section: "translation",
      kind: "translation",
      questionNo,
      passage: cleanExamPrompt(sourceText, "translation"),
      paragraphs: sourceText ? [cleanExamPrompt(sourceText, "translation")] : [],
      stem: "Translate the following text into Chinese.",
      options: [],
      answer: "",
      analysis: sectionData?.analysis || null,
      raw: sectionData,
      analysisRequired: true
    })];
  }

  function normalizeWriting(yearData, sectionData) {
    const partA = sectionData?.partA;
    const partB = sectionData?.partB;
    return [partA, partB].filter(Boolean).map((part, index) => {
      const questionNo = Number(part.questionNo || (47 + index));
      const prompt = part.prompt || extractWritingPrompt(sectionData?.rawText || "", questionNo);
      const imagePath = questionNo === 48 ? getWritingPartBImagePath(yearData.year, part.imagePath) : "";
      return normalizeQuestion(yearData, {
        section: "writing",
        kind: "writing",
        questionNo,
        passage: "",
        stem: cleanExamPrompt(prompt, "writing", questionNo),
        options: [],
        answer: "",
        analysis: null,
        raw: part,
        imagePath,
        chartDescription: part.chartDescription || "",
        analysisRequired: false
      });
    });
  }

  function getWritingPartBImagePath(year, existingPath = "") {
    if (existingPath) return existingPath;
    return `大作文图片/${Number(year)}.png`;
  }

  function extractWritingPrompt(rawText, questionNo) {
    const source = cleanText(rawText);
    if (!source) return "";
    if (Number(questionNo) === 47) {
      const match = source.match(/47\.\s*Directions:\s*([\s\S]*?)(?=\s*Part\s+B\s*48\.|\s*48\.\s*Directions:|$)/i);
      return match ? match[0] : "";
    }
    const match = source.match(/(?:Part\s+B\s*)?48\.\s*Directions:\s*([\s\S]*)$/i);
    return match ? match[0] : "";
  }

  function normalizeQuestion(yearData, source) {
    const section = sectionById.get(source.section);
    const officialAnswer = getOfficialAnswer(yearData, source);
    return {
      id: `${yearData.year}-${source.section}-${source.questionNo}`,
      year: Number(yearData.year),
      section: source.section,
      sectionLabel: section?.label || source.section,
      sectionShort: section?.short || source.section,
      kind: source.kind,
      questionNo: Number(source.questionNo),
      textNo: source.textNo || 0,
      passage: source.passage || "",
      paragraphs: source.paragraphs || (source.passage ? [source.passage] : []),
      stem: cleanText(source.stem || ""),
      options: source.options || [],
      officialAnswer,
      analysis: source.analysis || null,
      raw: source.raw || null,
      imagePath: source.imagePath || "",
      chartDescription: source.chartDescription || "",
      partBLayout: source.partBLayout || "",
      partBLabels: source.partBLabels || [],
      analysisRequired: Boolean(source.analysisRequired)
    };
  }

  function getOfficialAnswer(yearData, source) {
    const questionAnswer = cleanAnswer(source.answer);
    if (questionAnswer) return questionAnswer;
    const rootAnswer = cleanAnswer(yearData?.answers?.[String(source.questionNo)] ?? yearData?.answers?.[source.questionNo]);
    if (rootAnswer) return rootAnswer;
    return cleanAnswer(source.analysis?.officialAnswer);
  }

  function cleanAnswer(value) {
    return String(value || "").trim().toUpperCase();
  }

  function normalizeOptions(options) {
    if (!options) return [];
    if (Array.isArray(options)) {
      return options
        .map((option, index) => ({
          key: String(option.key || option.label || "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index] || "").trim().toUpperCase(),
          text: cleanOptionText(option.text || option.value || "")
        }))
        .filter((option) => option.key && option.text);
    }
    return Object.entries(options)
      .map(([key, text]) => ({ key: String(key).trim().toUpperCase(), text: cleanOptionText(text) }))
      .filter((option) => option.key && option.text);
  }

  function extractPartBOptions(rawText) {
    const source = cleanText(rawText);
    let matches = collectPartBOptions(source, /\[([A-G])\]\s*([\s\S]*?)(?=\s*\[[A-G]\]|\s*choosing\s+the\s+most\s+suitable|\s*Five\s+Steps|\s*$)/gi);
    if (matches.length < 4) {
      matches = collectPartBOptions(source, /(?:^|\s)([A-G])\.\s*([\s\S]*?)(?=\s+(?:[A-G]\.)|\s*$)/g);
    }
    return matches;
  }

  function parseReadingPartBPaper(rawText, questions = [], year = 0) {
    const rawLines = String(rawText || "").replace(/\r/g, "").split("\n");
    const lines = rawLines.map(cleanPartBPlainLine);
    const labels = extractPartBLabelsFromLines(lines);
    const layout = getKnownPartBLayout(year) || inferPartBLayout(lines, labels, questions);
    const lineOptions = extractPartBLineOptions(lines);
    const options = layout === "subheading" && lineOptions.length >= 7
      ? lineOptions
      : (extractPartBOptionsFromLines(lines).length ? extractPartBOptionsFromLines(lines) : lineOptions);
    const passageLines = layout === "matching-table"
      ? extractPartBMatchingPassageLines(lines)
      : extractPartBSubheadingPassageLines(lines);
    const paragraphs = splitLongPartBParagraphs(splitPartBLinesToParagraphs(passageLines)
      .map((paragraph) => cleanPartBParagraph(paragraph))
      .filter(Boolean));
    return { layout, options, labels, paragraphs };
  }

  function getKnownPartBLayout(year) {
    if (year === 2010) return "true-false";
    if ([2011, 2012, 2014, 2017, 2019, 2023, 2024].includes(Number(year))) return "matching-table";
    if ([2013, 2015, 2016, 2018, 2020, 2021, 2022, 2025].includes(Number(year))) return "subheading";
    return "";
  }

  function getPartBLabelOverride(year) {
    const overrides = {
      2023: {
        41: "Brian Berry",
        42: "Gareth Belsham",
        43: "Marcus Jefford",
        44: "John Kelly",
        45: "Andrew Mellor"
      },
      2019: {
        41: "Ryan Hooper",
        42: "Adam Bailey",
        43: "Tracey Hampson",
        44: "Aaron Norris",
        45: "Julie Gurner"
      },
      2024: {
        41: "Sue Rexford",
        42: "Sara Harberson",
        43: "Katie Kelley",
        44: "Mayghin Levine",
        45: "Erica Gwyn"
      }
    };
    return overrides[Number(year)] || {};
  }

  function isPartBParsedPassageUsable(paragraphs) {
    if (!Array.isArray(paragraphs) || !paragraphs.length) return false;
    if (paragraphs.length > 60) return false;
    const text = paragraphs.join(" ");
    if (/\[[A-G]\].*\[[A-G]\]/.test(text)) return false;
    if (/ANSWER SHEET|SHEERT/i.test(text)) return false;
    if (/Directions[:：]\s*Read/i.test(text)) return false;
    return text.length > 250;
  }

  function cleanPartBPlainLine(value) {
    return cleanKnownExamOcr(String(value || ""))
      .replace(/\u0000/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanPartBLine(value) {
    return cleanKnownExamOcr(String(value || ""))
      .replace(/\u0000/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/鈥檚/g, "'s")
      .replace(/鈥檙/g, "'r")
      .replace(/鈥檝/g, "'v")
      .replace(/鈥檇/g, "'d")
      .replace(/鈥檒/g, "'l")
      .replace(/鈥檛/g, "n't")
      .replace(/鈥淚/g, "\"I")
      .replace(/鈥淲/g, "\"W")
      .replace(/鈥淭/g, "\"T")
      .replace(/鈥淎/g, "\"A")
      .replace(/鈥淢/g, "\"M")
      .replace(/鈥漒n/g, "\"")
      .replace(/鈥?/g, "\"")
      .replace(/鈥?/g, "\"")
      .replace(/鈥?/g, "'")
      .replace(/鈥攖/g, "-t")
      .replace(/鈥攂/g, "-b")
      .replace(/鈥攐/g, "-o")
      .replace(/鈥攁/g, "-a")
      .replace(/鈥攚/g, "-w")
      .replace(/鈥攊/g, "-i")
      .replace(/鈥攜/g, "-y")
      .replace(/鈥?5/g, "-45")
      .replace(/锛?/g, "：")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractPartBOptionsFromLines(lines) {
    const source = lines.join("\n");
    const matches = [];
    const pattern = /\[([A-G])\]\s*([\s\S]*?)(?=(?:\n\s*)?(?:4[1-5]\.\s*[^\[\n]+?\s*)?\[[A-G]\]|\n\s*(?:How to|Five\s+Steps|Some\s+Old|Act\s+Your|Net-zero|High\s+school|Emerging|Leading|The\s+hugely|Copying\s+Birds|Directions|Section)|$)/gi;
    let match;
    while ((match = pattern.exec(source))) {
      const key = String(match[1] || "").toUpperCase();
      const text = cleanOptionText(match[2])
        .replace(/\s*Directions[:：]?[\s\S]*$/i, "")
        .replace(/\s*Section\s+(?:III|Ⅲ|IV|Ⅳ)[\s\S]*$/i, "")
        .replace(/\s*20\d{2}年[\s\S]*$/i, "")
        .replace(/\s*管理类专业学位联考英语试题[\s\S]*$/i, "")
        .replace(/\s*(?:4[1-5]\.\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s*$/g, "")
        .trim();
      if (key && text && !matches.some((option) => option.key === key)) {
        matches.push({ key, text });
      }
    }
    return matches.sort((a, b) => a.key.localeCompare(b.key));
  }

  function extractPartBLineOptions(lines) {
    const options = [];
    for (const line of lines) {
      const match = String(line || "").match(/^\[([A-G])\]\s*(.+)$/);
      if (!match) continue;
      const key = match[1].toUpperCase();
      const text = cleanOptionText(match[2]);
      if (key && text && !options.some((option) => option.key === key)) {
        options.push({ key, text });
      }
    }
    return options.sort((a, b) => a.key.localeCompare(b.key));
  }

  function extractPartBLabelsFromLines(lines) {
    const labels = {};
    const source = lines.join("\n");
    const pattern = /(?:^|\n)\s*(4[1-5])\.\s*([^\[\n_]+?)(?=\s*(?:\[[A-G]\]|\s+[A-G]\.\s|\n|$))/g;
    let match;
    while ((match = pattern.exec(source))) {
      const questionNo = Number(match[1]);
      const label = cleanText(match[2]).replace(/\s+$/, "");
      if (questionNo && label && !/Directions|Section|ANSWER SHEET/i.test(label)) {
        labels[questionNo] = label;
      }
    }
    return labels;
  }

  function inferPartBLayout(lines, labels, questions) {
    const direction = lines.join(" ");
    if (/true\s+or\s+false|Choose\s+T/i.test(direction)) return "true-false";
    if (/match each of the numbered items/i.test(direction)) return "matching-table";
    if (Object.keys(labels).length >= 5 && !Object.values(labels).some((label) => /_{2,}/.test(label))) {
      return "matching-table";
    }
    if ((questions || []).every((question) => /^[TF]$/i.test(String(question.answer || "")))) return "true-false";
    return "subheading";
  }

  function extractPartBMatchingPassageLines(lines) {
    const result = [];
    let started = false;
    for (const line of lines) {
      if (!line) {
        if (started) result.push("");
        continue;
      }
      if (isPartBInstructionLine(line)) continue;
      if (!started && !looksLikePartBTitle(line)) continue;
      if (/^\[A-G\]/.test(line) || /^[A-G]\.\s*/.test(line) || /^4[1-5]\.\s*/.test(line)) break;
      started = true;
      result.push(line);
    }
    return result;
  }

  function extractPartBSubheadingPassageLines(lines) {
    const result = [];
    let seenOptionG = false;
    let started = false;
    for (const line of lines) {
      if (!line) {
        if (started) result.push("");
        continue;
      }
      if (isPartBInstructionLine(line)) continue;
      if (/^\[[A-G]\]/.test(line)) {
        if (/^\[G\]/.test(line)) seenOptionG = true;
        continue;
      }
      if (!started && seenOptionG && /^(?:e|choosing\b|paragraphs\b|to use\b)/i.test(line)) continue;
      if (!started && !seenOptionG && !/^4[1-5]\.?\s*_/.test(line) && !looksLikePartBTitle(line)) continue;
      started = true;
      result.push(line);
    }
    return result;
  }

  function isPartBInstructionLine(line) {
    return /^Part\s*B$/i.test(line)
      || /^Part\s*B\s+Directions[:：]?/i.test(line)
      || /^Directions[:：]?$/i.test(line)
      || /^Directions[:：]\s*Read/i.test(line)
      || /^Directions[：:]/i.test(line)
      || /^Read the following text/i.test(line)
      || /^choosing the most suitable/i.test(line)
      || /^the list A-G/i.test(line)
      || /^paragraphs?\s*\(41-45\)/i.test(line)
      || /^you do not need to use/i.test(line)
      || /^to use\.?\s*Mark your answers/i.test(line)
      || /^Mark your answers/i.test(line)
      || /^ANSWER SHEET/i.test(line)
      || /^Section\s+(?:III|Ⅲ|IV|Ⅳ)/i.test(line)
      || /^\d{1,2}$/.test(line)
      || /[\u4e00-\u9fff]/.test(line)
      || /管理类专业学位联考英语试题\s*[-－—]?\s*\d+\s*[-－—]?/.test(line);
  }

  function looksLikePartBTitle(line) {
    return line.length <= 110
      && /^[A-Z0-9"“]/.test(line)
      && !/[.;:]$/.test(line)
      && !/^If\b|^When\b|^The\b|^This\b|^A\b/.test(line);
  }

  function splitPartBLinesToParagraphs(lines) {
    const paragraphs = [];
    let current = [];
    let titleConsumed = false;
    let bodyStarted = false;
    let lastWasQuestionBlank = false;
    const flush = () => {
      if (!current.length) return;
      paragraphs.push(current.join(" "));
      current = [];
    };
    lines.forEach((line) => {
      const clean = String(line || "").trim();
      if (!clean) {
        const currentText = current.join(" ").trim();
        if (currentText && !/[.!?]["')\]]?$/.test(currentText)) {
          lastWasQuestionBlank = false;
          return;
        }
        flush();
        lastWasQuestionBlank = false;
        return;
      }
      if (/^4[1-5]\.?\s*(?:_+)?$/.test(clean) || /^4[1-5]\.?\s*_+/.test(clean)) {
        flush();
        bodyStarted = true;
        lastWasQuestionBlank = true;
        current.push(clean);
        return;
      }
      if (!bodyStarted && !titleConsumed && !current.length && looksLikePartBTitle(clean)) {
        paragraphs.push(clean);
        titleConsumed = true;
        lastWasQuestionBlank = false;
        return;
      }
      if (!bodyStarted && titleConsumed && !current.length && clean.length <= 32 && looksLikePartBTitle(clean)) {
        paragraphs[paragraphs.length - 1] = `${paragraphs[paragraphs.length - 1]} ${clean}`;
        lastWasQuestionBlank = false;
        return;
      }
      if (lastWasQuestionBlank) {
        current.push(clean);
        lastWasQuestionBlank = false;
        return;
      }
      if (bodyStarted && current.length && startsNewPartBParagraph(current.join(" "), clean)) {
        flush();
      }
      bodyStarted = true;
      current.push(clean);
      lastWasQuestionBlank = false;
    });
    flush();
    return paragraphs;
  }

  function startsNewPartBParagraph(previous, next) {
    const prev = String(previous || "").trim();
    const line = String(next || "").trim();
    if (!prev || !line || /^4[1-5]\.?\s*_*/.test(line)) return false;
    if (!/[.!?]["')\]]?$/.test(prev)) return false;
    if (!/^[A-Z"鈥淽]/.test(line)) return false;
    if (/^(?:In choosing|McCain|While|The idea|Greg|Younger|Asking|Many|Speaking|Kids|Parents|This advice)\b/.test(line)) return true;
    if (/^(?:Conversations|You meet|Here are|Suppose|It'?s|When|Imagine|You all|That'?s it)\b/.test(line)) return true;
    return prev.length > 180;
  }

  function cleanPartBParagraph(value) {
    return cleanLooseWordStream(value)
      .replace(/\s+\[A\]\s+[\s\S]*$/i, "")
      .replace(/\s+A\.\s+[\s\S]*$/i, "")
      .replace(/[\u4e00-\u9fff][\s\S]*$/g, "")
      .replace(/\b(4[1-5])\s*[.．]\s*_+/g, "$1 ________")
      .replace(/\b(4[1-5])\s+_+/g, "$1 ________")
      .replace(/\b(4[1-5])\s*________\s*\./g, "$1 ________.")
      .replace(/\s+([,.;:?!])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitLongPartBParagraphs(paragraphs) {
    return paragraphs.flatMap((paragraph) => {
      const text = String(paragraph || "").trim();
      if (text.length < 850) return [text];
      const sentences = text.match(/[^.!?]+[.!?]+["')\]]?/g) || [text];
      const chunks = [];
      let current = "";
      sentences.forEach((sentence) => {
        const next = `${current} ${sentence}`.trim();
        if (current && next.length > 620) {
          chunks.push(current);
          current = sentence.trim();
        } else {
          current = next;
        }
      });
      if (current) chunks.push(current);
      return chunks.length ? chunks : [text];
    });
  }

  function collectPartBOptions(source, pattern) {
    const matches = [];
    let match;
    while ((match = pattern.exec(source))) {
      const text = cleanText(match[2])
        .replace(/\s*choosing\s+the\s+most\s+suitable[\s\S]*$/i, "")
        .replace(/\s*Five\s+Steps[\s\S]*$/i, "")
        .replace(/\s*\d{2}\.\s*[^[]+$/g, "")
        .replace(/\s*\d{2}\.\s*[^A-G]+$/g, "")
        .replace(/\s*20\d{2}年.*$/g, "")
        .replace(/^Be humbl$/i, "Be humble")
        .trim();
      if (text) matches.push({ key: match[1], text });
    }
    return matches.slice(-7);
  }

  function extractClozeOptions(rawText) {
    const source = cleanText(rawText);
    const options = {};
    const pattern = /(?:^|\s)(\d{1,2})\.\s*\[A\]\s*([\s\S]*?)\s*\[B\]\s*([\s\S]*?)\s*\[C\]\s*([\s\S]*?)\s*\[D\]\s*([\s\S]*?)(?=\s+\d{1,2}\.\s*\[A\]|\s*$)/g;
    let match;
    while ((match = pattern.exec(source))) {
      const number = Number(match[1]);
      options[number] = {
        A: cleanOptionText(match[2]),
        B: cleanOptionText(match[3]),
        C: cleanOptionText(match[4]),
        D: cleanOptionText(match[5])
      };
    }
    return options;
  }

  function optionsFromAnalysis(analysis) {
    const source = analysis?.wrongOptionAnalysis;
    if (!source || typeof source !== "object" || Array.isArray(source)) return [];
    const merged = { ...source };
    const official = cleanAnswer(analysis?.officialAnswer);
    if (official && !merged[official] && analysis?.whyCorrect) {
      merged[official] = analysis.whyCorrect;
    }
    return ["A", "B", "C", "D"]
      .map((key) => ({ key, text: extractOptionWord(merged[key]) }))
      .filter((option) => option.text);
  }

  function extractOptionWord(value) {
    const text = cleanText(value);
    const embedded = text.match(/(?:选项\s*[A-D]\s*)?([A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*){0,3})(?=\s*(?:[\u4e00-\u9fff]|\(|（|$))/);
    if (embedded) return cleanText(embedded[1]);
    const match = text.match(/^([A-Za-z][A-Za-z\s'-]*?)(?=\s*(?:[\u4e00-\u9fff]|，|。|；|、|,|\(|（|$))/);
    return cleanText(match ? match[1] : text.split(/\s+/).slice(0, 3).join(" "));
  }

  function removeClozeOptions(rawText) {
    return cleanText(rawText).replace(/\s+1\.\s*\[A\][\s\S]*$/g, "").trim();
  }

  function removeClozeInstructions(rawText) {
    return cleanText(rawText)
      .replace(/^Section\s+I\s+Use\s+of\s+English\s*/i, "")
      .replace(/^Directions:\s*Read the following text\.\s*Choose the best word\s*\(s\)\s*for each numbered blank and mark\s*A,\s*B,\s*C\s*or\s*D\s*on the ANSWER SHEET\s*\.\s*\(\s*10\s*points\s*\)\s*/i, "")
      .trim();
  }

  function cleanReadingQuestionStem(value, questionNo) {
    let text = cleanText(value);
    const marker = new RegExp(`(?:^|\\s)${questionNo}\\s*\\.\\s*`);
    const match = marker.exec(text);
    if (match) text = text.slice(match.index + match[0].length);
    text = text.replace(new RegExp(`^${questionNo}\\s*\\.\\s*`), "");
    return text.trim();
  }

  function cleanReadingPassageText(value) {
    const text = cleanText(value)
      .replace(/^\d{1,2}\s+/, "")
      .replace(/\s+\[[A-D]\]\s+[A-Za-z][A-Za-z'-]*\s*$/g, "")
      .replace(/\s+\d{1,2}\s*$/g, "")
      .trim();
    return /^\d{1,2}$/.test(text) ? "" : text;
  }

  function normalizeReadingParagraphs(paragraphs) {
    const cleaned = paragraphs
      .flatMap(splitReadingParagraphCandidates)
      .map((paragraph) => cleanReadingPassageText(paragraph))
      .filter(Boolean)
      .filter((paragraph) => !isExamPageArtifact(paragraph));
    if (!cleaned.length) return [];
    const shortCount = cleaned.filter((paragraph) => paragraph.length <= 18 && !/[.!?。]$/.test(paragraph)).length;
    const normalized = cleaned.length >= 30 && shortCount / cleaned.length > 0.65
      ? [cleanLooseWordStream(cleaned.join(" "))]
      : cleaned.map(cleanLooseWordStream).filter(Boolean);
    return splitLongReadingParagraphs(mergeSoftBrokenParagraphs(normalized));
  }

  function splitReadingParagraphCandidates(value) {
    const lines = String(value || "")
      .replace(/\r/g, "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => {
        const cleaned = cleanText(line);
        return cleaned
          && !isExamPageArtifact(cleaned)
          && !/^\d{1,2}$/.test(cleaned)
          && !/^\[[A-G]\]\s+/.test(cleaned);
      });
    if (lines.length <= 1) return lines;
    const chunks = [];
    let current = [];
    lines.forEach((line) => {
      const next = cleanText(line);
      const previous = cleanText(current.join(" "));
      if (current.length && startsNewReadingParagraph(previous, next)) {
        chunks.push(current.join(" "));
        current = [line];
      } else {
        current.push(line);
      }
    });
    if (current.length) chunks.push(current.join(" "));
    return chunks;
  }

  function startsNewReadingParagraph(previous, next) {
    if (!previous || !next || !/^[A-Z"“]/.test(next)) return false;
    if (/^(?:Today'?s|It's|The prevalence|Notably|Tipping)\b/.test(next) && previous.length > 60) return true;
    return previous.length > 140 && /[.!?]["')\]]?$/.test(previous);
  }

  function isExamPageArtifact(text) {
    return /(?:管理类专业学位联考英语试题|MBA\s*大师|共\s*\d+\s*页|^\d+\s*$)/i.test(text);
  }

  function mergeSoftBrokenParagraphs(paragraphs) {
    const merged = [];
    paragraphs.forEach((paragraph) => {
      const previous = merged[merged.length - 1] || "";
      if (previous && !/[.!?”")\]]$/.test(previous) && /^[a-z]/.test(paragraph)) {
        merged[merged.length - 1] = `${previous} ${paragraph}`;
      } else {
        merged.push(paragraph);
      }
    });
    return merged;
  }

  function splitLongReadingParagraphs(paragraphs) {
    return paragraphs.flatMap((paragraph) => {
      if (paragraph.length < 900) return [paragraph];
      const sentences = paragraph.match(/[^.!?]+[.!?]+["')\]]?/g) || [paragraph];
      const chunks = [];
      let current = "";
      sentences.forEach((sentence) => {
        const next = `${current} ${sentence}`.trim();
        if (current && next.length > 680) {
          chunks.push(current);
          current = sentence.trim();
        } else {
          current = next;
        }
      });
      if (current) chunks.push(current);
      return chunks.length > 1 ? chunks : [paragraph];
    });
  }

  function removeClozePageArtifacts(value) {
    return cleanText(value)
      .replace(/\beveryone\s+2\s+needs help\b/g, "everyone needs help")
      .replace(/\s+\d+\s+(?=(?:needs help|[A-Z][a-z]+ing has|Part\s+A)\b)/g, " ");
  }

  function cleanPartBPassage(value) {
    return cleanText(value)
      .replace(/^Part\s+B\s*/i, "")
      .replace(/^Directions[：:][\s\S]*?\(10 points[)）]\s*/i, "")
      .replace(/\s*20\d{2}年管理类专业学位联考英语试题\s*·?\s*\d+\s*·?\s*\(共\d+页\)\s*/g, " ")
      .replace(/^\s*(?:\[[A-G]\]\s*.+?\s*){4,}/i, "")
      .replace(/\s+\[A\]\s+[\s\S]*$/i, "")
      .replace(/\s+A\.\s+[\s\S]*$/i, "")
      .replace(/\s+A\.\s+[\s\S]*?\s+41\.\s+[\s\S]*$/i, "")
      .replace(/^e\s+(?=Five Steps)/i, "")
      .trim();
  }

  function splitPartBPassage(value) {
    const text = cleanText(value);
    if (!text) return [];
    const marked = text.replace(/\s+(4[1-5])\s*_{2,}\.?\s*/g, "\n\n$1 ________. ");
    return marked.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  function getFallbackPartBOptions(answer) {
    if (/^[TF]$/.test(answer)) {
      return [
        { key: "T", text: "正确 / True" },
        { key: "F", text: "错误 / False" }
      ];
    }
    return [];
  }

  function extractPartBQuestionLabel(rawText, questionNo) {
    const source = cleanText(rawText);
    const pattern = new RegExp(`(?:^|\\s)${questionNo}\\s*\\.\\s*([^\\[]+?)(?=\\s*\\[[A-G]\\]|\\s+[A-G]\\.\\s|\\s*\\d{2}\\.|$)`);
    const match = source.match(pattern);
    return match ? cleanText(match[1]).replace(/[。.;；,，]+$/g, "") : "";
  }

  function cleanText(value) {
    return cleanKnownExamOcr(String(value || "")
      .replace(/\r/g, "")
      .replace(/\u0000/g, "")
      .replace(/管理类专业学位联考英语试题\s*[-－—]?\s*\d+\s*[-－—]?/g, "")
      .replace(/\s*MBA\s*大师\s*/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/鈥檚/g, "'s")
      .replace(/鈥檙/g, "'r")
      .replace(/鈥檝/g, "'v")
      .replace(/鈥檇/g, "'d")
      .replace(/鈥檒/g, "'l")
      .replace(/鈥檛/g, "n't")
      .replace(/鈥淚/g, "\"I")
      .replace(/鈥淲/g, "\"W")
      .replace(/鈥淭/g, "\"T")
      .replace(/鈥淎/g, "\"A")
      .replace(/鈥淢/g, "\"M")
      .replace(/鈥渁/g, "\"a")
      .replace(/鈥渢/g, "\"t")
      .replace(/鈥渘/g, "\"n")
      .replace(/鈥渞/g, "\"r")
      .replace(/鈥�/g, "\"")
      .replace(/鈥攁/g, "-a")
      .replace(/鈥攄/g, "-d")
      .replace(/鈥攕/g, "-s")
      .replace(/鈥攚/g, "-w")
      .replace(/鈥攖/g, "-t")
      .replace(/鈥攐/g, "-o")
      .replace(/鈥攊/g, "-i")
      .replace(/鈥攜/g, "-y")
      .replace(/鈥/g, "'")
      .replace(/锟\?0m/g, "£70m")
      .replace(/锟/g, "")
      .replace(/\s+/g, " ")
      .trim());
  }

  function cleanLooseWordStream(value) {
    return cleanKnownExamOcr(value)
      .replace(/\s+([,.;:?!%])/g, "$1")
      .replace(/([(\[$])\s+/g, "$1")
      .replace(/\s+([)\]”"])/g, "$1")
      .replace(/\s*-\s*/g, "-")
      .replace(/\bfizzled out$/i, "fizzled out.")
      .replace(/\.\.$/g, ".")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanKnownExamOcr(value) {
    return String(value || "")
      .replace(/\boud\b/g, "and")
      .replace(/\bserves earning\b/g, "servers earning")
      .replace(/\basking or help\b/gi, "asking for help")
      .replace(/\btalking it personally\b/gi, "taking it personally")
      .replace(/\bhelp-seeker generally\b/g, "help-seekers generally")
      .replace(/\bnew kind of services\b/g, "new kinds of services")
      .replace(/\bnew kind of service\b/g, "new kinds of services")
      .replace(/\btip flation\b/gi, "tipflation")
      .replace(/\bwell above 70% of what they owe\b/g, "well above 20% of what they owe")
      .replace(/\btoward to no-tipping service\b/gi, "toward no-tipping services")
      .replace(/\btowardno-tipping services\b/gi, "toward no-tipping services")
      .replace(/\bdo need to use\b/gi, "do not need to use")
      .replace(/\bBe humbl\b/g, "Be humble")
      .replace(/\bcenter for Policy Research\b/g, "Centre for Policy Research")
      .replace(/\bChandri Singh\b/g, "Chandni Singh")
      .replace(/\bWickguasgeck\b/g, "Wickquasgeck")
      .replace(/\bparts of our urban spaces\b/g, "parks of our urban spaces")
      .replace(/\bpeople cand, animals\b/g, "people (and animals)")
      .replace(/\botherwise neat green,\b/g, "otherwise neat green spaces")
      .replace(/\bcoercwe\b/g, "coercive")
      .replace(/\bseruces\b/g, "services")
      .replace(/\bservwe\b/g, "service")
      .replace(/\bpnces\b/g, "prices")
      .replace(/\bprlces\b/g, "prices")
      .replace(/\bmcome\b/g, "income")
      .replace(/\bbecommg\b/g, "becoming")
      .replace(/\bgrowmg\b/g, "growing");
  }

  function cleanOptionText(value) {
    return cleanText(value)
      .replace(/\s*管理类专业学位联考英语试题\s*[-－—]?\s*\d+\s*[-－—]?.*$/g, "")
      .replace(/\s*MBA\s*大师.*$/gi, "")
      .trim();
  }

  function cleanExamPrompt(value, type, questionNo = 0) {
    let text = cleanText(value);
    if (type === "translation") {
      text = text
        .replace(/^Section\s+III\s+Translation\s*/i, "")
        .replace(/^\d+\.\s*Directions:\s*Translate the following text into Chinese\.?\s*Write your translation on the ANSWER SHEET\.?\s*\(\d+\s*points?\)\s*\??\s*/i, "")
        .replace(/^Translate the following text into Chinese\.?\s*/i, "");
    }
    if (type === "writing") {
      text = text
        .replace(/^Part\s+[AB]\s*/i, "")
        .replace(/\s*管理类专业学位联考英语试题(?:参考答案)?\s*[-－—·]?\s*\d+\s*[-－—·]?\s*（?共\s*\d+\s*页）?.*$/g, "")
        .replace(/\s+20\d{2}\s*年\s*管理类专业学位联考英语试题(?:参考答案)?[\s\S]*$/g, "")
        .replace(/\bto\.\s+1\)/i, "to 1)")
        .replace(/(\d\))(?=\S)/g, "$1 ")
        .replace(/\(\s*10\s*points?\s*\)/gi, "(10 points)")
        .replace(/\(\s*15\s*points?\s*\)/gi, "(15 points)")
        .replace(/\(\s*15points?\s*\)/gi, "(15 points)")
        .replace(/\(\s*15\s*points?\s*\)[\s\S]*$/i, "(15 points)")
        .replace(/\s+1\.[A-D]\s+2\.[A-D][\s\S]*$/i, "")
        .replace(/\s+\d{1,2}\s*$/g, "");
    }
    return text.trim();
  }

  function cleanExamDirections(value) {
    return cleanText(value)
      .replace(/^Section\s+I\s+Use\s+of\s+English\s*/i, "")
      .replace(/\bword\s+\(s\)/gi, "word(s)")
      .replace(/\bmark\s+A,\s*B,\s*C\s+or\s+D\b/gi, "mark [A], [B], [C] or [D]")
      .replace(/\bmark\s*A,\s*B,\s*C\s*or\s*D\b/gi, "mark [A], [B], [C] or [D]")
      .replace(/\bANSWER SHEET\s+\./gi, "ANSWER SHEET.")
      .replace(/\(\s*10\.\s+points?\s*\)/gi, "(10 points)")
      .replace(/\(\s*15\.\s+points?\s*\)/gi, "(15 points)")
      .replace(/\(\s*10\s*points?\s*\)/gi, "(10 points)")
      .replace(/\(\s*15\s*points?\s*\)/gi, "(15 points)");
  }

  global.KAOYAN_ANALYSIS_DATA = {
    YEARS,
    SECTIONS,
    listYears: () => [...YEARS],
    listSections: () => SECTIONS.map((section) => ({ ...section })),
    loadYear,
    loadSection,
    getSectionQuestions,
    getYearQuestions,
    getQuestion,
    getPrevQuestion,
    getNextQuestion,
    getYearStats,
    normalizeSectionQuestions
  };
})(window);
