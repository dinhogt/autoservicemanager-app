import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Load `.env` before e2e tests so ConfigModule validation and Prisma can connect.
 * CI: set DATABASE_URL, JWT_SECRET, etc. in the environment instead.
 */
dotenv.config({ path: path.resolve(__dirname, '../.env') });
