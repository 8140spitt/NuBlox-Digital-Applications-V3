import {
  createDatabasePool,
  MySqlAccessAdministrationCommandService,
  MySqlAccessAdministrationReadRepository,
  MySqlAccessPermissionRequestRepository,
  MySqlAccessRepository,
  MySqlAuthRepository,
  MySqlCompetenceCommandService,
  MySqlCompetenceReadRepository,
  MySqlControlReadRepository,
  MySqlChangeConfigurationReadRepository,
  MySqlDeliverableReadRepository,
  MySqlDeliverableCommandService,
  MySqlChangeConfigurationCommandService,
  MySqlInformationCommandService,
  MySqlInformationReadRepository,
  MySqlIndustryDeliveryCommandService,
  MySqlIndustryDeliveryReadRepository,
  MySqlStrategyCommandService,
  MySqlStrategyReadRepository,
  MySqlFunctionalDeploymentCommandService,
  MySqlFunctionalDeploymentReadRepository,
  MySqlMyWorkRepository,
  MySqlOrganisationCommandService,
  MySqlOrganisationReadRepository,
  MySqlPolicyAdministrationCommandService,
  MySqlPolicyAdministrationReadRepository,
  MySqlSecurityClassificationAdministrationCommandService,
  MySqlSecurityClassificationAdministrationReadRepository,
  MySqlValidationPolicyAdministrationCommandService,
  MySqlValidationPolicyAdministrationReadRepository,
  MySqlValidationExecutionService,
  MySqlMetadataAdministrationCommandService,
  MySqlMetadataAdministrationReadRepository,
  MySqlConfigurationResolutionCommandService,
  MySqlConfigurationResolutionReadRepository,
  MySqlExchangeCommandService,
  MySqlExchangeReadRepository,
  MySqlPublicationCommandService,
  MySqlPublicationReadRepository,
  MySqlMigrationCommandService,
  MySqlMigrationReadRepository,
  MySqlExtensionCommandService,
  MySqlExtensionReadRepository,
  MySqlConfigurationPromotionCommandService,
  MySqlConfigurationPromotionReadRepository,
  MySqlRecordsRetentionCommandService,
  MySqlRecordsRetentionReadRepository,
  MySqlManufacturingCommandService,
  MySqlManufacturingReadRepository,
  MySqlServiceDeliveryCommandService,
  MySqlServiceDeliveryReadRepository,
  MySqlConstructionSiteProductionCommandService,
  MySqlConstructionSiteProductionReadRepository,
  MySqlSupplierSourcingCommandService,
  MySqlSupplierSourcingReadRepository,
  MySqlOrganisationalResourcePlanningCommandService,
  MySqlOrganisationalResourcePlanningReadRepository,
  MySqlHcmCommandService,
  MySqlHcmReadRepository,
  MySqlThingAdministrationCommandService,
  MySqlThingAdministrationReadRepository,
  MySqlUniversalFunctionReadRepository
} from '@nublox/persistence';

