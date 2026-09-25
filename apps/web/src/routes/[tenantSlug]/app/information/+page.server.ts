import {
  InformationCommandError,
  SecurityClassificationAdministrationCommandError,
  type MySqlAccessRepository,
  type MySqlInformationReadRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type RepresentationType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getInformationCommandService,
  getInformationReadRepository,
  getSecurityClassificationAdministrationCommandService,
  getSecurityClassificationAdministrationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlInformationReadRepository['getProjection']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}

function commandFailure(error: unknown, action: string) {
  if (
    error instanceof InformationCommandError ||
    error instanceof SecurityClassificationAdministrationCommandError
  ) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'CONFLICT'
            ? 409
            : 400;
    return fail(status, {
      action,
      ok: false,
      error: error.message,
      code: error.code
    });
  }
  throw error;
}

function parseRepresentationType(raw: string): RepresentationType {
  const allowed: ReadonlyArray<RepresentationType> = [
    'NATIVE',
    'PDF',
    'IMAGE',
    'DATA',
    'REPORT',
    'OTHER'
  ];
  if (!allowed.includes(raw as RepresentationType)) {
    throw new InformationCommandError(
      'A valid Representation type is required.',
      'INVALID_INPUT'
    );
  }
  return raw as RepresentationType;
}

function parseClassificationSubject(raw: string): {
  subjectObjectId: string;
  subjectVersion: string;
} {
  const [subjectObjectId = '', subjectVersion = ''] = raw.split('|');
  if (!subjectObjectId || !subjectVersion) {
    throw new SecurityClassificationAdministrationCommandError(
      'A valid Information Revision is required for classification.',
      'INVALID_INPUT'
    );
  }
  return { subjectObjectId, subjectVersion };
}

function parseRevisionReference(raw: string): {
  informationContainerId: string;
  informationRevisionId: string;
} {
  const [informationContainerId = '', informationRevisionId = ''] = raw.split('|');
  if (!informationContainerId || !informationRevisionId) {
    throw new InformationCommandError(
      'A valid released Information Revision is required.',
      'INVALID_INPUT'
    );
  }
  return { informationContainerId, informationRevisionId };
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return {
      allowed: false,
      canManage: false,
      canClassify: false,
      reason: 'No authenticated tenant context is available.',
      projection: null,
      securityProjection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [
    readEvaluation,
    manageEvaluation,
    securityReadEvaluation,
    securityManageEvaluation
  ] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.INFORMATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.INFORMATION_MANAGE,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.SECURITY_CLASSIFICATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.SECURITY_CLASSIFICATION_MANAGE,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!readEvaluation.allowed) {
    return {
      allowed: false,
      canManage: false,
      canClassify: false,
      reason: readEvaluation.reason,
      projection: null,
      securityProjection: null
    };
  }

  const [projection, securityProjection] = await Promise.all([
    getInformationReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    ),
    securityReadEvaluation.allowed
      ? getSecurityClassificationAdministrationReadRepository().getProjection(
          tenantId,
          session.personId
        )
      : Promise.resolve(null)
  ]);

  return {
    allowed: true,
    canManage: manageEvaluation.allowed,
    canClassify: securityReadEvaluation.allowed && securityManageEvaluation.allowed,
    reason: readEvaluation.reason,
    projection,
    securityProjection
  };
};

