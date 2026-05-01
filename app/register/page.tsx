"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Warning } from "@phosphor-icons/react";
import { registerUser, RegisterInputSchema } from "@/lib/auth";
import { useAuth } from "@/lib/use-auth";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const [form, setForm] = React.useState({
    email: "",
    displayName: "",
    studentId: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isReady && user) router.replace("/profile");
  }, [isReady, user, router]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const parsed = RegisterInputSchema.safeParse({
      email: form.email,
      displayName: form.displayName,
      studentId: form.studentId,
      password: form.password,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as string] = issue.message;
      }
      setErrors(next);
      return;
    }
    setIsSubmitting(true);
    try {
      await registerUser(parsed.data);
      router.replace("/profile");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "注册失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-nnu-paper pt-24 pb-12 px-4 flex items-center justify-center">
      <Card className="w-full max-w-md liquid-glass border-t-4 border-nnu-green rounded-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-nnu-green/10 flex items-center justify-center mb-3">
              <GraduationCap className="w-7 h-7 text-nnu-green" />
            </div>
            <h1 className="text-2xl font-bold text-nnu-green">注册账号</h1>
            <p className="text-sm text-gray-500 mt-1">
              注册后可以使用云端档案与个人成长追踪
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="mt-1"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-red-600 mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="displayName">昵称</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={handleChange("displayName")}
                aria-invalid={!!errors.displayName}
                className="mt-1"
              />
              {errors.displayName && (
                <p role="alert" className="text-sm text-red-600 mt-1">
                  {errors.displayName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="studentId">南师学号（选填）</Label>
              <Input
                id="studentId"
                inputMode="numeric"
                placeholder="例如 22210001"
                value={form.studentId}
                onChange={handleChange("studentId")}
                aria-invalid={!!errors.studentId}
                className="mt-1"
              />
              {errors.studentId && (
                <p role="alert" className="text-sm text-red-600 mt-1">
                  {errors.studentId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange("password")}
                aria-invalid={!!errors.password}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">至少 8 位，含字母与数字</p>
              {errors.password && (
                <p role="alert" className="text-sm text-red-600 mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {submitError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                <Warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="nnuGreen"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "注册中..." : "立即注册"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            已有账号？
            <Link href="/login" className="text-nnu-green hover:underline ml-1">
              直接登录
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            ⚠️ Demo 版本：账号仅保存在你的浏览器，不会上传到任何服务器
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
