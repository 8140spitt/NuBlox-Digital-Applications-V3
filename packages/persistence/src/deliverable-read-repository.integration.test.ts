import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type CanonicalObjectIdentity,
  type DeliverableAuthoringBinding,
  type DeliverableItem,
  type DeliverableRequirement,
  type DeliverableResponsibility,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { MySqlDeliverableReadRepository } from './deliverable-read-repository.js';
import { MySqlDeliverableRepository } from './deliverable-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('deliverable workspace read projection', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('projects governed requirements, items, authoring and responsibility per tenant', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const kernel = new MySqlKernelRepository(pool);
    const deliverables = new MySqlDeliverableRepository(pool);
    const reads = new MySqlDeliverableReadRepository(pool);

    async function seedTenant(label: string) {
      const tenantId = asId<'TenantId'>(`TENANT-DEL-READ-${label}-${suffix}`, 'Tenant');
      const tenant: Tenant = { id: tenantId, name: `Deliverable Read ${label}`, status: 'ACTIVE' };
      await kernel.createTenant(tenant);

      const party: Party = {
        id: asId<'PartyId'>(`PARTY-DEL-READ-${label}-${suffix}`, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: `Deliverable Author ${label}`,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);
      const person: Person = {
        id: asId<'PersonId'>(`PERSON-DEL-READ-${label}-${suffix}`, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: `Deliverable Author ${label}`,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, person);

      const project: CanonicalObjectIdentity = {
        id: asId<'CanonicalObjectId'>(`PROJECT-DEL-READ-${label}-${suffix}`, 'Canonical Object'),
        tenantId,
        objectType: 'PROJECT',
        stableKey: `PROJECT-${label}-${suffix}`,
        createdAt: new Date().toISOString()
      };
      const itemObject: CanonicalObjectIdentity = {
        id: asId<'CanonicalObjectId'>(`OBJ-DEL-READ-${label}-${suffix}`, 'Canonical Object'),
        tenantId,
        objectType: 'DELIVERABLE_ITEM',
        stableKey: `DEL-${label}-${suffix}`,
        createdAt: new Date().toISOString()
      };
      const outputObject: CanonicalObjectIdentity = {
        id: asId<'CanonicalObjectId'>(`OBJ-INFO-DEL-READ-${label}-${suffix}`, 'Canonical Object'),
        tenantId,
        objectType: 'INFORMATION_CONTAINER',
        stableKey: `A-${label}-${suffix}`,
        createdAt: new Date().toISOString()
      };
      for (const object of [project, itemObject, outputObject]) {
        await kernel.createCanonicalObject(tenantId, object, { actorPersonId: person.id });
      }

      const requirement: DeliverableRequirement = {
        id: asId<'DeliverableRequirementId'>(`REQ-DEL-READ-${label}-${suffix}`, 'Deliverable Requirement'),
        tenantId,
        code: `REQ-${label}-${suffix}`,
        title: `Drawing requirement ${label}`,
        deliverableType: 'DRAWING',
        description: 'Provide a governed drawing.',
        functionId: asId<'FunctionId'>('F27', 'Function'),
        contextObjectId: project.id,
        authoringMode: 'NATIVE',
        requiredRepresentationTypes: ['PDF'],
        acceptanceRequired: true,
        status: 'ACTIVE'
      };
      await deliverables.createRequirement(tenantId, requirement, { actorPersonId: person.id });

      const item: DeliverableItem = {
        id: asId<'DeliverableItemId'>(`ITEM-DEL-READ-${label}-${suffix}`, 'Deliverable Item'),
        tenantId,
        canonicalObjectId: itemObject.id,
        requirementId: requirement.id,
        contextObjectId: project.id,
        code: `DEL-${label}-${suffix}`,
        title: `Drawing ${label}`,
        deliverableType: 'DRAWING',
        status: 'PLANNED'
      };
      await deliverables.createItem(tenantId, item, { actorPersonId: person.id });

      const binding: DeliverableAuthoringBinding = {
        id: asId<'DeliverableAuthoringBindingId'>(`AUTH-BIND-${label}-${suffix}`, 'Deliverable Authoring Binding'),
        tenantId,
        deliverableItemId: item.id,
        mode: 'NATIVE',
        providerKey: 'NUBLOX_INFORMATION',
        authoritativeObjectId: outputObject.id,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
      };
      await deliverables.createAuthoringBinding(tenantId, binding, { actorPersonId: person.id });

      const responsibility: DeliverableResponsibility = {
        id: asId<'DeliverableResponsibilityId'>(`RESP-DEL-READ-${label}-${suffix}`, 'Deliverable Responsibility'),
        tenantId,
        deliverableItemId: item.id,
        principalType: 'PERSON',
        principalId: person.id,
        responsibilityRole: 'RESPONSIBLE',
        effectiveFrom: '2026-09-21T00:00:00.000Z',
        status: 'ACTIVE'
      };
      await deliverables.addResponsibility(tenantId, responsibility, { actorPersonId: person.id });

      return { tenantId, person, requirement, item, binding, responsibility };
    }

    const a = await seedTenant('A');
    const b = await seedTenant('B');

    const projectionA = await reads.getProjection(a.tenantId);
    expect(projectionA.requirements).toHaveLength(1);
    expect(projectionA.requirements[0]).toEqual(
      expect.objectContaining({
        id: a.requirement.id,
        code: a.requirement.code,
        items: [
          expect.objectContaining({
            id: a.item.id,
            authoringBinding: expect.objectContaining({
              id: a.binding.id,
              mode: 'NATIVE'
            }),
            responsibilities: [
              expect.objectContaining({
                id: a.responsibility.id,
                principalName: a.person.legalName,
                responsibilityRole: 'RESPONSIBLE'
              })
            ]
          })
        ]
      })
    );
    expect(projectionA.totals).toMatchObject({
      requirements: 1,
      items: 1,
      activeItems: 1
    });
    expect(projectionA.requirements[0]?.id).not.toBe(b.requirement.id);

    const projectionB = await reads.getProjection(b.tenantId);
    expect(projectionB.requirements).toHaveLength(1);
    expect(projectionB.requirements[0]?.id).toBe(b.requirement.id);
    expect(projectionB.requirements[0]?.items[0]?.id).toBe(b.item.id);
  });
});
