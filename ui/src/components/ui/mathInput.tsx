import * as React from "react"
import { cn } from "@/lib/utils"

interface MathInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onEvaluate?: (result: number | string) => void
}

const MathInput = React.forwardRef<HTMLInputElement, MathInputProps>(
  ({ className, value: propValue, onChange, onBlur, onEvaluate, placeholder, ...props }, ref) => {
    const [isMathMode, setIsMathMode] = React.useState(false)
    const [localValue, setLocalValue] = React.useState(propValue ?? "")

    React.useEffect(() => {
      setLocalValue(propValue ?? "")
    }, [propValue])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "`") {
        e.preventDefault()
        setIsMathMode(prev => !prev)
        return
      }

      if (isMathMode && e.key === "Enter") {
        e.preventDefault()
        try {
          const result = eval(localValue.toString())
          const resultStr = String(result)
          setLocalValue(resultStr)

          // Trigger form update
          const syntheticEvent = {
            ...e,
            target: { value: resultStr },
          } as unknown as React.ChangeEvent<HTMLInputElement>

          onChange?.(syntheticEvent)
          onEvaluate?.(result)
        } catch {
          onEvaluate?.("Invalid Expression")
        }
      }

      props.onKeyDown?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value)
      onChange?.(e)
    }

    return (
      <>
        <input
          {...props}
          ref={ref}
          type="text"
          value={localValue}
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
