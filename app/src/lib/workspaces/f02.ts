import type { WorkArea } from './f01';

export const f02Workspace = {
  id: 'F02',
  name: 'Corporate Governance',
  purpose:
    'Govern authority, boards, committees, enterprise decisions, policy and ethical conduct through attributable and auditable controls.',
  objects: [
    'Governance body',
    'Governance meeting',
    'Authority framework',
    'Delegated authority',
    'Policy',
    'Decision',
    'Governance action',
    'Integrity case'
  ],
  areas: [
    {
      id: 'F02.01',
      name: 'Board Governance',
      sourceName: 'Board governance',
      summary: 'Constitute boards and govern their mandate, membership, meetings, resolutions and actions.',
      items: ['Board structure', 'Membership', 'Quorum', 'Meetings', 'Resolutions', 'Actions'],
      path: 'governance-bodies'
    },
    {
      id: 'F02.02',
      name: 'Governance Framework',
      sourceName: 'Governance framework',
      summary: 'Define decision-right and authority structures that govern enterprise action.',
      items: ['Framework', 'Authority classes', 'Decision rights', 'Reserved matters', 'SoD', 'Effectivity'],
      path: 'authority-framework'
    },
    {
      id: 'F02.03',
      name: 'Delegation of Authority',
      sourceName: 'Delegation of authority',
      summary: 'Apply governed approval thresholds and effective delegated authority.',
      items: ['Thresholds', 'Grants', 'Delegation matrix', 'Effectivity', 'Compliance', 'Policy evidence'],
      path: 'delegation-of-authority'
    },
    {
      id: 'F02.04',
      name: 'Executive Management',
      sourceName: 'Executive management',
      summary: 'Conduct executive governance, resolve escalations and record enterprise decisions.',
      items: ['Executive reviews', 'Decisions', 'Escalations', 'Investments', 'Actions', 'Evidence'],
      path: 'executive-management'
    },
    {
      id: 'F02.05',
      name: 'Committee Governance',
      sourceName: 'Committee governance',
      summary: 'Constitute committees with governed terms, membership, meetings and follow-up.',
      items: ['Committee structure', 'Terms of reference', 'Membership', 'Meetings', 'Decisions', 'Actions'],
      path: 'governance-bodies'
    },
    {
      id: 'F02.06',
      name: 'Policy Governance',
      sourceName: 'Policy governance',
      summary: 'Control policy drafting, approval, publication, effectivity and adherence.',
      items: ['Drafting', 'Review', 'Approval', 'Publication', 'Effectivity', 'Adherence'],
      path: 'policies'
    },
    {
      id: 'F02.07',
      name: 'Ethics Governance',
      sourceName: 'Ethics governance',
      summary: 'Govern conduct expectations, declarations, ethical issues and breach investigations.',
      items: ['Code of conduct', 'Declarations', 'Conflicts', 'Issues', 'Investigations', 'Evidence']
    }
  ] satisfies WorkArea[],
  journey: [
    { step: '1', name: 'Constitute', detail: 'Define governance bodies, mandates and authority context.' },
    { step: '2', name: 'Delegate', detail: 'Define authority rules and effective grants.' },
    { step: '3', name: 'Convene', detail: 'Run board, committee and executive governance events.' },
    { step: '4', name: 'Decide', detail: 'Record attributable decisions against exact subjects and authority evidence.' },
    { step: '5', name: 'Act', detail: 'Create and track accountable follow-up work.' },
    { step: '6', name: 'Assure', detail: 'Monitor policy, authority, conduct and governance evidence.' }
  ],
  platformServices: [
    ['Party & membership', 'Governance participants reference canonical Party identities.'],
    ['Authority', 'Permissions, frameworks and delegated authority remain distinct from membership.'],
    ['Decision', 'Material governance choices use immutable shared Decision evidence.'],
    ['Workflow & work', 'Meeting follow-up and governance actions use shared work coordination.'],
    ['Evidence', 'Packs, minutes and supporting records retain governed provenance.'],
    ['Audit & events', 'All lifecycle and membership changes are tenant-scoped and attributable.']
  ],
  integration: [
    ['Legal & secretariat', 'Corporate records, statutory governance and entity obligations.'],
    ['Risk & compliance', 'Controls, compliance obligations, assurance and integrity cases.'],
    ['Finance', 'Investment and reserved-matter approvals with monetary authority evidence.'],
    ['Strategy', 'Strategic review, operating model, plans and enterprise decisions.']
  ]
} as const;
