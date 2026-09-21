import {
  createDatabasePool,
  MySqlAuthRepository,
  MySqlMyWorkRepository
} from '@nublox/persistence';

let poolInstance: ReturnType<typeof createDatabasePool> | undefined;
let authRepositoryInstance: MySqlAuthRepository | undefined;
let myWorkRepositoryInstance: MySqlMyWorkRepository | undefined;

export function getDatabasePool(): ReturnType<typeof createDatabasePool> {
  if (!poolInstance) {
    poolInstance = createDatabasePool();
  }

  return poolInstance;
}

export function getAuthRepository(): MySqlAuthRepository {
  if (!authRepositoryInstance) {
    authRepositoryInstance = new MySqlAuthRepository(getDatabasePool());
  }

  return authRepositoryInstance;
}

export function getMyWorkRepository(): MySqlMyWorkRepository {
  if (!myWorkRepositoryInstance) {
    myWorkRepositoryInstance = new MySqlMyWorkRepository(getDatabasePool());
  }

  return myWorkRepositoryInstance;
}
