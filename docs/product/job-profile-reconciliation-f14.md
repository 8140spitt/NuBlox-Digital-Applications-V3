# F14 Job Profile Reconciliation — Finance, Accounting, Treasury & Tax

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026  
**Function:** F14 Finance, Accounting, Treasury & Tax

## Result

All F14 source Job Profiles now have an explicit employment treatment.

### Leadership

- Head of Finance

### Professional employment roles

- Financial Strategy Specialist
- Budgeting Specialist
- Forecasting Specialist
- General Ledger Accountant
- Accounts Payable Specialist
- Accounts Receivable Specialist
- Credit Controller
- Collections Specialist
- Expense Manager
- Fixed Asset Accountant
- Cost Accountant
- Financial Close Accountant
- Group Consolidation Accountant
- Financial Reporting Accountant
- Treasury Specialist
- Payments Specialist
- Treasury FX Specialist
- Corporate Finance Specialist
- Tax Specialist
- Financial Controls Manager
- Commercial Finance Analyst
- Capital Investment Analyst

## Employment-model decision

The finance catalogue is intentionally **not collapsed** into one generic Accountant or Finance Manager role.

A sophisticated enterprise may separately staff AP, AR, credit, collections, GL, close, consolidation, reporting, treasury, tax, controls, commercial finance and investment analysis.

Related profiles can be grouped into Position-level job families without destroying the reusable Job Profiles:

```text
FP&A / strategic finance family
  -> Financial Strategy
  -> Budgeting
  -> Forecasting
  -> Commercial Finance

Record-to-report family
  -> General Ledger
  -> Financial Close
  -> Group Consolidation
  -> Financial Reporting

Treasury family
  -> Treasury / Liquidity
  -> Payments
  -> FX
  -> Debt / Financing
```

A smaller organisation may combine several of these profiles into one Position. A large organisation may separate them and add grade/region/business-unit scope.

## Critical authority principle

Finance Job Profiles **do not grant transaction authority**.

Examples:

- Accounts Payable Specialist does not automatically gain payment approval.
- General Ledger Accountant does not automatically gain unrestricted journal posting/approval.
- Payments Specialist does not automatically approve the payment run they prepared.
- Capital Investment Analyst does not automatically approve the investment.
- Financial Controls Manager cannot be assumed to certify their own control operation.

Actual access comes from Position assignment, scope, Access Roles, permissions and delegated authority.

## Canonical-model findings

The activity trace exposed several overly broad finance objects:

1. Budget, forecast, financial planning, profitability analysis and capex approval are bundled into one Budget / Forecast / Capex model.
2. Ledger, financial close, consolidation, reporting and controls are bundled into one Ledger / Financial Control model.
3. Cash, bank accounts, payment runs, FX and debt facilities are bundled into one Treasury / Cash model.
4. Capital investment has no sufficiently distinct governed request/decision/benefits lifecycle.
5. Finance maker-checker and separation-of-duties semantics require explicit authority-policy modelling, not only workflow steps.

These are recorded in `job-profile-reconciliation-architecture-gap-register.csv`.

## Next F14 product-definition work

For each retained finance Job Profile:

- explicit Work Products;
- exact source activity mapping;
- accounting-period and effective-date semantics;
- immutable transaction/posting evidence;
- calculation/version provenance;
- maker/checker/approver separation;
- delegated financial authority;
- entity/business-unit/project/cost-code scope;
- downstream ledger, cash, tax and reporting consequences;
- Position-level Job Workbench composition;
- end-to-end finance acceptance scenarios.

The acceptance test must prove that a worker can perform their job **without** their Job Profile becoming an uncontrolled permission bundle.
