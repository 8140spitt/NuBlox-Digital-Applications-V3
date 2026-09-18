export type WorkArea = {
  id: string;
  name: string;
  sourceName: string;
  summary: string;
  items: string[];
  path?: string;
};

export const f01Workspace = {
  id: 'F01',
  name: 'Strategy & Enterprise Planning',
  purpose:
    "Define the organisation's direction, operating model, plans and performance to achieve long-term value in the built environment.",
  objects: [
    'Strategy framework',
    'Business plan',
    'Operating model',
    'Strategic scenario',
    'Review',
    'Performance measure',
    'Decision'
  ],
  areas: [
    {
      id: 'F01.01',
      name: 'Strategy Framework',
      sourceName: 'Vision & purpose',
      summary:
        'Establish and maintain the enterprise purpose, vision, mission and strategic direction.',
      items: [
        'Overview',
        'Purpose & vision',
        'Mission',
        'Direction',
        'Review cycle',
        'Published version'
      ],
      path: 'strategy-framework'
    },
    {
      id: 'F01.02',
      name: 'External Environment',
      sourceName: 'Environmental analysis',
      summary: 'Maintain the evidence base for strategic choices.',
      items: [
        'Market analysis',
        'PESTLE',
        'Industry trends',
        'Competitors',
        'Regulatory landscape',
        'Insights library'
      ],
      path: 'environmental-analysis'
    },
    {
      id: 'F01.03',
      name: 'Strategy',
      sourceName: 'Strategic planning',
      summary: 'Translate evidence into objectives, choices and strategic priorities.',
      items: [
        'Strategic objectives',
        'Strategic themes',
        'Value creation',
        'Risks & opportunities',
        'Strategic choices',
        'Dependencies'
      ],
      path: 'strategic-objectives'
    },
    {
      id: 'F01.04',
      name: 'Business Plan',
      sourceName: 'Business planning',
      summary: 'Convert strategy into owned, funded and governed execution plans.',
      items: [
        'Financial plan',
        'Resource plan',
        'Delivery roadmap',
        'Initiatives',
        'Benefits',
        'Approval'
      ]
    },
    {
      id: 'F01.05',
      name: 'Operating Model',
      sourceName: 'Operating model',
      summary:
        'Define the capabilities, structures and accountabilities needed to execute strategy.',
      items: [
        'Current state',
        'Target state',
        'Components',
        'Accountability',
        'Capabilities',
        'Change initiatives'
      ]
    },
    {
      id: 'F01.06',
      name: 'Performance',
      sourceName: 'Goal & KPI management',
      summary: 'Set measures and targets and monitor strategic performance.',
      items: [
        'Strategic KPIs',
        'Targets',
        'Baselines',
        'Performance data',
        'Dashboards',
        'Variance analysis'
      ]
    },
    {
      id: 'F01.07',
      name: 'Review',
      sourceName: 'Strategic review',
      summary: 'Run controlled strategy reviews and capture resulting decisions and actions.',
      items: [
        'Review schedule',
        'Review meetings',
        'Review inputs',
        'Actions',
        'Outcomes',
        'Next cycle'
      ]
    },
    {
      id: 'F01.08',
      name: 'Scenario & Foresight',
      sourceName: 'Scenario & foresight planning',
      summary: 'Explore future conditions and test strategic resilience.',
      items: [
        'Scenario library',
        'Baseline scenario',
        'Upside / downside',
        'Assumptions',
        'Sensitivity analysis',
        'KPI projections'
      ]
    }
  ] satisfies WorkArea[],
  journey: [
    { step: '1', name: 'Develop', detail: 'Create and maintain strategic content.' },
    { step: '2', name: 'Submit', detail: 'Submit strategy or plan for governed review.' },
    { step: '3', name: 'Review', detail: 'Assigned reviewers challenge evidence and assumptions.' },
    { step: '4', name: 'Decision', detail: 'Approve, amend, return or reject.' },
    {
      step: '5',
      name: 'Publish',
      detail: 'Approved version becomes the active enterprise baseline.'
    },
    { step: '6', name: 'Monitor', detail: 'Track performance, variance and review triggers.' }
  ],
  platformServices: [
    ['Object registry', 'Defines canonical strategy, plan, scenario, review and decision records.'],
    ['Lifecycle', 'Controls states, transitions, publication and supersession.'],
    ['Workflow', 'Coordinates review, approval and hand-off work.'],
    ['Permissions', 'Applies tenant, workspace, role and authority controls.'],
    ['Version control', 'Preserves revisions, approved baselines and comparison.'],
    ['Audit & evidence', 'Records decisions, changes, comments and supporting evidence.']
  ],
  integration: [
    ['Internal data', 'Projects, finance, assets, people, risk and operational performance.'],
    ['External data', 'Market, economic, regulatory and industry intelligence.'],
    ['Analytics & reporting', 'Strategic dashboards, scorecards, forecasts and drill-through.'],
    ['APIs & ecosystem', 'Governed interfaces to specialist and third-party systems.']
  ]
} as const;
