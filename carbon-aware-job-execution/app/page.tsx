import { Dashboard } from '@/components/dashboard'

export const metadata = {
  title: 'Carbon-Aware Execution Platform',
  description: 'Run Python code when the grid is greenest',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Dashboard />
    </main>
  )
}
