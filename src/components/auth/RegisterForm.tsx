import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import { registerSchema, type RegisterFormValues } from "@/lib/auth";

interface RegisterFormProps {
  nextPath?: string | null;
}

export function RegisterForm({ nextPath }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      acceptTerms: false,
    },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const onSubmitHandler = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd rejestracji");
      }

      // Check if email confirmation is required
      if (data.needsConfirmation) {
        setShowConfirmation(true);
        showToast.success(data.message);
      } else {
        // If no confirmation needed, redirect to app
        showToast.success("Konto utworzone pomyślnie");
        window.location.href = nextPath ?? "/app";
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nieznany błąd rejestracji";
      setServerError(message);
      showToast.error(message);
    }
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    // Najpierw wymuszamy walidację wszystkich pól
    const isValid = await trigger();
    if (!isValid) {
      showToast.error("Wypełnij wymagane pola");
      return;
    }

    // Jeśli walidacja przeszła, wywołujemy handleSubmit
    handleSubmit(onSubmitHandler)(e);
  };

  // If email confirmation is shown, display that instead of the form
  if (showConfirmation) {
    return (
      <Card data-testid="register-confirmation">
        <CardHeader>
          <CardTitle className="text-2xl">
            Sprawdź swoją skrzynkę e-mail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Wysłaliśmy link aktywacyjny na podany adres e-mail. Kliknij w link,
            aby potwierdzić konto i dokończyć rejestrację.
          </p>
          <p className="text-sm text-muted-foreground">
            Jeśli nie widzisz wiadomości, sprawdź folder spam.
          </p>
          <div className="text-center pt-4">
            <a
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Przejdź do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="register-card">
      <CardHeader>
        <CardTitle className="text-2xl">Załóż konto</CardTitle>
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
              autoComplete="new-password"
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

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2"
                required
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
          <a
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Zaloguj się
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;
