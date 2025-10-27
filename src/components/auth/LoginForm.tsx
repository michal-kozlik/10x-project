import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import { loginSchema, type LoginFormValues } from "@/lib/auth";

interface LoginFormProps {
  nextPath?: string | null;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmitHandler = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd logowania");
      }

      showToast.success("Zalogowano pomyślnie");
      window.location.href = nextPath ?? "/app";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nieznany błąd logowania";
      setServerError(message);
      showToast.error(message);
    }
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form from submitting normally

    const isValid = await trigger();
    if (!isValid) {
      showToast.error("Wypełnij wymagane pola");
      return;
    }

    handleSubmit(onSubmitHandler)(e);
  };

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
        <form className="space-y-4" onSubmit={submitHandler}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="jan.kowalski@example.com"
              autoComplete="email"
              required
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
              required
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
            <a
              href="/reset-password"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Zapomniałeś hasła?
            </a>
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
          <a
            href="/register"
            className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
          >
            Załóż konto
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