let poolInstance: ReturnType<typeof createDatabasePool> | undefined;
let accessAdministrationCommandServiceInstance: MySqlAccessAdministrationCommandService | undefined;
let accessAdministrationReadRepositoryInstance: MySqlAccessAdministrationReadRepository | undefined;
let accessPermissionRequestRepositoryInstance: MySqlAccessPermissionRequestRepository | undefined;
let accessRepositoryInstance: MySqlAccessRepository | undefined;
let authRepositoryInstance: MySqlAuthRepository | undefined;
let competenceCommandServiceInstance: MySqlCompetenceCommandService | undefined;
let competenceReadRepositoryInstance: MySqlCompetenceReadRepository | undefined;
let controlReadRepositoryInstance: MySqlControlReadRepository | undefined;
let changeConfigurationReadRepositoryInstance: MySqlChangeConfigurationReadRepository | undefined;
let deliverableReadRepositoryInstance: MySqlDeliverableReadRepository | undefined;
let deliverableCommandServiceInstance: MySqlDeliverableCommandService | undefined;
let changeConfigurationCommandServiceInstance: MySqlChangeConfigurationCommandService | undefined;
let informationCommandServiceInstance: MySqlInformationCommandService | undefined;
let informationReadRepositoryInstance: MySqlInformationReadRepository | undefined;
let industryDeliveryCommandServiceInstance: MySqlIndustryDeliveryCommandService | undefined;
let industryDeliveryReadRepositoryInstance: MySqlIndustryDeliveryReadRepository | undefined;
let strategyCommandServiceInstance: MySqlStrategyCommandService | undefined;
let strategyReadRepositoryInstance: MySqlStrategyReadRepository | undefined;
let functionalDeploymentCommandServiceInstance: MySqlFunctionalDeploymentCommandService | undefined;
let functionalDeploymentReadRepositoryInstance: MySqlFunctionalDeploymentReadRepository | undefined;
let myWorkRepositoryInstance: MySqlMyWorkRepository | undefined;
let organisationCommandServiceInstance: MySqlOrganisationCommandService | undefined;
let organisationReadRepositoryInstance: MySqlOrganisationReadRepository | undefined;
let policyAdministrationCommandServiceInstance: MySqlPolicyAdministrationCommandService | undefined;
let policyAdministrationReadRepositoryInstance: MySqlPolicyAdministrationReadRepository | undefined;
let securityClassificationAdministrationCommandServiceInstance: MySqlSecurityClassificationAdministrationCommandService | undefined;
let securityClassificationAdministrationReadRepositoryInstance: MySqlSecurityClassificationAdministrationReadRepository | undefined;
let validationPolicyAdministrationCommandServiceInstance: MySqlValidationPolicyAdministrationCommandService | undefined;
let validationPolicyAdministrationReadRepositoryInstance: MySqlValidationPolicyAdministrationReadRepository | undefined;
let validationExecutionServiceInstance: MySqlValidationExecutionService | undefined;
let metadataAdministrationCommandServiceInstance: MySqlMetadataAdministrationCommandService | undefined;
let metadataAdministrationReadRepositoryInstance: MySqlMetadataAdministrationReadRepository | undefined;
let configurationResolutionCommandServiceInstance: MySqlConfigurationResolutionCommandService | undefined;
let configurationResolutionReadRepositoryInstance: MySqlConfigurationResolutionReadRepository | undefined;
let exchangeCommandServiceInstance: MySqlExchangeCommandService | undefined;
let exchangeReadRepositoryInstance: MySqlExchangeReadRepository | undefined;
let publicationCommandServiceInstance: MySqlPublicationCommandService | undefined;
let publicationReadRepositoryInstance: MySqlPublicationReadRepository | undefined;
let migrationCommandServiceInstance: MySqlMigrationCommandService | undefined;
let migrationReadRepositoryInstance: MySqlMigrationReadRepository | undefined;
let extensionCommandServiceInstance: MySqlExtensionCommandService | undefined;
let extensionReadRepositoryInstance: MySqlExtensionReadRepository | undefined;
let configurationPromotionCommandServiceInstance: MySqlConfigurationPromotionCommandService | undefined;
let configurationPromotionReadRepositoryInstance: MySqlConfigurationPromotionReadRepository | undefined;
let recordsRetentionCommandServiceInstance: MySqlRecordsRetentionCommandService | undefined;
let recordsRetentionReadRepositoryInstance: MySqlRecordsRetentionReadRepository | undefined;
let manufacturingCommandServiceInstance: MySqlManufacturingCommandService | undefined;
let manufacturingReadRepositoryInstance: MySqlManufacturingReadRepository | undefined;
let serviceDeliveryCommandServiceInstance: MySqlServiceDeliveryCommandService | undefined;
let serviceDeliveryReadRepositoryInstance: MySqlServiceDeliveryReadRepository | undefined;
let constructionSiteProductionCommandServiceInstance: MySqlConstructionSiteProductionCommandService | undefined;
let constructionSiteProductionReadRepositoryInstance: MySqlConstructionSiteProductionReadRepository | undefined;
let supplierSourcingCommandServiceInstance: MySqlSupplierSourcingCommandService | undefined;
let supplierSourcingReadRepositoryInstance: MySqlSupplierSourcingReadRepository | undefined;
let organisationalResourcePlanningCommandServiceInstance: MySqlOrganisationalResourcePlanningCommandService | undefined;
let organisationalResourcePlanningReadRepositoryInstance: MySqlOrganisationalResourcePlanningReadRepository | undefined;
let hcmCommandServiceInstance: MySqlHcmCommandService | undefined;
let hcmReadRepositoryInstance: MySqlHcmReadRepository | undefined;
let thingAdministrationCommandServiceInstance: MySqlThingAdministrationCommandService | undefined;
let thingAdministrationReadRepositoryInstance: MySqlThingAdministrationReadRepository | undefined;
let universalFunctionReadRepositoryInstance: MySqlUniversalFunctionReadRepository | undefined;

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

