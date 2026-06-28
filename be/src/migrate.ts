import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './db/index.js';

migrate(db, { migrationsFolder: './drizzle' })
  .then(async () => {
    console.log('Migrations applied');
    await pool.end();
  })
  .catch(async (err) => {
    console.error('Migration failed:', err);
    await pool.end();
    process.exit(1);
  });
