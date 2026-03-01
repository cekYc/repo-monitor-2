import { NextRequest } from "next/server";
import { fetchUserAnalysis } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const token = searchParams.get("token");

  if (!username) {
    return new Response(
      JSON.stringify({ error: "username parametresi gerekli" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const analysis = await fetchUserAnalysis(
          username,
          token || undefined,
          (current, total, repoName) => {
            send("progress", { current, total, repoName });
          }
        );

        send("complete", analysis);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";

        if (message.includes("Not Found")) {
          send("error", { error: `"${username}" kullanıcısı bulunamadı` });
        } else if (message.includes("Bad credentials")) {
          send("error", { error: "Geçersiz GitHub API token" });
        } else if (message.includes("rate limit")) {
          send("error", {
            error: "API istek limiti aşıldı. Token kullanarak limiti artırabilirsiniz.",
          });
        } else {
          send("error", { error: message });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
