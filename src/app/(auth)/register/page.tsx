"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput, validatePassword } from "@/components/shared/password-input";
import { Wallet, Mail, User } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const canSubmit = validatePassword(password) && password === confirmPassword;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePassword(password)) {
      toast.error("Mật khẩu không đủ mạnh");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu không khớp");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error("Đăng ký thất bại", { description: error.message });
    } else {
      toast.success("Đăng ký thành công!", {
        description: "Kiểm tra email để xác nhận tài khoản.",
      });
      router.push("/login");
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
          <CardTitle className="text-2xl font-bold">Đăng ký</CardTitle>
          <CardDescription>Tạo tài khoản quản lý chi tiêu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Nguyễn Văn A"
                  className="pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <PasswordInput
              password={password}
              onPasswordChange={setPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
            />
            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-center">
          <Link href="/login" className="text-primary hover:underline">
            Đã có tài khoản? Đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
