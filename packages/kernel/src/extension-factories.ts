import { invariant } from './errors.js';
import type { Person } from './model.js';
import type {
  ExtensionCompatibilityAssessment,
  ExtensionComponent,
  ExtensionDefinition,
  ExtensionPackageVersion,
  ExtensionReconciliationItem,
  ExtensionReconciliationRun
} from './extension.js';

function sameTenant(a: { tenantId: string }, b: { tenantId: string }, label: string): void {
  invariant(a.tenantId === b.tenantId, `${label} must stay within one tenant.`);
}
function text(value: string, label: string): void {
  invariant(value.trim().length > 0, `${label} must not be empty.`);
}
function validDate(value: string, label: string): number {
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), `${label} must be a valid date/time.`);
  return parsed;
}

export function createExtensionDefinition(
  input: ExtensionDefinition
): ExtensionDefinition {
  text(input.code, 'Extension Definition code');
  text(input.name, 'Extension Definition name');
  text(input.ownerReference, 'Extension Definition ownerReference');
  if (input.description) text(input.description, 'Extension Definition description');
  invariant(input.status === 'ACTIVE', 'New Extension Definition must start ACTIVE.');
  return Object.freeze({ ...input });
}

export function createExtensionPackageVersion(
  input: ExtensionPackageVersion,
  definition: ExtensionDefinition,
  creator: Person
): ExtensionPackageVersion {
  sameTenant(input, definition, 'Extension Package Definition');
  sameTenant(input, creator, 'Extension Package creator');
  invariant(
    input.extensionDefinitionId === definition.id,
    'Extension Package Version must reference the supplied Definition.'
  );
  invariant(definition.status === 'ACTIVE', 'Extension Package Version requires an ACTIVE Definition.');
  invariant(input.createdByPersonId === creator.id, 'Extension Package creator reference does not match.');
  text(input.version, 'Extension Package version');
  text(input.checksum, 'Extension Package checksum');
  validDate(input.createdAt, 'Extension Package createdAt');
  invariant(input.status === 'FROZEN', 'New Extension Package Version must be immutable and FROZEN.');
  if (input.minimumPlatformVersion) text(input.minimumPlatformVersion, 'Minimum platform version');
  if (input.maximumPlatformVersion) text(input.maximumPlatformVersion, 'Maximum platform version');
  return Object.freeze({ ...input, manifest: Object.freeze({ ...input.manifest }) });
}

export function createExtensionComponent(
  input: ExtensionComponent,
  packageVersion: ExtensionPackageVersion
): ExtensionComponent {
  sameTenant(input, packageVersion, 'Extension Component Package');
  invariant(
    input.packageVersionId === packageVersion.id,
    'Extension Component must reference the supplied Package Version.'
  );
  invariant(packageVersion.status === 'FROZEN', 'Extension Component requires a FROZEN Package Version.');
  text(input.componentKey, 'Extension Component key');
  text(input.checksum, 'Extension Component checksum');
  invariant(Number.isInteger(input.sequence) && input.sequence > 0, 'Extension Component sequence must be positive.');
  if (input.targetObjectType) text(input.targetObjectType, 'Extension Component targetObjectType');
  if (input.targetReference) text(input.targetReference, 'Extension Component targetReference');
  return Object.freeze({ ...input, definition: Object.freeze({ ...input.definition }) });
}

export function createExtensionCompatibilityAssessment(
  input: ExtensionCompatibilityAssessment,
  packageVersion: ExtensionPackageVersion,
  assessor: Person
): ExtensionCompatibilityAssessment {
  sameTenant(input, packageVersion, 'Extension Compatibility Package');
  sameTenant(input, assessor, 'Extension Compatibility assessor');
  invariant(
    input.packageVersionId === packageVersion.id,
    'Extension Compatibility Assessment must reference the supplied Package Version.'
  );
  invariant(input.assessedByPersonId === assessor.id, 'Extension Compatibility assessor reference does not match.');
  text(input.platformVersion, 'Platform version');
  validDate(input.assessedAt, 'Compatibility assessedAt');
  return Object.freeze({ ...input, evidence: Object.freeze({ ...input.evidence }) });
}

