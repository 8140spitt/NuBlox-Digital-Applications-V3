export type EnterpriseFunction = {
  id: string;
  name: string;
  shortName: string;
  state: 'active' | 'planned';
};

export const enterpriseFunctions: readonly EnterpriseFunction[] = [
  {
    id: 'F01',
    name: 'Strategy & Enterprise Planning',
    shortName: 'Strategy & planning',
    state: 'active'
  },
  { id: 'F02', name: 'Corporate Governance', shortName: 'Corporate governance', state: 'active' },
  {
    id: 'F03',
    name: 'Enterprise Performance Management',
    shortName: 'Enterprise performance',
    state: 'active'
  },
  {
    id: 'F04',
    name: 'Corporate Development & M&A',
    shortName: 'Corporate development',
    state: 'active'
  },
  {
    id: 'F05',
    name: 'Product, Service & Innovation Management',
    shortName: 'Product & innovation',
    state: 'active'
  },
  { id: 'F06', name: 'Marketing & Brand', shortName: 'Marketing & brand', state: 'planned' },
  {
    id: 'F07',
    name: 'Sales & Commercial Management',
    shortName: 'Sales & commercial',
    state: 'planned'
  },
  {
    id: 'F08',
    name: 'Customer Service, Experience & Success',
    shortName: 'Customer service',
    state: 'planned'
  },
  {
    id: 'F09',
    name: 'Procurement & Supplier Management',
    shortName: 'Procurement & suppliers',
    state: 'planned'
  },
  {
    id: 'F10',
    name: 'Demand, Supply Chain & Logistics',
    shortName: 'Supply chain & logistics',
    state: 'planned'
  },
  {
    id: 'F11',
    name: 'Manufacturing / Production Operations',
    shortName: 'Production operations',
    state: 'planned'
  },
  {
    id: 'F12',
    name: 'Service Delivery & Field Operations',
    shortName: 'Service & field operations',
    state: 'planned'
  },
  { id: 'F13', name: 'Quality Management', shortName: 'Quality management', state: 'planned' },
  {
    id: 'F14',
    name: 'Finance, Accounting, Treasury & Tax',
    shortName: 'Finance',
    state: 'planned'
  },
  {
    id: 'F15',
    name: 'Human Resources / Human Capital',
    shortName: 'People & workforce',
    state: 'planned'
  },
  {
    id: 'F16',
    name: 'Information Technology',
    shortName: 'Information technology',
    state: 'planned'
  },
  { id: 'F17', name: 'Data, Analytics & AI', shortName: 'Data, analytics & AI', state: 'planned' },
  {
    id: 'F18',
    name: 'Cybersecurity & Information Security',
    shortName: 'Cybersecurity',
    state: 'planned'
  },
  {
    id: 'F19',
    name: 'Legal & Corporate Secretariat',
    shortName: 'Legal & secretariat',
    state: 'planned'
  },
  {
    id: 'F20',
    name: 'Risk, Compliance, Internal Control & Audit',
    shortName: 'Risk, control & audit',
    state: 'planned'
  },
  {
    id: 'F21',
    name: 'Privacy & Information Governance',
    shortName: 'Privacy & information governance',
    state: 'planned'
  },
  {
    id: 'F22',
    name: 'Property, Facilities & Physical Assets',
    shortName: 'Property & assets',
    state: 'planned'
  },
  {
    id: 'F23',
    name: 'Health, Safety, Environment & Sustainability',
    shortName: 'HSE & sustainability',
    state: 'planned'
  },
  {
    id: 'F24',
    name: 'Business Continuity, Crisis & Physical Security',
    shortName: 'Continuity & security',
    state: 'planned'
  },
  {
    id: 'F25',
    name: 'Communications, Public Affairs & Investor Relations',
    shortName: 'Communications & affairs',
    state: 'planned'
  },
  {
    id: 'F26',
    name: 'Knowledge, Document & Records Management',
    shortName: 'Knowledge & documents',
    state: 'planned'
  },
  {
    id: 'F27',
    name: 'Portfolio, Programme & Project Management',
    shortName: 'Projects & programmes',
    state: 'planned'
  },
  {
    id: 'F28',
    name: 'Change & Transformation Management',
    shortName: 'Change & transformation',
    state: 'planned'
  },
  {
    id: 'F29',
    name: 'Business Process & Continuous Improvement',
    shortName: 'Process & improvement',
    state: 'planned'
  }
] as const;
