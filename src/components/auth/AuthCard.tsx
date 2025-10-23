import { type ReactNode } from "react";
import { TogglePasswordInput } from "./TogglePasswordInput";
import { Card, type CardProps } from "@/components/ui/card";

interface AuthCardProps extends CardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  footer?: ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  children,
  onSubmit,
  footer,
  className,
  ...props
}: AuthCardProps) {
  return (
    <Card
      className="w-full max-w-md overflow-hidden rounded-lg border"
      {...props}
    >
      <header className="px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </header>

      {onSubmit ? (
        <form onSubmit={onSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">{children}</div>
        </form>
      ) : (
        <div className="px-6 py-4 space-y-4">{children}</div>
      )}

      {footer && (
        <footer className="border-t bg-muted/10 px-6 py-4">{footer}</footer>
      )}
    </Card>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export { TogglePasswordInput };
