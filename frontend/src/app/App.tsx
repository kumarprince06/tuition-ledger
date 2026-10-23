import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createBrowserRouter } from 'react-router'
import { seedBrightMinds } from '../mock/seed'
import { store } from '../mock/store'
import { routes } from './routes.tsx'

// Static build: the app runs on in-memory demo data until the API exists.
if (!store.db) store.db = seedBrightMinds()
// Demo shortcut: ?as=owner|teacher|accountant opens signed in as that role.
const as = new URLSearchParams(window.location.search).get('as')?.toUpperCase()
const demoUser = store.db.users.find((u) => u.role === as)
if (demoUser) store.session = { signedIn: true, role: demoUser.role, userId: demoUser.id }

const queryClient = new QueryClient()
const router = createBrowserRouter(routes)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
