"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const RULES = [
  { key: "lowercase", label: "Chữ thường (a-z)", test: (v: string) => /[a-z]/.test(v) },
  { key: "uppercase", label: "Chữ hoa (A-Z)", test: (v: string) => /[A-Z]/.test(v) },
  { key: "digit", label: "Số (0-9)", test: (v: string) => /\d/.test(v) },
  { key: "symbol", label: "Ký tự đặc biệt (!@#...)", test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
  { key: "length", label: "Ít nhất 8 ký tự", test: (v: string) => v.length >= 8 },
] as const;

export function validatePassword(password: string): boolean {
  return RULES.every((r) => r.test(password));
}

interface PasswordInputProps {
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  showRules?: boolean;
}

export function PasswordInput({
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  showRules = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            className="pl-10 pr-10"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            className={cn(
              "pl-10 pr-10",
              passwordMatch && "border-green-500 focus-visible:ring-green-500/50",
              passwordMismatch && "border-destructive focus-visible:ring-destructive/50"
            )}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm(!showConfirm)}
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordMismatch && (
          <p className="text-xs text-destructive">Mật khẩu không khớp</p>
        )}
      </div>

      {showRules && password.length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Yêu cầu mật khẩu:</p>
          {RULES.map((rule) => {
            const pass = rule.test(password);
            return (
              <div key={rule.key} className="flex items-center gap-2 text-xs">
                {pass ? (
                  <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={pass ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                  {rule.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
