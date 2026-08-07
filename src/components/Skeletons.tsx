import type { ReactNode } from "react";

export function Sk({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function SkText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} className={`h-3 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkCard({ className = "", children }: { className?: string; children?: ReactNode }) {
  return <div className={`glass rounded-3xl p-5 ${className}`}>{children ?? <SkText />}</div>;
}

export function SkList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
          <Sk className="size-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Sk className="h-3 w-2/3" />
            <Sk className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full home-page skeleton matching the real bento grid. */
export function HomeSkeleton() {
  return (
    <div className="animate-fade">
      <div className="mb-5 space-y-2">
        <Sk className="h-3 w-28" />
        <Sk className="h-8 w-52" />
        <Sk className="h-3 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Sk className="h-24 rounded-2xl" />
        <Sk className="h-24 rounded-2xl" />
      </div>
      <div className="grid grid-cols-6 gap-3 auto-rows-[110px]">
        <Sk className="col-span-6 row-span-2 rounded-3xl h-full" />
        <Sk className="col-span-4 row-span-2 rounded-3xl h-full" />
        <Sk className="col-span-2 row-span-2 rounded-3xl h-full" />
        <Sk className="col-span-3 rounded-2xl h-full" />
        <Sk className="col-span-3 rounded-2xl h-full" />
        <Sk className="col-span-3 rounded-2xl h-full" />
        <Sk className="col-span-3 rounded-2xl h-full" />
        <Sk className="col-span-6 row-span-2 rounded-3xl h-full" />
      </div>
    </div>
  );
}
