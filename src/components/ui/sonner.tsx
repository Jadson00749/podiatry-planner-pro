import React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  // Suprimir erro de checkout popup do sonner (não usado neste projeto)
  React.useEffect(() => {
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      // Ignorar erro de checkout popup do sonner
      if (typeof message === 'string' && message.includes('checkout popup')) {
        return true; // Suprime o erro
      }
      // Manter comportamento padrão para outros erros
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Suprimir também erros de promise não tratadas
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      if (event.reason?.message?.includes('checkout popup')) {
        event.preventDefault();
        return;
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };

    return () => {
      window.onerror = originalError;
      window.onunhandledrejection = originalUnhandledRejection;
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
