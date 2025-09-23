import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  supabase: z.object({
    url: z.string().url().refine((url) => {
      // Ensure it's a Supabase URL, not a PostgreSQL connection string
      if (url.startsWith('postgresql://')) {
        throw new Error('SUPABASE_URL must be the Supabase API URL (https://your-project.supabase.co), not a PostgreSQL connection string');
      }
      if (!url.includes('supabase.co')) {
        throw new Error('SUPABASE_URL must be a valid Supabase URL (https://your-project.supabase.co)');
      }
      return true;
    }),
    anonKey: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
    serviceRoleKey: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  }),
  cors: z.object({
    origin: z.union([z.string().url(), z.array(z.string().url())]).default('http://localhost:3000'),
  }),
  vapid: z.object({
    publicKey: z.string(),
    privateKey: z.string(),
    subject: z.string().refine((val) => val.startsWith('mailto:') && val.includes('@'), {
      message: "Subject must be in format 'mailto:email@domain.com'"
    }),
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

let config: z.infer<typeof configSchema>;

try {
  config = configSchema.parse(rawConfig);
} catch (error) {
  // During build time, environment variables might not be available
  // Only validate and exit if we're actually running the application
  if (process.env.NODE_ENV !== 'production' || process.argv.includes('--build')) {
    // During build, use default values to allow compilation
    config = {
      port: 3001,
      nodeEnv: 'production' as const,
      supabase: {
        url: 'https://placeholder.supabase.co',
        anonKey: 'placeholder',
        serviceRoleKey: 'placeholder',
      },
      cors: {
        origin: 'http://localhost:3000',
      },
      vapid: {
        publicKey: 'placeholder',
        privateKey: 'placeholder',
        subject: 'mailto:placeholder@example.com',
      },
      sentry: {
        dsn: undefined,
      },
    };
  } else {
    // During runtime, validate and exit on error
    console.error('❌ Configuration validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(`  - ${error instanceof Error ? error.message : String(error)}`);
    }
    console.error('\n💡 Please check your environment variables and ensure they are correctly set.');
    console.error('   Required environment variables:');
    console.error('   - SUPABASE_URL (must be https://your-project.supabase.co)');
    console.error('   - SUPABASE_ANON_KEY');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('   - VAPID_PUBLIC_KEY');
    console.error('   - VAPID_PRIVATE_KEY');
    console.error('   - VAPID_SUBJECT');
    process.exit(1);
  }
}

export { config };
export type Config = z.infer<typeof configSchema>;

