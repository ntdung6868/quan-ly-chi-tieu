"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput, validatePassword } from "@/components/shared/password-input";
import { User, Lock, Palette, LogOut, Save, CalendarDays, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [monthStartDay, setMonthStartDay] = useState(profile?.month_start_day ?? 1);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMonth, setSavingMonth] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Sync state khi profile load xong
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setMonthStartDay(profile.month_start_day ?? 1);
    }
  }, [profile]);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  async function handleUpdateProfile() {
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", profile?.id);

      if (error) toast.error("Cập nhật thất bại", { description: error.message });
      else toast.success("Đã cập nhật thông tin");
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setSavingProfile(false);
  }

  async function handleUpdateMonthStart() {
    setSavingMonth(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ month_start_day: monthStartDay })
        .eq("id", profile?.id);

      if (error) toast.error("Cập nhật thất bại", { description: error.message });
      else toast.success("Đã cập nhật ngày bắt đầu tháng");
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setSavingMonth(false);
  }

  const canChangePassword = validatePassword(newPassword) && newPassword === confirmNewPassword;

  async function handleChangePassword() {
    if (!validatePassword(newPassword)) {
      toast.error("Mật khẩu không đủ mạnh");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu không khớp");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) toast.error("Đổi mật khẩu thất bại", { description: error.message });
      else {
        toast.success("Đã đổi mật khẩu");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setChangingPassword(false);
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_own_account");
      if (error) {
        toast.error("Xoá tài khoản thất bại", { description: error.message });
      } else {
        toast.success("Tài khoản đã được xoá");
        window.location.href = "/login";
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setDeletingAccount(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.full_name ?? "Người dùng"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={savingProfile}>
                <Save className="h-4 w-4 mr-2" />
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Đổi mật khẩu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PasswordInput
                password={newPassword}
                onPasswordChange={setNewPassword}
                confirmPassword={confirmNewPassword}
                onConfirmPasswordChange={setConfirmNewPassword}
              />
              <Button onClick={handleChangePassword} disabled={changingPassword || !canChangePassword}>
                {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Month Start Day */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Ngày bắt đầu tháng
              </CardTitle>
              <CardDescription>
                Ngày bắt đầu chu kỳ tháng (VD: ngày nhận lương)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={String(monthStartDay)}
                onValueChange={(v) => v && setMonthStartDay(Number(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue>
                    {monthStartDay === 1 ? "Ngày 1 (mặc định)" : `Ngày ${monthStartDay}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d === 1 ? "Ngày 1 (mặc định)" : `Ngày ${d}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleUpdateMonthStart} disabled={savingMonth}>
                <Save className="h-4 w-4 mr-2" />
                {savingMonth ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Giao diện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Chế độ tối</p>
                  <p className="text-sm text-muted-foreground">Bật giao diện tối cho ứng dụng</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Đăng xuất</p>
                  <p className="text-sm text-muted-foreground">Thoát khỏi tài khoản hiện tại</p>
                </div>
                <Button variant="destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Xoá tài khoản</p>
                  <p className="text-sm text-muted-foreground">Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu</p>
                </div>
                <Button variant="destructive" onClick={() => setShowDeleteAccount(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xoá
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteAccount} onOpenChange={(open) => {
        if (!open) { setShowDeleteAccount(false); setDeleteConfirmText(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá tài khoản vĩnh viễn</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn (ví, giao dịch, danh mục, ngân sách) sẽ bị xoá vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              Nhập <span className="font-semibold text-destructive">xoa tai khoan</span> hoặc <span className="font-semibold text-destructive">xóa tài khoản</span> để xác nhận:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="xoa tai khoan"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteAccount(false); setDeleteConfirmText(""); }}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              disabled={!["xoa tai khoan", "xóa tài khoản"].includes(deleteConfirmText.trim().toLowerCase()) || deletingAccount}
              onClick={handleDeleteAccount}
            >
              {deletingAccount ? "Đang xoá..." : "Xoá tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
