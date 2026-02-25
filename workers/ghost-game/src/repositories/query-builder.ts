/**
 * Query Builder - SQL 查询构建器
 * 简化复杂的 SQL 查询构建
 */
export class QueryBuilder {
  private conditions: string[] = [];
  private values: any[] = [];

  // ==================== 条件构建 ====================

  /** 添加等于条件 */
  where(field: string, value: any): this {
    this.conditions.push(`${field} = ?`);
    this.values.push(value);
    return this;
  }

  /** 添加 IN 条件 */
  whereIn(field: string, values: any[]): this {
    if (values.length === 0) {
      this.conditions.push('1 = 0');
    } else {
      const placeholders = values.map(() => '?').join(', ');
      this.conditions.push(`${field} IN (${placeholders})`);
      this.values.push(...values);
    }
    return this;
  }

  /** 添加 LIKE 条件 */
  whereLike(field: string, pattern: string): this {
    this.conditions.push(`${field} LIKE ?`);
    this.values.push(pattern);
    return this;
  }

  /** 添加大于条件 */
  whereGt(field: string, value: any): this {
    this.conditions.push(`${field} > ?`);
    this.values.push(value);
    return this;
  }

  /** 添加小于条件 */
  whereLt(field: string, value: any): this {
    this.conditions.push(`${field} < ?`);
    this.values.push(value);
    return this;
  }

  // ==================== 构建查询 ====================

  /** 构建 WHERE 子句 */
  buildWhere(): { clause: string; values: any[] } {
    const clause = this.conditions.length > 0 
      ? this.conditions.join(' AND ')
      : '1 = 1';
    return { clause, values: [...this.values] };
  }

  /** 重置构建器 */
  reset(): this {
    this.conditions = [];
    this.values = [];
    return this;
  }
}
