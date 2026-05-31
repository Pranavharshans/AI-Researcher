import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseLatexLog } from "@/server/compiler";
import { runProcess } from "@/server/compiler/process-runner";
import type { ParsedLatexError } from "@/server/compiler";
import type { ProjectFile } from "@/types/project";

export const runtime = "nodejs";

type LatexCompileBody = {
  files?: ProjectFile[];
  mainPath?: string;
};

const defaultDockerImage = "texlive/texlive:latest";
const defaultTimeoutMs = 45_000;
const outputDirectoryName = "out";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LatexCompileBody | null;
  const files = body?.files ?? [];
  const mainPath = body?.mainPath ?? "main.tex";

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "No project files were provided." }, { status: 400 });
  }

  if (!files.some((file) => file.path === mainPath)) {
    return NextResponse.json({ error: `${mainPath} was not found in the project files.` }, { status: 400 });
  }

  const workspacePath = await mkdtemp(path.join(tmpdir(), "latex-project-"));
  const outputPath = path.join(workspacePath, outputDirectoryName);

  await mkdir(outputPath, { recursive: true });
  await Promise.all(files.map((file) => writeProjectFile(workspacePath, file)));

  const result = await compileWithDocker(workspacePath, mainPath);
  const pdfPath = path.join(outputPath, mainPath.replace(/\.tex$/i, ".pdf"));
  const logPath = path.join(outputPath, mainPath.replace(/\.tex$/i, ".log"));
  const compileLog = await readTextFile(logPath);
  const pdf = await readBinaryFile(pdfPath);
  const succeeded = result.exitCode === 0 && Boolean(pdf);
  const compilerOutput = compileLog || result.stderr;
  const errors = parseLatexLog(compilerOutput, {
    engine: "pdflatex",
    source: files.find((file) => file.path === mainPath)?.content ?? "",
    sourceFilePath: mainPath
  });

  return NextResponse.json({
    compileLog: compilerOutput,
    errorSummary: createLatexErrorSummary(errors, compilerOutput),
    errors,
    exitCode: result.exitCode,
    pdfDataUrl: pdf ? `data:application/pdf;base64,${pdf.toString("base64")}` : null,
    stderr: result.stderr,
    stdout: result.stdout,
    succeeded,
    timedOut: result.timedOut
  });
}

const compileWithDocker = (workspacePath: string, mainPath: string) =>
  runProcess(
    "docker",
    [
      "run",
      "--rm",
      ...getDockerPlatformArgs(),
      "--network",
      "none",
      "--cpus",
      process.env.LATEX_DOCKER_CPUS ?? "1",
      "--memory",
      process.env.LATEX_DOCKER_MEMORY ?? "768m",
      "--volume",
      `${workspacePath}:/work:rw`,
      "--workdir",
      "/work",
      process.env.LATEX_DOCKER_IMAGE ?? defaultDockerImage,
      "latexmk",
      "-pdf",
      "-pdflatex",
      "-interaction=nonstopmode",
      "-halt-on-error",
      "-file-line-error",
      "-no-shell-escape",
      `-outdir=${outputDirectoryName}`,
      mainPath
    ],
    {
      cwd: workspacePath,
      timeoutMs: Number(process.env.LATEX_COMPILE_TIMEOUT_MS ?? defaultTimeoutMs)
    }
  );

const getDockerPlatformArgs = () => (process.env.LATEX_DOCKER_PLATFORM ? ["--platform", process.env.LATEX_DOCKER_PLATFORM] : []);

const createLatexErrorSummary = (errors: ParsedLatexError[], compilerOutput: string) => {
  const firstError = errors[0];

  if (!firstError) {
    return extractFirstBangError(compilerOutput) ?? compilerOutput.slice(-1400);
  }

  const location = [firstError.file, firstError.line ? `line ${firstError.line}` : ""].filter(Boolean).join(", ");
  const context = firstError.sourceContext
    ? [
        ...firstError.sourceContext.before.map((line) => `  ${line}`),
        `> ${firstError.sourceContext.line}`,
        ...firstError.sourceContext.after.map((line) => `  ${line}`)
      ].join("\n")
    : "";
  const hints = firstError.hints.length ? `\n\nHints:\n${firstError.hints.map((hint) => `- ${hint}`).join("\n")}` : "";

  return [`${location || "LaTeX error"}\n${firstError.rawMessage}`, context ? `\nSource context:\n${context}` : "", hints]
    .filter(Boolean)
    .join("\n");
};

const extractFirstBangError = (compilerOutput: string) => {
  const lines = compilerOutput.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith("!"));

  if (index === -1) {
    return null;
  }

  return lines.slice(index, Math.min(lines.length, index + 12)).join("\n");
};

const writeProjectFile = async (workspacePath: string, file: ProjectFile) => {
  const safePath = getSafeProjectPath(workspacePath, file.path);

  await mkdir(path.dirname(safePath), { recursive: true });
  await writeFile(safePath, file.content, "utf8");
};

const getSafeProjectPath = (workspacePath: string, filePath: string) => {
  const normalizedPath = path.normalize(filePath);

  if (path.isAbsolute(normalizedPath) || normalizedPath.startsWith("..")) {
    throw new Error(`Unsafe project file path: ${filePath}`);
  }

  const absolutePath = path.join(workspacePath, normalizedPath);
  const relativePath = path.relative(workspacePath, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe project file path: ${filePath}`);
  }

  return absolutePath;
};

const readTextFile = async (filePath: string) => {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
};

const readBinaryFile = async (filePath: string) => {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
};
