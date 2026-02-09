/**
 * Chat Repository - 聊天数据访问层
 * 原则：只负责 SQL 操作，不包含业务逻辑
 */
import type { D1Database } from '@cloudflare/workers-types';

export interface ChatMessage {
  id: number;
  wallet_address: string;
  sender_name: string;
  content: string;
  channel: string;
  created_at: string;
}

export interface ChatMessageCreate {
  wallet_address: string;
  sender_name: string;
  content: string;
  channel: string;
}

export const chatRepo = {
  /**
   * 根据 ID 查找消息
   */
  async findById(db: D1Database, messageId: number): Promise<ChatMessage | null> {
    const result = await db.prepare(`
      SELECT * FROM chat_messages WHERE id = ?
    `).bind(messageId).first();
    return result as unknown as ChatMessage | null;
  },

  /**
   * 获取频道消息列表
   */
  async findByChannel(db: D1Database, channel: string, limit = 100): Promise<ChatMessage[]> {
    const result = await db.prepare(`
      SELECT * FROM chat_messages WHERE channel = ? ORDER BY created_at DESC LIMIT ?
    `).bind(channel, limit).all();
    return (result.results || []).reverse() as unknown as ChatMessage[];
  },

  /**
   * 获取用户的消息历史
   */
  async findByWallet(db: D1Database, walletAddress: string): Promise<ChatMessage[]> {
    const result = await db.prepare(`
      SELECT * FROM chat_messages WHERE wallet_address = ? ORDER BY created_at DESC
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as ChatMessage[];
  },

  /**
   * 保存消息
   */
  async save(db: D1Database, data: ChatMessageCreate): Promise<ChatMessage> {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO chat_messages (wallet_address, sender_name, content, channel, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.sender_name,
      data.content,
      data.channel,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id) as Promise<ChatMessage>;
  },

  /**
   * 删除消息
   */
  async delete(db: D1Database, messageId: number): Promise<boolean> {
    const result = await db.prepare(`DELETE FROM chat_messages WHERE id = ?`).bind(messageId).run();
    return result.success;
  },

  /**
   * 按用户删除消息（清理）
   */
  async deleteByWallet(db: D1Database, walletAddress: string): Promise<number> {
    const result = await db.prepare(`DELETE FROM chat_messages WHERE wallet_address = ?`).bind(walletAddress).run();
    return result.success ? (result.meta.rows_written || 0) : 0;
  },

  /**
   * 清理旧消息（保留最近 N 条）
   */
  async cleanupOldMessages(db: D1Database, channel: string, keepCount = 1000): Promise<number> {
    // 先获取要删除的消息ID
    const toDelete = await db.prepare(`
      SELECT id FROM chat_messages
      WHERE channel = ?
      ORDER BY created_at DESC
      LIMIT -1 OFFSET ?
    `).bind(channel, keepCount).all();

    if (!toDelete.results || toDelete.results.length === 0) return 0;

    const ids = toDelete.results.map((r: any) => r.id).join(',');
    const result = await db.prepare(`DELETE FROM chat_messages WHERE id IN (${ids})`).run();
    return result.success ? toDelete.results.length : 0;
  },

  /**
   * 获取最后插入 ID
   */
  async getLastInsertId(db: D1Database): Promise<number> {
    const r = await db.prepare('SELECT last_insert_rowid() as id').first() as { id: number };
    return r.id;
  },

  /**
   * 获取可用频道列表
   */
  async getChannels(db: D1Database): Promise<string[]> {
    const result = await db.prepare(`
      SELECT DISTINCT channel FROM chat_messages ORDER BY channel
    `).all();
    return (result.results || []).map((r: any) => r.channel);
  },
};
