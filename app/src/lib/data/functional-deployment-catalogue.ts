export type FunctionalCatalogueEntry = {
  code: string;
  type: 'ENTERPRISE_FUNCTION' | 'DELIVERY_DOMAIN';
  name: string;
  purpose: string;
};

export type ConstructionJobCatalogueEntry = {
  code: string;
  name: string;
  sectorDomain: string;
  specialistCapabilityFocus: string;
  candidateOutputs: string;
  typicalLifecycleStage: string;
  sourceReference: string;
};

export const enterpriseFunctionalCatalogue: FunctionalCatalogueEntry[] = [
  {
    code: 'F01',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Strategy & Enterprise Planning',
    purpose: 'Operate the enterprise capability represented by Strategy & Enterprise Planning.'
  },
  {
    code: 'F02',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Corporate Governance',
    purpose: 'Operate the enterprise capability represented by Corporate Governance.'
  },
  {
    code: 'F03',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Enterprise Performance Management',
    purpose: 'Operate the enterprise capability represented by Enterprise Performance Management.'
  },
  {
    code: 'F04',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Corporate Development & M&A',
    purpose: 'Operate the enterprise capability represented by Corporate Development & M&A.'
  },
  {
    code: 'F05',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Product, Service & Innovation Management',
    purpose:
      'Operate the enterprise capability represented by Product, Service & Innovation Management.'
  },
  {
    code: 'F06',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Marketing & Brand',
    purpose: 'Operate the enterprise capability represented by Marketing & Brand.'
  },
  {
    code: 'F07',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Sales & Commercial Management',
    purpose: 'Operate the enterprise capability represented by Sales & Commercial Management.'
  },
  {
    code: 'F08',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Customer Service, Experience & Success',
    purpose:
      'Operate the enterprise capability represented by Customer Service, Experience & Success.'
  },
  {
    code: 'F09',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Procurement & Supplier Management',
    purpose: 'Operate the enterprise capability represented by Procurement & Supplier Management.'
  },
  {
    code: 'F10',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Demand, Supply Chain & Logistics',
    purpose: 'Operate the enterprise capability represented by Demand, Supply Chain & Logistics.'
  },
  {
    code: 'F11',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Manufacturing / Production Operations',
    purpose:
      'Operate the enterprise capability represented by Manufacturing / Production Operations.'
  },
  {
    code: 'F12',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Service Delivery & Field Operations',
    purpose: 'Operate the enterprise capability represented by Service Delivery & Field Operations.'
  },
  {
    code: 'F13',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Quality Management',
    purpose: 'Operate the enterprise capability represented by Quality Management.'
  },
  {
    code: 'F14',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Finance, Accounting, Treasury & Tax',
    purpose: 'Operate the enterprise capability represented by Finance, Accounting, Treasury & Tax.'
  },
  {
    code: 'F15',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Human Resources / Human Capital',
    purpose: 'Operate the enterprise capability represented by Human Resources / Human Capital.'
  },
  {
    code: 'F16',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Information Technology',
    purpose: 'Operate the enterprise capability represented by Information Technology.'
  },
  {
    code: 'F17',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Data, Analytics & AI',
    purpose: 'Operate the enterprise capability represented by Data, Analytics & AI.'
  },
  {
    code: 'F18',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Cybersecurity & Information Security',
    purpose:
      'Operate the enterprise capability represented by Cybersecurity & Information Security.'
  },
  {
    code: 'F19',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Legal & Corporate Secretariat',
    purpose: 'Operate the enterprise capability represented by Legal & Corporate Secretariat.'
  },
  {
    code: 'F20',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Risk, Compliance, Internal Control & Audit',
    purpose:
      'Operate the enterprise capability represented by Risk, Compliance, Internal Control & Audit.'
  },
  {
    code: 'F21',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Privacy & Information Governance',
    purpose: 'Operate the enterprise capability represented by Privacy & Information Governance.'
  },
  {
    code: 'F22',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Property, Facilities & Physical Assets',
    purpose:
      'Operate the enterprise capability represented by Property, Facilities & Physical Assets.'
  },
  {
    code: 'F23',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Health, Safety, Environment & Sustainability',
    purpose:
      'Operate the enterprise capability represented by Health, Safety, Environment & Sustainability.'
  },
  {
    code: 'F24',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Business Continuity, Crisis & Physical Security',
    purpose:
      'Operate the enterprise capability represented by Business Continuity, Crisis & Physical Security.'
  },
  {
    code: 'F25',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Communications, Public Affairs & Investor Relations',
    purpose:
      'Operate the enterprise capability represented by Communications, Public Affairs & Investor Relations.'
  },
  {
    code: 'F26',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Knowledge, Document & Records Management',
    purpose:
      'Operate the enterprise capability represented by Knowledge, Document & Records Management.'
  },
  {
    code: 'F27',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Portfolio, Programme & Project Management',
    purpose:
      'Operate the enterprise capability represented by Portfolio, Programme & Project Management.'
  },
  {
    code: 'F28',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Change & Transformation Management',
    purpose: 'Operate the enterprise capability represented by Change & Transformation Management.'
  },
  {
    code: 'F29',
    type: 'ENTERPRISE_FUNCTION',
    name: 'Business Process & Continuous Improvement',
    purpose:
      'Operate the enterprise capability represented by Business Process & Continuous Improvement.'
  }
] as FunctionalCatalogueEntry[];

