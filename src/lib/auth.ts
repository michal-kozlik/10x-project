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

export type AuthErrorCode = "auth/invalid-login-credentials" | "auth/user-not-confirmed" | "auth/network-request-failed" | "auth/too-many-requests" | "auth/unknown";

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  "auth/invalid-login-credentials": "Nieprawidłowy e-mail lub hasło.",
  "auth/user-not-confirmed": "Potwierdź swój adres e-mail, aby kontynuować.",
  "auth/network-request-failed": "Wystąpił błąd połączenia. Spróbuj ponownie.",
  "auth/too-many-requests": "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  "auth/unknown": "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
};

export function getAuthErrorMessage(code: string | null): string {
  if (!code) return ERROR_MESSAGES["auth/unknown"];
  return ERROR_MESSAGES[code as AuthErrorCode] ?? ERROR_MESSAGES["auth/unknown"];
}

import { supabaseClient } from "../db/supabase.client";

interface SupabaseAuthError extends Error {
  code: AuthErrorCode;
}

function isSupabaseError(error: unknown): error is SupabaseAuthError {
  return error instanceof Error && 'code' in error;
}

/**
 * Performs login with email and password using Supabase Auth
 */
export async function loginWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const code = 
      error.status === 429 ? 'auth/too-many-requests' :
      error.status === 400 ? 'auth/invalid-login-credentials' :
      'auth/unknown';
    throw new Error(getAuthErrorMessage(code));
  }
}

/**
 * Signs out the current user from all devices
 */
export async function logout(): Promise<void> {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw new Error(getAuthErrorMessage('auth/network-request-failed'));
  }
}

/**
 * Gets the current session if any
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      throw Object.assign(new Error(error.message), {
        code: 'auth/network-request-failed'
      } as SupabaseAuthError);
    }
    return session;
  } catch (error) {
    throw new Error(getAuthErrorMessage(isSupabaseError(error) ? error.code : 'auth/unknown'));
  }
}
