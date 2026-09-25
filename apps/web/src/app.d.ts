import type { AuthSession, TenantRoute } from '@nublox/persistence';

declare global {
  namespace App {
    interface Locals {
      auth: AuthSession | null;
      tenant: TenantRoute | null;
    }
  }
}

export {};
