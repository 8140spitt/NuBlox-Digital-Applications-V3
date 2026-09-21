import type { AuthSession } from '@nublox/persistence';

declare global {
  namespace App {
    interface Locals {
      auth: AuthSession | null;
    }
  }
}

export {};
