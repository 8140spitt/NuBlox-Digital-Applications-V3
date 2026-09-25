import { setTimeout as sleep } from 'node:timers/promises';
import { loadCliEnvironment } from './load-cli-env.js';

loadCliEnvironment();

const {
  MySqlIdentityMessageDispatcher,
  createDatabasePool,
  identityEmailTransportFromEnv
} = await import('../index.js');

const pollMsValue = Number(process.env.NUBLOX_IDENTITY_EMAIL_POLL_MS ?? '1500');
const pollMs = Number.isFinite(pollMsValue)
  ? Math.max(500, Math.min(60_000, Math.floor(pollMsValue)))
  : 1500;
const batchSizeValue = Number(process.env.NUBLOX_IDENTITY_EMAIL_BATCH_SIZE ?? '25');
const batchSize = Number.isFinite(batchSizeValue)
  ? Math.max(1, Math.min(100, Math.floor(batchSizeValue)))
  : 25;

const pool = createDatabasePool();
const dispatcher = new MySqlIdentityMessageDispatcher(
  pool,
  identityEmailTransportFromEnv()
);

let stopping = false;
process.once('SIGINT', () => {
  stopping = true;
});
process.once('SIGTERM', () => {
  stopping = true;
});

console.log(
  `NuBlox identity message worker started (poll=${pollMs}ms, batch=${batchSize}).`
);

try {
  while (!stopping) {
    try {
      const result = await dispatcher.dispatchBatch(batchSize);
      if (result.claimed > 0) {
        console.log(
          `NuBlox identity messages: claimed=${result.claimed} sent=${result.sent} failed=${result.failed}`
        );
      }
    } catch (error) {
      console.error(
        'NuBlox identity message worker dispatch failed:',
        error instanceof Error ? error.message : error
      );
    }

    if (!stopping) await sleep(pollMs);
  }
} finally {
  await pool.end();
  console.log('NuBlox identity message worker stopped.');
}