export const deliveryDomainCatalogue: FunctionalCatalogueEntry[] = [
  {
    code: 'D01',
    type: 'DELIVERY_DOMAIN',
    name: 'Architecture & Design',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Architecture & Design.'
  },
  {
    code: 'D02',
    type: 'DELIVERY_DOMAIN',
    name: 'Building Services Trades',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Building Services Trades.'
  },
  {
    code: 'D03',
    type: 'DELIVERY_DOMAIN',
    name: 'Building Trades',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Building Trades.'
  },
  {
    code: 'D04',
    type: 'DELIVERY_DOMAIN',
    name: 'Commercial, Contracts & Cost',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Commercial, Contracts & Cost.'
  },
  {
    code: 'D05',
    type: 'DELIVERY_DOMAIN',
    name: 'Energy & Building Performance',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Energy & Building Performance.'
  },
  {
    code: 'D06',
    type: 'DELIVERY_DOMAIN',
    name: 'Engineering & Technical Design',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Engineering & Technical Design.'
  },
  {
    code: 'D07',
    type: 'DELIVERY_DOMAIN',
    name: 'Facilities, Property & Asset Operations',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Facilities, Property & Asset Operations.'
  },
  {
    code: 'D08',
    type: 'DELIVERY_DOMAIN',
    name: 'Geospatial, Planning & Transport',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Geospatial, Planning & Transport.'
  },
  {
    code: 'D09',
    type: 'DELIVERY_DOMAIN',
    name: 'Heritage, Conservation & Landscape',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Heritage, Conservation & Landscape.'
  },
  {
    code: 'D10',
    type: 'DELIVERY_DOMAIN',
    name: 'Infrastructure, Land & Rural',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Infrastructure, Land & Rural.'
  },
  {
    code: 'D11',
    type: 'DELIVERY_DOMAIN',
    name: 'Plant, Equipment & Specialist Operations',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Plant, Equipment & Specialist Operations.'
  },
  {
    code: 'D12',
    type: 'DELIVERY_DOMAIN',
    name: 'Regulation, Inspection & Compliance',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Regulation, Inspection & Compliance.'
  },
  {
    code: 'D13',
    type: 'DELIVERY_DOMAIN',
    name: 'Site Delivery & Construction Management',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Site Delivery & Construction Management.'
  },
  {
    code: 'D14',
    type: 'DELIVERY_DOMAIN',
    name: 'Supply Chain & Manufacturing',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Supply Chain & Manufacturing.'
  },
  {
    code: 'D15',
    type: 'DELIVERY_DOMAIN',
    name: 'Surveying, Property & Land',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Surveying, Property & Land.'
  },
  {
    code: 'D16',
    type: 'DELIVERY_DOMAIN',
    name: 'Utilities & Networks',
    purpose:
      'Govern, deliver and deploy the Construction & Built Environment capability domain Utilities & Networks.'
  }
] as FunctionalCatalogueEntry[];

