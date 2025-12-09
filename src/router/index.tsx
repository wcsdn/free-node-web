/**
 * 路由入口
 */
import React from 'react';
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export const AppRouter: React.FC = () => {
  return <ReactRouterProvider router={router} />;
};

export { routes };
