import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn("exoseer-input w-full exoseer-focus-ring", className)}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }