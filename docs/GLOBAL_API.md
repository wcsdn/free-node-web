# 全局 API 使用指南

## 概述

全局 API 系统允许你在应用的任何地方通过简单的函数调用打开各种功能模块。

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
  return (
    <button onClick={openGhostMail}>
      打开幽灵信箱
    </button>
  );
};
```

## useModal Hook

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

## 文件结构

```
src/shared/
├── contexts/
│   └── ModalContext.tsx      # 模态框状态管理
├── layouts/
│   └── GlobalModals/         # 全局模态框组件
└── utils/
    └── globalAPI.ts          # 全局 API 接口
```

## 添加新功能

### 1. 添加新的模态框类型

在 `ModalContext.tsx` 中:

```typescript
type ModalType = 'ghost-mail' | 'profile' | 'wallet' | 'new-feature' | null;
```

### 2. 在 GlobalModals 中添加组件

```typescript
{currentModal === 'new-feature' && (
  <NewFeatureComponent />
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

## 示例场景

### 从任意位置打开幽灵信箱

```typescript
// 在导航栏
<button onClick={openGhostMail}>📧</button>

// 在代码逻辑中
if (hasNewMail) {
  openGhostMail();
}
```

### 未登录时提示连接钱包

```typescript
const handleProtectedAction = () => {
  if (!isConnected) {
    openWallet();
    return;
  }
  // 执行需要钱包的操作
};
```
