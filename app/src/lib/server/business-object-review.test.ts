import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let service: typeof import('./business-object-review');
let dbModule: typeof import('./db');

beforeAll(async () => {
  service = await import('./business-object-review');
  dbModule = await import('./db');
  await dbModule.executeMutation('DELETE FROM business_object_review_events');
  await dbModule.executeMutation('DELETE FROM business_object_reviews');
});

afterAll(async () => {
  await dbModule.closeDbPool();
});

describe('canonical business object review ledger', () => {
  it('persists the current decision and immutable review history', async () => {
    await service.saveBusinessObjectReview(
      'BOF-16-003',
      { decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Site', notes: 'Stable spatial identity.' },
      'Reviewer One',
      'review-tenant'
    );

    await service.saveBusinessObjectReview(
      'BOF-16-003',
      { decision: 'RENAME', proposedCanonicalName: 'Built Environment Site', notes: 'Differentiate from project site usage.' },
      'Reviewer Two',
      'review-tenant'
    );

    const current = await service.getBusinessObjectReview('BOF-16-003');
    expect(current?.decision).toBe('RENAME');
    expect(current?.proposedCanonicalName).toBe('Built Environment Site');
    expect(await service.listBusinessObjectReviews()).toHaveLength(1);

    const events = await service.listBusinessObjectReviewEvents('BOF-16-003');
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.decision)).toEqual(['RENAME', 'VALIDATE_OBJECT']);
    expect(events[0].actor).toBe('Reviewer Two');
  });

  it('requires a merge target and prevents self merge', async () => {
    await expect(service.saveBusinessObjectReview(
      'BOF-09-006',
      { decision: 'MERGE' },
      'Reviewer',
      'review-tenant'
    )).rejects.toThrow('A merge target is required.');

    await expect(service.saveBusinessObjectReview(
      'BOF-09-006',
      { decision: 'MERGE', targetCandidateKey: 'BOF-09-006' },
      'Reviewer',
      'review-tenant'
    )).rejects.toThrow('An object cannot be merged into itself.');
  });

  it('seeds the governed foundation baseline without overwriting an existing human decision', async () => {
    const inserted = await service.seedFoundationCanonicalization('architecture-review');
    expect(inserted).toBeGreaterThan(0);

    const party = await service.getBusinessObjectReview('BOF-01-002');
    expect(party?.decision).toBe('VALIDATE_OBJECT');
    expect(party?.proposedCanonicalName).toBe('Party');

    const authority = await service.getBusinessObjectReview('BOF-01-019');
    expect(authority?.decision).toBe('VALIDATE_OBJECT');
    expect(authority?.proposedCanonicalName).toBe('Delegated Authority');

    const responsibility = await service.getBusinessObjectReview('BOF-06-020');
    expect(responsibility?.decision).toBe('RELATIONSHIP');

    const duplicateResponsibility = await service.getBusinessObjectReview('BOF-07-005');
    expect(duplicateResponsibility?.decision).toBe('MERGE');
    expect(duplicateResponsibility?.targetCandidateKey).toBe('BOF-06-020');

    const job = await service.getBusinessObjectReview('BOF-06-004');
    expect(job?.decision).toBe('MERGE');
    expect(job?.targetCandidateKey).toBe('BOF-06-003');

    const item = await service.getBusinessObjectReview('BOF-10-001');
    expect(item?.decision).toBe('RENAME');
    expect(item?.proposedCanonicalName).toBe('Item');

    const workItem = await service.getBusinessObjectReview('BOF-27-001');
    expect(workItem?.decision).toBe('VALIDATE_OBJECT');
    expect(workItem?.proposedCanonicalName).toBe('Work Item');

    const workDelegation = await service.getBusinessObjectReview('BOF-27-010');
    expect(workDelegation?.decision).toBe('RELATIONSHIP');
    expect(workDelegation?.proposedCanonicalName).toBe('Work Delegation');

    const outbox = await service.getBusinessObjectReview('BOF-28-015');
    expect(outbox?.decision).toBe('RENAME');
    expect(outbox?.proposedCanonicalName).toBe('Outbox Message');

    const jurisdiction = await service.getBusinessObjectReview('BOF-29-001');
    expect(jurisdiction?.decision).toBe('VALIDATE_OBJECT');
    expect(jurisdiction?.proposedCanonicalName).toBe('Jurisdiction');

    const uniclass = await service.getBusinessObjectReview('BOF-29-013');
    expect(uniclass?.decision).toBe('MERGE');
    expect(uniclass?.targetCandidateKey).toBe('BOF-29-012');

    const workflowTemplate = await service.getBusinessObjectReview('BOF-29-019');
    expect(workflowTemplate?.decision).toBe('MERGE');
    expect(workflowTemplate?.targetCandidateKey).toBe('BOF-29-018');

    const opportunity = await service.getBusinessObjectReview('BOF-03-008');
    expect(opportunity?.decision).toBe('VALIDATE_OBJECT');
    expect(opportunity?.proposedCanonicalName).toBe('Opportunity');

    const customerRelationship = await service.getBusinessObjectReview('BOF-03-016');
    expect(customerRelationship?.decision).toBe('MERGE');
    expect(customerRelationship?.targetCandidateKey).toBe('BOF-01-016');

    const complaint = await service.getBusinessObjectReview('BOF-03-015');
    expect(complaint?.decision).toBe('MERGE');
    expect(complaint?.targetCandidateKey).toBe('BOF-03-014');

    const estimate = await service.getBusinessObjectReview('BOF-05-003');
    expect(estimate?.decision).toBe('VALIDATE_OBJECT');
    expect(estimate?.proposedCanonicalName).toBe('Estimate');

    const supplierEnquiry = await service.getBusinessObjectReview('BOF-05-014');
    expect(supplierEnquiry?.decision).toBe('MERGE');
    expect(supplierEnquiry?.targetCandidateKey).toBe('BOF-09-009');

    const contingency = await service.getBusinessObjectReview('BOF-05-012');
    expect(contingency?.decision).toBe('MERGE');
    expect(contingency?.targetCandidateKey).toBe('BOF-05-011');

    const offerAcceptance = await service.getBusinessObjectReview('BOF-05-023');
    expect(offerAcceptance?.decision).toBe('EVENT_EVIDENCE');
    expect(offerAcceptance?.proposedCanonicalName).toBe('Offer Acceptance');

    const workerRelationship = await service.getBusinessObjectReview('BOF-18-001');
    expect(workerRelationship?.decision).toBe('VALIDATE_OBJECT');
    expect(workerRelationship?.proposedCanonicalName).toBe('Worker Relationship');

    const candidate = await service.getBusinessObjectReview('BOF-18-036');
    expect(candidate?.decision).toBe('MERGE');
    expect(candidate?.targetCandidateKey).toBe('BOF-01-003');

    const availability = await service.getBusinessObjectReview('BOF-18-019');
    expect(availability?.decision).toBe('PROJECTION');

    const payslip = await service.getBusinessObjectReview('BOF-18-033');
    expect(payslip?.decision).toBe('MERGE');
    expect(payslip?.targetCandidateKey).toBe('BOF-07-007');

    const handoverTraining = await service.getBusinessObjectReview('BOF-15-014');
    expect(handoverTraining?.decision).toBe('MERGE');
    expect(handoverTraining?.targetCandidateKey).toBe('BOF-18-016');

    const qualityPlan = await service.getBusinessObjectReview('BOF-13-001');
    expect(qualityPlan?.decision).toBe('VALIDATE_OBJECT');
    expect(qualityPlan?.proposedCanonicalName).toBe('Quality Plan');

    const witnessPoint = await service.getBusinessObjectReview('BOF-13-006');
    expect(witnessPoint?.decision).toBe('MERGE');
    expect(witnessPoint?.targetCandidateKey).toBe('BOF-13-005');

    const riskAssessment = await service.getBusinessObjectReview('BOF-13-018');
    expect(riskAssessment?.decision).toBe('MERGE');
    expect(riskAssessment?.targetCandidateKey).toBe('BOF-21-003');

    const sitePermit = await service.getBusinessObjectReview('BOF-12-017');
    expect(sitePermit?.decision).toBe('MERGE');
    expect(sitePermit?.targetCandidateKey).toBe('BOF-13-021');

    const complianceRegister = await service.getBusinessObjectReview('BOF-13-033');
    expect(complianceRegister?.decision).toBe('PROJECTION');

    const dutyholder = await service.getBusinessObjectReview('BOF-14-001');
    expect(dutyholder?.decision).toBe('RELATIONSHIP');
    expect(dutyholder?.proposedCanonicalName).toBe('Dutyholder Assignment');

    const buildingControlApplication = await service.getBusinessObjectReview('BOF-14-005');
    expect(buildingControlApplication?.decision).toBe('MERGE');
    expect(buildingControlApplication?.targetCandidateKey).toBe('BOF-14-004');

    const regulatoryInspection = await service.getBusinessObjectReview('BOF-14-007');
    expect(regulatoryInspection?.decision).toBe('MERGE');
    expect(regulatoryInspection?.targetCandidateKey).toBe('BOF-13-003');

    const statutoryCertificate = await service.getBusinessObjectReview('BOF-14-013');
    expect(statutoryCertificate?.decision).toBe('RENAME');
    expect(statutoryCertificate?.proposedCanonicalName).toBe('Statutory Completion Certificate');

    const goldenThread = await service.getBusinessObjectReview('BOF-14-014');
    expect(goldenThread?.decision).toBe('PROJECTION');

    const regulatorySubmission = await service.getBusinessObjectReview('BOF-14-015');
    expect(regulatorySubmission?.decision).toBe('MERGE');
    expect(regulatorySubmission?.targetCandidateKey).toBe('BOF-27-013');

    const carbonBaseline = await service.getBusinessObjectReview('BOF-20-003');
    expect(carbonBaseline?.decision).toBe('RENAME');
    expect(carbonBaseline?.proposedCanonicalName).toBe('Carbon Baseline Snapshot');

    const embodiedCarbon = await service.getBusinessObjectReview('BOF-20-007');
    expect(embodiedCarbon?.decision).toBe('CHILD');
    expect(embodiedCarbon?.proposedCanonicalName).toBe('Carbon Assessment Line');

    const sustainabilityUtility = await service.getBusinessObjectReview('BOF-20-010');
    expect(sustainabilityUtility?.decision).toBe('MERGE');
    expect(sustainabilityUtility?.targetCandidateKey).toBe('BOF-17-030');

    const climateRisk = await service.getBusinessObjectReview('BOF-20-023');
    expect(climateRisk?.decision).toBe('MERGE');
    expect(climateRisk?.targetCandidateKey).toBe('BOF-21-002');

    const costCarbon = await service.getBusinessObjectReview('BOF-20-025');
    expect(costCarbon?.decision).toBe('PROJECTION');

    const enterpriseRisk = await service.getBusinessObjectReview('BOF-21-002');
    expect(enterpriseRisk?.decision).toBe('VALIDATE_OBJECT');
    expect(enterpriseRisk?.proposedCanonicalName).toBe('Enterprise Risk');

    const riskAssessment21 = await service.getBusinessObjectReview('BOF-21-003');
    expect(riskAssessment21?.decision).toBe('EVENT_EVIDENCE');
    expect(riskAssessment21?.proposedCanonicalName).toBe('Risk Assessment');

    const auditPlan = await service.getBusinessObjectReview('BOF-21-011');
    expect(auditPlan?.decision).toBe('MERGE');
    expect(auditPlan?.targetCandidateKey).toBe('BOF-21-010');

    const conductCase = await service.getBusinessObjectReview('BOF-21-016');
    expect(conductCase?.decision).toBe('MERGE');
    expect(conductCase?.targetCandidateKey).toBe('BOF-21-015');

    const complianceEvidence = await service.getBusinessObjectReview('BOF-21-017');
    expect(complianceEvidence?.decision).toBe('EVENT_EVIDENCE');

    const legalMatter = await service.getBusinessObjectReview('BOF-22-001');
    expect(legalMatter?.decision).toBe('VALIDATE_OBJECT');
    expect(legalMatter?.proposedCanonicalName).toBe('Legal Matter');

    const regulatoryMatter = await service.getBusinessObjectReview('BOF-22-008');
    expect(regulatoryMatter?.decision).toBe('MERGE');
    expect(regulatoryMatter?.targetCandidateKey).toBe('BOF-22-001');

    const privacyPolicy = await service.getBusinessObjectReview('BOF-22-011');
    expect(privacyPolicy?.decision).toBe('MERGE');
    expect(privacyPolicy?.targetCandidateKey).toBe('BOF-07-007');

    const privacyBreach = await service.getBusinessObjectReview('BOF-22-018');
    expect(privacyBreach?.decision).toBe('MERGE');
    expect(privacyBreach?.targetCandidateKey).toBe('BOF-22-019');

    const internationalTransfer = await service.getBusinessObjectReview('BOF-22-020');
    expect(internationalTransfer?.decision).toBe('RELATIONSHIP');

    const privacyReview = await service.getBusinessObjectReview('BOF-22-021');
    expect(privacyReview?.decision).toBe('MERGE');
    expect(privacyReview?.targetCandidateKey).toBe('BOF-13-014');

    const knowledgeArticle = await service.getBusinessObjectReview('BOF-25-001');
    expect(knowledgeArticle?.decision).toBe('MERGE');
    expect(knowledgeArticle?.targetCandidateKey).toBe('BOF-07-007');

    const recordDeclaration = await service.getBusinessObjectReview('BOF-25-005');
    expect(recordDeclaration?.decision).toBe('RELATIONSHIP');
    expect(recordDeclaration?.proposedCanonicalName).toBe('Record Declaration');

    const recordFile = await service.getBusinessObjectReview('BOF-25-007');
    expect(recordFile?.decision).toBe('RENAME');
    expect(recordFile?.proposedCanonicalName).toBe('Record File Aggregation');

    const lessonLearned = await service.getBusinessObjectReview('BOF-25-010');
    expect(lessonLearned?.decision).toBe('MERGE');
    expect(lessonLearned?.targetCandidateKey).toBe('BOF-25-001');

    const publicAffairsIssue = await service.getBusinessObjectReview('BOF-25-018');
    expect(publicAffairsIssue?.decision).toBe('MERGE');
    expect(publicAffairsIssue?.targetCandidateKey).toBe('BOF-25-017');

    const annualReport = await service.getBusinessObjectReview('BOF-25-020');
    expect(annualReport?.decision).toBe('MERGE');
    expect(annualReport?.targetCandidateKey).toBe('BOF-07-007');

    const developmentOpportunity = await service.getBusinessObjectReview('BOF-04-001');
    expect(developmentOpportunity?.decision).toBe('VALIDATE_OBJECT');
    expect(developmentOpportunity?.proposedCanonicalName).toBe('Development Opportunity');

    const investmentCase = await service.getBusinessObjectReview('BOF-04-002');
    expect(investmentCase?.decision).toBe('MERGE');
    expect(investmentCase?.targetCandidateKey).toBe('BOF-04-003');

    const landOption = await service.getBusinessObjectReview('BOF-04-005');
    expect(landOption?.decision).toBe('MERGE');
    expect(landOption?.targetCandidateKey).toBe('BOF-08-002');

    const propertyInterest = await service.getBusinessObjectReview('BOF-04-008');
    expect(propertyInterest?.decision).toBe('RELATIONSHIP');

    const propertyValuation = await service.getBusinessObjectReview('BOF-04-012');
    expect(propertyValuation?.decision).toBe('RENAME');
    expect(propertyValuation?.proposedCanonicalName).toBe('Property Valuation');

    const planningObligation = await service.getBusinessObjectReview('BOF-04-017');
    expect(planningObligation?.decision).toBe('MERGE');
    expect(planningObligation?.targetCandidateKey).toBe('BOF-22-003');

    const strategyFramework = await service.getBusinessObjectReview('BOF-02-001');
    expect(strategyFramework?.decision).toBe('VALIDATE_OBJECT');
    expect(strategyFramework?.proposedCanonicalName).toBe('Strategy Framework');

    const governanceDecision = await service.getBusinessObjectReview('BOF-02-016');
    expect(governanceDecision?.decision).toBe('MERGE');
    expect(governanceDecision?.targetCandidateKey).toBe('BOF-06-023');

    const governanceAction = await service.getBusinessObjectReview('BOF-02-017');
    expect(governanceAction?.decision).toBe('MERGE');
    expect(governanceAction?.targetCandidateKey).toBe('BOF-06-024');

    const policy = await service.getBusinessObjectReview('BOF-02-018');
    expect(policy?.decision).toBe('MERGE');
    expect(policy?.targetCandidateKey).toBe('BOF-07-007');

    const authorityFramework = await service.getBusinessObjectReview('BOF-02-019');
    expect(authorityFramework?.decision).toBe('VALIDATE_OBJECT');
    expect(authorityFramework?.proposedCanonicalName).toBe('Authority Framework');

    const governanceRecord = await service.getBusinessObjectReview('BOF-02-020');
    expect(governanceRecord?.decision).toBe('MERGE');
    expect(governanceRecord?.targetCandidateKey).toBe('BOF-07-007');

    const bia = await service.getBusinessObjectReview('BOF-23-001');
    expect(bia?.decision).toBe('EVENT_EVIDENCE');
    expect(bia?.proposedCanonicalName).toBe('Business Impact Assessment');

    const crisisAction = await service.getBusinessObjectReview('BOF-23-007');
    expect(crisisAction?.decision).toBe('MERGE');
    expect(crisisAction?.targetCandidateKey).toBe('BOF-06-024');

    const crisisCommunication = await service.getBusinessObjectReview('BOF-23-008');
    expect(crisisCommunication?.decision).toBe('MERGE');
    expect(crisisCommunication?.targetCandidateKey).toBe('BOF-25-012');

    const visitorPass = await service.getBusinessObjectReview('BOF-23-011');
    expect(visitorPass?.decision).toBe('MERGE');
    expect(visitorPass?.targetCandidateKey).toBe('BOF-23-012');

    const securityRisk = await service.getBusinessObjectReview('BOF-23-015');
    expect(securityRisk?.decision).toBe('MERGE');
    expect(securityRisk?.targetCandidateKey).toBe('BOF-21-003');

    const technologyService = await service.getBusinessObjectReview('BOF-24-001');
    expect(technologyService?.decision).toBe('VALIDATE_OBJECT');
    expect(technologyService?.proposedCanonicalName).toBe('Technology Service');

    const appService = await service.getBusinessObjectReview('BOF-24-002');
    expect(appService?.decision).toBe('MERGE');
    expect(appService?.targetCandidateKey).toBe('BOF-24-001');

    const configItem = await service.getBusinessObjectReview('BOF-24-013');
    expect(configItem?.decision).toBe('RELATIONSHIP');
    expect(configItem?.proposedCanonicalName).toBe('Configuration Registration');

    const referenceDataset = await service.getBusinessObjectReview('BOF-24-019');
    expect(referenceDataset?.decision).toBe('MERGE');
    expect(referenceDataset?.targetCandidateKey).toBe('BOF-24-018');

    const aiRisk = await service.getBusinessObjectReview('BOF-24-028');
    expect(aiRisk?.decision).toBe('MERGE');
    expect(aiRisk?.targetCandidateKey).toBe('BOF-21-003');

    const cyberIncident = await service.getBusinessObjectReview('BOF-24-035');
    expect(cyberIncident?.decision).toBe('RENAME');
    expect(cyberIncident?.proposedCanonicalName).toBe('Cybersecurity Incident');

    const transformationPortfolio = await service.getBusinessObjectReview('BOF-26-001');
    expect(transformationPortfolio?.decision).toBe('MERGE');
    expect(transformationPortfolio?.targetCandidateKey).toBe('BOF-06-001');

    const changeAction = await service.getBusinessObjectReview('BOF-26-005');
    expect(changeAction?.decision).toBe('MERGE');
    expect(changeAction?.targetCandidateKey).toBe('BOF-06-024');

    const changeCommunication = await service.getBusinessObjectReview('BOF-26-006');
    expect(changeCommunication?.decision).toBe('MERGE');
    expect(changeCommunication?.targetCandidateKey).toBe('BOF-25-012');

    const processVersion = await service.getBusinessObjectReview('BOF-26-015');
    expect(processVersion?.decision).toBe('CHILD');
    expect(processVersion?.proposedCanonicalName).toBe('Process Version');

    const processMeasure = await service.getBusinessObjectReview('BOF-26-017');
    expect(processMeasure?.decision).toBe('MERGE');
    expect(processMeasure?.targetCandidateKey).toBe('BOF-02-008');

    const sop = await service.getBusinessObjectReview('BOF-26-021');
    expect(sop?.decision).toBe('MERGE');
    expect(sop?.targetCandidateKey).toBe('BOF-07-007');

    const processCompliance = await service.getBusinessObjectReview('BOF-26-022');
    expect(processCompliance?.decision).toBe('MERGE');
    expect(processCompliance?.targetCandidateKey).toBe('BOF-21-007');

    const workArea = await service.getBusinessObjectReview('BOF-12-004');
    expect(workArea?.decision).toBe('VALIDATE_OBJECT');
    expect(workArea?.proposedCanonicalName).toBe('Work Area');

    const accessEvent = await service.getBusinessObjectReview('BOF-12-007');
    expect(accessEvent?.decision).toBe('RENAME');
    expect(accessEvent?.proposedCanonicalName).toBe('Physical Access Event');

    const fieldProgress = await service.getBusinessObjectReview('BOF-12-009');
    expect(fieldProgress?.decision).toBe('MERGE');
    expect(fieldProgress?.targetCandidateKey).toBe('BOF-06-016');

    const materialUsage = await service.getBusinessObjectReview('BOF-12-012');
    expect(materialUsage?.decision).toBe('MERGE');
    expect(materialUsage?.targetCandidateKey).toBe('BOF-10-022');

    const temporaryWorks = await service.getBusinessObjectReview('BOF-12-014');
    expect(temporaryWorks?.decision).toBe('RENAME');
    expect(temporaryWorks?.proposedCanonicalName).toBe('Temporary Works Control Item');

    const deliveryConstraint = await service.getBusinessObjectReview('BOF-06-025');
    expect(deliveryConstraint?.decision).toBe('RENAME');
    expect(deliveryConstraint?.proposedCanonicalName).toBe('Delivery Constraint');

    const fieldConstraint = await service.getBusinessObjectReview('BOF-12-020');
    expect(fieldConstraint?.decision).toBe('MERGE');
    expect(fieldConstraint?.targetCandidateKey).toBe('BOF-06-025');

    const photoEvidence = await service.getBusinessObjectReview('BOF-12-022');
    expect(photoEvidence?.decision).toBe('MERGE');
    expect(photoEvidence?.targetCandidateKey).toBe('BOF-28-007');

    const completion = await service.getBusinessObjectReview('BOF-12-025');
    expect(completion?.decision).toBe('EVENT_EVIDENCE');
    expect(completion?.proposedCanonicalName).toBe('Field Completion Record');

    const site = await service.getBusinessObjectReview('BOF-16-003');
    expect(site?.decision).toBe('RENAME');
    expect(site?.proposedCanonicalName).toBe('Built Environment Site');

    expect(await service.seedFoundationCanonicalization('architecture-review')).toBe(0);
  });
});
