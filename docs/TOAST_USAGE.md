# 🎯 Toast 提示框使用指南

## 简介

全局 Toast 提示框组件，用于替代 `alert()`，提供更好的用户体验。

## 使用方法

### 1. 导入 Hook

```typescript
import { useToast } from '../../shared/contexts/ToastContext';
```

### 2. 在组件中使用

```typescript
const MyComponent = () => {
  const { showSuccess, showError, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('操作成功！');
  };

  const handleError = () => {
    showError('操作失败，请重试');
  };

  const handleInfo = () => {
    showInfo('这是一条提示信息');
  };

  return (
    <div>
      <button onClick={handleSuccess}>成功</button>
      <button onClick={handleError}>错误</button>
      <button onClick={handleInfo}>信息</button>
    </div>
  );
};
```

## API

### showSuccess(message: string)
显示成功提示（绿色，3秒）

### showError(message: string)
显示错误提示（红色，4秒）

### showInfo(message: string)
显示信息提示（青色，3秒）

### showToast(message: string, type?: 'success' | 'error' | 'info', duration?: number)
自定义提示（可指定类型和持续时间）

## 示例：替换 alert

### 之前
```typescript
try {
  // ...
  alert('操作成功');
} catch (error) {
  alert('操作失败');
}
```

### 之后
```typescript
const { showSuccess, showError } = useToast();

try {
  // ...
  showSuccess('操作成功');
} catch (error) {
  showError('操作失败');
}
```

## 特性

- ✅ Matrix 风格设计
- ✅ 自动消失
- ✅ 可手动关闭
- ✅ 支持多个提示同时显示
- ✅ 响应式设计
- ✅ 动画效果
