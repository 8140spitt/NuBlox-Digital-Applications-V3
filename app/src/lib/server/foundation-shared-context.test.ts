import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';
import type { WorkItem } from './shared-work';

let contextService: typeof import('./platform-context');
let personService: typeof import('./foundation-person');
let organisationService: typeof import('./foundation-organisation');
let legalEntityService: typeof import('./foundation-legal-entity');
let relationshipService: typeof import('./foundation-party-relationship');
let structureService: typeof import('./organisation-structure');
let authorityService: typeof import('./delegated-authority');
let sharedWorkService: typeof import('./shared-work');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  personService = await import('./foundation-person');
  organisationService = await import('./foundation-organisation');
  legalEntityService = await import('./foundation-legal-entity');
  relationshipService = await import('./foundation-party-relationship');
  structureService = await import('./organisation-structure');
  authorityService = await import('./delegated-authority');
  sharedWorkService = await import('./shared-work');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('shared foundation relationship, structure and authority aggregates', () => {
  it('governs Party Relationships without duplicating Party masters', async () => {
    const tenant = 'relationship-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const customer = await organisationService.createOrganisation(context, {
      legalName: 'Customer One Limited'
    });
    const supplier = await organisationService.createOrganisation(context, {
      legalName: 'Supplier One Limited'
    });

    await organisationService.activateOrganisation(context, customer, 1);
    await organisationService.activateOrganisation(context, supplier, 1);

    const id = await relationshipService.createPartyRelationship(context, {
      fromPartyId: customer,
      toPartyId: supplier,
      relationshipType: 'SUPPLIER',
      contextType: 'TENANT'
    });
    let relationship = (await relationshipService.listPartyRelationships(context)).find(
      (item) => item.id === id
    )!;
    expect(relationship.status).toBe('PROPOSED');
    expect(relationship.relationshipType).toBe('SUPPLIER');

    await relationshipService.activatePartyRelationship(context, id, relationship.version);
    relationship = (await relationshipService.listPartyRelationships(context)).find(
      (item) => item.id === id
    )!;
    expect(relationship.status).toBe('ACTIVE');

    const parties = await db.queryRows<any>(
      'SELECT id FROM parties WHERE tenant_id = ? AND id IN (?, ?)',
      [context.tenantId, customer, supplier]
    );
    expect(parties).toHaveLength(2);

    const events = await db.queryRows<any>(
      'SELECT aggregate_id AS aggregateId FROM business_events WHERE tenant_id = ? AND aggregate_object_id = ?',
      [context.tenantId, id]
    );
    expect(events.every((event) => event.aggregateId === 'AGG-01-PARTY-RELATIONSHIP')).toBe(true);
  });

  it('maintains effective Organisation Unit hierarchy without cycles', async () => {
    const tenant = 'structure-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const legalEntityId = await organisationService.createOrganisation(context, {
      legalName: 'NuBlox Delivery Limited',
      registrationNumber: 'ORG-' + randomUUID().slice(0, 8),
      countryCode: 'GB'
    });
    await organisationService.activateOrganisation(context, legalEntityId, 1);
    const organisation = await organisationService.getOrganisation(context, legalEntityId);
    await legalEntityService.designateLegalEntity(
      context,
      legalEntityId,
      {
        legalEntityType: 'LIMITED_COMPANY',
        jurisdictionCode: 'GB',
        statutoryIdentifier: 'STAT-' + randomUUID().slice(0, 8),
        accountingCurrency: 'GBP'
      },
      organisation.version
    );

    const divisionId = await structureService.createOrganisationUnit(context, {
      unitCode: 'DIV-' + randomUUID().slice(0, 6),
      name: 'Construction Division',
      unitType: 'DIVISION',
      accountableLegalEntityPartyId: legalEntityId
    });
    const teamId = await structureService.createOrganisationUnit(context, {
      unitCode: 'TEAM-' + randomUUID().slice(0, 6),
      name: 'Project Delivery Team',
      unitType: 'TEAM',
      accountableLegalEntityPartyId: legalEntityId
    });

    await structureService.activateOrganisationUnit(context, divisionId, 1);
    await structureService.activateOrganisationUnit(context, teamId, 1);
    const relationId = await structureService.assignOrganisationUnitParent(
      context,
      teamId,
      divisionId
    );
    expect(relationId).toBeTruthy();

    let team = (await structureService.listOrganisationUnits(context)).find(
      (unit) => unit.id === teamId
    )!;
    expect(team.version).toBe(3);

    let hierarchy = await structureService.listOrganisationUnitHierarchy(context);
    expect(
      hierarchy.some(
        (edge) =>
          edge.id === relationId &&
          edge.childUnitId === teamId &&
          edge.parentUnitId === divisionId &&
          edge.status === 'ACTIVE'
      )
    ).toBe(true);

    await expect(
      structureService.assignOrganisationUnitParent(context, divisionId, teamId)
    ).rejects.toThrow('cycle');

    await structureService.removeOrganisationUnitParent(context, teamId, team.version);
    team = (await structureService.listOrganisationUnits(context)).find(
      (unit) => unit.id === teamId
    )!;
    expect(team.version).toBe(4);
    hierarchy = await structureService.listOrganisationUnitHierarchy(context);
    expect(hierarchy.find((edge) => edge.id === relationId)?.status).toBe('ENDED');
  });

  it('enforces approved, effective and value-constrained Delegated Authority', async () => {
    const tenant = 'authority-grant-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const delegatePartyId = await personService.createPerson(context, {
      givenName: 'Amina',
      familyName: 'Approver'
    });

    const id = await authorityService.createDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      basis: 'Board-approved delegation matrix',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      valueLimit: 250000,
      allowSubdelegation: false
    });

    let grant = (await authorityService.listDelegatedAuthorities(context)).find(
      (item) => item.id === id
    )!;
    expect(grant.status).toBe('DRAFT');
    await authorityService.approveDelegatedAuthority(context, id, grant.version);
    grant = (await authorityService.listDelegatedAuthorities(context)).find(
      (item) => item.id === id
    )!;
    await authorityService.activateDelegatedAuthority(context, id, grant.version);
    grant = (await authorityService.listDelegatedAuthorities(context)).find(
      (item) => item.id === id
    )!;
    expect(grant.status).toBe('ACTIVE');

    const withinLimit = await authorityService.findEffectiveDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 100000
    });
    expect(withinLimit?.id).toBe(id);

    const overLimit = await authorityService.findEffectiveDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 300000
    });
    expect(overLimit).toBeNull();

    await authorityService.revokeDelegatedAuthority(
      context,
      id,
      grant.version,
      'Delegation withdrawn.'
    );
    expect(
      (await authorityService.listDelegatedAuthorities(context)).find((item) => item.id === id)
        ?.status
    ).toBe('REVOKED');

    const revoked = await authorityService.findEffectiveDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 1000
    });
    expect(revoked).toBeNull();
  });

  it('orchestrates assigned My Work without mutating domain subject truth', async () => {
    const tenant = 'shared-work-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const subjectId = 'subject-' + randomUUID();

    const workflowId = await sharedWorkService.createWorkflowInstance(context, {
      definitionKey: 'test.review',
      definitionVersion: '1',
      subjectType: 'TEST_SUBJECT',
      subjectId,
      subjectVersion: '7',
      currentState: 'REVIEW'
    });
    const workItemId = await sharedWorkService.createWorkItem(context, workflowId, {
      workType: 'REVIEW',
      title: 'Review governed subject',
      instructions: 'Review the exact subject version without changing its domain state.',
      priority: 'HIGH',
      dueAt: new Date(Date.now() + 86_400_000).toISOString()
    });
    await sharedWorkService.assignWorkItem(context, workItemId, {
      assigneeType: 'PARTY',
      assigneeId: context.actorPartyId,
      basis: 'Current tenant reviewer'
    });

    let myWork = await sharedWorkService.listMyWork(context);
    let item: WorkItem = myWork.find((entry) => entry.id === workItemId)!;
    expect(item.status).toBe('ASSIGNED');
    expect(item.subjectId).toBe(subjectId);
    expect(item.subjectVersion).toBe('7');
    expect(item.version).toBe(2);

    await expect(
      sharedWorkService.completeWorkflowInstance(
        context,
        workflowId,
        3,
        'Premature completion must be rejected.'
      )
    ).rejects.toThrow('open Work Items');

    item = await sharedWorkService.changeWorkItemDueDate(
      context,
      workItemId,
      item.version,
      new Date(Date.now() + 2 * 86_400_000).toISOString(),
      'Reviewer availability changed.'
    );
    expect(item.version).toBe(3);

    item = await sharedWorkService.changeWorkItemPriority(
      context,
      workItemId,
      item.version,
      'URGENT',
      'Decision date brought forward.'
    );
    expect(item.version).toBe(4);
    expect(item.priority).toBe('URGENT');

    const acknowledgementId = await sharedWorkService.acknowledgeWorkItem(context, workItemId, {
      acknowledgementType: 'RECEIVED',
      statement: 'Work received.'
    });
    expect(acknowledgementId).toBeTruthy();

    item = await sharedWorkService.startWorkItem(context, workItemId, item.version);
    expect(item.status).toBe('IN_PROGRESS');
    expect(item.version).toBe(5);
    item = await sharedWorkService.completeWorkItem(
      context,
      workItemId,
      item.version,
      'Review completed; any domain transition must occur through its own aggregate command.'
    );
    expect(item.status).toBe('COMPLETED');
    expect(item.version).toBe(6);

    myWork = await sharedWorkService.listMyWork(context);
    expect(myWork.some((entry) => entry.id === workItemId)).toBe(false);

    let workflow = (await sharedWorkService.listWorkflowInstances(context)).find(
      (entry) => entry.id === workflowId
    )!;
    expect(workflow.version).toBe(8);
    expect(workflow.subjectId).toBe(subjectId);

    workflow = await sharedWorkService.completeWorkflowInstance(
      context,
      workflowId,
      workflow.version,
      'All governed review work is complete.'
    );
    expect(workflow.status).toBe('COMPLETED');
    expect(workflow.version).toBe(9);
    expect(workflow.completionReason).toBe('All governed review work is complete.');

    const assignments = await db.queryRows<any>(
      'SELECT status, valid_to AS validTo FROM work_assignments WHERE work_item_id = ?',
      [workItemId]
    );
    expect(assignments).toHaveLength(1);
    expect(assignments[0].status).toBe('COMPLETED');
    expect(assignments[0].validTo).toBeTruthy();

    const evidenceRows = await db.queryRows<any>(
      'SELECT aggregate_id AS aggregateId, aggregate_object_id AS aggregateObjectId FROM business_events WHERE tenant_id = ? AND aggregate_object_id = ?',
      [context.tenantId, workflowId]
    );
    expect(evidenceRows.length).toBeGreaterThanOrEqual(7);
    expect(evidenceRows.every((event) => event.aggregateId === 'AGG-27-WORKFLOW')).toBe(true);
  });


  it('records and resolves shared-work escalations as governed workflow evidence', async () => {
    const tenant = 'work-escalation-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const workflowId = await sharedWorkService.createWorkflowInstance(context, {
      definitionKey: 'test.escalation',
      definitionVersion: '1',
      subjectType: 'TEST_SUBJECT',
      subjectId: 'subject-' + randomUUID()
    });
    const workItemId = await sharedWorkService.createWorkItem(context, workflowId, {
      workType: 'REVIEW',
      title: 'Escalation test work item'
    });
    await sharedWorkService.assignWorkItem(context, workItemId, {
      assigneeType: 'PARTY',
      assigneeId: context.actorPartyId,
      basis: 'Escalation test assignment'
    });

    const escalationId = await sharedWorkService.escalateWorkItem(context, workItemId, {
      triggerCode: 'SLA.BREACH',
      ruleKey: 'review.sla.24h',
      reason: 'Review exceeded the governed service-level threshold.'
    });
    let escalation = (await sharedWorkService.listWorkEscalations(context, workItemId)).find(
      (entry) => entry.id === escalationId
    )!;
    expect(escalation.status).toBe('OPEN');
    expect(escalation.triggerCode).toBe('SLA.BREACH');

    escalation = await sharedWorkService.resolveWorkEscalation(
      context,
      escalationId,
      'Escalation reviewed and recovered.'
    );
    expect(escalation.status).toBe('RESOLVED');
    expect(escalation.resolvedAt).toBeTruthy();

    const workflow = (await sharedWorkService.listWorkflowInstances(context)).find(
      (entry) => entry.id === workflowId
    )!;
    expect(workflow.version).toBe(5);

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_object_id = ? AND event_type IN ('WORK_ITEM_ESCALATED', 'WORK_ITEM_ESCALATION_RESOLVED') ORDER BY aggregate_version",
      [context.tenantId, workflowId]
    );
    expect(events.map((event) => event.eventType)).toEqual([
      'WORK_ITEM_ESCALATED',
      'WORK_ITEM_ESCALATION_RESOLVED'
    ]);
    expect(events.map((event) => Number(event.aggregateVersion))).toEqual([4, 5]);
  });

});
