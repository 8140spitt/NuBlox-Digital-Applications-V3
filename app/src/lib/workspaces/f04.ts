import type { WorkArea } from './f01';

export const f04Workspace = {
  id: 'F04',
  name: 'Corporate Development & M&A',
  purpose:
    'Identify, evaluate, approve, execute and integrate acquisitions, mergers, divestitures and strategic partnerships through governed deal evidence and canonical enterprise objects.',
  objects: [
    'Development opportunity',
    'Development appraisal',
    'Legal matter',
    'Business case',
    'Decision',
    'Agreement reference',
    'Transformation initiative'
  ],
  areas: [
    {
      id: 'F04.01',
      name: 'Opportunity Identification',
      sourceName: 'Opportunity Identification',
      summary:
        'Identify, screen and evaluate acquisition, merger, divestment and partnership opportunities without creating CRM duplicates.',
      items: [
        'Pipeline',
        'Target',
        'Screening',
        'Strategic fit',
        'Thesis',
        'Investment-decision readiness'
      ],
      path: 'opportunity-identification'
    },
    {
      id: 'F04.02',
      name: 'Valuation',
      sourceName: 'Valuation',
      summary:
        'Create reproducible appraisal snapshots from governed financial, synergy and scenario assumptions.',
      items: [
        'Financial model',
        'Synergies',
        'Valuation',
        'Scenarios',
        'Sensitivity',
        'Approved snapshot'
      ],
      path: 'valuation'
    },
    {
      id: 'F04.03',
      name: 'Due Diligence',
      sourceName: 'Due Diligence',
      summary:
        'Run restricted cross-functional diligence through a need-to-know Legal Matter with seven governed workstreams.',
      items: ['Finance', 'Operations', 'Technology', 'People', 'Legal', 'Tax', 'Commercial & risk'],
      path: 'due-diligence'
    },
    {
      id: 'F04.04',
      name: 'Transaction Management',
      sourceName: 'Transaction Management',
      summary:
        'Structure, negotiate, approve and complete a transaction through the governed Business Case boundary.',
      items: ['Structure', 'Negotiation', 'Approval', 'Agreements', 'Completion'],
      path: 'business-cases?type=TRANSACTION'
    },
    {
      id: 'F04.05',
      name: 'Integration',
      sourceName: 'Integration',
      summary:
        'Mobilise post-transaction integration as a Transformation Initiative over organisation, systems and policy.',
      items: ['Integration plan', 'Organisation', 'Systems', 'Policy', 'Readiness', 'Adoption'],
      path: 'integration'
    },
    {
      id: 'F04.06',
      name: 'Divestiture',
      sourceName: 'Divestiture',
      summary:
        'Govern separation perimeter, carve-out, asset transfer, system separation and disposal through the shared Business Case.',
      items: ['Perimeter', 'Carve-out', 'Assets', 'Systems', 'Disposal'],
      path: 'business-cases?type=DIVESTITURE'
    },
    {
      id: 'F04.07',
      name: 'Strategic Partnerships',
      sourceName: 'Strategic Partnerships',
      summary:
        'Assess, negotiate, govern and monitor strategic alliances through the shared Business Case.',
      items: ['Partner search', 'Fit', 'Alliance terms', 'Governance', 'Monitoring'],
      path: 'business-cases?type=STRATEGIC_PARTNERSHIP'
    }
  ] satisfies WorkArea[],
  journey: [
    { step: '1', name: 'Identify', detail: 'Capture a stable Corporate Development Opportunity.' },
    { step: '2', name: 'Evaluate', detail: 'Screen strategic fit and freeze appraisal scenarios.' },
    { step: '3', name: 'Diligence', detail: 'Complete restricted cross-functional due diligence.' },
    {
      step: '4',
      name: 'Decide',
      detail: 'Apply immutable approval Decisions to the exact Business Case version.'
    },
    {
      step: '5',
      name: 'Execute',
      detail: 'Record transaction agreements, separation or partnership arrangements.'
    },
    {
      step: '6',
      name: 'Integrate',
      detail: 'Coordinate target-state transformation without creating duplicate project masters.'
    }
  ],
  platformServices: [
    ['Party', 'Targets, sponsors, counsel and counterparties reference canonical Party identity.'],
    [
      'Decision',
      'Material Corporate Development approvals use immutable shared Decision evidence.'
    ],
    ['Legal Matter', 'Due Diligence is restricted by matter-level need-to-know access.'],
    [
      'Evidence & information',
      'Models, reports and agreements retain governed source and revision references.'
    ],
    [
      'Transformation',
      'Post-deal integration reuses the enterprise Transformation Initiative boundary.'
    ],
    [
      'Audit & events',
      'Lifecycle changes remain attributable, tenant-scoped and replayable without leaking sensitive diligence narrative.'
    ]
  ],
  integration: [
    [
      'Strategy',
      'Strategic objectives and operating-model direction inform fit and transaction rationale.'
    ],
    [
      'Finance',
      'Ledger, funding and financial-source truth feed appraisal without becoming appraisal data.'
    ],
    [
      'Legal',
      'Due Diligence and transaction execution reuse Legal Matter and controlled agreement evidence.'
    ],
    [
      'Risk',
      'Diligence findings hand off to risk/control where persistent enterprise exposure exists.'
    ],
    [
      'Organisation',
      'Integration changes reference canonical Organisation Units and authority structures.'
    ]
  ]
} as const;
