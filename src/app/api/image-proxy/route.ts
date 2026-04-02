export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url || !url.startsWith("https://image.tmdb.org/")) {
    return new Response("Invalid URL", { status: 400 });
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return new Response(`Image fetch failed: ${res.status}`, { status: 502 });
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return new Response(`Proxy error: ${err}`, { status: 500 });
  }
}
