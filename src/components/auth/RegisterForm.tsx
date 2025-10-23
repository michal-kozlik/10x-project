import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import {
  getAuthErrorMessage,
  registerSchema,
  type RegisterFormValues,
} from "@/lib/auth";

interface RegisterFormProps {
  onSubmit?: (values: RegisterFormValues) => Promise<void>;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSubmit, onLoginClick }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const handleLoginClick = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const submitHandler = handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        showToast.success(
          "Konto utworzone (demo). Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację.",
        );
      }
    } catch (error) {
      const code = (error as { code?: string | null })?.code;
      const message =
        (error as Error | undefined)?.message ?? getAuthErrorMessage(code);
      setServerError(message);
      showToast.error(message);
    }
  });

  return (
    <Card data-testid="register-card">
      <CardHeader>
        <CardTitle className="text-2xl">Załóż konto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={submitHandler} noValidate>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="jan.kowalski@example.com"
              autoComplete="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Hasło
            </label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2"
                {...register("acceptTerms")}
              />
              <span className="text-sm">
                Zapoznałem się i akceptuję{" "}
                <a
                  href="/terms"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  regulamin serwisu
                </a>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? "Rejestracja..." : "Załóż konto"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <button
            type="button"
            className="font-semibold text-primary underline-offset-4 hover:underline"
            onClick={onLoginClick ?? handleLoginClick}
          >
            Zaloguj się
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;
