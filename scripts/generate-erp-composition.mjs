import { readFile, writeFile } from 'node:fs/promises';

const CHECK = process.argv.includes('--check');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift();

  if (!header) {
    throw new Error('CSV has no header.');
  }

  return rows
    .filter((candidate) => candidate.some((value) => value !== ''))
    .map((candidate) =>
      Object.fromEntries(header.map((name, index) => [name, candidate[index] ?? '']))
    );
}

function csvValue(value) {
  const stringValue = String(value ?? '');

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function csvContent(header, rows) {
  return (
    [header, ...rows]
      .map((row) => row.map(csvValue).join(','))
      .join('\n') + '\n'
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].join('; ');
}

async function generateActivityExecutionContract() {
  const [activityText, engineText] = await Promise.all([
    readFile('docs/architecture/canonical-activity-capability-map.csv', 'utf8'),
    readFile('docs/architecture/canonical-native-tool-engine-register.csv', 'utf8')
  ]);

  const activities = parseCsv(activityText);
  const engines = parseCsv(engineText);
  const engineById = new Map(engines.map((engine) => [engine.engine_id, engine]));
  let missingEngineRows = 0;

  const header = [
    'execution_contract_id',
    'capability_id',
    'function_code',
    'function_name',
    'l2_id',
    'l2_name',
    'activity_sequence',
    'activity_name',
    'work_pattern',
    'native_engine_ids',
    'native_engine_names',
    'native_engine_classes',
    'native_engine_implementation_states',
    'canonical_object_families',
    'shared_platform_engine_ids',
    'deployment_purpose_rule',
    'execution_contract_state',
    'effective_date'
  ];

  const rows = activities.map((activity) => {
    const engineIds = (activity.native_engine_ids || '')
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean);
    const mappedEngines = engineIds
      .map((engineId) => engineById.get(engineId))
      .filter(Boolean);

    if (mappedEngines.length !== engineIds.length) {
      missingEngineRows += 1;
    }

    return [
      `ERP-${activity.capability_id}`,
      activity.capability_id,
      activity.function_code,
      activity.function_name,
      activity.l2_id,
      activity.l2_name,
      activity.activity_sequence,
      activity.activity_name,
      activity.work_pattern,
      activity.native_engine_ids,
      unique(mappedEngines.map((engine) => engine.engine_name)),
      unique(mappedEngines.map((engine) => engine.engine_class)),
      unique(mappedEngines.map((engine) => engine.implementation_state)),
      unique(
        mappedEngines.flatMap((engine) =>
          (engine.canonical_object_families || '')
            .split(';')
            .map((value) => value.trim())
        )
      ),
      activity.shared_platform_engine_ids,
      'RUNTIME_DEPLOYMENT_PURPOSE__FUNCTIONAL_GOVERNANCE_OR_FUNCTIONAL_DELIVERY',
      mappedEngines.length === engineIds.length
        ? 'ACTIVITY_ENGINE_OBJECT_FAMILY_BASELINE'
        : 'ENGINE_MAPPING_EXCEPTION',
      '2026-09-24'
    ];
  });

  if (activities.length !== 1510) {
    throw new Error(`Expected 1510 Activity contracts, found ${activities.length}.`);
  }

  if (missingEngineRows !== 0) {
    throw new Error(`Found ${missingEngineRows} Activity rows with unresolved Native Engine IDs.`);
  }

  return csvContent(header, rows);
}

async function generateCbeJobExecutionRequirements() {
  const sourceText = await readFile('docs/reference/cbe-job-market-tool-matrix.csv', 'utf8');
  const jobs = parseCsv(sourceText);

  const header = [
    'job_execution_contract_id',
    'job_profile_id',
    'canonical_name',
    'delivery_domain_id',
    'participating_function_codes_candidate',
    'lifecycle_stages',
    'specialist_capabilities',
    'primary_structured_records',
    'current_market_work_pattern',
    'nublox_native_requirement',
    'employment_position_rule',
    'deployment_purpose_rule',
    'native_engine_composition_state',
    'canonical_object_mapping_state',
    'work_product_mapping_state',
    'workspace_acceptance_state',
    'effective_date'
  ];

  const rows = jobs.map((job) => [
    `ERP-${job.job_profile_id}`,
    job.job_profile_id,
    job.canonical_name,
    job.delivery_domain_id,
    job.participating_function_codes_candidate,
    job.lifecycle_stages,
    job.specialist_capabilities,
    job.primary_structured_records,
    job.current_market_work_pattern,
    job.nublox_native_requirement,
    'PERSON_EXECUTES_THROUGH_ACTIVE_POSITION_JOB_PROFILE_AND_CONTEXTUAL_DEPLOYMENT',
    'RUNTIME_DEPLOYMENT_PURPOSE__FUNCTIONAL_GOVERNANCE_OR_FUNCTIONAL_DELIVERY',
    'TO_MAP_TO_NATIVE_ENGINES',
    'TO_MAP_TO_CANONICAL_OBJECTS',
    'SOURCE_STRUCTURED_RECORDS_IDENTIFIED__GOVERNED_OUTPUT_MAPPING_REQUIRED',
    'NOT_ACCEPTED_UNTIL_JOB_CAN_BE_PERFORMED_END_TO_END_IN_NUBLOX',
    '2026-09-24'
  ]);

  if (jobs.length !== 84) {
    throw new Error(`Expected 84 CBE Job Profile requirements, found ${jobs.length}.`);
  }

  return csvContent(header, rows);
}

async function assertProcessSpine() {
  const processText = await readFile(
    'docs/architecture/enterprise-end-to-end-erp-process-spine.csv',
    'utf8'
  );
  const processes = parseCsv(processText);
  const ids = new Set(processes.map((process) => process.process_id));

  if (processes.length !== 17) {
    throw new Error(`Expected 17 ERP process-spine entries, found ${processes.length}.`);
  }

  if (ids.size !== processes.length) {
    throw new Error('ERP process spine contains duplicate process IDs.');
  }
}

async function reconcile(path, expected) {
  if (CHECK) {
    const current = await readFile(path, 'utf8');

    if (current !== expected) {
      throw new Error(
        `${path} is stale. Run "pnpm architecture:generate" and commit the result.`
      );
    }

    return;
  }

  await writeFile(path, expected, 'utf8');
}

const [activityContract, cbeJobRequirements] = await Promise.all([
  generateActivityExecutionContract(),
  generateCbeJobExecutionRequirements()
]);

await Promise.all([
  reconcile(
    'docs/architecture/canonical-activity-erp-execution-contract.csv',
    activityContract
  ),
  reconcile(
    'docs/architecture/cbe-job-erp-execution-requirement-register.csv',
    cbeJobRequirements
  ),
  assertProcessSpine()
]);

console.log(
  CHECK
    ? 'ERP composition baselines are consistent.'
    : 'ERP composition baselines regenerated.'
);
