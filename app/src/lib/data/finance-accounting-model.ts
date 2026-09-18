export type FinanceAccountingKind =
  | 'ledger-context'
  | 'master-data'
  | 'reference'
  | 'plan'
  | 'transaction'
  | 'posting-evidence'
  | 'projection'
  | 'control-record'
  | 'accounting-record'
  | 'treasury-record'
  | 'foundation-reference';

export type FinanceAccountingDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: FinanceAccountingKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type FinanceAccountingRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type FinanceAccountingBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

const def = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: FinanceAccountingKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[],
  scope: string[] = ['legal entity', 'ledger/accounting context']
): FinanceAccountingDefinition => ({
  modelId,
  candidateKeys,
  canonicalName,
  kind,
  definition,
  identityRule,
  scope,
  keyData,
  lifecycle,
  governance
});

export const financeAccountingModel: FinanceAccountingDefinition[] = [
  def(
    'FIN-LEDGER',
    [],
    'Ledger',
    'ledger-context',
    'A governed accounting book for one Legal Entity, accounting basis and currency/context in which immutable postings are recorded.',
    'Stable Ledger identity; accounting basis, book type and Legal Entity are explicit. A Ledger never creates a duplicate Legal Entity or Project identity.',
    ['ledger code', 'legal entity', 'accounting basis', 'base currency', 'calendar', 'status'],
    ['Planned', 'Active', 'Restricted', 'Closed'],
    [
      'Ledger is the accounting context, not the business source of a transaction.',
      'Multiple ledgers may report the same Legal Entity under different governed accounting bases without duplicating business objects.'
    ]
  ),
  def(
    'FIN-CHART-OF-ACCOUNTS',
    ['BOF-19-001'],
    'Chart of Accounts',
    'master-data',
    'A governed account-classification structure used by one or more Ledgers.',
    'Stable chart identity; versions/effectivity govern structural change.',
    ['chart code', 'name', 'effective version', 'account hierarchy'],
    ['Draft', 'Approved', 'Active', 'Superseded', 'Retired'],
    [
      'Chart of Accounts classifies postings; it does not replace Financial Dimensions or operational business objects.'
    ]
  ),
  def(
    'FIN-GL-ACCOUNT',
    ['BOF-19-002'],
    'GL Account',
    'master-data',
    'A governed general-ledger account within a Chart of Accounts.',
    'Stable account identity within the chart; account code is a governed business identifier.',
    [
      'account code',
      'name',
      'account type',
      'normal balance',
      'posting controls',
      'effective dates'
    ],
    ['Draft', 'Active', 'Blocked', 'Retired'],
    [
      'GL Account expresses accounting classification, not Project, Contract, supplier, customer or Asset identity.'
    ]
  ),
  def(
    'FIN-DIMENSION',
    ['BOF-19-003'],
    'Financial Dimension',
    'master-data',
    'A governed analytical/accounting dimension definition whose members can reference canonical business identities or finance-specific classifications.',
    'Stable dimension identity; member references preserve the authoritative identity of Project, WBS, Contract, Asset, Party and organisation context.',
    [
      'dimension code',
      'dimension type',
      'allowed member source',
      'validation rules',
      'effectivity'
    ],
    ['Draft', 'Active', 'Inactive', 'Retired'],
    [
      'A Financial Dimension must reference canonical business objects rather than manufacture financial copies of them.'
    ]
  ),
  def(
    'FIN-COST-CODE',
    ['BOF-19-004'],
    'Cost Code',
    'master-data',
    'A governed cost-classification code used to analyse budget, commitment, accrual and actual cost.',
    'Stable cost-code identity independent of Project/WBS identity.',
    ['cost code', 'description', 'hierarchy/classification', 'effective dates'],
    ['Draft', 'Active', 'Blocked', 'Retired'],
    ['Cost Code is a classification dimension and is not a WBS Element or GL Account.']
  ),
  def(
    'FIN-COST-CENTRE',
    ['BOF-19-005'],
    'Cost Centre',
    'master-data',
    'A governed responsibility/accounting unit used to collect and report costs.',
    'Stable finance responsibility identity mapped to Organisation Unit where appropriate without duplicating it.',
    ['cost-centre code', 'responsible organisation unit', 'legal entity', 'effective dates'],
    ['Planned', 'Active', 'Inactive', 'Closed'],
    [
      'Cost Centre may map to Organisation Unit but neither identity should be silently substituted for the other.'
    ]
  ),
  def(
    'FIN-PROFIT-CENTRE',
    ['BOF-19-006'],
    'Profit Centre',
    'master-data',
    'A governed responsibility unit used to analyse revenues, costs and profit.',
    'Stable profit-centre identity with effective organisational mappings.',
    ['profit-centre code', 'responsible organisation', 'legal entity', 'effective dates'],
    ['Planned', 'Active', 'Inactive', 'Closed'],
    ['Profit Centre is an accounting responsibility dimension, not a Legal Entity.']
  ),
  def(
    'FIN-ACCOUNTING-PERIOD',
    ['BOF-19-007'],
    'Accounting Period',
    'reference',
    'A governed posting/reporting period in an accounting calendar.',
    'Stable period identity within a calendar; opening and closing are controlled states.',
    ['calendar', 'period number', 'start/end', 'posting status'],
    ['Future', 'Open', 'Soft Closed', 'Closed', 'Reopened'],
    ['Period closure constrains posting but does not change source business-object lifecycle.']
  ),
  def(
    'FIN-BUDGET',
    ['BOF-19-008'],
    'Budget',
    'plan',
    'An approved financial plan by governed dimensions and time periods.',
    'Stable Budget identity with immutable approved versions/baselines.',
    ['budget version', 'periods', 'dimensions', 'amounts', 'currency', 'approval basis'],
    ['Draft', 'Review', 'Approved', 'Current', 'Superseded', 'Closed'],
    ['Budget is planned value; it never becomes an Actual or Ledger Entry.']
  ),
  def(
    'FIN-FORECAST',
    ['BOF-19-009'],
    'Financial Forecast',
    'plan',
    'A time-stamped forward-looking financial estimate using governed dimensions and assumptions.',
    'Each approved/saved forecast snapshot retains identity and as-of date; forecasting never rewrites actual postings.',
    ['forecast version', 'as-of date', 'periods', 'dimensions', 'amounts', 'assumptions'],
    ['Draft', 'Review', 'Approved', 'Superseded', 'Closed'],
    ['Forecast is separate from Budget and Actuals; variance is derived from comparable positions.']
  ),
  def(
    'FIN-JOURNAL',
    ['BOF-19-010', 'BOF-19-011'],
    'Journal',
    'transaction',
    'A balanced accounting instruction grouping one or more Journal Lines before posting to a Ledger.',
    'Stable Journal identity; Journal Lines are children. Once posted, correction occurs through reversal/correcting journal rather than destructive edit.',
    ['journal number', 'ledger', 'period', 'source', 'journal lines', 'currency', 'posting status'],
    ['Draft', 'Validated', 'Approved', 'Posted', 'Reversed'],
    ['Journal is an accounting transaction, not the source commercial/operational event.']
  ),
  def(
    'FIN-LEDGER-ENTRY',
    ['BOF-19-012', 'BOF-19-013'],
    'Ledger Entry',
    'posting-evidence',
    'An immutable debit/credit posting entry recording a financial effect in a Ledger with full source provenance.',
    'Immutable posting identity generated at posting; never edited after posting. Corrections are new reversal/adjustment entries.',
    [
      'posting ID',
      'ledger',
      'period',
      'GL account',
      'dimensions',
      'debit/credit amount',
      'currency',
      'source reference',
      'posted by/at'
    ],
    ['Posted', 'Reversed'],
    [
      'Ledger Entry is accounting evidence and never replaces the source Invoice, Payment, Contract, Project, Asset or other business record.'
    ]
  ),
  def(
    'FIN-SUPPLIER-INVOICE',
    ['BOF-19-014'],
    'Supplier Invoice',
    'transaction',
    'A governed accounts-payable invoice received from a supplier Party for goods, services or contractual entitlement.',
    'Stable invoice identity referencing the canonical supplier Party and source procurement/contract records.',
    [
      'invoice number',
      'supplier',
      'legal entity',
      'invoice date',
      'tax',
      'lines',
      'source documents',
      'amount/currency',
      'due terms'
    ],
    ['Captured', 'Validated', 'Approved', 'Posted', 'Part Paid', 'Paid', 'Disputed', 'Cancelled'],
    [
      'Supplier Invoice is not a supplier master and is distinct from valuation/application/certificate evidence.'
    ]
  ),
  def(
    'FIN-CUSTOMER-INVOICE',
    ['BOF-19-015'],
    'Customer Invoice',
    'transaction',
    'A governed accounts-receivable invoice issued to a customer Party for a recognised billing entitlement.',
    'Stable invoice identity referencing the canonical customer Party and source contract/commercial records.',
    [
      'invoice number',
      'customer',
      'legal entity',
      'invoice date',
      'tax',
      'lines',
      'billing basis',
      'amount/currency',
      'due terms'
    ],
    ['Draft', 'Approved', 'Issued', 'Posted', 'Part Paid', 'Paid', 'Disputed', 'Cancelled'],
    [
      'Customer Invoice is billing evidence; it does not replace the Contract, valuation or revenue-recognition basis.'
    ]
  ),
  def(
    'FIN-ADJUSTMENT-NOTE',
    ['BOF-19-016', 'BOF-19-017'],
    'Financial Adjustment Note',
    'transaction',
    'A governed credit/debit adjustment document referencing an existing receivable/payable or billing basis.',
    'Stable note identity; credit/debit direction is an explicit type rather than separate master architectures.',
    [
      'note number',
      'note type',
      'counterparty',
      'reference invoice',
      'reason',
      'amount/tax',
      'currency'
    ],
    ['Draft', 'Approved', 'Issued', 'Posted', 'Cancelled'],
    [
      'Adjustment notes preserve original invoice history and do not overwrite the original transaction.'
    ]
  ),
  def(
    'FIN-OPEN-ITEM',
    ['BOF-19-018', 'BOF-19-019'],
    'Open Item Position',
    'projection',
    'A derived payable/receivable settlement position for posted financial documents.',
    'Rebuildable position derived from invoices, adjustment notes, payments, receipts and allocations.',
    [
      'source document',
      'counterparty',
      'due date',
      'original amount',
      'settled amount',
      'open amount',
      'currency'
    ],
    ['Open', 'Part Settled', 'Settled'],
    ['Open Item Position is not an independently editable invoice or receivable/payable master.']
  ),
  def(
    'FIN-PAYMENT',
    ['BOF-19-020'],
    'Payment',
    'transaction',
    'A governed outgoing settlement transaction authorising and recording transfer of funds.',
    'Stable Payment identity linked to payer bank account, payee Party and settlement allocations.',
    [
      'payment number',
      'payer account',
      'payee',
      'value date',
      'amount/currency',
      'method',
      'status'
    ],
    ['Proposed', 'Approved', 'Released', 'Executed', 'Rejected', 'Reversed'],
    [
      'Payment is distinct from Bank Transaction evidence and from the invoice/open item it settles.'
    ]
  ),
  def(
    'FIN-RECEIPT',
    ['BOF-19-021'],
    'Receipt',
    'transaction',
    'A governed incoming-funds receipt/settlement transaction.',
    'Stable Receipt identity linked to payer Party, receiving bank account and settlement allocations.',
    [
      'receipt number',
      'payer',
      'bank account',
      'value date',
      'amount/currency',
      'method',
      'status'
    ],
    ['Expected', 'Received', 'Applied', 'Reversed'],
    ['Receipt is distinct from Customer Invoice and Bank Transaction evidence.']
  ),
  def(
    'FIN-SETTLEMENT-ALLOCATION',
    ['BOF-19-022'],
    'Settlement Allocation',
    'transaction',
    'A governed allocation of a Payment/Receipt/adjustment amount to one or more financial open items.',
    'Stable allocation identity retaining amount, date and source/target references; reallocation preserves audit history.',
    ['settlement source', 'open item', 'allocated amount', 'currency', 'allocation date'],
    ['Proposed', 'Applied', 'Reversed'],
    ['Financial settlement allocation is not workforce/resource allocation.']
  ),
  def(
    'FIN-BANK-ACCOUNT',
    ['BOF-19-023'],
    'Bank Account',
    'treasury-record',
    'A governed bank-account identity owned/controlled by a Legal Entity for cash and settlement activity.',
    'Stable account identity; bank identifiers and mandate/signatory data are governed attributes/relationships.',
    [
      'bank account ID',
      'legal entity',
      'bank Party',
      'IBAN/account identifiers',
      'currency',
      'mandate/status'
    ],
    ['Proposed', 'Active', 'Restricted', 'Closed'],
    ['Bank Account is a treasury account identity, not a GL Account.']
  ),
  def(
    'FIN-BANK-STATEMENT',
    ['BOF-19-024'],
    'Bank Statement',
    'posting-evidence',
    'A controlled statement/evidence set received from a financial institution for a bank account and period.',
    'Immutable imported/received statement identity preserving source sequence and provenance.',
    ['bank account', 'statement ID', 'period', 'opening/closing balance', 'source/provenance'],
    ['Received', 'Validated', 'Reconciled', 'Archived'],
    ['Bank Statement is external evidence and must not be edited to force reconciliation.']
  ),
  def(
    'FIN-BANK-TRANSACTION',
    ['BOF-19-025'],
    'Bank Transaction',
    'posting-evidence',
    'An immutable external bank movement evidenced by a statement/feed.',
    'Immutable transaction identity from bank/source identifiers with deduplication/provenance controls.',
    [
      'bank reference',
      'account',
      'value date',
      'amount/currency',
      'counterparty/reference',
      'source'
    ],
    ['Observed', 'Matched', 'Reconciled', 'Exception'],
    [
      'Bank Transaction is evidence of cash movement; Payment/Receipt is the internal settlement instruction/record.'
    ]
  ),
  def(
    'FIN-RECONCILIATION',
    ['BOF-19-026'],
    'Reconciliation',
    'control-record',
    'A governed control record proving agreement between two authoritative positions or identifying exceptions.',
    'Stable reconciliation run/case identity with immutable evidence of matched items and exceptions.',
    [
      'reconciliation type',
      'scope',
      'as-of date',
      'matched items',
      'exceptions',
      'performed/reviewed by'
    ],
    ['Open', 'In Review', 'Reconciled', 'Exception', 'Closed'],
    ['Reconciliation links records; it never mutates source evidence to make balances agree.']
  ),
  def(
    'FIN-ACCRUAL',
    ['BOF-19-027'],
    'Accrual',
    'transaction',
    'A governed period-end or event-driven recognition of incurred value before final invoice/settlement evidence.',
    'Stable accrual identity with source basis and reversal/settlement linkage.',
    ['accrual ID', 'basis/source', 'period', 'dimensions', 'amount/currency', 'reversal rule'],
    ['Draft', 'Approved', 'Posted', 'Reversed', 'Settled'],
    [
      'Accrual recognises accounting effect but does not replace the source obligation or future invoice.'
    ]
  ),
  def(
    'FIN-PREPAYMENT',
    ['BOF-19-028'],
    'Prepayment',
    'transaction',
    'A governed deferred-cost/revenue record for value paid/received before recognition.',
    'Stable prepayment identity with amortisation/recognition schedule and source document.',
    ['prepayment ID', 'source document', 'periods', 'amount/currency', 'recognition rule'],
    ['Created', 'Active', 'Part Recognised', 'Fully Recognised', 'Reversed'],
    ['Recognition creates postings while preserving the original prepayment transaction.']
  ),
  def(
    'FIN-TAX-CODE',
    ['BOF-19-029'],
    'Tax Code',
    'reference',
    'Reference to the shared jurisdiction/configuration Tax Code used by finance transactions.',
    'Tax Code identity is owned by reference/jurisdiction configuration and reused by Finance.',
    ['tax code', 'jurisdiction', 'tax type', 'rate/rule', 'effectivity'],
    ['Configured', 'Effective', 'Superseded', 'Retired'],
    [
      'Finance consumes the canonical reference Tax Code rather than owning a duplicate tax-code master.'
    ]
  ),
  def(
    'FIN-TAX-TRANSACTION',
    ['BOF-19-030'],
    'Tax Transaction',
    'posting-evidence',
    'A traceable tax consequence arising from a source financial/business transaction.',
    'Immutable tax-event identity linked to source, tax code, jurisdiction and posting evidence.',
    ['source', 'tax code', 'tax base', 'tax amount', 'jurisdiction', 'period'],
    ['Calculated', 'Posted', 'Adjusted', 'Reported'],
    ['Tax transaction must retain source provenance and jurisdiction/effectivity.']
  ),
  def(
    'FIN-TAX-RETURN',
    ['BOF-19-031'],
    'Tax Return',
    'control-record',
    'A governed statutory tax filing/reporting record for a jurisdiction and period.',
    'Stable return identity with controlled versions/submissions and retained filing evidence.',
    ['return type', 'legal entity', 'jurisdiction', 'period', 'figures', 'submission reference'],
    ['Draft', 'Review', 'Approved', 'Submitted', 'Accepted', 'Amended'],
    ['Submitted returns are retained; amendments create controlled successor evidence.']
  ),
  def(
    'FIN-FIXED-ASSET',
    ['BOF-19-032'],
    'Fixed Asset Accounting Record',
    'accounting-record',
    'A finance/accounting record for capitalisation, depreciation and carrying value, linked to the canonical physical Asset when applicable.',
    'Stable accounting-record identity; relationship to physical Asset is explicit and optional because some accounting assets are non-physical or grouped.',
    [
      'fixed-asset number',
      'asset reference',
      'asset class',
      'capitalisation date',
      'cost',
      'useful life',
      'depreciation method',
      'carrying value'
    ],
    ['Proposed', 'Capitalised', 'Active', 'Impaired', 'Disposed', 'Retired'],
    ['Fixed Asset Accounting Record is not the whole-life physical Asset identity.']
  ),
  def(
    'FIN-DEPRECIATION',
    ['BOF-19-033', 'BOF-19-034'],
    'Depreciation',
    'transaction',
    'Controlled depreciation schedule/runs that calculate and post periodic depreciation for Fixed Asset Accounting Records.',
    'Schedule is subordinate planning logic; each Depreciation Run is a retained transaction producing immutable postings.',
    [
      'asset/accounting record',
      'method',
      'period',
      'calculated amount',
      'run reference',
      'posting reference'
    ],
    ['Planned', 'Calculated', 'Approved', 'Posted', 'Reversed'],
    ['Depreciation changes accounting carrying value, not physical Asset lifecycle or condition.']
  ),
  def(
    'FIN-EXCHANGE-RATE',
    ['BOF-19-035'],
    'Exchange Rate',
    'reference',
    'A governed currency conversion rate for a source, rate type and effective time.',
    'Immutable/effective-dated rate observation; source and rate type are part of provenance.',
    ['from/to currency', 'rate', 'rate type', 'effective date/time', 'source'],
    ['Observed', 'Approved', 'Effective', 'Superseded'],
    ['Exchange rates are reference observations and are not silently overwritten.']
  ),
  def(
    'FIN-REVALUATION',
    ['BOF-19-036'],
    'Revaluation',
    'transaction',
    'A governed calculation/posting event remeasuring monetary balances or governed asset/account positions.',
    'Stable revaluation-run identity with as-of date, rate/basis and generated postings.',
    ['scope', 'as-of date', 'basis/rates', 'calculated differences', 'posting references'],
    ['Calculated', 'Reviewed', 'Posted', 'Reversed'],
    [
      'Revaluation produces accounting effects and preserves the original transaction/currency amounts.'
    ]
  ),
  def(
    'FIN-INTERCOMPANY',
    ['BOF-19-037'],
    'Intercompany Transaction',
    'transaction',
    'A governed transaction between canonical Legal Entities within the enterprise group.',
    'Stable transaction identity referencing both Legal Entities and matched source/posting records.',
    [
      'from legal entity',
      'to legal entity',
      'basis',
      'amount/currency',
      'matching/reference',
      'period'
    ],
    ['Draft', 'Confirmed', 'Posted', 'Matched', 'Settled'],
    [
      'Intercompany does not create duplicate entity masters; both sides reference canonical Legal Entity identities.'
    ]
  ),
  def(
    'FIN-CONSOLIDATION',
    ['BOF-19-038', 'BOF-19-039'],
    'Consolidation Run',
    'control-record',
    'A governed consolidation process/snapshot combining source ledgers and applying controlled eliminations.',
    'Each run has immutable as-of/version identity; Elimination is a child/accounting adjustment of the run.',
    ['group scope', 'period', 'source ledgers', 'translation basis', 'eliminations', 'status'],
    ['Prepared', 'Calculated', 'Reviewed', 'Approved', 'Published'],
    [
      'Consolidation preserves source-ledger truth; eliminations do not rewrite source Legal Entity ledgers.'
    ]
  ),
  def(
    'FIN-CLOSE-CYCLE',
    ['BOF-19-040'],
    'Financial Close Cycle',
    'control-record',
    'A governed period-close control cycle coordinating cut-off, reconciliations, adjustments, review and closure.',
    'Stable close-cycle identity per period/scope; control evidence is retained.',
    ['period', 'scope', 'close tasks/controls', 'exceptions', 'approvals', 'closed at'],
    ['Planned', 'Open', 'In Progress', 'Review', 'Closed', 'Reopened'],
    [
      'Close workflow coordinates controls but does not replace Accounting Period state or source records.'
    ]
  ),
  def(
    'FIN-CAPEX-REQUEST',
    ['BOF-19-041'],
    'Capex Request',
    'transaction',
    'A governed request for capital expenditure authority with scope, business case, funding and approval.',
    'Stable request identity; approval can authorise spend but does not itself create Project, PO or Fixed Asset identities.',
    [
      'request number',
      'requestor',
      'business case',
      'amount/currency',
      'project/asset context',
      'funding',
      'authority'
    ],
    ['Draft', 'Submitted', 'Approved', 'Rejected', 'Committed', 'Closed'],
    ['Capex Request uses delegated authority and canonical Project/Asset references.']
  ),
  def(
    'FIN-CASH-FORECAST',
    ['BOF-19-042'],
    'Cash Forecast',
    'plan',
    'A time-stamped forecast of expected cash inflows/outflows by entity/account/currency and horizon.',
    'Forecast versions are immutable snapshots by as-of date.',
    ['as-of date', 'horizon', 'bank/entity/currency dimensions', 'expected flows', 'assumptions'],
    ['Draft', 'Approved', 'Superseded'],
    [
      'Cash Forecast is forward-looking and distinct from observed Bank Transactions or Cash Position.'
    ]
  ),
  def(
    'FIN-LIQUIDITY-FORECAST',
    ['BOF-19-043'],
    'Liquidity Forecast',
    'plan',
    'A governed forward-looking view of liquidity sources, uses, facilities and headroom.',
    'Immutable forecast snapshot tied to assumptions and source positions.',
    ['as-of date', 'horizon', 'cash position', 'facilities', 'expected flows', 'headroom'],
    ['Draft', 'Approved', 'Superseded'],
    ['Liquidity Forecast may consume Cash Forecast but remains a distinct treasury planning view.']
  ),
  def(
    'FIN-TREASURY-FACILITY',
    ['BOF-19-044'],
    'Treasury Facility',
    'treasury-record',
    'A governed financing/credit facility available to one or more Legal Entities.',
    'Stable facility identity with lender Party, limits, terms, covenants and effectivity.',
    [
      'facility number',
      'provider',
      'borrower entities',
      'limit',
      'currency',
      'terms',
      'availability dates'
    ],
    ['Proposed', 'Active', 'Restricted', 'Expired', 'Closed'],
    ['Facility is a financing agreement context, not a Bank Account or cash balance.']
  ),
  def(
    'FIN-TREASURY-DEAL',
    ['BOF-19-045'],
    'Treasury Deal',
    'treasury-record',
    'A governed treasury transaction such as borrowing, deposit, FX or hedge deal under approved policy/authority.',
    'Stable deal identity with counterparty Party, terms, dates and settlement/posting provenance.',
    [
      'deal number',
      'deal type',
      'counterparty',
      'notional/currency',
      'rates/terms',
      'trade/value/maturity dates'
    ],
    ['Proposed', 'Confirmed', 'Active', 'Settled', 'Cancelled'],
    [
      'Treasury Deal is subject to authority and confirmation controls and generates accounting effects without replacing them.'
    ]
  ),
  def(
    'FIN-REPORTING-SNAPSHOT',
    ['BOF-19-046'],
    'Controlled Reporting Snapshot',
    'posting-evidence',
    'An immutable, attributable snapshot of a defined financial reporting position as-of a point in time.',
    'Snapshot identity fixes source ledgers, filters, reporting basis, data version and as-of time.',
    [
      'snapshot ID',
      'reporting basis',
      'scope',
      'as-of time',
      'source ledgers/data versions',
      'prepared/approved by'
    ],
    ['Prepared', 'Reviewed', 'Approved', 'Published', 'Superseded'],
    [
      'A reporting snapshot is evidence/projection of source truth and is never a substitute ledger.'
    ]
  ),
  def(
    'FIN-COMMITMENT-POSITION',
    [],
    'Commitment Position',
    'projection',
    'A derived financial-control position for approved contractual/procurement commitments not yet fully realised as actual cost.',
    'Rebuildable from canonical Contract, Purchase Order and change/commitment records.',
    [
      'source commitment',
      'project/WBS/contract dimensions',
      'committed value',
      'consumed value',
      'remaining value'
    ],
    ['Current'],
    [
      'Commitment Position references source commercial records; Finance must not create a shadow Contract or Purchase Order.'
    ],
    ['project', 'WBS', 'contract', 'legal entity']
  ),
  def(
    'FIN-ACTUAL-POSITION',
    [],
    'Actual Financial Position',
    'projection',
    'A derived actual-cost/revenue position assembled from posted Ledger Entries by canonical financial dimensions.',
    'Rebuildable from immutable postings; never independently edited.',
    ['ledger', 'period/as-of', 'dimensions', 'actual amount', 'currency'],
    ['Current'],
    ['Actuals come from postings; operational objects remain the source provenance.'],
    ['legal entity', 'ledger', 'project/WBS/contract/asset dimensions']
  ),
  def(
    'FIN-CASH-POSITION',
    [],
    'Cash Position',
    'projection',
    'A derived cash/bank position by Legal Entity, Bank Account, currency and as-of time.',
    'Rebuildable from reconciled bank evidence and governed treasury/accounting records.',
    ['as-of time', 'bank account', 'currency', 'available/book balance', 'reconciliation status'],
    ['Current'],
    ['Cash Position is a projection, not a Bank Account or mutable cash master.'],
    ['legal entity', 'bank account', 'currency']
  ),
  def(
    'FIN-RECOGNITION-EVENT',
    [],
    'Financial Recognition Event',
    'posting-evidence',
    'A governed, attributable recognition event translating an approved accounting policy/basis into immutable financial postings.',
    'Stable event identity with source basis, period, calculation version and generated Ledger Entries.',
    [
      'recognition type',
      'source basis',
      'period',
      'dimensions',
      'amount',
      'policy/rule',
      'posting references'
    ],
    ['Calculated', 'Approved', 'Posted', 'Reversed'],
    [
      'Recognition records accounting treatment; it does not change the underlying Contract, Project delivery progress or Asset condition.'
    ]
  )
];

