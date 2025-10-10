import * as React from "react"
import { cn } from "@/lib/utils"

interface MathInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onEvaluate?: (result: number | string) => void
}

const MathInput = React.forwardRef<HTMLInputElement, MathInputProps>(
  ({ className, value: propValue, onChange, onBlur, onEvaluate, placeholder, ...props }, ref) => {
    const [isMathMode, setIsMathMode] = React.useState(false)
    
    // Don't maintain local state, just use propValue directly
    const currentValue = propValue ?? ""

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "`") {
        e.preventDefault()
        setIsMathMode(prev => !prev)
        return
      }

      if (isMathMode && e.key === "Enter") {
        e.preventDefault()
        try {
          const result = eval(currentValue.toString())
          const resultStr = String(result)

          // Create synthetic event with evaluated result
          const syntheticEvent = {
            target: { value: resultStr },
          } as React.ChangeEvent<HTMLInputElement>

          onChange?.(syntheticEvent)
          onEvaluate?.(result)
          setIsMathMode(false)
        } catch {
          onEvaluate?.("Invalid Expression")
        }
      }

      props.onKeyDown?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
    }

    return (
      <>
        <input
          {...props}
          ref={ref}
          type="text"
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={isMathMode ? "Math mode: 2+2 (press Enter)" : placeholder}
          inputMode={isMathMode ? "text" : "numeric"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            isMathMode && "border-green-500",
            className
          )}
        />
        {isMathMode && (
          <p className="mt-1 text-xs text-green-600">Math mode enabled (press ` to toggle off)</p>
        )}
      </>
    )
  }
)

MathInput.displayName = "MathInput"

export { MathInput }
