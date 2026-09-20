import { NextRequest } from "next/server";
import { fetchUserAnalysis } from "@/lib/github";
import { classifyGithubError } from "@/lib/api-error";
import { resolveToken } from "@/lib/request-token";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const extensionsParam = searchParams.get("extensions");

  if (!username) {
    return new Response(
      JSON.stringify({ code: "bad_request", error: "username parameter is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { token } = await resolveToken(request);

  let customExtensions: { ext: string; lang: string; color: string }[] | undefined;
  if (extensionsParam) {
    try {
      customExtensions = JSON.parse(extensionsParam);
    } catch {
      // malformed mapping: fall back to the default language detection
    }
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
          token,
          (current, total, repoName) => send("progress", { current, total, repoName }),
          customExtensions
        );
        send("complete", analysis);
      } catch (error: unknown) {
        const { code } = classifyGithubError(error);
        send("error", {
          code,
          error: error instanceof Error ? error.message : "unknown",
        });
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
