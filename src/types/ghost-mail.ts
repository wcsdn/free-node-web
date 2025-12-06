/**
 * Ghost Mail 类型定义
 * 前后端共享类型
 */

// 用户访问级别
export enum AccessLevel {
  GUEST = 0,    // 游客
  VIP = 1,      // VIP (已付费/已拉新)
}

// 用户信息
export interface User {
  address: string;           // 钱包地址
  access_level: AccessLevel; // 访问级别
  created_at: number;        // 创建时间戳
}

// 邮箱别名
export interface Alias {
  alias_name: string;   // 7位数字 (如 '8392011')
  owner_address: string; // 所有者钱包地址
  created_at: number;    // 创建时间戳
}

// 邮件
export interface Mail {
  id: number;
  alias_name: string;  // 接收的别名
  sender: string;      // 发件人
  subject: string;     // 标题
  preview: string;     // 预览文字 (前100字符)
  body: string;        // 完整内容
  created_at: number;  // 接收时间戳
  is_read: boolean;    // 是否已读
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 用户状态
export interface UserStatus {
  isVIP: boolean;
  activeSlots: number;  // 当前使用的邮箱数量
  maxSlots: number;     // 最大允许数量 (5)
  aliases: Alias[];     // 拥有的邮箱列表
}

// 生成邮箱请求
export interface GenerateAliasRequest {
  address: string;
}

// 生成邮箱响应
export interface GenerateAliasResponse {
  alias: Alias;
}

// 删除邮箱请求
export interface DeleteAliasRequest {
  address: string;
  alias_name: string;
}

// 获取邮件请求
export interface GetInboxRequest {
  address: string;
}

// 获取邮件响应
export interface GetInboxResponse {
  mails: Mail[];
  total: number;
}

// 验证支付请求
export interface VerifyPaymentRequest {
  address: string;
  txHash: string;  // 交易哈希
}
