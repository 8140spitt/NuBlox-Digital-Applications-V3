ALTER TABLE positions
  ADD COLUMN lifecycle_status VARCHAR(16) NOT NULL DEFAULT 'APPROVED' AFTER title,
  ADD COLUMN incumbency_model VARCHAR(16) NOT NULL DEFAULT 'SINGLE' AFTER lifecycle_status,
  ADD COLUMN authorised_fte DECIMAL(7,4) NOT NULL DEFAULT 1.0000 AFTER incumbency_model,
  ADD COLUMN effective_from DATETIME(6) NOT NULL DEFAULT '1970-01-01 00:00:00.000000' AFTER authorised_fte,
  ADD COLUMN effective_to DATETIME(6) NULL AFTER effective_from,
  ADD KEY ix_positions_establishment
    (tenant_id,organisation_unit_id,lifecycle_status,effective_from,effective_to),
  ADD CONSTRAINT chk_positions_lifecycle CHECK (
    lifecycle_status IN ('PLANNED','APPROVED','FROZEN','ABOLISHED')
  ),
  ADD CONSTRAINT chk_positions_incumbency_model CHECK (
    incumbency_model IN ('SINGLE','SHARED')
  ),
  ADD CONSTRAINT chk_positions_authorised_fte CHECK (
    authorised_fte > 0 AND authorised_fte <= 100
  ),
  ADD CONSTRAINT chk_positions_effective_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  ADD CONSTRAINT chk_positions_abolished_period CHECK (
    lifecycle_status <> 'ABOLISHED' OR effective_to IS NOT NULL
  );

ALTER TABLE position_occupancies
  ADD COLUMN fte DECIMAL(7,4) NOT NULL DEFAULT 1.0000 AFTER is_primary,
  ADD CONSTRAINT chk_position_occupancies_fte CHECK (
    fte > 0 AND fte <= 100
  );
