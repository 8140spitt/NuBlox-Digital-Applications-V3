ALTER TABLE employments
  ADD COLUMN assignment_id VARCHAR(96) NULL AFTER employee_number,
  ADD COLUMN relationship_type VARCHAR(32) NOT NULL DEFAULT 'PRIMARY_EMPLOYMENT' AFTER assignment_id,
  ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT TRUE AFTER relationship_type;

UPDATE employments
   SET assignment_id=CONCAT('LEGACY-',id)
 WHERE assignment_id IS NULL;

ALTER TABLE employments
  MODIFY assignment_id VARCHAR(96) NOT NULL,
  ADD UNIQUE KEY uq_employments_assignment_id (tenant_id,assignment_id),
  ADD KEY ix_employments_person_primary_period
    (tenant_id,person_id,is_primary,start_date,end_date,status),
  ADD CONSTRAINT chk_employments_relationship_type CHECK (
    relationship_type IN (
      'PRIMARY_EMPLOYMENT',
      'SECONDARY_EMPLOYMENT',
      'GLOBAL_ASSIGNMENT',
      'SECONDMENT',
      'CONTINGENT_ENGAGEMENT'
    )
  ),
  ADD CONSTRAINT chk_employments_primary_relationship CHECK (
    is_primary=FALSE OR relationship_type='PRIMARY_EMPLOYMENT'
  ),
  ADD CONSTRAINT chk_employments_contingent_relationship CHECK (
    (worker_type='CONTINGENT' AND relationship_type='CONTINGENT_ENGAGEMENT')
    OR
    (worker_type='EMPLOYEE' AND relationship_type<>'CONTINGENT_ENGAGEMENT')
  );
