CREATE TABLE marketing_enquiries (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(320) NOT NULL,
  company VARCHAR(200) NOT NULL,
  job_title VARCHAR(200) NULL,
  phone VARCHAR(64) NULL,
  interest VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  source_path VARCHAR(255) NOT NULL DEFAULT '/contact',
  status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  submitted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT chk_marketing_enquiry_status CHECK (status IN ('NEW','IN_PROGRESS','QUALIFIED','CLOSED')),
  INDEX idx_marketing_enquiries_status_submitted (status, submitted_at),
  INDEX idx_marketing_enquiries_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
