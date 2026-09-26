import { readFile } from 'node:fs/promises';

const SOURCE_PATH = 'docs/reference/Typical Activities in industy standard tools.tsv';
const EXPECTED_HEADER = [
  'Acronym',
  'Full Name',
  'Horizontal/Vertical',
  'Industry',
  'Activities Managed/Coordinated'
];

function normaliseActivity(value) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll('&', 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const text = await readFile(SOURCE_PATH, 'utf8');
const lines = text
  .split(/\r?\n/u)
  .filter((line) => line.trim().length > 0);

if (lines.length < 2) {
  throw new Error(`${SOURCE_PATH} contains no evidence rows.`);
}

const header = lines[0].split('\t');

if (header.length !== EXPECTED_HEADER.length || header.some((value, index) => value !== EXPECTED_HEADER[index])) {
  throw new Error(
    `${SOURCE_PATH} has an unexpected header. Expected: ${EXPECTED_HEADER.join(' | ')}`
  );
}

const rows = [];
const uniqueObservations = new Set();
const scopes = new Set();
const industries = new Set();
const toolAcronyms = new Set();
let observationCount = 0;

for (let index = 1; index < lines.length; index += 1) {
  const sourceLine = index + 1;
  const fields = lines[index].split('\t');

  if (fields.length !== EXPECTED_HEADER.length) {
    throw new Error(
      `${SOURCE_PATH}:${sourceLine} has ${fields.length} columns; expected ${EXPECTED_HEADER.length}.`
    );
  }

  const [acronym, fullName, scope, industry, activitiesField] = fields.map((value) => value.trim());

  if (!acronym || !fullName || !scope || !industry || !activitiesField) {
    throw new Error(`${SOURCE_PATH}:${sourceLine} contains a blank required field.`);
  }

  if (scope !== 'Horizontal' && scope !== 'Vertical') {
    throw new Error(
      `${SOURCE_PATH}:${sourceLine} has unsupported Horizontal/Vertical value "${scope}".`
    );
  }

  const activities = activitiesField
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean);

  if (activities.length === 0) {
    throw new Error(`${SOURCE_PATH}:${sourceLine} contains no activity observations.`);
  }

  rows.push({ acronym, fullName, scope, industry, activities });
  scopes.add(scope);
  industries.add(industry);
  toolAcronyms.add(acronym);
  observationCount += activities.length;

  for (const activity of activities) {
    const key = normaliseActivity(activity);
    if (!key) {
      throw new Error(`${SOURCE_PATH}:${sourceLine} contains an unnormalisable activity phrase.`);
    }
    uniqueObservations.add(key);
  }
}

if (rows.length < 100) {
  throw new Error(
    `${SOURCE_PATH} contains only ${rows.length} tool rows; expected a non-trivial market evidence population.`
  );
}

if (observationCount < 500 || uniqueObservations.size < 200) {
  throw new Error(
    `${SOURCE_PATH} appears truncated: ${observationCount} observations / ${uniqueObservations.size} unique normalised phrases.`
  );
}

for (const scope of ['Horizontal', 'Vertical']) {
  if (!scopes.has(scope)) {
    throw new Error(`${SOURCE_PATH} is missing ${scope} tool evidence.`);
  }
}

for (const industry of ['Cross-Industry', 'Construction']) {
  if (!industries.has(industry)) {
    throw new Error(`${SOURCE_PATH} is missing ${industry} evidence.`);
  }
}

for (const acronym of ['ERP', 'HCM', 'IAM', 'BIM', 'PMIS']) {
  if (!toolAcronyms.has(acronym)) {
    throw new Error(`${SOURCE_PATH} is missing required representative tool class ${acronym}.`);
  }
}

console.log(
  `Market tool activity evidence is structurally valid: ${rows.length} tool rows, ${observationCount} activity observations, ${uniqueObservations.size} unique normalised phrases.`
);
