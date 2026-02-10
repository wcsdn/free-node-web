import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

app.get('/', async (c) => {
  return success(c, { message: 'OK' });
});

app.post('/', async (c) => {
  return success(c, { message: 'OK' });
});

export default app;
