import { mkdtemp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runProcess } from "@/server/compiler/process-runner";
import { parseLatexLog } from "@/server/compiler/log-parser";
import { createStandaloneFigureSource } from "@/server/compiler/standalone";
import type {
  CompileArtifact,
  CompileArtifactKind,
  LatexCompileRequest,
  LatexCompileResult,
  LatexCompilerEngine,
  ProcessRunner
} from "@/server/compiler/types";

export type LatexSandboxConfig = {
  dockerImage?: string;
  timeoutMs?: number;
  cpuLimit?: string;
  memoryLimit?: string;
  tempRoot?: string;
  runner?: ProcessRunner;
};

type DockerLatexCommandOptions = {
  workspacePath: string;
  dockerImage: string;
  engine: LatexCompilerEngine;
  cpuLimit: string;
  memoryLimit: string;
};

const defaultDockerImage = "ghcr.io/xu-cheng/texlive-full:latest";
const defaultTimeoutMs = 30_000;
const defaultCpuLimit = "1";
const defaultMemoryLimit = "512m";
const sourceFileName = "diagram.tex";
const outputDirectoryName = "out";

export const buildDockerLatexCommand = (options: DockerLatexCommandOptions) => ({
  command: "docker",
  args: [
    "run",
    "--rm",
    "--network",
    "none",
    "--cpus",
    options.cpuLimit,
    "--memory",
    options.memoryLimit,
    "--volume",
    `${options.workspacePath}:/work:rw`,
    "--workdir",
    "/work",
    options.dockerImage,
    "latexmk",
    "-pdf",
    `-${options.engine}`,
    "-interaction=nonstopmode",
    "-halt-on-error",
    "-file-line-error",
    "-no-shell-escape",
    `-outdir=${outputDirectoryName}`,
    sourceFileName
  ]
});

export class LatexCompilerSandbox {
  private readonly dockerImage: string;
  private readonly timeoutMs: number;
  private readonly cpuLimit: string;
  private readonly memoryLimit: string;
  private readonly tempRoot: string;
  private readonly runner: ProcessRunner;

  constructor(config: LatexSandboxConfig = {}) {
    this.dockerImage = config.dockerImage ?? process.env.LATEX_DOCKER_IMAGE ?? defaultDockerImage;
    this.timeoutMs = config.timeoutMs ?? Number(process.env.LATEX_COMPILE_TIMEOUT_MS ?? defaultTimeoutMs);
    this.cpuLimit = config.cpuLimit ?? process.env.LATEX_DOCKER_CPUS ?? defaultCpuLimit;
    this.memoryLimit = config.memoryLimit ?? process.env.LATEX_DOCKER_MEMORY ?? defaultMemoryLimit;
    this.tempRoot = config.tempRoot ?? tmpdir();
    this.runner = config.runner ?? runProcess;
  }

  async compileStandaloneFigure(request: LatexCompileRequest): Promise<LatexCompileResult> {
    const jobId = request.jobId ?? crypto.randomUUID();
    const workspacePath = await mkdtemp(path.join(this.tempRoot, `latex-${jobId}-`));
    const outputPath = path.join(workspacePath, outputDirectoryName);
    const sourcePath = path.join(workspacePath, sourceFileName);
    const timeoutMs = request.timeoutMs ?? this.timeoutMs;
    const engine = request.engine ?? "pdflatex";

    await mkdir(outputPath, { recursive: true });
    const standaloneSource = createStandaloneFigureSource(request.source, { engine });
    await writeFile(sourcePath, standaloneSource, "utf8");

    const docker = buildDockerLatexCommand({
      workspacePath,
      dockerImage: this.dockerImage,
      engine,
      cpuLimit: this.cpuLimit,
      memoryLimit: this.memoryLimit
    });

    const processResult = await this.runner(docker.command, docker.args, {
      cwd: workspacePath,
      timeoutMs
    });

    const compileLog = await readCompileLog(outputPath);
    const artifacts = await collectArtifacts(outputPath);

    return {
      jobId,
      workspacePath,
      sourcePath,
      succeeded: processResult.exitCode === 0 && artifacts.some((artifact) => artifact.kind === "pdf"),
      exitCode: processResult.exitCode,
      timedOut: processResult.timedOut,
      stdout: processResult.stdout,
      stderr: processResult.stderr,
      compileLog,
      parsedErrors: parseLatexLog(compileLog || processResult.stderr, {
        engine,
        source: standaloneSource,
        sourceFilePath: sourceFileName
      }),
      artifacts
    };
  }
}

export const createLatexCompilerSandbox = (config?: LatexSandboxConfig) => new LatexCompilerSandbox(config);

const readCompileLog = async (outputPath: string) => {
  try {
    return await readFile(path.join(outputPath, "diagram.log"), "utf8");
  } catch {
    return "";
  }
};

const collectArtifacts = async (outputPath: string): Promise<CompileArtifact[]> => {
  let files: string[];

  try {
    files = await readdir(outputPath);
  } catch {
    return [];
  }

  const artifacts = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(outputPath, fileName);
      const fileStats = await stat(filePath);

      return {
        name: fileName,
        path: filePath,
        kind: getArtifactKind(fileName),
        sizeBytes: fileStats.size
      };
    })
  );

  return artifacts.sort((left, right) => left.name.localeCompare(right.name));
};

const getArtifactKind = (fileName: string): CompileArtifactKind => {
  if (fileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (fileName.endsWith(".png")) {
    return "png";
  }

  if (fileName.endsWith(".svg")) {
    return "svg";
  }

  if (fileName.endsWith(".log")) {
    return "log";
  }

  return "auxiliary";
};
