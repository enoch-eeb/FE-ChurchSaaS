"use client";

interface ConcentricRippleLoaderProps {
  message?: string;
  isVisible?: boolean;
}

export default function ConcentricRippleLoader({
  message = "Loading...",
  isVisible = true,
}: ConcentricRippleLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center justify-center rounded-2xl bg-bg-alt border border-border/50 p-8 px-12 shadow-2xl">
        
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute h-full w-full animate-pulse rounded-full bg-primary/10"></div>
          <div className="absolute h-[80%] w-[80%] animate-pulse rounded-full bg-primary/20 delay-75"></div>
          <div className="absolute h-[60%] w-[60%] animate-pulse rounded-full bg-primary/30 delay-150"></div>
          <div className="absolute h-[40%] w-[40%] animate-pulse rounded-full bg-primary/40 delay-225"></div>
          <div className="h-4 w-4 rounded-full bg-primary"></div>
        </div>
        
        <p className="mt-6 text-xs font-semibold tracking-widest text-primary uppercase animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}