import dotenv from 'dotenv';
import zod from 'zod';

dotenv.config();

const envSchema = zod.object({
  PORT: zod.string().default('3000'),
  NODE_ENV: zod.string().default('development'),
  LOG_LEVEL: zod.string().default('info'),
  DATABASE_URL: zod.string().default('postgresql://localhost:5432/neurosky'),
  REDIS_URL: zod.string().default('redis://localhost:6379'),
  JWT_SECRET: zod.string().default('neurosky-dev-secret-key'),
  ACCESS_TOKEN_EXPIRE: zod.string().default('3600'),
  MAX_REQUESTS_PER_MINUTE: zod.string().default('60'),
  TOKEN_BUCKET_CAPACITY: zod.string().default('200'),
  REFILL_RATE_PER_SECOND: zod.string().default('2'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Environment validation failed:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
