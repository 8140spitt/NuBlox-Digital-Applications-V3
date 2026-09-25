CREATE TABLE hcm_job_families (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_hcm_job_families_tenant_code (tenant_id,code),
  UNIQUE KEY uq_hcm_job_families_tenant_id_id (tenant_id,id),
  CONSTRAINT fk_hcm_job_families_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_hcm_job_families_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE hcm_job_subfamilies (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  family_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_hcm_job_subfamilies_tenant_family_code (tenant_id,family_id,code),
  UNIQUE KEY uq_hcm_job_subfamilies_tenant_id_id (tenant_id,id),
  KEY ix_hcm_job_subfamilies_family (tenant_id,family_id,status),
  CONSTRAINT fk_hcm_job_subfamilies_family
    FOREIGN KEY (tenant_id,family_id) REFERENCES hcm_job_families(tenant_id,id),
  CONSTRAINT chk_hcm_job_subfamilies_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE hcm_career_levels (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  track VARCHAR(32) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_hcm_career_levels_tenant_code (tenant_id,code),
  UNIQUE KEY uq_hcm_career_levels_tenant_id_id (tenant_id,id),
  KEY ix_hcm_career_levels_track_sequence (tenant_id,track,sequence,status),
  CONSTRAINT fk_hcm_career_levels_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_hcm_career_levels_track CHECK (
    track IN ('INDIVIDUAL_CONTRIBUTOR','MANAGEMENT','EXECUTIVE','SPECIALIST')
  ),
  CONSTRAINT chk_hcm_career_levels_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE hcm_grades (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_hcm_grades_tenant_code (tenant_id,code),
  UNIQUE KEY uq_hcm_grades_tenant_id_id (tenant_id,id),
  KEY ix_hcm_grades_sequence (tenant_id,sequence,status),
  CONSTRAINT fk_hcm_grades_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_hcm_grades_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE hcm_job_profile_architecture_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  job_profile_id VARCHAR(64) NOT NULL,
  family_id VARCHAR(64) NOT NULL,
  subfamily_id VARCHAR(64) NULL,
  career_level_id VARCHAR(64) NULL,
  grade_id VARCHAR(64) NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_hcm_job_profile_arch_tenant_id_id (tenant_id,id),
  KEY ix_hcm_job_profile_arch_job_period (tenant_id,job_profile_id,status,effective_from,effective_to),
  KEY ix_hcm_job_profile_arch_family (tenant_id,family_id,subfamily_id,status),
  KEY ix_hcm_job_profile_arch_level_grade (tenant_id,career_level_id,grade_id,status),
  CONSTRAINT fk_hcm_job_profile_arch_job FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id),
  CONSTRAINT fk_hcm_job_profile_arch_family
    FOREIGN KEY (tenant_id,family_id) REFERENCES hcm_job_families(tenant_id,id),
  CONSTRAINT fk_hcm_job_profile_arch_subfamily
    FOREIGN KEY (tenant_id,subfamily_id) REFERENCES hcm_job_subfamilies(tenant_id,id),
  CONSTRAINT fk_hcm_job_profile_arch_level
    FOREIGN KEY (tenant_id,career_level_id) REFERENCES hcm_career_levels(tenant_id,id),
  CONSTRAINT fk_hcm_job_profile_arch_grade
    FOREIGN KEY (tenant_id,grade_id) REFERENCES hcm_grades(tenant_id,id),
  CONSTRAINT chk_hcm_job_profile_arch_period CHECK (
    effective_to IS NULL OR effective_to>=effective_from
  ),
  CONSTRAINT chk_hcm_job_profile_arch_status CHECK (
    status IN ('ACTIVE','INACTIVE')
  )
) ENGINE=InnoDB;
