import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({ success: true, message: 'Test route works' });
});

export default app;
