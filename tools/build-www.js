const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "www");

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "generated-content.js",
  "generated-lookup.js",
  "generated-reading-overrides.js",
  "generated-grammar.js",
  "generated-writing.js",
  "generated-analysis-bundle.js",
  "exam-analysis-data.js",
  "generated-exam.js",
  "manifest.webmanifest",
  "service-worker.js",
  "icon-192.svg",
  "icon-512.svg"
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required web asset: ${file}`);
  }
  fs.copyFileSync(source, path.join(outDir, file));
}

copyDirectoryIfExists("analysis_processed");
copyDirectoryIfExists("images");
copyDirectoryIfExists("大作文图片");

const htmlPath = path.join(outDir, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/<script>\s*if \("serviceWorker"[\s\S]*?<\/script>/, "");
fs.writeFileSync(htmlPath, html, "utf8");

console.log(`Built ${files.length} web assets -> ${outDir}`);

function copyDirectoryIfExists(name) {
  const source = path.join(root, name);
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, path.join(outDir, name), { recursive: true });
}
