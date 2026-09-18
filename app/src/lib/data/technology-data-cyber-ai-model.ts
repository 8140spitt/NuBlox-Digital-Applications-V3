export type TechnologyDataCyberAiKind =
  | 'service'
  | 'shared-reference'
  | 'technical-resource'
  | 'technical-account'
  | 'request'
  | 'case'
  | 'change'
  | 'release'
  | 'relationship'
  | 'plan'
  | 'governance-context'
  | 'data-product'
  | 'dataset'
  | 'controlled-rule'
  | 'pipeline'
  | 'controlled-definition'
  | 'ai-use-case'
  | 'ai-model'
  | 'authorization'
  | 'vulnerability'
  | 'campaign'
  | 'event-evidence'
  | 'threat-intelligence'
  | 'work';

export type TechnologyDataCyberAiDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: TechnologyDataCyberAiKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type TechnologyDataCyberAiRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const tdc = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: TechnologyDataCyberAiKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): TechnologyDataCyberAiDefinition => ({
  modelId,
  candidateKeys,
  canonicalName,
  kind,
  definition,
  identityRule,
  keyData,
  lifecycle,
  governance
});

export const technologyDataCyberAiModel: TechnologyDataCyberAiDefinition[] = [
  tdc(
    'IT-TECHNOLOGY-SERVICE',
    ['BOF-24-001', 'BOF-24-002'],
    'Technology Service',
    'service',
    'Stable identity for a business-facing or enabling technology service; Application Service is a service type/profile.',
    'One service identity survives provider, application/resource dependency, owner, support model and lifecycle changes.',
    [
      'service code/name',
      'service type',
      'business capability/consumer',
      'owner',
      'support/provider',
      'service levels',
      'dependencies',
      'criticality'
    ],
    ['Proposed', 'Design', 'Transition', 'Live', 'Degraded', 'Suspended', 'Retired'],
    [
      'Application Service is a Technology Service type, not a second service master.',
      'Service status is distinct from IT Incident lifecycle.',
      'Business/technology service dependencies are explicit relationships.'
    ]
  ),

  tdc(
    'IT-ARCHITECTURE-DECISION',
    ['BOF-24-003'],
    'Architecture Decision',
    'shared-reference',
    'Architecture-context use of the shared immutable Decision evidence pattern.',
    'No separate decision engine; the shared Decision retains exact subject/version, options, outcome, rationale, decider/authority and consequences.',
    [
      'Decision reference',
      'architecture subject/version',
      'options',
      'decision/rationale',
      'consequences',
      'standards/policies',
      'decider/authority',
      'decided at'
    ],
    ['Recorded', 'Superseded', 'Corrected'],
    [
      'Architecture Decision reuses shared Decision.',
      'Architecture records/documents may represent the decision but do not replace structured Decision evidence.',
      'Supersession never rewrites prior rationale.'
    ]
  ),

  tdc(
    'IT-TECHNOLOGY-RESOURCE',
    ['BOF-24-004', 'BOF-24-005'],
    'Technology Resource',
    'technical-resource',
    'Governed infrastructure or cloud resource used to host, run, connect or support Technology Services and data/AI workloads.',
    'Stable resource identity within provider/platform/account context; Cloud Resource is a type and external resource IDs are alternate identifiers.',
    [
      'resource type',
      'provider/platform',
      'account/subscription',
      'region/location',
      'resource identifier',
      'owner',
      'configuration reference',
      'service dependencies'
    ],
    ['Planned', 'Provisioning', 'Active', 'Suspended', 'Decommissioning', 'Retired'],
    [
      'Resource is not Configuration Registration.',
      'Where the resource is independently whole-life governed as an Asset, an explicit Asset relationship is used.',
      'Cloud recreation/replacement preserves predecessor/successor provenance rather than recycling identity.'
    ]
  ),

  tdc(
    'IT-ENDPOINT-ASSET',
    ['BOF-24-006', 'BOF-24-014'],
    'Technology Asset',
    'shared-reference',
    'Technology-context use of canonical Asset for independently governed endpoints, devices and other physical/logical IT assets.',
    'No parallel IT Asset identity; canonical Asset survives custody, configuration, security posture, location and accounting changes.',
    [
      'Asset reference',
      'technology/endpoint type',
      'custodian',
      'location',
      'serial/device identifiers',
      'configuration/security posture references'
    ],
    [
      'Planned',
      'Ordered',
      'Received',
      'Installed',
      'In Service',
      'Out of Service',
      'Decommissioned',
      'Disposed'
    ],
    [
      'Endpoint and IT Asset reuse Asset where independently governed.',
      'Configuration/security state is not Asset identity.',
      'Logical resources not needing whole-life Asset semantics remain Technology Resources.'
    ]
  ),

  tdc(
    'IT-IDENTITY-ACCOUNT',
    ['BOF-24-007'],
    'Identity Account',
    'technical-account',
    'Technical/application/identity-provider account used to authenticate or execute against a technology service/resource.',
    'Stable account identity within provider/system namespace linked to canonical User Identity/Party or service principal where applicable.',
    [
      'provider/system',
      'account identifier',
      'account type',
      'linked User Identity/Party',
      'authentication methods',
      'status',
      'created/disabled dates',
      'privilege/access links'
    ],
    ['Requested', 'Provisioned', 'Active', 'Locked/Suspended', 'Disabled', 'Closed'],
    [
      'Identity Account is not User Identity or Person.',
      'Account possession does not itself confer business authority.',
      'Privileged/data access grants are separately governed and effective-dated.'
    ]
  ),

  tdc(
    'IT-SERVICE-REQUEST',
    ['BOF-24-008'],
    'IT Service Request',
    'request',
    'Governed request for standard technology fulfilment, support, access or service action.',
    'Stable request identity independent of workflow Work Items, fulfilment tasks and resulting Assets/Accounts/Access Grants.',
    [
      'request type',
      'requester/beneficiary',
      'Technology Service',
      'requested item/action',
      'business justification',
      'priority',
      'target date',
      'fulfilment result'
    ],
    [
      'Draft',
      'Submitted',
      'Triaged',
      'Approved/Authorised',
      'Fulfilling',
      'Completed',
      'Rejected',
      'Cancelled'
    ],
    [
      'Request is domain truth, not workflow Work Item.',
      'Approval does not itself create technical entitlement unless an Access Grant/provisioning event is produced.',
      'Fulfilment outputs retain their own identities.'
    ]
  ),

  tdc(
    'IT-INCIDENT',
    ['BOF-24-009'],
    'IT Incident',
    'case',
    'Service-management incident restoring normal Technology Service after interruption, degradation or failure.',
    'Stable incident case identity with impacted services/resources, symptoms, severity, timeline, restoration and evidence.',
    [
      'incident reference',
      'reported/detected at',
      'affected services/resources',
      'symptoms',
      'impact/urgency/priority',
      'owner/team',
      'timeline',
      'restoration/workaround'
    ],
    [
      'Reported',
      'Triage',
      'Assigned',
      'Investigating',
      'Restoring',
      'Resolved',
      'Closed',
      'Reopened'
    ],
    [
      'IT Incident is not Problem or Cybersecurity Incident.',
      'Underlying monitoring/events remain separate evidence.',
      'Incident closure does not erase linked Problem/known-error/change history.'
    ]
  ),

  tdc(
    'IT-PROBLEM',
    ['BOF-24-010'],
    'Problem',
    'case',
    'Governed underlying-cause/problem case associated with recurring/material incidents or proactive analysis.',
    'Stable problem identity independent of each incident, workaround, known error and corrective Technology Change.',
    [
      'problem reference',
      'related incidents',
      'symptoms/pattern',
      'root cause',
      'known error',
      'workaround',
      'owner',
      'corrective changes'
    ],
    ['Identified', 'Investigating', 'Known Error', 'Fix Planned', 'Resolved', 'Closed'],
    [
      'Problem is not incident aggregation only; it owns causal analysis.',
      'Known error/workaround history remains retained.',
      'Corrective Change has its own lifecycle/authority.'
    ]
  ),

  tdc(
    'IT-TECHNOLOGY-CHANGE',
    ['BOF-24-011'],
    'Technology Change',
    'change',
    'Governed change-control case for planned modification to technology services, resources, configuration, data platforms or security controls.',
    'Stable change identity with scope, affected configuration, risk, implementation/rollback plan, authority, window and outcome.',
    [
      'change type',
      'reason/benefit',
      'affected objects',
      'implementation plan',
      'rollback plan',
      'risk/impact',
      'window',
      'approvals/decision',
      'outcome'
    ],
    [
      'Draft',
      'Assessment',
      'Authorisation',
      'Scheduled',
      'Implementing',
      'Validated',
      'Completed',
      'Failed/Rolled Back',
      'Cancelled'
    ],
    [
      'Technology Change is distinct from BOF-26 organisational/process Change.',
      'Approved change does not mutate source configuration without execution evidence.',
      'Emergency change still requires retrospective evidence/authority.'
    ]
  ),

  tdc(
    'IT-TECHNOLOGY-RELEASE',
    ['BOF-24-012'],
    'Technology Release',
    'release',
    'Governed releasable/deployable version or package coordinating exact component, configuration, software/model and change versions.',
    'Stable release identity/version with immutable approved contents after release; deployment occurrences remain separate evidence.',
    [
      'release/version',
      'included changes',
      'component/artifact versions',
      'target environments',
      'release notes',
      'approval',
      'planned/actual dates',
      'status'
    ],
    ['Planning', 'Build', 'Test', 'Approved', 'Released', 'Withdrawn', 'Superseded'],
    [
      'Release is not Technology Change.',
      'One release may implement multiple changes.',
      'Deployment and rollback occurrences are evidence, not release identity.'
    ]
  ),

  tdc(
    'IT-CONFIGURATION-REGISTRATION',
    ['BOF-24-013'],
    'Configuration Registration',
    'relationship',
    'Governed configuration-management registration/designation that brings an authoritative object under configuration control with class, relationships and effectivity.',
    'Registration identity points to an authoritative Service, Resource, Asset, Dataset/Model or other managed object; it never duplicates that object.',
    [
      'managed object/type/id',
      'configuration class',
      'owner',
      'status',
      'baseline/version context',
      'relationships/dependencies',
      'effective dates'
    ],
    ['Proposed', 'Registered', 'Active', 'Suspended', 'Retired'],
    [
      'Configuration Item is normalized to Configuration Registration over source identity.',
      'CMDB is a managed view/register, not a parallel master-data universe.',
      'Relationships/effectivity are historically reconstructable.'
    ]
  ),

  tdc(
    'IT-DISASTER-RECOVERY-PLAN',
    ['BOF-24-015'],
    'Disaster Recovery Plan',
    'plan',
    'Versioned technology recovery plan for restoring exact Technology Services/resources/data within approved recovery requirements.',
    'Stable plan identity with immutable approved versions; BOF-23 Disaster Recovery Invocation pins the exact version used.',
    [
      'scope/services/resources',
      'Recovery Requirements',
      'RTO/RPO',
      'dependencies',
      'recovery procedures',
      'roles',
      'recovery environment',
      'test/review dates'
    ],
    ['Draft', 'Review', 'Approved', 'Effective', 'Invoked', 'Superseded', 'Retired'],
    [
      'DR Plan is technology recovery planning and is distinct from enterprise Continuity Plan.',
      'Recovery Requirements originate from/align with BOF-23 BIA/continuity governance.',
      'Invocation/test evidence never overwrites plan versions.'
    ]
  ),

  tdc(
    'DATA-DOMAIN',
    ['BOF-24-016'],
    'Data Domain',
    'governance-context',
    'Governed data-accountability domain grouping related data concepts/products/datasets under accountable ownership and stewardship.',
    'Stable domain identity independent of organisational restructures; ownership/stewardship are effective assignments.',
    [
      'domain code/name',
      'scope/subject',
      'owner',
      'stewards',
      'policies/standards',
      'data products',
      'quality expectations',
      'classifications'
    ],
    ['Proposed', 'Active', 'Suspended', 'Retired'],
    [
      'Data Domain is not Dataset or Organisation Unit.',
      'Ownership changes do not recreate the domain.',
      'Cross-domain datasets/products remain explicitly related.'
    ]
  ),

  tdc(
    'DATA-PRODUCT',
    ['BOF-24-017'],
    'Data Product',
    'data-product',
    'Governed consumable data product with purpose, users, interface/contract, constituent data, quality, security and service commitments.',
    'Stable product identity independent of individual Dataset versions or platform implementations.',
    [
      'product code/name',
      'purpose/consumers',
      'owner',
      'datasets',
      'interfaces/data contract',
      'quality SLOs',
      'security/privacy classification',
      'service expectations'
    ],
    ['Proposed', 'Design', 'Published', 'Active', 'Deprecated', 'Retired'],
    [
      'Data Product is not Dataset.',
      'One product may compose multiple datasets and interfaces.',
      'Platform migration does not create a new product identity unless meaning/contract changes materially.'
    ]
  ),

  tdc(
    'DATA-DATASET',
    ['BOF-24-018', 'BOF-24-019'],
    'Dataset',
    'dataset',
    'Stable logical dataset identity with governed schema/semantics, provenance, ownership, classification, retention and access; Reference Dataset is a type.',
    'One logical Dataset identity survives physical partition/file/table/storage changes; versions/snapshots are subordinate where required.',
    [
      'dataset code/name',
      'dataset type',
      'business meaning/schema',
      'owner/steward',
      'source/provenance',
      'classification',
      'retention',
      'access policy',
      'physical representations'
    ],
    ['Draft', 'Published', 'Active', 'Deprecated', 'Retired'],
    [
      'Reference Dataset is a Dataset type/profile.',
      'Dataset is not a file/table/bucket physical copy.',
      'Physical representations and snapshots preserve lineage to the logical Dataset.'
    ]
  ),

  tdc(
    'DATA-QUALITY-RULE',
    ['BOF-24-020'],
    'Data Quality Rule',
    'controlled-rule',
    'Versioned executable/testable rule defining expected quality conditions for a Dataset/Data Product, including dimension, scope, threshold and severity.',
    'Stable rule identity with approved versions/effectivity; executions/observations pin exact rule version.',
    [
      'rule code/name',
      'dataset/product scope',
      'quality dimension',
      'expression/test',
      'threshold',
      'severity',
      'owner',
      'effective dates'
    ],
    ['Draft', 'Validated', 'Published', 'Effective', 'Superseded', 'Retired'],
    [
      'Rule definition is not a quality observation or issue.',
      'Material rule changes preserve prior versions.',
      'Historic quality results retain exact rule/version.'
    ]
  ),

  tdc(
    'DATA-QUALITY-ISSUE',
    ['BOF-24-021'],
    'Data Quality Issue',
    'case',
    'Governed case for material data-quality nonconformance discovered through rules, monitoring, users or assurance.',
    'Stable issue identity retaining affected data scope, rule/result evidence, impact, ownership, root cause, remediation and verification.',
    [
      'issue reference',
      'dataset/product',
      'rule/result evidence',
      'affected scope/period',
      'impact/severity',
      'owner',
      'root cause',
      'remediation',
      'verification'
    ],
    [
      'Reported',
      'Triaged',
      'Investigating',
      'Remediating',
      'Ready for Verification',
      'Closed',
      'Accepted/Deferred'
    ],
    [
      'Issue is not Data Quality Rule.',
      'Correction of data does not delete evidence of the issue.',
      'Work Items may coordinate remediation but do not replace issue truth.'
    ]
  ),

  tdc(
    'DATA-PIPELINE',
    ['BOF-24-022'],
    'Data Pipeline',
    'pipeline',
    'Governed pipeline definition moving or transforming data between exact source/target datasets/services.',
    'Stable pipeline identity with controlled definition versions, transformations, orchestration and lineage; runtime executions remain events/telemetry.',
    [
      'pipeline code/name',
      'sources',
      'targets',
      'transformations',
      'schedule/trigger',
      'platform/runtime',
      'owner',
      'version',
      'lineage'
    ],
    ['Design', 'Test', 'Active', 'Paused', 'Deprecated', 'Retired'],
    [
      'Pipeline definition is not runtime execution history.',
      'Source/target Dataset identities remain canonical.',
      'Transformation/version lineage is preserved.'
    ]
  ),

  tdc(
    'ANALYTICS-REPORT-DEFINITION',
    ['BOF-24-023'],
    'Report Definition',
    'controlled-definition',
    'Versioned semantic/query/layout definition for a report over governed measures/datasets.',
    'Stable report-definition identity with controlled versions; generated report outputs/snapshots are separate representations/evidence.',
    [
      'report code/name',
      'purpose/audience',
      'measures/dimensions',
      'dataset sources',
      'query/calculation logic',
      'layout',
      'owner',
      'version'
    ],
    ['Draft', 'Validated', 'Published', 'Effective', 'Superseded', 'Retired'],
    [
      'Report Definition is not report output or source truth.',
      'Published definitions pin exact semantic/query logic.',
      'Generated outputs retain as-of/source provenance.'
    ]
  ),

  tdc(
    'ANALYTICS-DASHBOARD-DEFINITION',
    ['BOF-24-024'],
    'Dashboard Definition',
    'controlled-definition',
    'Versioned dashboard definition composing governed measures, datasets, filters, calculations and visualisations.',
    'Stable dashboard identity/version; live rendered values remain projections over source observations/data.',
    [
      'dashboard code/name',
      'audience',
      'measures/KPIs',
      'datasets',
      'filters/dimensions',
      'calculations',
      'visualisations',
      'owner/version'
    ],
    ['Draft', 'Validated', 'Published', 'Effective', 'Superseded', 'Retired'],
    [
      'Dashboard is not source performance truth.',
      'Definition versions are controlled.',
      'Access to dashboard does not override access to underlying sensitive data.'
    ]
  ),

  tdc(
    'ANALYTICS-MODEL',
    ['BOF-24-025'],
    'Analytical Model',
    'controlled-definition',
    'Versioned statistical/analytical model definition and artifact with method, assumptions, inputs, validation, calibration and deployment/use context.',
    'Stable analytical-model identity with immutable released versions/artifacts and exact training/calibration/input provenance.',
    [
      'model code/name',
      'method/purpose',
      'input datasets',
      'features/parameters',
      'training/calibration context',
      'validation metrics',
      'version/artifact',
      'owner'
    ],
    ['Experiment', 'Validation', 'Approved', 'Deployed', 'Monitored', 'Deprecated', 'Retired'],
    [
      'Model identity is distinct from one execution/prediction.',
      'Released artifacts are immutable and reproducible.',
      'AI-specific governance applies where the model meets AI classification.'
    ]
  ),

  tdc(
    'AI-USE-CASE',
    ['BOF-24-026'],
    'AI Use Case',
    'ai-use-case',
    'Governed case defining intended AI purpose, users, impacted decisions/actions, data, benefits, harms, controls and accountable ownership.',
    'Stable use-case identity independent of specific AI Model versions/providers; material purpose/scope changes are governed.',
    [
      'purpose',
      'business owner',
      'users/subjects',
      'decisions/actions influenced',
      'data',
      'benefits',
      'potential harms',
      'controls',
      'jurisdictions',
      'approval status'
    ],
    ['Proposed', 'Assessment', 'Approved', 'Pilot', 'Live', 'Suspended', 'Retired', 'Rejected'],
    [
      'AI Use Case is not AI Model.',
      'Use-case approval does not automatically approve every model/version/deployment.',
      'Material impacts link to Enterprise Risk/compliance/privacy assessments as applicable.'
    ]
  ),

  tdc(
    'AI-MODEL',
    ['BOF-24-027'],
    'AI Model',
    'ai-model',
    'Governed versioned AI model identity/artifact used by approved use cases, with model provenance, training/evaluation and deployment/monitoring context.',
    'Stable model identity with immutable released versions and artifacts; provider model IDs are external identifiers.',
    [
      'model name/type',
      'provider/source',
      'model version/artifact',
      'training/fine-tuning datasets',
      'evaluation metrics',
      'limitations',
      'deployment contexts',
      'monitoring'
    ],
    [
      'Experiment',
      'Evaluation',
      'Approved',
      'Deployed',
      'Monitored',
      'Suspended',
      'Deprecated',
      'Retired'
    ],
    [
      'AI Model is not AI Use Case.',
      'Model version and deployment remain distinct.',
      'Training/evaluation/data provenance and monitoring evidence are retained.'
    ]
  ),

  tdc(
    'AI-RISK-ASSESSMENT',
    ['BOF-24-028'],
    'AI Risk Assessment',
    'shared-reference',
    'AI-context use of the shared enterprise Risk Assessment evidence pattern.',
    'No separate AI risk engine; assessment pins exact use case/model/version, method, harms/impacts, controls and residual position.',
    [
      'Risk Assessment reference',
      'AI Use Case',
      'AI Model/version',
      'assessment method',
      'impacts/harms',
      'controls',
      'residual risk',
      'assessor/date'
    ],
    ['Draft', 'Reviewed', 'Approved', 'Effective', 'Superseded', 'Expired'],
    [
      'AI Risk Assessment reuses shared Risk Assessment.',
      'Enterprise Risk may represent enduring material exposure.',
      'Reassessment creates new evidence rather than overwriting prior conclusions.'
    ]
  ),

  tdc(
    'DATA-ACCESS-REQUEST',
    ['BOF-24-029'],
    'Data Access Request',
    'request',
    'Governed request for access to Dataset/Data Product scope for a Party/User Identity under stated purpose, role, duration and policy basis.',
    'Stable request identity independent of approval Work Items and any resulting Access Grant.',
    [
      'requester/beneficiary',
      'dataset/product scope',
      'purpose',
      'requested permission',
      'duration',
      'policy/legal basis',
      'approvers/authority',
      'decision'
    ],
    ['Draft', 'Submitted', 'Review', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled', 'Expired'],
    [
      'Request is not Access Grant.',
      'Approval alone does not prove technical provisioning.',
      'Sensitive data access may also require privacy/security/legal controls.'
    ]
  ),

  tdc(
    'SECURITY-POLICY',
    ['BOF-24-030'],
    'Security Policy',
    'shared-reference',
    'Security-context use of enterprise Policy and controlled Information Container semantics.',
    'No separate security-policy master; exact approved Policy revision/effectivity is reused.',
    [
      'Policy reference',
      'security scope',
      'owner',
      'applicability',
      'controls/requirements',
      'effective revision/date',
      'review date'
    ],
    ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Withdrawn', 'Archived'],
    [
      'Security Policy reuses Policy.',
      'Machine configuration/control implementation is not the policy record.',
      'Historic control/decision evidence retains applicable policy version.'
    ]
  ),

  tdc(
    'SEC-PRIVILEGED-ACCESS-REQUEST',
    ['BOF-24-031'],
    'Privileged Access Request',
    'request',
    'Governed request for elevated/system privileged access with justification, target scope, duration, SoD and approval/authority evidence.',
    'Stable request identity independent of resulting Access Grant/account privilege configuration.',
    [
      'requester/beneficiary',
      'target account/system/resource',
      'requested privilege',
      'justification',
      'duration/window',
      'approvers/SoD',
      'break-glass context',
      'decision'
    ],
    ['Draft', 'Submitted', 'Review', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled', 'Expired'],
    [
      'Privileged request is not granted privilege.',
      'Break-glass access must still create attributable grant/use evidence.',
      'Business authority and technical privilege remain separate.'
    ]
  ),

  tdc(
    'SEC-ACCESS-GRANT',
    [],
    'Access Grant',
    'authorization',
    'Effective-dated technical authorization granting a User Identity/Identity Account permissions over a technology/data scope under approved basis.',
    'Stable grant identity with subject, entitlement/permission set, scope, basis/request/decision, validity and revocation history.',
    [
      'subject User Identity/Account',
      'permission/entitlement',
      'target scope',
      'basis/request/Decision',
      'valid from/to',
      'granted by/system',
      'status/revocation'
    ],
    ['Proposed', 'Provisioned', 'Active', 'Suspended', 'Revoked', 'Expired', 'Ended'],
    [
      'Access Grant is separate from request, Role Assignment and Delegated Authority.',
      'Technical access does not confer business approval authority.',
      'Grant changes/revocation preserve history and must be re-evaluated at use where required.'
    ]
  ),

  tdc(
    'SEC-VULNERABILITY',
    ['BOF-24-032'],
    'Vulnerability',
    'vulnerability',
    'Governed instance of a security weakness/exposure affecting exact technology objects/versions, with source and remediation/treatment context.',
    'Stable vulnerability-instance identity per affected scope and weakness/source; external CVE/scanner IDs are references rather than primary identity.',
    [
      'weakness/CVE/reference',
      'affected service/resource/asset/version',
      'source/detected at',
      'severity/exploitability',
      'exposure',
      'owner',
      'remediation/mitigation',
      'exception/treatment'
    ],
    [
      'Detected',
      'Triaged',
      'Open',
      'Mitigating',
      'Remediated',
      'Verified',
      'Accepted/Deferred',
      'Closed'
    ],
    [
      'Vulnerability is not Security Finding although findings may identify vulnerabilities.',
      'Severity changes do not recreate identity.',
      'Accepted risk uses explicit Risk/Decision evidence.'
    ]
  ),

  tdc(
    'SEC-PATCH-CAMPAIGN',
    ['BOF-24-033'],
    'Patch Campaign',
    'campaign',
    'Governed remediation campaign coordinating patch/mitigation deployment across affected vulnerabilities, assets/resources and maintenance windows.',
    'Stable campaign identity with exact vulnerability/component scope, patch/package versions, rollout groups, windows, exceptions and outcome evidence.',
    [
      'campaign reference',
      'vulnerabilities',
      'patch/package versions',
      'target assets/resources',
      'rollout groups',
      'windows',
      'owner',
      'exceptions',
      'results'
    ],
    [
      'Planned',
      'Approved',
      'Piloting',
      'Rolling Out',
      'Paused',
      'Completed',
      'Closed',
      'Cancelled'
    ],
    [
      'Patch Campaign is not Technology Release although it may use releases/packages.',
      'Asset/resource state changes are evidenced through execution.',
      'Exceptions remain explicit and risk-governed.'
    ]
  ),

  tdc(
    'SEC-SECURITY-ALERT',
    ['BOF-24-034'],
    'Security Alert',
    'event-evidence',
    'Immutable/deduplicated security detection evidence produced by monitoring/control/tooling.',
    'Alert identity preserves source rule/tool, observed time, affected subject, indicator/context, severity/confidence and raw/source evidence.',
    [
      'alert/source ID',
      'source tool/rule',
      'detected at',
      'affected subject',
      'indicator/context',
      'severity/confidence',
      'raw evidence',
      'dedup/correlation links'
    ],
    ['Recorded', 'Triaged', 'Correlated', 'Closed/Benign', 'Escalated'],
    [
      'Alert is not automatically a Cybersecurity Incident.',
      'Dedup/correlation does not delete original evidence.',
      'Alert closure does not rewrite source telemetry.'
    ]
  ),

  tdc(
    'SEC-CYBER-INCIDENT',
    ['BOF-24-035'],
    'Cybersecurity Incident',
    'case',
    'Governed cyber/information-security incident case coordinating triage, containment, eradication, recovery, investigation, evidence and notification.',
    'Stable incident-case identity linked to exact alerts/events/services/resources/accounts/data and retained response timeline.',
    [
      'incident type',
      'reported/detected at',
      'affected services/resources/accounts/data',
      'severity/impact',
      'alerts/events',
      'containment/eradication',
      'recovery',
      'investigation/evidence',
      'notifications'
    ],
    [
      'Reported',
      'Triage',
      'Investigating',
      'Containing',
      'Eradicating',
      'Recovering',
      'Review',
      'Closed'
    ],
    [
      'Cybersecurity Incident is distinct from routine IT Incident, Physical Security Incident and Privacy Incident.',
      'One underlying event may legitimately link multiple specialist cases.',
      'Privacy breach determination remains BOF-22 privacy governance.'
    ]
  ),

  tdc(
    'SEC-THREAT-INTELLIGENCE',
    ['BOF-24-036'],
    'Threat Intelligence Item',
    'threat-intelligence',
    'Governed threat-intelligence information describing actor, campaign, indicator, technique, infrastructure or contextual threat with source/confidence and sharing restrictions.',
    'Stable intelligence-item identity/source provenance with validity/effectivity; external feeds/indicator IDs remain references.',
    [
      'intelligence type',
      'actor/campaign/indicator/technique',
      'source',
      'confidence',
      'first/last seen',
      'validity',
      'sharing/classification',
      'relationships'
    ],
    ['Captured', 'Validated', 'Active', 'Expired', 'Superseded', 'Withdrawn'],
    [
      'Threat intelligence is not a Security Alert or Incident.',
      'Confidence/validity changes preserve history.',
      'Sensitive source/sharing restrictions are separately enforced.'
    ]
  ),

  tdc(
    'SEC-PENETRATION-TEST',
    ['BOF-24-037'],
    'Penetration Test Engagement',
    'work',
    'Governed authorised penetration-test execution over exact systems/services/apps/scope under approved rules of engagement.',
    'Stable engagement identity with authority, scope, rules, testers, window, methods, evidence and resulting findings.',
    [
      'engagement reference',
      'scope/targets',
      'rules of engagement',
      'authority',
      'testers',
      'window',
      'methods',
      'evidence',
      'report'
    ],
    ['Planned', 'Authorised', 'Testing', 'Reporting', 'Remediation Review', 'Closed', 'Cancelled'],
    [
      'Penetration Test is controlled execution, not a Security Finding.',
      'Testing authorization/scope must be explicit.',
      'Findings retain exact evidence and affected versions.'
    ]
  ),

  tdc(
    'SEC-SECURITY-FINDING',
    ['BOF-24-038'],
    'Security Finding',
    'case',
    'Governed finding from penetration testing, security review, assessment, alert/incident analysis or control validation.',
    'Stable finding identity tied to exact evidence/affected scope with severity, owner, remediation, exceptions and verification history.',
    [
      'finding reference',
      'source test/review/incident',
      'affected scope/version',
      'evidence',
      'severity',
      'owner',
      'remediation',
      'target date',
      'verification'
    ],
    [
      'Open',
      'Triaged',
      'Remediating',
      'Ready for Verification',
      'Verified/Closed',
      'Accepted/Deferred',
      'Withdrawn'
    ],
    [
      'Finding is not Vulnerability, though it may identify/link one or more vulnerabilities.',
      'Closure requires attributable verification or accepted-risk Decision.',
      'Work Items may coordinate remediation but never replace finding truth.'
    ]
  )
];

export const technologyDataCyberAiRelationships: TechnologyDataCyberAiRelationship[] = [
  {
    id: 'TDC-R01',
    from: 'IT-TECHNOLOGY-SERVICE',
    predicate: 'depends on',
    to: 'IT-TECHNOLOGY-SERVICE',
    cardinality: 'many-to-many',
    governance: 'Service dependency is explicit and effective.'
  },
  {
    id: 'TDC-R02',
    from: 'IT-TECHNOLOGY-SERVICE',
    predicate: 'uses',
    to: 'IT-TECHNOLOGY-RESOURCE',
    cardinality: 'many-to-many',
    governance: 'Resource replacement does not recreate service identity.'
  },
  {
    id: 'TDC-R03',
    from: 'IT-TECHNOLOGY-RESOURCE',
    predicate: 'may correspond to',
    to: 'CBO-ASSET',
    cardinality: 'many-to-zero-or-one',
    governance: 'Whole-life Asset identity is reused where applicable.'
  },
  {
    id: 'TDC-R04',
    from: 'IT-IDENTITY-ACCOUNT',
    predicate: 'linked to',
    to: 'AUTH-USER-IDENTITY',
    cardinality: 'many-to-zero-or-one',
    governance: 'Account and authenticated principal remain distinct.'
  },
  {
    id: 'TDC-R05',
    from: 'IT-SERVICE-REQUEST',
    predicate: 'requests service from',
    to: 'IT-TECHNOLOGY-SERVICE',
    cardinality: 'many-to-zero-or-one',
    governance: 'Request does not mutate service identity.'
  },
  {
    id: 'TDC-R06',
    from: 'IT-INCIDENT',
    predicate: 'impacts',
    to: 'IT-TECHNOLOGY-SERVICE',
    cardinality: 'many-to-many',
    governance: 'Service lifecycle/status remains separate from incident case.'
  },
  {
    id: 'TDC-R07',
    from: 'IT-PROBLEM',
    predicate: 'explains',
    to: 'IT-INCIDENT',
    cardinality: 'one-to-many',
    governance: 'Problem and incidents retain separate identities.'
  },
  {
    id: 'TDC-R08',
    from: 'IT-PROBLEM',
    predicate: 'may create',
    to: 'IT-TECHNOLOGY-CHANGE',
    cardinality: 'one-to-many',
    governance: 'Corrective change has independent authority/execution.'
  },
  {
    id: 'TDC-R09',
    from: 'IT-TECHNOLOGY-CHANGE',
    predicate: 'resolved by',
    to: 'WORK-DECISION',
    cardinality: 'many-to-one-or-many',
    governance: 'Material change authority uses shared Decision evidence.'
  },
  {
    id: 'TDC-R10',
    from: 'IT-TECHNOLOGY-RELEASE',
    predicate: 'implements',
    to: 'IT-TECHNOLOGY-CHANGE',
    cardinality: 'many-to-many',
    governance: 'Release groups exact approved changes.'
  },
  {
    id: 'TDC-R11',
    from: 'IT-CONFIGURATION-REGISTRATION',
    predicate: 'may register',
    to: 'IT-TECHNOLOGY-SERVICE',
    cardinality: 'many-to-zero-or-one',
    governance: 'Configuration registration references service rather than copying it.'
  },
  {
    id: 'TDC-R12',
    from: 'IT-CONFIGURATION-REGISTRATION',
    predicate: 'may register',
    to: 'IT-TECHNOLOGY-RESOURCE',
    cardinality: 'many-to-zero-or-one',
    governance: 'Configuration registration references resource rather than copying it.'
  },
  {
    id: 'TDC-R13',
    from: 'IT-CONFIGURATION-REGISTRATION',
    predicate: 'may register',
    to: 'CBO-ASSET',
    cardinality: 'many-to-zero-or-one',
    governance: 'Configuration registration references canonical Asset.'
  },
  {
    id: 'TDC-R14',
    from: 'IT-DISASTER-RECOVERY-PLAN',
    predicate: 'must satisfy',
    to: 'BCM-RECOVERY-REQUIREMENT',
    cardinality: 'many-to-many',
    governance: 'DR plan pins exact enterprise recovery requirements.'
  },
  {
    id: 'TDC-R15',
    from: 'BCM-DR-INVOCATION',
    predicate: 'invokes',
    to: 'IT-DISASTER-RECOVERY-PLAN',
    cardinality: 'many-to-one',
    governance: 'Invocation is occurrence evidence against plan/version.'
  },
  {
    id: 'TDC-R16',
    from: 'DATA-DOMAIN',
    predicate: 'governs',
    to: 'DATA-PRODUCT',
    cardinality: 'one-to-many',
    governance: 'Data Product retains its own identity/contract.'
  },
  {
    id: 'TDC-R17',
    from: 'DATA-PRODUCT',
    predicate: 'uses',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Product composition does not copy datasets.'
  },
  {
    id: 'TDC-R18',
    from: 'DATA-QUALITY-RULE',
    predicate: 'applies to',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Rule pins exact dataset/schema scope.'
  },
  {
    id: 'TDC-R19',
    from: 'DATA-QUALITY-ISSUE',
    predicate: 'concerns',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Dataset identity persists through corrections.'
  },
  {
    id: 'TDC-R20',
    from: 'DATA-PIPELINE',
    predicate: 'reads/writes',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Lineage remains explicit.'
  },
  {
    id: 'TDC-R21',
    from: 'ANALYTICS-REPORT-DEFINITION',
    predicate: 'queries',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Report definition never becomes dataset truth.'
  },
  {
    id: 'TDC-R22',
    from: 'ANALYTICS-DASHBOARD-DEFINITION',
    predicate: 'queries',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Dashboard is a projection over governed data.'
  },
  {
    id: 'TDC-R23',
    from: 'ANALYTICS-MODEL',
    predicate: 'uses',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Exact training/calibration/input dataset versions are retained.'
  },
  {
    id: 'TDC-R24',
    from: 'AI-USE-CASE',
    predicate: 'uses',
    to: 'AI-MODEL',
    cardinality: 'many-to-many',
    governance: 'Use case and model/version remain distinct.'
  },
  {
    id: 'TDC-R25',
    from: 'AI-MODEL',
    predicate: 'uses',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Training/evaluation/operational data provenance is retained.'
  },
  {
    id: 'TDC-R26',
    from: 'AI-RISK-ASSESSMENT',
    predicate: 'reuses',
    to: 'RISK-ASSESSMENT',
    cardinality: 'many-to-one-pattern',
    governance: 'AI risk uses shared enterprise assessment evidence.'
  },
  {
    id: 'TDC-R27',
    from: 'AI-RISK-ASSESSMENT',
    predicate: 'assesses',
    to: 'AI-USE-CASE',
    cardinality: 'many-to-one-or-many',
    governance: 'Exact use-case scope/version is retained.'
  },
  {
    id: 'TDC-R28',
    from: 'DATA-ACCESS-REQUEST',
    predicate: 'requests access to',
    to: 'DATA-DATASET',
    cardinality: 'many-to-many',
    governance: 'Request scope is explicit.'
  },
  {
    id: 'TDC-R29',
    from: 'DATA-ACCESS-REQUEST',
    predicate: 'may produce',
    to: 'SEC-ACCESS-GRANT',
    cardinality: 'one-to-zero-or-many',
    governance: 'Approved request and actual entitlement remain separate.'
  },
  {
    id: 'TDC-R30',
    from: 'SEC-PRIVILEGED-ACCESS-REQUEST',
    predicate: 'may produce',
    to: 'SEC-ACCESS-GRANT',
    cardinality: 'one-to-zero-or-many',
    governance: 'Privileged approval and provisioned entitlement remain separate.'
  },
  {
    id: 'TDC-R31',
    from: 'SEC-ACCESS-GRANT',
    predicate: 'granted to',
    to: 'AUTH-USER-IDENTITY',
    cardinality: 'many-to-one',
    governance: 'Technical access remains separate from business authority.'
  },
  {
    id: 'TDC-R32',
    from: 'SECURITY-POLICY',
    predicate: 'reuses',
    to: 'SGP-POLICY',
    cardinality: 'many-to-one-pattern',
    governance: 'Security policy uses enterprise Policy semantics.'
  },
  {
    id: 'TDC-R33',
    from: 'SEC-VULNERABILITY',
    predicate: 'affects',
    to: 'IT-TECHNOLOGY-RESOURCE',
    cardinality: 'many-to-many',
    governance: 'Affected scope/version is explicit.'
  },
  {
    id: 'TDC-R34',
    from: 'SEC-VULNERABILITY',
    predicate: 'may affect',
    to: 'CBO-ASSET',
    cardinality: 'many-to-many',
    governance: 'Asset identity is reused.'
  },
  {
    id: 'TDC-R35',
    from: 'SEC-PATCH-CAMPAIGN',
    predicate: 'addresses',
    to: 'SEC-VULNERABILITY',
    cardinality: 'many-to-many',
    governance: 'Campaign scope retains exact vulnerabilities/versions.'
  },
  {
    id: 'TDC-R36',
    from: 'SEC-SECURITY-ALERT',
    predicate: 'may escalate to',
    to: 'SEC-CYBER-INCIDENT',
    cardinality: 'many-to-zero-or-one',
    governance: 'Alert is evidence; escalation creates/links incident case.'
  },
  {
    id: 'TDC-R37',
    from: 'SEC-CYBER-INCIDENT',
    predicate: 'may impact',
    to: 'IT-TECHNOLOGY-SERVICE',
    cardinality: 'many-to-many',
    governance: 'Cyber case and service incident remain separable.'
  },
  {
    id: 'TDC-R38',
    from: 'SEC-CYBER-INCIDENT',
    predicate: 'may link',
    to: 'IT-INCIDENT',
    cardinality: 'many-to-many',
    governance: 'Operational service restoration and cyber response retain separate cases.'
  },
  {
    id: 'TDC-R39',
    from: 'SEC-THREAT-INTELLIGENCE',
    predicate: 'may enrich',
    to: 'SEC-SECURITY-ALERT',
    cardinality: 'many-to-many',
    governance: 'Intelligence provenance remains separate from alert evidence.'
  },
  {
    id: 'TDC-R40',
    from: 'SEC-PENETRATION-TEST',
    predicate: 'produces',
    to: 'SEC-SECURITY-FINDING',
    cardinality: 'one-to-many',
    governance: 'Finding has independent remediation lifecycle.'
  },
  {
    id: 'TDC-R41',
    from: 'SEC-SECURITY-FINDING',
    predicate: 'may identify',
    to: 'SEC-VULNERABILITY',
    cardinality: 'one-to-many',
    governance: 'Finding and vulnerability remain distinct.'
  },
  {
    id: 'TDC-R42',
    from: 'SEC-SECURITY-FINDING',
    predicate: 'may require',
    to: 'ASSURANCE-REMEDIATION-ACTION',
    cardinality: 'one-to-many',
    governance: 'Remediation remains separately owned/evidenced.'
  }
];

export const technologyDataCyberAiRules = [
  'Application Service is a Technology Service type; service identity is independent of resource/platform implementation.',
  'Architecture Decision reuses shared immutable Decision evidence.',
  'Configuration Item is normalized to Configuration Registration over authoritative objects; CMDB is not a duplicate master-data universe.',
  'Endpoint and IT Asset reuse canonical Asset where independently governed; Technology Resource covers logical/infrastructure resources not requiring whole-life Asset semantics.',
  'Identity Account is distinct from User Identity, Person, Role, business permission and Delegated Authority.',
  'IT Service Request, IT Incident, Problem, Technology Change and Technology Release remain separate service-management concepts.',
  'BOF-24 Disaster Recovery Plan implements BOF-23 Recovery Requirements; BOF-23 Disaster Recovery Invocation is execution evidence against an exact plan version.',
  'Data Domain, Data Product and Dataset are separate governance, product and data-identity layers; Reference Dataset is a Dataset type.',
  'Data Quality Rule, Data Quality Issue and data correction/remediation remain distinct definition, case and execution layers.',
  'Report/Dashboard definitions and Analytical/AI Models are versioned definitions/artifacts; outputs, predictions and rendered values are not source business truth.',
  'AI Use Case and AI Model remain distinct; AI Risk Assessment reuses shared Risk Assessment.',
  'Data/Privileged Access Requests are not Access Grants; Access Grant is effective-dated technical authorization and remains separate from business authority.',
  'Security Policy reuses enterprise Policy; Vulnerability, Security Alert, Cybersecurity Incident, Threat Intelligence, Penetration Test and Security Finding remain distinct concepts.',
  'Cybersecurity Incident is distinct from routine IT Incident, Physical Security Incident and Privacy Incident while shared underlying events/evidence may be linked.',
  'All security/data/AI decisions and access materially affecting the business retain actor, exact scope/version, authority/policy basis, timestamp and evidence.'
] as const;

export function validateTechnologyDataCyberAiModel() {
  const ids = new Set(technologyDataCyberAiModel.map((x) => x.modelId));
  const relIds = new Set(technologyDataCyberAiRelationships.map((x) => x.id));
  const external = new Set([
    'CBO-ASSET',
    'AUTH-USER-IDENTITY',
    'WORK-DECISION',
    'BCM-RECOVERY-REQUIREMENT',
    'BCM-DR-INVOCATION',
    'RISK-ASSESSMENT',
    'SGP-POLICY',
    'ASSURANCE-REMEDIATION-ACTION'
  ]);
  if (
    ids.size !== technologyDataCyberAiModel.length ||
    relIds.size !== technologyDataCyberAiRelationships.length
  )
    return false;
  const candidates = new Set(technologyDataCyberAiModel.flatMap((x) => x.candidateKeys));
  for (let i = 1; i <= 38; i += 1) {
    const key = 'BOF-24-' + String(i).padStart(3, '0');
    if (!candidates.has(key)) return false;
  }
  if (
    technologyDataCyberAiModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)
  )
    return false;
  return technologyDataCyberAiRelationships.every(
    (x) => (ids.has(x.from) || external.has(x.from)) && (ids.has(x.to) || external.has(x.to))
  );
}
