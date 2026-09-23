import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type CanonicalObjectIdentity,
  type ClearanceGrant,
  type Party,
  type Person,
  type SecurityClassificationAssignment,
  type SecurityClassificationLevel,
  type SecurityClassificationScheme,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlSecurityClassificationRepository } from './security-classification-repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL security classification runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('keeps classification clearance tenant/principal bound and rejects overlapping classifications', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = Date.now().toString(36);
    const tenantId = asId<'TenantId'>(`TENANT-SEC-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const security = new MySqlSecurityClassificationRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Security Classification Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    async function createPerson(label: string, name: string): Promise<Person> {
      const party: Party = {
        id: asId<'PartyId'>(`PARTY-${label}-${suffix}`, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: name,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);

      const person: Person = {
        id: asId<'PersonId'>(`PERSON-${label}-${suffix}`, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: name,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, person);
      return person;
    }

    const alice = await createPerson('A', 'Alice Classified');
    const bob = await createPerson('B', 'Bob Classified');

    const subject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-SEC-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `SECURITY-TEST-${suffix}`,
      createdAt: '2026-09-23T00:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, subject, {
      actorPersonId: alice.id
    });

    const scheme: SecurityClassificationScheme = {
      id: asId<'SecurityClassificationSchemeId'>(`SCS-${suffix}`, 'Security Classification Scheme'),
      tenantId,
      code: `CLASS-${suffix}`,
      name: 'Information Classification',
      kind: 'ORDINAL',
      status: 'ACTIVE'
    };
    await security.createScheme(scheme, { actorPersonId: alice.id });

    const official: SecurityClassificationLevel = {
      id: asId<'SecurityClassificationLevelId'>(`SCL-O-${suffix}`, 'Security Classification Level'),
      tenantId,
      schemeId: scheme.id,
      code: 'OFFICIAL',
      name: 'Official',
      rankOrder: 10,
      status: 'ACTIVE'
    };
    const sensitive: SecurityClassificationLevel = {
      id: asId<'SecurityClassificationLevelId'>(`SCL-S-${suffix}`, 'Security Classification Level'),
      tenantId,
      schemeId: scheme.id,
      code: 'SENSITIVE',
      name: 'Sensitive',
      rankOrder: 20,
      status: 'ACTIVE'
    };
    await security.createLevel(official, { actorPersonId: alice.id });
    await security.createLevel(sensitive, { actorPersonId: alice.id });

    const classification: SecurityClassificationAssignment = {
      id: asId<'SecurityClassificationAssignmentId'>(`SCA-${suffix}`, 'Security Classification Assignment'),
      tenantId,
      subjectObjectId: subject.id,
      subjectVersion: 'A.1',
      classificationLevelId: official.id,
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await security.assignClassification(classification, {
      actorPersonId: alice.id
    });

    const bobClearance: ClearanceGrant = {
      id: asId<'ClearanceGrantId'>(`CLR-B-${suffix}`, 'Clearance Grant'),
      tenantId,
      principalType: 'PERSON',
      principalId: bob.id,
      classificationLevelId: sensitive.id,
      includeLowerLevels: true,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await security.grantClearance(bobClearance, { actorPersonId: alice.id });

    const aliceDenied = await security.evaluateForPerson(
      tenantId,
      alice.id,
      subject.id,
      'A.1',
      { scopeType: 'PROJECT', scopeId: 'PROJECT-SECURITY' },
      '2026-09-23T12:00:00.000Z'
    );
    expect(aliceDenied.allowed).toBe(false);

    const aliceClearance: ClearanceGrant = {
      ...bobClearance,
      id: asId<'ClearanceGrantId'>(`CLR-A-${suffix}`, 'Clearance Grant'),
      principalId: alice.id
    };
    await security.grantClearance(aliceClearance, { actorPersonId: alice.id });

    const aliceAllowed = await security.evaluateForPerson(
      tenantId,
      alice.id,
      subject.id,
      'A.1',
      { scopeType: 'PROJECT', scopeId: 'PROJECT-SECURITY' },
      '2026-09-23T12:00:00.000Z'
    );

    expect(aliceAllowed.allowed).toBe(true);
    expect(aliceAllowed.classifications[0]?.matchedClearanceGrantId).toBe(
      aliceClearance.id
    );
    expect(
      aliceAllowed.principals.some(
        (principal) =>
          principal.principalType === 'PERSON' && principal.principalId === alice.id
      )
    ).toBe(true);

    const overlapping: SecurityClassificationAssignment = {
      ...classification,
      id: asId<'SecurityClassificationAssignmentId'>(
        `SCA-OVERLAP-${suffix}`,
        'Security Classification Assignment'
      ),
      classificationLevelId: sensitive.id
    };

    await expect(
      security.assignClassification(overlapping, {
        actorPersonId: alice.id
      })
    ).rejects.toThrow(
      'An overlapping active classification already exists for this subject/version and scheme.'
    );

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type IN (
            'SECURITY_CLASSIFICATION_SCHEME',
            'SECURITY_CLASSIFICATION_LEVEL',
            'SECURITY_CLASSIFICATION_ASSIGNMENT',
            'CLEARANCE_GRANT'
          )`,
      [tenantId]
    );

    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity_type: 'SECURITY_CLASSIFICATION_SCHEME',
          action: 'CREATED'
        }),
        expect.objectContaining({
          entity_type: 'SECURITY_CLASSIFICATION_ASSIGNMENT',
          action: 'ASSIGNED'
        }),
        expect.objectContaining({
          entity_type: 'CLEARANCE_GRANT',
          action: 'GRANTED'
        })
      ])
    );
  });
});
