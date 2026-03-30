import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { modelsRouter } from './routes/models.js';
import { productsRouter } from './routes/products.js';

const rootEnvPath = resolve(process.cwd(), '../.env');
const localEnvPath = resolve(process.cwd(), '.env');

if (existsSync(rootEnvPath)) {
  loadEnv({ path: rootEnvPath });
}

if (existsSync(localEnvPath)) {
  loadEnv({ path: localEnvPath, override: true });
}

const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
  }),
);
app.use('*', logger());

app.route('/api/models', modelsRouter);
app.route('/api/products', productsRouter);

app.get('/health', (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`Server running on http://localhost:${port}`);