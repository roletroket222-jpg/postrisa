import Link from "next/link";

import {
  ArrowRight,
  ClipboardList,
  FileSpreadsheet,
  Layers3,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Pencatatan Harian",
    description: "Satu record per karyawan per hari dengan banyak item produk. Tidak ada duplikasi tanggal.",
    icon: ClipboardList,
  },
  {
    title: "Upah Otomatis",
    description: "Total upah dihitung otomatis dari master produk. Snapshot tersimpan aman saat record dibuat.",
    icon: WalletCards,
  },
  {
    title: "Laporan & Export",
    description: "Rekap per periode, divisi, dan karyawan. Export Excel dan slip gaji PDF siap pakai.",
    icon: FileSpreadsheet,
  },
  {
    title: "Keamanan Role",
    description: "Admin dan karyawan dipisahkan penuh. Middleware, JWT, dan guard server-side aktif.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-16 pt-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
                Aquarium Performance
              </p>
              <p className="text-sm text-muted-foreground">
                Sistem kinerja &amp; penggajian pegawai
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid flex-1 gap-8 py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div className="space-y-8">
            <Badge className="animate-in fade-in slide-in-from-top-4 duration-500">
              Sistem Aktif
            </Badge>

            <div className="max-w-3xl space-y-5">
              <h1 className="animate-in fade-in slide-in-from-bottom-5 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Pencatatan kinerja harian pegawai pabrik akuarium.
              </h1>
              <p className="animate-in fade-in slide-in-from-bottom-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Admin mencatat produksi harian, mengelola master data karyawan dan produk,
                serta mengekspor laporan upah bulanan. Karyawan dapat melihat riwayat kerja
                dan slip gaji pribadi.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="min-w-44 justify-between">
                <Link href="/login">
                  Masuk ke Sistem
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="animate-in fade-in zoom-in-95 duration-700">
            <CardHeader>
              <CardTitle>Fitur Utama</CardTitle>
              <CardDescription>
                Semua yang dibutuhkan untuk pencatatan kinerja harian.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-border/80 bg-background/70 p-4"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
