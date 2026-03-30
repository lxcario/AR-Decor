import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'dotenv/config';
import { modelsRouter } from './routes/models.js';
import { productsRouter } from './routes/products.js';

const app = new Hono();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'] }));
app.use('*', logger());

app.route('/api/models', modelsRouter);
app.route('/api/products', productsRouter);

app.get('/health', (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`Server running on http://localhost:${port}`);