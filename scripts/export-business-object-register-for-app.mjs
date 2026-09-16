import fs from 'node:fs';
import path from 'node:path';

const parseCsvLine = (line) => {
  const values = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
};

const readCsv = (filePath) => {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
};

const root = process.cwd();
const dataModel = path.join(root, 'docs', 'data-model');
const register = readCsv(path.join(dataModel, 'canonical-business-object-register.csv'));
const duplicates = readCsv(path.join(dataModel, 'canonical-business-object-duplicates.csv'));

const familyMap = new Map();
const kindMap = new Map();
for (const row of register) {
  const family = familyMap.get(row.family_id) ?? {
    id: row.family_id,
    name: row.family_name,
    count: 0
  };
  family.count += 1;
  familyMap.set(row.family_id, family);
  kindMap.set(row.semantic_kind, (kindMap.get(row.semantic_kind) ?? 0) + 1);
}

const payload = {
  summary: {
    candidateOccurrences: register.length,
    uniqueNames: new Set(register.map((row) => row.canonical_name.toLowerCase())).size,
    duplicateGroups: duplicates.length,
    familyCount: familyMap.size
  },
  families: [...familyMap.values()],
  semanticKinds: [...kindMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  duplicates,
  objects: register
};

const targetDir = path.join(root, 'app', 'src', 'lib', 'generated');
fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(
  path.join(targetDir, 'business-object-register.json'),
  `${JSON.stringify(payload, null, 2)}\n`
);

console.log(`Exported ${register.length} business-object candidates for the application.`);
