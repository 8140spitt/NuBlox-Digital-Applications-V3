import {
  createDatabasePool,
  MySqlAccessRepository,
  MySqlAuthRepository,
  MySqlMyWorkRepository,
  MySqlOrganisationReadRepository
} from '@nublox/persistence';

let poolInstance: ReturnType<typeof createDatabasePool> | undefined;
let accessRepositoryInstance: MySqlAccessRepository | undefined;
let authRepositoryInstance: MySqlAuthRepository | undefined;
let myWorkRepositoryInstance: MySqlMyWorkRepository | undefined;
let organisationReadRepositoryInstance: MySqlOrganisationReadRepository | undefined;

export function getDatabasePool(): ReturnType<typeof createDatabasePool> {
  if (!poolInstance) {
    poolInstance = createDatabasePool();
  }

  return poolInstance;
}

export function getAccessRepository(): MySqlAccessRepository {
  if (!accessRepositoryInstance) {
    accessRepositoryInstance = new MySqlAccessRepository(getDatabasePool());
  }

  return accessRepositoryInstance;
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

export function getOrganisationReadRepository(): MySqlOrganisationReadRepository {
  if (!organisationReadRepositoryInstance) {
    organisationReadRepositoryInstance = new MySqlOrganisationReadRepository(getDatabasePool());
  }

  return organisationReadRepositoryInstance;
}
