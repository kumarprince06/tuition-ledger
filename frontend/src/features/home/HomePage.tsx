import { useQuery } from '@tanstack/react-query'

type Health = { status: string }

async function fetchHealth(): Promise<Health> {
  const res = await fetch('/actuator/health')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function HomePage() {
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth })

  return (
    <main>
      <h1>Tuition Ledger</h1>
      <p>
        Backend:{' '}
        {health.isPending ? 'checking…' : health.isError ? 'unreachable' : health.data.status}
      </p>
    </main>
  )
}
