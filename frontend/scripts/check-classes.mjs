import fs from "fs";
import path from "path";

function getAllFiles(dir, exts = [".tsx", ".ts"]) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item !== "node_modules" && item !== ".next") {
        files = files.concat(getAllFiles(full, exts));
      }
    } else if (exts.some(e => item.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

const css = fs.readFileSync(path.join("app", "globals.css"), "utf-8");
// extract defined classes from css (.className)
const cssClasses = new Set();
const classRegex = /\.([a-zA-Z0-9_\-]+)/g;
let m;
while ((m = classRegex.exec(css)) !== null) {
  cssClasses.add(m[1]);
}

console.log("CSS defines", cssClasses.size, "classes");

const files = getAllFiles("app").concat(getAllFiles("components"));
const usedClasses = new Set();
const classNameRegex = /className=["'`]([^"'`]+)["'`]/g;

const missing = new Map();

for (const f of files) {
  const content = fs.readFileSync(f, "utf-8");
  while ((m = classNameRegex.exec(content)) !== null) {
    const raw = m[1];
    const parts = raw.split(/\s+/).filter(Boolean);
    for (const p of parts) {
      if (p.includes("${") || p.includes("{") || p.includes("}")) continue;
      usedClasses.add(p);
      if (!cssClasses.has(p)) {
        if (!missing.has(p)) missing.set(p, []);
        missing.get(p).push(f);
      }
    }
  }
}

console.log("\n--- Total classes used in JSX: " + usedClasses.size + " ---");
console.log("--- Missing from globals.css: " + missing.size + " ---");
for (const [cls, fileList] of missing.entries()) {
  console.log(`- ${cls} (in ${fileList.map(f => path.basename(f)).join(", ")})`);
}
