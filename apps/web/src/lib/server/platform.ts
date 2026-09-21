import {
  createDatabasePool,
  MySqlAccessAdministrationCommandService,
  MySqlAccessAdministrationReadRepository,
  MySqlAccessRepository,
  MySqlAuthRepository,
  MySqlMyWorkRepository,
  MySqlOrganisationCommandService,
  MySqlOrganisationReadRepository
} from '@nublox/persistence';

let poolInstance: ReturnType<typeof createDatabasePool> | undefined;
let accessAdministrationCommandServiceInstance: MySqlAccessAdministrationCommandService | undefined;
let accessAdministrationReadRepositoryInstance: MySqlAccessAdministrationReadRepository | undefined;
let accessRepositoryInstance: MySqlAccessRepository | undefined;
let authRepositoryInstance: MySqlAuthRepository | undefined;
let myWorkRepositoryInstance: MySqlMyWorkRepository | undefined;
let organisationCommandServiceInstance: MySqlOrganisationCommandService | undefined;
let organisationReadRepositoryInstance: MySqlOrganisationReadRepository | undefined;

export function getDatabasePool(): ReturnType<typeof createDatabasePool> {
  if (!poolInstance) {
    poolInstance = createDatabasePool();
  }

  return poolInstance;
}

export function getAccessAdministrationCommandService(): MySqlAccessAdministrationCommandService {
  if (!accessAdministrationCommandServiceInstance) {
    accessAdministrationCommandServiceInstance =
      new MySqlAccessAdministrationCommandService(getDatabasePool());
  }

  return accessAdministrationCommandServiceInstance;
}

export function getAccessAdministrationReadRepository(): MySqlAccessAdministrationReadRepository {
  if (!accessAdministrationReadRepositoryInstance) {
    accessAdministrationReadRepositoryInstance =
      new MySqlAccessAdministrationReadRepository(getDatabasePool());
  }

  return accessAdministrationReadRepositoryInstance;
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

export function getOrganisationCommandService(): MySqlOrganisationCommandService {
  if (!organisationCommandServiceInstance) {
    organisationCommandServiceInstance = new MySqlOrganisationCommandService(getDatabasePool());
  }

  return organisationCommandServiceInstance;
}

export function getOrganisationReadRepository(): MySqlOrganisationReadRepository {
  if (!organisationReadRepositoryInstance) {
    organisationReadRepositoryInstance = new MySqlOrganisationReadRepository(getDatabasePool());
  }

  return organisationReadRepositoryInstance;
}
