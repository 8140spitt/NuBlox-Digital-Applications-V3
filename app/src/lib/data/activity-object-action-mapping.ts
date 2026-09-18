import activitySource from '$lib/generated/enterprise-activity-source.json';
import semanticInventory from '$lib/generated/semantic-model-inventory.json';
import {
  canonicalAggregateBoundaries,
  canonicalAggregateFreezeSummary
} from './canonical-aggregate-boundary-register';

export type ActivityAction =
  | 'create'
  | 'read'
  | 'change'
  | 'submit'
  | 'review'
  | 'approve'
  | 'publish'
  | 'execute'
  | 'record'
  | 'post'
  | 'issue'
  | 'receive'
  | 'allocate'
  | 'reconcile'
  | 'close'
  | 'retire'
  | 'analyse'
  | 'monitor'
  | 'configure'
  | 'cancel';

export type L2AggregateRoute = {
  routeId: string;
  functionId: string;
  match: RegExp;
  aggregateId: string;
  objectModelId: string;
  objectName: string;
  secondaryAggregateIds?: string[];
};

export type ActivityObjectActionMapping = {
  activityId: string;
  functionId: string;
  functionName: string;
  subfunctionId: string;
  subfunctionName: string;
  activityName: string;
  routeId: string;
  aggregateId: string;
  aggregateRootModelId: string;
  aggregateRootName: string;
  objectModelId: string;
  objectName: string;
  secondaryAggregateIds: string[];
  action: ActivityAction;
  accessMode: 'command' | 'query';
  approvalRequired: boolean;
  decisionRequired: boolean;
  evidenceRequired: boolean;
  writeAuthority: string;
  transactionRule: string;
  state: 'mapped';
};

const r = (
  routeId: string,
  functionId: string,
  pattern: string,
  aggregateId: string,
  objectModelId: string,
  objectName: string,
  secondaryAggregateIds: string[] = []
): L2AggregateRoute => ({
  routeId,
  functionId,
  match: new RegExp(pattern, 'i'),
  aggregateId,
  objectModelId,
  objectName,
  secondaryAggregateIds
});