export const financeAccountingBoundaries: FinanceAccountingBoundary[] = [
  {
    name: 'Business truth',
    structure: 'Project / Contract / Party / Asset / PO / service event',
    purpose: 'Authoritative operational and commercial identities that cause financial effects.',
    mustNotBecome: 'finance-owned duplicate masters'
  },
  {
    name: 'Accounting truth',
    structure: 'Ledger → Journal → immutable Ledger Entry',
    purpose: 'Records attributable debit/credit effects under an accounting basis.',
    mustNotBecome: 'editable operational workflow state'
  },
  {
    name: 'Planning & control',
    structure: 'Budget / Forecast / Commitment / Actual / Variance',
    purpose: 'Compares governed financial positions across common dimensions.',
    mustNotBecome: 'a second project or WBS hierarchy'
  },
  {
    name: 'Treasury',
    structure: 'Bank Account → Payment/Receipt → Bank evidence → Cash Position',
    purpose: 'Controls settlement, liquidity and cash evidence.',
    mustNotBecome: 'a replacement for AP/AR or ledger identity'
  }
];

export const financeAccountingRelationships: FinanceAccountingRelationship[] = [
  {
    id: 'FIN-R01',
    from: 'CBO-LEGAL-ENTITY',
    predicate: 'owns accounting books',
    to: 'FIN-LEDGER',
    cardinality: '1 → 1..*',
    governance: 'Ledger scope always identifies its accountable Legal Entity.'
  },
  {
    id: 'FIN-R02',
    from: 'FIN-LEDGER',
    predicate: 'uses',
    to: 'FIN-CHART-OF-ACCOUNTS',
    cardinality: '* → 1',
    governance: 'Chart/version effectivity must be explicit.'
  },
  {
    id: 'FIN-R03',
    from: 'FIN-CHART-OF-ACCOUNTS',
    predicate: 'contains',
    to: 'FIN-GL-ACCOUNT',
    cardinality: '1 → 1..*',
    governance: 'Account hierarchy/versioning does not rewrite historical posting classification.'
  },
  {
    id: 'FIN-R04',
    from: 'FIN-LEDGER',
    predicate: 'is open by',
    to: 'FIN-ACCOUNTING-PERIOD',
    cardinality: '1 → 1..*',
    governance: 'Period state controls posting eligibility.'
  },
  {
    id: 'FIN-R05',
    from: 'FIN-JOURNAL',
    predicate: 'posts to',
    to: 'FIN-LEDGER',
    cardinality: '* → 1',
    governance: 'Posted journal becomes immutable accounting evidence.'
  },
  {
    id: 'FIN-R06',
    from: 'FIN-JOURNAL',
    predicate: 'produces',
    to: 'FIN-LEDGER-ENTRY',
    cardinality: '1 → 2..*',
    governance: 'Entries balance according to ledger rules and retain journal/source provenance.'
  },
  {
    id: 'FIN-R07',
    from: 'FIN-LEDGER-ENTRY',
    predicate: 'classifies to',
    to: 'FIN-GL-ACCOUNT',
    cardinality: '* → 1',
    governance: 'GL classification is explicit on posting.'
  },
  {
    id: 'FIN-R08',
    from: 'FIN-LEDGER-ENTRY',
    predicate: 'carries',
    to: 'FIN-DIMENSION',
    cardinality: '* ↔ *',
    relationshipObject: 'Posting Dimension Value',
    governance:
      'Dimension values reference canonical Project/WBS/Contract/Asset/etc. where applicable.'
  },
  {
    id: 'FIN-R09',
    from: 'FIN-SUPPLIER-INVOICE',
    predicate: 'references supplier',
    to: 'CBO-PARTY',
    cardinality: '* → 1',
    governance: 'Supplier role does not duplicate Party identity.'
  },
  {
    id: 'FIN-R10',
    from: 'FIN-CUSTOMER-INVOICE',
    predicate: 'references customer',
    to: 'CBO-PARTY',
    cardinality: '* → 1',
    governance: 'Customer role does not duplicate Party identity.'
  },
  {
    id: 'FIN-R11',
    from: 'FIN-SUPPLIER-INVOICE',
    predicate: 'may reference',
    to: 'PROC-PURCHASE-ORDER',
    cardinality: '* ↔ 0..*',
    governance: 'Invoice matching links to authoritative procurement commitment.'
  },
  {
    id: 'FIN-R12',
    from: 'FIN-SUPPLIER-INVOICE',
    predicate: 'may reference',
    to: 'CBO-CONTRACT',
    cardinality: '* ↔ 0..*',
    governance: 'Contract remains the commercial agreement identity.'
  },
  {
    id: 'FIN-R13',
    from: 'FIN-CUSTOMER-INVOICE',
    predicate: 'bills under',
    to: 'CBO-CONTRACT',
    cardinality: '* ↔ 0..*',
    governance: 'Billing does not replace contractual entitlement or valuation evidence.'
  },
  {
    id: 'FIN-R14',
    from: 'FIN-ADJUSTMENT-NOTE',
    predicate: 'adjusts',
    to: 'FIN-SUPPLIER-INVOICE',
    cardinality: '* → 0..1',
    governance: 'Original invoice remains immutable/history-preserved.'
  },
  {
    id: 'FIN-R15',
    from: 'FIN-ADJUSTMENT-NOTE',
    predicate: 'adjusts',
    to: 'FIN-CUSTOMER-INVOICE',
    cardinality: '* → 0..1',
    governance: 'Original invoice remains immutable/history-preserved.'
  },
  {
    id: 'FIN-R16',
    from: 'FIN-PAYMENT',
    predicate: 'settles via',
    to: 'FIN-SETTLEMENT-ALLOCATION',
    cardinality: '1 → 0..*',
    governance: 'Settlement may span multiple open items.'
  },
  {
    id: 'FIN-R17',
    from: 'FIN-RECEIPT',
    predicate: 'settles via',
    to: 'FIN-SETTLEMENT-ALLOCATION',
    cardinality: '1 → 0..*',
    governance: 'Settlement may span multiple open items.'
  },
  {
    id: 'FIN-R18',
    from: 'FIN-SETTLEMENT-ALLOCATION',
    predicate: 'reduces',
    to: 'FIN-OPEN-ITEM',
    cardinality: '* → 1',
    governance: 'Open position is derived from immutable source/allocation history.'
  },
  {
    id: 'FIN-R19',
    from: 'FIN-PAYMENT',
    predicate: 'uses',
    to: 'FIN-BANK-ACCOUNT',
    cardinality: '* → 1',
    governance: 'Bank account authority/mandate is checked independently of posting permission.'
  },
  {
    id: 'FIN-R20',
    from: 'FIN-RECEIPT',
    predicate: 'uses',
    to: 'FIN-BANK-ACCOUNT',
    cardinality: '* → 1',
    governance: 'Receipt and bank evidence remain distinct.'
  },
  {
    id: 'FIN-R21',
    from: 'FIN-BANK-STATEMENT',
    predicate: 'contains',
    to: 'FIN-BANK-TRANSACTION',
    cardinality: '1 → 0..*',
    governance: 'Imported bank evidence remains unchanged.'
  },
  {
    id: 'FIN-R22',
    from: 'FIN-RECONCILIATION',
    predicate: 'matches',
    to: 'FIN-BANK-TRANSACTION',
    cardinality: '1 ↔ 0..*',
    governance: 'Reconciliation preserves exceptions and source evidence.'
  },
  {
    id: 'FIN-R23',
    from: 'FIN-RECONCILIATION',
    predicate: 'matches',
    to: 'FIN-PAYMENT',
    cardinality: '1 ↔ 0..*',
    governance: 'Internal settlement and external movement remain separate records.'
  },
  {
    id: 'FIN-R24',
    from: 'FIN-RECONCILIATION',
    predicate: 'matches',
    to: 'FIN-RECEIPT',
    cardinality: '1 ↔ 0..*',
    governance: 'Internal settlement and external movement remain separate records.'
  },
  {
    id: 'FIN-R25',
    from: 'FIN-FIXED-ASSET',
    predicate: 'may account for',
    to: 'CBO-ASSET',
    cardinality: '* → 0..1',
    governance: 'Physical Asset identity remains authoritative for whole-life operations.'
  },
  {
    id: 'FIN-R26',
    from: 'FIN-DEPRECIATION',
    predicate: 'applies to',
    to: 'FIN-FIXED-ASSET',
    cardinality: '* → 1..*',
    governance: 'Depreciation changes carrying value, not physical condition/lifecycle.'
  },
  {
    id: 'FIN-R27',
    from: 'FIN-INTERCOMPANY',
    predicate: 'from entity',
    to: 'CBO-LEGAL-ENTITY',
    cardinality: '* → 1',
    governance: 'Entity identity is reused.'
  },
  {
    id: 'FIN-R28',
    from: 'FIN-INTERCOMPANY',
    predicate: 'to entity',
    to: 'CBO-LEGAL-ENTITY',
    cardinality: '* → 1',
    governance: 'Entity identity is reused.'
  },
  {
    id: 'FIN-R29',
    from: 'FIN-CONSOLIDATION',
    predicate: 'reads',
    to: 'FIN-LEDGER',
    cardinality: '1 → 1..*',
    governance: 'Source ledgers remain immutable and independently auditable.'
  },
  {
    id: 'FIN-R30',
    from: 'FIN-CAPEX-REQUEST',
    predicate: 'may fund',
    to: 'CBO-PROJECT',
    cardinality: '* ↔ 0..*',
    governance: 'Approval grants financial authority without creating Project identity.'
  },
  {
    id: 'FIN-R31',
    from: 'FIN-CAPEX-REQUEST',
    predicate: 'may relate to',
    to: 'CBO-ASSET',
    cardinality: '* ↔ 0..*',
    governance: 'Capital request and Asset identity remain separate.'
  },
  {
    id: 'FIN-R32',
    from: 'FIN-COMMITMENT-POSITION',
    predicate: 'analyses',
    to: 'CBO-PROJECT',
    cardinality: '* → 0..1',
    governance: 'Project dimension is a reference to canonical Project.'
  },
  {
    id: 'FIN-R33',
    from: 'FIN-COMMITMENT-POSITION',
    predicate: 'analyses',
    to: 'DEL-WBS-ELEMENT',
    cardinality: '* → 0..1',
    governance: 'WBS remains delivery-scope truth; finance only references it.'
  },
  {
    id: 'FIN-R34',
    from: 'FIN-ACTUAL-POSITION',
    predicate: 'analyses',
    to: 'CBO-CONTRACT',
    cardinality: '* → 0..1',
    governance: 'Contract financial view is derived without duplicate contract master.'
  },
  {
    id: 'FIN-R35',
    from: 'FIN-ACTUAL-POSITION',
    predicate: 'analyses',
    to: 'CBO-ASSET',
    cardinality: '* → 0..1',
    governance: 'Asset financial view references canonical Asset identity.'
  },
  {
    id: 'FIN-R36',
    from: 'FIN-CASH-POSITION',
    predicate: 'summarises',
    to: 'FIN-BANK-ACCOUNT',
    cardinality: '* → 1',
    governance: 'Cash position is a projection by account/as-of time.'
  },
  {
    id: 'FIN-R37',
    from: 'FIN-TREASURY-DEAL',
    predicate: 'may use',
    to: 'FIN-TREASURY-FACILITY',
    cardinality: '* → 0..1',
    governance: 'Deal usage does not redefine facility identity.'
  },
  {
    id: 'FIN-R38',
    from: 'FIN-RECOGNITION-EVENT',
    predicate: 'produces',
    to: 'FIN-LEDGER-ENTRY',
    cardinality: '1 → 1..*',
    governance: 'Recognition retains calculation/policy/source provenance.'
  }
];

