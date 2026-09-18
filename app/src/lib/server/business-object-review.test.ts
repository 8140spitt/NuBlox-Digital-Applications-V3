import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const directory = mkdtempSync(join(tmpdir(), 'nublox-object-review-'));
process.env.NUBLOX_DB_PATH = join(directory, 'business-object-review.test.db');

let service: typeof import('./business-object-review');

beforeAll(async () => {
  service = await import('./business-object-review');
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe('canonical business object review ledger', () => {
  it('persists the current decision and immutable review history', () => {
    service.saveBusinessObjectReview(
      'BOF-16-003',
      { decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Site', notes: 'Stable spatial identity.' },
      'Reviewer One',
      'review-tenant'
    );

    service.saveBusinessObjectReview(
      'BOF-16-003',
      { decision: 'RENAME', proposedCanonicalName: 'Built Environment Site', notes: 'Differentiate from project site usage.' },
      'Reviewer Two',
      'review-tenant'
    );

    const current = service.getBusinessObjectReview('BOF-16-003');
    expect(current?.decision).toBe('RENAME');
    expect(current?.proposedCanonicalName).toBe('Built Environment Site');
    expect(service.listBusinessObjectReviews()).toHaveLength(1);

    const events = service.listBusinessObjectReviewEvents('BOF-16-003');
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.decision)).toEqual(['RENAME', 'VALIDATE_OBJECT']);
    expect(events[0].actor).toBe('Reviewer Two');
  });

  it('requires a merge target and prevents self merge', () => {
    expect(() => service.saveBusinessObjectReview(
      'BOF-09-006',
      { decision: 'MERGE' },
      'Reviewer',
      'review-tenant'
    )).toThrow('A merge target is required.');

    expect(() => service.saveBusinessObjectReview(
      'BOF-09-006',
      { decision: 'MERGE', targetCandidateKey: 'BOF-09-006' },
      'Reviewer',
      'review-tenant'
    )).toThrow('An object cannot be merged into itself.');
  });

  it('seeds the governed foundation baseline without overwriting an existing human decision', () => {
    const inserted = service.seedFoundationCanonicalization('architecture-review');
    expect(inserted).toBeGreaterThan(0);

    const party = service.getBusinessObjectReview('BOF-01-002');
    expect(party?.decision).toBe('VALIDATE_OBJECT');
    expect(party?.proposedCanonicalName).toBe('Party');

    const authority = service.getBusinessObjectReview('BOF-01-019');
    expect(authority?.decision).toBe('VALIDATE_OBJECT');
    expect(authority?.proposedCanonicalName).toBe('Delegated Authority');

    const responsibility = service.getBusinessObjectReview('BOF-06-020');
    expect(responsibility?.decision).toBe('RELATIONSHIP');

    const duplicateResponsibility = service.getBusinessObjectReview('BOF-07-005');
    expect(duplicateResponsibility?.decision).toBe('MERGE');
    expect(duplicateResponsibility?.targetCandidateKey).toBe('BOF-06-020');

    const job = service.getBusinessObjectReview('BOF-06-004');
    expect(job?.decision).toBe('MERGE');
    expect(job?.targetCandidateKey).toBe('BOF-06-003');

    const item = service.getBusinessObjectReview('BOF-10-001');
    expect(item?.decision).toBe('RENAME');
    expect(item?.proposedCanonicalName).toBe('Item');

    const workItem = service.getBusinessObjectReview('BOF-27-001');
    expect(workItem?.decision).toBe('VALIDATE_OBJECT');
    expect(workItem?.proposedCanonicalName).toBe('Work Item');

    const workDelegation = service.getBusinessObjectReview('BOF-27-010');
    expect(workDelegation?.decision).toBe('RELATIONSHIP');
    expect(workDelegation?.proposedCanonicalName).toBe('Work Delegation');

    const outbox = service.getBusinessObjectReview('BOF-28-015');
    expect(outbox?.decision).toBe('RENAME');
    expect(outbox?.proposedCanonicalName).toBe('Outbox Message');

    const jurisdiction = service.getBusinessObjectReview('BOF-29-001');
    expect(jurisdiction?.decision).toBe('VALIDATE_OBJECT');
    expect(jurisdiction?.proposedCanonicalName).toBe('Jurisdiction');

    const uniclass = service.getBusinessObjectReview('BOF-29-013');
    expect(uniclass?.decision).toBe('MERGE');
    expect(uniclass?.targetCandidateKey).toBe('BOF-29-012');

    const workflowTemplate = service.getBusinessObjectReview('BOF-29-019');
    expect(workflowTemplate?.decision).toBe('MERGE');
    expect(workflowTemplate?.targetCandidateKey).toBe('BOF-29-018');

    const opportunity = service.getBusinessObjectReview('BOF-03-008');
    expect(opportunity?.decision).toBe('VALIDATE_OBJECT');
    expect(opportunity?.proposedCanonicalName).toBe('Opportunity');

    const customerRelationship = service.getBusinessObjectReview('BOF-03-016');
    expect(customerRelationship?.decision).toBe('MERGE');
    expect(customerRelationship?.targetCandidateKey).toBe('BOF-01-016');

    const complaint = service.getBusinessObjectReview('BOF-03-015');
    expect(complaint?.decision).toBe('MERGE');
    expect(complaint?.targetCandidateKey).toBe('BOF-03-014');

    const estimate = service.getBusinessObjectReview('BOF-05-003');
    expect(estimate?.decision).toBe('VALIDATE_OBJECT');
    expect(estimate?.proposedCanonicalName).toBe('Estimate');

    const supplierEnquiry = service.getBusinessObjectReview('BOF-05-014');
    expect(supplierEnquiry?.decision).toBe('MERGE');
    expect(supplierEnquiry?.targetCandidateKey).toBe('BOF-09-009');

    const contingency = service.getBusinessObjectReview('BOF-05-012');
    expect(contingency?.decision).toBe('MERGE');
    expect(contingency?.targetCandidateKey).toBe('BOF-05-011');

    const offerAcceptance = service.getBusinessObjectReview('BOF-05-023');
    expect(offerAcceptance?.decision).toBe('EVENT_EVIDENCE');
    expect(offerAcceptance?.proposedCanonicalName).toBe('Offer Acceptance');

    const workerRelationship = service.getBusinessObjectReview('BOF-18-001');
    expect(workerRelationship?.decision).toBe('VALIDATE_OBJECT');
    expect(workerRelationship?.proposedCanonicalName).toBe('Worker Relationship');

    const candidate = service.getBusinessObjectReview('BOF-18-036');
    expect(candidate?.decision).toBe('MERGE');
    expect(candidate?.targetCandidateKey).toBe('BOF-01-003');

    const availability = service.getBusinessObjectReview('BOF-18-019');
    expect(availability?.decision).toBe('PROJECTION');

    const payslip = service.getBusinessObjectReview('BOF-18-033');
    expect(payslip?.decision).toBe('MERGE');
    expect(payslip?.targetCandidateKey).toBe('BOF-07-007');

    const handoverTraining = service.getBusinessObjectReview('BOF-15-014');
    expect(handoverTraining?.decision).toBe('MERGE');
    expect(handoverTraining?.targetCandidateKey).toBe('BOF-18-016');

    const qualityPlan = service.getBusinessObjectReview('BOF-13-001');
    expect(qualityPlan?.decision).toBe('VALIDATE_OBJECT');
    expect(qualityPlan?.proposedCanonicalName).toBe('Quality Plan');

    const witnessPoint = service.getBusinessObjectReview('BOF-13-006');
    expect(witnessPoint?.decision).toBe('MERGE');
    expect(witnessPoint?.targetCandidateKey).toBe('BOF-13-005');

    const riskAssessment = service.getBusinessObjectReview('BOF-13-018');
    expect(riskAssessment?.decision).toBe('MERGE');
    expect(riskAssessment?.targetCandidateKey).toBe('BOF-21-003');

    const sitePermit = service.getBusinessObjectReview('BOF-12-017');
    expect(sitePermit?.decision).toBe('MERGE');
    expect(sitePermit?.targetCandidateKey).toBe('BOF-13-021');

    const complianceRegister = service.getBusinessObjectReview('BOF-13-033');
    expect(complianceRegister?.decision).toBe('PROJECTION');

    const dutyholder = service.getBusinessObjectReview('BOF-14-001');
    expect(dutyholder?.decision).toBe('RELATIONSHIP');
    expect(dutyholder?.proposedCanonicalName).toBe('Dutyholder Assignment');

    const buildingControlApplication = service.getBusinessObjectReview('BOF-14-005');
    expect(buildingControlApplication?.decision).toBe('MERGE');
    expect(buildingControlApplication?.targetCandidateKey).toBe('BOF-14-004');

    const regulatoryInspection = service.getBusinessObjectReview('BOF-14-007');
    expect(regulatoryInspection?.decision).toBe('MERGE');
    expect(regulatoryInspection?.targetCandidateKey).toBe('BOF-13-003');

    const statutoryCertificate = service.getBusinessObjectReview('BOF-14-013');
    expect(statutoryCertificate?.decision).toBe('RENAME');
    expect(statutoryCertificate?.proposedCanonicalName).toBe('Statutory Completion Certificate');

    const goldenThread = service.getBusinessObjectReview('BOF-14-014');
    expect(goldenThread?.decision).toBe('PROJECTION');

    const regulatorySubmission = service.getBusinessObjectReview('BOF-14-015');
    expect(regulatorySubmission?.decision).toBe('MERGE');
    expect(regulatorySubmission?.targetCandidateKey).toBe('BOF-27-013');

    const carbonBaseline = service.getBusinessObjectReview('BOF-20-003');
    expect(carbonBaseline?.decision).toBe('RENAME');
    expect(carbonBaseline?.proposedCanonicalName).toBe('Carbon Baseline Snapshot');

    const embodiedCarbon = service.getBusinessObjectReview('BOF-20-007');
    expect(embodiedCarbon?.decision).toBe('CHILD');
    expect(embodiedCarbon?.proposedCanonicalName).toBe('Carbon Assessment Line');

    const sustainabilityUtility = service.getBusinessObjectReview('BOF-20-010');
    expect(sustainabilityUtility?.decision).toBe('MERGE');
    expect(sustainabilityUtility?.targetCandidateKey).toBe('BOF-17-030');

    const climateRisk = service.getBusinessObjectReview('BOF-20-023');
    expect(climateRisk?.decision).toBe('MERGE');
    expect(climateRisk?.targetCandidateKey).toBe('BOF-21-002');

    const costCarbon = service.getBusinessObjectReview('BOF-20-025');
    expect(costCarbon?.decision).toBe('PROJECTION');

    const site = service.getBusinessObjectReview('BOF-16-003');
    expect(site?.decision).toBe('RENAME');
    expect(site?.proposedCanonicalName).toBe('Built Environment Site');

    expect(service.seedFoundationCanonicalization('architecture-review')).toBe(0);
  });
});
