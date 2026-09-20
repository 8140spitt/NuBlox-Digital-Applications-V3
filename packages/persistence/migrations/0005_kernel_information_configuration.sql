CREATE TABLE information_containers (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  container_type VARCHAR(120) NOT NULL,
  code VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_information_containers_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_information_containers_canonical_object (tenant_id, canonical_object_id),
  KEY ix_information_containers_code (tenant_id, container_type, code),
  CONSTRAINT fk_information_containers_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_information_containers_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE information_revisions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  information_container_id VARCHAR(64) NOT NULL,
  revision VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  released_at DATETIME(6) NULL,
  release_decision_id VARCHAR(64) NULL,
  released_iteration_id VARCHAR(64) NULL,
  superseded_by_revision_id VARCHAR(64) NULL,
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_information_revisions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_information_revisions_container_revision
    (tenant_id, information_container_id, revision),
  KEY ix_information_revisions_status
    (tenant_id, information_container_id, status, created_at),
  CONSTRAINT fk_information_revisions_container
    FOREIGN KEY (tenant_id, information_container_id)
    REFERENCES information_containers(tenant_id, id),
  CONSTRAINT fk_information_revisions_release_decision
    FOREIGN KEY (tenant_id, release_decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_information_revisions_superseded_by
    FOREIGN KEY (tenant_id, superseded_by_revision_id)
    REFERENCES information_revisions(tenant_id, id),
  CONSTRAINT chk_information_revisions_status CHECK (
    status IN ('DRAFT', 'RELEASED', 'SUPERSEDED', 'WITHDRAWN')
  ),
  CONSTRAINT chk_information_revisions_release_state CHECK (
    (status = 'DRAFT'
      AND released_at IS NULL
      AND release_decision_id IS NULL
      AND released_iteration_id IS NULL
      AND superseded_by_revision_id IS NULL)
    OR
    (status = 'RELEASED'
      AND released_at IS NOT NULL
      AND released_iteration_id IS NOT NULL
      AND superseded_by_revision_id IS NULL)
    OR
    (status = 'SUPERSEDED'
      AND released_at IS NOT NULL
      AND released_iteration_id IS NOT NULL
      AND superseded_by_revision_id IS NOT NULL)
    OR
    (status = 'WITHDRAWN')
  )
) ENGINE=InnoDB;

CREATE TABLE information_iterations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  information_revision_id VARCHAR(64) NOT NULL,
  iteration INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  author_person_id VARCHAR(64) NULL,
  created_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_information_iterations_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_information_iterations_revision_iteration
    (tenant_id, information_revision_id, iteration),
  KEY ix_information_iterations_revision_status
    (tenant_id, information_revision_id, status, iteration),
  CONSTRAINT fk_information_iterations_revision
    FOREIGN KEY (tenant_id, information_revision_id)
    REFERENCES information_revisions(tenant_id, id),
  CONSTRAINT fk_information_iterations_author
    FOREIGN KEY (tenant_id, author_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_information_iterations_iteration CHECK (iteration >= 1),
  CONSTRAINT chk_information_iterations_status CHECK (status IN ('WORKING', 'FROZEN'))
) ENGINE=InnoDB;

ALTER TABLE information_revisions
  ADD CONSTRAINT fk_information_revisions_released_iteration
    FOREIGN KEY (tenant_id, released_iteration_id)
    REFERENCES information_iterations(tenant_id, id);

CREATE TABLE representations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  information_iteration_id VARCHAR(64) NOT NULL,
  representation_type VARCHAR(24) NOT NULL,
  media_type VARCHAR(255) NOT NULL,
  file_name VARCHAR(512) NULL,
  content_reference VARCHAR(1024) NOT NULL,
  integrity_hash VARCHAR(255) NULL,
  generated_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_representations_tenant_id_id (tenant_id, id),
  KEY ix_representations_iteration
    (tenant_id, information_iteration_id, representation_type, generated_at),
  CONSTRAINT fk_representations_iteration
    FOREIGN KEY (tenant_id, information_iteration_id)
    REFERENCES information_iterations(tenant_id, id),
  CONSTRAINT chk_representations_type CHECK (
    representation_type IN ('NATIVE', 'PDF', 'IMAGE', 'DATA', 'REPORT', 'OTHER')
  )
) ENGINE=InnoDB;

