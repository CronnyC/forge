import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wgerId = parseInt(id, 10);

  if (isNaN(wgerId)) {
    return new NextResponse("Invalid id", { status: 400 });
  }

  try {
    // Fetch image list for this exercise from wger API
    const apiRes = await fetch(
      `https://wger.de/api/v2/exerciseimage/?exercise_base_id=${wgerId}&format=json`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 }, // cache for 24h
      }
    );

    if (!apiRes.ok) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const data = await apiRes.json() as { results: Array<{ image: string }> };

    if (!data.results || data.results.length === 0) {
      return new NextResponse("No image available", { status: 404 });
    }

    const imageUrl = data.results[0].image;
    const imageRes = await fetch(imageUrl, { next: { revalidate: 86400 } });

    if (!imageRes.ok) {
      return new NextResponse("Failed to fetch image", { status: 502 });
    }

    const contentType = imageRes.headers.get("content-type") ?? "image/png";
    const imageBuffer = await imageRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}
