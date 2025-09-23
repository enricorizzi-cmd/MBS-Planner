import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  supabase: z.object({
    url: z.string().url(),
    anonKey: z.string(),
    serviceRoleKey: z.string(),
  }),
  cors: z.object({
    origin: z.union([z.string().url(), z.array(z.string().url())]).default('http://localhost:3000'),
  }),
  vapid: z.object({
    publicKey: z.string(),
    privateKey: z.string(),
    subject: z.string().email(),
  }),
  sentry: z.object({
    dsn: z.string().url().optional(),
  }),
});

const rawConfig = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
};

export const config = configSchema.parse(rawConfig);

export type Config = z.infer<typeof configSchema>;

