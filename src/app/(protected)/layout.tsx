"use client";

import React from "react";

import { Header } from "@/components/navigation";

export default function DahboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <section className="container mx-auto max-w-7xl space-y-8 px-4 py-12">{children}</section>
    </div>
  );
}
