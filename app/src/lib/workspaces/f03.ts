import type { WorkArea } from './f01';

export const f03Workspace = {
  id: 'F03',
  name: 'Enterprise Performance Management',
  purpose:
    'Translate governed strategy into enterprise scorecards, reproducible performance reporting, variance intervention, management review, benchmarking and measurable benefits.',
  objects: [
    'KPI definition',
    'Performance scorecard',
    'Performance target',
    'Performance observation',
    'Performance baseline',
    'Performance snapshot',
    'Management review',
    'Decision',
    'Corrective action',
    'Benefit'
  ],
  areas: [
    {
      id: 'F03.01',
      name: 'Performance Framework',
      sourceName: 'Performance framework',
      summary: 'Establish governed scorecards and KPI hierarchy over shared enterprise KPI definitions.',
      items: ['Scorecards', 'Hierarchy', 'KPI definitions', 'Objective links', 'Weights', 'Publication'],
      path: 'performance-framework'
    },
    {
      id: 'F03.02',
      name: 'Performance Reporting',
      sourceName: 'Performance reporting',
      summary: 'Calculate, review, publish and distribute reproducible period performance snapshots.',
      items: ['Observations', 'Targets', 'Calculation', 'Completeness', 'Publication', 'Distribution'],
      path: 'performance-reporting'
    },
    {
      id: 'F03.03',
      name: 'Variance Management',
      sourceName: 'Variance management',
      summary: 'Identify off-target performance, analyse variance and coordinate accountable recovery.',
      items: ['Variance', 'Baseline', 'Target', 'Actual', 'Root cause', 'Corrective work'],
      path: 'variance-management'
    },
    {
      id: 'F03.04',
      name: 'Management Review',
      sourceName: 'Management review',
      summary: 'Conduct governed operational reviews against exact published performance evidence.',
      items: ['Review schedule', 'Quorum', 'Snapshots', 'Challenge', 'Decisions', 'Actions'],
      path: 'management-review'
    },
    {
      id: 'F03.05',
      name: 'Benchmarking',
      sourceName: 'Benchmarking',
      summary: 'Govern comparable benchmark evidence and use it to approve enterprise performance targets.',
      items: ['Benchmark basis', 'Comparator scope', 'Comparable data', 'Target', 'Approval', 'Gap'],
      path: 'benchmarking'
    },
    {
      id: 'F03.06',
      name: 'Benefits Realisation',
      sourceName: 'Benefits realisation',
      summary: 'Trace transformation benefits to governed targets, baselines, observations and validation evidence.',
      items: ['Benefit', 'Transformation link', 'Baseline', 'Target', 'Observation', 'Validation'],
      path: 'benefits-realisation'
    }
  ] satisfies WorkArea[],
  journey: [
    { step: '1', name: 'Define', detail: 'Govern KPI meaning, hierarchy, targets and baselines.' },
    { step: '2', name: 'Observe', detail: 'Collect attributable performance evidence without rewriting history.' },
    { step: '3', name: 'Calculate', detail: 'Build reproducible period snapshots from pinned governed inputs.' },
    { step: '4', name: 'Review', detail: 'Challenge performance through governed operational review.' },
    { step: '5', name: 'Intervene', detail: 'Record Decisions and coordinate corrective Work.' },
    { step: '6', name: 'Realise', detail: 'Validate benchmarks, benefits and sustained performance outcomes.' }
  ],
  platformServices: [
    ['Performance aggregate', 'KPI, target, observation, baseline and snapshot semantics remain distinct.'],
    ['Decision', 'Snapshot publication, benchmark approval and review choices use immutable shared Decisions.'],
    ['Workflow & work', 'Corrective actions and management-review follow-up use shared accountable Work.'],
    ['Governance meeting', 'Management Review reuses the canonical governed meeting occurrence.'],
    ['Evidence', 'Observations, benchmark basis and benefit validation retain attributable provenance.'],
    ['Audit & events', 'Performance lifecycle changes remain tenant-scoped, attributable and replayable.']
  ],
  integration: [
    ['Strategy', 'Strategic objectives and KPI definitions provide the performance-management basis.'],
    ['Finance', 'Financial targets and actuals contribute governed enterprise performance evidence.'],
    ['Projects & operations', 'Delivery observations provide operating results without becoming a second ledger.'],
    ['Transformation', 'Benefit profiles trace change initiatives to measurable realised outcomes.'],
    ['Data & analytics', 'Dashboards consume published snapshots rather than mutating source evidence.']
  ]
} as const;