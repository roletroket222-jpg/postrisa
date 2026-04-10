import { Suspense } from "react";

import { LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input disabled placeholder="Memuat form..." type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input disabled placeholder="Memuat form..." type="password" />
      </div>
      <Button className="w-full" disabled>
        <LoaderCircle className="animate-spin" />
        Menyiapkan Login
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Badge>Masuk ke Akun</Badge>
          <div className="space-y-4">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              Sistem kinerja harian pegawai pabrik akuarium.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Login sebagai admin untuk mengelola karyawan, produk, dan pencatatan kinerja.
              Login sebagai karyawan untuk melihat riwayat dan slip gaji pribadi.
            </p>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle>Masuk ke Sistem</CardTitle>
            <CardDescription>
              Gunakan akun yang tersimpan di database untuk masuk sebagai admin atau karyawan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoginFormFallback />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
