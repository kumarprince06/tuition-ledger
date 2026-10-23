import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routes } from './routes.tsx'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('routes', () => {
  it('home shows backend health from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'UP' })))
    renderAt('/')
    expect(await screen.findByText('Backend: UP')).toBeInTheDocument()
  })

  it('home shows unreachable when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))
    renderAt('/')
    expect(await screen.findByText('Backend: unreachable')).toBeInTheDocument()
  })

  it('unknown path shows not found', () => {
    renderAt('/nope')
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })
})
