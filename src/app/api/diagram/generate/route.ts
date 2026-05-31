import { NextResponse } from "next/server";
import { createModelClient } from "@/server/model";
import { ModelProviderError } from "@/server/model";

type DiagramGenerateRequest = {
  outputTarget?: string;
  prompt?: string;
  stylePreset?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DiagramGenerateRequest | null;
  const prompt = body?.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Diagram prompt is required." }, { status: 400 });
  }

  try {
    const response = await createModelClient().complete({
      task: "generate_diagram_source",
      messages: [
        {
          role: "user",
          content: [
            "Generate standalone TikZ source for this diagram request.",
            "Return ONLY raw LaTeX/TikZ code.",
            "Do not include markdown fences, JSON, explanations, comments, captions, summaries, or any text outside the code.",
            "The response must start with \\begin{tikzpicture} and end with \\end{tikzpicture}.",
            "Use valid TikZ option keys only; do not use shorthand keys like italic, bold, small, or large.",
            "For text styling, use font=\\itshape, font=\\bfseries, font=\\small, or font=\\large.",
            `Prompt: ${prompt}`,
            `Style preset: ${body?.stylePreset ?? "technical"}.`,
            `Output target: ${body?.outputTarget ?? "cursor"}.`
          ].join("\n")
        }
      ],
      temperature: 0.2,
      maxTokens: 1800,
      metadata: {
        outputTarget: body?.outputTarget ?? "cursor",
        stylePreset: body?.stylePreset ?? "technical"
      }
    });
    const tex = parseGeneratedDiagramSource(response.content);

    return NextResponse.json({
      tex,
      summary: `Generated TikZ diagram for: ${prompt}`,
      requiredPackages: ["tikz"],
      requiredTikzLibraries: [],
      model: response.model,
      provider: response.provider
    });
  } catch (error) {
    if (error instanceof ModelProviderError) {
      return NextResponse.json(
        {
          code: error.code,
          detail: error.detail,
          error: error.message
        },
        { status: error.status ?? 503 }
      );
    }

    return NextResponse.json({ error: "Diagram generation failed." }, { status: 500 });
  }
}

const parseGeneratedDiagramSource = (content: string) => {
  const trimmed = stripMarkdownFence(content.trim());
  const start = trimmed.indexOf("\\begin{tikzpicture}");
  const end = trimmed.lastIndexOf("\\end{tikzpicture}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not include raw TikZ source.");
  }

  return trimmed.slice(start, end + "\\end{tikzpicture}".length).trim();
};

const stripMarkdownFence = (content: string) =>
  content
    .replace(/^```(?:latex|tex|tikz)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
