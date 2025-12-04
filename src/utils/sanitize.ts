/**
 * 安全工具函数 - 防止 XSS 注入攻击
 */

/**
 * 清理用户输入，移除潜在的危险字符和脚本
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // 移除 HTML 标签
  let cleaned = input.replace(/<[^>]*>/g, '');
  
  // 移除 JavaScript 事件处理器
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // 移除 javascript: 协议
  cleaned = cleaned.replace(/javascript:/gi, '');
  
  // 移除 data: 协议
  cleaned = cleaned.replace(/data:/gi, '');
  
  // 移除特殊字符（保留基本标点和中文）
  cleaned = cleaned.replace(/[<>{}]/g, '');
  
  // 转义特殊 HTML 实体
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return cleaned.trim();
};

/**
 * 验证消息内容是否安全
 */
export const isMessageSafe = (message: string): boolean => {
  if (!message || message.trim().length === 0) return false;
  
  // 检查是否包含脚本标签
  if (/<script|<\/script/i.test(message)) return false;
  
  // 检查是否包含 iframe
  if (/<iframe|<\/iframe/i.test(message)) return false;
  
  // 检查是否包含 JavaScript 事件
  if (/on\w+\s*=/i.test(message)) return false;
  
  // 检查是否包含危险协议
  if (/javascript:|data:|vbscript:/i.test(message)) return false;
  
  // 检查是否包含 SQL 注入关键字
  if (/(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bSELECT\b).*(\bFROM\b|\bWHERE\b|\bTABLE\b)/i.test(message)) return false;
  
  return true;
};

/**
 * 验证地址格式
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * 清理并验证消息
 */
export const sanitizeAndValidate = (message: string, maxLength: number = 100): { 
  isValid: boolean; 
  cleaned: string; 
  error?: string;
} => {
  // 基本验证
  if (!message || message.trim().length === 0) {
    return { isValid: false, cleaned: '', error: 'Message cannot be empty' };
  }
  
  // 安全检查
  if (!isMessageSafe(message)) {
    return { isValid: false, cleaned: '', error: 'Message contains unsafe content' };
  }
  
  // 清理输入
  const cleaned = sanitizeInput(message);
  
  // 长度检查
  if (cleaned.length > maxLength) {
    return { 
      isValid: true, 
      cleaned: cleaned.slice(0, maxLength),
      error: `Message truncated to ${maxLength} characters`
    };
  }
  
  return { isValid: true, cleaned };
};
