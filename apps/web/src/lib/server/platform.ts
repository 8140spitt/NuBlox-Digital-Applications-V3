import { createDatabasePool, MySqlAuthRepository } from '@nublox/persistence';

let authRepositoryInstance: MySqlAuthRepository | undefined;

export function getAuthRepository(): MySqlAuthRepository {
  if (!authRepositoryInstance) {
    authRepositoryInstance = new MySqlAuthRepository(createDatabasePool());
  }

  return authRepositoryInstance;
}
