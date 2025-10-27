import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import { requestResetSchema, type RequestResetValues } from "@/lib/auth";

interface RequestResetFormProps {
  onSubmit?: (values: RequestResetValues) => Promise<void>;
  onLoginClick?: () => void;
}

export function RequestResetForm({
  onSubmit,
  onLoginClick,
}: RequestResetFormProps) {
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmitHandler = async (values: RequestResetValues) => {
    setServerError(null);
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsSuccess(true);
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

  if (isSuccess) {
    return (
      <Card data-testid="request-reset-success-card">
        <CardHeader>
          <CardTitle className="text-2xl">Sprawdź skrzynkę e-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Jeśli konto dla podanego adresu istnieje, wyślemy na niego link do
            zresetowania hasła.
          </p>
          <p className="text-sm text-muted-foreground">
            Możesz teraz zamknąć tę stronę lub{" "}
            <a
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
              onClick={onLoginClick ?? handleLoginClick}
            >
              wrócić do logowania
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="request-reset-card">
      <CardHeader>
        <CardTitle className="text-2xl">Resetowanie hasła</CardTitle>
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
            <Send className="h-4 w-4" />
            {isSubmitting ? "Wysyłanie..." : "Wyślij link do resetu"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <a
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
            onClick={onLoginClick ?? handleLoginClick}
          >
            Wróć do logowania
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default RequestResetForm;
