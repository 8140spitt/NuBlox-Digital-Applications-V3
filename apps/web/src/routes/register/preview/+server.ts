import { json, type RequestHandler } from '@sveltejs/kit';
import {
  CbeOperatingProfileError,
  MySqlCbeOperatingProfileService,
  TenantProvisioningError,
  type CbeArchetypeCode,
  type CbeContractualPositionCode,
  type TenantSizeTier
} from '@nublox/persistence';
import {
  getDatabasePool,
  getTenantProvisioningService
} from '$lib/server/platform';

const SIZE_TIERS = new Set<TenantSizeTier>([
  'MICRO',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'ENTERPRISE'
]);

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function values(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function positiveInteger(value: string, required: boolean): number | undefined {
  if (!value && !required) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const sizeTier = value(formData, 'sizeTier') as TenantSizeTier;
  const employeeCount = positiveInteger(value(formData, 'employeeCount'), false);
  const legalEntityCount = positiveInteger(value(formData, 'legalEntityCount'), true);

  if (!SIZE_TIERS.has(sizeTier)) {
    return json({ error: 'Choose a valid business size tier.' }, { status: 400 });
  }
  if (Number.isNaN(employeeCount)) {
    return json(
      { error: 'Employee count must be a positive whole number when supplied.' },
      { status: 400 }
    );
  }
  if (!legalEntityCount || Number.isNaN(legalEntityCount)) {
    return json(
      { error: 'Number of legal entities must be a positive whole number.' },
      { status: 400 }
    );
  }

  try {
    const preview = await getTenantProvisioningService().preview({
      primaryClassificationValueId: value(
        formData,
        'primaryClassificationValueId'
      ),
      sizeTier,
      ...(employeeCount !== undefined ? { employeeCount } : {}),
      legalEntityCount,
      primaryCountryCode: value(formData, 'primaryCountryCode'),
      primaryLanguageCode: value(formData, 'primaryLanguageCode'),
      operatingModelCodes: values(formData, 'operatingModelCodes'),
      regulatoryRegimeIds: values(formData, 'regulatoryRegimeIds')
    });

    let cbeOperatingProfile = null;
    if (preview.industrySolutionIds.includes('CBE')) {
      const archetypeCode = value(formData, 'cbeArchetypeCode');
      const contractualPositionCode = value(formData, 'cbeContractualPositionCode');
      const employsOperatives = value(formData, 'cbeEmploysOperatives');

      if (
        !archetypeCode ||
        !contractualPositionCode ||
        !['Y', 'N'].includes(employsOperatives)
      ) {
        return json(
          { error: 'Complete the Construction & Built Environment operating-profile questions.' },
          { status: 400 }
        );
      }

      cbeOperatingProfile = await new MySqlCbeOperatingProfileService(
        getDatabasePool()
      ).preview(sizeTier, {
        archetypeCode: archetypeCode as CbeArchetypeCode,
        contractualPositionCode:
          contractualPositionCode as CbeContractualPositionCode,
        employsOperatives: employsOperatives === 'Y'
      });
    }

    return json({ ...preview, cbeOperatingProfile });
  } catch (error) {
    if (
      error instanceof TenantProvisioningError ||
      error instanceof CbeOperatingProfileError
    ) {
      return json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
};