export function getDeliverableCommandService(): MySqlDeliverableCommandService {
  if (!deliverableCommandServiceInstance) {
    deliverableCommandServiceInstance = new MySqlDeliverableCommandService(getDatabasePool());
  }
  return deliverableCommandServiceInstance;
}

export function getDeliverableReadRepository(): MySqlDeliverableReadRepository {
  if (!deliverableReadRepositoryInstance) {
    deliverableReadRepositoryInstance = new MySqlDeliverableReadRepository(getDatabasePool());
  }
  return deliverableReadRepositoryInstance;
}

export function getChangeConfigurationCommandService(): MySqlChangeConfigurationCommandService {
  if (!changeConfigurationCommandServiceInstance) {
    changeConfigurationCommandServiceInstance =
      new MySqlChangeConfigurationCommandService(getDatabasePool());
  }
  return changeConfigurationCommandServiceInstance;
}

export function getChangeConfigurationReadRepository(): MySqlChangeConfigurationReadRepository {
  if (!changeConfigurationReadRepositoryInstance) {
    changeConfigurationReadRepositoryInstance =
      new MySqlChangeConfigurationReadRepository(getDatabasePool());
  }
  return changeConfigurationReadRepositoryInstance;
}

export function getControlReadRepository(): MySqlControlReadRepository {
  if (!controlReadRepositoryInstance) {
    controlReadRepositoryInstance = new MySqlControlReadRepository(getDatabasePool());
  }
  return controlReadRepositoryInstance;
}

export function getIndustryDeliveryCommandService(): MySqlIndustryDeliveryCommandService {
  if (!industryDeliveryCommandServiceInstance) {
    industryDeliveryCommandServiceInstance =
      new MySqlIndustryDeliveryCommandService(getDatabasePool());
  }
  return industryDeliveryCommandServiceInstance;
}

export function getIndustryDeliveryReadRepository(): MySqlIndustryDeliveryReadRepository {
  if (!industryDeliveryReadRepositoryInstance) {
    industryDeliveryReadRepositoryInstance =
      new MySqlIndustryDeliveryReadRepository(getDatabasePool());
  }
  return industryDeliveryReadRepositoryInstance;
}

export function getStrategyCommandService(): MySqlStrategyCommandService {
  if (!strategyCommandServiceInstance) {
    strategyCommandServiceInstance = new MySqlStrategyCommandService(getDatabasePool());
  }
  return strategyCommandServiceInstance;
}

export function getStrategyReadRepository(): MySqlStrategyReadRepository {
  if (!strategyReadRepositoryInstance) {
    strategyReadRepositoryInstance = new MySqlStrategyReadRepository(getDatabasePool());
  }
  return strategyReadRepositoryInstance;
}

export function getInformationCommandService(): MySqlInformationCommandService {
  if (!informationCommandServiceInstance) {
    informationCommandServiceInstance = new MySqlInformationCommandService(getDatabasePool());
  }
  return informationCommandServiceInstance;
}

