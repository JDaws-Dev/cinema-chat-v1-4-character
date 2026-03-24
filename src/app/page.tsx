import Link from "next/link";

const SAMPLE_QUOTES = [
  {
    quote: "Here's looking at you, kid.",
    film: "Casablanca",
    year: "1942",
  },
  {
    quote: "After all, tomorrow is another day.",
    film: "Gone with the Wind",
    year: "1939",
  },
  {
    quote: "Roads? Where we're going, we don't need roads.",
    film: "Back to the Future",
    year: "1985",
  },
  {
    quote: "You're gonna need a bigger boat.",
    film: "Jaws",
    year: "1975",
  },
  {
    quote: "Life is like a box of chocolates.",
    film: "Forrest Gump",
    year: "1994",
  },
];

export default function LandingPage() {
  const quote = SAMPLE_QUOTES[Math.floor(Math.random() * SAMPLE_QUOTES.length)];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Background ambient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950 to-amber-950/20" />

      <div className="relative z-10 max-w-2xl w-full text-center vhs-enter">
        {/* VHS tape logo */}
        <div className="mb-8">
          <div className="w-28 h-20 mx-auto vhs-label rounded-lg relative overflow-hidden">
            <div className="absolute inset-2 bg-gray-950/80 rounded flex items-center justify-center">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-amber-500/50 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500/70" />
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-amber-500/50 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500/70" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-1 inset-x-2 h-3 bg-amber-900/20 rounded-sm" />
          </div>
        </div>

        {/* Store name */}
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 tracking-wider mb-2">
          THE LAST PICTURE SHOW
        </h1>
        <p className="text-amber-600/50 text-xs tracking-[0.4em] uppercase mb-12">
          Video &amp; Film &bull; Est. 1987
        </p>

        {/* Vinny intro */}
        <div className="bg-gray-900/60 border border-amber-500/15 rounded-2xl p-8 mb-8 text-left ambient-glow">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-white text-2xl font-bold border-2 border-amber-400/40 shadow-xl shadow-amber-900/40">
              V
            </div>
            <div>
              <p className="text-amber-400 font-semibold text-lg mb-1">Vinny</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                Hey. I&apos;m the guy behind the counter. Been here since &apos;87 &mdash; I&apos;ve
                seen everything, and I mean <em className="text-amber-300/80">everything</em>. Tell me what
                you&apos;re in the mood for, what you watched last, or just describe a
                feeling &mdash; and I&apos;ll find you something perfect. No algorithms. Just
                taste.
              </p>
            </div>
          </div>
        </div>

        {/* Sample quote */}
        <div className="mb-10">
          <p className="text-gray-500 italic text-sm">
            &ldquo;{quote.quote}&rdquo;
          </p>
          <p className="text-amber-600/40 text-xs mt-1">
            &mdash; {quote.film} ({quote.year})
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-200 shadow-xl shadow-amber-900/30 hover:shadow-amber-800/40 hover:scale-[1.02]"
        >
          Talk to Vinny
          <span className="text-amber-200/60">&rarr;</span>
        </Link>

        <p className="text-gray-600 text-xs mt-6">
          No sign-up needed. Just walk in.
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-gray-700 text-xs">
        Powered by questionable taste and an encyclopedic memory
      </footer>
    </main>
  );
}
