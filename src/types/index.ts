/**
 * 类型定义统一导出
 */

// 通用类型
export type {
  BaseResponse,
  Status,
  PaginationParams,
  PaginatedResponse,
} from './common';

// API 类型
export type { NewsItem, NewsData, GuestbookEntry, RequestOptions } from './api';

// Ghost Mail 类型
export type { UserStatus, Mail, Alias, ApiResponse } from './ghost-mail';

// 组件类型
export type {
  ButtonVariant,
  ButtonSize,
  ButtonProps,
  InputProps,
  ModalProps,
  CardProps,
  LoadingProps,
} from './components';

// 功能模块类型
export type {
  GuestbookEntry as GuestbookEntryType,
  GuestbookFormData,
  ValidationResult,
} from './features/guestbook';

export type {
  NewsItem as NewsItemType,
  NewsData as NewsDataType,
  NewsState,
} from './features/news';

export type {
  Project,
  SkillData,
  TimelineItem,
  ProfileConfig,
} from './features/profile';
