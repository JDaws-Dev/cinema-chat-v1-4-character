# Cinema Chat v1.4 — The Last Picture Show

## Quick Start

### 1. Add your Anthropic API key
```bash
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### 2. Run the dev server
```bash
npm run dev
```

### 3. Open in browser
Visit http://localhost:3000

## Architecture

### How It Works
- **Landing page** (`/`) — Introduces Vinny, the video store clerk character
- **Chat page** (`/chat`) — Full streaming conversation with Vinny via Claude API
- **API route** (`/api/chat`) — Streams Claude responses as SSE
- **Character prompt** (`src/lib/vinny-prompt.ts`) — Vinny's entire personality and taste

### Storage (Current: localStorage)
Messages and preferences persist in the browser via localStorage. This works for single-device use.

### Storage (Future: Convex)
The `convex/` directory has a full schema and functions ready to deploy:
```bash
npx convex dev
```
This will:
1. Create a Convex deployment
2. Generate types in `convex/_generated/`
3. Push schema and functions

Then update `ChatInterface.tsx` to use Convex hooks instead of localStorage.

## Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

## Key Files
- `src/lib/vinny-prompt.ts` — Vinny's character (THE core of the app)
- `src/app/api/chat/route.ts` — Claude streaming endpoint
- `src/components/ChatInterface.tsx` — Chat UI with streaming
- `src/components/ChatMessage.tsx` — Message rendering with film title detection
- `src/lib/storage.ts` — localStorage persistence
- `src/app/page.tsx` — Landing page
- `src/app/globals.css` — VHS aesthetic styles

## Film Title Links
When Vinny mentions a film wrapped in **double asterisks**, the UI makes it clickable and links to TMDB search for that film.
