import {
  createDatabasePool,
  MySqlAccessAdministrationCommandService,
  MySqlAccessAdministrationReadRepository,
  MySqlAccessPermissionRequestRepository,
  MySqlAccessRepository,
  MySqlAuthRepository,
  MySqlCompetenceCommandService,
  MySqlCompetenceReadRepository,
  MySqlFunctionalDeploymentCommandService,
  MySqlFunctionalDeploymentReadRepository,
  MySqlMyWorkRepository,
  MySqlOrganisationCommandService,
  MySqlOrganisationReadRepository
} from '@nublox/persistence';

let poolInstance: ReturnType<typeof createDatabasePool> | undefined;
let accessAdministrationCommandServiceInstance: MySqlAccessAdministrationCommandService | undefined;
let accessAdministrationReadRepositoryInstance: MySqlAccessAdministrationReadRepository | undefined;
let accessPermissionRequestRepositoryInstance: MySqlAccessPermissionRequestRepository | undefined;
let accessRepositoryInstance: MySqlAccessRepository | undefined;
let authRepositoryInstance: MySqlAuthRepository | undefined;
let competenceCommandServiceInstance: MySqlCompetenceCommandService | undefined;
let competenceReadRepositoryInstance: MySqlCompetenceReadRepository | undefined;
let functionalDeploymentCommandServiceInstance: MySqlFunctionalDeploymentCommandService | undefined;
let functionalDeploymentReadRepositoryInstance: MySqlFunctionalDeploymentReadRepository | undefined;
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

export function getAccessPermissionRequestRepository(): MySqlAccessPermissionRequestRepository {
  if (!accessPermissionRequestRepositoryInstance) {
    accessPermissionRequestRepositoryInstance =
      new MySqlAccessPermissionRequestRepository(getDatabasePool());
  }

  return accessPermissionRequestRepositoryInstance;
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

export function getCompetenceCommandService(): MySqlCompetenceCommandService {
  if (!competenceCommandServiceInstance) {
    competenceCommandServiceInstance = new MySqlCompetenceCommandService(getDatabasePool());
  }
  return competenceCommandServiceInstance;
}

export function getCompetenceReadRepository(): MySqlCompetenceReadRepository {
  if (!competenceReadRepositoryInstance) {
    competenceReadRepositoryInstance = new MySqlCompetenceReadRepository(getDatabasePool());
  }
  return competenceReadRepositoryInstance;
}

export function getFunctionalDeploymentCommandService(): MySqlFunctionalDeploymentCommandService {
  if (!functionalDeploymentCommandServiceInstance) {
    functionalDeploymentCommandServiceInstance =
      new MySqlFunctionalDeploymentCommandService(getDatabasePool());
  }

  return functionalDeploymentCommandServiceInstance;
}

export function getFunctionalDeploymentReadRepository(): MySqlFunctionalDeploymentReadRepository {
  if (!functionalDeploymentReadRepositoryInstance) {
    functionalDeploymentReadRepositoryInstance =
      new MySqlFunctionalDeploymentReadRepository(getDatabasePool());
  }

  return functionalDeploymentReadRepositoryInstance;
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
