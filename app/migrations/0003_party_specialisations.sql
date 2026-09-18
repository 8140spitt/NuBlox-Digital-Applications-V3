-- NuBlox V3 MySQL
-- 0003: complete AGG-01-PARTY specialisation foundations
-- Forward-only migration. Do not edit after application.

CREATE TABLE IF NOT EXISTS persons (
  party_id VARCHAR(36) PRIMARY KEY,
  given_name VARCHAR(191) NOT NULL,
  middle_names VARCHAR(255) NULL,
  family_name VARCHAR(191) NOT NULL,
  preferred_name VARCHAR(191) NULL,
  date_of_birth DATE NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_persons_party FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS legal_entities (
  party_id VARCHAR(36) PRIMARY KEY,
  legal_entity_type VARCHAR(64) NOT NULL,
  jurisdiction_code VARCHAR(16) NOT NULL,
  statutory_identifier VARCHAR(191) NULL,
  tax_registration_number VARCHAR(191) NULL,
  accounting_currency CHAR(3) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATE NULL,
  effective_to DATE NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_legal_entities_organisation FOREIGN KEY (party_id) REFERENCES organisations(party_id) ON DELETE CASCADE,
  INDEX idx_legal_entities_statutory (jurisdiction_code, statutory_identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
