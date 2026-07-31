import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export const NotFound = (): JSX.Element => (
  <div className="flex h-full items-center justify-center">
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-500">That screen does not exist.</p>
      <Button asChild>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  </div>
)
