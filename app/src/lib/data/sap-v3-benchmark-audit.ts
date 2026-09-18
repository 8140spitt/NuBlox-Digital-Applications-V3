import sapMap from '$lib/generated/sap-v3-benchmark-map.json';
import register from '$lib/generated/business-object-register.json';
import { enterpriseFunctions } from '$lib/enterprise/functions';

export type SapV3Treatment = 'native-core' | 'contextual-extension' | 'platform-enabler';
export type SapBenchmarkState = 'mapped-not-challenged' | 'challenged' | 'closed';

export type SapV3BenchmarkRow = {
  sapNo: number;
  sapReference: string;
  classification: string;
  legacyCurrentState: string;
  legacyDeliveryTreatment: string;
  v3Treatment: SapV3Treatment;
  workspaces: string[];
  canonicalFamilies: string[];
  canonicalObjects: string[];
  processChains: string[];
  benchmarkState: SapBenchmarkState;
  challengeQuestion: string;
  legacyNotes: string;
};

export const sapV3BenchmarkRows = sapMap.rows as SapV3BenchmarkRow[];

const validWorkspaces = new Set(enterpriseFunctions.map((entry) => entry.id));
const validFamilies = new Set(register.families.map((entry) => entry.id));
const validChains = new Set([
  'market-to-contract',
  'estimate-to-project-control',
  'design-to-approved-information',
  'procure-to-pay',
  'plan-to-perform',
  'change-to-commercial-position',
  'valuation-to-cash',
  'supplier-progress-to-payment',
  'incident/defect/NCR-to-resolution',
  'commissioning-to-operation',
  'service-request-to-resolution',
  'asset-to-retirement',
  'hire-to-retire',
  'record-to-report'
]);

const workspaceCoverage = new Set(sapV3BenchmarkRows.flatMap((row) => row.workspaces));
const familyCoverage = new Set(sapV3BenchmarkRows.flatMap((row) => row.canonicalFamilies));

export const sapV3BenchmarkSummary = {
  rowCount: sapV3BenchmarkRows.length,
  mappedRowCount: sapV3BenchmarkRows.filter((row) => row.benchmarkState === 'mapped-not-challenged').length,
  challengedRowCount: sapV3BenchmarkRows.filter((row) => row.benchmarkState === 'challenged').length,
  closedRowCount: sapV3BenchmarkRows.filter((row) => row.benchmarkState === 'closed').length,
  nativeCoreCount: sapV3BenchmarkRows.filter((row) => row.v3Treatment === 'native-core').length,
  contextualExtensionCount: sapV3BenchmarkRows.filter((row) => row.v3Treatment === 'contextual-extension').length,
  platformEnablerCount: sapV3BenchmarkRows.filter((row) => row.v3Treatment === 'platform-enabler').length,
  coveredWorkspaceCount: workspaceCoverage.size,
  coveredCanonicalFamilyCount: familyCoverage.size,
  state: 'remapped-awaiting-capability-challenge' as const
};

export function validateSapV3BenchmarkMap() {
  if (sapV3BenchmarkRows.length !== 64) return false;
  const numbers = sapV3BenchmarkRows.map((row) => row.sapNo).sort((a, b) => a - b);
  if (numbers.some((value, index) => value !== index + 1)) return false;
  if (new Set(sapV3BenchmarkRows.map((row) => row.sapNo)).size !== 64) return false;
  if (!sapV3BenchmarkRows.every((row) => row.sapReference && row.challengeQuestion)) return false;
  if (!sapV3BenchmarkRows.every((row) => row.workspaces.length && row.workspaces.every((workspace) => validWorkspaces.has(workspace)))) return false;
  if (!sapV3BenchmarkRows.every((row) => row.canonicalFamilies.length && row.canonicalFamilies.every((family) => validFamilies.has(family)))) return false;
  if (!sapV3BenchmarkRows.every((row) => row.canonicalObjects.length > 0)) return false;
  if (!sapV3BenchmarkRows.every((row) => row.processChains.length && row.processChains.every((chain) => validChains.has(chain)))) return false;
  if (sapV3BenchmarkSummary.nativeCoreCount + sapV3BenchmarkSummary.contextualExtensionCount + sapV3BenchmarkSummary.platformEnablerCount !== 64) return false;
  return true;
}