export const l2AggregateRoutes: L2AggregateRoute[] = [
  r('F01-STRATEGY','F01','Vision|Strategic Planning|Business Planning|Operating Model','AGG-02-STRATEGY','SGP-STRATEGY-FRAMEWORK','Strategy / Business Planning',['AGG-02-OBJECTIVE']),
  r('F01-ENV','F01','External Environment|Environmental Analysis','AGG-02-STRATEGY','SGP-ASSUMPTION','Strategic Assumption / External Evidence',['AGG-03-OPPORTUNITY']),
  r('F01-PERF','F01','Goal.*KPI','AGG-02-PERFORMANCE','SGP-KPI-DEFINITION','KPI / Performance',['AGG-02-STRATEGY']),
  r('F01-REVIEW','F01','Strategic Review','AGG-02-GOVERNANCE','SGP-GOVERNANCE-MEETING','Strategic Review / Decision',['AGG-02-STRATEGY','AGG-27-DECISION']),
  r('F01-SCENARIO','F01','Scenario|Foresight','AGG-02-STRATEGY','SGP-SCENARIO','Scenario / Assumption',['AGG-02-PERFORMANCE']),

  r('F02-BOARD','F02','Board Governance|Committee Governance','AGG-02-GOVERNANCE','SGP-GOVERNANCE-BODY','Governance Body / Meeting',['AGG-27-DECISION']),
  r('F02-FRAMEWORK','F02','Governance Framework','AGG-02-GOVERNANCE','SGP-AUTHORITY-FRAMEWORK','Governance / Authority Framework',['AGG-01-AUTHORITY']),
  r('F02-DOA','F02','Delegation of Authority','AGG-01-AUTHORITY','AUTH-DELEGATED-AUTHORITY','Delegated Authority',['AGG-29-AUTHORITY-CONFIG']),
  r('F02-EXEC','F02','Executive Management','AGG-02-GOVERNANCE','SGP-GOVERNANCE-MEETING','Executive Governance / Decision',['AGG-27-DECISION','AGG-19-LEDGER']),
  r('F02-POLICY','F02','Policy Governance','AGG-02-GOVERNANCE','SGP-POLICY','Policy',['AGG-07-INFORMATION']),
  r('F02-ETHICS','F02','Ethics Governance','AGG-21-RISK','INTEGRITY-CASE','Integrity / Ethics Case',['AGG-21-CONTROL']),

  r('F03-FRAMEWORK','F03','Performance Framework','AGG-02-PERFORMANCE','SGP-KPI-DEFINITION','Performance Framework / KPI'),
  r('F03-REPORT','F03','Performance Reporting|Benchmarking','AGG-02-PERFORMANCE','SGP-PERFORMANCE-SNAPSHOT','Performance Snapshot',['AGG-24-DATA']),
  r('F03-VARIANCE','F03','Variance Management','AGG-02-PERFORMANCE','SGP-PERFORMANCE-OBSERVATION','Performance Observation / Variance',['AGG-27-DECISION']),
  r('F03-REVIEW','F03','Management Review','AGG-02-GOVERNANCE','SGP-GOVERNANCE-MEETING','Management Review',['AGG-02-PERFORMANCE','AGG-27-DECISION']),
  r('F03-BENEFIT','F03','Benefits Realisation','AGG-02-PERFORMANCE','SGP-PERFORMANCE-TARGET','Benefit / Performance Target',['AGG-26-TRANSFORMATION']),

  r('F04-OPP','F04','Opportunity Identification','AGG-04-DEVELOPMENT','LDI-DEVELOPMENT-OPPORTUNITY','Corporate Development Opportunity',['AGG-03-OPPORTUNITY']),
  r('F04-VAL','F04','Valuation','AGG-04-DEVELOPMENT','LDI-DEVELOPMENT-APPRAISAL','Investment / Development Appraisal',['AGG-19-LEDGER']),
  r('F04-DD','F04','Due Diligence','AGG-22-LEGAL','LEGAL-MATTER','Due Diligence Matter',['AGG-21-RISK','AGG-04-DEVELOPMENT']),
  r('F04-TXN','F04','Transaction Management|Divestiture|Strategic Partnerships','AGG-04-DEVELOPMENT','LDI-BUSINESS-CASE','Investment / Transaction Business Case',['AGG-22-LEGAL','AGG-19-LEDGER','AGG-27-DECISION']),
  r('F04-INTEG','F04','Integration','AGG-26-TRANSFORMATION','TRANS-INITIATIVE','Integration / Transformation Initiative',['AGG-01-ORG-STRUCTURE']),

  r('F05-PORTFOLIO','F05','Portfolio Strategy|Business Case Development|Innovation Management','AGG-04-DEVELOPMENT','LDI-BUSINESS-CASE','Product / Service Business Case',['AGG-02-STRATEGY']),
  r('F05-NEEDS','F05','Market.*Customer Needs','AGG-03-OPPORTUNITY','CRM-MARKET-INSIGHT','Market / Customer Need',['AGG-07-ENGINEERING-REQUIREMENTS']),
  r('F05-IDEA','F05','Ideation','AGG-10-ITEM','CBO-ITEM','Product / Service Concept',['AGG-04-DEVELOPMENT']),
  r('F05-DESIGN','F05','Product.*Service Design|^Development$','AGG-10-CONFIGURATION','CFG-PRODUCT-CONFIG-MODEL','Product / Service Definition',['AGG-07-ENGINEERING-REQUIREMENTS','AGG-07-ENGINEERING-MODEL']),
  r('F05-LAUNCH','F05','Launch Management','AGG-10-ITEM','CBO-ITEM','Item / Offering',['AGG-03-OPPORTUNITY','AGG-10-PLANNING']),
  r('F05-LIFE','F05','Lifecycle Management|Product Retirement','AGG-10-ITEM','CBO-ITEM','Item Lifecycle',['AGG-10-CONFIGURATION']),

  r('F06-INTEL','F06','Market Intelligence|Customer Segmentation|Marketing Analytics','AGG-03-OPPORTUNITY','CRM-MARKET-INSIGHT','Market Insight / Segment',['AGG-24-DATA']),
  r('F06-BRAND','F06','Brand Management|Marketing Strategy','AGG-25-COMMUNICATIONS','KRC-COMMS-PLAN','Brand / Marketing Plan',['AGG-02-STRATEGY']),
  r('F06-CAMPAIGN','F06','Campaign Management|Digital Marketing|Content Marketing|Events|Market Communications','AGG-25-COMMUNICATIONS','KRC-COMMS-CAMPAIGN','Marketing / Communications Campaign',['AGG-07-INFORMATION']),
  r('F06-LEAD','F06','Lead Generation','AGG-03-OPPORTUNITY','CRM-LEAD','Lead',['AGG-25-COMMUNICATIONS']),

  r('F07-STRAT','F07','Sales Strategy|Sales Performance','AGG-03-OPPORTUNITY','CRM-ACCOUNT-PLAN','Sales / Account Plan',['AGG-02-PERFORMANCE']),
  r('F07-ACCOUNT','F07','Account Management|Channel.*Partner Sales','AGG-03-OPPORTUNITY','CRM-ACCOUNT-PLAN','Account / Partner Plan',['AGG-01-PARTY']),
  r('F07-OPP','F07','Opportunity Management|Pipeline Management|Sales Forecasting','AGG-03-OPPORTUNITY','CRM-OPPORTUNITY','Opportunity / Pipeline',['AGG-02-PERFORMANCE']),
  r('F07-PRICE','F07','Pricing','AGG-10-ITEM','ITEM-PRICE-LIST','Price / Commercial Definition',['AGG-05-ESTIMATE']),
  r('F07-QUOTE','F07','Quotation','AGG-05-OFFER','EST-QUOTATION','Quotation',['AGG-05-ESTIMATE']),
  r('F07-BID','F07','Proposal.*Bid','AGG-03-PURSUIT','CRM-PURSUIT','Pursuit / Bid',['AGG-05-ESTIMATE','AGG-05-OFFER']),
  r('F07-CONTRACT','F07','Contract Negotiation','AGG-08-CONTRACT','CBO-CONTRACT','Contract',['AGG-22-LEGAL']),
  r('F07-SO','F07','Sales Order Management','AGG-05-OFFER','EST-SALES-ORDER','Sales Order',['AGG-08-CONTRACT']),
  r('F07-COMP','F07','Sales Compensation','AGG-18-PAYROLL','HCM-COMPENSATION','Sales Compensation',['AGG-19-LEDGER']),

  r('F08-ONBOARD','F08','Customer Onboarding','AGG-03-CUSTOMER-CASE','CRM-CUSTOMER-ONBOARDING','Customer Onboarding',['AGG-01-PARTY']),
  r('F08-CASE','F08','Customer Enquiry Management|Case Management|Complaint Management|Customer Feedback|Retention|Customer Success','AGG-03-CUSTOMER-CASE','CRM-CUSTOMER-CASE','Customer Case',['AGG-01-PARTY']),
  r('F08-SUPPORT','F08','Technical Support','AGG-17-SERVICE','OPS-SERVICE-CASE','Service Case',['AGG-17-WORK-ORDER']),
  r('F08-RETURN','F08','Returns.*Refunds','AGG-03-CUSTOMER-CASE','CRM-CUSTOMER-CASE','Return / Refund Case',['AGG-10-INVENTORY-MOVEMENT','AGG-19-AR']),
  r('F08-WARRANTY','F08','Warranty','AGG-17-SERVICE','OPS-WARRANTY-CLAIM','Warranty Claim',['AGG-16-SPATIAL-ASSET']),
  r('F08-KNOW','F08','Customer Knowledge','AGG-25-KNOWLEDGE','KRC-KNOWLEDGE-ARTICLE','Knowledge Article',['AGG-03-CUSTOMER-CASE']),
  r('F08-SLA','F08','Service-level Management','AGG-17-SERVICE','OPS-SERVICE-LEVEL','Service Entitlement / SLA',['AGG-08-CONTRACT']),

  r('F09-STRAT','F09','Procurement Strategy|Category Management|Procurement Analytics','AGG-09-SOURCING','COM-PROCUREMENT-PACKAGE','Procurement Strategy / Package',['AGG-02-PERFORMANCE']),
  r('F09-DISCOVERY','F09','Supplier Discovery|Supplier Onboarding|Supplier Relationship Management','AGG-01-PARTY','AUTH-PARTY-RELATIONSHIP','Supplier Relationship',['AGG-09-SOURCING']),
  r('F09-SOURCE','F09','Sourcing|Supplier Negotiation','AGG-09-SOURCING','PROC-SOURCING-EVENT','Sourcing Event',['AGG-01-PARTY']),
  r('F09-CONTRACT','F09','Contracting','AGG-08-CONTRACT','CBO-CONTRACT','Supplier Contract',['AGG-09-SOURCING']),
  r('F09-REQ','F09','Requisitioning','AGG-09-SOURCING','PROC-REQUISITION','Requisition'),
  r('F09-PO','F09','Purchase Ordering','AGG-09-PURCHASE-COMMITMENT','PROC-PURCHASE-ORDER','Purchase Order',['AGG-08-CONTRACT']),
  r('F09-PERF','F09','Supplier Performance','AGG-02-PERFORMANCE','SGP-PERFORMANCE-OBSERVATION','Supplier Performance',['AGG-01-PARTY']),
  r('F09-RISK','F09','Supplier Risk','AGG-21-RISK','RISK-ENTERPRISE-RISK','Supplier Risk',['AGG-01-PARTY']),

  r('F10-DEMAND','F10','Demand Planning|Sales.*Operations Planning|Supply Planning|Material Requirements','AGG-10-PLANNING','PLN-DEMAND-PLAN','Demand / Supply Plan',['AGG-10-ITEM']),
  r('F10-INVPLAN','F10','Inventory Planning|Inventory Control','AGG-10-INVENTORY-MOVEMENT','INV-STOCK-POSITION','Inventory / Stock Control',['AGG-10-PLANNING']),
  r('F10-WH','F10','Warehouse Management','AGG-10-INVENTORY-STORAGE','INV-WAREHOUSE','Warehouse / Storage',['AGG-10-INVENTORY-MOVEMENT']),
  r('F10-TRANSPORT','F10','Transport Management|Distribution|Reverse Logistics','AGG-10-LOGISTICS','LOG-SHIPMENT','Shipment / Logistics',['AGG-10-INVENTORY-MOVEMENT']),
  r('F10-TRADE','F10','Import.*Export','AGG-10-LOGISTICS','LOG-TRADE-DECLARATION','Trade Declaration',['AGG-21-CONTROL']),
  r('F10-ANALYTICS','F10','Supply Chain Analytics','AGG-02-PERFORMANCE','SGP-PERFORMANCE-SNAPSHOT','Supply Chain Performance',['AGG-24-DATA']),
  r('F10-RISK','F10','Supply Chain Risk','AGG-21-RISK','RISK-ENTERPRISE-RISK','Supply Chain Risk'),

  r('F11-PLAN','F11','Production Planning|Production Scheduling|Capacity Management','AGG-11-MFG-DEFINITION','MFG-DEFINITION','Manufacturing Definition / Plan',['AGG-10-PLANNING']),
  r('F11-STAGE','F11','Material Staging|Packaging','AGG-10-INVENTORY-MOVEMENT','INV-MOVEMENT','Material / Packaging Movement',['AGG-11-PRODUCTION']),
  r('F11-EXEC','F11','Production Execution|Process Control|Work-in-progress|Production Reporting','AGG-11-PRODUCTION','MFG-PRODUCTION-ORDER','Production Order',['AGG-10-INVENTORY-MOVEMENT']),
  r('F11-MAINT','F11','Maintenance Coordination','AGG-17-WORK-ORDER','OPS-WORK-ORDER','Maintenance Work Order',['AGG-11-PRODUCTION']),
  r('F11-LEAN','F11','Lean Operations','AGG-26-PROCESS','PROC-IMPROVEMENT-OPPORTUNITY','Improvement Opportunity',['AGG-11-PRODUCTION']),

  r('F12-PLAN','F12','Service Planning|Service Scheduling|Service Capacity','AGG-17-SERVICE','OPS-SERVICE-CASE','Service Case / Plan',['AGG-18-WORKFORCE']),
  r('F12-DISPATCH','F12','Resource Dispatch','AGG-17-SERVICE','OPS-SERVICE-APPOINTMENT','Service Appointment',['AGG-18-WORKFORCE']),
  r('F12-EXEC','F12','Service Execution|Field Service','AGG-17-WORK-ORDER','OPS-WORK-ORDER','Work Order',['AGG-12-FIELD-EXECUTION']),
  r('F12-PROF','F12','Professional Services','AGG-06-PROJECT','CBO-PROJECT','Project / Professional Service',['AGG-18-WORKFORCE']),
  r('F12-ACCEPT','F12','Service Acceptance','AGG-17-SERVICE','OPS-SERVICE-ACCEPTANCE','Service Acceptance'),
  r('F12-QUALITY','F12','Service Quality','AGG-13-QUALITY','QHSE-INSPECTION','Service Quality Evidence',['AGG-17-SERVICE']),
  r('F12-PERF','F12','Service Performance','AGG-02-PERFORMANCE','SGP-PERFORMANCE-SNAPSHOT','Service Performance',['AGG-17-SERVICE']),

  r('F13-STRAT','F13','Quality Strategy|Quality Planning','AGG-13-QUALITY','QHSE-QUALITY-PLAN','Quality Plan'),
  r('F13-ASSURE','F13','Quality Assurance|Supplier Quality','AGG-13-QUALITY','QHSE-ITP','Inspection / Assurance Plan',['AGG-09-SOURCING']),
  r('F13-CONTROL','F13','Quality Control','AGG-13-QUALITY','QHSE-INSPECTION','Inspection / Test'),
  r('F13-NCR','F13','Non-conformance','AGG-13-NONCONFORMANCE','QHSE-NCR','Nonconformance Report'),
  r('F13-CAPA','F13','Corrective.*Preventive Action','AGG-13-NONCONFORMANCE','QHSE-CAPA-CASE','CAPA Case'),
  r('F13-DOC','F13','Quality Documentation','AGG-07-INFORMATION','CBO-INFORMATION-CONTAINER','Controlled Quality Information'),
  r('F13-CI','F13','Continuous Improvement','AGG-26-PROCESS','PROC-IMPROVEMENT-OPPORTUNITY','Improvement Opportunity',['AGG-13-NONCONFORMANCE']),
  r('F13-ANALYTICS','F13','Quality Analytics','AGG-02-PERFORMANCE','SGP-PERFORMANCE-SNAPSHOT','Quality Performance'),

  r('F14-STRAT','F14','Financial Strategy|Budgeting|Forecasting|Profitability Analysis|Capital Expenditure','AGG-19-LEDGER','FIN-BUDGET','Budget / Forecast / Capex',['AGG-02-STRATEGY']),
  r('F14-GL','F14','General Ledger|Cost Accounting|Financial Close|Consolidation|Financial Reporting|Financial Controls','AGG-19-LEDGER','FIN-LEDGER','Ledger / Financial Control'),
  r('F14-AP','F14','Accounts Payable|Expense Management','AGG-19-AP','FIN-SUPPLIER-INVOICE','Payable / Expense',['AGG-18-PAYROLL']),
  r('F14-AR','F14','Accounts Receivable|Credit Management|Collections','AGG-19-AR','FIN-CUSTOMER-INVOICE','Receivable / Customer Balance'),
  r('F14-TREASURY','F14','Treasury|Payments|Foreign Exchange|Debt.*Financing','AGG-19-TREASURY','FIN-TREASURY-DEAL','Treasury / Cash',['AGG-19-LEDGER']),
  r('F14-FIXED','F14','Fixed Asset Accounting','AGG-19-LEDGER','FIN-FIXED-ASSET','Fixed Asset Accounting',['AGG-16-SPATIAL-ASSET']),
  r('F14-TAX','F14','Tax','AGG-19-LEDGER','FIN-TAX-RETURN','Tax / Statutory Finance',['AGG-29-REFERENCE-DATA']),

  r('F15-STRAT','F15','People Strategy|Workforce Planning|Organisation Design','AGG-18-WORKFORCE','HCM-WORKFORCE-PLAN','Workforce Plan',['AGG-01-ORG-STRUCTURE']),
  r('F15-JOB','F15','Job Architecture','AGG-18-POSITION','HCM-JOB-PROFILE','Job Profile / Position'),
  r('F15-RECRUIT','F15','Recruitment|Pre-employment|Onboarding','AGG-18-WORKFORCE','HCM-VACANCY','Recruitment / Onboarding',['AGG-01-PARTY']),
  r('F15-ADMIN','F15','Employee Administration|Employee Relations|Offboarding','AGG-18-WORKFORCE','HCM-WORKER-RELATIONSHIP','Worker Relationship / Case'),
  r('F15-TIME','F15','Time.*Attendance|Absence Management','AGG-18-WORKFORCE','HCM-TIMESHEET','Time / Attendance / Absence'),
  r('F15-PAY','F15','Payroll|Compensation|Benefits','AGG-18-PAYROLL','HCM-PAYROLL-RUN','Payroll / Compensation',['AGG-19-LEDGER']),
  r('F15-PERF','F15','Performance Management','AGG-18-WORKFORCE','HCM-PERFORMANCE-REVIEW','Performance Review',['AGG-02-PERFORMANCE']),
  r('F15-LEARN','F15','Learning.*Development','AGG-18-LEARNING','HCM-TRAINING-COURSE','Learning / Competence'),
  r('F15-TALENT','F15','Talent Management','AGG-18-TALENT','HCM-SUCCESSION-PLAN','Talent / Succession'),
  r('F15-ENGAGE','F15','Employee Engagement|HR Analytics','AGG-02-PERFORMANCE','SGP-PERFORMANCE-SNAPSHOT','People Performance / Engagement',['AGG-18-WORKFORCE']),

  r('F16-STRAT','F16','IT Strategy|Enterprise Architecture|Solution Architecture','AGG-24-TECHNOLOGY','IT-TECHNOLOGY-SERVICE','Technology Service / Architecture',['AGG-02-STRATEGY']),
  r('F16-APP','F16','Application Management|Software Development|DevOps|Infrastructure|Cloud Management|Network Management|Endpoint Management|IT Asset Management|Availability.*Capacity','AGG-24-TECHNOLOGY','IT-TECHNOLOGY-RESOURCE','Technology Resource / Service'),
  r('F16-IAM','F16','Identity Administration','AGG-01-AUTHORITY','AUTH-USER-IDENTITY','User Identity / Access',['AGG-24-CYBER']),
  r('F16-SD','F16','IT Service Desk','AGG-24-TECHNOLOGY','IT-SERVICE-REQUEST','IT Service Request'),
  r('F16-INC','F16','Incident Management','AGG-24-TECHNOLOGY','IT-INCIDENT','IT Incident'),
  r('F16-PROB','F16','Problem Management','AGG-24-TECHNOLOGY','IT-PROBLEM','Problem'),
  r('F16-CHANGE','F16','Change Management|Release Management|Configuration Management','AGG-24-TECHNOLOGY','IT-TECHNOLOGY-CHANGE','Technology Change / Release'),
  r('F16-DR','F16','Disaster Recovery','AGG-23-CONTINUITY','IT-DISASTER-RECOVERY-PLAN','Disaster Recovery Plan',['AGG-24-TECHNOLOGY']),
  r('F16-VENDOR','F16','Technology Vendor Management','AGG-09-SOURCING','CBO-CONTRACT','Technology Supplier / Contract',['AGG-24-TECHNOLOGY']),

  r('F17-STRAT','F17','Data Strategy|Data Governance|Data Architecture','AGG-24-DATA','DATA-DOMAIN','Data Domain / Governance'),
  r('F17-MDM','F17','Master Data Management','AGG-01-MASTER-STEWARDSHIP','MDG-STEWARDSHIP-CASE','Master Data Stewardship'),
  r('F17-REF','F17','Reference Data','AGG-29-REFERENCE-DATA','REF-JURISDICTION','Reference Data'),
  r('F17-QUALITY','F17','Data Quality','AGG-24-DATA','DATA-QUALITY-ISSUE','Data Quality Rule / Issue'),
  r('F17-ENGINEER','F17','Data Engineering|Data Platform|Metadata.*Catalogue|Data Lifecycle','AGG-24-DATA','DATA-PRODUCT','Data Product / Dataset'),
  r('F17-BI','F17','BI.*Reporting|Analytics|Data Science','AGG-24-DATA','ANALYTICS-MODEL','Analytics / Reporting'),
  r('F17-AI','F17','AI Development|AI Governance|Model Operations','AGG-24-AI','AI-USE-CASE','AI Use Case / Model',['AGG-21-RISK']),
  r('F17-ACCESS','F17','Data Access','AGG-24-DATA','DATA-ACCESS-REQUEST','Data Access Request',['AGG-01-AUTHORITY']),

  r('F18-STRAT','F18','Security Strategy|Security Policy|Security Architecture|Security Compliance','AGG-24-CYBER','SECURITY-POLICY','Security Policy / Architecture',['AGG-21-CONTROL']),
  r('F18-IAM','F18','Identity.*Access Security|Cryptography','AGG-01-AUTHORITY','SEC-ACCESS-GRANT','Access / Security Authority',['AGG-24-CYBER']),
  r('F18-VULN','F18','Vulnerability Management|Patch Security|Application Security','AGG-24-CYBER','SEC-VULNERABILITY','Vulnerability / Patch'),
  r('F18-MON','F18','Security Monitoring|Threat Intelligence|Penetration Testing','AGG-24-CYBER','SEC-SECURITY-ALERT','Security Monitoring / Test'),
  r('F18-INC','F18','Security Incident Response','AGG-24-CYBER','SEC-CYBER-INCIDENT','Cybersecurity Incident'),
  r('F18-THIRD','F18','Third-party Security','AGG-21-RISK','RISK-ENTERPRISE-RISK','Third-party Security Risk',['AGG-09-SOURCING']),
  r('F18-AWARE','F18','Security Awareness','AGG-18-LEARNING','HCM-TRAINING-COURSE','Security Learning / Awareness'),

  r('F19-ADVICE','F19','Legal Advisory|Regulatory Legal|Employment Legal|Legal Spend','AGG-22-LEGAL','LEGAL-MATTER','Legal Matter'),
  r('F19-CONTRACT','F19','Contract Management|Contract Repository','AGG-08-CONTRACT','CBO-CONTRACT','Contract',['AGG-07-INFORMATION']),
  r('F19-CORP','F19','Corporate Legal|Company Secretariat','AGG-22-CORPORATE-SECRETARIAT','CORP-OFFICE-APPOINTMENT','Corporate Secretariat / Entity Register',['AGG-22-LEGAL']),
  r('F19-IP','F19','Intellectual Property','AGG-22-LEGAL','LEGAL-IP-ASSET','Intellectual Property Asset'),
  r('F19-LIT','F19','Litigation','AGG-22-LEGAL','LEGAL-PROCEEDING','Legal Proceeding / Dispute'),
  r('F19-HOLD','F19','Legal Hold.*EDiscovery','AGG-28-RETENTION','EVID-LEGAL-HOLD-LINK','Legal Hold / eDiscovery',['AGG-22-LEGAL']),
  r('F19-OBL','F19','Legal Obligations','AGG-22-LEGAL','LEGAL-OBLIGATION','Legal Obligation'),

  r('F20-RISK','F20','Risk Framework|Risk Identification|Risk Assessment|Risk Treatment|Risk Monitoring|Fraud Risk','AGG-21-RISK','RISK-ENTERPRISE-RISK','Enterprise Risk / Assessment'),
  r('F20-COMP','F20','Regulatory Compliance|Compliance Monitoring|Ethics.*Conduct','AGG-21-CONTROL','COMP-REQUIREMENT','Compliance Requirement / Assessment'),
  r('F20-CTRL','F20','Control Management|Control Testing','AGG-21-CONTROL','CTRL-INTERNAL-CONTROL','Internal Control / Test'),
  r('F20-AUDIT','F20','Internal Audit Planning|Audit Execution|Audit Reporting|Assurance Coordination','AGG-21-AUDIT','AUDIT-ENGAGEMENT','Audit / Assurance'),
  r('F20-REMED','F20','Issue.*Remediation','AGG-21-AUDIT','AUDIT-FINDING','Finding / Remediation'),

  r('F21-GOV','F21','Privacy Governance','AGG-22-PRIVACY','PRIV-FRAMEWORK','Privacy Framework / Policy'),
  r('F21-PROC','F21','Processing Inventory|Privacy Impact Assessment|International Transfers','AGG-22-PRIVACY','PRIV-PROCESSING-ACTIVITY','Processing Activity / DPIA'),
  r('F21-CONSENT','F21','Consent.*Preferences','AGG-22-PRIVACY','PRIV-CONSENT-EVIDENCE','Consent / Preference Evidence'),
  r('F21-DSR','F21','Data Subject Rights','AGG-22-PRIVACY','PRIV-DATA-SUBJECT-REQUEST','Data Subject Request'),
  r('F21-INC','F21','Privacy Incidents','AGG-22-PRIVACY','PRIV-INCIDENT','Privacy Incident'),
  r('F21-RET','F21','Retention','AGG-28-RETENTION','EVID-RETENTION-DISPOSITION','Retention / Disposition',['AGG-22-PRIVACY']),
  r('F21-ASS','F21','Privacy Assurance','AGG-21-AUDIT','AUDIT-ENGAGEMENT','Privacy Assurance Review',['AGG-22-PRIVACY']),

  r('F22-STRAT','F22','Asset Strategy|Capital Planning','AGG-16-ASSET-INVESTMENT','OPS-ASSET-INVESTMENT-PLAN','Asset Investment Plan',['AGG-19-LEDGER']),
  r('F22-ACQ','F22','Asset Acquisition|Property Acquisition|Construction.*Project Delivery','AGG-16-SPATIAL-ASSET','CBO-ASSET','Asset / Property Acquisition',['AGG-06-PROJECT','AGG-19-LEDGER']),
  r('F22-REGISTER','F22','Asset Register','AGG-16-SPATIAL-ASSET','CBO-ASSET','Asset'),
  r('F22-MAINT','F22','Preventive Maintenance|Reactive Maintenance','AGG-17-WORK-ORDER','OPS-WORK-ORDER','Maintenance Work Order',['AGG-17-MAINTENANCE']),
  r('F22-REL','F22','Reliability','AGG-17-RELIABILITY','REL-RELIABILITY-STRATEGY','Reliability Strategy'),
  r('F22-FM','F22','Facilities Operations','AGG-17-SERVICE','OPS-SERVICE-CASE','Facilities Service Case',['AGG-17-WORKPLACE']),
  r('F22-SPACE','F22','Space Management','AGG-17-WORKPLACE','OPS-WORKPLACE-RESERVATION','Space / Workplace Use',['AGG-16-SPATIAL-ASSET']),
  r('F22-LEASE','F22','Lease Management','AGG-19-LEASE-ACCOUNTING','FIN-LEASE-ACCOUNTING-RECORD','Lease / Lease Accounting',['AGG-08-CONTRACT']),
  r('F22-UTIL','F22','Utilities Management','AGG-17-SERVICE','OPS-UTILITY-ACCOUNT','Utility Account / Consumption',['AGG-20-CARBON']),
  r('F22-DISP','F22','Asset Disposal','AGG-16-SPATIAL-ASSET','CBO-ASSET','Asset Disposal',['AGG-28-RETENTION']),

  r('F23-HS','F23','H&S Management|Hazard Identification|Workplace Inspections|Incident Management|Occupational Health|Permit-to-work','AGG-13-INCIDENT','QHSE-INCIDENT','H&S / Incident / Permit',['AGG-21-RISK','AGG-13-QUALITY']),
  r('F23-ENV','F23','Environmental Management|Environmental Compliance','AGG-21-CONTROL','QHSE-COMPLIANCE-REQUIREMENT','Environmental Compliance',['AGG-20-CARBON']),
  r('F23-WASTE','F23','Waste Management','AGG-20-RESOURCE-OUTCOME','QHSE-WASTE-CONSIGNMENT','Waste / Resource Evidence'),
  r('F23-CARBON','F23','Carbon Management|Energy Management|Sustainability Strategy|ESG Reporting','AGG-20-CARBON','SUS-CARBON-ASSESSMENT','Carbon / Sustainability Performance',['AGG-02-PERFORMANCE']),
  r('F23-SUPPLY','F23','Sustainable Supply Chain','AGG-20-RESOURCE-OUTCOME','SUS-RESPONSIBLE-PROCUREMENT','Responsible Procurement',['AGG-09-SOURCING']),

  r('F24-BCM','F24','Business Continuity Governance|Business Impact Analysis|Continuity Planning|Continuity Testing|Disaster Recovery Coordination','AGG-23-CONTINUITY','BCM-CONTINUITY-PLAN','Continuity / Recovery',['AGG-24-TECHNOLOGY']),
  r('F24-CRISIS','F24','Crisis Management|Emergency Response|Crisis Communications','AGG-23-CRISIS','BCM-CRISIS','Crisis / Emergency Response',['AGG-25-COMMUNICATIONS']),
  r('F24-PHYS','F24','Physical Security|Visitor Management|Security Investigations|Travel Security','AGG-23-CRISIS','SEC-PHYSICAL-SECURITY-INCIDENT','Physical / Travel Security',['AGG-01-AUTHORITY','AGG-18-TRAVEL']),

  r('F25-COMMS','F25','Corporate Communications|Internal Communications|Public Relations|Annual Reporting|Crisis Communications','AGG-25-COMMUNICATIONS','KRC-COMMS-PLAN','Communications Plan / Item',['AGG-07-INFORMATION']),
  r('F25-MEDIA','F25','Media Relations|Reputation Management|Public Affairs|Government Relations','AGG-25-COMMUNICATIONS','KRC-EXTERNAL-AFFAIRS-ISSUE','External Affairs / Media',['AGG-03-CUSTOMER-CASE']),
  r('F25-INVESTOR','F25','Investor Relations','AGG-25-COMMUNICATIONS','KRC-STAKEHOLDER-PLAN','Investor / Stakeholder Engagement',['AGG-19-LEDGER']),
  r('F25-STAKE','F25','Stakeholder Engagement|Community Relations','AGG-25-COMMUNICATIONS','KRC-STAKEHOLDER-ENGAGEMENT','Stakeholder Engagement'),

  r('F26-KNOW','F26','Knowledge Strategy|Knowledge Capture|Knowledge Sharing|Knowledge Maintenance|Lessons Learned|Enterprise Search','AGG-25-KNOWLEDGE','KRC-KNOWLEDGE-ARTICLE','Knowledge Article / Collection',['AGG-24-DATA']),
  r('F26-DOC','F26','Document Management|Controlled Documents','AGG-07-INFORMATION','CBO-INFORMATION-CONTAINER','Information Container'),
  r('F26-REC','F26','Records Management|Records Retention','AGG-25-RECORDS','KRC-RECORD-SERIES','Record Series / File',['AGG-28-RETENTION']),

  r('F27-PORT','F27','Portfolio Management|Investment Governance|Programme Management','AGG-06-PROJECT','DEL-PORTFOLIO','Portfolio / Programme',['AGG-27-DECISION']),
  r('F27-INIT','F27','Project Initiation','AGG-06-PROJECT','CBO-PROJECT','Project'),
  r('F27-PLAN','F27','Project Planning','AGG-06-SCHEDULE','DEL-SCHEDULE','Project Schedule / Plan',['AGG-06-WBS']),
  r('F27-EXEC','F27','Project Execution|Project Closure','AGG-06-PROJECT','CBO-PROJECT','Project Execution / Close',['AGG-15-HANDOVER']),
  r('F27-CTRL','F27','Project Control','AGG-06-PROJECT-CONTROLS','DEL-PERFORMANCE-CALCULATION-RUN','Project Controls',['AGG-06-SCHEDULE','AGG-19-LEDGER']),
  r('F27-PMO','F27','PMO','AGG-06-PROJECT','DEL-PORTFOLIO','PMO / Portfolio Governance',['AGG-02-PERFORMANCE']),
  r('F27-RESOURCE','F27','Resource Management','AGG-18-WORKFORCE','HCM-WORKFORCE-ALLOCATION','Workforce Allocation',['AGG-06-PROJECT']),

  r('F28-STRAT','F28','Transformation Strategy','AGG-26-TRANSFORMATION','TRANS-INITIATIVE','Transformation Initiative',['AGG-02-STRATEGY']),
  r('F28-IMPACT','F28','Change Impact Assessment','AGG-26-TRANSFORMATION','TRANS-CHANGE-IMPACT-ASSESSMENT','Change Impact Assessment'),
  r('F28-STAKE','F28','Stakeholder Management|Change Communications','AGG-26-TRANSFORMATION','TRANS-STAKEHOLDER-COHORT','Change Stakeholder / Communication',['AGG-25-COMMUNICATIONS']),
  r('F28-READY','F28','Training.*Readiness|Adoption Management','AGG-26-TRANSFORMATION','TRANS-READINESS-PLAN','Readiness / Adoption',['AGG-18-LEARNING']),
  r('F28-TRANS','F28','Organisational Transition','AGG-26-TRANSFORMATION','TRANS-ORGANISATION-TRANSITION','Organisation Transition',['AGG-01-ORG-STRUCTURE']),
  r('F28-BEN','F28','Benefits Tracking','AGG-02-PERFORMANCE','SGP-PERFORMANCE-TARGET','Benefits Performance',['AGG-26-TRANSFORMATION']),

  r('F29-ARCH','F29','Process Architecture|Process Ownership','AGG-26-PROCESS','PROC-ENTERPRISE-PROCESS','Enterprise Process'),
  r('F29-MODEL','F29','Process Modelling|Process Redesign','AGG-26-PROCESS','PROC-MODEL','Process Model / Redesign'),
  r('F29-ANALYSE','F29','Process Analysis|Process Performance','AGG-26-PROCESS','PROC-ANALYSIS','Process Analysis / Measure',['AGG-02-PERFORMANCE']),
  r('F29-SOP','F29','SOP Management','AGG-07-INFORMATION','CBO-INFORMATION-CONTAINER','Controlled SOP',['AGG-26-PROCESS']),
  r('F29-WF','F29','Workflow Automation','AGG-27-WORKFLOW','WORK-WORKFLOW-INSTANCE','Workflow / Automation',['AGG-26-PROCESS']),
  r('F29-CI','F29','Continuous Improvement','AGG-26-PROCESS','PROC-IMPROVEMENT-OPPORTUNITY','Improvement Opportunity'),
  r('F29-COMP','F29','Process Compliance','AGG-21-CONTROL','COMP-ASSESSMENT','Compliance Assessment',['AGG-26-PROCESS'])
];

