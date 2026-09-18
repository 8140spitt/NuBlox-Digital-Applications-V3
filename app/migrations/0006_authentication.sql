-- NuBlox V3 MySQL
-- 0006: Better Auth core authentication store
-- Authentication identity remains separate from tenant/business authority.

CREATE TABLE IF NOT EXISTS `user` (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT NULL,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE KEY uq_auth_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `session` (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expiresAt DATETIME(3) NOT NULL,
  ipAddress VARCHAR(64) NULL,
  userAgent TEXT NULL,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  CONSTRAINT fk_auth_session_user FOREIGN KEY (userId) REFERENCES `user`(id) ON DELETE CASCADE,
  UNIQUE KEY uq_auth_session_token (token),
  INDEX idx_auth_session_user (userId),
  INDEX idx_auth_session_expiry (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `account` (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  accountId VARCHAR(191) NOT NULL,
  providerId VARCHAR(191) NOT NULL,
  accessToken TEXT NULL,
  refreshToken TEXT NULL,
  accessTokenExpiresAt DATETIME(3) NULL,
  refreshTokenExpiresAt DATETIME(3) NULL,
  scope TEXT NULL,
  idToken TEXT NULL,
  password TEXT NULL,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  CONSTRAINT fk_auth_account_user FOREIGN KEY (userId) REFERENCES `user`(id) ON DELETE CASCADE,
  INDEX idx_auth_account_user (userId),
  INDEX idx_auth_account_provider_identity (providerId, accountId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `verification` (
  id VARCHAR(36) PRIMARY KEY,
  identifier VARCHAR(191) NOT NULL,
  value TEXT NOT NULL,
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) NULL,
  updatedAt DATETIME(3) NULL,
  INDEX idx_auth_verification_identifier (identifier),
  INDEX idx_auth_verification_expiry (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
