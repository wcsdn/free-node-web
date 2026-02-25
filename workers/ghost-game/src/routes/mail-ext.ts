import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { MailServiceExtension } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) { return c.json({ success: true, data }); }
function error(c: any, msg: string) { return c.json({ success: false, error: msg }); }

app.post('/send', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { title, content, attachments, wallets } = await c.req.json();
  
  if (wallets && Array.isArray(wallets)) {
    const result = await new MailServiceExtension(db).batchSendMail(wallets, title, content, attachments);
    return success(c, result);
  }
  const result = await new MailServiceExtension(db).sendSystemMail(wallet, title, content, attachments);
  return success(c, result);
});

app.post('/claim/:mailId', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const mailId = parseInt(c.req.param('mailId'));
  const result = await new MailServiceExtension(db).claimAttachment(wallet, mailId);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

app.post('/claim-all', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new MailServiceExtension(db).claimAll(wallet);
  return success(c, result);
});

app.delete('/:mailId', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const mailId = parseInt(c.req.param('mailId'));
  const result = await new MailServiceExtension(db).deleteMail(wallet, mailId);
  return success(c, result);
});

export default app;
