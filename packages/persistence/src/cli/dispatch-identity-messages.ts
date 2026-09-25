import { loadCliEnvironment } from './load-cli-env.js';

loadCliEnvironment();

const {
  MySqlIdentityMessageDispatcher,
  createDatabasePool,
  identityEmailTransportFromEnv
} = await import('../index.js');

const pool = createDatabasePool();

try {
  const batchSizeValue = Number(process.env.NUBLOX_IDENTITY_EMAIL_BATCH_SIZE ?? '25');
  const batchSize = Number.isFinite(batchSizeValue)
    ? Math.max(1, Math.min(100, Math.floor(batchSizeValue)))
    : 25;

  const dispatcher = new MySqlIdentityMessageDispatcher(
    pool,
    identityEmailTransportFromEnv()
  );
  const result = await dispatcher.dispatchBatch(batchSize);

  console.log(
    `NuBlox identity messages: claimed=${result.claimed} sent=${result.sent} failed=${result.failed}`
  );

  if (result.failed > 0) {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
