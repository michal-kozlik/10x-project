import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import {
  getAuthErrorMessage,
  loginSchema,
  type LoginFormValues,
} from "@/lib/auth";

interface LoginFormProps {
  nextPath?: string | null;
  onSubmit?: (values: LoginFormValues) => Promise<void>;
  onForgotPasswordClick?: () => void;
  onRegisterClick?: () => void;
  redirectToRegister?: boolean;
  redirectToReset?: boolean;
}

export function LoginForm({
  nextPath,
  onSubmit,
  onForgotPasswordClick,
  onRegisterClick,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const handleForgotPassword = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/reset-password";
    }
  };

  const handleRegister = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/register";
    }
  };

  const submitHandler = handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const destination = nextPath ?? "/app";
        showToast.success(
          `Zalogowano (demo). Przekierowanie do ${destination}`,
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
    <Card data-testid="login-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl">
          Zaloguj się
          <span className="text-sm font-normal text-muted-foreground">
            {nextPath ? `Po zalogowaniu wrócisz do ${nextPath}` : ""}
          </span>
        </CardTitle>
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
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2"
                {...register("remember")}
              />
              <span>Zapamiętaj mnie</span>
            </label>
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={onForgotPasswordClick ?? handleForgotPassword}
            >
              Zapomniałeś hasła?
            </button>
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
            <LogIn className="h-4 w-4" />
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Nie masz jeszcze konta?
          <button
            type="button"
            className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
            onClick={onRegisterClick ?? handleRegister}
          >
            Załóż konto
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
