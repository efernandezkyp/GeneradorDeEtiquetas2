import { createBrowserRouter } from 'react-router-dom';
import { CompaniesPage } from '../features/companies/pages/CompaniesPage';
import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { LabelDetailPage } from '../features/labels/pages/LabelDetailPage';
import { LabelEditorPage } from '../features/labels/pages/LabelEditorPage';
import { LabelsPage } from '../features/labels/pages/LabelsPage';
import { UsersPage } from '../features/users/pages/UsersPage';
import { ProtectedRoute } from './guards/ProtectedRoute';

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'companies',
        element: <CompaniesPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'labels',
        element: <LabelsPage />,
      },
      {
        path: 'labels/new',
        element: <LabelEditorPage />,
      },
      {
        path: 'labels/:labelId',
        element: <LabelDetailPage />,
      },
      {
        path: 'labels/:labelId/edit',
        element: <LabelEditorPage />,
      },
    ],
  },
]);
