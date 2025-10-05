import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "exoseer-button text-white",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black bg-transparent exoseer-focus-ring",
        secondary: "bg-slate-700 text-white hover:bg-slate-600",
        ghost: "hover:bg-slate-700 hover:text-white exoseer-focus-ring",
        link: "text-cyan-400 underline-offset-4 hover:underline",
        exoseer: "exoseer-button",
        exoseer_outline: "border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black bg-transparent transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }