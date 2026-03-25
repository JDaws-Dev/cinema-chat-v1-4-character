"use client";

import Link from "next/link";
import { clearHistory } from "@/lib/storage";
import { useRouter } from "next/navigation";

export function VHSHeader() {
  const router = useRouter();

  return (
    <header className="border-b border-amber-500/20 bg-gray-950/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {/* VHS tape icon */}
          <div className="w-10 h-7 bg-gray-800 border border-amber-500/40 rounded-sm relative overflow-hidden group-hover:border-amber-400/60 transition-colors">
            <div className="absolute inset-x-1 top-1 bottom-1 bg-gray-900 rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border border-amber-500/60 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-amber-500/80" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-amber-400 font-bold text-lg tracking-wide leading-none">
              THE LAST PICTURE SHOW
            </h1>
            <p className="text-amber-600/60 text-[10px] tracking-[0.3em] uppercase">
              Video &amp; Film &bull; Est. 1987
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              clearHistory();
              router.refresh();
              window.location.reload();
            }}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            title="Start a new conversation"
          >
            New Chat
          </button>
          <Link
            href="/chat"
            className="text-amber-500/70 hover:text-amber-400 text-sm transition-colors"
          >
            Talk to Vinny
          </Link>
          <Link
            href="/chat"
            className="text-gray-500 hover:text-amber-400 text-xs transition-colors"
          >
            Watchlist
          </Link>
        </div>
      </div>
    </header>
  );
}
