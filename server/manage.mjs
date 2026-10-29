import { openDatabase, migrateDatabase, backupDatabase } from './database.mjs';

const [action, destination] = process.argv.slice(2);
const source = process.env.DATABASE_PATH;
if (!source || !['migrate', 'backup'].includes(action)) {
  throw new Error('Set DATABASE_PATH, then use: node server/manage.mjs migrate | backup <absolute-destination>');
}
if (action === 'migrate') {
  const sqlite = openDatabase(source);
  try { migrateDatabase(sqlite); }
  finally { sqlite.close(); }
  console.log('Database migrations applied. Existing data was not reset.');
} else {
  await backupDatabase(source, destination);
  console.log('Database backup completed and verified.');
}
