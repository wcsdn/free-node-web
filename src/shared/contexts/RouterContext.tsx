import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerRouterController } from '../utils/globalAPI';

interface RouteParams {
  [key: string]: string | null;
}

interface RouterContextType {
  params: RouteParams;
  setParam: (key: string, value: string | null) => void;
  getParam: (key: string) => string | null;
  clearParam: (key: string) => void;
  clearAllParams: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [params, setParams] = useState<RouteParams>({});

  // 初始化时从 URL 读取参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialParams: RouteParams = {};
    urlParams.forEach((value, key) => {
      initialParams[key] = value;
    });
    setParams(initialParams);
  }, []);

  // 监听浏览器前进后退
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newParams: RouteParams = {};
      urlParams.forEach((value, key) => {
        newParams[key] = value;
      });
      setParams(newParams);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 更新 URL
  const updateURL = useCallback((newParams: RouteParams) => {
    const urlParams = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== null) {
        urlParams.set(key, value);
      }
    });
    const newUrl = urlParams.toString() 
      ? `?${urlParams.toString()}` 
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  }, []);

  const setParam = useCallback((key: string, value: string | null) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      updateURL(newParams);
      return newParams;
    });
  }, [updateURL]);

  const getParam = useCallback((key: string) => {
    return params[key] || null;
  }, [params]);

  const clearParam = useCallback((key: string) => {
    setParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      updateURL(newParams);
      return newParams;
    });
  }, [updateURL]);

  const clearAllParams = useCallback(() => {
    setParams({});
    window.history.pushState({}, '', window.location.pathname);
  }, []);

  // 注册全局控制器
  useEffect(() => {
    registerRouterController({
      setParam,
      clearParam,
      getParam,
    });
  }, [setParam, clearParam, getParam]);

  return (
    <RouterContext.Provider value={{ params, setParam, getParam, clearParam, clearAllParams }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return context;
};
