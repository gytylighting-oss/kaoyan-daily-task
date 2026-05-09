const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contentPath = path.join(root, "generated-content.js");
const examDir = path.join(root, "exam-folder-ocr");

global.window = {};
eval(fs.readFileSync(contentPath, "utf8"));

const commonPhrases = [
  "according to", "in order to", "as a result", "as a result of", "such as",
  "rather than", "instead of", "because of", "due to", "lead to", "result in",
  "depend on", "focus on", "based on", "be based on", "in terms of", "refer to",
  "contribute to", "benefit from", "pay attention to", "play a role in",
  "take place", "take part in", "take advantage of", "take into account",
  "make sure", "make it possible", "make a difference", "have to do with",
  "be likely to", "be able to", "be willing to", "be responsible for",
  "be concerned with", "be related to", "be known as", "be seen as",
  "be viewed as", "be regarded as", "regard as", "think of", "look for",
  "search for", "turn out", "turn to", "turn into", "put forward", "point out",
  "figure out", "find out", "carry out", "work out", "set up", "give up",
  "show up", "build up", "break down", "slow down", "bring about", "deal with",
  "cope with", "account for", "allow for", "call for", "ask for", "look at",
  "look into", "look back", "look forward to", "go through", "get through",
  "come from", "come up with", "come to", "in addition", "on the other hand",
  "at the same time", "in contrast", "by contrast", "for example", "for instance",
  "in fact", "in general", "in particular", "in the end", "as well as",
  "no longer", "more than", "less than", "no less than", "at least",
  "for the first time", "over the past", "over time", "in the past", "so that",
  "even if", "even though", "as if", "as though", "as long as", "as soon as",
  "as far as", "with regard to", "on account of", "on average", "by all means",
  "at odds with", "in favor of", "in support of", "be entitled to", "be subject to",
  "be exposed to", "be limited to", "be linked to", "be applied to", "be opposed to",
  "be similar to", "be different from", "be familiar with", "be aware of",
  "be conscious of", "be obsessed with", "be satisfied with", "be vulnerable to",
  "be accessible to", "be interested in", "be deprived of", "be equipped with",
  "be confronted with", "be inclined to", "be resistant to", "be cautious about",
  "be applicable to", "be accountable to", "be second to", "be dominant over",
  "be peculiar to", "be obliged to", "be unlikely to", "be puzzled by",
  "be disappointed at", "be generous to", "be involved in", "be engaged in",
  "be committed to", "be expected to", "be supposed to", "be required to",
  "be designed to", "be used to", "used to", "tend to", "seek to", "fail to",
  "intend to", "prefer to", "prefer...to", "provide with", "provide for",
  "prevent from", "keep from", "derive from", "result from", "evolve from",
  "suffer from", "stem from", "protect from", "draw on", "draw a conclusion",
  "stress the importance of", "attach importance to", "give priority to",
  "cast doubt on", "exert influence on", "take pride in", "take measures",
  "take efforts", "take the lead", "take one's stand", "in trouble", "out of date",
  "at stake", "in consequence", "on the basis of", "on the contrary", "in turn",
  "in brief", "in theory", "at large", "by nature", "by accident", "if only",
  "only if", "once for all", "no matter", "no doubt", "a number of", "a variety of",
  "a series of", "a range of", "a lack of", "lack of", "a bit of", "the number of",
  "the amount of", "the rest of", "the majority of", "the purpose of", "the reason for",
  "the same as", "for fear of", "for fear that", "as a means of", "ward off",
  "shut down", "split up", "wipe out", "die out", "sum up", "cling to", "insist on",
  "comply with", "approve of", "accuse of", "owe to", "subscribe to", "trade with",
  "compete with", "have nothing to do with", "stumble on", "go against",
  "do harm to", "add to", "sign on", "set out", "stick to", "feel free to"
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhrase(value) {
  return normalizeText(String(value || "").replace(/\.\.\./g, " "));
}

function countPhrase(text, phrase) {
  const normalized = normalizePhrase(phrase);
  if (!normalized) return 0;
  const pattern = new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}\\b`, "g");
  return (text.match(pattern) || []).length;
}

const examText = fs.existsSync(examDir)
  ? normalizeText(fs.readdirSync(examDir).filter((file) => file.endsWith(".txt")).map((file) => fs.readFileSync(path.join(examDir, file), "utf8")).join("\n"))
  : "";

const content = window.KAOYAN_CONTENT;
const byPhrase = new Map();
for (const phrase of content.phrases || []) {
  const key = normalizePhrase(phrase.phrase);
  if (!key) continue;
  byPhrase.set(key, { ...phrase, examFrequency: countPhrase(examText, phrase.phrase) });
}

for (const phrase of commonPhrases) {
  const key = normalizePhrase(phrase);
  if (!key || byPhrase.has(key)) continue;
  const frequency = countPhrase(examText, phrase);
  if (!frequency) continue;
  byPhrase.set(key, {
    id: `exam-phrase-${byPhrase.size + 1}`,
    phrase,
    meaning: `真题高频短语，已按本地真题 OCR 出现 ${frequency} 次排序。`,
    example: `This phrase appears in the exam corpus: ${phrase}.`,
    translation: "这个短语来自本地真题语料，先认读，再回到原文理解。",
    source: "真题频次整理",
    examFrequency: frequency
  });
}

content.phrases = [...byPhrase.values()].sort((a, b) => {
  const frequencyDiff = Number(b.examFrequency || 0) - Number(a.examFrequency || 0);
  if (frequencyDiff) return frequencyDiff;
  return String(a.phrase).localeCompare(String(b.phrase));
}).map((phrase, index) => ({ ...phrase, id: phrase.id || `phrase-${index + 1}` }));
content.generatedAt = new Date().toISOString();

fs.writeFileSync(contentPath, `window.KAOYAN_CONTENT = ${JSON.stringify(content, null, 2)};\n`, "utf8");
console.log(`phrases=${content.phrases.length}`);
console.log(content.phrases.slice(0, 20).map((p) => `${p.phrase}:${p.examFrequency || 0}`).join("\n"));
