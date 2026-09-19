import type { WorkArea } from './f01';

export const f06Workspace = {
  id: 'F06',
  name: 'Marketing & Brand',
  purpose:
    'Turn attributable market intelligence into governed segments, brand/marketing plans, approved multi-channel campaigns, privacy-aware engagement, qualified Leads and reproducible performance evidence.',
  objects: [
    'Market insight',
    'Market segment',
    'Communications plan',
    'Communications campaign',
    'Communication item',
    'Controlled content revision',
    'Lead',
    'Consent / preference evidence',
    'Event registration',
    'Marketing analytics snapshot'
  ],
  areas: [
    {
      id: 'F06.01',
      name: 'Market Intelligence',
      sourceName: 'Market Intelligence',
      summary:
        'Capture research, competitor observations and trend evidence with source, confidence and as-of context.',
      items: ['Research', 'Segments', 'Competitors', 'Trends'],
      path: 'intelligence-segmentation?mode=intelligence'
    },
    {
      id: 'F06.02',
      name: 'Customer Segmentation',
      sourceName: 'Customer Segmentation',
      summary:
        'Define effective-dated segment criteria and evaluate Party, relationship or Lead membership without copying customer identity.',
      items: ['Definitions', 'Profiles', 'Value', 'Membership'],
      path: 'intelligence-segmentation?mode=segmentation'
    },
    {
      id: 'F06.03',
      name: 'Brand Management',
      sourceName: 'Brand Management',
      summary:
        'Govern brand promise, positioning, guidelines and issued brand assets through versioned Communications Plans.',
      items: ['Brand definition', 'Guidelines', 'Assets', 'Perception'],
      path: 'brand-strategy?mode=brand'
    },
    {
      id: 'F06.04',
      name: 'Marketing Strategy',
      sourceName: 'Marketing Strategy',
      summary:
        'Control objectives, selected markets, positioning, channel strategy and measures with exact approval Decisions.',
      items: ['Objectives', 'Markets', 'Positioning', 'Channels'],
      path: 'brand-strategy?mode=strategy'
    },
    {
      id: 'F06.05',
      name: 'Campaign Management',
      sourceName: 'Campaign Management',
      summary:
        'Plan, approve, activate, monitor and optimise campaigns against pinned audience and content versions.',
      items: ['Plan', 'Content', 'Approval', 'Execution', 'Monitor', 'Optimise'],
      path: 'campaigns?mode=campaign'
    },
    {
      id: 'F06.06',
      name: 'Digital Marketing',
      sourceName: 'Digital Marketing',
      summary:
        'Coordinate website, SEO, paid, social, email and automation channels as campaign execution patterns.',
      items: ['Web', 'SEO', 'Paid', 'Social', 'Email', 'Automation'],
      path: 'campaigns?mode=digital'
    },
    {
      id: 'F06.07',
      name: 'Content Marketing',
      sourceName: 'Content Marketing',
      summary:
        'Bind campaign execution to exact issued Information revisions so approval and publication history remain controlled.',
      items: ['Strategy', 'Assets', 'Approval', 'Publication', 'Library'],
      path: 'campaigns?mode=content'
    },
    {
      id: 'F06.08',
      name: 'Events',
      sourceName: 'Events',
      summary:
        'Use EVENT Campaigns to govern schedules, registrations, supplier references, attendance and outcome evidence.',
      items: ['Plan', 'Registrations', 'Suppliers', 'Delivery', 'Outcomes'],
      path: 'events'
    },
    {
      id: 'F06.09',
      name: 'Lead Generation',
      sourceName: 'Lead Generation',
      summary:
        'Capture unresolved demand signals, enrich and score them, nurture lawfully, qualify them and transfer exact Lead versions to Sales.',
      items: ['Capture', 'Enrich', 'Score', 'Nurture', 'Sales handoff'],
      path: 'leads'
    },
    {
      id: 'F06.10',
      name: 'Marketing Analytics',
      sourceName: 'Marketing Analytics',
      summary:
        'Measure reach, attribution, conversion, acquisition cost, ROI and campaign performance through frozen reproducible snapshots.',
      items: ['Reach', 'Attribution', 'Conversion', 'CAC', 'ROI', 'Performance'],
      path: 'analytics'
    },
    {
      id: 'F06.11',
      name: 'Market Communications',
      sourceName: 'Market Communications',
      summary:
        'Coordinate collateral, advertising and market messaging through controlled campaign content and communication items.',
      items: ['Collateral', 'Advertising', 'Coordination', 'Messaging'],
      path: 'campaigns?mode=communications'
    }
  ] satisfies WorkArea[],
  journey: [
    {
      step: '1',
      name: 'Understand',
      detail: 'Capture attributable market intelligence and evidence.'
    },
    { step: '2', name: 'Segment', detail: 'Define and activate exact audience classifications.' },
    {
      step: '3',
      name: 'Position',
      detail: 'Set brand promise, positioning and market/channel strategy.'
    },
    {
      step: '4',
      name: 'Plan',
      detail: 'Create campaigns with pinned segment and controlled content versions.'
    },
    {
      step: '5',
      name: 'Approve',
      detail: 'Bind plan and campaign approvals to immutable exact-version Decisions.'
    },
    {
      step: '6',
      name: 'Engage',
      detail: 'Deliver communication only after privacy eligibility is evaluated.'
    },
    { step: '7', name: 'Qualify', detail: 'Score and transfer qualified Lead evidence to Sales.' },
    {
      step: '8',
      name: 'Measure',
      detail: 'Freeze reproducible performance, attribution, CAC and ROI snapshots.'
    }
  ],
  platformServices: [
    [
      'Party & relationship',
      'Audience membership overlays canonical identity instead of creating a marketing contact master.'
    ],
    [
      'Controlled information',
      'Campaign content and brand assets reference exact issued Information revisions.'
    ],
    ['Decision', 'Plan and campaign approvals bind immutable Decisions to exact versions.'],
    [
      'Privacy evidence',
      'Consent and communication preferences are immutable events evaluated at execution time.'
    ],
    [
      'Lead',
      'Early demand remains a distinct commercial signal until Sales accepts a governed handoff.'
    ],
    [
      'Evidence & events',
      'Delivery, engagement and measurement evidence remains attributable and auditable.'
    ]
  ],
  integration: [
    ['F01 Strategy', 'Marketing plans may pin strategic context without copying strategy truth.'],
    [
      'F05 Product & innovation',
      'Validated market insights are shared across product discovery and marketing.'
    ],
    ['F07 Sales', 'Qualified Leads hand off exact versions for Opportunity creation/acceptance.'],
    [
      'F21 Legal & privacy',
      'Consent/preferences remain Privacy authority evidence rather than campaign flags.'
    ],
    [
      'F25 Knowledge & communications',
      'Communications Plan/Campaign semantics are shared enterprise capabilities.'
    ],
    [
      'Finance',
      'Campaign spend/attribution may reference finance evidence without becoming Ledger truth.'
    ]
  ]
} as const;
