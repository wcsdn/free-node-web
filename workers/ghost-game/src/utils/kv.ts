/**
 * KV 存储服务
 */
export class KvService {
  private store: Map<string, unknown>;

  constructor() {
    this.store = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key) as T || null;
  }

  async put(key: string, value: unknown): Promise<boolean> {
    this.store.set(key, value);
    return true;
  }

  async delete(key: string): Promise<boolean> {
    this.store.delete(key);
    return true;
  }

  async list<T>(prefix: string): Promise<T[]> {
    const results: T[] = [];
    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        results.push(value as T);
      }
    }
    return results;
  }
}

export const kvService = new KvService();
