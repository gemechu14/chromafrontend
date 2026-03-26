import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      className="toaster group"
      closeButton
      duration={2500}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-800 group-[.toaster]:border-emerald-200",
          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-800 group-[.toaster]:border-red-200",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-foreground/50 hover:group-[.toast]:text-foreground hover:group-[.toast]:bg-foreground/10 group-[.toast]:border-0 group-[.toast]:rounded-md group-[.toast]:transition-colors group-[.toast]:opacity-70 hover:group-[.toast]:opacity-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