const aggregateById = new Map(canonicalAggregateBoundaries.map((entry) => [entry.id, entry]));

function inferAction(activityName: string): ActivityAction {
  const value = activityName.trim().toLowerCase();
  if (/^(view|read|search|find|retrieve|access|consult)/.test(value)) return 'read';
  if (/^(define|establish|create|develop|draft|build|set up|set|capture|register|appoint|open|raise|initiate)/.test(value)) return 'create';
  if (/^(update|adjust|revise|maintain|change|modify|correct|improve|reprioritise|reclassify)/.test(value)) return 'change';
  if (/^(submit|file|lodge|send for)/.test(value)) return 'submit';
  if (/^(review|validate|verify|check|assess|evaluate|test|inspect|audit|challenge|reassess)/.test(value)) return 'review';
  if (/^(approve|authorise|authorize|accept|certify|endorse|ratify|sanction|select)/.test(value)) return 'approve';
  if (/^(publish|communicate|distribute|release|announce)/.test(value)) return 'publish';
  if (/^(post|book|recognise|recognize)/.test(value)) return 'post';
  if (/^(issue|dispatch|send|notify)/.test(value)) return 'issue';
  if (/^(receive|acknowledge|collect)/.test(value)) return 'receive';
  if (/^(allocate|assign|schedule|plan|resource|reserve)/.test(value)) return 'allocate';
  if (/^(reconcile|match|settle)/.test(value)) return 'reconcile';
  if (/^(close|complete|finalise|finalize|resolve)/.test(value)) return 'close';
  if (/^(retire|dispose|decommission|archive|destroy)/.test(value)) return 'retire';
  if (/^(cancel|withdraw|reject|decline|terminate)/.test(value)) return 'cancel';
  if (/^(monitor|track|watch|measure)/.test(value)) return 'monitor';
  if (/^(analyse|analyze|model|calculate|forecast|project|compare|benchmark|determine|identify|investigate|discover|map|cost|defects|hand-offs|bottlenecks)/.test(value)) return 'analyse';
  if (/^(configure|administer|manage|govern|control)/.test(value)) return 'configure';
  if (/^(record|log|document|evidence)/.test(value)) return 'record';
  return 'execute';
}

