import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

interface UserMenuProps {
  userEmail: string;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call server-side logout endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Nie udało się wylogować");
      }

      showToast.success("Wylogowano pomyślnie");

      // Redirect to login page after successful logout
      window.location.href = "/login";
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Nie udało się wylogować",
      );
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {userEmail}
      </span>
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant="outline"
        size="sm"
      >
        {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
      </Button>
    </div>
  );
}
