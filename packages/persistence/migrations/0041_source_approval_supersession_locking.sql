ALTER TABLE source_approvals
  ADD INDEX ix_source_approvals_context (tenant_id, sourcing_context_id),
  ADD INDEX ix_source_approvals_supplier_relationship (tenant_id, supplier_relationship_id);

ALTER TABLE source_approvals
  DROP CHECK chk_source_approvals_current,
  DROP INDEX uq_source_approvals_current_tuple,
  DROP COLUMN current_guard;

CREATE INDEX ix_source_approvals_current_tuple
  ON source_approvals (
    tenant_id, sourcing_context_id, supplier_relationship_id,
    internal_item_object_id, supplier_item_object_id, superseded_by_source_approval_id
  );