function matchingRoutes(functionId: string, subfunctionName: string) {
  return l2AggregateRoutes.filter((route) => route.functionId === functionId && route.match.test(subfunctionName));
}

function routeFor(functionId: string, subfunctionName: string) {
  return matchingRoutes(functionId, subfunctionName)[0];
}

export const unmappedSubfunctions = activitySource.subfunctions.filter(
  (subfunction) => matchingRoutes(subfunction.functionId, subfunction.name).length === 0
);

export const ambiguousSubfunctions = activitySource.subfunctions
  .map((subfunction) => ({
    subfunction,
    routes: matchingRoutes(subfunction.functionId, subfunction.name)
  }))
  .filter((entry) => entry.routes.length > 1);

export const activityObjectActionMappings: ActivityObjectActionMapping[] = activitySource.subfunctions.flatMap((subfunction) => {
  const route = routeFor(subfunction.functionId, subfunction.name);
  if (!route) return [];
  const aggregate = aggregateById.get(route.aggregateId);
  if (!aggregate) return [];

  return subfunction.activities.map((activityName, index) => {
    const action = inferAction(activityName);
    const approvalRequired = action === 'approve' || /approval|authority|certif|release|publish/i.test(activityName);
    const decisionRequired = approvalRequired || /decid|select|adjudicat|go\/no-go|prioritis|prioritiz/i.test(activityName);
    const accessMode = action === 'read' || action === 'analyse' || action === 'monitor' ? 'query' : 'command';

    return {
      activityId: `${subfunction.id}.A${String(index + 1).padStart(2, '0')}`,
      functionId: subfunction.functionId,
      functionName: subfunction.functionName,
      subfunctionId: subfunction.id,
      subfunctionName: subfunction.name,
      activityName,
      routeId: route.routeId,
      aggregateId: route.aggregateId,
      aggregateRootModelId: aggregate.rootModelId,
      aggregateRootName: aggregate.rootName,
      objectModelId: route.objectModelId,
      objectName: route.objectName,
      secondaryAggregateIds: route.secondaryAggregateIds ?? [],
      action,
      accessMode,
      approvalRequired,
      decisionRequired,
      evidenceRequired: accessMode === 'command' || decisionRequired,
      writeAuthority: aggregate.writeAuthority,
      transactionRule: aggregate.transactionRule,
      state: 'mapped' as const
    };
  });
});

