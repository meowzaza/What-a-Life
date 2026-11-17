import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIRS = [path.resolve('src/ui'), path.resolve('src/data')];
const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.json']);

// Matches Unicode emoji / pictographic / dingbat symbols & variation selector / ZWJ used in emoji sequences
const EMOJI_REGEX = /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const violations: { file: string; line: number; matches: string[] }[] = [];

  for (const dir of TARGET_DIRS) {
    const files = walkFiles(dir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((lineText, idx) => {
        const matches = lineText.match(EMOJI_REGEX);
        if (matches && matches.length > 0) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: idx + 1,
            matches,
          });
        }
      });
    }
  }

  if (violations.length > 0) {
    console.error('พบอิโมจิในโค้ด UI/Data (ห้ามใช้อิโมจิในโปรเจกต์):');
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} -> ${v.matches.join(' ')}`);
    }
    process.exit(1);
  }

  console.log('✓ ผ่าน check:emoji (ไม่พบอิโมจิใน src/ui และ src/data)');
}

main();
