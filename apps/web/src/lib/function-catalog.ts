export type NativeEngineSummary = {
  id: string;
  name: string;
  state: string;
};

export type SubFunctionSummary = {
  code: string;
  name: string;
  activities: string[];
  engineIds: string[];
  engineNames: string[];
};

export type FunctionSummary = {
  code: string;
  name: string;
  subfunctionCount: number;
  activityCount: number;
  group: string;
  engines: NativeEngineSummary[];
  subfunctions: SubFunctionSummary[];
};

export type FunctionGroup = {
  id: string;
  name: string;
  functionCodes: string[];
};

export const functionGroups: FunctionGroup[] = [
  {
    "id": "direction",
    "name": "Direction & Governance",
    "functionCodes": [
      "F01",
      "F02",
      "F03",
      "F04",
      "F05"
    ]
  },
  {
    "id": "market",
    "name": "Market & Customer",
    "functionCodes": [
      "F06",
      "F07",
      "F08"
    ]
  },
  {
    "id": "operations",
    "name": "Operations & Delivery",
    "functionCodes": [
      "F09",
      "F10",
      "F11",
      "F12",
      "F13"
    ]
  },
  {
    "id": "services",
    "name": "Enterprise Services",
    "functionCodes": [
      "F14",
      "F15",
      "F16",
      "F17",
      "F18",
      "F19",
      "F20",
      "F21"
    ]
  },
  {
    "id": "assets",
    "name": "Assets, Safety & Resilience",
    "functionCodes": [
      "F22",
      "F23",
      "F24",
      "F25"
    ]
  },
  {
    "id": "delivery",
    "name": "Knowledge, Projects & Transformation",
    "functionCodes": [
      "F26",
      "F27",
      "F28",
      "F29"
    ]
  }
];