const knownAggregateIds = new Set(canonicalAggregateBoundaries.map((entry) => entry.id));
const knownSemanticModelIds = new Set(semanticInventory.items.map((entry) => entry.id));
const sourceActivityCount = activitySource.subfunctions.reduce(
  (sum, subfunction) => sum + subfunction.activities.length,
  0
);

export const activityObjectActionSummary = {
  sourceFunctionCount: activitySource.summary.functions,
  sourceSubfunctionCount: activitySource.summary.subfunctions,
  sourceActivityCount,
  mappedFunctionCount: new Set(activityObjectActionMappings.map((entry) => entry.functionId)).size,
  mappedSubfunctionCount: new Set(activityObjectActionMappings.map((entry) => entry.subfunctionId)).size,
  mappedActivityCount: activityObjectActionMappings.length,
  unmappedSubfunctionCount: unmappedSubfunctions.length,
  ambiguousSubfunctionCount: ambiguousSubfunctions.length,
  invalidObjectModelRouteCount: l2AggregateRoutes.filter((route) => !knownSemanticModelIds.has(route.objectModelId)).length,
  invalidAggregateRouteCount: l2AggregateRoutes.filter((route) => !knownAggregateIds.has(route.aggregateId)).length,
  commandCount: activityObjectActionMappings.filter((entry) => entry.accessMode === 'command').length,
  queryCount: activityObjectActionMappings.filter((entry) => entry.accessMode === 'query').length,
  approvalControlledCount: activityObjectActionMappings.filter((entry) => entry.approvalRequired).length,
  decisionControlledCount: activityObjectActionMappings.filter((entry) => entry.decisionRequired).length,
  state: 'mapped' as const
};

