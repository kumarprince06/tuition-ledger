import type { RouteObject } from 'react-router'
import { HomePage } from '../features/home/HomePage.tsx'

// One entry per feature; role-based guards arrive with the app shell (S1-13e).
export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '*', element: <p>Page not found</p> },
]
