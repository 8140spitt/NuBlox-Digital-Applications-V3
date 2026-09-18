import { enterpriseFunctions } from '$lib/enterprise/functions';

export type BenchmarkTier = 'mandatory-suite' | 'specialist-depth';
export type BenchmarkStudyState = 'registered' | 'in-progress' | 'challenged' | 'closed';

export type ExternalBenchmarkDefinition = {
  id: string;
  provider: string;
  product: string;
  tier: BenchmarkTier;
  category: string[];
  workspaces: string[];
  studyState: BenchmarkStudyState;
  officialSource: string;
  challengeFocus: string[];
  notes: string;
};

export const externalBenchmarkRegister: ExternalBenchmarkDefinition[] = [
  {
    id: 'SAP-BUSINESS-SUITE',
    provider: 'SAP',
    product: 'SAP Cloud ERP / S/4HANA + Ariba + SuccessFactors + enterprise planning/asset capabilities',
    tier: 'mandatory-suite',
    category: ['enterprise-erp','finance','procurement','supply-chain','manufacturing','hcm','asset-management','planning'],
    workspaces: ['F01','F03','F04','F05','F07','F09','F10','F11','F13','F14','F15','F17','F20','F22','F23','F27','F29'],
    studyState: 'in-progress',
    officialSource: 'https://www.sap.com/uk/products/erp.html',
    challengeFocus: ['record-to-report','procure-to-pay','supply-chain','manufacturing','enterprise planning','asset lifecycle','master data','controls'],
    notes: 'Primary enterprise completeness benchmark. The 64-line legacy SAP capability register is retained under docs/benchmarks as provenance and must be remapped to V3 workspaces/canonical objects rather than copied as module boundaries.'
  },
  {
    id: 'ORACLE-CLOUD-CX',
    provider: 'Oracle',
    product: 'Oracle Fusion Cloud Applications + Oracle Construction and Engineering',
    tier: 'mandatory-suite',
    category: ['enterprise-erp','finance','procurement','hcm','project-controls','construction','cde','payments'],
    workspaces: ['F01','F03','F07','F09','F10','F12','F13','F14','F15','F17','F20','F23','F26','F27','F29'],
    studyState: 'registered',
    officialSource: 'https://www.oracle.com/customer-hub/construction-engineering/',
    challengeFocus: ['Primavera planning/control','Unifier capital programme controls','Aconex information exchange','Textura payment management','ERP continuity'],
    notes: 'Challenges project/programme control, capital delivery, CDE collaboration, payment and enterprise back-office continuity.'
  },
  {
    id: 'MICROSOFT-D365',
    provider: 'Microsoft',
    product: 'Dynamics 365 Finance, Supply Chain, Project Operations, Field Service and CRM',
    tier: 'mandatory-suite',
    category: ['enterprise-erp','finance','supply-chain','crm','field-service','project-operations','workflow'],
    workspaces: ['F03','F06','F07','F08','F09','F10','F12','F14','F15','F17','F22','F27','F29'],
    studyState: 'registered',
    officialSource: 'https://learn.microsoft.com/en-us/dynamics365/guidance/business-processes/',
    challengeFocus: ['field-to-project-finance','record-to-report','source-to-pay','sales/service continuity','Dataverse/Power Platform extensibility'],
    notes: 'Strong benchmark for connected operational and financial processes across field work, project operations and finance.'
  },
  {
    id: 'IFS-CLOUD',
    provider: 'IFS',
    product: 'IFS Cloud',
    tier: 'mandatory-suite',
    category: ['enterprise-erp','eam','field-service','supply-chain','manufacturing'],
    workspaces: ['F09','F10','F11','F12','F13','F14','F15','F22','F23','F27'],
    studyState: 'registered',
    officialSource: 'https://www.ifs.com/en/ifs-cloud',
    challengeFocus: ['asset-service lifecycle','project-centric ERP','field service','supply chain','manufacturing'],
    notes: 'Important benchmark for asset-intensive and service-centric operating models where ERP, EAM and FSM are integrated.'
  },
  {
    id: 'WORKDAY',
    provider: 'Workday',
    product: 'Workday Financial Management + Human Capital Management + Adaptive Planning',
    tier: 'mandatory-suite',
    category: ['finance','hcm','planning','analytics'],
    workspaces: ['F01','F03','F14','F15','F17','F20'],
    studyState: 'registered',
    officialSource: 'https://www.workday.com/en-gb/enterprise-resource-planning.html',
    challengeFocus: ['hire-to-retire','workforce planning','record-to-report','close/consolidate','continuous planning'],
    notes: 'Specialist enterprise benchmark for people, finance and planning on a unified cloud data model.'
  },
  {
    id: 'SALESFORCE',
    provider: 'Salesforce',
    product: 'Sales Cloud + Agentforce Service / Service Cloud',
    tier: 'specialist-depth',
    category: ['crm','sales','customer-service','field-service'],
    workspaces: ['F06','F07','F08','F12','F17'],
    studyState: 'registered',
    officialSource: 'https://www.salesforce.com/uk/service/cloud/',
    challengeFocus: ['lead-to-opportunity','account management','case management','omnichannel service','field service'],
    notes: 'CRM/customer-service depth benchmark; not an authority for NuBlox enterprise or construction object boundaries.'
  },
  {
    id: 'SERVICENOW',
    provider: 'ServiceNow',
    product: 'Now Platform / ITSM / IRM / Strategic Portfolio / Workplace services',
    tier: 'mandatory-suite',
    category: ['workflow','itsm','risk','security','portfolio','workplace'],
    workspaces: ['F02','F03','F08','F16','F18','F20','F21','F22','F24','F26','F27','F28','F29'],
    studyState: 'registered',
    officialSource: 'https://www.servicenow.com/products-by-category.html',
    challengeFocus: ['work orchestration','case/request patterns','ITSM','risk/compliance','portfolio management','workplace services'],
    notes: 'Benchmark for enterprise workflow, request/case management, IT operations and cross-cutting controls.'
  },
  {
    id: 'DILIGENT-ONE',
    provider: 'Diligent',
    product: 'Diligent One / Boards / GRC',
    tier: 'specialist-depth',
    category: ['governance','board-management','grc','audit','entity-management','investor-engagement'],
    workspaces: ['F02','F19','F20','F25'],
    studyState: 'registered',
    officialSource: 'https://www.diligent.com/gb',
    challengeFocus: ['board/committee governance','decision records','entity/subsidiary governance','risk/compliance/audit','investor engagement'],
    notes: 'Specialist governance benchmark for board, corporate-secretariat and GRC evidence that broad ERP suites often underrepresent.'
  },
  {
    id: 'PROCORE',
    provider: 'Procore',
    product: 'Procore Construction Platform',
    tier: 'mandatory-suite',
    category: ['construction','preconstruction','project-management','field','quality-safety','project-financials'],
    workspaces: ['F07','F09','F12','F13','F14','F23','F26','F27'],
    studyState: 'registered',
    officialSource: 'https://www.procore.com/en-gb/platform',
    challengeFocus: ['preconstruction','project execution','RFIs/submittals','daily records','resource management','quality/safety','project financials'],
    notes: 'Construction-native benchmark for office-to-field continuity and project collaboration.'
  },
  {
    id: 'AUTODESK-CONSTRUCTION',
    provider: 'Autodesk',
    product: 'Autodesk Forma / Autodesk Construction Cloud',
    tier: 'mandatory-suite',
    category: ['construction','cde','bim','cost','takeoff','field'],
    workspaces: ['F05','F07','F09','F12','F13','F23','F26','F27'],
    studyState: 'registered',
    officialSource: 'https://construction.autodesk.com/',
    challengeFocus: ['design-to-construction continuity','model/document control','takeoff/estimating','cost management','field execution'],
    notes: 'Benchmark for BIM-centric project information and connected construction delivery.'
  },
  {
    id: 'BENTLEY-PROJECTWISE-ITWIN',
    provider: 'Bentley Systems',
    product: 'ProjectWise powered by iTwin',
    tier: 'mandatory-suite',
    category: ['engineering-information','cde','digital-twin','infrastructure'],
    workspaces: ['F05','F12','F13','F17','F22','F26','F27'],
    studyState: 'registered',
    officialSource: 'https://www.bentley.com/wp-content/uploads/pds-projectwise-itwin-ltr-en-lr.pdf',
    challengeFocus: ['engineering work-in-progress','digital design delivery','data governance','multidiscipline infrastructure information','digital twin continuity'],
    notes: 'Key engineering/infrastructure benchmark for controlled design information and digital-twin continuity.'
  },
  {
    id: 'TRIMBLE-CONSTRUCTION-ONE',
    provider: 'Trimble',
    product: 'Trimble Construction One / Viewpoint Vista / ProjectSight',
    tier: 'mandatory-suite',
    category: ['construction-erp','project-management','field-service','estimating','finance'],
    workspaces: ['F06','F07','F09','F10','F12','F14','F15','F22','F27'],
    studyState: 'registered',
    officialSource: 'https://www.trimble.com/en/products/viewpoint/vista/field-service',
    challengeFocus: ['construction ERP','job cost','field service','project management','estimating/procurement','office-field integration'],
    notes: 'Construction ERP and project-operations benchmark linking commercial back office and field delivery.'
  },
  {
    id: 'IBM-MAXIMO',
    provider: 'IBM',
    product: 'Maximo Application Suite',
    tier: 'mandatory-suite',
    category: ['eam','apm','field-service','maintenance','facilities','inventory'],
    workspaces: ['F10','F12','F13','F17','F20','F22','F23','F27'],
    studyState: 'registered',
    officialSource: 'https://www.ibm.com/products/maximo',
    challengeFocus: ['asset lifecycle','work orders','maintenance','reliability','condition/predictive maintenance','MRO inventory','facilities'],
    notes: 'Primary enterprise asset/maintenance benchmark from operation through decommissioning.'
  },
  {
    id: 'PTC-WINDCHILL',
    provider: 'PTC',
    product: 'Windchill 13.1.2',
    tier: 'mandatory-suite',
    category: ['plm','configuration','controlled-information','change','quality'],
    workspaces: ['F05','F11','F13','F17','F26','F27','F29'],
    studyState: 'in-progress',
    officialSource: 'https://support.ptc.com/help/windchill/r13.1.2.0/en/index.html',
    challengeFocus: ['object identity/versioning','configuration/effectivity','change control','workflow','product structures','quality'],
    notes: 'Deep semantic benchmark for lifecycle/configuration governance; never automatic NuBlox schema authority.'
  },
  {
    id: 'SIEMENS-TEAMCENTER',
    provider: 'Siemens',
    product: 'Teamcenter PLM',
    tier: 'mandatory-suite',
    category: ['plm','digital-thread','bom','configuration','change'],
    workspaces: ['F05','F11','F13','F17','F26','F27','F29'],
    studyState: 'registered',
    officialSource: 'https://www.siemens.com/en-gb/products/teamcenter/',
    challengeFocus: ['requirements','BOM/product structure','configuration','change','workflow','digital thread','manufacturing/service continuity'],
    notes: 'Second PLM benchmark to prevent Windchill-specific bias and challenge product/configuration semantics independently.'
  },
  {
    id: 'DELTEK-VANTAGEPOINT',
    provider: 'Deltek',
    product: 'Vantagepoint',
    tier: 'specialist-depth',
    category: ['aec-erp','crm','project-accounting','resource-management','project-management'],
    workspaces: ['F03','F06','F07','F14','F15','F17','F27'],
    studyState: 'registered',
    officialSource: 'https://www.deltek.com/products/erp/vantagepoint/',
    challengeFocus: ['A&E business development','project accounting','resource planning','billing','project profitability','professional-services delivery'],
    notes: 'Important architecture/engineering consultancy benchmark connecting pursuit, people, projects and financial performance.'
  },
  {
    id: 'ASITE-CDE',
    provider: 'Asite',
    product: 'Asite Common Data Environment / 3D Repo / Marketplace',
    tier: 'specialist-depth',
    category: ['cde','information-management','bim','procurement','construction'],
    workspaces: ['F05','F09','F12','F13','F26','F27'],
    studyState: 'registered',
    officialSource: 'https://www.asite.com/',
    challengeFocus: ['ISO-style CDE workflows','information delivery','BIM coordination','supply-chain marketplace','project data continuity'],
    notes: 'Construction information-management benchmark with strong CDE and BIM collaboration focus.'
  },
  {
    id: 'THINKPROJECT',
    provider: 'Thinkproject',
    product: 'Built Asset Lifecycle Platform / CDE / Contracts (CEMAR) / Asset & Work Manager',
    tier: 'specialist-depth',
    category: ['cde','contract-management','asset-work','construction'],
    workspaces: ['F07','F09','F12','F13','F22','F26','F27'],
    studyState: 'registered',
    officialSource: 'https://www.thinkproject.com/login/',
    challengeFocus: ['contract administration','NEC-style event workflows','CDE','field/document management','built-asset work management'],
    notes: 'Built-environment lifecycle benchmark spanning project information, contract administration and operational asset work.'
  },
  {
    id: 'HEXAGON-ECOSYS',
    provider: 'Hexagon',
    product: 'EcoSys Enterprise Projects Performance',
    tier: 'specialist-depth',
    category: ['portfolio','project-controls','cost-control','contracts'],
    workspaces: ['F01','F03','F07','F14','F20','F27'],
    studyState: 'registered',
    officialSource: 'https://aliresources.hexagon.com/project-management-control/ecosys-enterprise-projects-performance-software',
    challengeFocus: ['portfolio selection','project controls','forecasting','earned value','contract management','enterprise project performance'],
    notes: 'Specialist benchmark for capital/project controls and enterprise portfolio performance.'
  },
  {
    id: 'ESRI-ARCGIS',
    provider: 'Esri',
    product: 'ArcGIS / Field Maps / GeoBIM',
    tier: 'specialist-depth',
    category: ['gis','field-mobility','asset-network','infrastructure','geospatial'],
    workspaces: ['F10','F12','F17','F22','F23','F27'],
    studyState: 'registered',
    officialSource: 'https://www.esri.com/en-us/industries/infrastructure-management',
    challengeFocus: ['geospatial master/context','linear/network assets','field capture','inspection','location-aware work','GIS-BIM continuity'],
    notes: 'Geospatial/infrastructure benchmark so NuBlox treats location, networks and field evidence as first-class semantics rather than map attachments.'
  },
  {
    id: 'PLANON-IWMS',
    provider: 'Planon',
    product: 'Planon Integrated Workplace Management',
    tier: 'specialist-depth',
    category: ['iwms','facilities','space','real-estate','maintenance'],
    workspaces: ['F12','F17','F22','F23','F27'],
    studyState: 'registered',
    officialSource: 'https://planonsoftware.com/uk/software/iwms/space-workplace-services-management/',
    challengeFocus: ['real estate','lease/space','workplace services','facilities','maintenance','sustainability'],
    notes: 'Specialist FM/property benchmark across workplace, space, facilities and property operations.'
  },
  {
    id: 'SAGE-CONSTRUCTION',
    provider: 'Sage',
    product: 'Sage Intacct Construction + Sage Construction Management',
    tier: 'specialist-depth',
    category: ['construction-finance','job-cost','wip','project-management','preconstruction'],
    workspaces: ['F06','F07','F09','F12','F14','F15','F27'],
    studyState: 'registered',
    officialSource: 'https://www.sage.com/en-gb/industry/construction/',
    challengeFocus: ['construction accounting','job costing','WIP','CIS/UK finance','estimating','project management'],
    notes: 'Important construction-finance benchmark, particularly for contractor job cost/WIP and UK operational accounting.'
  },
  {
    id: 'CAUSEWAY',
    provider: 'Causeway Technologies',
    product: 'Causeway construction and maintenance software',
    tier: 'specialist-depth',
    category: ['estimating','commercial','supply-chain','workforce','infrastructure'],
    workspaces: ['F07','F09','F10','F12','F14','F15','F22','F27'],
    studyState: 'registered',
    officialSource: 'https://www.causeway.com/',
    challengeFocus: ['takeoff/estimating','commercial management','project accounting','supply chain','workforce','infrastructure maintenance'],
    notes: 'UK construction-specialist challenge benchmark for contractor commercial, supply-chain and infrastructure workflows.'
  }
];

