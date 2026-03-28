export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url || !url.startsWith("https://image.tmdb.org/")) {
    return new Response("Invalid URL", { status: 400 });
  }
  const res = await fetch(url);
  if (!res.ok) return new Response("Image fetch failed", { status: res.status });
  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