export function validateActivityObjectActionMapping() {
  if (canonicalAggregateFreezeSummary.state !== 'frozen') return false;
  if (activitySource.summary.functions !== 29) return false;
  if (activitySource.summary.subfunctions !== 353) return false;
  if (sourceActivityCount !== 1510) return false;
  if (activityObjectActionSummary.mappedFunctionCount !== 29) return false;
  if (activityObjectActionSummary.mappedSubfunctionCount !== 353) return false;
  if (activityObjectActionSummary.mappedActivityCount !== 1510) return false;
  if (activityObjectActionSummary.unmappedSubfunctionCount !== 0) return false;
  if (activityObjectActionSummary.ambiguousSubfunctionCount !== 0) return false;
  if (activityObjectActionSummary.invalidObjectModelRouteCount !== 0) return false;
  if (activityObjectActionSummary.invalidAggregateRouteCount !== 0) return false;
  if (new Set(activityObjectActionMappings.map((entry) => entry.activityId)).size !== 1510) return false;
  if (!activityObjectActionMappings.every((entry) => knownAggregateIds.has(entry.aggregateId))) return false;
  if (!activityObjectActionMappings.every((entry) => knownSemanticModelIds.has(entry.objectModelId))) return false;
  if (!activityObjectActionMappings.every((entry) => entry.writeAuthority && entry.transactionRule && entry.objectModelId)) return false;
  if (!activityObjectActionMappings.every((entry) => entry.state === 'mapped')) return false;
  return true;
}