export function createExtensionReconciliationRun(
  input: ExtensionReconciliationRun,
  definition: ExtensionDefinition,
  fromPackage: ExtensionPackageVersion,
  toPackage: ExtensionPackageVersion,
  starter: Person
): ExtensionReconciliationRun {
  sameTenant(input, definition, 'Extension Reconciliation Definition');
  sameTenant(input, fromPackage, 'Extension Reconciliation source Package');
  sameTenant(input, toPackage, 'Extension Reconciliation target Package');
  sameTenant(input, starter, 'Extension Reconciliation starter');
  invariant(input.extensionDefinitionId === definition.id, 'Reconciliation Run Definition reference does not match.');
  invariant(fromPackage.extensionDefinitionId === definition.id, 'Source Package must belong to the Extension Definition.');
  invariant(toPackage.extensionDefinitionId === definition.id, 'Target Package must belong to the Extension Definition.');
  invariant(input.fromPackageVersionId === fromPackage.id, 'Source Package reference does not match.');
  invariant(input.toPackageVersionId === toPackage.id, 'Target Package reference does not match.');
  invariant(fromPackage.id !== toPackage.id, 'Reconciliation Run requires different source and target Package Versions.');
  invariant(input.startedByPersonId === starter.id, 'Reconciliation starter reference does not match.');
  text(input.targetPlatformVersion, 'Target platform version');
  validDate(input.startedAt, 'Reconciliation startedAt');
  invariant(input.status === 'RUNNING', 'New Extension Reconciliation Run must start RUNNING.');
  invariant(!input.completedAt && !input.summary, 'New Extension Reconciliation Run must not contain completion evidence.');
  return Object.freeze({ ...input });
}

export function createExtensionReconciliationItem(
  input: ExtensionReconciliationItem,
  run: ExtensionReconciliationRun,
  recorder: Person
): ExtensionReconciliationItem {
  sameTenant(input, run, 'Extension Reconciliation Item Run');
  sameTenant(input, recorder, 'Extension Reconciliation Item recorder');
  invariant(input.reconciliationRunId === run.id, 'Reconciliation Item must reference the supplied Run.');
  invariant(run.status === 'RUNNING', 'Reconciliation Item requires a RUNNING Reconciliation Run.');
  invariant(input.recordedByPersonId === recorder.id, 'Reconciliation Item recorder reference does not match.');
  text(input.componentKey, 'Reconciliation Item componentKey');
  validDate(input.recordedAt, 'Reconciliation Item recordedAt');
  if (input.sourceChecksum) text(input.sourceChecksum, 'Reconciliation Item sourceChecksum');
  if (input.targetChecksum) text(input.targetChecksum, 'Reconciliation Item targetChecksum');
  if (input.rationale) text(input.rationale, 'Reconciliation Item rationale');
  if (input.outcome === 'CONFLICT' || input.outcome === 'MANUAL_REQUIRED') {
    invariant(Boolean(input.rationale), 'Conflict or manual reconciliation requires rationale.');
  }
  if (input.outcome === 'RESOLVED') {
    invariant(Boolean(input.resolvedDefinition), 'Resolved reconciliation requires resolvedDefinition evidence.');
  }
  return Object.freeze({
    ...input,
    ...(input.resolvedDefinition
      ? { resolvedDefinition: Object.freeze({ ...input.resolvedDefinition }) }
      : {})
  });
}

export function completeExtensionReconciliationRun(
  current: ExtensionReconciliationRun,
  items: ReadonlyArray<ExtensionReconciliationItem>,
  completedAt: string,
  summary: string
): ExtensionReconciliationRun {
  invariant(current.status === 'RUNNING', 'Only a RUNNING Extension Reconciliation Run can complete.');
  invariant(items.length > 0, 'Extension Reconciliation Run requires item evidence.');
  invariant(
    items.every((item) => item.reconciliationRunId === current.id),
    'All Reconciliation Items must belong to the Run.'
  );
  validDate(completedAt, 'Reconciliation completedAt');
  invariant(Date.parse(completedAt) >= Date.parse(current.startedAt), 'Reconciliation cannot complete before it starts.');
  text(summary, 'Reconciliation summary');
  const blocking = items.some((item) =>
    item.outcome === 'CONFLICT' || item.outcome === 'MANUAL_REQUIRED'
  );
  return Object.freeze({
    ...current,
    status: blocking ? 'BLOCKED' : 'RESOLVED',
    completedAt,
    summary
  });
}
