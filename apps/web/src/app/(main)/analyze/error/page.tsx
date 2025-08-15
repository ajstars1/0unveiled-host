"use client";

import { useSearchParams } from "next/navigation";

export default function AnalyzeErrorPage() {
  const sp = useSearchParams();
  const msg = sp.get("msg") ? decodeURIComponent(sp.get("msg") as string) : "Something went wrong";
  return (
    <div className="max-w-xl mx-auto p-12 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Cannot start analysis</h1>
      <p className="text-muted-foreground">{msg}</p>
    </div>
  );
}
