import {
  createDatabasePool,
  MySqlPlatformAdministrationService,
  type PlatformOperatorRole
} from '../index.js';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const email = required('NUBLOX_PLATFORM_ADMIN_EMAIL');
const password = required('NUBLOX_PLATFORM_ADMIN_PASSWORD');
const displayName = process.env.NUBLOX_PLATFORM_ADMIN_NAME?.trim() || 'NuBlox Platform Administrator';
const roleValue = process.env.NUBLOX_PLATFORM_ADMIN_ROLE?.trim() || 'SUPER_ADMIN';

if (!['SUPER_ADMIN', 'OPERATOR', 'READ_ONLY'].includes(roleValue)) {
  throw new Error('NUBLOX_PLATFORM_ADMIN_ROLE must be SUPER_ADMIN, OPERATOR or READ_ONLY.');
}

const pool = createDatabasePool();
try {
  const operator = await new MySqlPlatformAdministrationService(pool).bootstrapOperator({
    email,
    password,
    displayName,
    role: roleValue as PlatformOperatorRole
  });
  console.log(`Platform operator created: ${operator.email} (${operator.role})`);
} finally {
  await pool.end();
}
