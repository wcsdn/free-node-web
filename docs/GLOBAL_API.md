# 全局 API 使用指南

## 概述

全局 API 系统允许你在应用的任何地方通过简单的函数调用打开各种功能模块,无需手动管理状态或传递 props。

## 功能特性

- ✅ 全局模态框管理 (Ghost Mail, Profile, Wallet)
- ✅ URL 路由参数管理
- ✅ 浏览器前进/后退支持
- ✅ TypeScript 类型安全
- ✅ 简单易用的 API

## 模态框 API

### 导入

```typescript
import { 
  openGhostMail, 
  openProfile, 
  openWallet, 
  closeAllModals 
} from '@/shared/utils/globalAPI';
```

### 使用示例

```typescript
// 打开幽灵信箱
openGhostMail();

// 打开个人档案
openProfile();

// 打开钱包连接
openWallet();

// 关闭所有模态框
closeAllModals();
```

### 在组件中使用

```typescript
import React from 'react';
import { openGhostMail } from '@/shared/utils/globalAPI';

const MyComponent: React.FC = () => {
  const handleClick = () => {
    // 直接调用全局 API
    openGhostMail();
  };

  return (
    <button onClick={handleClick}>
      打开幽灵信箱
    </button>
  );
};
```

## 路由 API

### 导入

```typescript
import { 
  openMailDetail, 
  closeMailDetail, 
  getRouteParam, 
  setRouteParam 
} from '@/shared/utils/globalAPI';
```

### 使用示例

```typescript
// 打开指定邮件详情
openMailDetail(123);

// 关闭邮件详情
closeMailDetail();

// 获取路由参数
const mailId = getRouteParam('mail');

// 设置路由参数
setRouteParam('tab', 'inbox');
```

### 在组件中使用

```typescript
import React from 'react';
import { openMailDetail } from '@/shared/utils/globalAPI';

const MailList: React.FC = () => {
  const handleMailClick = (mailId: number) => {
    // 打开邮件详情,自动更新 URL
    openMailDetail(mailId);
  };

  return (
    <div>
      <div onClick={() => handleMailClick(1)}>邮件 1</div>
      <div onClick={() => handleMailClick(2)}>邮件 2</div>
    </div>
  );
};
```

## Context Hooks (高级用法)

如果需要更多控制,可以直接使用 Context Hooks:

### useModal Hook

```typescript
import { useModal } from '@/shared/contexts/ModalContext';

const MyComponent: React.FC = () => {
  const { currentModal, openModal, closeModal, isModalOpen } = useModal();

  return (
    <div>
      <button onClick={() => openModal('ghost-mail')}>
        打开幽灵信箱
      </button>
      {isModalOpen('ghost-mail') && <div>幽灵信箱已打开</div>}
    </div>
  );
};
```

### useRouter Hook

```typescript
import { useRouter } from '@/shared/contexts/RouterContext';

const MyComponent: React.FC = () => {
  const { params, setParam, getParam, clearParam } = useRouter();

  return (
    <div>
      <button onClick={() => setParam('tab', 'inbox')}>
        切换到收件箱
      </button>
      <div>当前标签: {getParam('tab')}</div>
    </div>
  );
};
```

## 架构说明

### 文件结构

```
src/
├── shared/
│   ├── contexts/
│   │   ├── ModalContext.tsx      # 模态框状态管理
│   │   └── RouterContext.tsx     # 路由参数管理
│   ├── components/
│   │   └── GlobalModals/         # 全局模态框组件
│   │       ├── index.tsx
│   │       └── styles.css
│   └── utils/
│       └── globalAPI.ts          # 全局 API 接口
```

### 工作原理

1. **Context Providers**: 在应用根部注入 `ModalProvider` 和 `RouterProvider`
2. **全局控制器注册**: Context 初始化时注册控制器到全局 API
3. **API 调用**: 任何地方调用全局 API 函数
4. **状态更新**: 全局 API 通过控制器更新 Context 状态
5. **UI 响应**: 组件订阅 Context 自动更新

## 添加新功能

### 1. 添加新的模态框类型

在 `ModalContext.tsx` 中:

```typescript
type ModalType = 'ghost-mail' | 'profile' | 'wallet' | 'new-feature' | null;
```

### 2. 在 GlobalModals 中添加组件

在 `GlobalModals/index.tsx` 中:

```typescript
{currentModal === 'new-feature' && (
  <>
    <Backdrop onClick={closeModal} />
    <div className="new-feature-modal">
      <NewFeatureComponent />
    </div>
  </>
)}
```

### 3. 添加全局 API 函数

在 `globalAPI.ts` 中:

```typescript
export const openNewFeature = () => {
  if (!modalController) return;
  modalController.openModal('new-feature');
};
```

## 最佳实践

1. **优先使用全局 API**: 简单场景直接调用全局 API
2. **复杂场景使用 Hooks**: 需要监听状态变化时使用 Context Hooks
3. **URL 参数命名**: 使用简短有意义的参数名 (如 `mail`, `tab`)
4. **错误处理**: 全局 API 会自动检查控制器是否初始化
5. **类型安全**: 使用 TypeScript 确保类型正确

## 示例场景

### 场景 1: 从任意位置打开幽灵信箱

```typescript
// 在导航栏
<button onClick={openGhostMail}>📧</button>

// 在文章中
<a onClick={openGhostMail}>查看我的邮箱</a>

// 在代码逻辑中
if (hasNewMail) {
  openGhostMail();
}
```

### 场景 2: 分享邮件详情链接

```typescript
// 用户点击邮件
openMailDetail(123);

// URL 变为: https://example.com?mail=123
// 用户可以复制链接分享

// 其他用户打开链接,自动显示邮件详情
```

### 场景 3: 未登录时提示连接钱包

```typescript
const handleProtectedAction = () => {
  if (!isConnected) {
    openWallet();
    return;
  }
  // 执行需要钱包的操作
};
```

## 注意事项

- 确保在 `index.tsx` 中正确注入 Provider
- 全局 API 依赖 Context 初始化,在 Provider 外部调用会报错
- URL 参数会影响浏览器历史记录
- 模态框关闭时不会自动清除 URL 参数

---

**创建时间**: 2024-12-07  
**版本**: 1.0.0