export function getInformationReadRepository(): MySqlInformationReadRepository {
  if (!informationReadRepositoryInstance) {
    informationReadRepositoryInstance = new MySqlInformationReadRepository(getDatabasePool());
  }
  return informationReadRepositoryInstance;
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


export function getPolicyAdministrationCommandService(): MySqlPolicyAdministrationCommandService {
  if (!policyAdministrationCommandServiceInstance) {
    policyAdministrationCommandServiceInstance =
      new MySqlPolicyAdministrationCommandService(getDatabasePool());
  }

  return policyAdministrationCommandServiceInstance;
}

export function getPolicyAdministrationReadRepository(): MySqlPolicyAdministrationReadRepository {
  if (!policyAdministrationReadRepositoryInstance) {
    policyAdministrationReadRepositoryInstance =
      new MySqlPolicyAdministrationReadRepository(getDatabasePool());
  }

  return policyAdministrationReadRepositoryInstance;
}


export function getSecurityClassificationAdministrationCommandService(): MySqlSecurityClassificationAdministrationCommandService {
  if (!securityClassificationAdministrationCommandServiceInstance) {
    securityClassificationAdministrationCommandServiceInstance =
      new MySqlSecurityClassificationAdministrationCommandService(getDatabasePool());
  }

  return securityClassificationAdministrationCommandServiceInstance;
}

export function getSecurityClassificationAdministrationReadRepository(): MySqlSecurityClassificationAdministrationReadRepository {
  if (!securityClassificationAdministrationReadRepositoryInstance) {
    securityClassificationAdministrationReadRepositoryInstance =
      new MySqlSecurityClassificationAdministrationReadRepository(getDatabasePool());
  }

  return securityClassificationAdministrationReadRepositoryInstance;
}


export function getValidationPolicyAdministrationCommandService(): MySqlValidationPolicyAdministrationCommandService {
  if (!validationPolicyAdministrationCommandServiceInstance) {
    validationPolicyAdministrationCommandServiceInstance =
      new MySqlValidationPolicyAdministrationCommandService(getDatabasePool());
  }
  return validationPolicyAdministrationCommandServiceInstance;
}

export function getValidationPolicyAdministrationReadRepository(): MySqlValidationPolicyAdministrationReadRepository {
  if (!validationPolicyAdministrationReadRepositoryInstance) {
    validationPolicyAdministrationReadRepositoryInstance =
      new MySqlValidationPolicyAdministrationReadRepository(getDatabasePool());
  }
  return validationPolicyAdministrationReadRepositoryInstance;
}


export function getValidationExecutionService(): MySqlValidationExecutionService {
  if (!validationExecutionServiceInstance) {
    validationExecutionServiceInstance = new MySqlValidationExecutionService(getDatabasePool());
  }
  return validationExecutionServiceInstance;
}


export function getMetadataAdministrationCommandService(): MySqlMetadataAdministrationCommandService {
  if (!metadataAdministrationCommandServiceInstance) {
    metadataAdministrationCommandServiceInstance =
      new MySqlMetadataAdministrationCommandService(getDatabasePool());
  }
  return metadataAdministrationCommandServiceInstance;
}

export function getMetadataAdministrationReadRepository(): MySqlMetadataAdministrationReadRepository {
  if (!metadataAdministrationReadRepositoryInstance) {
    metadataAdministrationReadRepositoryInstance =
      new MySqlMetadataAdministrationReadRepository(getDatabasePool());
  }
  return metadataAdministrationReadRepositoryInstance;
}


export function getConfigurationResolutionCommandService(): MySqlConfigurationResolutionCommandService {
  if (!configurationResolutionCommandServiceInstance) {
    configurationResolutionCommandServiceInstance =
      new MySqlConfigurationResolutionCommandService(getDatabasePool());
  }
  return configurationResolutionCommandServiceInstance;
}

export function getConfigurationResolutionReadRepository(): MySqlConfigurationResolutionReadRepository {
  if (!configurationResolutionReadRepositoryInstance) {
    configurationResolutionReadRepositoryInstance =
      new MySqlConfigurationResolutionReadRepository(getDatabasePool());
  }
  return configurationResolutionReadRepositoryInstance;
}


export function getExchangeCommandService(): MySqlExchangeCommandService {
  if (!exchangeCommandServiceInstance) {
    exchangeCommandServiceInstance = new MySqlExchangeCommandService(getDatabasePool());
  }
  return exchangeCommandServiceInstance;
}

export function getExchangeReadRepository(): MySqlExchangeReadRepository {
  if (!exchangeReadRepositoryInstance) {
    exchangeReadRepositoryInstance = new MySqlExchangeReadRepository(getDatabasePool());
  }
  return exchangeReadRepositoryInstance;
}


export function getPublicationCommandService(): MySqlPublicationCommandService {
  if (!publicationCommandServiceInstance) {
    publicationCommandServiceInstance =
      new MySqlPublicationCommandService(getDatabasePool());
  }
  return publicationCommandServiceInstance;
}

export function getPublicationReadRepository(): MySqlPublicationReadRepository {
  if (!publicationReadRepositoryInstance) {
    publicationReadRepositoryInstance =
      new MySqlPublicationReadRepository(getDatabasePool());
  }
  return publicationReadRepositoryInstance;
}


export function getMigrationCommandService(): MySqlMigrationCommandService {
  if (!migrationCommandServiceInstance) {
    migrationCommandServiceInstance =
      new MySqlMigrationCommandService(getDatabasePool());
  }
  return migrationCommandServiceInstance;
}

export function getMigrationReadRepository(): MySqlMigrationReadRepository {
  if (!migrationReadRepositoryInstance) {
    migrationReadRepositoryInstance =
      new MySqlMigrationReadRepository(getDatabasePool());
  }
  return migrationReadRepositoryInstance;
}


export function getExtensionCommandService(): MySqlExtensionCommandService {
  if (!extensionCommandServiceInstance) {
    extensionCommandServiceInstance =
      new MySqlExtensionCommandService(getDatabasePool());
  }
  return extensionCommandServiceInstance;
}

export function getExtensionReadRepository(): MySqlExtensionReadRepository {
  if (!extensionReadRepositoryInstance) {
    extensionReadRepositoryInstance =
      new MySqlExtensionReadRepository(getDatabasePool());
  }
  return extensionReadRepositoryInstance;
}


export function getConfigurationPromotionCommandService(): MySqlConfigurationPromotionCommandService {
  if (!configurationPromotionCommandServiceInstance) {
    configurationPromotionCommandServiceInstance =
      new MySqlConfigurationPromotionCommandService(getDatabasePool());
  }
  return configurationPromotionCommandServiceInstance;
}

export function getConfigurationPromotionReadRepository(): MySqlConfigurationPromotionReadRepository {
  if (!configurationPromotionReadRepositoryInstance) {
    configurationPromotionReadRepositoryInstance =
      new MySqlConfigurationPromotionReadRepository(getDatabasePool());
  }
  return configurationPromotionReadRepositoryInstance;
}


export function getRecordsRetentionCommandService(): MySqlRecordsRetentionCommandService {
  if (!recordsRetentionCommandServiceInstance) {
    recordsRetentionCommandServiceInstance =
      new MySqlRecordsRetentionCommandService(getDatabasePool());
  }
  return recordsRetentionCommandServiceInstance;
}

export function getRecordsRetentionReadRepository(): MySqlRecordsRetentionReadRepository {
  if (!recordsRetentionReadRepositoryInstance) {
    recordsRetentionReadRepositoryInstance =
      new MySqlRecordsRetentionReadRepository(getDatabasePool());
  }
  return recordsRetentionReadRepositoryInstance;
}


export function getSupplierSourcingCommandService(): MySqlSupplierSourcingCommandService {
  if (!supplierSourcingCommandServiceInstance) {
    supplierSourcingCommandServiceInstance =
      new MySqlSupplierSourcingCommandService(getDatabasePool());
  }
  return supplierSourcingCommandServiceInstance;
}

export function getSupplierSourcingReadRepository(): MySqlSupplierSourcingReadRepository {
  if (!supplierSourcingReadRepositoryInstance) {
    supplierSourcingReadRepositoryInstance =
      new MySqlSupplierSourcingReadRepository(getDatabasePool());
  }
  return supplierSourcingReadRepositoryInstance;
}


export function getManufacturingCommandService(): MySqlManufacturingCommandService {
  if (!manufacturingCommandServiceInstance) {
    manufacturingCommandServiceInstance = new MySqlManufacturingCommandService(getDatabasePool());
  }
  return manufacturingCommandServiceInstance;
}

export function getManufacturingReadRepository(): MySqlManufacturingReadRepository {
  if (!manufacturingReadRepositoryInstance) {
    manufacturingReadRepositoryInstance = new MySqlManufacturingReadRepository(getDatabasePool());
  }
  return manufacturingReadRepositoryInstance;
}


export function getServiceDeliveryCommandService(): MySqlServiceDeliveryCommandService {
  if (!serviceDeliveryCommandServiceInstance) {
    serviceDeliveryCommandServiceInstance = new MySqlServiceDeliveryCommandService(getDatabasePool());
  }
  return serviceDeliveryCommandServiceInstance;
}

export function getServiceDeliveryReadRepository(): MySqlServiceDeliveryReadRepository {
  if (!serviceDeliveryReadRepositoryInstance) {
    serviceDeliveryReadRepositoryInstance = new MySqlServiceDeliveryReadRepository(getDatabasePool());
  }
  return serviceDeliveryReadRepositoryInstance;
}

export function getConstructionSiteProductionCommandService(): MySqlConstructionSiteProductionCommandService {
  if (!constructionSiteProductionCommandServiceInstance) {
    constructionSiteProductionCommandServiceInstance = new MySqlConstructionSiteProductionCommandService(getDatabasePool());
  }
  return constructionSiteProductionCommandServiceInstance;
}

export function getConstructionSiteProductionReadRepository(): MySqlConstructionSiteProductionReadRepository {
  if (!constructionSiteProductionReadRepositoryInstance) {
    constructionSiteProductionReadRepositoryInstance = new MySqlConstructionSiteProductionReadRepository(getDatabasePool());
  }
  return constructionSiteProductionReadRepositoryInstance;
}

export function getOrganisationalResourcePlanningCommandService(): MySqlOrganisationalResourcePlanningCommandService {
  if (!organisationalResourcePlanningCommandServiceInstance) {
    organisationalResourcePlanningCommandServiceInstance =
      new MySqlOrganisationalResourcePlanningCommandService(getDatabasePool());
  }
  return organisationalResourcePlanningCommandServiceInstance;
}

export function getOrganisationalResourcePlanningReadRepository(): MySqlOrganisationalResourcePlanningReadRepository {
  if (!organisationalResourcePlanningReadRepositoryInstance) {
    organisationalResourcePlanningReadRepositoryInstance =
      new MySqlOrganisationalResourcePlanningReadRepository(getDatabasePool());
  }
  return organisationalResourcePlanningReadRepositoryInstance;
}

export function getHcmCommandService(): MySqlHcmCommandService {
  if (!hcmCommandServiceInstance) {
    hcmCommandServiceInstance = new MySqlHcmCommandService(getDatabasePool());
  }
  return hcmCommandServiceInstance;
}

export function getHcmReadRepository(): MySqlHcmReadRepository {
  if (!hcmReadRepositoryInstance) {
    hcmReadRepositoryInstance = new MySqlHcmReadRepository(getDatabasePool());
  }
  return hcmReadRepositoryInstance;
}

export function getThingAdministrationCommandService(): MySqlThingAdministrationCommandService {
  if (!thingAdministrationCommandServiceInstance) {
    thingAdministrationCommandServiceInstance = new MySqlThingAdministrationCommandService(getDatabasePool());
  }
  return thingAdministrationCommandServiceInstance;
}

export function getThingAdministrationReadRepository(): MySqlThingAdministrationReadRepository {
  if (!thingAdministrationReadRepositoryInstance) {
    thingAdministrationReadRepositoryInstance = new MySqlThingAdministrationReadRepository(getDatabasePool());
  }
  return thingAdministrationReadRepositoryInstance;
}

export function getUniversalFunctionReadRepository(): MySqlUniversalFunctionReadRepository {
  if (!universalFunctionReadRepositoryInstance) {
    universalFunctionReadRepositoryInstance = new MySqlUniversalFunctionReadRepository(getDatabasePool());
  }
  return universalFunctionReadRepositoryInstance;
}
