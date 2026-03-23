"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        toast.error("Gửi email thất bại", { description: error.message });
      } else {
        setSent(true);
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
          <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
          <CardDescription>
            {sent
              ? "Kiểm tra hộp thư của bạn"
              : "Nhập email để nhận link đặt lại mật khẩu"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Email đã được gửi!</p>
                <p className="text-sm text-muted-foreground">
                  Chúng tôi đã gửi link đặt lại mật khẩu đến <span className="font-medium text-foreground">{email}</span>. Kiểm tra hộp thư (và thư rác) của bạn.
                </p>
              </div>
              <Button variant="outline" className="mt-2" onClick={() => setSent(false)}>
                Gửi lại email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi link đặt lại"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-center">
          <Link href="/login" className="text-primary hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
