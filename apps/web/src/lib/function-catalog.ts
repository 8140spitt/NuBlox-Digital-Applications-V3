export type NativeEngineSummary = {
  id: string;
  name: string;
  state: string;
};

export type FunctionSummary = {
  code: string;
  name: string;
  subfunctionCount: number;
  activityCount: number;
  group: string;
  engines: NativeEngineSummary[];
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
        "state": "TO_BUILD"
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
        "state": "TO_BUILD"
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
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-055",
        "name": "Fabrication & Off-site Production",
        "state": "TO_BUILD"
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
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-054",
        "name": "Construction Site Production & Field Evidence",
        "state": "TO_BUILD"
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
        "name": "Functional Deployment & Competence",
        "state": "IMPLEMENTED_PLATFORM"
      },
      {
        "id": "NTE-028",
        "name": "Workforce, HCM, Payroll & Talent",
        "state": "TO_BUILD"
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
        "state": "TO_BUILD"
      },
      {
        "id": "NTE-049",
        "name": "CAD, BIM & Parametric Design Authoring",
        "state": "TO_BUILD"
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
    ]
  }
];

export function getFunction(code: string): FunctionSummary | undefined {
  return functions.find((item) => item.code.toLowerCase() === code.toLowerCase());
}

export function functionsForGroup(groupId: string): FunctionSummary[] {
  return functions.filter((item) => item.group === groupId);
}
