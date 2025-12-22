import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                    {
                        "bg-slate-700 text-white shadow-sm hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-slate-600": variant === "default",
                        "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-red-600": variant === "destructive",
                        "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm active:translate-y-0": variant === "outline",
                        "bg-slate-100 text-slate-900 hover:bg-slate-200 hover:shadow-sm active:translate-y-0": variant === "secondary",
                        "hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200": variant === "ghost",
                        "text-slate-700 underline-offset-4 hover:underline hover:text-slate-900": variant === "link",
                    },
                    {
                        "h-10 px-4 py-2": size === "default",
                        "h-9 rounded-md px-3 text-xs": size === "sm",
                        "h-11 rounded-md px-8 text-base": size === "lg",
                        "h-10 w-10": size === "icon",
                    },
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
