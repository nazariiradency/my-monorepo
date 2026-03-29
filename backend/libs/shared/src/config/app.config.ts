import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  globalPrefix: string;
  corsOrigins: string[];
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    globalPrefix: process.env.GLOBAL_PREFIX ?? 'api/v1',
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:5173'],
  })
);
