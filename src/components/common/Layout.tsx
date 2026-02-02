import type { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold tracking-tight">
            Mood Diary
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
        {children}
      </main>

      <Navigation />
    </div>
  );
}
