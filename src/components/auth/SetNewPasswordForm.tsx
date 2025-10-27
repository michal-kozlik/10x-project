import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeySquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import { setNewPasswordSchema, type SetNewPasswordValues } from "@/lib/auth";

interface SetNewPasswordFormProps {
  onSubmit?: (values: SetNewPasswordValues) => Promise<void>;
}

export function SetNewPasswordForm({ onSubmit }: SetNewPasswordFormProps) {
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SetNewPasswordValues>({
    resolver: zodResolver(setNewPasswordSchema),
    mode: "onChange",
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmitHandler = async (values: SetNewPasswordValues) => {
    setServerError(null);
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        showToast.success(
          "Hasło zostało zmienione (demo). Za chwilę nastąpi przekierowanie.",
        );
      }
    } catch (error) {
      const message =
        (error as Error | undefined)?.message ?? "Wystąpił nieoczekiwany błąd";
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

  return (
    <Card data-testid="set-new-password-card">
      <CardHeader>
        <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={submitHandler}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Nowe hasło
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
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              Potwierdź nowe hasło
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              required
              {...register("confirmPassword")}
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
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
            <KeySquare className="h-4 w-4" />
            {isSubmitting ? "Zapisywanie..." : "Ustaw nowe hasło"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SetNewPasswordForm;
