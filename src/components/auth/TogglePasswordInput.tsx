import { type HTMLProps, useState } from "react";
import { EyeIcon, EyeClosedIcon } from "./icons";
import { Input } from "@/components/ui/input";

type TogglePasswordInputProps = HTMLProps<HTMLInputElement>;

export function TogglePasswordInput(props: TogglePasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        {...props}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {showPassword ? (
          <EyeClosedIcon aria-label="Hide password" />
        ) : (
          <EyeIcon aria-label="Show password" />
        )}
      </button>
    </div>
  );
}
