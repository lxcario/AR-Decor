import { Hono } from 'hono';
import { getProduct, searchProducts } from '../services/amazonApi.js';

export const productsRouter = new Hono();

productsRouter.get('/search', async (c) => {
  try {
    const query = c.req.query('q') ?? '';
    const limitValue = Number(c.req.query('limit') ?? 10);
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 10;
    const products = await searchProducts(query, limit);
    return c.json(products);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown product search error';
    return c.json({ error: message }, 500);
  }
});

productsRouter.get('/asin/:asin', async (c) => {
  try {
    const asin = c.req.param('asin');
    const product = await getProduct(asin);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown product lookup error';
    return c.json({ error: message }, 500);
  }
});
