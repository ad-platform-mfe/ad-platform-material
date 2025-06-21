import { createBrowserRouter, Navigate } from 'react-router-dom'
import BasicLayout from '@/layouts/BasicLayout'
import Material from '@/pages/Material'
import AdReview from '@/pages/AdReview'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <BasicLayout />,
      children: [
        {
          path: '/campaign-manage',
          element: <Material />
        },
        {
          path: '/ad-review',
          element: <AdReview />
        },
        {
          path: '*',
          element: <Navigate to="/campaign-manage" replace />
        }
      ]
    }
  ],
  {
    basename: window.__MICRO_APP_BASE_ROUTE__ || '/'
  }
)

export default router