CREATE TABLE information_issues (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  information_container_id VARCHAR(64) NOT NULL,
  information_revision_id VARCHAR(64) NOT NULL,
  representation_id VARCHAR(64) NULL,
  issue_reference VARCHAR(160) NOT NULL,
  issue_purpose VARCHAR(160) NOT NULL,
  issued_by_person_id VARCHAR(64) NOT NULL,
  issued_at DATETIME(6) NOT NULL,
  recipient_context VARCHAR(512) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_information_issues_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_information_issues_container_reference
    (tenant_id, information_container_id, issue_reference),
  KEY ix_information_issues_revision
    (tenant_id, information_revision_id, issued_at),
  CONSTRAINT fk_information_issues_container
    FOREIGN KEY (tenant_id, information_container_id)
    REFERENCES information_containers(tenant_id, id),
  CONSTRAINT fk_information_issues_revision
    FOREIGN KEY (tenant_id, information_revision_id)
    REFERENCES information_revisions(tenant_id, id),
  CONSTRAINT fk_information_issues_representation
    FOREIGN KEY (tenant_id, representation_id)
    REFERENCES representations(tenant_id, id),
  CONSTRAINT fk_information_issues_issuer
    FOREIGN KEY (tenant_id, issued_by_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE configuration_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_configuration_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_items_canonical_object (tenant_id, canonical_object_id),
  KEY ix_configuration_items_code (tenant_id, code, status),
  CONSTRAINT fk_configuration_items_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_configuration_items_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE baselines (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  context_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  established_at DATETIME(6) NULL,
  establishment_decision_id VARCHAR(64) NULL,
  superseded_by_baseline_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_baselines_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_baselines_context_code (tenant_id, context_object_id, code),
  KEY ix_baselines_context_status (tenant_id, context_object_id, status, established_at),
  CONSTRAINT fk_baselines_context
    FOREIGN KEY (tenant_id, context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_baselines_decision
    FOREIGN KEY (tenant_id, establishment_decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_baselines_superseded_by
    FOREIGN KEY (tenant_id, superseded_by_baseline_id)
    REFERENCES baselines(tenant_id, id),
  CONSTRAINT chk_baselines_status CHECK (
    status IN ('DRAFT', 'ESTABLISHED', 'SUPERSEDED')
  ),
  CONSTRAINT chk_baselines_state CHECK (
    (status = 'DRAFT'
      AND established_at IS NULL
      AND establishment_decision_id IS NULL
      AND superseded_by_baseline_id IS NULL)
    OR
    (status = 'ESTABLISHED'
      AND established_at IS NOT NULL
      AND establishment_decision_id IS NOT NULL
      AND superseded_by_baseline_id IS NULL)
    OR
    (status = 'SUPERSEDED'
      AND established_at IS NOT NULL
      AND establishment_decision_id IS NOT NULL
      AND superseded_by_baseline_id IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE baseline_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  baseline_id VARCHAR(64) NOT NULL,
  configuration_item_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_baseline_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_baseline_items_configuration
    (tenant_id, baseline_id, configuration_item_id),
  KEY ix_baseline_items_configuration_item
    (tenant_id, configuration_item_id, subject_version),
  CONSTRAINT fk_baseline_items_baseline
    FOREIGN KEY (tenant_id, baseline_id)
    REFERENCES baselines(tenant_id, id),
  CONSTRAINT fk_baseline_items_configuration_item
    FOREIGN KEY (tenant_id, configuration_item_id)
    REFERENCES configuration_items(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE effectivities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  configuration_item_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NOT NULL,
  effectivity_type VARCHAR(24) NOT NULL,
  scope_type VARCHAR(80) NOT NULL,
  scope_id VARCHAR(160) NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  expression TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_effectivities_tenant_id_id (tenant_id, id),
  KEY ix_effectivities_item
    (tenant_id, configuration_item_id, subject_version, status),
  KEY ix_effectivities_scope
    (tenant_id, scope_type, scope_id, effective_from, effective_to, status),
  CONSTRAINT fk_effectivities_configuration_item
    FOREIGN KEY (tenant_id, configuration_item_id)
    REFERENCES configuration_items(tenant_id, id),
  CONSTRAINT chk_effectivities_type CHECK (
    effectivity_type IN ('DATE', 'SERIAL', 'LOT', 'UNIT', 'PROJECT', 'LOCATION', 'CUSTOM')
  ),
  CONSTRAINT chk_effectivities_scope CHECK (
    (scope_type = 'TENANT' AND scope_id IS NULL)
    OR
    (scope_type <> 'TENANT' AND scope_id IS NOT NULL)
  ),
  CONSTRAINT chk_effectivities_period CHECK (
    effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_effectivities_date_type CHECK (
    effectivity_type <> 'DATE' OR effective_from IS NOT NULL OR effective_to IS NOT NULL
  ),
  CONSTRAINT chk_effectivities_custom_type CHECK (
    effectivity_type <> 'CUSTOM' OR expression IS NOT NULL
  ),
  CONSTRAINT chk_effectivities_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;