export const financeAccountingRules = [
  'Finance references canonical Legal Entity, Party, Project, WBS, Contract, Item and Asset identities; it must not create finance-owned duplicates.',
  'A posted Ledger Entry is immutable. Correction occurs through reversal or new adjustment entries, never destructive edit.',
  'The business object that caused a financial effect remains authoritative; the accounting posting records its financial consequence.',
  'Supplier Invoice and Customer Invoice are distinct from applications for payment, valuations, certificates, Contracts and Payments.',
  'Payment and Receipt are settlement transactions; Bank Transaction is external bank evidence; reconciliation links them without collapsing them.',
  'Budget and Forecast are plans, Commitment and Actual positions are derived views, and none of them may overwrite posted actuals.',
  'Financial Dimension values reference canonical Project, WBS, Contract, Asset and organisation identities rather than shadow masters.',
  'Fixed Asset Accounting Record is an accounting identity linked to a physical Asset when applicable; it is not the physical Asset itself.',
  'Tax Code is shared jurisdiction/reference configuration and is reused by Finance rather than duplicated.',
  'Consolidation and elimination preserve source Legal Entity Ledgers; group reporting never rewrites entity-level accounting truth.',
  'Recognition, depreciation, revaluation and close controls produce attributable evidence/postings with retained source and policy provenance.',
  'Controlled Reporting Snapshot is immutable reporting evidence/projection and never becomes a substitute Ledger.'
];

export function validateFinanceAccountingModel() {
  const ids = new Set(financeAccountingModel.map((entry) => entry.modelId));
  if (ids.size !== financeAccountingModel.length)
    throw new Error('Duplicate finance/accounting model ID.');
  const external = new Set([
    'CBO-LEGAL-ENTITY',
    'CBO-PARTY',
    'CBO-PROJECT',
    'DEL-WBS-ELEMENT',
    'CBO-CONTRACT',
    'CBO-ASSET',
    'PROC-PURCHASE-ORDER'
  ]);
  for (const relation of financeAccountingRelationships) {
    if (!ids.has(relation.from) && !external.has(relation.from))
      throw new Error(`Unknown finance relationship source: ${relation.from}`);
    if (!ids.has(relation.to) && !external.has(relation.to))
      throw new Error(`Unknown finance relationship target: ${relation.to}`);
  }
  return true;
}
