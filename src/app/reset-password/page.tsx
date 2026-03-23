"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput, validatePassword } from "@/components/shared/password-input";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const canSubmit = validatePassword(password) && password === confirmPassword;

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Đặt lại mật khẩu thất bại", { description: error.message });
      } else {
        toast.success("Đã đổi mật khẩu thành công!");
        await supabase.auth.signOut();
        router.push("/login");
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
          <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <PasswordInput
              password={password}
              onPasswordChange={setPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
            />
            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
