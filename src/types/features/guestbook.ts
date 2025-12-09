/**
 * 留言板功能类型定义
 */

export interface GuestbookEntry {
  id: string;
  address: string;
  message: string;
  signature: string;
  timestamp: number;
  avatar: string;
  replyTo?: string;
}

export interface GuestbookFormData {
  message: string;
  replyTo?: string;
}

export interface ValidationResult {
  isValid: boolean;
  cleaned: string;
  error?: string;
}
