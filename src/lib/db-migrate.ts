
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env' });

const connectionString = process.env.DATABASE_URL!;

async function main() {
    console.log('Running database migrations...');

    const db = drizzle(postgres(connectionString, { max: 1 }));

    try {
        await migrate(db, { migrationsFolder: 'drizzle' });
        console.log('Migrations applied successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();
