import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

interface PlaceholderProps {
  title: string
  description: string
  phase: string
}

/** Temporary route target. Each is replaced as its phase lands. */
export const Placeholder = ({ title, description, phase }: PlaceholderProps): JSX.Element => (
  <div className="container mx-auto">
    <PageHeader title={title} description={description} />
    <Card>
      <CardContent className="p-10 text-center text-sm text-gray-500">
        Arrives in {phase}.
      </CardContent>
    </Card>
  </div>
)
