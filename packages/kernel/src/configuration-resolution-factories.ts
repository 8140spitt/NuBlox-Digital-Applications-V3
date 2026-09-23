import { invariant } from './errors.js';
import type {
  ConfigurationCriterion,
  ConfigurationResolutionDefinition,
  ConfigurationResolutionItem,
  ConfigurationResolutionRun
} from './configuration-resolution.js';

function nonEmpty(value: string, label: string): void {
  invariant(value.trim().length > 0, `${label} must not be empty.`);
}
function date(value: string, label: string): number {
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), `${label} must be a valid date/time.`);
  return parsed;
}
function effectivePeriod(from: string | undefined, to: string | undefined): void {
  const start = from ? date(from, 'Configuration Resolution Definition effectiveFrom') : undefined;
  const end = to ? date(to, 'Configuration Resolution Definition effectiveTo') : undefined;
  invariant(end === undefined || (start !== undefined && end >= start), 'Configuration Resolution Definition effective period is invalid.');
}

export function createConfigurationResolutionDefinition(
  input: ConfigurationResolutionDefinition
): ConfigurationResolutionDefinition {
  nonEmpty(input.code, 'Configuration Resolution Definition code');
  nonEmpty(input.name, 'Configuration Resolution Definition name');
  invariant(Number.isInteger(input.version) && input.version > 0, 'Configuration Resolution Definition version must be positive.');
  effectivePeriod(input.effectiveFrom, input.effectiveTo);
  return Object.freeze({ ...input });
}

export function createConfigurationCriterion(
  input: ConfigurationCriterion,
  definition: ConfigurationResolutionDefinition
): ConfigurationCriterion {
  invariant(input.tenantId === definition.tenantId, 'Configuration Criterion and Definition must belong to the same tenant.');
  invariant(input.definitionId === definition.id, 'Configuration Criterion must reference the supplied Definition.');
  invariant(definition.status === 'ACTIVE', 'Configuration Resolution Definition must be active.');
  invariant(Number.isInteger(input.sequence) && input.sequence >= 0, 'Configuration Criterion sequence must be non-negative.');
  invariant(typeof input.configuration === 'object' && input.configuration !== null, 'Configuration Criterion configuration is required.');
  return Object.freeze({ ...input, configuration: Object.freeze({ ...input.configuration }) });
}

export function createConfigurationResolutionRun(
  input: ConfigurationResolutionRun,
  definition: ConfigurationResolutionDefinition
): ConfigurationResolutionRun {
  invariant(input.tenantId === definition.tenantId, 'Configuration Resolution Run and Definition must belong to the same tenant.');
  invariant(input.definitionId === definition.id, 'Configuration Resolution Run must reference the supplied Definition.');
  invariant(definition.status === 'ACTIVE', 'Configuration Resolution Definition must be active.');
  nonEmpty(input.contextObjectId, 'Configuration Resolution context object');
  date(input.input.evaluatedAt, 'Configuration Resolution evaluatedAt');
  date(input.startedAt, 'Configuration Resolution startedAt');
  invariant(input.input.configurationItemIds.length > 0, 'Configuration Resolution requires at least one Configuration Item.');
  invariant(new Set(input.input.configurationItemIds).size === input.input.configurationItemIds.length, 'Configuration Resolution item list must not contain duplicates.');
  invariant(input.status === 'RUNNING', 'New Configuration Resolution Run must start RUNNING.');
  return Object.freeze({
    ...input,
    input: Object.freeze({
      ...input.input,
      configurationItemIds: Object.freeze([...input.input.configurationItemIds]),
      ...(input.input.explicitVersions
        ? { explicitVersions: Object.freeze({ ...input.input.explicitVersions }) }
        : {})
    })
  });
}

export function completeConfigurationResolutionRun(
  run: ConfigurationResolutionRun,
  status: Exclude<ConfigurationResolutionRun['status'], 'RUNNING'>,
  completedAt: string
): ConfigurationResolutionRun {
  invariant(run.status === 'RUNNING', 'Only a RUNNING Configuration Resolution can be completed.');
  date(completedAt, 'Configuration Resolution completedAt');
  invariant(Date.parse(completedAt) >= Date.parse(run.startedAt), 'Configuration Resolution completion cannot precede start.');
  return Object.freeze({ ...run, status, completedAt });
}

export function createConfigurationResolutionItem(
  input: ConfigurationResolutionItem
): ConfigurationResolutionItem {
  if (input.status === 'RESOLVED') {
    nonEmpty(input.selectedVersion ?? '', 'Resolved configuration version');
    invariant(Boolean(input.criterionId), 'Resolved Configuration Item must reference the resolving Criterion.');
  } else {
    invariant(!input.selectedVersion, 'Unresolved Configuration Item must not contain a selected version.');
  }
  if (input.message !== undefined) nonEmpty(input.message, 'Configuration Resolution Item message');
  return Object.freeze({ ...input, evidence: Object.freeze({ ...input.evidence }) });
}
