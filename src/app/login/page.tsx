// src/app/login/page.tsx
"use client";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-blue-100 dark:from-[#181925] dark:to-[#1e2746]">
      <LoginForm />
    </div>
  );
}
