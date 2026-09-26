export const marketingNav = [
  { href: '/product', label: 'Product' },
  { href: '/functions', label: 'Functions' },
  { href: '/industries', label: 'Industries' },
  { href: '/construction-built-environment', label: 'Construction & Built Environment' },
  { href: '/security', label: 'Trust' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/resources', label: 'Resources' }
] as const;

export const coreFunctions = [
  ['F01', 'Strategy & Enterprise Planning'],
  ['F02', 'Corporate Governance'],
  ['F03', 'Enterprise Performance Management'],
  ['F04', 'Corporate Development & M&A'],
  ['F05', 'Product, Service & Innovation Management'],
  ['F06', 'Marketing & Brand'],
  ['F07', 'Sales & Commercial Management'],
  ['F08', 'Customer Service, Experience & Success'],
  ['F09', 'Procurement & Supplier Management'],
  ['F10', 'Demand, Supply Chain & Logistics'],
  ['F11', 'Manufacturing / Production Operations'],
  ['F12', 'Service Delivery & Field Operations'],
  ['F13', 'Quality Management'],
  ['F14', 'Finance, Accounting, Treasury & Tax'],
  ['F15', 'Human Resources / Human Capital'],
  ['F16', 'Information Technology'],
  ['F17', 'Data, Analytics & AI'],
  ['F18', 'Cybersecurity & Information Security'],
  ['F19', 'Legal & Corporate Secretariat'],
  ['F20', 'Risk, Compliance, Internal Control & Audit'],
  ['F21', 'Privacy & Information Governance'],
  ['F22', 'Property, Facilities & Physical Assets'],
  ['F23', 'Health, Safety, Environment & Sustainability'],
  ['F24', 'Business Continuity, Crisis & Physical Security'],
  ['F25', 'Communications, Public Affairs & Investor Relations'],
  ['F26', 'Knowledge, Document & Records Management'],
  ['F27', 'Portfolio, Programme & Project Management'],
  ['F28', 'Change & Transformation Management'],
  ['F29', 'Business Process & Continuous Improvement']
] as const;

export const cbeFunctions = [
  ['D01', 'Architecture & Design', 'Architectural and interior/fit-out design workflows.'],
  ['D02', 'Engineering & Technical Design', 'Civil, structural, building-services and specialist technical engineering.'],
  ['D03', 'Surveying, Property & Land', 'Building, land, valuation, development and rural surveying.'],
  ['D04', 'Commercial, Contracts & Cost', 'Estimating, quantity surveying and contract/commercial management.'],
  ['D05', 'Geospatial, Planning & Transport', 'Planning, mapping, GIS and transport planning.'],
  ['D06', 'Site Delivery & Construction Management', 'Site management, supervision, labour and demolition delivery.'],
  ['D07', 'Building Trades', 'Trade work, work orders, materials, installation and snagging.'],
  ['D08', 'Building Services Trades', 'MEP/service trades, jobs, equipment, testing and maintenance.'],
  ['D09', 'Energy & Building Performance', 'Energy assessment, retrofit, renewables and insulation.'],
  ['D10', 'Facilities, Property & Asset Operations', 'Operational property, assets, planned/reactive maintenance and compliance.'],
  ['D11', 'Plant, Equipment & Specialist Operations', 'Plant, lifting, access, specialist equipment and extraction operations.'],
  ['D12', 'Utilities & Networks', 'Roads, gas and water network field operations.'],
  ['D13', 'Heritage, Conservation & Landscape', 'Heritage, conservation, landscape and specialist craft conservation.'],
  ['D14', 'Supply Chain & Manufacturing', 'Merchants, fabrication/manufacturing, stock and product fulfilment.'],
  ['D15', 'Regulation, Inspection & Compliance', 'Regulatory assessment, inspection, decision and certification workflows.'],
  ['D16', 'Infrastructure, Land & Rural', 'Rural contracting, land operations, mobile resources and field service delivery.']
] as const;

export const platformPillars = [
  {
    title: 'One enterprise object graph',
    body: 'People, organisations, Functions, work, deliverables, projects, assets, customers, suppliers, decisions and evidence remain connected rather than being split between disconnected applications.'
  },
  {
    title: 'Metadata-driven by design',
    body: 'NuBlox models Things, fields, values, relationships, lifecycle and validation as governed metadata so the product can evolve without fragmenting its core model.'
  },
  {
    title: 'Functional governance and delivery',
    body: 'Every Function supports how the organisation governs itself and how it performs the work required to deliver outcomes.'
  },
  {
    title: 'Position-led working world',
    body: 'A Person’s occupied Position determines their primary Function, authority, work context and management hierarchy while preserving cross-functional collaboration.'
  },
  {
    title: 'Work products are first-class',
    body: 'The platform governs the actual outputs of work — documents, drawings, surveys, cost plans, specifications, approvals, records and other deliverables — through their lifecycle.'
  },
  {
    title: 'Evidence is part of execution',
    body: 'Audit, decisions, approvals, events and provisioning evidence are designed into the transactional model rather than added as an afterthought.'
  }
] as const;

export const proofPoints = [
  ['29', 'Core Business Functions'],
  ['353', 'governed L2 sub-functions'],
  ['1,510', 'mapped business activities'],
  ['16', 'Construction & Built Environment Functions'],
  ['84', 'governed CBE Job Profiles']
] as const;

export const resourceCards = [
  {
    title: 'Enterprise product architecture',
    body: 'How NuBlox composes Functions, native tools, work delivery, information and governance into one ERP operating model.',
    href: '/product/platform'
  },
  {
    title: 'Core Function catalogue',
    body: 'Explore the canonical F01–F29 enterprise Function model used across every Tenant.',
    href: '/functions'
  },
  {
    title: 'Construction & Built Environment',
    body: 'See how D01–D16 extend the same universal Function model for real industry jobs and work products.',
    href: '/construction-built-environment'
  },
  {
    title: 'Trust and control',
    body: 'Understand NuBlox identity, access, tenant isolation, audit, evidence and controlled configuration principles.',
    href: '/security'
  }
] as const;
