import { z } from "zod";

const emailSchema = z
  .string({ required_error: "Adres e-mail jest wymagany" })
  .min(1, "Adres e-mail jest wymagany")
  .max(320, "Adres e-mail jest za długi")
  .email("Podaj poprawny adres e-mail");

const passwordSchema = z
  .string({ required_error: "Hasło jest wymagane" })
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .max(128, "Hasło jest za długie")
  .refine((value) => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value), {
    message: "Użyj małej i wielkiej litery oraz cyfry",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: z.boolean().default(true),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z
    .boolean()
    .refine((value) => value, "Musisz zaakceptować regulamin"),
});

export const requestResetSchema = z.object({
  email: emailSchema,
});

export const setNewPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({
      required_error: "Potwierdź nowe hasło",
    }),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hasła muszą być identyczne",
        path: ["confirmPassword"],
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type RequestResetValues = z.infer<typeof requestResetSchema>;
export type SetNewPasswordValues = z.infer<typeof setNewPasswordSchema>;

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_NOT_CONFIRMED"
  | "USER_ALREADY_REGISTERED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "UNKNOWN";

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: "Nieprawidłowy e-mail lub hasło.",
  USER_NOT_CONFIRMED: "Potwierdź swój adres e-mail, aby kontynuować.",
  USER_ALREADY_REGISTERED: "Konto z tym adresem e-mail już istnieje.",
  RATE_LIMITED: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  NETWORK_ERROR: "Wystąpił błąd połączenia. Spróbuj ponownie.",
  UNKNOWN: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
};

export function mapAuthError(code?: string | null): AuthErrorCode {
  if (!code) {
    return "UNKNOWN";
  }

  const normalized = code.toUpperCase();

  if (normalized.includes("INVALID_LOGIN")) {
    return "INVALID_CREDENTIALS";
  }

  if (normalized.includes("EMAIL_NOT_CONFIRMED")) {
    return "USER_NOT_CONFIRMED";
  }

  if (normalized.includes("USER_ALREADY_REGISTERED")) {
    return "USER_ALREADY_REGISTERED";
  }

  if (normalized.includes("RATE_LIMIT")) {
    return "RATE_LIMITED";
  }

  if (normalized.includes("NETWORK")) {
    return "NETWORK_ERROR";
  }

  return "UNKNOWN";
}

export function getAuthErrorMessage(code?: string | null) {
  return ERROR_MESSAGES[mapAuthError(code)];
}