const allWorkspaceIds = new Set(enterpriseFunctions.map((fn) => fn.id));
const benchmarkWorkspaceCoverage = new Set(externalBenchmarkRegister.flatMap((entry) => entry.workspaces));

export const marketBenchmarkSummary = {
  benchmarkCount: externalBenchmarkRegister.length,
  mandatorySuiteCount: externalBenchmarkRegister.filter((entry) => entry.tier === 'mandatory-suite').length,
  specialistDepthCount: externalBenchmarkRegister.filter((entry) => entry.tier === 'specialist-depth').length,
  coveredWorkspaceCount: benchmarkWorkspaceCoverage.size,
  workspaceCount: enterpriseFunctions.length,
  programmeState: 'in-progress' as const,
  legacySapCapabilityRows: 64,
  rule: 'External systems challenge completeness, semantics and user outcomes; vendor module boundaries never become automatic NuBlox architecture.'
};

export function validateExternalBenchmarkRegister() {
  if (new Set(externalBenchmarkRegister.map((entry) => entry.id)).size !== externalBenchmarkRegister.length) return false;
  if (!externalBenchmarkRegister.every((entry) => entry.officialSource.startsWith('https://'))) return false;
  if (!externalBenchmarkRegister.every((entry) => entry.workspaces.length > 0 && entry.challengeFocus.length > 0)) return false;
  if (!externalBenchmarkRegister.every((entry) => entry.workspaces.every((workspace) => allWorkspaceIds.has(workspace)))) return false;
  if (marketBenchmarkSummary.coveredWorkspaceCount !== enterpriseFunctions.length) return false;
  if (!externalBenchmarkRegister.some((entry) => entry.id === 'SAP-BUSINESS-SUITE')) return false;
  if (!externalBenchmarkRegister.some((entry) => entry.id === 'PTC-WINDCHILL')) return false;
  if (!externalBenchmarkRegister.some((entry) => entry.id === 'PROCORE')) return false;
  if (!externalBenchmarkRegister.some((entry) => entry.id === 'IBM-MAXIMO')) return false;
  return true;
}
