import type { MySqlMyWorkRepository } from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import { getMyWorkRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlMyWorkRepository['listMyWork']>[0];
type PersonId = Parameters<MySqlMyWorkRepository['listMyWork']>[1];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return { items: [] };
  }

  const items = await getMyWorkRepository().listMyWork(
    session.tenantId as TenantId,
    session.personId as PersonId
  );

  return { items };
};