export const functions: FunctionSummary[] = [
  {
    "code": "F01",
    "name": "Strategy & Enterprise Planning",
    "subfunctionCount": 8,
    "activityCount": 41,
    "group": "direction",
    "engines": [
      {
        "id": "NTE-011",
        "name": "Strategy, Scenario & Enterprise Planning",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F01.01",
        "name": "Vision & purpose",
        "activities": [
          "Define purpose",
          "define vision",
          "establish mission",
          "communicate direction",
          "review relevance"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits"
        ]
      },
      {
        "code": "F01.02",
        "name": "Environmental analysis",
        "activities": [
          "Monitor economic conditions",
          "analyse competitors",
          "assess markets",
          "analyse technology trends",
          "analyse regulatory environment",
          "identify opportunities/threats"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits"
        ]
      },
      {
        "code": "F01.03",
        "name": "Strategic planning",
        "activities": [
          "Define objectives",
          "develop strategic options",
          "evaluate scenarios",
          "select strategy",
          "establish strategic priorities"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits"
        ]
      },
      {
        "code": "F01.04",
        "name": "Business planning",
        "activities": [
          "Create annual plans",
          "establish business-unit plans",
          "define initiatives",
          "assign ownership",
          "approve plans"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits"
        ]
      },
      {
        "code": "F01.05",
        "name": "Operating model",
        "activities": [
          "Define organisational capabilities",
          "design structures",
          "determine centralisation/decentralisation",
          "establish shared services",
          "define accountabilities"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits"
        ]
      },
      {
        "code": "F01.06",
        "name": "Goal & KPI management",
        "activities": [
          "Define KPIs",
          "set targets",
          "establish baselines",
          "monitor performance",
          "analyse variance",
          "initiate corrective action"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013",
          "NTE-033"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F01.07",
        "name": "Strategic review",
        "activities": [
          "Conduct strategy reviews",
          "reassess assumptions",
          "evaluate progress",
          "reprioritise initiatives",
          "adjust strategy"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits"
        ]
      },
      {
        "code": "F01.08",
        "name": "Scenario & foresight planning",
        "activities": [
          "Develop scenarios",
          "model future conditions",
          "conduct sensitivity analysis",
          "develop contingency strategies"
        ],
        "engineIds": [
          "NTE-011",
          "NTE-013"
        ],
        "engineNames": [
          "Strategy, Scenario & Enterprise Planning",
          "Performance, KPI & Benefits"
        ]
      }
    ]
  },
  {
    "code": "F02",
    "name": "Corporate Governance",
    "subfunctionCount": 7,
    "activityCount": 31,
    "group": "direction",
    "engines": [
      {
        "id": "NTE-001",
        "name": "Party, Organisation & Identity",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-002",
        "name": "Access, Responsibility & Authority",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-004",
        "name": "Lifecycle, Decision & Evidence",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-012",
        "name": "Board, Committee & Governance",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F02.01",
        "name": "Board governance",
        "activities": [
          "Schedule meetings",
          "prepare board packs",
          "record minutes",
          "manage resolutions",
          "monitor actions"
        ],
        "engineIds": [
          "NTE-012",
          "NTE-002",
          "NTE-004"
        ],
        "engineNames": [
          "Board, Committee & Governance",
          "Access, Responsibility & Authority",
          "Lifecycle, Decision & Evidence"
        ]
      },
      {
        "code": "F02.02",
        "name": "Governance framework",
        "activities": [
          "Establish governance policies",
          "define authorities",
          "assign decision rights",
          "maintain governance structure"
        ],
        "engineIds": [
          "NTE-012",
          "NTE-002",
          "NTE-004"
        ],
        "engineNames": [
          "Board, Committee & Governance",
          "Access, Responsibility & Authority",
          "Lifecycle, Decision & Evidence"
        ]
      },
      {
        "code": "F02.03",
        "name": "Delegation of authority",
        "activities": [
          "Define approval thresholds",
          "assign authorities",
          "maintain delegation matrix",
          "monitor compliance"
        ],
        "engineIds": [
          "NTE-012",
          "NTE-002",
          "NTE-004"
        ],
        "engineNames": [
          "Board, Committee & Governance",
          "Access, Responsibility & Authority",
          "Lifecycle, Decision & Evidence"
        ]
      },
      {
        "code": "F02.04",
        "name": "Executive management",
        "activities": [
          "Conduct executive reviews",
          "make enterprise decisions",
          "resolve escalations",
          "approve investments"
        ],
        "engineIds": [
          "NTE-012",
          "NTE-002",
          "NTE-004"
        ],
        "engineNames": [
          "Board, Committee & Governance",
          "Access, Responsibility & Authority",
          "Lifecycle, Decision & Evidence"
        ]
      },
      {
        "code": "F02.05",
        "name": "Committee governance",
        "activities": [
          "Establish committees",
          "define terms of reference",
          "schedule meetings",
          "record decisions",
          "track actions"
        ],
        "engineIds": [
          "NTE-012",
          "NTE-002",
          "NTE-004"
        ],
        "engineNames": [
          "Board, Committee & Governance",
          "Access, Responsibility & Authority",
          "Lifecycle, Decision & Evidence"
        ]
      },
      {
        "code": "F02.06",
        "name": "Policy governance",
        "activities": [
          "Draft policies",
          "review policies",
          "obtain approvals",
          "publish policies",
          "monitor adherence"
        ],
        "engineIds": [
          "NTE-012",
          "NTE-002",
          "NTE-004",
          "NTE-043"
        ],
        "engineNames": [
          "Board, Committee & Governance",
          "Access, Responsibility & Authority",
          "Lifecycle, Decision & Evidence",
          "Knowledge, Document, Records & CDE"
        ]
      },
      {
        "code": "F02.07",
        "name": "Ethics governance",
        "activities": [
          "Establish code of conduct",
          "manage declarations",
          "monitor ethical issues",
          "investigate breaches"
        ],
        "engineIds": [
          "NTE-012",
          "NTE-002",
          "NTE-004",
          "NTE-037"
        ],
        "engineNames": [
          "Board, Committee & Governance",
          "Access, Responsibility & Authority",
          "Lifecycle, Decision & Evidence",
          "Risk, Compliance, Control & Audit"
        ]
      }
    ]
  },
  {
    "code": "F03",
    "name": "Enterprise Performance Management",
    "subfunctionCount": 6,
    "activityCount": 24,
    "group": "direction",
    "engines": [
      {
        "id": "NTE-013",
        "name": "Performance, KPI & Benefits",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F03.01",
        "name": "Performance framework",
        "activities": [
          "Establish scorecards",
          "define performance hierarchy",
          "map KPIs to objectives"
        ],
        "engineIds": [
          "NTE-013",
          "NTE-033"
        ],
        "engineNames": [
          "Performance, KPI & Benefits",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F03.02",
        "name": "Performance reporting",
        "activities": [
          "Collect performance data",
          "calculate metrics",
          "publish dashboards",
          "distribute reports"
        ],
        "engineIds": [
          "NTE-013",
          "NTE-033"
        ],
        "engineNames": [
          "Performance, KPI & Benefits",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F03.03",
        "name": "Variance management",
        "activities": [
          "Identify variance",
          "analyse root cause",
          "assign corrective action",
          "monitor recovery"
        ],
        "engineIds": [
          "NTE-013",
          "NTE-033"
        ],
        "engineNames": [
          "Performance, KPI & Benefits",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F03.04",
        "name": "Management review",
        "activities": [
          "Conduct operational reviews",
          "review forecasts",
          "challenge performance",
          "record decisions"
        ],
        "engineIds": [
          "NTE-013",
          "NTE-033"
        ],
        "engineNames": [
          "Performance, KPI & Benefits",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F03.05",
        "name": "Benchmarking",
        "activities": [
          "Select benchmarks",
          "collect comparable data",
          "compare performance",
          "identify performance gaps"
        ],
        "engineIds": [
          "NTE-013",
          "NTE-033"
        ],
        "engineNames": [
          "Performance, KPI & Benefits",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F03.06",
        "name": "Benefits realisation",
        "activities": [
          "Define benefits",
          "establish baselines",
          "measure benefits",
          "validate outcomes",
          "report realised value"
        ],
        "engineIds": [
          "NTE-013",
          "NTE-033"
        ],
        "engineNames": [
          "Performance, KPI & Benefits",
          "BI, Semantic Analytics & Reporting"
        ]
      }
    ]
  },
  {
    "code": "F04",
    "name": "Corporate Development & M&A",
    "subfunctionCount": 7,
    "activityCount": 33,
    "group": "direction",
    "engines": [
      {
        "id": "NTE-014",
        "name": "Deal, M&A & Corporate Development",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F04.01",
        "name": "Opportunity identification",
        "activities": [
          "Identify acquisition/merger/divestment opportunities",
          "screen targets",
          "evaluate strategic fit"
        ],
        "engineIds": [
          "NTE-014"
        ],
        "engineNames": [
          "Deal, M&A & Corporate Development"
        ]
      },
      {
        "code": "F04.02",
        "name": "Valuation",
        "activities": [
          "Develop financial models",
          "estimate synergies",
          "value businesses/assets",
          "assess scenarios"
        ],
        "engineIds": [
          "NTE-014",
          "NTE-026"
        ],
        "engineNames": [
          "Deal, M&A & Corporate Development",
          "Accounting, Ledger & Financial Close"
        ]
      },
      {
        "code": "F04.03",
        "name": "Due diligence",
        "activities": [
          "Review finance",
          "operations",
          "technology",
          "people",
          "legal",
          "tax",
          "commercial and risk information"
        ],
        "engineIds": [
          "NTE-014",
          "NTE-037",
          "NTE-043"
        ],
        "engineNames": [
          "Deal, M&A & Corporate Development",
          "Risk, Compliance, Control & Audit",
          "Knowledge, Document, Records & CDE"
        ]
      },
      {
        "code": "F04.04",
        "name": "Transaction management",
        "activities": [
          "Structure transaction",
          "negotiate terms",
          "obtain approvals",
          "execute agreements",
          "complete transaction"
        ],
        "engineIds": [
          "NTE-014"
        ],
        "engineNames": [
          "Deal, M&A & Corporate Development"
        ]
      },
      {
        "code": "F04.05",
        "name": "Integration",
        "activities": [
          "Develop integration plan",
          "integrate organisations",
          "consolidate systems",
          "harmonise policies"
        ],
        "engineIds": [
          "NTE-014",
          "NTE-046"
        ],
        "engineNames": [
          "Deal, M&A & Corporate Development",
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F04.06",
        "name": "Divestiture",
        "activities": [
          "Define separation perimeter",
          "prepare carve-out",
          "transfer assets",
          "separate systems",
          "complete disposal"
        ],
        "engineIds": [
          "NTE-014",
          "NTE-046"
        ],
        "engineNames": [
          "Deal, M&A & Corporate Development",
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F04.07",
        "name": "Strategic partnerships",
        "activities": [
          "Identify partners",
          "assess fit",
          "negotiate alliance",
          "establish governance",
          "monitor partnership"
        ],
        "engineIds": [
          "NTE-014"
        ],
        "engineNames": [
          "Deal, M&A & Corporate Development"
        ]
      }
    ]
  },
  {
    "code": "F05",
    "name": "Product, Service & Innovation Management",
    "subfunctionCount": 10,
    "activityCount": 46,
    "group": "direction",
    "engines": [
      {
        "id": "NTE-006",
        "name": "Change, Configuration & Baseline",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-015",
        "name": "Product, Service & Innovation Lifecycle",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-049",
        "name": "CAD, BIM & Parametric Design Authoring",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-050",
        "name": "Engineering Analysis & Calculation",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F05.01",
        "name": "Portfolio strategy",
        "activities": [
          "Define portfolio",
          "classify offerings",
          "analyse portfolio performance",
          "identify gaps",
          "prioritise investment"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.02",
        "name": "Market/customer needs",
        "activities": [
          "Conduct research",
          "gather requirements",
          "analyse customer problems",
          "identify unmet needs"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.03",
        "name": "Product/service ideation",
        "activities": [
          "Capture ideas",
          "assess opportunities",
          "evaluate feasibility",
          "score ideas",
          "select concepts"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.04",
        "name": "Business case development",
        "activities": [
          "Forecast demand",
          "estimate costs",
          "calculate ROI",
          "assess risk",
          "approve investment"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.05",
        "name": "Product/service design",
        "activities": [
          "Define requirements",
          "design offering",
          "create specifications",
          "prototype",
          "test"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.06",
        "name": "Development",
        "activities": [
          "Build product/service",
          "configure solution",
          "conduct trials",
          "validate requirements"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.07",
        "name": "Launch management",
        "activities": [
          "Develop launch plan",
          "prepare channels",
          "train teams",
          "establish pricing",
          "launch offering"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.08",
        "name": "Lifecycle management",
        "activities": [
          "Monitor adoption",
          "manage enhancements",
          "change specifications",
          "optimise portfolio"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.09",
        "name": "Product retirement",
        "activities": [
          "Determine end-of-life",
          "notify stakeholders",
          "migrate customers",
          "discontinue support",
          "archive records"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      },
      {
        "code": "F05.10",
        "name": "Innovation management",
        "activities": [
          "Maintain innovation pipeline",
          "run experiments",
          "incubate concepts",
          "manage innovation funding"
        ],
        "engineIds": [
          "NTE-015",
          "NTE-006"
        ],
        "engineNames": [
          "Product, Service & Innovation Lifecycle",
          "Change, Configuration & Baseline"
        ]
      }
    ]
  },
  {
    "code": "F06",
    "name": "Marketing & Brand",
    "subfunctionCount": 11,
    "activityCount": 53,
    "group": "market",
    "engines": [
      {
        "id": "NTE-016",
        "name": "Marketing, Campaign & Brand",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F06.01",
        "name": "Market intelligence",
        "activities": [
          "Research markets",
          "analyse segments",
          "monitor competitors",
          "forecast trends"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.02",
        "name": "Customer segmentation",
        "activities": [
          "Define segments",
          "profile audiences",
          "evaluate segment value",
          "maintain segmentation"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.03",
        "name": "Brand management",
        "activities": [
          "Define brand",
          "establish guidelines",
          "manage brand assets",
          "monitor brand perception"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.04",
        "name": "Marketing strategy",
        "activities": [
          "Define objectives",
          "select markets",
          "determine positioning",
          "establish channel strategy"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.05",
        "name": "Campaign management",
        "activities": [
          "Plan campaigns",
          "create content",
          "approve campaigns",
          "execute",
          "monitor",
          "optimise"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.06",
        "name": "Digital marketing",
        "activities": [
          "Manage websites",
          "SEO",
          "paid media",
          "social media",
          "email",
          "marketing automation"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.07",
        "name": "Content marketing",
        "activities": [
          "Define content strategy",
          "create assets",
          "approve content",
          "publish",
          "maintain content library"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.08",
        "name": "Events",
        "activities": [
          "Plan events",
          "manage registrations",
          "coordinate suppliers",
          "deliver events",
          "evaluate outcomes"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.09",
        "name": "Lead generation",
        "activities": [
          "Capture leads",
          "enrich data",
          "score leads",
          "nurture prospects",
          "transfer qualified leads"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      },
      {
        "code": "F06.10",
        "name": "Marketing analytics",
        "activities": [
          "Measure reach",
          "attribution",
          "conversion",
          "CAC",
          "ROI",
          "campaign performance"
        ],
        "engineIds": [
          "NTE-016",
          "NTE-033"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F06.11",
        "name": "Market communications",
        "activities": [
          "Prepare collateral",
          "manage advertising",
          "coordinate communications",
          "maintain messaging"
        ],
        "engineIds": [
          "NTE-016"
        ],
        "engineNames": [
          "Marketing, Campaign & Brand"
        ]
      }
    ]
  },
  {
    "code": "F07",
    "name": "Sales & Commercial Management",
    "subfunctionCount": 13,
    "activityCount": 66,
    "group": "market",
    "engines": [
      {
        "id": "NTE-017",
        "name": "CRM, Opportunity & Account",
        "state": "PARTIAL"
      },
      {
        "id": "NTE-018",
        "name": "Pricing, CPQ, Bid & Sales Order",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-052",
        "name": "Estimating, Measurement, Cost Planning & BoQ",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-053",
        "name": "Construction Commercial & Contract Administration",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F07.01",
        "name": "Sales strategy",
        "activities": [
          "Define sales model",
          "territories",
          "channels",
          "targets",
          "quotas",
          "coverage"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.02",
        "name": "Account management",
        "activities": [
          "Create accounts",
          "classify accounts",
          "maintain account plans",
          "manage relationships"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.03",
        "name": "Opportunity management",
        "activities": [
          "Identify opportunity",
          "qualify",
          "assign",
          "progress stages",
          "forecast",
          "close"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.04",
        "name": "Pipeline management",
        "activities": [
          "Monitor pipeline",
          "assess coverage",
          "identify risks",
          "reprioritise opportunities"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.05",
        "name": "Pricing",
        "activities": [
          "Establish price lists",
          "calculate price",
          "manage discounts",
          "approve exceptions",
          "review pricing"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.06",
        "name": "Quotation",
        "activities": [
          "Capture requirements",
          "configure offering",
          "calculate quote",
          "approve",
          "issue quote"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.07",
        "name": "Proposal/bid management",
        "activities": [
          "Review tender",
          "bid/no-bid decision",
          "develop response",
          "approve proposal",
          "submit"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.08",
        "name": "Contract negotiation",
        "activities": [
          "Negotiate scope",
          "price",
          "terms",
          "SLA",
          "liabilities",
          "obtain approval"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018",
          "NTE-036"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order",
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F07.09",
        "name": "Sales order management",
        "activities": [
          "Capture order",
          "validate",
          "approve",
          "amend",
          "cancel",
          "transfer for fulfilment"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.10",
        "name": "Channel/partner sales",
        "activities": [
          "Recruit partners",
          "onboard",
          "establish terms",
          "manage pipeline",
          "calculate incentives"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.11",
        "name": "Sales compensation",
        "activities": [
          "Define incentives",
          "calculate commission",
          "review exceptions",
          "approve payment"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order"
        ]
      },
      {
        "code": "F07.12",
        "name": "Sales forecasting",
        "activities": [
          "Collect forecasts",
          "assess probability",
          "consolidate forecast",
          "challenge assumptions"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018",
          "NTE-033"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F07.13",
        "name": "Sales performance",
        "activities": [
          "Monitor revenue",
          "conversion",
          "margin",
          "win rate",
          "productivity",
          "corrective action"
        ],
        "engineIds": [
          "NTE-017",
          "NTE-018",
          "NTE-033"
        ],
        "engineNames": [
          "CRM, Opportunity & Account",
          "Pricing, CPQ, Bid & Sales Order",
          "BI, Semantic Analytics & Reporting"
        ]
      }
    ]
  },
  {
    "code": "F08",
    "name": "Customer Service, Experience & Success",
    "subfunctionCount": 12,
    "activityCount": 56,
    "group": "market",
    "engines": [
      {
        "id": "NTE-019",
        "name": "Customer Service, Case & Success",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F08.01",
        "name": "Customer onboarding",
        "activities": [
          "Verify customer",
          "configure account",
          "capture preferences",
          "train customer",
          "activate service"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.02",
        "name": "Customer enquiry management",
        "activities": [
          "Receive enquiry",
          "classify",
          "route",
          "respond",
          "resolve",
          "close"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.03",
        "name": "Case management",
        "activities": [
          "Create case",
          "assign",
          "investigate",
          "resolve",
          "document",
          "close"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.04",
        "name": "Complaint management",
        "activities": [
          "Record complaint",
          "investigate",
          "communicate resolution",
          "compensate/remediate",
          "analyse cause"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.05",
        "name": "Technical support",
        "activities": [
          "Diagnose issue",
          "troubleshoot",
          "escalate",
          "resolve",
          "document solution"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.06",
        "name": "Returns/refunds",
        "activities": [
          "Authorise return",
          "receive goods",
          "inspect",
          "approve refund/replacement",
          "process credit"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.07",
        "name": "Warranty",
        "activities": [
          "Validate warranty",
          "approve claim",
          "repair/replace",
          "recover supplier cost"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.08",
        "name": "Customer success",
        "activities": [
          "Monitor adoption",
          "conduct reviews",
          "identify risks",
          "drive value realisation"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.09",
        "name": "Retention",
        "activities": [
          "Identify churn risk",
          "develop retention offer",
          "engage customer",
          "monitor outcome"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.10",
        "name": "Customer feedback",
        "activities": [
          "Conduct surveys",
          "measure NPS/CSAT",
          "analyse feedback",
          "assign improvements"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      },
      {
        "code": "F08.11",
        "name": "Customer knowledge",
        "activities": [
          "Maintain FAQs",
          "knowledge articles",
          "scripts",
          "troubleshooting guides"
        ],
        "engineIds": [
          "NTE-019",
          "NTE-043"
        ],
        "engineNames": [
          "Customer Service, Case & Success",
          "Knowledge, Document, Records & CDE"
        ]
      },
      {
        "code": "F08.12",
        "name": "Service-level management",
        "activities": [
          "Define SLA",
          "measure performance",
          "investigate breaches",
          "report results"
        ],
        "engineIds": [
          "NTE-019"
        ],
        "engineNames": [
          "Customer Service, Case & Success"
        ]
      }
    ]
  },
  {
    "code": "F09",
    "name": "Procurement & Supplier Management",
    "subfunctionCount": 13,
    "activityCount": 57,
    "group": "operations",
    "engines": [
      {
        "id": "NTE-020",
        "name": "Supplier, Sourcing & Procurement",
        "state": "PARTIAL"
      }
    ],
    "subfunctions": [
      {
        "code": "F09.01",
        "name": "Procurement strategy",
        "activities": [
          "Analyse spend",
          "define categories",
          "determine sourcing strategy",
          "establish procurement policy"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.02",
        "name": "Category management",
        "activities": [
          "Segment spend",
          "analyse markets",
          "develop category plans",
          "identify savings"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.03",
        "name": "Supplier discovery",
        "activities": [
          "Identify suppliers",
          "collect information",
          "pre-qualify",
          "maintain supplier database"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.04",
        "name": "Sourcing",
        "activities": [
          "Issue RFI/RFQ/RFP",
          "evaluate responses",
          "conduct auctions",
          "select supplier"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.05",
        "name": "Supplier negotiation",
        "activities": [
          "Negotiate price",
          "terms",
          "service",
          "risk provisions",
          "incentives"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.06",
        "name": "Contracting",
        "activities": [
          "Draft contract",
          "review",
          "approve",
          "execute",
          "store",
          "renew"
        ],
        "engineIds": [
          "NTE-020",
          "NTE-036"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement",
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F09.07",
        "name": "Supplier onboarding",
        "activities": [
          "Verify supplier",
          "collect tax/bank information",
          "perform due diligence",
          "activate"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.08",
        "name": "Requisitioning",
        "activities": [
          "Create requisition",
          "validate",
          "route for approval",
          "convert to purchase order"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.09",
        "name": "Purchase ordering",
        "activities": [
          "Create PO",
          "approve",
          "issue",
          "amend",
          "close"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.10",
        "name": "Supplier performance",
        "activities": [
          "Define KPIs",
          "collect results",
          "score supplier",
          "conduct reviews",
          "corrective action"
        ],
        "engineIds": [
          "NTE-020",
          "NTE-033"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F09.11",
        "name": "Supplier risk",
        "activities": [
          "Assess financial/operational/ESG/cyber risk",
          "monitor changes",
          "mitigate risk"
        ],
        "engineIds": [
          "NTE-020",
          "NTE-037"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F09.12",
        "name": "Supplier relationship management",
        "activities": [
          "Segment strategic suppliers",
          "conduct reviews",
          "collaborate",
          "resolve disputes"
        ],
        "engineIds": [
          "NTE-020"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement"
        ]
      },
      {
        "code": "F09.13",
        "name": "Procurement analytics",
        "activities": [
          "Analyse spend",
          "savings",
          "compliance",
          "supplier concentration",
          "maverick spend"
        ],
        "engineIds": [
          "NTE-020",
          "NTE-033"
        ],
        "engineNames": [
          "Supplier, Sourcing & Procurement",
          "BI, Semantic Analytics & Reporting"
        ]
      }
    ]
  },
  {
    "code": "F10",
    "name": "Demand, Supply Chain & Logistics",
    "subfunctionCount": 13,
    "activityCount": 57,
    "group": "operations",
    "engines": [
      {
        "id": "NTE-021",
        "name": "Demand, Supply & MRP Planning",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-022",
        "name": "Inventory, Warehouse & Logistics",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F10.01",
        "name": "Demand planning",
        "activities": [
          "Collect demand signals",
          "generate forecast",
          "review assumptions",
          "approve forecast"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.02",
        "name": "Sales & operations planning",
        "activities": [
          "Reconcile demand/supply",
          "evaluate capacity",
          "model scenarios",
          "approve plan"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.03",
        "name": "Supply planning",
        "activities": [
          "Calculate requirements",
          "determine supply plan",
          "allocate resources"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.04",
        "name": "Inventory planning",
        "activities": [
          "Set safety stock",
          "reorder points",
          "target stock levels",
          "optimise inventory"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.05",
        "name": "Material requirements",
        "activities": [
          "Calculate requirements",
          "schedule replenishment",
          "release purchase/production requirements"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.06",
        "name": "Warehouse management",
        "activities": [
          "Receive",
          "inspect",
          "put away",
          "move",
          "pick",
          "pack",
          "dispatch"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.07",
        "name": "Inventory control",
        "activities": [
          "Count inventory",
          "reconcile variance",
          "manage adjustments",
          "quarantine stock"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022",
          "NTE-037"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F10.08",
        "name": "Transport management",
        "activities": [
          "Plan routes",
          "select carrier",
          "tender loads",
          "track delivery",
          "reconcile freight"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.09",
        "name": "Distribution",
        "activities": [
          "Allocate orders",
          "schedule dispatch",
          "fulfil deliveries",
          "confirm receipt"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.10",
        "name": "Import/export",
        "activities": [
          "Classify goods",
          "prepare customs documentation",
          "obtain licences",
          "clear customs"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.11",
        "name": "Reverse logistics",
        "activities": [
          "Receive returns",
          "inspect",
          "refurbish",
          "recycle",
          "dispose",
          "return to supplier"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics"
        ]
      },
      {
        "code": "F10.12",
        "name": "Supply chain analytics",
        "activities": [
          "Monitor OTIF",
          "inventory turns",
          "lead time",
          "capacity",
          "logistics costs"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022",
          "NTE-033"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F10.13",
        "name": "Supply chain risk",
        "activities": [
          "Identify dependencies",
          "monitor disruption",
          "qualify alternatives",
          "activate contingencies"
        ],
        "engineIds": [
          "NTE-021",
          "NTE-022",
          "NTE-037"
        ],
        "engineNames": [
          "Demand, Supply & MRP Planning",
          "Inventory, Warehouse & Logistics",
          "Risk, Compliance, Control & Audit"
        ]
      }
    ]
  },
  {
    "code": "F11",
    "name": "Manufacturing / Production Operations",
    "subfunctionCount": 11,
    "activityCount": 45,
    "group": "operations",
    "engines": [
      {
        "id": "NTE-023",
        "name": "Manufacturing & Production Execution",
        "state": "PARTIAL"
      },
      {
        "id": "NTE-055",
        "name": "Fabrication & Off-site Production",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F11.01",
        "name": "Production planning",
        "activities": [
          "Translate demand",
          "create production plan",
          "determine capacity",
          "schedule production"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.02",
        "name": "Production scheduling",
        "activities": [
          "Sequence jobs",
          "allocate machines",
          "allocate labour",
          "release work orders"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.03",
        "name": "Material staging",
        "activities": [
          "Pick materials",
          "issue to production",
          "verify availability",
          "record consumption"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.04",
        "name": "Production execution",
        "activities": [
          "Set up equipment",
          "perform operation",
          "record output",
          "report downtime"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.05",
        "name": "Process control",
        "activities": [
          "Monitor parameters",
          "inspect output",
          "adjust equipment/process"
        ],
        "engineIds": [
          "NTE-023",
          "NTE-037"
        ],
        "engineNames": [
          "Manufacturing & Production Execution",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F11.06",
        "name": "Work-in-progress",
        "activities": [
          "Track WIP",
          "move materials",
          "manage queues",
          "reconcile quantities"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.07",
        "name": "Packaging",
        "activities": [
          "Pack",
          "label",
          "verify",
          "palletise",
          "stage finished goods"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.08",
        "name": "Production reporting",
        "activities": [
          "Record yield",
          "scrap",
          "downtime",
          "labour",
          "throughput",
          "efficiency"
        ],
        "engineIds": [
          "NTE-023",
          "NTE-033"
        ],
        "engineNames": [
          "Manufacturing & Production Execution",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F11.09",
        "name": "Capacity management",
        "activities": [
          "Calculate capacity",
          "identify constraints",
          "balance loads",
          "increase/decrease capacity"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.10",
        "name": "Maintenance coordination",
        "activities": [
          "Schedule equipment access",
          "report faults",
          "coordinate planned maintenance"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      },
      {
        "code": "F11.11",
        "name": "Lean operations",
        "activities": [
          "Identify waste",
          "improve flow",
          "standardise work",
          "conduct Kaizen"
        ],
        "engineIds": [
          "NTE-023"
        ],
        "engineNames": [
          "Manufacturing & Production Execution"
        ]
      }
    ]
  },
  {
    "code": "F12",
    "name": "Service Delivery & Field Operations",
    "subfunctionCount": 10,
    "activityCount": 39,
    "group": "operations",
    "engines": [
      {
        "id": "NTE-024",
        "name": "Service Planning, Dispatch & Field Execution",
        "state": "PARTIAL"
      },
      {
        "id": "NTE-054",
        "name": "Construction Site Production & Field Evidence",
        "state": "PARTIAL"
      }
    ],
    "subfunctions": [
      {
        "code": "F12.01",
        "name": "Service planning",
        "activities": [
          "Define delivery model",
          "resource requirements",
          "standards",
          "capacity"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.02",
        "name": "Service scheduling",
        "activities": [
          "Schedule appointments/jobs",
          "assign personnel",
          "optimise resources"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.03",
        "name": "Resource dispatch",
        "activities": [
          "Select resource",
          "issue work",
          "route resource",
          "monitor progress"
        ],
        "engineIds": [
          "NTE-024",
          "NTE-035"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution",
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F12.04",
        "name": "Service execution",
        "activities": [
          "Perform service",
          "record work",
          "capture evidence",
          "complete service"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.05",
        "name": "Field service",
        "activities": [
          "Travel to site",
          "inspect",
          "repair/install",
          "test",
          "obtain customer acceptance"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.06",
        "name": "Professional services",
        "activities": [
          "Define engagement",
          "plan resources",
          "perform work",
          "deliver outputs"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.07",
        "name": "Service acceptance",
        "activities": [
          "Validate completion",
          "obtain sign-off",
          "close order",
          "trigger billing"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.08",
        "name": "Service quality",
        "activities": [
          "Monitor SLA",
          "assess quality",
          "resolve deficiencies"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.09",
        "name": "Service capacity",
        "activities": [
          "Forecast workload",
          "plan workforce",
          "balance demand and capacity"
        ],
        "engineIds": [
          "NTE-024"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution"
        ]
      },
      {
        "code": "F12.10",
        "name": "Service performance",
        "activities": [
          "Measure productivity",
          "utilisation",
          "SLA",
          "first-time-fix",
          "cost-to-serve"
        ],
        "engineIds": [
          "NTE-024",
          "NTE-033"
        ],
        "engineNames": [
          "Service Planning, Dispatch & Field Execution",
          "BI, Semantic Analytics & Reporting"
        ]
      }
    ]
  },
  {
    "code": "F13",
    "name": "Quality Management",
    "subfunctionCount": 10,
    "activityCount": 40,
    "group": "operations",
    "engines": [
      {
        "id": "NTE-004",
        "name": "Lifecycle, Decision & Evidence",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-025",
        "name": "Quality, Inspection, Test & CAPA",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F13.01",
        "name": "Quality strategy",
        "activities": [
          "Establish quality objectives",
          "policies",
          "governance",
          "standards"
        ],
        "engineIds": [
          "NTE-025"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA"
        ]
      },
      {
        "code": "F13.02",
        "name": "Quality planning",
        "activities": [
          "Define quality requirements",
          "inspection plans",
          "acceptance criteria"
        ],
        "engineIds": [
          "NTE-025"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA"
        ]
      },
      {
        "code": "F13.03",
        "name": "Quality assurance",
        "activities": [
          "Audit processes",
          "review compliance",
          "verify controls"
        ],
        "engineIds": [
          "NTE-025",
          "NTE-037"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F13.04",
        "name": "Quality control",
        "activities": [
          "Inspect",
          "test",
          "sample",
          "accept/reject",
          "quarantine"
        ],
        "engineIds": [
          "NTE-025",
          "NTE-037"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F13.05",
        "name": "Non-conformance",
        "activities": [
          "Record defect",
          "contain issue",
          "classify",
          "investigate",
          "disposition"
        ],
        "engineIds": [
          "NTE-025"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA"
        ]
      },
      {
        "code": "F13.06",
        "name": "Corrective/preventive action",
        "activities": [
          "Root-cause analysis",
          "define CAPA",
          "implement",
          "verify effectiveness"
        ],
        "engineIds": [
          "NTE-025"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA"
        ]
      },
      {
        "code": "F13.07",
        "name": "Supplier quality",
        "activities": [
          "Audit supplier",
          "inspect incoming goods",
          "manage supplier corrective actions"
        ],
        "engineIds": [
          "NTE-025"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA"
        ]
      },
      {
        "code": "F13.08",
        "name": "Quality documentation",
        "activities": [
          "Maintain specifications",
          "procedures",
          "inspection records",
          "certificates"
        ],
        "engineIds": [
          "NTE-025",
          "NTE-043"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA",
          "Knowledge, Document, Records & CDE"
        ]
      },
      {
        "code": "F13.09",
        "name": "Continuous improvement",
        "activities": [
          "Identify opportunities",
          "analyse process",
          "implement improvement",
          "measure results"
        ],
        "engineIds": [
          "NTE-025"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA"
        ]
      },
      {
        "code": "F13.10",
        "name": "Quality analytics",
        "activities": [
          "Monitor defects",
          "yield",
          "complaints",
          "cost of quality",
          "trends"
        ],
        "engineIds": [
          "NTE-025",
          "NTE-033"
        ],
        "engineNames": [
          "Quality, Inspection, Test & CAPA",
          "BI, Semantic Analytics & Reporting"
        ]
      }
    ]
  },
  {
    "code": "F14",
    "name": "Finance, Accounting, Treasury & Tax",
    "subfunctionCount": 22,
    "activityCount": 96,
    "group": "services",
    "engines": [
      {
        "id": "NTE-026",
        "name": "Accounting, Ledger & Financial Close",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-027",
        "name": "Treasury, Cash & Tax",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F14.01",
        "name": "Financial strategy",
        "activities": [
          "Establish finance policies",
          "capital strategy",
          "financial objectives"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.02",
        "name": "Budgeting",
        "activities": [
          "Collect assumptions",
          "prepare budgets",
          "review",
          "approve",
          "revise"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.03",
        "name": "Forecasting",
        "activities": [
          "Produce rolling forecast",
          "model scenarios",
          "update outlook"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027",
          "NTE-033"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F14.04",
        "name": "General ledger",
        "activities": [
          "Maintain chart of accounts",
          "post journals",
          "reconcile",
          "close periods"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.05",
        "name": "Accounts payable",
        "activities": [
          "Receive invoice",
          "validate",
          "match",
          "approve",
          "pay",
          "reconcile"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.06",
        "name": "Accounts receivable",
        "activities": [
          "Generate invoice",
          "post receivable",
          "collect payment",
          "allocate cash"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.07",
        "name": "Credit management",
        "activities": [
          "Assess creditworthiness",
          "set limits",
          "monitor exposure",
          "suspend/release accounts"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.08",
        "name": "Collections",
        "activities": [
          "Identify overdue debt",
          "contact customer",
          "negotiate payment",
          "escalate",
          "write off"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.09",
        "name": "Expense management",
        "activities": [
          "Submit expenses",
          "validate",
          "approve",
          "reimburse",
          "audit"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.10",
        "name": "Fixed asset accounting",
        "activities": [
          "Capitalise asset",
          "depreciate",
          "transfer",
          "impair",
          "dispose"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.11",
        "name": "Cost accounting",
        "activities": [
          "Calculate product/service cost",
          "allocate overhead",
          "analyse variance"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.12",
        "name": "Financial close",
        "activities": [
          "Reconcile accounts",
          "post adjustments",
          "consolidate",
          "close period"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.13",
        "name": "Consolidation",
        "activities": [
          "Collect entity results",
          "eliminate intercompany",
          "translate currency",
          "consolidate"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.14",
        "name": "Financial reporting",
        "activities": [
          "Prepare P&L",
          "balance sheet",
          "cash flow",
          "management accounts",
          "statutory reports"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027",
          "NTE-033"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F14.15",
        "name": "Treasury",
        "activities": [
          "Manage cash",
          "liquidity",
          "bank accounts",
          "funding",
          "investments"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.16",
        "name": "Payments",
        "activities": [
          "Create payment run",
          "approve",
          "transmit",
          "confirm",
          "reconcile"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.17",
        "name": "Foreign exchange",
        "activities": [
          "Forecast exposure",
          "execute hedges",
          "settle",
          "monitor positions"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.18",
        "name": "Debt & financing",
        "activities": [
          "Arrange facilities",
          "draw funds",
          "repay",
          "monitor covenants"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.19",
        "name": "Tax",
        "activities": [
          "Calculate taxes",
          "file returns",
          "manage VAT/GST",
          "corporation tax",
          "withholding",
          "transfer pricing"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.20",
        "name": "Financial controls",
        "activities": [
          "Define controls",
          "perform reconciliations",
          "review exceptions",
          "certify controls"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027",
          "NTE-037"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F14.21",
        "name": "Profitability analysis",
        "activities": [
          "Calculate margin",
          "customer/product profitability",
          "cost-to-serve"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      },
      {
        "code": "F14.22",
        "name": "Capital expenditure",
        "activities": [
          "Submit request",
          "evaluate investment",
          "approve",
          "track spend",
          "review benefits"
        ],
        "engineIds": [
          "NTE-026",
          "NTE-027"
        ],
        "engineNames": [
          "Accounting, Ledger & Financial Close",
          "Treasury, Cash & Tax"
        ]
      }
    ]
  },
  {
    "code": "F15",
    "name": "Human Resources / Human Capital",
    "subfunctionCount": 20,
    "activityCount": 88,
    "group": "services",
    "engines": [
      {
        "id": "NTE-001",
        "name": "Party, Organisation & Identity",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-009",
        "name": "HCM Position, Deployment & Competence",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-028",
        "name": "Workforce, HCM, Payroll & Talent",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F15.01",
        "name": "People strategy",
        "activities": [
          "Define workforce strategy",
          "policies",
          "operating model",
          "priorities"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.02",
        "name": "Workforce planning",
        "activities": [
          "Forecast demand",
          "analyse capacity",
          "identify skills gaps",
          "develop workforce plan"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.03",
        "name": "Organisation design",
        "activities": [
          "Design organisation",
          "roles",
          "reporting structures",
          "spans/layers"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.04",
        "name": "Job architecture",
        "activities": [
          "Define jobs",
          "grades",
          "competencies",
          "career paths"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.05",
        "name": "Recruitment",
        "activities": [
          "Create requisition",
          "advertise",
          "source",
          "screen",
          "interview",
          "select",
          "offer"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.06",
        "name": "Pre-employment",
        "activities": [
          "Verify identity",
          "references",
          "qualifications",
          "background checks"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.07",
        "name": "Onboarding",
        "activities": [
          "Create employee record",
          "issue equipment",
          "induction",
          "mandatory training"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.08",
        "name": "Employee administration",
        "activities": [
          "Maintain personal/job information",
          "process transfers",
          "promotions",
          "status changes"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.09",
        "name": "Time & attendance",
        "activities": [
          "Record hours",
          "shifts",
          "overtime",
          "absence",
          "approve timesheets"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.10",
        "name": "Payroll",
        "activities": [
          "Calculate pay",
          "deductions",
          "tax",
          "approve",
          "pay employee",
          "reconcile"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.11",
        "name": "Compensation",
        "activities": [
          "Benchmark roles",
          "establish salary ranges",
          "review salaries",
          "administer bonuses"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.12",
        "name": "Benefits",
        "activities": [
          "Enrol employees",
          "administer pensions/insurance/benefits",
          "process changes"
        ],
        "engineIds": [
          "NTE-028",
          "NTE-013"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent",
          "Performance, KPI & Benefits"
        ]
      },
      {
        "code": "F15.13",
        "name": "Performance management",
        "activities": [
          "Set objectives",
          "check-in",
          "assess performance",
          "calibrate",
          "rate performance"
        ],
        "engineIds": [
          "NTE-028",
          "NTE-033"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F15.14",
        "name": "Learning & development",
        "activities": [
          "Identify needs",
          "create courses",
          "enrol learners",
          "deliver training",
          "assess competence"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.15",
        "name": "Talent management",
        "activities": [
          "Identify talent",
          "succession planning",
          "career development",
          "mobility"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.16",
        "name": "Employee engagement",
        "activities": [
          "Conduct surveys",
          "analyse sentiment",
          "develop engagement actions"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.17",
        "name": "Employee relations",
        "activities": [
          "Manage grievances",
          "disciplinary action",
          "disputes",
          "consultation"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.18",
        "name": "Absence management",
        "activities": [
          "Record absence",
          "manage return-to-work",
          "monitor trends"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.19",
        "name": "Offboarding",
        "activities": [
          "Record resignation",
          "retrieve assets",
          "revoke access",
          "final pay",
          "exit interview"
        ],
        "engineIds": [
          "NTE-028"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent"
        ]
      },
      {
        "code": "F15.20",
        "name": "HR analytics",
        "activities": [
          "Analyse headcount",
          "turnover",
          "absence",
          "diversity",
          "productivity",
          "workforce cost"
        ],
        "engineIds": [
          "NTE-028",
          "NTE-033"
        ],
        "engineNames": [
          "Workforce, HCM, Payroll & Talent",
          "BI, Semantic Analytics & Reporting"
        ]
      }
    ]
  },
  {
    "code": "F16",
    "name": "Information Technology",
    "subfunctionCount": 21,
    "activityCount": 95,
    "group": "services",
    "engines": [
      {
        "id": "NTE-002",
        "name": "Access, Responsibility & Authority",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-008",
        "name": "Events, Integration & Portability",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-029",
        "name": "IT Service & Configuration Management",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-030",
        "name": "DevOps, Platform & Endpoint Operations",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F16.01",
        "name": "IT strategy",
        "activities": [
          "Define technology strategy",
          "principles",
          "roadmap",
          "investment priorities"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.02",
        "name": "Enterprise architecture",
        "activities": [
          "Define business/data/application/technology architecture",
          "standards",
          "target state"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.03",
        "name": "Solution architecture",
        "activities": [
          "Assess requirements",
          "design solution",
          "review architecture",
          "approve design"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.04",
        "name": "Application management",
        "activities": [
          "Acquire/build",
          "configure",
          "test",
          "deploy",
          "maintain",
          "retire applications"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.05",
        "name": "Software development",
        "activities": [
          "Analyse requirements",
          "code",
          "review",
          "test",
          "release",
          "maintain"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.06",
        "name": "DevOps",
        "activities": [
          "Build pipelines",
          "automate tests",
          "deploy releases",
          "manage environments"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.07",
        "name": "Infrastructure",
        "activities": [
          "Provision servers/cloud/network/storage",
          "configure",
          "monitor",
          "maintain"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.08",
        "name": "Cloud management",
        "activities": [
          "Provision services",
          "govern subscriptions",
          "manage cost",
          "optimise resources"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.09",
        "name": "Network management",
        "activities": [
          "Configure network",
          "monitor availability",
          "troubleshoot",
          "optimise"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.10",
        "name": "Endpoint management",
        "activities": [
          "Provision devices",
          "configure",
          "patch",
          "monitor",
          "retire"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.11",
        "name": "Identity administration",
        "activities": [
          "Create account",
          "assign access",
          "modify",
          "disable",
          "periodically review"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.12",
        "name": "IT service desk",
        "activities": [
          "Log ticket",
          "classify",
          "prioritise",
          "resolve",
          "escalate",
          "close"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.13",
        "name": "Incident management",
        "activities": [
          "Detect incident",
          "restore service",
          "communicate",
          "close"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.14",
        "name": "Problem management",
        "activities": [
          "Identify recurring issue",
          "root-cause analysis",
          "develop permanent fix"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.15",
        "name": "Change management",
        "activities": [
          "Request change",
          "assess impact",
          "approve",
          "schedule",
          "implement",
          "review"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.16",
        "name": "Release management",
        "activities": [
          "Plan release",
          "package",
          "test",
          "approve",
          "deploy"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.17",
        "name": "Configuration management",
        "activities": [
          "Identify assets/configuration items",
          "record relationships",
          "audit configuration"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.18",
        "name": "IT asset management",
        "activities": [
          "Procure",
          "assign",
          "inventory",
          "licence",
          "recover",
          "dispose"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.19",
        "name": "Availability/capacity",
        "activities": [
          "Monitor performance",
          "forecast capacity",
          "resolve constraints"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.20",
        "name": "Disaster recovery",
        "activities": [
          "Establish recovery requirements",
          "backup",
          "replicate",
          "test recovery",
          "restore"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      },
      {
        "code": "F16.21",
        "name": "Technology vendor management",
        "activities": [
          "Select vendor",
          "manage licence",
          "contract",
          "SLA",
          "renewal"
        ],
        "engineIds": [
          "NTE-029",
          "NTE-030"
        ],
        "engineNames": [
          "IT Service & Configuration Management",
          "DevOps, Platform & Endpoint Operations"
        ]
      }
    ]
  },
  {
    "code": "F17",
    "name": "Data, Analytics & AI",
    "subfunctionCount": 17,
    "activityCount": 77,
    "group": "services",
    "engines": [
      {
        "id": "NTE-008",
        "name": "Events, Integration & Portability",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-031",
        "name": "Data Integration, Engineering & Lakehouse",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-032",
        "name": "Master Data, Catalogue & Governance",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-033",
        "name": "BI, Semantic Analytics & Reporting",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-034",
        "name": "AI, ML, Agents & Model Governance",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F17.01",
        "name": "Data strategy",
        "activities": [
          "Define data vision",
          "priorities",
          "architecture",
          "operating model"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.02",
        "name": "Data governance",
        "activities": [
          "Establish owners/stewards",
          "policies",
          "standards",
          "governance forums"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.03",
        "name": "Data architecture",
        "activities": [
          "Model domains",
          "integrations",
          "stores",
          "flows",
          "canonical models"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.04",
        "name": "Master data management",
        "activities": [
          "Create master record",
          "validate",
          "match",
          "merge",
          "enrich",
          "retire"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.05",
        "name": "Reference data",
        "activities": [
          "Define codes",
          "classifications",
          "hierarchies",
          "publish changes"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.06",
        "name": "Data quality",
        "activities": [
          "Define rules",
          "profile data",
          "detect defects",
          "remediate",
          "monitor"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.07",
        "name": "Data engineering",
        "activities": [
          "Extract",
          "transform",
          "load",
          "integrate",
          "orchestrate pipelines"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.08",
        "name": "Data platform",
        "activities": [
          "Provision warehouses/lakes",
          "manage compute/storage",
          "optimise performance"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.09",
        "name": "BI/reporting",
        "activities": [
          "Capture requirements",
          "build reports",
          "validate",
          "publish",
          "maintain"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.10",
        "name": "Analytics",
        "activities": [
          "Analyse data",
          "identify patterns",
          "model scenarios",
          "communicate insights"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.11",
        "name": "Data science",
        "activities": [
          "Prepare data",
          "engineer features",
          "train models",
          "validate models"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.12",
        "name": "AI development",
        "activities": [
          "Select use case",
          "develop model/system",
          "evaluate",
          "deploy"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.13",
        "name": "AI governance",
        "activities": [
          "Register models",
          "assess risk",
          "approve use",
          "monitor performance",
          "review bias"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.14",
        "name": "Model operations",
        "activities": [
          "Deploy model",
          "monitor drift",
          "retrain",
          "version",
          "retire"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.15",
        "name": "Metadata/catalogue",
        "activities": [
          "Catalogue datasets",
          "define lineage",
          "classify",
          "maintain business glossary"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.16",
        "name": "Data access",
        "activities": [
          "Request access",
          "approve",
          "provision",
          "review",
          "revoke"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      },
      {
        "code": "F17.17",
        "name": "Data lifecycle",
        "activities": [
          "Create",
          "retain",
          "archive",
          "delete",
          "dispose"
        ],
        "engineIds": [
          "NTE-031",
          "NTE-032",
          "NTE-033",
          "NTE-034"
        ],
        "engineNames": [
          "Data Integration, Engineering & Lakehouse",
          "Master Data, Catalogue & Governance",
          "BI, Semantic Analytics & Reporting",
          "AI, ML, Agents & Model Governance"
        ]
      }
    ]
  },
  {
    "code": "F18",
    "name": "Cybersecurity & Information Security",
    "subfunctionCount": 15,
    "activityCount": 64,
    "group": "services",
    "engines": [
      {
        "id": "NTE-002",
        "name": "Access, Responsibility & Authority",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-035",
        "name": "Cybersecurity Operations & Exposure",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F18.01",
        "name": "Security strategy",
        "activities": [
          "Define security objectives",
          "roadmap",
          "governance",
          "funding"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.02",
        "name": "Security policy",
        "activities": [
          "Create standards",
          "approve",
          "publish",
          "review compliance"
        ],
        "engineIds": [
          "NTE-035",
          "NTE-043"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure",
          "Knowledge, Document, Records & CDE"
        ]
      },
      {
        "code": "F18.03",
        "name": "Security architecture",
        "activities": [
          "Define controls",
          "review solution architecture",
          "approve exceptions"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.04",
        "name": "Identity & access security",
        "activities": [
          "Authenticate users",
          "authorise access",
          "privileged access",
          "access reviews"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.05",
        "name": "Vulnerability management",
        "activities": [
          "Discover assets",
          "scan",
          "prioritise vulnerabilities",
          "remediate",
          "verify"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.06",
        "name": "Patch security",
        "activities": [
          "Identify patches",
          "assess risk",
          "test",
          "deploy",
          "verify"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.07",
        "name": "Security monitoring",
        "activities": [
          "Collect logs",
          "correlate events",
          "detect anomalies",
          "investigate alerts"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.08",
        "name": "Security incident response",
        "activities": [
          "Detect",
          "triage",
          "contain",
          "eradicate",
          "recover",
          "review"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.09",
        "name": "Threat intelligence",
        "activities": [
          "Collect intelligence",
          "assess threats",
          "create indicators",
          "distribute alerts"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.10",
        "name": "Penetration testing",
        "activities": [
          "Define scope",
          "test",
          "document findings",
          "remediate",
          "retest"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.11",
        "name": "Application security",
        "activities": [
          "Threat model",
          "code scan",
          "dependency scan",
          "test",
          "remediate"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.12",
        "name": "Third-party security",
        "activities": [
          "Assess supplier",
          "review controls",
          "monitor risk",
          "manage remediation"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.13",
        "name": "Security awareness",
        "activities": [
          "Develop training",
          "conduct phishing simulations",
          "track completion"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.14",
        "name": "Cryptography",
        "activities": [
          "Manage keys",
          "certificates",
          "encryption policies",
          "certificate lifecycle"
        ],
        "engineIds": [
          "NTE-035"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure"
        ]
      },
      {
        "code": "F18.15",
        "name": "Security compliance",
        "activities": [
          "Map controls",
          "collect evidence",
          "test compliance",
          "remediate gaps"
        ],
        "engineIds": [
          "NTE-035",
          "NTE-037"
        ],
        "engineNames": [
          "Cybersecurity Operations & Exposure",
          "Risk, Compliance, Control & Audit"
        ]
      }
    ]
  },
  {
    "code": "F19",
    "name": "Legal & Corporate Secretariat",
    "subfunctionCount": 12,
    "activityCount": 51,
    "group": "services",
    "engines": [
      {
        "id": "NTE-036",
        "name": "Legal Matter, Contract & Entity",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-053",
        "name": "Construction Commercial & Contract Administration",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F19.01",
        "name": "Legal advisory",
        "activities": [
          "Interpret law",
          "provide advice",
          "review business decisions"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.02",
        "name": "Contract management",
        "activities": [
          "Draft",
          "review",
          "negotiate",
          "approve",
          "execute",
          "amend",
          "renew",
          "terminate"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.03",
        "name": "Contract repository",
        "activities": [
          "Store agreements",
          "extract obligations",
          "monitor milestones",
          "archive"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.04",
        "name": "Corporate legal",
        "activities": [
          "Establish entities",
          "maintain registrations",
          "statutory filings",
          "corporate records"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.05",
        "name": "Company secretariat",
        "activities": [
          "Manage board governance",
          "resolutions",
          "statutory books",
          "filings"
        ],
        "engineIds": [
          "NTE-036",
          "NTE-043"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity",
          "Knowledge, Document, Records & CDE"
        ]
      },
      {
        "code": "F19.06",
        "name": "Intellectual property",
        "activities": [
          "Register trademarks/patents",
          "maintain rights",
          "licence IP",
          "enforce rights"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.07",
        "name": "Litigation",
        "activities": [
          "Assess claim",
          "appoint counsel",
          "manage evidence",
          "negotiate settlement",
          "litigate"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.08",
        "name": "Regulatory legal",
        "activities": [
          "Interpret regulation",
          "assess changes",
          "advise implementation"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.09",
        "name": "Employment legal",
        "activities": [
          "Review contracts",
          "disputes",
          "restructuring",
          "employee matters"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.10",
        "name": "Legal spend",
        "activities": [
          "Appoint law firms",
          "approve matters",
          "review invoices",
          "monitor spend"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      },
      {
        "code": "F19.11",
        "name": "Legal hold/eDiscovery",
        "activities": [
          "Issue hold",
          "preserve information",
          "search",
          "collect",
          "disclose"
        ],
        "engineIds": [
          "NTE-036",
          "NTE-043",
          "NTE-038"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity",
          "Knowledge, Document, Records & CDE",
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F19.12",
        "name": "Legal obligations",
        "activities": [
          "Identify obligations",
          "assign owners",
          "monitor compliance"
        ],
        "engineIds": [
          "NTE-036"
        ],
        "engineNames": [
          "Legal Matter, Contract & Entity"
        ]
      }
    ]
  },
  {
    "code": "F20",
    "name": "Risk, Compliance, Internal Control & Audit",
    "subfunctionCount": 16,
    "activityCount": 63,
    "group": "services",
    "engines": [
      {
        "id": "NTE-002",
        "name": "Access, Responsibility & Authority",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-004",
        "name": "Lifecycle, Decision & Evidence",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-037",
        "name": "Risk, Compliance, Control & Audit",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F20.01",
        "name": "Risk framework",
        "activities": [
          "Establish taxonomy",
          "appetite",
          "methodology",
          "governance"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.02",
        "name": "Risk identification",
        "activities": [
          "Identify risks",
          "describe causes/events/impacts",
          "assign owner"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.03",
        "name": "Risk assessment",
        "activities": [
          "Assess likelihood",
          "impact",
          "inherent/residual risk",
          "control effectiveness"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.04",
        "name": "Risk treatment",
        "activities": [
          "Avoid",
          "reduce",
          "transfer",
          "accept",
          "develop treatment plan"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.05",
        "name": "Risk monitoring",
        "activities": [
          "Track KRIs",
          "reassess risk",
          "identify emerging risks",
          "escalate"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.06",
        "name": "Regulatory compliance",
        "activities": [
          "Identify regulation",
          "interpret requirements",
          "implement controls",
          "attest compliance"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.07",
        "name": "Compliance monitoring",
        "activities": [
          "Test compliance",
          "detect breaches",
          "record exceptions",
          "remediate"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.08",
        "name": "Control management",
        "activities": [
          "Define controls",
          "assign owners",
          "execute control",
          "retain evidence"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.09",
        "name": "Control testing",
        "activities": [
          "Select sample",
          "test design",
          "test operation",
          "record deficiency"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.10",
        "name": "Internal audit planning",
        "activities": [
          "Define audit universe",
          "assess risk",
          "establish audit plan"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.11",
        "name": "Audit execution",
        "activities": [
          "Define scope",
          "collect evidence",
          "test",
          "interview",
          "document findings"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.12",
        "name": "Audit reporting",
        "activities": [
          "Classify findings",
          "issue report",
          "agree actions",
          "report to committee"
        ],
        "engineIds": [
          "NTE-037",
          "NTE-033"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F20.13",
        "name": "Issue/remediation",
        "activities": [
          "Register issue",
          "assign action",
          "set due date",
          "monitor",
          "validate closure"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.14",
        "name": "Fraud risk",
        "activities": [
          "Assess fraud scenarios",
          "monitor indicators",
          "investigate suspected fraud"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.15",
        "name": "Ethics & conduct",
        "activities": [
          "Manage declarations",
          "conflicts",
          "gifts/hospitality",
          "whistleblowing"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F20.16",
        "name": "Assurance coordination",
        "activities": [
          "Map assurance providers",
          "coordinate testing",
          "reduce duplication"
        ],
        "engineIds": [
          "NTE-037"
        ],
        "engineNames": [
          "Risk, Compliance, Control & Audit"
        ]
      }
    ]
  },
  {
    "code": "F21",
    "name": "Privacy & Information Governance",
    "subfunctionCount": 9,
    "activityCount": 33,
    "group": "services",
    "engines": [
      {
        "id": "NTE-038",
        "name": "Privacy & Information Governance",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F21.01",
        "name": "Privacy governance",
        "activities": [
          "Establish policies",
          "appoint responsibilities",
          "maintain privacy framework"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.02",
        "name": "Processing inventory",
        "activities": [
          "Record processing activity",
          "data categories",
          "purpose",
          "recipients",
          "retention"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.03",
        "name": "Privacy impact assessment",
        "activities": [
          "Identify processing",
          "assess risk",
          "establish controls",
          "approve"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.04",
        "name": "Consent/preferences",
        "activities": [
          "Capture consent",
          "maintain preferences",
          "withdraw consent"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.05",
        "name": "Data subject rights",
        "activities": [
          "Receive request",
          "verify identity",
          "search",
          "review",
          "respond"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.06",
        "name": "Privacy incidents",
        "activities": [
          "Assess breach",
          "contain",
          "investigate",
          "determine notification requirements"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.07",
        "name": "International transfers",
        "activities": [
          "Assess transfer",
          "establish safeguards",
          "document decision"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.08",
        "name": "Retention",
        "activities": [
          "Define retention schedule",
          "apply retention",
          "destroy information"
        ],
        "engineIds": [
          "NTE-038"
        ],
        "engineNames": [
          "Privacy & Information Governance"
        ]
      },
      {
        "code": "F21.09",
        "name": "Privacy assurance",
        "activities": [
          "Conduct reviews",
          "monitor controls",
          "report compliance"
        ],
        "engineIds": [
          "NTE-038",
          "NTE-037"
        ],
        "engineNames": [
          "Privacy & Information Governance",
          "Risk, Compliance, Control & Audit"
        ]
      }
    ]
  },
  {
    "code": "F22",
    "name": "Property, Facilities & Physical Assets",
    "subfunctionCount": 14,
    "activityCount": 57,
    "group": "assets",
    "engines": [
      {
        "id": "NTE-039",
        "name": "Asset, Property, Facilities & Maintenance",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-051",
        "name": "Survey, GIS & Reality Capture",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-056",
        "name": "Commissioning, Handover & Asset Information",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-057",
        "name": "Digital Twin & Operational Asset Information",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F22.01",
        "name": "Asset strategy",
        "activities": [
          "Define asset requirements",
          "lifecycle strategy",
          "replacement policy"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.02",
        "name": "Capital planning",
        "activities": [
          "Identify need",
          "develop business case",
          "prioritise investment"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.03",
        "name": "Asset acquisition",
        "activities": [
          "Specify asset",
          "procure",
          "receive",
          "commission",
          "capitalise"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.04",
        "name": "Property acquisition",
        "activities": [
          "Search property",
          "assess",
          "negotiate",
          "acquire/lease"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.05",
        "name": "Construction/project delivery",
        "activities": [
          "Design",
          "permit",
          "construct",
          "inspect",
          "commission",
          "hand over"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.06",
        "name": "Asset register",
        "activities": [
          "Create asset record",
          "tag",
          "classify",
          "locate",
          "update"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.07",
        "name": "Preventive maintenance",
        "activities": [
          "Develop maintenance plan",
          "schedule",
          "perform",
          "record"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.08",
        "name": "Reactive maintenance",
        "activities": [
          "Report fault",
          "diagnose",
          "repair",
          "test",
          "close"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.09",
        "name": "Reliability",
        "activities": [
          "Analyse failures",
          "monitor condition",
          "predict maintenance"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.10",
        "name": "Facilities operations",
        "activities": [
          "Manage cleaning",
          "utilities",
          "workplace",
          "catering",
          "grounds"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.11",
        "name": "Space management",
        "activities": [
          "Allocate space",
          "manage occupancy",
          "moves/adds/changes"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.12",
        "name": "Lease management",
        "activities": [
          "Maintain lease",
          "calculate obligations",
          "renew",
          "terminate"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.13",
        "name": "Utilities management",
        "activities": [
          "Monitor energy/water",
          "manage contracts",
          "optimise consumption"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      },
      {
        "code": "F22.14",
        "name": "Asset disposal",
        "activities": [
          "Assess condition",
          "approve disposal",
          "sell/recycle",
          "remove asset record"
        ],
        "engineIds": [
          "NTE-039"
        ],
        "engineNames": [
          "Asset, Property, Facilities & Maintenance"
        ]
      }
    ]
  },
  {
    "code": "F23",
    "name": "Health, Safety, Environment & Sustainability",
    "subfunctionCount": 14,
    "activityCount": 55,
    "group": "assets",
    "engines": [
      {
        "id": "NTE-040",
        "name": "HSE, Permit, Environment & ESG",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F23.01",
        "name": "H&S management",
        "activities": [
          "Establish safety framework",
          "policies",
          "objectives",
          "responsibilities"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.02",
        "name": "Hazard identification",
        "activities": [
          "Identify hazards",
          "assess risk",
          "establish controls"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.03",
        "name": "Workplace inspections",
        "activities": [
          "Schedule inspection",
          "inspect",
          "record findings",
          "assign corrective actions"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.04",
        "name": "Incident management",
        "activities": [
          "Report incident",
          "investigate",
          "root cause",
          "corrective action"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.05",
        "name": "Occupational health",
        "activities": [
          "Assess exposure",
          "conduct surveillance",
          "manage workplace health programmes"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.06",
        "name": "Permit-to-work",
        "activities": [
          "Request permit",
          "assess hazards",
          "approve",
          "monitor",
          "close"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.07",
        "name": "Environmental management",
        "activities": [
          "Identify impacts",
          "monitor compliance",
          "implement controls"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.08",
        "name": "Waste management",
        "activities": [
          "Classify waste",
          "store",
          "transport",
          "recycle",
          "dispose",
          "record"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.09",
        "name": "Carbon management",
        "activities": [
          "Calculate emissions",
          "establish baseline",
          "set target",
          "implement reductions"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.10",
        "name": "Energy management",
        "activities": [
          "Measure energy",
          "identify efficiency measures",
          "implement",
          "verify savings"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.11",
        "name": "Sustainability strategy",
        "activities": [
          "Establish ESG objectives",
          "initiatives",
          "commitments"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.12",
        "name": "ESG reporting",
        "activities": [
          "Collect metrics",
          "validate",
          "calculate",
          "disclose",
          "assure"
        ],
        "engineIds": [
          "NTE-040",
          "NTE-033"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F23.13",
        "name": "Sustainable supply chain",
        "activities": [
          "Establish supplier requirements",
          "assess supplier ESG",
          "remediate"
        ],
        "engineIds": [
          "NTE-040"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG"
        ]
      },
      {
        "code": "F23.14",
        "name": "Environmental compliance",
        "activities": [
          "Monitor permits",
          "sample/test",
          "submit returns",
          "correct non-compliance"
        ],
        "engineIds": [
          "NTE-040",
          "NTE-037"
        ],
        "engineNames": [
          "HSE, Permit, Environment & ESG",
          "Risk, Compliance, Control & Audit"
        ]
      }
    ]
  },
  {
    "code": "F24",
    "name": "Business Continuity, Crisis & Physical Security",
    "subfunctionCount": 12,
    "activityCount": 45,
    "group": "assets",
    "engines": [
      {
        "id": "NTE-041",
        "name": "Continuity, Crisis & Physical Security",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F24.01",
        "name": "Business continuity governance",
        "activities": [
          "Establish BC framework",
          "policies",
          "ownership",
          "review cycle"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.02",
        "name": "Business impact analysis",
        "activities": [
          "Identify critical activities",
          "dependencies",
          "impact",
          "recovery objectives"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.03",
        "name": "Continuity planning",
        "activities": [
          "Develop response/recovery strategies",
          "document plans",
          "assign roles"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.04",
        "name": "Continuity testing",
        "activities": [
          "Design exercise",
          "simulate disruption",
          "evaluate response",
          "remediate gaps"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.05",
        "name": "Crisis management",
        "activities": [
          "Detect crisis",
          "activate team",
          "assess severity",
          "coordinate response"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.06",
        "name": "Emergency response",
        "activities": [
          "Raise alarm",
          "evacuate",
          "account for people",
          "contact emergency services"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.07",
        "name": "Crisis communications",
        "activities": [
          "Prepare messaging",
          "approve",
          "notify employees/customers/media"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.08",
        "name": "Disaster recovery coordination",
        "activities": [
          "Activate recovery",
          "restore systems/sites",
          "validate service"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.09",
        "name": "Physical security",
        "activities": [
          "Control access",
          "monitor premises",
          "patrol",
          "respond to alarms"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.10",
        "name": "Visitor management",
        "activities": [
          "Register visitor",
          "verify identity",
          "approve access",
          "issue/recover pass"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.11",
        "name": "Security investigations",
        "activities": [
          "Receive allegation",
          "gather evidence",
          "interview",
          "determine outcome"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      },
      {
        "code": "F24.12",
        "name": "Travel security",
        "activities": [
          "Assess destinations",
          "communicate risks",
          "track travellers",
          "respond to incidents"
        ],
        "engineIds": [
          "NTE-041"
        ],
        "engineNames": [
          "Continuity, Crisis & Physical Security"
        ]
      }
    ]
  },
  {
    "code": "F25",
    "name": "Communications, Public Affairs & Investor Relations",
    "subfunctionCount": 12,
    "activityCount": 44,
    "group": "assets",
    "engines": [
      {
        "id": "NTE-042",
        "name": "Communications, Media, Public Affairs & IR",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F25.01",
        "name": "Corporate communications",
        "activities": [
          "Define communication strategy",
          "develop messaging",
          "publish communications"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.02",
        "name": "Internal communications",
        "activities": [
          "Prepare announcements",
          "newsletters",
          "intranet content",
          "leadership communications"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.03",
        "name": "Media relations",
        "activities": [
          "Build media relationships",
          "prepare releases",
          "respond to enquiries",
          "organise interviews"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.04",
        "name": "Public relations",
        "activities": [
          "Plan campaigns",
          "manage reputation",
          "coordinate external communications"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.05",
        "name": "Reputation management",
        "activities": [
          "Monitor sentiment",
          "identify issues",
          "develop response",
          "measure perception"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.06",
        "name": "Public affairs",
        "activities": [
          "Monitor government activity",
          "analyse policy",
          "engage stakeholders"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.07",
        "name": "Government relations",
        "activities": [
          "Map officials",
          "conduct engagement",
          "prepare submissions",
          "track commitments"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.08",
        "name": "Investor relations",
        "activities": [
          "Prepare results communications",
          "investor presentations",
          "manage enquiries"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.09",
        "name": "Annual reporting",
        "activities": [
          "Gather content",
          "prepare narrative",
          "review",
          "approve",
          "publish"
        ],
        "engineIds": [
          "NTE-042",
          "NTE-033"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR",
          "BI, Semantic Analytics & Reporting"
        ]
      },
      {
        "code": "F25.10",
        "name": "Stakeholder engagement",
        "activities": [
          "Identify stakeholders",
          "map interests",
          "plan engagement",
          "record feedback"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.11",
        "name": "Community relations",
        "activities": [
          "Manage local engagement",
          "sponsorship",
          "community programmes"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      },
      {
        "code": "F25.12",
        "name": "Crisis communications",
        "activities": [
          "Develop response message",
          "approve spokesperson",
          "monitor media",
          "respond"
        ],
        "engineIds": [
          "NTE-042"
        ],
        "engineNames": [
          "Communications, Media, Public Affairs & IR"
        ]
      }
    ]
  },
  {
    "code": "F26",
    "name": "Knowledge, Document & Records Management",
    "subfunctionCount": 10,
    "activityCount": 43,
    "group": "delivery",
    "engines": [
      {
        "id": "NTE-004",
        "name": "Lifecycle, Decision & Evidence",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-005",
        "name": "Information, Revision & Representation",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-006",
        "name": "Change, Configuration & Baseline",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-010",
        "name": "Enterprise Search & Knowledge Retrieval",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-043",
        "name": "Knowledge, Document, Records & CDE",
        "state": "PARTIAL"
      },
      {
        "id": "NTE-049",
        "name": "CAD, BIM & Parametric Design Authoring",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F26.01",
        "name": "Knowledge strategy",
        "activities": [
          "Identify critical knowledge",
          "define governance",
          "establish knowledge platforms"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.02",
        "name": "Knowledge capture",
        "activities": [
          "Document experience",
          "lessons learned",
          "expertise",
          "procedures"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.03",
        "name": "Knowledge sharing",
        "activities": [
          "Publish knowledge",
          "communities of practice",
          "collaboration",
          "search"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.04",
        "name": "Knowledge maintenance",
        "activities": [
          "Review articles",
          "update",
          "approve",
          "retire obsolete content"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.05",
        "name": "Document management",
        "activities": [
          "Create",
          "classify",
          "review",
          "approve",
          "version",
          "publish"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.06",
        "name": "Records management",
        "activities": [
          "Declare record",
          "classify",
          "retain",
          "archive",
          "dispose"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.07",
        "name": "Controlled documents",
        "activities": [
          "Draft procedure",
          "approve",
          "issue revision",
          "withdraw obsolete versions"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010",
          "NTE-037"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F26.08",
        "name": "Records retention",
        "activities": [
          "Establish schedules",
          "apply holds",
          "review retention",
          "destroy"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.09",
        "name": "Enterprise search",
        "activities": [
          "Index information",
          "maintain metadata",
          "tune search",
          "manage permissions"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      },
      {
        "code": "F26.10",
        "name": "Lessons learned",
        "activities": [
          "Capture lesson",
          "classify",
          "approve",
          "disseminate",
          "incorporate into process"
        ],
        "engineIds": [
          "NTE-043",
          "NTE-010"
        ],
        "engineNames": [
          "Knowledge, Document, Records & CDE",
          "Enterprise Search & Knowledge Retrieval"
        ]
      }
    ]
  },
  {
    "code": "F27",
    "name": "Portfolio, Programme & Project Management",
    "subfunctionCount": 10,
    "activityCount": 43,
    "group": "delivery",
    "engines": [
      {
        "id": "NTE-007",
        "name": "Deliverable, Issue & Acceptance",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-044",
        "name": "Portfolio, Programme, Project & Resource",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-045",
        "name": "Project Controls, CPM, 4D & EVM",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-049",
        "name": "CAD, BIM & Parametric Design Authoring",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-050",
        "name": "Engineering Analysis & Calculation",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-051",
        "name": "Survey, GIS & Reality Capture",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-052",
        "name": "Estimating, Measurement, Cost Planning & BoQ",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-053",
        "name": "Construction Commercial & Contract Administration",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-054",
        "name": "Construction Site Production & Field Evidence",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-055",
        "name": "Fabrication & Off-site Production",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-056",
        "name": "Commissioning, Handover & Asset Information",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F27.01",
        "name": "Portfolio management",
        "activities": [
          "Capture initiatives",
          "score",
          "prioritise",
          "approve",
          "balance portfolio"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.02",
        "name": "Investment governance",
        "activities": [
          "Develop business case",
          "review",
          "approve/reject",
          "release funding"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.03",
        "name": "Programme management",
        "activities": [
          "Establish programme",
          "coordinate projects",
          "manage dependencies",
          "report outcomes"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.04",
        "name": "Project initiation",
        "activities": [
          "Define scope",
          "objectives",
          "sponsor",
          "stakeholders",
          "charter"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.05",
        "name": "Project planning",
        "activities": [
          "Build schedule",
          "budget",
          "resource plan",
          "risk plan"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.06",
        "name": "Project execution",
        "activities": [
          "Assign work",
          "deliver outputs",
          "monitor progress",
          "manage issues"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.07",
        "name": "Project control",
        "activities": [
          "Manage scope",
          "budget",
          "schedule",
          "risks",
          "quality"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045",
          "NTE-037"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F27.08",
        "name": "Project closure",
        "activities": [
          "Obtain acceptance",
          "close finances",
          "release resources",
          "capture lessons"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.09",
        "name": "PMO",
        "activities": [
          "Establish standards",
          "templates",
          "reporting",
          "assurance",
          "governance"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      },
      {
        "code": "F27.10",
        "name": "Resource management",
        "activities": [
          "Forecast demand",
          "allocate resources",
          "monitor utilisation"
        ],
        "engineIds": [
          "NTE-044",
          "NTE-045"
        ],
        "engineNames": [
          "Portfolio, Programme, Project & Resource",
          "Project Controls, CPM, 4D & EVM"
        ]
      }
    ]
  },
  {
    "code": "F28",
    "name": "Change & Transformation Management",
    "subfunctionCount": 8,
    "activityCount": 29,
    "group": "delivery",
    "engines": [
      {
        "id": "NTE-046",
        "name": "Transformation, Change & Adoption",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F28.01",
        "name": "Transformation strategy",
        "activities": [
          "Define target state",
          "transformation roadmap",
          "governance"
        ],
        "engineIds": [
          "NTE-046"
        ],
        "engineNames": [
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F28.02",
        "name": "Change impact assessment",
        "activities": [
          "Identify affected processes",
          "roles",
          "systems",
          "stakeholders"
        ],
        "engineIds": [
          "NTE-046"
        ],
        "engineNames": [
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F28.03",
        "name": "Stakeholder management",
        "activities": [
          "Identify stakeholders",
          "assess influence",
          "develop engagement plan"
        ],
        "engineIds": [
          "NTE-046"
        ],
        "engineNames": [
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F28.04",
        "name": "Change communications",
        "activities": [
          "Develop messages",
          "communication plan",
          "issue communications"
        ],
        "engineIds": [
          "NTE-046"
        ],
        "engineNames": [
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F28.05",
        "name": "Training/readiness",
        "activities": [
          "Assess skills",
          "develop training",
          "deliver",
          "assess readiness"
        ],
        "engineIds": [
          "NTE-046"
        ],
        "engineNames": [
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F28.06",
        "name": "Adoption management",
        "activities": [
          "Monitor adoption",
          "identify resistance",
          "intervene",
          "reinforce"
        ],
        "engineIds": [
          "NTE-046"
        ],
        "engineNames": [
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F28.07",
        "name": "Organisational transition",
        "activities": [
          "Transition roles",
          "structures",
          "processes",
          "technology"
        ],
        "engineIds": [
          "NTE-046"
        ],
        "engineNames": [
          "Transformation, Change & Adoption"
        ]
      },
      {
        "code": "F28.08",
        "name": "Benefits tracking",
        "activities": [
          "Establish benefit targets",
          "monitor",
          "validate",
          "report"
        ],
        "engineIds": [
          "NTE-046",
          "NTE-013"
        ],
        "engineNames": [
          "Transformation, Change & Adoption",
          "Performance, KPI & Benefits"
        ]
      }
    ]
  },
  {
    "code": "F29",
    "name": "Business Process & Continuous Improvement",
    "subfunctionCount": 10,
    "activityCount": 39,
    "group": "delivery",
    "engines": [
      {
        "id": "NTE-003",
        "name": "Workflow, Work & Assignment",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-047",
        "name": "Process Architecture, BPMN/DMN & Orchestration",
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-048",
        "name": "Process Mining & Continuous Improvement",
        "state": "TO_BUILD"
      }
    ],
    "subfunctions": [
      {
        "code": "F29.01",
        "name": "Process architecture",
        "activities": [
          "Define process hierarchy",
          "assign process IDs",
          "map relationships"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement"
        ]
      },
      {
        "code": "F29.02",
        "name": "Process ownership",
        "activities": [
          "Appoint owner",
          "define accountability",
          "establish governance"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement"
        ]
      },
      {
        "code": "F29.03",
        "name": "Process modelling",
        "activities": [
          "Discover process",
          "map current state",
          "document inputs/outputs/controls"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement"
        ]
      },
      {
        "code": "F29.04",
        "name": "Process analysis",
        "activities": [
          "Measure cycle time",
          "cost",
          "defects",
          "hand-offs",
          "bottlenecks"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement"
        ]
      },
      {
        "code": "F29.05",
        "name": "Process redesign",
        "activities": [
          "Design future state",
          "eliminate waste",
          "simplify",
          "standardise"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement"
        ]
      },
      {
        "code": "F29.06",
        "name": "SOP management",
        "activities": [
          "Draft procedure",
          "review",
          "approve",
          "publish",
          "revise"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048",
          "NTE-043"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement",
          "Knowledge, Document, Records & CDE"
        ]
      },
      {
        "code": "F29.07",
        "name": "Workflow automation",
        "activities": [
          "Identify automation opportunity",
          "configure workflow",
          "test",
          "deploy"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement"
        ]
      },
      {
        "code": "F29.08",
        "name": "Continuous improvement",
        "activities": [
          "Capture idea",
          "evaluate",
          "implement",
          "measure result"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement"
        ]
      },
      {
        "code": "F29.09",
        "name": "Process compliance",
        "activities": [
          "Monitor execution",
          "detect deviation",
          "investigate",
          "remediate"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048",
          "NTE-037"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement",
          "Risk, Compliance, Control & Audit"
        ]
      },
      {
        "code": "F29.10",
        "name": "Process performance",
        "activities": [
          "Define KPI",
          "collect data",
          "analyse performance",
          "initiate improvement"
        ],
        "engineIds": [
          "NTE-047",
          "NTE-048",
          "NTE-033"
        ],
        "engineNames": [
          "Process Architecture, BPMN/DMN & Orchestration",
          "Process Mining & Continuous Improvement",
          "BI, Semantic Analytics & Reporting"
        ]
      }
    ]
  }
];

export function getFunction(code: string): FunctionSummary | undefined {
  return functions.find((item) => item.code.toLowerCase() === code.toLowerCase());
}

export function functionsForGroup(groupId: string): FunctionSummary[] {
  return functions.filter((item) => item.group === groupId);
}
