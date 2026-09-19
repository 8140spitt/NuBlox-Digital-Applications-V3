import type { WorkArea } from './f01';

export const f05Workspace = {
  id: 'F05',
  name: 'Product, Service & Innovation Management',
  purpose:
    'Translate governed market needs into selected concepts, approved investment, controlled product/service definitions, launched offerings and traceable lifecycle decisions without duplicating Item, engineering, finance or workflow authority.',
  objects: [
    'Market insight',
    'Item / offering',
    'Product / service concept',
    'Business case',
    'Product configuration model',
    'Requirement trace',
    'Trial / experiment',
    'Launch profile',
    'Lifecycle review',
    'Retirement plan'
  ],
  areas: [
    {
      id: 'F05.01',
      name: 'Portfolio Strategy',
      sourceName: 'Portfolio Strategy',
      summary:
        'Shape and prioritise the offering portfolio through governed Product / Service Business Cases rather than a detached portfolio spreadsheet.',
      items: ['Portfolio buckets', 'Classification', 'Performance', 'Gaps', 'Investment priority'],
      path: 'business-cases?domain=PRODUCT_SERVICE&mode=portfolio'
    },
    {
      id: 'F05.02',
      name: 'Market / Customer Needs',
      sourceName: 'Market / Customer Needs',
      summary:
        'Capture attributable market research and customer needs with provenance, as-of context and validated problem statements.',
      items: ['Research', 'Customer problems', 'Needs', 'Desired outcomes', 'Evidence'],
      path: 'market-needs'
    },
    {
      id: 'F05.03',
      name: 'Product / Service Ideation',
      sourceName: 'Product / Service Ideation',
      summary:
        'Capture and assess concepts as draft canonical Items, then select them only through an immutable Decision.',
      items: ['Ideas', 'Opportunity', 'Feasibility', 'Scoring', 'Concept selection'],
      path: 'ideation'
    },
    {
      id: 'F05.04',
      name: 'Business Case Development',
      sourceName: 'Business Case Development',
      summary:
        'Develop demand, cost, benefit, risk and ROI evidence against the shared Business Case boundary and exact source versions.',
      items: ['Demand', 'Costs', 'ROI', 'Risk', 'Investment approval'],
      path: 'business-cases?domain=PRODUCT_SERVICE&mode=investment'
    },
    {
      id: 'F05.05',
      name: 'Product / Service Design',
      sourceName: 'Product / Service Design',
      summary:
        'Define controlled offering configurations with characteristics, rules, requirements, specifications and prototype evidence.',
      items: ['Requirements', 'Design', 'Specifications', 'Characteristics', 'Prototype'],
      path: 'configuration?mode=design'
    },
    {
      id: 'F05.06',
      name: 'Development',
      sourceName: 'Development',
      summary:
        'Develop and validate the current configuration version through traceable trials and requirement satisfaction.',
      items: ['Build', 'Configure', 'Trials', 'Validation', 'Release'],
      path: 'configuration?mode=development'
    },
    {
      id: 'F05.07',
      name: 'Launch Management',
      sourceName: 'Launch Management',
      summary:
        'Launch only when concept selection, investment approval, released configuration and operational readiness are all evidenced.',
      items: ['Launch plan', 'Channels', 'Training', 'Pricing reference', 'Launch gate'],
      path: 'launch-management'
    },
    {
      id: 'F05.08',
      name: 'Lifecycle Management',
      sourceName: 'Lifecycle Management',
      summary:
        'Monitor adoption and govern enhancement/specification recommendations without rewriting released configuration history.',
      items: ['Adoption', 'Enhancement', 'Specification change', 'Portfolio optimisation'],
      path: 'lifecycle?mode=lifecycle'
    },
    {
      id: 'F05.09',
      name: 'Product Retirement',
      sourceName: 'Product Retirement',
      summary:
        'Control end-of-life through stakeholder notice, customer migration, support end and archive evidence before retirement.',
      items: ['End-of-life', 'Notice', 'Migration', 'Support end', 'Archive'],
      path: 'lifecycle?mode=retirement'
    },
    {
      id: 'F05.10',
      name: 'Innovation Management',
      sourceName: 'Innovation Management',
      summary:
        'Manage innovation as governed Business Cases with experiments and funding evidence, not an informal idea backlog.',
      items: ['Pipeline', 'Experiments', 'Incubation', 'Funding', 'Evidence'],
      path: 'business-cases?domain=INNOVATION&mode=innovation'
    }
  ] satisfies WorkArea[],
  journey: [
    { step: '1', name: 'Discover', detail: 'Capture validated market and customer need evidence.' },
    {
      step: '2',
      name: 'Select',
      detail: 'Assess concepts and bind selection to an immutable Decision.'
    },
    {
      step: '3',
      name: 'Invest',
      detail: 'Develop and approve an exact Product / Service Business Case version.'
    },
    {
      step: '4',
      name: 'Define',
      detail: 'Create traceable controlled configuration and requirements.'
    },
    {
      step: '5',
      name: 'Validate',
      detail: 'Run prototype/trial evidence and release an immutable configuration version.'
    },
    {
      step: '6',
      name: 'Launch',
      detail: 'Activate the Item only when all launch gates are satisfied.'
    },
    {
      step: '7',
      name: 'Evolve',
      detail: 'Review adoption, create successor configurations and govern retirement.'
    }
  ],
  platformServices: [
    [
      'Item',
      'One canonical Item identity supports product, material and service behaviour across later workspaces.'
    ],
    [
      'Decision',
      'Concept selection and investment approval retain exact immutable Decision evidence.'
    ],
    [
      'Configuration',
      'Released Product Configuration versions are immutable and retain characteristics, rules and traceability.'
    ],
    [
      'Requirements',
      'Market needs and future engineering requirements remain traceable inputs rather than copied text.'
    ],
    [
      'Work & evidence',
      'Trials, reviews and follow-up use shared evidence/work patterns without shadow workflow engines.'
    ],
    ['Reference data', 'Units and currencies reuse governed enterprise reference identities.']
  ],
  integration: [
    [
      'Strategy',
      'Portfolio and investment priorities remain aligned to governed strategic direction.'
    ],
    [
      'Sales & marketing',
      'Launched offerings hand off Item identity to opportunity, pricing, catalogue and commercial processes.'
    ],
    [
      'Engineering',
      'Configuration links to exact requirement/model identities rather than replacing engineering truth.'
    ],
    [
      'Supply & production',
      'The same Item and configuration identities later underpin planning, BOM and manufacturing semantics.'
    ],
    [
      'Finance',
      'Business Cases reference financial assumptions/funding evidence without becoming Budget or Ledger truth.'
    ],
    [
      'Quality & service',
      'Trials, lifecycle reviews and retirement retain evidence required for downstream quality and support.'
    ]
  ]
} as const;
