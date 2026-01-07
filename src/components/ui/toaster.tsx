import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0a0a0a] group-[.toaster]:text-gray-100 group-[.toaster]:border-white/10 group-[.toaster]:shadow-xl group-[.toaster]:font-sans",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-red-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-gray-400",
          error: "group-[.toaster]:text-red-400",
          success: "group-[.toaster]:text-green-400",
          warning: "group-[.toaster]:text-yellow-400",
          info: "group-[.toaster]:text-blue-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }