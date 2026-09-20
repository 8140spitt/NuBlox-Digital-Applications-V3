# J1 Work-Product Wave 6 — Commercial, Customer & Supply Chain

**Status:** candidate explicit Work-Product decomposition  
**Date:** 20 September 2026  
**Functions:** F07-F10  
**Jobs:** 55  
**Work Products:** 247

Wave 6 covers the end-to-end commercial/customer/supply chain operating chain:

- F07 Sales & Commercial Management;
- F08 Customer Experience & Success;
- F09 Procurement & Supplier Management;
- F10 Supply Chain & Logistics.

Rows use the Wave 5 enhanced traceability standard: Work-Product family plus exact source Activity IDs.

## Design rules

- Opportunity is distinct from Pipeline and Sales Forecast.
- Customer Case is a case shell, not a substitute for complaint, return/refund, warranty, support, success or retention semantics.
- Supplier Party identity remains canonical; discovery, qualification, onboarding and relationship management are lifecycle/case records around that identity.
- Purchase Requisition and Purchase Order are distinct commitments with different authority.
- Demand Forecast, S&OP, Supply Plan, Inventory Plan and Material Requirements are related planning outputs, not one generic plan.
- Warehouse movement, stock count, shipment/distribution and customs/trade records retain separate operational truth.
- Job Profile accountability never grants pricing, discount, contract, refund, purchase or inventory-adjustment authority.

## Coverage impact

```text
Before Wave 6: 150 / 462 jobs had explicit Work-Product treatment
Wave 6:        +55 jobs / 247 Work Products
After Wave 6: 205 / 462 jobs have explicit Work-Product treatment
Remaining:    257 jobs
```

Coverage is still candidate-explicit until canonical ownership, lifecycle/effectivity, delegated authority, separation-of-duties and Job Workbench acceptance are validated.