export const actions: Actions = {
  assignClassification: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'assignClassification',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    const subject = parseClassificationSubject(
      value(formData, 'classificationSubject')
    );

    try {
      const assignment =
        await getSecurityClassificationAdministrationCommandService().assignClassification(
          session.tenantId as TenantId,
          session.personId,
          {
            ...subject,
            classificationLevelId: value(formData, 'classificationLevelId'),
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );

      return {
        action: 'assignClassification',
        ok: true,
        message: `Security Classification ${assignment.id} assigned.`
      };
    } catch (error) {
      return commandFailure(error, 'assignClassification');
    }
  },

  createContainer: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createContainer',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    try {
      const created = await getInformationCommandService().createContainer(
        session.tenantId as TenantId,
        session.personId,
        {
          containerType: value(formData, 'containerType'),
          code: value(formData, 'code'),
          title: value(formData, 'title')
        }
      );
      return {
        action: 'createContainer',
        ok: true,
        message: `Information ${created.code} created.`
      };
    } catch (error) {
      return commandFailure(error, 'createContainer');
    }
  },

  createRevision: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createRevision',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    try {
      const created = await getInformationCommandService().createRevision(
        session.tenantId as TenantId,
        session.personId,
        {
          informationContainerId: value(formData, 'informationContainerId'),
          revision: value(formData, 'revision')
        }
      );
      return {
        action: 'createRevision',
        ok: true,
        message: `Revision ${created.revision} created.`
      };
    } catch (error) {
      return commandFailure(error, 'createRevision');
    }
  },

  createIteration: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createIteration',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    try {
      const created = await getInformationCommandService().createIteration(
        session.tenantId as TenantId,
        session.personId,
        { informationRevisionId: value(formData, 'informationRevisionId') }
      );
      return {
        action: 'createIteration',
        ok: true,
        message: `Iteration ${created.iteration} created.`
      };
    } catch (error) {
      return commandFailure(error, 'createIteration');
    }
  },

  freezeIteration: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'freezeIteration',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    try {
      const frozen = await getInformationCommandService().freezeIteration(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'iterationId')
      );
      return {
        action: 'freezeIteration',
        ok: true,
        message: `Iteration ${frozen.iteration} frozen.`
      };
    } catch (error) {
      return commandFailure(error, 'freezeIteration');
    }
  },

  createRepresentation: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createRepresentation',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    const fileName = optionalValue(formData, 'fileName');
    const integrityHash = optionalValue(formData, 'integrityHash');

    try {
      const created = await getInformationCommandService().createRepresentation(
        session.tenantId as TenantId,
        session.personId,
        {
          informationIterationId: value(formData, 'informationIterationId'),
          representationType: parseRepresentationType(
            value(formData, 'representationType')
          ),
          mediaType: value(formData, 'mediaType'),
          ...(fileName ? { fileName } : {}),
          contentReference: value(formData, 'contentReference'),
          ...(integrityHash ? { integrityHash } : {})
        }
      );
      return {
        action: 'createRepresentation',
        ok: true,
        message: `${created.representationType} Representation recorded.`
      };
    } catch (error) {
      return commandFailure(error, 'createRepresentation');
    }
  },

  releaseRevision: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'releaseRevision',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    try {
      const released = await getInformationCommandService().releaseRevision(
        session.tenantId as TenantId,
        session.personId,
        {
          informationRevisionId: value(formData, 'informationRevisionId'),
          releasedIterationId: value(formData, 'releasedIterationId'),
          decisionId: value(formData, 'decisionId')
        }
      );
      return {
        action: 'releaseRevision',
        ok: true,
        message: `Revision ${released.revision} released.`
      };
    } catch (error) {
      return commandFailure(error, 'releaseRevision');
    }
  },

  issueInformation: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'issueInformation',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    const reference = parseRevisionReference(value(formData, 'revisionReference'));
    const representationId = optionalValue(formData, 'representationId');
    const recipientContext = optionalValue(formData, 'recipientContext');

    try {
      const issued = await getInformationCommandService().issueInformation(
        session.tenantId as TenantId,
        session.personId,
        {
          ...reference,
          ...(representationId ? { representationId } : {}),
          issueReference: value(formData, 'issueReference'),
          issuePurpose: value(formData, 'issuePurpose'),
          ...(recipientContext ? { recipientContext } : {})
        }
      );
      return {
        action: 'issueInformation',
        ok: true,
        message: `Issue ${issued.issueReference} recorded.`
      };
    } catch (error) {
      return commandFailure(error, 'issueInformation');
    }
  }
};
