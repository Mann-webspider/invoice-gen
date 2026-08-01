import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Same as the web app's toaster, minus next-themes: the app ships a single
 * light theme (index.css defines no dark tokens), so the theme lookup was dead
 * weight.
 */
const Toaster = ({ ...props }: ToasterProps): JSX.Element => (
  <Sonner
    theme="light"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
      }
    }}
    {...props}
  />
)

export { Toaster }