export const constructionJobCatalogue: ConstructionJobCatalogueEntry[] = [
  {
    code: 'NCS-001',
    name: 'Acoustics consultant',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus:
      'Acoustic surveys; noise and vibration assessment; modelling; design recommendations; compliance evidence',
    candidateOutputs: 'Survey reports; models; recommendations; specifications',
    typicalLifecycleStage: 'Feasibility → Design → Verification',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-002',
    name: 'Agricultural contractor',
    sectorDomain: 'Infrastructure, Land & Rural',
    specialistCapabilityFocus:
      'Job planning; field operations; plant allocation; labour; materials; service records',
    candidateOutputs: 'Work orders; field logs; plant records; invoices',
    typicalLifecycleStage: 'Planning → Delivery → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-003',
    name: 'Architect',
    sectorDomain: 'Architecture & Design',
    specialistCapabilityFocus:
      'Briefing; design stages; drawings; specifications; coordination; planning; approvals; site reviews',
    candidateOutputs: 'Drawings; models; specifications; design decisions; inspection records',
    typicalLifecycleStage: 'Brief → Design → Construction → Handover',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-004',
    name: 'Architectural technician',
    sectorDomain: 'Architecture & Design',
    specialistCapabilityFocus:
      'Technical drawings; detailing; schedules; coordination; document production',
    candidateOutputs: 'Drawings; details; schedules; issue sheets',
    typicalLifecycleStage: 'Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-005',
    name: 'Architectural technologist',
    sectorDomain: 'Architecture & Design',
    specialistCapabilityFocus:
      'Technical design management; detailing; compliance; specifications; coordination',
    candidateOutputs: 'Technical designs; specifications; schedules; compliance records',
    typicalLifecycleStage: 'Design → Construction → Handover',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-006',
    name: 'Bricklayer',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Job planning; setting out; masonry works; materials; progress; quality checks',
    candidateOutputs: 'Work orders; material usage; photos; quality records',
    typicalLifecycleStage: 'Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-007',
    name: "Builders' merchant",
    sectorDomain: 'Supply Chain & Manufacturing',
    specialistCapabilityFocus:
      'Catalogue; stock; quotations; orders; trade accounts; deliveries; returns',
    candidateOutputs: 'Products; stock; quotes; sales orders; delivery notes; invoices',
    typicalLifecycleStage: 'Procurement → Supply',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-008',
    name: 'Building control officer',
    sectorDomain: 'Regulation, Inspection & Compliance',
    specialistCapabilityFocus:
      'Applications; plan assessment; inspections; evidence; defects; decisions',
    candidateOutputs: 'Applications; inspection records; notices; decisions; certificates',
    typicalLifecycleStage: 'Design → Construction → Completion',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-009',
    name: 'Building services engineer',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus:
      'MEP design; calculations; equipment schedules; coordination; commissioning requirements',
    candidateOutputs: 'Designs; calculations; specifications; equipment schedules',
    typicalLifecycleStage: 'Design → Construction → Commissioning',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-010',
    name: 'Building surveyor',
    sectorDomain: 'Surveying, Property & Land',
    specialistCapabilityFocus:
      'Condition surveys; defects; schedules; project advice; dilapidations; maintenance planning',
    candidateOutputs: 'Survey reports; defect schedules; photos; scopes; certificates',
    typicalLifecycleStage: 'Survey → Design → Construction → Operations',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-011',
    name: 'Building technician',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus:
      'Technical support; drawings; surveys; records; project coordination',
    candidateOutputs: 'Drawings; survey data; schedules; reports',
    typicalLifecycleStage: 'Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-012',
    name: 'Caretaker',
    sectorDomain: 'Facilities, Property & Asset Operations',
    specialistCapabilityFocus:
      'Inspections; reactive tasks; access; cleaning/maintenance coordination; incident reporting',
    candidateOutputs: 'Work orders; checks; logs; incident records',
    typicalLifecycleStage: 'Operations',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-013',
    name: 'Carpenter',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Job planning; setting out; fabrication; installation; materials; quality',
    candidateOutputs: 'Work orders; cut lists; material usage; photos',
    typicalLifecycleStage: 'Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-014',
    name: 'Carpet fitter and floor layer',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Site measure; product selection; preparation; installation; snagging',
    candidateOutputs: 'Measurements; material schedules; work orders; completion records',
    typicalLifecycleStage: 'Fit-out',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-015',
    name: 'Cartographer',
    sectorDomain: 'Geospatial, Planning & Transport',
    specialistCapabilityFocus: 'Spatial data management; map production; revisions; exports',
    candidateOutputs: 'Maps; datasets; layers; metadata',
    typicalLifecycleStage: 'Survey → Planning → Design',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-016',
    name: 'Cavity insulation installer',
    sectorDomain: 'Energy & Building Performance',
    specialistCapabilityFocus:
      'Survey; suitability checks; installation; materials; photos; completion evidence',
    candidateOutputs: 'Survey records; installation records; certificates; photos',
    typicalLifecycleStage: 'Retrofit → Completion',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-017',
    name: 'Ceiling fixer',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus: 'Take-off; layout; installation; materials; progress; snagging',
    candidateOutputs: 'Work orders; material usage; photos; defects',
    typicalLifecycleStage: 'Fit-out',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-018',
    name: 'Civil engineer',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus:
      'Civil design; calculations; specifications; coordination; site queries; inspections',
    candidateOutputs: 'Designs; calculations; specifications; RFIs; inspection records',
    typicalLifecycleStage: 'Feasibility → Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-019',
    name: 'Civil engineering technician',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus: 'CAD/BIM support; surveys; calculations; drawings; records',
    candidateOutputs: 'Drawings; models; survey data; schedules',
    typicalLifecycleStage: 'Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-020',
    name: 'Commercial energy assessor',
    sectorDomain: 'Energy & Building Performance',
    specialistCapabilityFocus:
      'Property data capture; energy assessment; evidence; certificate workflow',
    candidateOutputs: 'Assessment records; evidence; EPC-related outputs',
    typicalLifecycleStage: 'Survey → Assessment → Certification',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-021',
    name: 'Conservator',
    sectorDomain: 'Heritage, Conservation & Landscape',
    specialistCapabilityFocus:
      'Condition assessment; conservation plan; treatment records; provenance/evidence',
    candidateOutputs: 'Condition reports; treatment plans; photos; conservation records',
    typicalLifecycleStage: 'Survey → Conservation → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-022',
    name: 'Construction contracts manager',
    sectorDomain: 'Commercial, Contracts & Cost',
    specialistCapabilityFocus:
      'Contract register; obligations; notices; change; payment; claims; correspondence',
    candidateOutputs: 'Contracts; notices; instructions; variations; payment records',
    typicalLifecycleStage: 'Pre-contract → Construction → Closeout',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-023',
    name: 'Construction labourer',
    sectorDomain: 'Site Delivery & Construction Management',
    specialistCapabilityFocus:
      'Task allocation; attendance; inductions; daily work; equipment; safety records',
    candidateOutputs: 'Timesheets; task records; inductions; site diary entries',
    typicalLifecycleStage: 'Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-024',
    name: 'Construction manager',
    sectorDomain: 'Site Delivery & Construction Management',
    specialistCapabilityFocus:
      'Programme; packages; coordination; site diary; labour; plant; quality; safety; progress',
    candidateOutputs: 'Programme; diaries; RFIs; reports; inspections; progress records',
    typicalLifecycleStage: 'Pre-construction → Construction → Handover',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-025',
    name: 'Construction plant mechanic',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus: 'Asset register; servicing; defects; inspections; parts; breakdowns',
    candidateOutputs: 'Asset records; service history; defect reports; work orders',
    typicalLifecycleStage: 'Construction → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-026',
    name: 'Construction plant operator',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus:
      'Plant allocation; pre-use checks; hours; tasks; defects; competencies',
    candidateOutputs: 'Plant checks; utilisation; task logs; defect records',
    typicalLifecycleStage: 'Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-027',
    name: 'Construction site supervisor',
    sectorDomain: 'Site Delivery & Construction Management',
    specialistCapabilityFocus:
      'Daily supervision; labour; inspections; permits; quality; progress; safety',
    candidateOutputs: 'Site diary; inspections; permits; progress records',
    typicalLifecycleStage: 'Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-028',
    name: 'Crane driver',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus:
      'Lift allocation; pre-use checks; plant hours; competency; lift records; defects',
    candidateOutputs: 'Checks; lift logs; utilisation; defect records',
    typicalLifecycleStage: 'Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-029',
    name: 'Demolition operative',
    sectorDomain: 'Site Delivery & Construction Management',
    specialistCapabilityFocus:
      'Method/task planning; permits; hazardous materials records; waste; progress',
    candidateOutputs: 'RAMS references; permits; waste records; photos; task logs',
    typicalLifecycleStage: 'Enabling → Demolition',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-030',
    name: 'Domestic energy assessor',
    sectorDomain: 'Energy & Building Performance',
    specialistCapabilityFocus:
      'Dwelling data capture; energy assessment; evidence; certificate workflow',
    candidateOutputs: 'Assessment records; evidence; EPC-related outputs',
    typicalLifecycleStage: 'Survey → Assessment → Certification',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-031',
    name: 'Dryliner',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus: 'Take-off; layout; installation; materials; progress; defects',
    candidateOutputs: 'Work orders; material usage; photos; snagging',
    typicalLifecycleStage: 'Fit-out',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-032',
    name: 'Electrician',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Survey; estimate; schedule; installation; circuits; testing; defects; certification; maintenance',
    candidateOutputs: 'Quotes; job sheets; circuit/test records; certificates; invoices',
    typicalLifecycleStage: 'Design support → Installation → Testing → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-033',
    name: 'Engineering construction technician',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus:
      'Technical support; installation records; commissioning/decommissioning support; drawings',
    candidateOutputs: 'Drawings; technical records; test sheets; schedules',
    typicalLifecycleStage: 'Design → Installation → Commissioning',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-034',
    name: 'Estimator',
    sectorDomain: 'Commercial, Contracts & Cost',
    specialistCapabilityFocus:
      'Take-off; resource build-ups; supplier enquiries; estimates; tender submissions; revisions',
    candidateOutputs: 'Estimates; take-offs; RFQs; tender returns; bid documents',
    typicalLifecycleStage: 'Pre-contract',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-035',
    name: 'Facilities manager',
    sectorDomain: 'Facilities, Property & Asset Operations',
    specialistCapabilityFocus:
      'Property/asset register; PPM; reactive maintenance; compliance; contractors; SLAs; budgets',
    candidateOutputs: 'Assets; work orders; service records; inspections; compliance evidence',
    typicalLifecycleStage: 'Operations',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-036',
    name: 'Fence installer',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus: 'Survey; estimate; set-out; installation; materials; completion',
    candidateOutputs: 'Quotes; work orders; material usage; photos',
    typicalLifecycleStage: 'Construction / External works',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-037',
    name: 'Fire safety engineer',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus:
      'Fire strategy; modelling; design review; compliance evidence; inspections',
    candidateOutputs: 'Fire strategies; calculations; reports; design comments',
    typicalLifecycleStage: 'Design → Construction → Operations',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-038',
    name: 'Formworker',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Formwork planning; drawings; material/plant requirements; installation; striking; checks',
    candidateOutputs: 'Work orders; checklists; material records; photos',
    typicalLifecycleStage: 'Structural construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-039',
    name: 'Furniture maker',
    sectorDomain: 'Supply Chain & Manufacturing',
    specialistCapabilityFocus: 'Design; BOM; production; stock; quality; orders; delivery',
    candidateOutputs: 'Drawings; BOMs; work orders; QC records; sales orders',
    typicalLifecycleStage: 'Manufacture → Supply',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-040',
    name: 'Gas mains layer',
    sectorDomain: 'Utilities & Networks',
    specialistCapabilityFocus:
      'Work orders; excavation/laying records; materials; pressure/test records; reinstatement; asset location',
    candidateOutputs: 'Job packs; network records; test results; as-builts',
    typicalLifecycleStage: 'Infrastructure construction → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-041',
    name: 'Gas service technician',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Jobs; appliances; service schedules; tests; defects; parts; certification',
    candidateOutputs: 'Job sheets; appliance records; test results; service records',
    typicalLifecycleStage: 'Installation → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-042',
    name: 'General practice surveyor',
    sectorDomain: 'Surveying, Property & Land',
    specialistCapabilityFocus:
      'Property records; valuations; transactions; leases; development appraisal; client advice',
    candidateOutputs: 'Valuations; property records; instructions; reports',
    typicalLifecycleStage: 'Acquisition → Development → Operations',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-043',
    name: 'Geospatial technician',
    sectorDomain: 'Geospatial, Planning & Transport',
    specialistCapabilityFocus:
      'Data capture; GIS layers; coordinate/reference management; mapping; exports',
    candidateOutputs: 'Spatial datasets; maps; metadata',
    typicalLifecycleStage: 'Survey → Planning → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-044',
    name: 'Glazier',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus: 'Measure; quote; product/order; installation; repair; completion',
    candidateOutputs: 'Measurements; quotes; work orders; product records; photos',
    typicalLifecycleStage: 'Fit-out → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-045',
    name: 'Heat pump engineer',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Survey; sizing; estimate; installation; commissioning; servicing; evidence',
    candidateOutputs: 'Survey; calculations; job sheets; commissioning/test records',
    typicalLifecycleStage: 'Retrofit/Installation → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-046',
    name: 'Heating and ventilation engineer',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Survey; design support; installation; commissioning; service; defects',
    candidateOutputs: 'Job sheets; equipment records; test/commissioning sheets',
    typicalLifecycleStage: 'Installation → Commissioning → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-047',
    name: 'Heritage officer',
    sectorDomain: 'Heritage, Conservation & Landscape',
    specialistCapabilityFocus:
      'Heritage asset records; significance assessment; consultations; case management; condition monitoring',
    candidateOutputs: 'Case files; assessments; consultation records; reports',
    typicalLifecycleStage: 'Planning → Conservation → Operations',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-048',
    name: 'Kitchen and bathroom designer',
    sectorDomain: 'Architecture & Design',
    specialistCapabilityFocus:
      'Customer brief; survey; layouts; products; quotation; revisions; approvals',
    candidateOutputs: 'Layouts; product schedules; quotes; approvals',
    typicalLifecycleStage: 'Sales → Design → Fit-out',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-049',
    name: 'Kitchen and bathroom fitter',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Survey; schedule; installation tasks; materials; coordination; snagging',
    candidateOutputs: 'Work orders; material lists; photos; completion records',
    typicalLifecycleStage: 'Fit-out',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-050',
    name: 'Land surveyor',
    sectorDomain: 'Surveying, Property & Land',
    specialistCapabilityFocus:
      'Survey planning; observations; control; coordinates; topographical outputs; setting out',
    candidateOutputs: 'Survey files; point data; drawings; reports',
    typicalLifecycleStage: 'Survey → Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-051',
    name: 'Landscape architect',
    sectorDomain: 'Heritage, Conservation & Landscape',
    specialistCapabilityFocus:
      'Brief; site analysis; landscape design; specifications; planting; coordination; inspections',
    candidateOutputs: 'Plans; schedules; specifications; inspection records',
    typicalLifecycleStage: 'Planning → Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-052',
    name: 'Landscaper',
    sectorDomain: 'Heritage, Conservation & Landscape',
    specialistCapabilityFocus:
      'Quotes; site works; planting/materials; labour; maintenance schedule',
    candidateOutputs: 'Work orders; material schedules; photos; maintenance records',
    typicalLifecycleStage: 'External works → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-053',
    name: 'Lighting technician',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus:
      'Equipment planning; inventory; setup; inspections; operation; maintenance',
    candidateOutputs: 'Equipment lists; checklists; allocation records; faults',
    typicalLifecycleStage: 'Installation/Event delivery → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-054',
    name: 'Locksmith',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Callouts; asset/lock register; access hardware; installation; repair; key/control records',
    candidateOutputs: 'Jobs; asset records; key/access records; invoices',
    typicalLifecycleStage: 'Installation → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-055',
    name: 'Painter and decorator',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Estimate; area/take-off; materials; schedule; application; completion',
    candidateOutputs: 'Quotes; work orders; material usage; photos',
    typicalLifecycleStage: 'Finishes',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-056',
    name: 'Pipe fitter',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Isometrics/work packs; fabrication/installation; weld/test references; materials; QA',
    candidateOutputs: 'Work packs; spool/line records; test records; material traceability',
    typicalLifecycleStage: 'Installation → Testing',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-057',
    name: 'Planning and development surveyor',
    sectorDomain: 'Surveying, Property & Land',
    specialistCapabilityFocus:
      'Site appraisal; development appraisal; planning constraints; valuations; viability; client reports',
    candidateOutputs: 'Appraisals; reports; valuations; planning records',
    typicalLifecycleStage: 'Feasibility → Planning',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-058',
    name: 'Plasterer',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus: 'Estimate; areas; materials; schedule; application; snagging',
    candidateOutputs: 'Quotes; work orders; material usage; photos',
    typicalLifecycleStage: 'Finishes',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-059',
    name: 'Plumber',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Survey; quote; schedule; installation; fixtures; testing; callouts; maintenance',
    candidateOutputs: 'Quotes; job sheets; test records; asset/service records; invoices',
    typicalLifecycleStage: 'Installation → Testing → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-060',
    name: 'Quantity surveyor',
    sectorDomain: 'Commercial, Contracts & Cost',
    specialistCapabilityFocus:
      'Measurement; cost plans; procurement; tender analysis; valuations; variations; forecasts; final accounts',
    candidateOutputs: 'Cost plans; BoQs; tender analyses; valuations; variations; cost reports',
    typicalLifecycleStage: 'Feasibility → Design → Construction → Final account',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-061',
    name: 'Quarry engineer',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus:
      'Site/production planning; extraction records; plant; safety; environmental/restoration records',
    candidateOutputs: 'Plans; production records; inspections; environmental records',
    typicalLifecycleStage: 'Extraction → Restoration',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-062',
    name: 'Quarry worker',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus:
      'Tasks; plant checks; production logs; materials; safety; maintenance defects',
    candidateOutputs: 'Shift logs; plant checks; production records',
    typicalLifecycleStage: 'Extraction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-063',
    name: 'Refrigeration and air-conditioning installer',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Survey; equipment selection; installation; commissioning; refrigerant/service records; maintenance',
    candidateOutputs: 'Job sheets; equipment records; commissioning/test records; service logs',
    typicalLifecycleStage: 'Installation → Commissioning → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-064',
    name: 'Road worker',
    sectorDomain: 'Utilities & Networks',
    specialistCapabilityFocus:
      'Work packs; traffic-management references; plant; materials; daily progress; inspections',
    candidateOutputs: 'Work orders; daily records; material usage; inspection records',
    typicalLifecycleStage: 'Infrastructure construction → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-065',
    name: 'Roofer',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Survey; estimate; materials; access; installation/repair; inspections; photos',
    candidateOutputs: 'Quotes; work orders; material schedules; photos',
    typicalLifecycleStage: 'Envelope construction → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-066',
    name: 'Rural surveyor',
    sectorDomain: 'Surveying, Property & Land',
    specialistCapabilityFocus:
      'Land/property records; valuations; tenancy/estate work; land management; inspections',
    candidateOutputs: 'Valuations; plans; property records; reports',
    typicalLifecycleStage: 'Acquisition → Management',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-067',
    name: 'Scaffolder',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus:
      'Scaffold design/reference; erection; inspection; handover; tagging; alterations; dismantle',
    candidateOutputs: 'Scaffold register; inspection records; handover certificates',
    typicalLifecycleStage: 'Construction enabling works',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-068',
    name: 'Security systems installer',
    sectorDomain: 'Building Services Trades',
    specialistCapabilityFocus:
      'Survey; quote; device/system design; installation; testing; commissioning; maintenance',
    candidateOutputs: 'Quotes; device registers; test results; commissioning/service records',
    typicalLifecycleStage: 'Installation → Commissioning → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-069',
    name: 'Shopfitter',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Survey; programme; fabrication/install coordination; materials; snagging; handover',
    candidateOutputs: 'Work orders; drawings; material schedules; snagging records',
    typicalLifecycleStage: 'Fit-out',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-070',
    name: 'Solar panel installer',
    sectorDomain: 'Energy & Building Performance',
    specialistCapabilityFocus:
      'Survey; system sizing/design inputs; quote; installation; testing; commissioning; maintenance',
    candidateOutputs: 'Survey; quotes; equipment records; commissioning/test records',
    typicalLifecycleStage: 'Retrofit/Installation → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-071',
    name: 'Steel erector',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Work packs; lifts; sequence; members; bolts/connections; inspections; progress',
    candidateOutputs: 'Work packs; member records; inspection records; photos',
    typicalLifecycleStage: 'Structural construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-072',
    name: 'Steel fixer',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus:
      'Bar schedules/reference; work areas; installation; checks; progress',
    candidateOutputs: 'Work orders; reinforcement records; inspections; photos',
    typicalLifecycleStage: 'Structural construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-073',
    name: 'Steeplejack',
    sectorDomain: 'Plant, Equipment & Specialist Operations',
    specialistCapabilityFocus:
      'Access planning; inspection; repair; maintenance; lightning protection records; photos',
    candidateOutputs: 'Inspection reports; work orders; test records; photos',
    typicalLifecycleStage: 'Maintenance / Specialist works',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-074',
    name: 'Stonemason',
    sectorDomain: 'Heritage, Conservation & Landscape',
    specialistCapabilityFocus:
      'Survey/template; fabrication; installation; conservation repair; material traceability',
    candidateOutputs: 'Templates; work orders; material records; photos',
    typicalLifecycleStage: 'Construction → Conservation',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-075',
    name: 'Structural engineer',
    sectorDomain: 'Engineering & Technical Design',
    specialistCapabilityFocus:
      'Structural analysis; calculations; drawings; specifications; design changes; inspections',
    candidateOutputs: 'Calculations; models; drawings; specifications; inspection records',
    typicalLifecycleStage: 'Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-076',
    name: 'Surveying technician',
    sectorDomain: 'Surveying, Property & Land',
    specialistCapabilityFocus:
      'Survey support; site data; measurements; drawings; records; inspections',
    candidateOutputs: 'Survey data; drawings; schedules; reports',
    typicalLifecycleStage: 'Survey → Design → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-077',
    name: 'Thermal insulation engineer',
    sectorDomain: 'Energy & Building Performance',
    specialistCapabilityFocus:
      'Take-off; materials; installation; quality checks; completion evidence',
    candidateOutputs: 'Work orders; material usage; inspection records; photos',
    typicalLifecycleStage: 'Installation → Completion',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-078',
    name: 'Tiler',
    sectorDomain: 'Building Trades',
    specialistCapabilityFocus: 'Measure; estimate; layout; materials; installation; snagging',
    candidateOutputs: 'Quotes; work orders; material usage; photos',
    typicalLifecycleStage: 'Finishes',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-079',
    name: 'Town planner',
    sectorDomain: 'Geospatial, Planning & Transport',
    specialistCapabilityFocus:
      'Planning cases; policy/constraints; consultations; site appraisal; reports; decisions tracking',
    candidateOutputs: 'Applications/cases; consultation records; reports; spatial data',
    typicalLifecycleStage: 'Feasibility → Planning',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-080',
    name: 'Town planning assistant',
    sectorDomain: 'Geospatial, Planning & Transport',
    specialistCapabilityFocus:
      'Application processing; data gathering; plans; consultations; case administration',
    candidateOutputs: 'Case records; plans; consultation records',
    typicalLifecycleStage: 'Planning',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-081',
    name: 'Transport planner',
    sectorDomain: 'Geospatial, Planning & Transport',
    specialistCapabilityFocus:
      'Demand/network analysis; options; modelling; consultation; reports; programme interfaces',
    candidateOutputs: 'Models; datasets; option reports; plans',
    typicalLifecycleStage: 'Feasibility → Planning → Design',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-082',
    name: 'Water network operative',
    sectorDomain: 'Utilities & Networks',
    specialistCapabilityFocus:
      'Work orders; network asset location; repairs; leakage; tests; reinstatement; as-builts',
    candidateOutputs: 'Job packs; network records; test results; as-builts',
    typicalLifecycleStage: 'Infrastructure construction → Maintenance',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-083',
    name: 'Welder',
    sectorDomain: 'Supply Chain & Manufacturing',
    specialistCapabilityFocus:
      'Work packs; weld procedures/references; material traceability; weld logs; inspections; repairs',
    candidateOutputs: 'Weld logs; material records; inspection/NDT references; work orders',
    typicalLifecycleStage: 'Fabrication → Construction',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  },
  {
    code: 'NCS-084',
    name: 'Wood machinist',
    sectorDomain: 'Supply Chain & Manufacturing',
    specialistCapabilityFocus:
      'Cut lists; machine jobs; BOM/material stock; quality; production output',
    candidateOutputs: 'Cut lists; work orders; material records; QC records',
    typicalLifecycleStage: 'Manufacture',
    sourceReference:
      'https://nationalcareers.service.gov.uk/explore-careers/job-sector/construction-and-the-built-environment/view-all-sector-careers'
  }
] as ConstructionJobCatalogueEntry[];

export const functionalCatalogue = [...enterpriseFunctionalCatalogue, ...deliveryDomainCatalogue];

export const functionalCatalogueCounts = {
  enterpriseFunctions: enterpriseFunctionalCatalogue.length,
  deliveryDomains: deliveryDomainCatalogue.length,
  constructionJobs: constructionJobCatalogue.length
} as const;
